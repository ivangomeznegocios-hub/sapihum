// ============================================
// PAYMENT SYSTEM REGISTRY & FULFILLMENT
// ============================================

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
import type { AnalyticsConsentSnapshot, AttributionSnapshot } from '@/lib/analytics/types'
import { getAppUrl } from '@/lib/config/app-url'
import { getActiveEntitlementForEvent } from '@/lib/events/access'
import { grantEventEntitlements, revokeEventEntitlementsBySourceReference } from '@/lib/events/entitlements'
import { upsertAutomaticEventSpeakerEarnings } from '@/lib/earnings/compensation'
import { logCommerceOperationalEvent, sendEventPurchaseConfirmation, sendFormationPurchaseConfirmation } from '@/lib/payments/commerce'
import { syncMembershipEntitlementsForUser } from '@/lib/membership-entitlements'
import { createUserNotification } from '@/lib/notifications'
import { getPlanByPriceId } from './config'
import {
    retrieveCompletedCheckoutPayment,
    retrieveCompletedCheckoutSubscription,
    stripeAdapter,
} from './stripe'
import type {
    PaymentProvider,
    PaymentProviderAdapter,
    RefundWebhookData,
    CheckoutSessionWebhookData,
    PaymentWebhookData,
    SubscriptionWebhookData,
} from './types'

const providers: Record<string, PaymentProviderAdapter> = {
    stripe: stripeAdapter,
}

export function getPaymentProvider(provider: PaymentProvider): PaymentProviderAdapter {
    const adapter = providers[provider]
    if (!adapter) {
        throw new Error(`Payment provider "${provider}" is not configured. Available: ${Object.keys(providers).join(', ')}`)
    }
    return adapter
}

export function getAvailableProviders(): PaymentProvider[] {
    return Object.keys(providers) as PaymentProvider[]
}

function getServiceSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        throw new Error('Supabase service role credentials not configured')
    }
    return createServiceClient(url, key)
}

function emptySnapshot(): AttributionSnapshot {
    return {
        firstTouch: null,
        lastTouch: null,
        lastNonDirectTouch: null,
        resolvedAt: new Date().toISOString(),
    }
}

function parseAttributionSnapshot(value: unknown): AttributionSnapshot {
    if (typeof value !== 'string' || value.length === 0) return emptySnapshot()

    try {
        return JSON.parse(value) as AttributionSnapshot
    } catch {
        return emptySnapshot()
    }
}

function getPrimaryTouch(snapshot: AttributionSnapshot) {
    return snapshot.lastNonDirectTouch ?? snapshot.lastTouch ?? snapshot.firstTouch
}

function parseTrackingConsentFromMetadata(metadata: Record<string, unknown> | null | undefined): AnalyticsConsentSnapshot | null {
    if (!metadata || typeof metadata !== 'object') {
        return null
    }

    const analytics = metadata.consent_analytics === 'true'
    const marketing = metadata.consent_marketing === 'true'

    if (!analytics && !marketing) {
        return null
    }

    return {
        necessary: true,
        analytics,
        marketing,
        source: typeof metadata.consent_source === 'string' && metadata.consent_source.length > 0
            ? metadata.consent_source
            : undefined,
        version: typeof metadata.consent_version === 'string' && metadata.consent_version.length > 0
            ? metadata.consent_version
            : undefined,
    }
}

function normalizeWebhookValue(value: string | null | undefined) {
    const normalized = value?.trim()
    return normalized ? normalized : null
}

function normalizeEmailValue(value: string | null | undefined) {
    return normalizeWebhookValue(value)?.toLowerCase() ?? null
}

function isDuplicateUserError(error: { message?: string } | null | undefined) {
    const message = error?.message?.toLowerCase() ?? ''
    return message.includes('already') || message.includes('exists') || message.includes('registered')
}

async function findAuthUserByEmail(supabase: ReturnType<typeof getServiceSupabase>, email: string) {
    const normalizedEmail = email.trim().toLowerCase()

    for (let page = 1; page <= 10; page += 1) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
        if (error) {
            throw error
        }

        const users = data?.users ?? []
        const match = users.find((entry) => entry.email?.trim().toLowerCase() === normalizedEmail)
        if (match) {
            return match
        }

        if (users.length < 200) {
            break
        }
    }

    return null
}

async function sendGuestSubscriptionAccessLink(email: string, nextPath: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
        throw new Error('Supabase anon credentials are not configured')
    }

    const client = createServiceClient(url, anonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    const safeNextPath = nextPath.startsWith('/') ? nextPath : '/dashboard/subscription'
    const { error } = await client.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(safeNextPath)}`,
        },
    })

    if (error) {
        throw error
    }
}

async function resolveSubscriptionIdentity(params: {
    supabase: ReturnType<typeof getServiceSupabase>
    providerCustomerId?: string
    customerEmail?: string
    membershipLevel: number
    specializationCode?: string | null
    fullName?: string | null
}) {
    const normalizedEmail = normalizeEmailValue(params.customerEmail)
    let profileId: string | null = null
    let userId: string | null = null
    let createdNewUser = false

    if (params.providerCustomerId) {
        const { data: profile } = await params.supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', params.providerCustomerId)
            .maybeSingle()

        if (profile?.id) {
            profileId = profile.id
            userId = profile.id
        }
    }

    if (!profileId && normalizedEmail) {
        const existingUser = await findAuthUserByEmail(params.supabase, normalizedEmail)
        if (existingUser) {
            userId = existingUser.id
            profileId = existingUser.id
        }
    }

    if (!profileId && normalizedEmail) {
        const generatedPassword = `Sapihum_${crypto.randomUUID()}!`
        const { data: createdUserResponse, error: createError } = await params.supabase.auth.admin.createUser({
            email: normalizedEmail,
            password: generatedPassword,
            email_confirm: true,
            user_metadata: {
                full_name: params.fullName || undefined,
                name: params.fullName || undefined,
                source: 'guest_subscription_checkout',
                purchased_membership_level: params.membershipLevel,
                purchased_specialization_code: params.specializationCode || undefined,
            },
        })

        if (createError && !isDuplicateUserError(createError)) {
            throw createError
        }

        const resolvedUser = createdUserResponse?.user || await findAuthUserByEmail(params.supabase, normalizedEmail)
        if (resolvedUser) {
            userId = resolvedUser.id
            profileId = resolvedUser.id
            createdNewUser = Boolean(createdUserResponse?.user)
        }
    }

    if (!profileId || !userId) {
        return {
            profileId: null,
            userId: null,
            createdNewUser: false,
            normalizedEmail,
        }
    }

    const profileUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
    }

    if (params.providerCustomerId) {
        profileUpdate.stripe_customer_id = params.providerCustomerId
    }

    if (params.fullName) {
        profileUpdate.full_name = params.fullName
    }

    if (createdNewUser && params.membershipLevel > 0) {
        profileUpdate.role = 'psychologist'
    }

    await params.supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', profileId)

    return {
        profileId,
        userId,
        createdNewUser,
        normalizedEmail,
    }
}

async function upsertPremiumCommission(params: {
    supabase: any
    eventId: string
    studentId: string | null
    transactionId: string | null
    grossAmount: number
}) {
    if (!params.studentId || params.grossAmount <= 0) {
        return
    }

    const today = new Date()
    const attendanceDate = today.toISOString().split('T')[0]
    const releaseDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

    await upsertAutomaticEventSpeakerEarnings({
        supabase: params.supabase,
        eventId: params.eventId,
        studentId: params.studentId,
        grossAmount: params.grossAmount,
        earningType: 'premium_commission',
        attendanceDate,
        releaseDate,
        monthKey: today.toISOString().slice(0, 7),
        sourceTransactionId: params.transactionId,
    })
}

async function hasRemainingEventEntitlement(params: {
    supabase: any
    eventId: string
    eventType: string | null | undefined
    userId?: string | null
    email?: string | null
}) {
    if (!params.userId && !params.email) {
        return false
    }

    const entitlement = await getActiveEntitlementForEvent({
        supabase: params.supabase,
        eventId: params.eventId,
        userId: params.userId ?? null,
        email: params.email ?? null,
        eventType: (params.eventType as any) ?? null,
    })

    return Boolean(entitlement)
}

async function cancelEventRegistrationsIfAccessRemoved(params: {
    supabase: any
    eventId: string
    eventType: string | null | undefined
    userId?: string | null
    email?: string | null
    reason: string
    details?: Record<string, unknown>
}) {
    if (!params.userId) {
        return 0
    }

    const hasRemainingAccess = await hasRemainingEventEntitlement(params)
    if (hasRemainingAccess) {
        return 0
    }

    const { data: registrations, error } = await (params.supabase
        .from('event_registrations') as any)
        .select('id, registration_data')
        .eq('event_id', params.eventId)
        .eq('user_id', params.userId)
        .eq('status', 'registered')

    if (error) {
        throw error
    }

    for (const registration of registrations ?? []) {
        const { error: updateError } = await (params.supabase
            .from('event_registrations') as any)
            .update({
                status: 'cancelled',
                registration_data: {
                    ...(registration.registration_data ?? {}),
                    cancelled_reason: params.reason,
                    cancelled_at: new Date().toISOString(),
                    ...(params.details ?? {}),
                },
            })
            .eq('id', registration.id)

        if (updateError) {
            throw updateError
        }
    }

    return (registrations ?? []).length
}

async function cancelFormationRegistrationsIfAccessRemoved(params: {
    supabase: any
    formationId: string
    userId?: string | null
    email?: string | null
    linkedEvents: Array<{ id: string; event_type?: string | null }>
    reason: string
    details?: Record<string, unknown>
}) {
    if (!params.userId || params.linkedEvents.length === 0) {
        return 0
    }

    let cancelledCount = 0

    for (const linkedEvent of params.linkedEvents) {
        const hasRemainingAccess = await hasRemainingEventEntitlement({
            supabase: params.supabase,
            eventId: linkedEvent.id,
            eventType: linkedEvent.event_type ?? null,
            userId: params.userId,
            email: params.email ?? null,
        })

        if (hasRemainingAccess) {
            continue
        }

        const { data: registrations, error } = await (params.supabase
            .from('event_registrations') as any)
            .select('id, registration_data')
            .eq('event_id', linkedEvent.id)
            .eq('user_id', params.userId)
            .eq('status', 'registered')

        if (error) {
            throw error
        }

        for (const registration of registrations ?? []) {
            const registrationFormationId = registration.registration_data?.formation_id
            const registrationSource = registration.registration_data?.source
            if (
                registrationFormationId !== params.formationId
                && registrationSource !== 'formation_purchase'
                && registrationSource !== 'formation_free_access'
            ) {
                continue
            }

            const { error: updateError } = await (params.supabase
                .from('event_registrations') as any)
                .update({
                    status: 'cancelled',
                    registration_data: {
                        ...(registration.registration_data ?? {}),
                        cancelled_reason: params.reason,
                        cancelled_at: new Date().toISOString(),
                        ...(params.details ?? {}),
                    },
                })
                .eq('id', registration.id)

            if (updateError) {
                throw updateError
            }

            cancelledCount += 1
        }
    }

    return cancelledCount
}

async function voidSpeakerEarningsForTransaction(params: {
    supabase: any
    transactionId: string | null
    reason: string
}) {
    if (!params.transactionId) {
        return 0
    }

    const { data, error } = await (params.supabase
        .from('speaker_earnings') as any)
        .update({
            status: 'voided',
            voided_at: new Date().toISOString(),
            void_reason: params.reason,
            updated_at: new Date().toISOString(),
        })
        .eq('source_transaction_id', params.transactionId)
        .neq('status', 'voided')
        .select('id')

    if (error) {
        throw error
    }

    return (data ?? []).length
}

async function cancelPendingEventPurchaseRecord(params: {
    supabase: any
    purchaseId?: string | null
    sessionId?: string | null
    reason: string
    details?: Record<string, unknown>
}) {
    if (!params.purchaseId && !params.sessionId) {
        return null
    }

    let query = (params.supabase
        .from('event_purchases') as any)
        .select('id, email, user_id, status, metadata')
        .eq('status', 'pending')

    if (params.purchaseId) {
        query = query.eq('id', params.purchaseId)
    } else if (params.sessionId) {
        query = query.eq('provider_session_id', params.sessionId)
    }

    const { data: purchase, error } = await query.maybeSingle()

    if (error) {
        throw error
    }

    if (!purchase) {
        return null
    }

    const { error: updateError } = await (params.supabase
        .from('event_purchases') as any)
        .update({
            status: 'cancelled',
            checkout_session_expires_at: null,
            metadata: {
                ...(purchase.metadata ?? {}),
                cancelled_reason: params.reason,
                cancelled_at: new Date().toISOString(),
                ...(params.details ?? {}),
            },
        })
        .eq('id', purchase.id)

    if (updateError) {
        throw updateError
    }

    return purchase
}

async function cancelPendingFormationPurchaseRecord(params: {
    supabase: any
    purchaseId?: string | null
    sessionId?: string | null
    reason: string
    details?: Record<string, unknown>
}) {
    if (!params.purchaseId && !params.sessionId) {
        return null
    }

    let query = (params.supabase
        .from('formation_purchases') as any)
        .select('id, email, user_id, status, metadata')
        .eq('status', 'pending')

    if (params.purchaseId) {
        query = query.eq('id', params.purchaseId)
    } else if (params.sessionId) {
        query = query.eq('provider_session_id', params.sessionId)
    }

    const { data: purchase, error } = await query.maybeSingle()

    if (error) {
        throw error
    }

    if (!purchase) {
        return null
    }

    const { error: updateError } = await (params.supabase
        .from('formation_purchases') as any)
        .update({
            status: 'cancelled',
            metadata: {
                ...(purchase.metadata ?? {}),
                cancelled_reason: params.reason,
                cancelled_at: new Date().toISOString(),
                ...(params.details ?? {}),
            },
        })
        .eq('id', purchase.id)

    if (updateError) {
        throw updateError
    }

    return purchase
}

async function fulfillEventPurchase(params: {
    supabase: any
    data: PaymentWebhookData
    eventId: string
    userId: string | null
    profileId: string | null
}) {
    const customerEmail = normalizeWebhookValue(params.data.customerEmail)?.toLowerCase()
    if (!customerEmail) {
        console.error('[Payment] Event purchase missing customer email:', params.data)
        return { resolvedUserId: params.userId || params.profileId || null }
    }

    const { data: event } = await params.supabase
        .from('events')
        .select('id, title, slug, event_type, recording_expires_at, start_time')
        .eq('id', params.eventId)
        .maybeSingle()

    if (!event) {
        console.error('[Payment] Event not found for purchase fulfillment:', params.eventId)
        return { resolvedUserId: params.userId || params.profileId || null }
    }

    const purchaseIdFromMetadata = normalizeWebhookValue(params.data.metadata?.event_purchase_id)
    let purchaseRow: any = null

    if (purchaseIdFromMetadata) {
        const { data: existingById } = await (params.supabase
            .from('event_purchases') as any)
            .select('id, user_id, email, full_name, status, metadata')
            .eq('id', purchaseIdFromMetadata)
            .maybeSingle()

        purchaseRow = existingById ?? null
    }

    if (!purchaseRow) {
        const lookupFilters = [
            params.data.paymentIntentId ? `provider_payment_id.eq.${params.data.paymentIntentId}` : null,
            params.data.sessionId ? `provider_session_id.eq.${params.data.sessionId}` : null,
        ].filter(Boolean) as string[]

        if (lookupFilters.length > 0) {
            const { data: existingByProviderRefs } = await (params.supabase
                .from('event_purchases') as any)
                .select('id, user_id, email, full_name, status, metadata')
                .or(lookupFilters.join(','))
                .maybeSingle()

            purchaseRow = existingByProviderRefs ?? null
        }
    }

    if (!purchaseRow) {
        const { data: fallbackPurchase } = await (params.supabase
            .from('event_purchases') as any)
            .select('id, user_id, email, full_name, status, metadata')
            .eq('event_id', params.eventId)
            .eq('email', customerEmail)
            .order('purchased_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        purchaseRow = fallbackPurchase ?? null
    }

    const { data: matchedProfile } = await (params.supabase
        .from('profiles') as any)
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle()

    const resolvedUserId = purchaseRow?.user_id || params.userId || params.profileId || matchedProfile?.id || null
    const wasAlreadyConfirmed = purchaseRow?.status === 'confirmed'
    const paymentReference = params.data.paymentIntentId || params.data.sessionId
    const attributionSnapshot = parseAttributionSnapshot(params.data.metadata?.attribution_snapshot)
    const mergedMetadata = {
        ...(purchaseRow?.metadata ?? {}),
        ...(params.data.metadata ?? {}),
        webhook: {
            session_id: params.data.sessionId,
            payment_intent_id: params.data.paymentIntentId || null,
            fulfilled_at: new Date().toISOString(),
        },
    }

    let purchaseId = purchaseRow?.id as string | null

    if (purchaseId) {
        await (params.supabase
            .from('event_purchases') as any)
            .update({
                user_id: resolvedUserId,
                email: customerEmail,
                full_name: purchaseRow?.full_name || normalizeWebhookValue(params.data.metadata?.buyer_full_name),
                payment_reference: paymentReference,
                provider_session_id: params.data.sessionId,
                provider_payment_id: params.data.paymentIntentId || null,
                analytics_visitor_id: params.data.metadata?.analytics_visitor_id || null,
                analytics_session_id: params.data.metadata?.analytics_session_id || null,
                attribution_snapshot: attributionSnapshot,
                metadata: mergedMetadata,
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
            })
            .eq('id', purchaseId)
    } else {
        const { data: createdPurchase, error: purchaseInsertError } = await (params.supabase
            .from('event_purchases') as any)
            .insert({
                event_id: params.eventId,
                user_id: resolvedUserId,
                email: customerEmail,
                full_name: normalizeWebhookValue(params.data.metadata?.buyer_full_name),
                amount_paid: params.data.amount,
                currency: (params.data.currency || 'mxn').toUpperCase(),
                payment_method: 'card',
                payment_reference: paymentReference,
                provider_session_id: params.data.sessionId,
                provider_payment_id: params.data.paymentIntentId || null,
                analytics_visitor_id: params.data.metadata?.analytics_visitor_id || null,
                analytics_session_id: params.data.metadata?.analytics_session_id || null,
                attribution_snapshot: attributionSnapshot,
                metadata: mergedMetadata,
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
            })
            .select('id')
            .single()

        if (purchaseInsertError) {
            throw purchaseInsertError
        }

        purchaseId = createdPurchase.id as string
    }

    if (resolvedUserId && event.event_type !== 'on_demand') {
        const { data: existingRegistration } = await (params.supabase
            .from('event_registrations') as any)
            .select('id, registration_data')
            .eq('event_id', params.eventId)
            .eq('user_id', resolvedUserId)
            .maybeSingle()

        const registrationPayload = {
            payment_reference: paymentReference,
            amount_paid: params.data.amount,
            currency: (params.data.currency || 'mxn').toUpperCase(),
            source: 'payment_webhook',
        }

        if (existingRegistration) {
            await (params.supabase
                .from('event_registrations') as any)
                .update({
                    status: 'registered',
                    registration_data: {
                        ...(existingRegistration.registration_data ?? {}),
                        ...registrationPayload,
                    },
                })
                .eq('id', existingRegistration.id)
        } else {
            await (params.supabase.from('event_registrations') as any).insert({
                event_id: params.eventId,
                user_id: resolvedUserId,
                status: 'registered',
                registration_data: registrationPayload,
            })
        }
    }

    await grantEventEntitlements({
        event,
        email: customerEmail,
        userId: resolvedUserId,
        sourceType: 'purchase',
        sourceReference: purchaseId,
        metadata: {
            payment_reference: paymentReference,
            provider_session_id: params.data.sessionId,
            provider_payment_id: params.data.paymentIntentId || null,
            amount_paid: params.data.amount,
            currency: (params.data.currency || 'mxn').toUpperCase(),
        },
    })

    console.log(`[Payment] Event purchase confirmed, access granted for event: ${params.eventId}`)

    if (!wasAlreadyConfirmed) {
        try {
            await sendEventPurchaseConfirmation({
                email: customerEmail,
                eventTitle: event.title,
                eventSlug: event.slug,
                eventStartTime: event.start_time,
                amount: params.data.amount,
                isGuest: params.data.metadata?.guest_checkout === 'true',
                purchaseId,
                userId: resolvedUserId,
                userName:
                    purchaseRow?.full_name
                    || normalizeWebhookValue(params.data.metadata?.buyer_full_name)
                    || customerEmail.split('@')[0],
            })
        } catch (emailError) {
        // Non-blocking — purchase is already confirmed
            console.error('[Payment] Failed to send purchase confirmation email:', emailError)
        }

    }

    if (!wasAlreadyConfirmed && resolvedUserId) {
        try {
            await createUserNotification({
                supabase: params.supabase,
                userId: resolvedUserId,
                category: 'payments',
                level: 'success',
                kind: 'event_purchase_confirmed',
                title: 'Compra confirmada',
                body: event.title
                    ? `Tu acceso a "${event.title}" ya esta listo dentro de la app.`
                    : 'Tu compra del evento fue confirmada y tu acceso ya esta activo.',
                actionUrl: `/dashboard/events/${params.eventId}`,
                dedupeKey: purchaseId ? `event-purchase:${purchaseId}` : null,
                metadata: {
                    eventId: params.eventId,
                    purchaseId,
                    amount: params.data.amount,
                    currency: params.data.currency || 'mxn',
                },
            })
        } catch (notificationError) {
            console.error('[Payment] Failed to create internal event purchase notification:', notificationError)
        }
    }

    return { resolvedUserId }
}

async function fulfillFormationPurchase(params: {
    supabase: any
    data: PaymentWebhookData
    formationId: string
    userId: string | null
    profileId: string | null
}) {
    const customerEmail = normalizeWebhookValue(params.data.customerEmail)?.toLowerCase()
    if (!customerEmail) {
        console.error('[Payment] Formation purchase missing customer email:', params.data)
        return { resolvedUserId: params.userId || params.profileId || null }
    }

    const { data: formation } = await params.supabase
        .from('formations')
        .select('id, title, slug')
        .eq('id', params.formationId)
        .maybeSingle()

    if (!formation) {
        console.error('[Payment] Formation not found for purchase fulfillment:', params.formationId)
        return { resolvedUserId: params.userId || params.profileId || null }
    }

    const purchaseIdFromMetadata = normalizeWebhookValue(params.data.metadata?.formation_purchase_id)
    let purchaseRow: any = null

    if (purchaseIdFromMetadata) {
        const { data: existingById } = await (params.supabase
            .from('formation_purchases') as any)
            .select('*')
            .eq('id', purchaseIdFromMetadata)
            .maybeSingle()
        purchaseRow = existingById ?? null
    }

    if (!purchaseRow) {
        const { data: fallbackPurchase } = await (params.supabase
            .from('formation_purchases') as any)
            .select('*')
            .eq('formation_id', params.formationId)
            .eq('email', customerEmail)
            .order('purchased_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        purchaseRow = fallbackPurchase ?? null
    }

    const { data: matchedProfile } = await (params.supabase
        .from('profiles') as any)
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle()

    const resolvedUserId = purchaseRow?.user_id || params.userId || params.profileId || matchedProfile?.id || null
    const wasAlreadyConfirmed = purchaseRow?.status === 'confirmed'
    const paymentReference = params.data.paymentIntentId || params.data.sessionId
    const mergedMetadata = {
        ...(purchaseRow?.metadata ?? {}),
        ...(params.data.metadata ?? {}),
        webhook: {
            session_id: params.data.sessionId,
            payment_intent_id: params.data.paymentIntentId || null,
            fulfilled_at: new Date().toISOString(),
        },
    }

    let purchaseId = purchaseRow?.id as string | null

    if (purchaseId) {
        await (params.supabase
            .from('formation_purchases') as any)
            .update({
                user_id: resolvedUserId,
                email: customerEmail,
                full_name: purchaseRow?.full_name || normalizeWebhookValue(params.data.metadata?.buyer_full_name),
                payment_reference: paymentReference,
                provider_session_id: params.data.sessionId,
                provider_payment_id: params.data.paymentIntentId || null,
                metadata: mergedMetadata,
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
            })
            .eq('id', purchaseId)
    } else {
        const purchaseIdUuid = crypto.randomUUID()
        await (params.supabase
            .from('formation_purchases') as any)
            .insert({
                id: purchaseIdUuid,
                formation_id: params.formationId,
                user_id: resolvedUserId,
                email: customerEmail,
                full_name: normalizeWebhookValue(params.data.metadata?.buyer_full_name),
                amount_paid: params.data.amount,
                currency: (params.data.currency || 'mxn').toUpperCase(),
                payment_reference: paymentReference,
                provider_session_id: params.data.sessionId,
                provider_payment_id: params.data.paymentIntentId || null,
                metadata: mergedMetadata,
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
            })
        purchaseId = purchaseIdUuid
    }

    const { data: linkedEvents } = await params.supabase
        .from('events')
        .select('id, event_type, recording_expires_at')
        .eq('formation_id', params.formationId)

    if (linkedEvents && linkedEvents.length > 0) {
        for (const ev of linkedEvents) {
            await grantEventEntitlements({
                event: ev,
                email: customerEmail,
                userId: resolvedUserId,
                sourceType: 'purchase',
                sourceReference: purchaseId,
                metadata: {
                    payment_reference: paymentReference,
                    formation_id: formation.id,
                    provider_session_id: params.data.sessionId,
                    provider_payment_id: params.data.paymentIntentId || null,
                },
            })

            if (resolvedUserId && ev.event_type !== 'on_demand') {
                const { data: existingRegistration } = await (params.supabase
                    .from('event_registrations') as any)
                    .select('id, registration_data')
                    .eq('event_id', ev.id)
                    .eq('user_id', resolvedUserId)
                    .maybeSingle()

                const registrationPayload = {
                    payment_reference: paymentReference,
                    source: 'formation_purchase',
                    formation_id: formation.id,
                }

                if (existingRegistration) {
                     await (params.supabase
                        .from('event_registrations') as any)
                        .update({
                            status: 'registered',
                            registration_data: {
                                ...(existingRegistration.registration_data ?? {}),
                                ...registrationPayload,
                            },
                        })
                        .eq('id', existingRegistration.id)
                } else {
                    await (params.supabase.from('event_registrations') as any).insert({
                        event_id: ev.id,
                        user_id: resolvedUserId,
                        status: 'registered',
                        registration_data: registrationPayload,
                    })
                }
            }
        }
    }

    console.log(`[Payment] Formation purchase confirmed, access granted for ${linkedEvents?.length || 0} courses.`)

    if (!wasAlreadyConfirmed) {
        try {
            await sendFormationPurchaseConfirmation({
                email: customerEmail,
                formationTitle: formation.title,
                amount: params.data.amount,
                isGuest: params.data.metadata?.guest_checkout === 'true',
                purchaseId,
                userId: resolvedUserId,
                userName:
                    purchaseRow?.full_name
                    || normalizeWebhookValue(params.data.metadata?.buyer_full_name)
                    || customerEmail.split('@')[0],
                linkedCoursesCount: linkedEvents?.length ?? 0,
            })
        } catch (emailError) {
            console.error('[Payment] Failed to send formation purchase confirmation email:', emailError)
        }
    }

    if (!wasAlreadyConfirmed && resolvedUserId) {
        try {
            await createUserNotification({
                supabase: params.supabase,
                userId: resolvedUserId,
                category: 'payments',
                level: 'success',
                kind: 'formation_purchase_confirmed',
                title: 'Compra confirmada',
                body: formation.title
                    ? `Tu acceso a la formacion "${formation.title}" ya esta activo.`
                    : 'Tu compra de la formacion fue confirmada y tu acceso ya esta listo.',
                actionUrl: `/dashboard/events/formations/${params.formationId}`,
                dedupeKey: purchaseId ? `formation-purchase:${purchaseId}` : null,
                metadata: {
                    formationId: params.formationId,
                    purchaseId,
                    linkedCourses: linkedEvents?.length ?? 0,
                    amount: params.data.amount,
                    currency: params.data.currency || 'mxn',
                },
            })
        } catch (notificationError) {
            console.error('[Payment] Failed to create internal formation purchase notification:', notificationError)
        }
    }

    return { resolvedUserId }
}

export async function fulfillSubscriptionCreated(data: SubscriptionWebhookData): Promise<void> {
    const supabase = getServiceSupabase()
    const analyticsVisitorId = data.metadata?.analytics_visitor_id || null
    const analyticsSessionId = data.metadata?.analytics_session_id || null
    const attributionSnapshot = parseAttributionSnapshot(data.metadata?.attribution_snapshot)
    const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('provider_subscription_id', data.providerSubscriptionId)
        .maybeSingle()

    const membershipLevel = data.membershipLevel || (data.priceId ? getPlanByPriceId(data.priceId)?.membershipLevel : null) || 0
    const specializationCode =
        data.specializationCode || (data.priceId ? getPlanByPriceId(data.priceId)?.specializationCode : null) || null
    const identity = await resolveSubscriptionIdentity({
        supabase,
        providerCustomerId: data.providerCustomerId,
        customerEmail: data.customerEmail,
        membershipLevel,
        specializationCode,
        fullName: normalizeWebhookValue(data.metadata?.buyer_full_name),
    })
    const profileId = identity.profileId
    const userId = identity.userId

    if (!profileId || !userId) {
        console.error('[Payment] Could not find user for subscription:', data)
        return
    }

    await supabase
        .from('subscriptions')
        .upsert(
            {
                user_id: userId,
                profile_id: profileId,
                membership_level: membershipLevel,
                specialization_code: specializationCode,
                payment_provider: 'stripe',
                provider_subscription_id: data.providerSubscriptionId,
                provider_customer_id: data.providerCustomerId,
                provider_price_id: data.priceId || null,
                status: data.status === 'trialing' ? 'trialing' : 'active',
                current_period_start: data.currentPeriodStart || new Date().toISOString(),
                current_period_end: data.currentPeriodEnd || null,
                trial_start: data.trialStart || null,
                trial_end: data.trialEnd || null,
                analytics_visitor_id: analyticsVisitorId,
                analytics_session_id: analyticsSessionId,
                attribution_snapshot: attributionSnapshot,
            },
            { onConflict: 'provider_subscription_id' }
        )

    const profileUpdate: Record<string, any> = {
        membership_level: membershipLevel,
        subscription_status: data.status === 'trialing' ? 'trial' : 'active',
        stripe_customer_id: data.providerCustomerId,
    }

    if (membershipLevel < 2) {
        profileUpdate.membership_specialization_code = null
    } else if (specializationCode) {
        profileUpdate.membership_specialization_code = specializationCode
    }

    await supabase.from('profiles').update(profileUpdate).eq('id', profileId)
    await syncMembershipEntitlementsForUser(profileId)

    console.log(`[Payment] Subscription activated: user=${profileId}, level=${membershipLevel}`)

    if (identity.createdNewUser && data.metadata?.guest_checkout === 'true' && identity.normalizedEmail) {
        try {
            await sendGuestSubscriptionAccessLink(
                identity.normalizedEmail,
                normalizeWebhookValue(data.metadata?.post_checkout_path) || '/dashboard/subscription'
            )
            await logCommerceOperationalEvent({
                actionType: 'commerce_magic_link_sent',
                entityType: 'subscription',
                entityId: existingSubscription?.id ?? null,
                targetUserId: userId,
                targetEmail: identity.normalizedEmail,
                details: {
                    providerSubscriptionId: data.providerSubscriptionId,
                    nextPath: normalizeWebhookValue(data.metadata?.post_checkout_path) || '/dashboard/subscription',
                },
            })
        } catch (magicLinkError) {
            console.error('[Payment] Failed to send guest subscription access link:', magicLinkError)
            await logCommerceOperationalEvent({
                actionType: 'commerce_magic_link_failed',
                entityType: 'subscription',
                entityId: existingSubscription?.id ?? null,
                targetUserId: userId,
                targetEmail: identity.normalizedEmail,
                reason: magicLinkError instanceof Error ? magicLinkError.message : 'magic_link_failed',
                details: {
                    providerSubscriptionId: data.providerSubscriptionId,
                    nextPath: normalizeWebhookValue(data.metadata?.post_checkout_path) || '/dashboard/subscription',
                },
            })
        }
    }

    if (!existingSubscription) {
        try {
            await createUserNotification({
                supabase,
                userId,
                category: 'payments',
                level: 'success',
                kind: 'subscription_activated',
                title: 'Suscripcion activada',
                body: 'Tu membresia ya esta activa y tu acceso premium quedo actualizado.',
                actionUrl: '/dashboard/subscription',
                dedupeKey: `subscription-created:${data.providerSubscriptionId}`,
                metadata: {
                    membershipLevel,
                    specializationCode,
                    providerSubscriptionId: data.providerSubscriptionId,
                },
            })
        } catch (notificationError) {
            console.error('[Payment] Failed to create internal subscription activation notification:', notificationError)
        }

        await recordAnalyticsServerEvent({
            eventName: 'subscription_created',
            eventSource: 'webhook',
            visitorId: analyticsVisitorId,
            sessionId: analyticsSessionId,
            userId,
            consent: parseTrackingConsentFromMetadata((data.metadata ?? {}) as Record<string, unknown>),
            touch: getPrimaryTouch(attributionSnapshot),
            properties: {
                providerSubscriptionId: data.providerSubscriptionId,
                membershipLevel,
                specializationCode,
            },
        })
    }
}

export async function fulfillSubscriptionRenewed(data: SubscriptionWebhookData): Promise<void> {
    const supabase = getServiceSupabase()

    const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, profile_id, membership_level')
        .eq('provider_subscription_id', data.providerSubscriptionId)
        .single()

    if (!sub) {
        console.error('[Payment] Subscription not found for renewal:', data.providerSubscriptionId)
        return
    }

    await supabase
        .from('subscriptions')
        .update({
            status: 'active',
            current_period_start: data.currentPeriodStart || new Date().toISOString(),
            current_period_end: data.currentPeriodEnd || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id)

    await supabase.from('profiles').update({ subscription_status: 'active' }).eq('id', sub.profile_id)
    await syncMembershipEntitlementsForUser(sub.profile_id)

    let existingTransactionId: string | null = null
    if (data.invoiceId) {
        const { data: existingByInvoice } = await supabase
            .from('payment_transactions')
            .select('id')
            .eq('provider_invoice_id', data.invoiceId)
            .maybeSingle()
        existingTransactionId = existingByInvoice?.id ?? null
    }
    if (!existingTransactionId && data.paymentIntentId) {
        const { data: existingByIntent } = await supabase
            .from('payment_transactions')
            .select('id')
            .eq('provider_payment_id', data.paymentIntentId)
            .maybeSingle()
        existingTransactionId = existingByIntent?.id ?? null
    }

    const { data: subscriptionRow } = await supabase
        .from('subscriptions')
        .select('analytics_visitor_id, analytics_session_id, attribution_snapshot, specialization_code')
        .eq('id', sub.id)
        .maybeSingle()

    if (data.amount && !existingTransactionId) {
        await supabase.from('payment_transactions').insert({
            user_id: sub.profile_id,
            profile_id: sub.profile_id,
            subscription_id: sub.id,
            email: data.customerEmail || '',
            purchase_type: 'subscription_payment',
            purchase_reference_id: String(sub.membership_level),
            amount: data.amount,
            currency: data.currency || 'MXN',
            payment_provider: 'stripe',
            provider_payment_id: data.paymentIntentId || null,
            provider_invoice_id: data.invoiceId || null,
            status: 'completed',
            analytics_visitor_id: (subscriptionRow as any)?.analytics_visitor_id ?? null,
            analytics_session_id: (subscriptionRow as any)?.analytics_session_id ?? null,
            attribution_snapshot: (subscriptionRow as any)?.attribution_snapshot ?? {},
            completed_at: new Date().toISOString(),
        })
    }

    console.log(`[Payment] Subscription renewed: sub=${sub.id}`)

    if (!existingTransactionId) {
        try {
            await createUserNotification({
                supabase,
                userId: sub.profile_id,
                category: 'payments',
                level: 'success',
                kind: 'subscription_renewed',
                title: 'Suscripcion renovada',
                body: 'Recibimos tu renovacion y tu acceso premium sigue activo.',
                actionUrl: '/dashboard/subscription',
                dedupeKey: data.invoiceId
                    ? `subscription-renewed:${data.invoiceId}`
                    : data.paymentIntentId
                        ? `subscription-renewed:${data.paymentIntentId}`
                        : null,
                metadata: {
                    subscriptionId: sub.id,
                    membershipLevel: sub.membership_level,
                    amount: data.amount ?? null,
                    currency: data.currency ?? null,
                },
            })
        } catch (notificationError) {
            console.error('[Payment] Failed to create internal subscription renewal notification:', notificationError)
        }
    }

    const renewalSnapshot = ((subscriptionRow as any)?.attribution_snapshot ?? emptySnapshot()) as AttributionSnapshot

    await recordAnalyticsServerEvent({
        eventName: 'subscription_renewed',
        eventSource: 'webhook',
        visitorId: (subscriptionRow as any)?.analytics_visitor_id ?? null,
        sessionId: (subscriptionRow as any)?.analytics_session_id ?? null,
        userId: sub.profile_id,
        consent: parseTrackingConsentFromMetadata((data.metadata ?? {}) as Record<string, unknown>),
        touch: getPrimaryTouch(renewalSnapshot),
        properties: {
            subscriptionId: sub.id,
            membershipLevel: sub.membership_level,
            specializationCode: (subscriptionRow as any)?.specialization_code ?? null,
            amount: data.amount ?? null,
        },
    })
}

export async function fulfillSubscriptionUpdated(data: SubscriptionWebhookData): Promise<void> {
    const supabase = getServiceSupabase()

    const updates: Record<string, any> = {
        status: data.status,
        updated_at: new Date().toISOString(),
    }

    if (data.cancelAtPeriodEnd !== undefined) updates.cancel_at_period_end = data.cancelAtPeriodEnd
    if (data.cancelledAt) updates.cancelled_at = data.cancelledAt
    if (data.currentPeriodStart) updates.current_period_start = data.currentPeriodStart
    if (data.currentPeriodEnd) updates.current_period_end = data.currentPeriodEnd
    if (data.providerCustomerId) updates.provider_customer_id = data.providerCustomerId
    if (data.priceId) updates.provider_price_id = data.priceId
    if (data.membershipLevel !== undefined) updates.membership_level = data.membershipLevel
    if (data.specializationCode !== undefined) updates.specialization_code = data.specializationCode

    await supabase.from('subscriptions').update(updates).eq('provider_subscription_id', data.providerSubscriptionId)

    if (data.status === 'cancelled' || data.status === 'expired') {
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('profile_id')
            .eq('provider_subscription_id', data.providerSubscriptionId)
            .single()

        if (sub) {
            await supabase
                .from('profiles')
                .update({
                    subscription_status: 'cancelled',
                    membership_level: 0,
                    membership_specialization_code: null,
                })
                .eq('id', sub.profile_id)
            await syncMembershipEntitlementsForUser(sub.profile_id)
        }
    } else if (data.status === 'past_due') {
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('profile_id')
            .eq('provider_subscription_id', data.providerSubscriptionId)
            .single()

            if (sub) {
                await supabase.from('profiles').update({ subscription_status: 'past_due' }).eq('id', sub.profile_id)
                await syncMembershipEntitlementsForUser(sub.profile_id)
            }
    } else {
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('profile_id, membership_level, specialization_code')
            .eq('provider_subscription_id', data.providerSubscriptionId)
            .single()

        if (sub?.profile_id) {
            const profileUpdates: Record<string, any> = {
                subscription_status: data.status === 'trialing' ? 'trial' : 'active',
            }

            if (typeof sub.membership_level === 'number') {
                profileUpdates.membership_level = sub.membership_level
                if (sub.membership_level < 2) {
                    profileUpdates.membership_specialization_code = null
                } else if (sub.specialization_code) {
                    profileUpdates.membership_specialization_code = sub.specialization_code
                }
            }

            await supabase.from('profiles').update(profileUpdates).eq('id', sub.profile_id)
            await syncMembershipEntitlementsForUser(sub.profile_id)
        }
    }

    console.log(`[Payment] Subscription updated: ${data.providerSubscriptionId} -> ${data.status}`)

    const { data: subscriptionRow } = await supabase
        .from('subscriptions')
        .select('id, user_id, analytics_visitor_id, analytics_session_id, attribution_snapshot')
        .eq('provider_subscription_id', data.providerSubscriptionId)
        .maybeSingle()

    const eventName =
        data.status === 'cancelled' || data.status === 'expired'
            ? 'subscription_cancelled'
            : data.status === 'past_due'
                ? 'subscription_past_due'
                : null

    if (eventName && subscriptionRow?.user_id) {
        try {
            await createUserNotification({
                supabase,
                userId: subscriptionRow.user_id,
                category: 'payments',
                level: 'warning',
                kind: data.status === 'past_due' ? 'subscription_past_due' : 'subscription_cancelled',
                title: data.status === 'past_due' ? 'Pago pendiente de membresia' : 'Suscripcion actualizada',
                body: data.status === 'past_due'
                    ? 'No pudimos renovar tu membresia. Revisa tu metodo de pago para evitar perder acceso.'
                    : 'Tu suscripcion dejo de estar activa. Puedes reactivarla cuando quieras desde tu panel.',
                actionUrl: '/dashboard/subscription',
                dedupeKey: `subscription-status:${data.providerSubscriptionId}:${data.status}:${data.currentPeriodEnd || data.cancelledAt || 'na'}`,
                metadata: {
                    subscriptionId: subscriptionRow.id,
                    status: data.status,
                    providerSubscriptionId: data.providerSubscriptionId,
                },
            })
        } catch (notificationError) {
            console.error('[Payment] Failed to create internal subscription status notification:', notificationError)
        }
    }

    if (eventName && subscriptionRow) {
        const snapshot = ((subscriptionRow as any).attribution_snapshot ?? emptySnapshot()) as AttributionSnapshot
        await recordAnalyticsServerEvent({
            eventName,
            eventSource: 'webhook',
            visitorId: (subscriptionRow as any).analytics_visitor_id ?? null,
            sessionId: (subscriptionRow as any).analytics_session_id ?? null,
            userId: (subscriptionRow as any).user_id ?? null,
            consent: parseTrackingConsentFromMetadata((data.metadata ?? {}) as Record<string, unknown>),
            touch: getPrimaryTouch(snapshot),
            properties: {
                providerSubscriptionId: data.providerSubscriptionId,
                status: data.status,
            },
        })
    }
}

export async function fulfillOneTimePayment(data: PaymentWebhookData): Promise<void> {
    const supabase = getServiceSupabase()

    const userId = normalizeWebhookValue(data.metadata?.user_id)
    const profileId = normalizeWebhookValue(data.metadata?.profile_id)
    const purchaseType = (data.purchaseType || data.metadata?.purchase_type) as any
    const referenceId = data.referenceId || data.metadata?.reference_id
    const analyticsVisitorId = data.metadata?.analytics_visitor_id || null
    const analyticsSessionId = data.metadata?.analytics_session_id || null
    const attributionSnapshot = parseAttributionSnapshot(data.metadata?.attribution_snapshot)
    const sourceRef = data.paymentIntentId || data.sessionId
    let resolvedFulfillmentUserId = profileId || userId || null

    const lookupFilters = [
        data.paymentIntentId ? `provider_payment_id.eq.${data.paymentIntentId}` : null,
        data.sessionId ? `provider_session_id.eq.${data.sessionId}` : null,
    ].filter(Boolean) as string[]

    const { data: existingTransaction } =
        lookupFilters.length > 0
            ? await supabase
                .from('payment_transactions')
                .select('id')
                .or(lookupFilters.join(','))
                .maybeSingle()
            : { data: null }
    const isFirstCompletedTransaction = !existingTransaction
    let transactionId = existingTransaction?.id ?? null

    if (!existingTransaction) {
        const { data: insertedTransaction, error: insertTransactionError } = await supabase
            .from('payment_transactions')
            .insert({
                user_id: userId || null,
                profile_id: profileId || null,
                email: data.customerEmail,
                purchase_type: purchaseType || 'ai_credits',
                purchase_reference_id: referenceId || null,
                amount: data.amount,
                currency: data.currency,
                payment_provider: 'stripe',
                provider_session_id: data.sessionId,
                provider_payment_id: data.paymentIntentId || null,
                status: 'completed',
                metadata: data.metadata || {},
                analytics_visitor_id: analyticsVisitorId,
                analytics_session_id: analyticsSessionId,
                attribution_snapshot: attributionSnapshot,
                completed_at: new Date().toISOString(),
            })
            .select('id')
            .single()

        if (insertTransactionError) {
            throw insertTransactionError
        }

        transactionId = insertedTransaction.id as string
    }

    if (purchaseType === 'ai_credits' && profileId) {
        const minutes = Number(data.metadata?.minutes || 0)
        if (minutes > 0) {
            const { data: existingCreditGrant } = await (supabase
                .from('ai_credit_transactions') as any)
                .select('id')
                .eq('source_ref', sourceRef)
                .maybeSingle()

            if (!existingCreditGrant) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('ai_minutes_available')
                    .eq('id', profileId)
                    .single()

                const currentMinutes = profile?.ai_minutes_available || 0
                await supabase.from('profiles').update({ ai_minutes_available: currentMinutes + minutes }).eq('id', profileId)

                await (supabase.from('ai_credit_transactions') as any).insert({
                    profile_id: profileId,
                    amount: minutes,
                    transaction_type: 'purchase',
                    description: `Compra Stripe ${sourceRef}`,
                    source_ref: sourceRef,
                })

                console.log(`[Payment] AI credits added: ${minutes} minutes to user ${profileId}`)
            }
        }
    } else if (purchaseType === 'event_purchase' && referenceId) {
        const result = await fulfillEventPurchase({
            supabase,
            data,
            eventId: referenceId,
            userId,
            profileId,
        })
        resolvedFulfillmentUserId = result.resolvedUserId

        try {
            await upsertPremiumCommission({
                supabase,
                eventId: referenceId,
                studentId: resolvedFulfillmentUserId,
                transactionId,
                grossAmount: data.amount,
            })
        } catch (commissionError) {
            console.error('[Payment] Failed to create premium commission:', commissionError)
        }
    } else if (purchaseType === 'formation_purchase' && referenceId) {
        const result = await fulfillFormationPurchase({
            supabase,
            data,
            formationId: referenceId,
            userId,
            profileId,
        })
        resolvedFulfillmentUserId = result.resolvedUserId
    }

    if (transactionId && resolvedFulfillmentUserId && (!userId || !profileId)) {
        await supabase
            .from('payment_transactions')
            .update({
                user_id: resolvedFulfillmentUserId,
                profile_id: resolvedFulfillmentUserId,
            })
            .eq('id', transactionId)
    }

    if (isFirstCompletedTransaction) {
        await recordAnalyticsServerEvent({
            eventName: 'payment_completed',
            eventSource: 'webhook',
            visitorId: analyticsVisitorId,
            sessionId: analyticsSessionId,
            userId: resolvedFulfillmentUserId,
            consent: parseTrackingConsentFromMetadata((data.metadata ?? {}) as Record<string, unknown>),
            touch: getPrimaryTouch(attributionSnapshot),
            properties: {
                purchaseType,
                referenceId: referenceId || null,
                amount: data.amount,
                currency: data.currency,
            },
        })

        if (purchaseType === 'event_purchase') {
            await recordAnalyticsServerEvent({
                eventName: 'event_purchased',
                eventSource: 'webhook',
                visitorId: analyticsVisitorId,
                sessionId: analyticsSessionId,
                userId: resolvedFulfillmentUserId,
                consent: parseTrackingConsentFromMetadata((data.metadata ?? {}) as Record<string, unknown>),
                touch: getPrimaryTouch(attributionSnapshot),
                properties: {
                    eventId: referenceId || null,
                    amount: data.amount,
                },
            })
        }

        if (purchaseType === 'ai_credits') {
            await recordAnalyticsServerEvent({
                eventName: 'ai_credits_purchased',
                eventSource: 'webhook',
                visitorId: analyticsVisitorId,
                sessionId: analyticsSessionId,
                userId: resolvedFulfillmentUserId,
                consent: parseTrackingConsentFromMetadata((data.metadata ?? {}) as Record<string, unknown>),
                touch: getPrimaryTouch(attributionSnapshot),
                properties: {
                    packageKey: referenceId || null,
                    amount: data.amount,
                    minutes: Number(data.metadata?.minutes || 0),
                },
            })
        }

        if (purchaseType === 'formation_purchase') {
            await recordAnalyticsServerEvent({
                eventName: 'formation_purchased',
                eventSource: 'webhook',
                visitorId: analyticsVisitorId,
                sessionId: analyticsSessionId,
                userId: resolvedFulfillmentUserId,
                consent: parseTrackingConsentFromMetadata((data.metadata ?? {}) as Record<string, unknown>),
                touch: getPrimaryTouch(attributionSnapshot),
                properties: {
                    formationId: referenceId || null,
                    amount: data.amount,
                },
            })
        }
    }
}

export async function expireCheckoutSession(data: CheckoutSessionWebhookData): Promise<void> {
    const supabase = getServiceSupabase()
    const purchaseType = (data.purchaseType || data.metadata?.purchase_type) as any

    if (purchaseType === 'event_purchase') {
        const cancelledPurchase = await cancelPendingEventPurchaseRecord({
            supabase,
            purchaseId: normalizeWebhookValue(data.metadata?.event_purchase_id),
            sessionId: data.sessionId,
            reason: 'stripe_checkout_session_expired',
            details: {
                provider_event: 'checkout.session.expired',
                expired_at: data.expiresAt ?? new Date().toISOString(),
            },
        })

        if (cancelledPurchase) {
            await logCommerceOperationalEvent({
                actionType: 'checkout_expired',
                entityType: 'event_purchase',
                entityId: cancelledPurchase.id,
                targetUserId: cancelledPurchase.user_id ?? null,
                targetEmail: cancelledPurchase.email ?? null,
                details: {
                    sessionId: data.sessionId,
                    purchaseType,
                    referenceId: data.referenceId ?? null,
                },
            })
        }

        return
    }

    if (purchaseType === 'formation_purchase') {
        const cancelledPurchase = await cancelPendingFormationPurchaseRecord({
            supabase,
            purchaseId: normalizeWebhookValue(data.metadata?.formation_purchase_id),
            sessionId: data.sessionId,
            reason: 'stripe_checkout_session_expired',
            details: {
                provider_event: 'checkout.session.expired',
                expired_at: data.expiresAt ?? new Date().toISOString(),
            },
        })

        if (cancelledPurchase) {
            await logCommerceOperationalEvent({
                actionType: 'checkout_expired',
                entityType: 'formation_purchase',
                entityId: cancelledPurchase.id,
                targetUserId: cancelledPurchase.user_id ?? null,
                targetEmail: cancelledPurchase.email ?? null,
                details: {
                    sessionId: data.sessionId,
                    purchaseType,
                    referenceId: data.referenceId ?? null,
                },
            })
        }
    }
}

export async function refundOneTimePayment(data: RefundWebhookData): Promise<void> {
    const supabase = getServiceSupabase()
    const purchaseType = (data.purchaseType || data.metadata?.purchase_type) as any
    const referenceId = data.referenceId || data.metadata?.reference_id || null
    const lookupFilters = [
        data.paymentIntentId ? `provider_payment_id.eq.${data.paymentIntentId}` : null,
        data.sessionId ? `provider_session_id.eq.${data.sessionId}` : null,
    ].filter(Boolean) as string[]

    if (lookupFilters.length === 0) {
        await logCommerceOperationalEvent({
            actionType: 'payment_refund_manual_review_required',
            entityType: 'payment_transaction',
            targetEmail: data.customerEmail ?? null,
            reason: 'refund_missing_provider_references',
            details: {
                refundId: data.refundId,
                purchaseType: purchaseType ?? null,
                referenceId,
            },
        })
        return
    }

    const { data: transaction } = await (supabase
        .from('payment_transactions') as any)
        .select('id, user_id, profile_id, email, purchase_type, purchase_reference_id, status, metadata, analytics_visitor_id, analytics_session_id, attribution_snapshot, provider_payment_id, provider_session_id')
        .or(lookupFilters.join(','))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!transaction) {
        await logCommerceOperationalEvent({
            actionType: 'payment_refund_manual_review_required',
            entityType: 'payment_transaction',
            targetEmail: data.customerEmail ?? null,
            reason: 'refund_transaction_not_found',
            details: {
                refundId: data.refundId,
                paymentIntentId: data.paymentIntentId ?? null,
                sessionId: data.sessionId ?? null,
                purchaseType: purchaseType ?? null,
                referenceId,
            },
        })
        return
    }

    const refundMetadata = {
        ...(transaction.metadata ?? {}),
        refund: {
            refund_id: data.refundId,
            charge_id: data.chargeId ?? null,
            payment_intent_id: data.paymentIntentId ?? null,
            session_id: data.sessionId ?? null,
            refunded_amount: data.amountRefunded,
            original_amount: data.originalAmount ?? null,
            refund_reason: data.refundReason ?? null,
            is_full_refund: data.isFullRefund,
            processed_at: new Date().toISOString(),
        },
    }

    if (!data.isFullRefund) {
        await (supabase
            .from('payment_transactions') as any)
            .update({
                metadata: refundMetadata,
            })
            .eq('id', transaction.id)

        await logCommerceOperationalEvent({
            actionType: 'payment_refund_manual_review_required',
            entityType: 'payment_transaction',
            entityId: transaction.id,
            targetUserId: transaction.user_id || transaction.profile_id || null,
            targetEmail: transaction.email,
            reason: 'partial_refund_detected',
            details: {
                refundId: data.refundId,
                refundedAmount: data.amountRefunded,
                originalAmount: data.originalAmount ?? null,
                purchaseType: transaction.purchase_type,
                referenceId: transaction.purchase_reference_id ?? referenceId,
            },
        })
        return
    }

    await (supabase
        .from('payment_transactions') as any)
        .update({
            status: 'refunded',
            metadata: refundMetadata,
        })
        .eq('id', transaction.id)

    let entityType = transaction.purchase_type
    let entityId: string | null = null
    let autoResolved = false
    let cancelledRegistrations = 0
    let voidedEarnings = 0

    if (transaction.purchase_type === 'event_purchase') {
        const eventPurchaseLookupFilters = [
            data.paymentIntentId ? `provider_payment_id.eq.${data.paymentIntentId}` : null,
            data.sessionId ? `provider_session_id.eq.${data.sessionId}` : null,
        ].filter(Boolean) as string[]
        let purchase: any = null

        const purchaseIdFromMetadata = normalizeWebhookValue(data.metadata?.event_purchase_id)
        if (purchaseIdFromMetadata) {
            const { data: byId } = await (supabase
                .from('event_purchases') as any)
                .select('id, event_id, user_id, email, status, metadata')
                .eq('id', purchaseIdFromMetadata)
                .maybeSingle()
            purchase = byId ?? null
        }

        if (!purchase && eventPurchaseLookupFilters.length > 0) {
            const { data: byProviderRefs } = await (supabase
                .from('event_purchases') as any)
                .select('id, event_id, user_id, email, status, metadata')
                .or(eventPurchaseLookupFilters.join(','))
                .order('purchased_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            purchase = byProviderRefs ?? null
        }

        if (purchase) {
            entityId = purchase.id
            await (supabase
                .from('event_purchases') as any)
                .update({
                    status: 'refunded',
                    metadata: {
                        ...(purchase.metadata ?? {}),
                        refund: refundMetadata.refund,
                    },
                })
                .eq('id', purchase.id)

            const { data: event } = await (supabase
                .from('events') as any)
                .select('id, event_type')
                .eq('id', purchase.event_id)
                .maybeSingle()

            await revokeEventEntitlementsBySourceReference({
                sourceReference: purchase.id,
                sourceType: 'purchase',
                reason: 'stripe_refund',
                metadata: {
                    refund_id: data.refundId,
                    payment_transaction_id: transaction.id,
                },
            })

            if (event) {
                cancelledRegistrations = await cancelEventRegistrationsIfAccessRemoved({
                    supabase,
                    eventId: event.id,
                    eventType: event.event_type,
                    userId: purchase.user_id ?? transaction.user_id ?? transaction.profile_id ?? null,
                    email: purchase.email ?? transaction.email,
                    reason: 'stripe_refund',
                    details: {
                        payment_transaction_id: transaction.id,
                        refund_id: data.refundId,
                    },
                })
            }

            voidedEarnings = await voidSpeakerEarningsForTransaction({
                supabase,
                transactionId: transaction.id,
                reason: 'stripe_refund',
            })
            autoResolved = true
        }
    } else if (transaction.purchase_type === 'formation_purchase') {
        const formationPurchaseLookupFilters = [
            data.paymentIntentId ? `provider_payment_id.eq.${data.paymentIntentId}` : null,
            data.sessionId ? `provider_session_id.eq.${data.sessionId}` : null,
        ].filter(Boolean) as string[]
        let purchase: any = null

        const purchaseIdFromMetadata = normalizeWebhookValue(data.metadata?.formation_purchase_id)
        if (purchaseIdFromMetadata) {
            const { data: byId } = await (supabase
                .from('formation_purchases') as any)
                .select('id, formation_id, user_id, email, status, metadata')
                .eq('id', purchaseIdFromMetadata)
                .maybeSingle()
            purchase = byId ?? null
        }

        if (!purchase && formationPurchaseLookupFilters.length > 0) {
            const { data: byProviderRefs } = await (supabase
                .from('formation_purchases') as any)
                .select('id, formation_id, user_id, email, status, metadata')
                .or(formationPurchaseLookupFilters.join(','))
                .order('purchased_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            purchase = byProviderRefs ?? null
        }

        if (purchase) {
            entityId = purchase.id
            entityType = 'formation_purchase'

            await (supabase
                .from('formation_purchases') as any)
                .update({
                    status: 'refunded',
                    metadata: {
                        ...(purchase.metadata ?? {}),
                        refund: refundMetadata.refund,
                    },
                })
                .eq('id', purchase.id)

            const { data: linkedEvents } = await (supabase
                .from('events') as any)
                .select('id, event_type')
                .eq('formation_id', purchase.formation_id)

            await revokeEventEntitlementsBySourceReference({
                sourceReference: purchase.id,
                sourceType: 'purchase',
                reason: 'stripe_refund',
                metadata: {
                    refund_id: data.refundId,
                    payment_transaction_id: transaction.id,
                },
            })

            cancelledRegistrations = await cancelFormationRegistrationsIfAccessRemoved({
                supabase,
                formationId: purchase.formation_id,
                userId: purchase.user_id ?? transaction.user_id ?? transaction.profile_id ?? null,
                email: purchase.email ?? transaction.email,
                linkedEvents: (linkedEvents ?? []) as Array<{ id: string; event_type?: string | null }>,
                reason: 'stripe_refund',
                details: {
                    payment_transaction_id: transaction.id,
                    refund_id: data.refundId,
                },
            })

            autoResolved = true
        }
    } else {
        entityType = transaction.purchase_type
    }

    const transactionSnapshot =
        typeof transaction.attribution_snapshot === 'string'
            ? parseAttributionSnapshot(transaction.attribution_snapshot)
            : ((transaction.attribution_snapshot ?? emptySnapshot()) as AttributionSnapshot)

    await recordAnalyticsServerEvent({
        eventName: 'payment_refunded',
        eventSource: 'webhook',
        visitorId: transaction.analytics_visitor_id ?? null,
        sessionId: transaction.analytics_session_id ?? null,
        userId: transaction.user_id || transaction.profile_id || null,
        consent: parseTrackingConsentFromMetadata((transaction.metadata ?? {}) as Record<string, unknown>),
        touch: getPrimaryTouch(transactionSnapshot),
        properties: {
            purchaseType: transaction.purchase_type,
            referenceId: transaction.purchase_reference_id ?? referenceId,
            refundId: data.refundId,
            refundedAmount: data.amountRefunded,
        },
    })

    if (!autoResolved) {
        await logCommerceOperationalEvent({
            actionType: 'payment_refund_manual_review_required',
            entityType,
            entityId: entityId ?? transaction.id,
            targetUserId: transaction.user_id || transaction.profile_id || null,
            targetEmail: transaction.email,
            reason: 'refund_not_auto_reconciled',
            details: {
                refundId: data.refundId,
                purchaseType: transaction.purchase_type,
                referenceId: transaction.purchase_reference_id ?? referenceId,
            },
        })
        return
    }

    await logCommerceOperationalEvent({
        actionType: 'payment_refunded',
        entityType,
        entityId: entityId ?? transaction.id,
        targetUserId: transaction.user_id || transaction.profile_id || null,
        targetEmail: transaction.email,
        details: {
            refundId: data.refundId,
            purchaseType: transaction.purchase_type,
            referenceId: transaction.purchase_reference_id ?? referenceId,
            cancelledRegistrations,
            voidedEarnings,
        },
    })
}

export async function reconcileCompletedCheckoutSession(sessionId: string): Promise<boolean> {
    const payment = await retrieveCompletedCheckoutPayment(sessionId)
    if (payment) {
        await fulfillOneTimePayment(payment)
        return true
    }

    const subscription = await retrieveCompletedCheckoutSubscription(sessionId)
    if (!subscription) {
        return false
    }

    await fulfillSubscriptionCreated(subscription)
    return true
}

export { stripeAdapter } from './stripe'
export type * from './types'

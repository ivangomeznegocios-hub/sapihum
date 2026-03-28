// ============================================
// PAYMENT SYSTEM REGISTRY & FULFILLMENT
// ============================================

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
import type { AttributionSnapshot } from '@/lib/analytics/types'
import { grantEventEntitlements } from '@/lib/events/entitlements'
import { sendEmail } from '@/lib/email/index'
import { buildEventPurchaseEmail } from '@/lib/email/templates'
import { syncMembershipEntitlementsForUser } from '@/lib/membership-entitlements'
import { getPlanByPriceId } from './config'
import { stripeAdapter } from './stripe'
import type {
    PaymentProvider,
    PaymentProviderAdapter,
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

function normalizeWebhookValue(value: string | null | undefined) {
    const normalized = value?.trim()
    return normalized ? normalized : null
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
        .select('id, title, event_type, recording_expires_at')
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

    // Send purchase confirmation email
    try {
        const { getAppUrl } = await import('@/lib/config/app-url')
        const appUrl = getAppUrl()
        const isGuest = !params.userId && params.data.metadata?.guest_checkout === 'true'
        const buyerName = purchaseRow?.full_name
            || normalizeWebhookValue(params.data.metadata?.buyer_full_name)
            || customerEmail.split('@')[0]
        const eventDate = event.start_time
            ? new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(event.start_time))
            : 'Por confirmar'

        const emailContent = buildEventPurchaseEmail({
            userName: buyerName,
            eventTitle: event.title,
            eventDate,
            amount: params.data.amount / 100, // Stripe sends in cents
            eventUrl: resolvedUserId
                ? `${appUrl}/dashboard/events/${params.eventId}`
                : `${appUrl}/mi-acceso`,
            isGuest,
            recoveryUrl: `${appUrl}/compras/recuperar`,
        })

        await sendEmail({
            to: customerEmail,
            subject: emailContent.subject,
            html: emailContent.html,
        })
    } catch (emailError) {
        // Non-blocking — purchase is already confirmed
        console.error('[Payment] Failed to send purchase confirmation email:', emailError)
    }

    return { resolvedUserId }
}

export async function fulfillSubscriptionCreated(data: SubscriptionWebhookData): Promise<void> {
    const supabase = getServiceSupabase()
    const analyticsVisitorId = data.metadata?.analytics_visitor_id || null
    const analyticsSessionId = data.metadata?.analytics_session_id || null
    const attributionSnapshot = parseAttributionSnapshot(data.metadata?.attribution_snapshot)

    let profileId: string | null = null
    let userId: string | null = null

    if (data.providerCustomerId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', data.providerCustomerId)
            .single()

        if (profile) {
            profileId = profile.id
            userId = profile.id
        }
    }

    if (!profileId && data.customerEmail) {
        const { data: users } = await supabase.auth.admin.listUsers()
        const user = users?.users?.find((entry) => entry.email === data.customerEmail)
        if (user) {
            userId = user.id
            profileId = user.id

            await supabase
                .from('profiles')
                .update({ stripe_customer_id: data.providerCustomerId })
                .eq('id', profileId)
        }
    }

    if (!profileId || !userId) {
        console.error('[Payment] Could not find user for subscription:', data)
        return
    }

    const membershipLevel = data.membershipLevel || (data.priceId ? getPlanByPriceId(data.priceId)?.membershipLevel : null) || 0
    const specializationCode =
        data.specializationCode || (data.priceId ? getPlanByPriceId(data.priceId)?.specializationCode : null) || null

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

    await recordAnalyticsServerEvent({
        eventName: 'subscription_created',
        eventSource: 'webhook',
        visitorId: analyticsVisitorId,
        sessionId: analyticsSessionId,
        userId,
        touch: getPrimaryTouch(attributionSnapshot),
        properties: {
            providerSubscriptionId: data.providerSubscriptionId,
            membershipLevel,
            specializationCode,
        },
    })
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

    const renewalSnapshot = ((subscriptionRow as any)?.attribution_snapshot ?? emptySnapshot()) as AttributionSnapshot

    await recordAnalyticsServerEvent({
        eventName: 'subscription_renewed',
        eventSource: 'webhook',
        visitorId: (subscriptionRow as any)?.analytics_visitor_id ?? null,
        sessionId: (subscriptionRow as any)?.analytics_session_id ?? null,
        userId: sub.profile_id,
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
            .select('profile_id')
            .eq('provider_subscription_id', data.providerSubscriptionId)
            .single()

        if (sub?.profile_id) {
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

    if (eventName && subscriptionRow) {
        const snapshot = ((subscriptionRow as any).attribution_snapshot ?? emptySnapshot()) as AttributionSnapshot
        await recordAnalyticsServerEvent({
            eventName,
            eventSource: 'webhook',
            visitorId: (subscriptionRow as any).analytics_visitor_id ?? null,
            sessionId: (subscriptionRow as any).analytics_session_id ?? null,
            userId: (subscriptionRow as any).user_id ?? null,
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

    if (!existingTransaction) {
        await supabase.from('payment_transactions').insert({
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
    }

    await recordAnalyticsServerEvent({
        eventName: 'payment_completed',
        eventSource: 'webhook',
        visitorId: analyticsVisitorId,
        sessionId: analyticsSessionId,
        userId: resolvedFulfillmentUserId,
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
            touch: getPrimaryTouch(attributionSnapshot),
            properties: {
                packageKey: referenceId || null,
                amount: data.amount,
                minutes: Number(data.metadata?.minutes || 0),
            },
        })
    }
}

export { stripeAdapter } from './stripe'
export type * from './types'

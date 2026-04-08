// POST /api/payments/checkout
// Creates a Stripe Checkout Session for one-time payments (AI credits, events)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent, resolveAttributionSnapshot } from '@/lib/analytics/server'
import { getAppUrl } from '@/lib/config/app-url'
import { getPaymentProvider } from '@/lib/payments'
import { compactAttributionSnapshotForStripe } from '@/lib/payments/stripe-metadata'
import { AI_CREDIT_PACKAGES, type AICreditPackageKey } from '@/lib/payments/config'
import {
    getEffectiveEventPriceForProfile,
    isPurchasableRecordingEvent,
    normalizeMemberAccessType,
} from '@/lib/events/pricing'
import { getActiveEntitlementForEvent } from '@/lib/events/access'
import { getUniqueEventAccessCount } from '@/lib/events/attendance'
import { getEventGrantAccessKinds } from '@/lib/events/entitlements'
import { audienceAllowsAccess, getCommercialAccessContext } from '@/lib/access/commercial'
import { getFormationCommercialState } from '@/lib/formations/pricing'
import { createConfirmedFormationPurchaseAndGrantAccess } from '@/lib/formations/service'
import { sendFormationPurchaseConfirmation } from '@/lib/payments/commerce'
import { createServiceClient } from '@/lib/supabase/service'

const EVENT_CHECKOUT_RESERVATION_MINUTES = 30

function isUuid(value: string | null | undefined): value is string {
    return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function guestCanAccessEventCheckout(event: any) {
    const audience = Array.isArray(event.target_audience) ? event.target_audience : ['public']
    const isRecordedProduct = isPurchasableRecordingEvent(event)
    return audience.includes('public') || isRecordedProduct
}

function normalizeCheckoutEmail(email: string) {
    return email.trim().toLowerCase()
}

function isFutureIsoDate(value: string | null | undefined) {
    if (!value) return false
    const timestamp = new Date(value).getTime()
    return Number.isFinite(timestamp) && timestamp > Date.now()
}

function isInvalidStripeCustomerMessage(message: string) {
    return message.includes('No such customer') || message.includes('customer')
}

type ReservedEventCheckoutPurchase = {
    purchaseId: string
    reservationState: 'created' | 'reused'
    checkoutSessionId: string | null
    checkoutSessionExpiresAt: string | null
    checkoutUrl: string | null
}

async function reserveEventCheckoutPurchase(params: {
    eventId: string
    email: string
    userId?: string | null
    fullName?: string | null
    amount: number
    analyticsContext?: any
    attributionSnapshot?: any
    enforceCapacity: boolean
}) {
    const db = createServiceClient()
    const analyticsVisitorId = isUuid(params.analyticsContext?.visitorId) ? params.analyticsContext.visitorId : null
    const analyticsSessionId = isUuid(params.analyticsContext?.sessionId) ? params.analyticsContext.sessionId : null

    const { data, error } = await (db as any).rpc('reserve_event_checkout_purchase', {
        p_event_id: params.eventId,
        p_email: normalizeCheckoutEmail(params.email),
        p_user_id: params.userId ?? null,
        p_full_name: params.fullName ?? null,
        p_amount_paid: params.amount,
        p_currency: 'MXN',
        p_payment_method: 'card',
        p_analytics_visitor_id: analyticsVisitorId,
        p_analytics_session_id: analyticsSessionId,
        p_attribution_snapshot: params.attributionSnapshot ?? {},
        p_metadata: {
            analytics: params.analyticsContext ?? null,
            attribution_snapshot: params.attributionSnapshot ?? null,
        },
        p_enforce_capacity: params.enforceCapacity,
    })

    if (error) {
        if (error.message.includes('EVENT_CAPACITY_REACHED')) {
            return { error: 'El evento ya alcanzo su cupo' as const }
        }

        throw new Error(`No fue posible reservar la compra del evento: ${error.message}`)
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row?.purchase_id) {
        throw new Error('No fue posible reservar la compra del evento')
    }

    return {
        purchase: {
            purchaseId: row.purchase_id as string,
            reservationState: row.reservation_state as 'created' | 'reused',
            checkoutSessionId: (row.checkout_session_id as string | null) ?? null,
            checkoutSessionExpiresAt: (row.checkout_session_expires_at as string | null) ?? null,
            checkoutUrl: (row.checkout_url as string | null) ?? null,
        } satisfies ReservedEventCheckoutPurchase,
    }
}

async function syncPendingEventCheckoutPurchase(params: {
    purchaseId: string
    userId?: string | null
    email: string
    fullName?: string | null
    amount: number
    sessionId: string
    checkoutUrl: string
    checkoutExpiresAt?: string
    analyticsContext?: any
    attributionSnapshot?: any
}) {
    const db = createServiceClient()
    const normalizedEmail = normalizeCheckoutEmail(params.email)
    const analyticsVisitorId = isUuid(params.analyticsContext?.visitorId) ? params.analyticsContext.visitorId : null
    const analyticsSessionId = isUuid(params.analyticsContext?.sessionId) ? params.analyticsContext.sessionId : null

    const { data: existingPurchase, error: existingPurchaseError } = await (db
        .from('event_purchases') as any)
        .select('metadata')
        .eq('id', params.purchaseId)
        .single()

    if (existingPurchaseError) {
        throw new Error(`No fue posible leer la compra pendiente: ${existingPurchaseError.message}`)
    }

    const mergedMetadata = {
        ...(existingPurchase?.metadata ?? {}),
        analytics: params.analyticsContext ?? existingPurchase?.metadata?.analytics ?? null,
        attribution_snapshot: params.attributionSnapshot ?? existingPurchase?.metadata?.attribution_snapshot ?? null,
        checkout_url: params.checkoutUrl,
        checkout_session_id: params.sessionId,
        checkout_session_expires_at: params.checkoutExpiresAt ?? null,
        checkout_prepared_at: new Date().toISOString(),
    }

    const { error } = await (db
        .from('event_purchases') as any)
        .update({
            user_id: params.userId ?? null,
            email: normalizedEmail,
            full_name: params.fullName ?? null,
            amount_paid: params.amount,
            currency: 'MXN',
            payment_method: 'card',
            provider_session_id: params.sessionId,
            checkout_session_expires_at: params.checkoutExpiresAt ?? null,
            analytics_visitor_id: analyticsVisitorId,
            analytics_session_id: analyticsSessionId,
            attribution_snapshot: params.attributionSnapshot ?? {},
            metadata: mergedMetadata,
            purchased_at: new Date().toISOString(),
            status: 'pending',
        })
        .eq('id', params.purchaseId)

    if (error) {
        throw new Error(`No fue posible sincronizar la compra pendiente: ${error.message}`)
    }
}

async function cancelPendingEventCheckoutPurchase(params: {
    purchaseId: string
    reason: string
}) {
    const db = createServiceClient()

    const { data: existingPurchase } = await (db
        .from('event_purchases') as any)
        .select('metadata, status')
        .eq('id', params.purchaseId)
        .maybeSingle()

    if (!existingPurchase || existingPurchase.status !== 'pending') {
        return
    }

    const { error } = await (db
        .from('event_purchases') as any)
        .update({
            status: 'cancelled',
            checkout_session_expires_at: null,
            metadata: {
                ...(existingPurchase.metadata ?? {}),
                cancelled_reason: params.reason,
                cancelled_at: new Date().toISOString(),
            },
        })
        .eq('id', params.purchaseId)
        .eq('status', 'pending')

    if (error) {
        console.error('[API] Failed to cancel pending event purchase:', error)
    }
}

async function resolveEventPurchaseDetails(
    supabase: any,
    params: {
        eventId: string
        userId?: string | null
        guestEmail?: string | null
    }
) {
    const { data: event } = await (supabase
        .from('events') as any)
        .select('id, slug, title, price, member_price, member_access_type, specialization_code, target_audience, status, created_by, recording_url, recording_expires_at, event_type, max_attendees')
        .eq('id', params.eventId)
        .single()

    if (!event) {
        return { error: 'Evento no encontrado' as const }
    }

    if (event.status === 'draft' || event.status === 'cancelled') {
        return { error: 'El evento no esta disponible para compra' as const }
    }

    const canBuyRecordedAccess = isPurchasableRecordingEvent(event)

    if (event.max_attendees && !canBuyRecordedAccess) {
        const attendeeCount = await getUniqueEventAccessCount(supabase, params.eventId)
        if (attendeeCount >= event.max_attendees) {
            return { error: 'El evento ya alcanzó su cupo' as const }
        }
    }

    if (params.userId) {
        const { data: profile } = await (supabase
            .from('profiles') as any)
            .select('role, membership_level, subscription_status, email, membership_specialization_code')
            .eq('id', params.userId)
            .single()

        if (!profile) {
            return { error: 'Perfil no encontrado' as const }
        }

        if (profile.role === 'admin' || event.created_by === params.userId) {
            return { error: 'No necesitas checkout para este evento' as const }
        }

        const commercialAccess = await getCommercialAccessContext({
            supabase,
            userId: params.userId,
            profile,
        })
        if (!commercialAccess) {
            return { error: 'No fue posible resolver el acceso comercial de esta cuenta' as const }
        }
        const hasAccess =
            isPurchasableRecordingEvent(event) ||
            audienceAllowsAccess(event.target_audience, commercialAccess, { creatorId: event.created_by })

        if (!hasAccess) {
            return { error: 'No tienes acceso a este evento' as const }
        }

        const existingEntitlement = profile.email
            ? await getActiveEntitlementForEvent({
                supabase,
                eventId: params.eventId,
                userId: params.userId,
                email: profile.email,
                allowedAccessKinds: getEventGrantAccessKinds(event),
            })
            : null

        const { data: existingRegistration } = await (supabase
            .from('event_registrations') as any)
            .select('id')
            .eq('event_id', params.eventId)
            .eq('user_id', params.userId)
            .eq('status', 'registered')
            .maybeSingle()

        if (existingRegistration || existingEntitlement) {
            return { error: 'Ya estas registrado en este evento' as const }
        }

        const amount = getEffectiveEventPriceForProfile(
            {
                price: event.price,
                member_price: event.member_price,
                member_access_type: normalizeMemberAccessType(event.member_access_type),
                specialization_code: event.specialization_code,
            },
            {
                role: profile.role,
                membershipLevel: commercialAccess.membershipLevel,
                hasActiveMembership: commercialAccess.hasActiveMembership,
                membershipSpecializationCode: commercialAccess.membershipSpecializationCode,
            }
        )

        if (amount <= 0 && !canBuyRecordedAccess) {
            return { error: 'Este evento no requiere pago. Usa el registro gratuito.' as const }
        }

        return {
            amount,
            description: `${canBuyRecordedAccess ? 'Acceso a' : 'Registro a'}: ${event.title}`,
            referenceId: event.id,
            event,
        }
    }

    if (!params.guestEmail) {
        return { error: 'No autenticado', requiresGuestDetails: true as const }
    }

    if (!guestCanAccessEventCheckout(event)) {
        return { error: 'Este activo no permite compra publica individual' as const }
    }

    const normalizedGuestEmail = params.guestEmail.trim().toLowerCase()
    const existingGuestEntitlement = await getActiveEntitlementForEvent({
        supabase,
        eventId: params.eventId,
        email: normalizedGuestEmail,
        allowedAccessKinds: getEventGrantAccessKinds(event),
    })

    const { data: existingGuestPurchase } = await (supabase
        .from('event_purchases') as any)
        .select('id')
        .eq('event_id', params.eventId)
        .eq('email', normalizedGuestEmail)
        .eq('status', 'confirmed')
        .maybeSingle()

    if (existingGuestEntitlement || existingGuestPurchase) {
        return { error: 'Este correo ya tiene acceso a este evento' as const }
    }

    const amount = Number(event.price || 0)
    if (amount <= 0 && !canBuyRecordedAccess) {
        return { error: 'Este evento no requiere pago. Usa el acceso gratuito.' as const }
    }

    return {
        amount,
        description: `${canBuyRecordedAccess ? 'Acceso a' : 'Registro a'}: ${event.title}`,
        referenceId: event.id,
        event,
    }
}

async function resolveFormationPurchaseDetails(
    supabase: any,
    params: {
        formationId: string
        userId?: string | null
        guestEmail?: string | null
    }
) {
    const { data: formation } = await (supabase
        .from('formations') as any)
        .select('*')
        .eq('id', params.formationId)
        .single()

    if (!formation) {
        return { error: 'Formación no encontrada' as const }
    }

    if (formation.status !== 'active') {
        return { error: 'Esta formación ya no está disponible' as const }
    }

    if (params.userId) {
        const { data: profile } = await (supabase
            .from('profiles') as any)
            .select('role, membership_level, subscription_status, email')
            .eq('id', params.userId)
            .single()

        if (!profile) {
            return { error: 'Perfil no encontrado' as const }
        }

        const normalizedEmail = profile.email?.trim().toLowerCase() || null
        const purchaseQuery = (supabase
            .from('formation_purchases') as any)
            .select('id')
            .eq('formation_id', params.formationId)
            .eq('status', 'confirmed')
            .not('confirmed_at', 'is', null)

        const { data: existingPurchase } = normalizedEmail
            ? await purchaseQuery.or(`user_id.eq.${params.userId},email.eq.${normalizedEmail}`).maybeSingle()
            : await purchaseQuery.eq('user_id', params.userId).maybeSingle()

        if (existingPurchase) {
            return { error: 'Ya has adquirido esta formación completa' as const }
        }

        const commercialAccess = await getCommercialAccessContext({
            supabase,
            userId: params.userId,
            profile,
        })
        if (!commercialAccess) {
            return { error: 'No fue posible resolver el acceso comercial de esta cuenta' as const }
        }
        const pricing = getFormationCommercialState(formation, {
            membershipLevel: commercialAccess?.membershipLevel ?? 0,
            hasActiveMembership: commercialAccess?.hasActiveMembership ?? false,
            membershipSpecializationCode: commercialAccess?.membershipSpecializationCode ?? null,
        })

        return {
            amount: pricing.effectivePrice,
            description: `Acceso a Formación: ${formation.title}`,
            referenceId: formation.id,
            formation,
            requiresPayment: pricing.needsPayment,
            pricing,
        }
    }

    if (!params.guestEmail) {
        return { error: 'No autenticado', requiresGuestDetails: true as const }
    }

    const normalizedGuestEmail = params.guestEmail.trim().toLowerCase()
    const { data: existingGuestPurchase } = await (supabase
        .from('formation_purchases') as any)
        .select('id')
        .eq('formation_id', params.formationId)
        .eq('email', normalizedGuestEmail)
        .eq('status', 'confirmed')
        .not('confirmed_at', 'is', null)
        .maybeSingle()

    if (existingGuestPurchase) {
        return { error: 'Este correo ya tiene acceso a la formaci\u00F3n completa' as const }
    }

    const amount = Number(formation.bundle_price || 0)
    if (amount < 0) {
        return { error: 'Esta formación no requiere pago. Inicia sesión.' as const }
    }

    return {
        amount,
        description: `Acceso a Formación: ${formation.title}`,
        referenceId: formation.id,
        formation,
        requiresPayment: amount > 0,
        pricing: {
            publicPrice: amount,
            effectivePrice: amount,
            needsPayment: amount > 0,
            complimentaryByMembership: false,
            discountedByMembership: false,
        },
    }
}

async function createPendingFormationPurchase(params: {
    formationId: string
    userId?: string | null
    email: string
    fullName?: string | null
    amount: number
    analyticsContext?: any
    attributionSnapshot?: any
}) {
    const db = createServiceClient()
    const purchaseId = crypto.randomUUID()
    const normalizedEmail = params.email.trim().toLowerCase()

    const { error } = await (db
        .from('formation_purchases') as any)
        .insert({
            id: purchaseId,
            formation_id: params.formationId,
            user_id: params.userId ?? null,
            email: normalizedEmail,
            full_name: params.fullName ?? null,
            amount_paid: params.amount,
            currency: 'MXN',
            status: 'pending',
            metadata: {
                analytics: params.analyticsContext ?? null,
                attribution_snapshot: params.attributionSnapshot ?? null,
                full_name: params.fullName ?? null,
            },
        })

    if (error) {
        throw new Error(error.message)
    }

    return purchaseId
}

async function syncPendingFormationPurchase(params: {
    purchaseId: string
    userId?: string | null
    email: string
    fullName?: string | null
    amount: number
    sessionId: string
    checkoutUrl: string
    analyticsContext?: any
    attributionSnapshot?: any
}) {
    const db = createServiceClient()
    const normalizedEmail = params.email.trim().toLowerCase()

    const { data: existingPurchase, error: existingPurchaseError } = await (db
        .from('formation_purchases') as any)
        .select('metadata')
        .eq('id', params.purchaseId)
        .single()

    if (existingPurchaseError) {
        throw new Error(`No fue posible leer la compra pendiente: ${existingPurchaseError.message}`)
    }

    const mergedMetadata = {
        ...(existingPurchase?.metadata ?? {}),
        analytics: params.analyticsContext ?? existingPurchase?.metadata?.analytics ?? null,
        attribution_snapshot: params.attributionSnapshot ?? existingPurchase?.metadata?.attribution_snapshot ?? null,
        checkout_url: params.checkoutUrl,
        checkout_session_id: params.sessionId,
        checkout_prepared_at: new Date().toISOString(),
    }

    const { error } = await (db
        .from('formation_purchases') as any)
        .update({
            user_id: params.userId ?? null,
            email: normalizedEmail,
            full_name: params.fullName ?? null,
            amount_paid: params.amount,
            currency: 'MXN',
            provider_session_id: params.sessionId,
            metadata: mergedMetadata,
            purchased_at: new Date().toISOString(),
            status: 'pending',
        })
        .eq('id', params.purchaseId)

    if (error) {
        throw new Error(`No fue posible sincronizar la compra pendiente: ${error.message}`)
    }
}

async function cancelPendingFormationPurchase(params: {
    purchaseId: string
    reason: string
}) {
    const db = createServiceClient()

    const { data: existingPurchase } = await (db
        .from('formation_purchases') as any)
        .select('metadata, status')
        .eq('id', params.purchaseId)
        .maybeSingle()

    if (!existingPurchase || existingPurchase.status !== 'pending') {
        return
    }

    const { error } = await (db
        .from('formation_purchases') as any)
        .update({
            status: 'cancelled',
            metadata: {
                ...(existingPurchase.metadata ?? {}),
                cancelled_reason: params.reason,
                cancelled_at: new Date().toISOString(),
            },
        })
        .eq('id', params.purchaseId)
        .eq('status', 'pending')

    if (error) {
        console.error('[API] Failed to cancel pending formation purchase:', error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const body = await request.json()
        const { purchaseType, packageKey, eventId, formationId, analyticsContext, email, fullName } = body as {
            purchaseType?: string
            packageKey?: AICreditPackageKey
            eventId?: string
            formationId?: string
            analyticsContext?: any
            email?: string
            fullName?: string
        }

        if (!purchaseType) {
            return NextResponse.json({ error: 'Tipo de compra requerido' }, { status: 400 })
        }

        if (!user && purchaseType !== 'event_purchase' && purchaseType !== 'formation_purchase') {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const profile = user
            ? await (supabase as any)
                .from('profiles')
                .select('id, stripe_customer_id, email, full_name')
                .eq('id', user.id)
                .single()
            : { data: null }

        if (user && !profile.data) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
        }

        const appUrl = getAppUrl()
        const provider = getPaymentProvider('stripe')
        const attributionSnapshot = await resolveAttributionSnapshot(analyticsContext)

        let checkoutAmount: number
        let checkoutDescription: string
        let referenceId = ''
        let metadata: Record<string, string> = {}
        let successUrl = `${appUrl}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`
        let cancelUrl = `${appUrl}/dashboard/payment-cancelled`
        const customerEmail = user?.email || profile.data?.email || email || ''
        let customerId = profile.data?.stripe_customer_id || undefined
        let pendingEventPurchaseId = ''
        let pendingFormationPurchaseId = ''
        let checkoutExpiresAt: string | undefined

        if (purchaseType === 'ai_credits') {
            const pkg = AI_CREDIT_PACKAGES[packageKey as AICreditPackageKey]
            if (!pkg) {
                return NextResponse.json({ error: 'Paquete no valido' }, { status: 400 })
            }
            checkoutAmount = pkg.priceMXN
            checkoutDescription = `${pkg.label} - ${pkg.minutes} minutos de IA`
            referenceId = packageKey as string
            metadata = { minutes: String(pkg.minutes) }
        } else if (purchaseType === 'event_purchase') {
            if (!eventId) {
                return NextResponse.json({ error: 'Datos del evento requeridos' }, { status: 400 })
            }

            const resolvedEventPurchase = await resolveEventPurchaseDetails(supabase, {
                eventId,
                userId: user?.id,
                guestEmail: email ?? null,
            })

            if ('error' in resolvedEventPurchase) {
                const statusCode = resolvedEventPurchase.requiresGuestDetails ? 401 : 400
                return NextResponse.json(
                    {
                        error: resolvedEventPurchase.error,
                        requiresGuestDetails: Boolean(resolvedEventPurchase.requiresGuestDetails),
                    },
                    { status: statusCode }
                )
            }

            checkoutAmount = resolvedEventPurchase.amount
            checkoutDescription = resolvedEventPurchase.description
            referenceId = resolvedEventPurchase.referenceId

            if (!customerEmail) {
                return NextResponse.json(
                    { error: 'Correo requerido para continuar', requiresGuestDetails: true },
                    { status: 401 }
                )
            }

            const reservation = await reserveEventCheckoutPurchase({
                eventId,
                userId: user?.id ?? null,
                email: customerEmail,
                fullName: fullName || profile.data?.full_name || null,
                amount: checkoutAmount,
                analyticsContext,
                attributionSnapshot,
                enforceCapacity: !isPurchasableRecordingEvent(resolvedEventPurchase.event),
            })

            if ('error' in reservation) {
                return NextResponse.json(
                    { error: reservation.error },
                    { status: 409 }
                )
            }

            if (
                reservation.purchase.reservationState === 'reused'
                && reservation.purchase.checkoutUrl
                && isFutureIsoDate(reservation.purchase.checkoutSessionExpiresAt)
            ) {
                return NextResponse.json({
                    checkoutUrl: reservation.purchase.checkoutUrl,
                    sessionId: reservation.purchase.checkoutSessionId,
                    reused: true,
                })
            }

            pendingEventPurchaseId = reservation.purchase.purchaseId
            checkoutExpiresAt = new Date(Date.now() + EVENT_CHECKOUT_RESERVATION_MINUTES * 60_000).toISOString()

            metadata = {
                event_purchase_id: pendingEventPurchaseId,
                buyer_full_name: fullName || profile.data?.full_name || '',
            }

            if (!user) {
                successUrl = `${appUrl}/compras/exito?session_id={CHECKOUT_SESSION_ID}&slug=${resolvedEventPurchase.event.slug}`
                cancelUrl = `${appUrl}/compras/cancelada?slug=${resolvedEventPurchase.event.slug}`
                customerId = undefined
            }
        } else if (purchaseType === 'formation_purchase') {
            if (!formationId) {
                return NextResponse.json({ error: 'Datos de la formación requeridos' }, { status: 400 })
            }

            const resolvedFormationPurchase = await resolveFormationPurchaseDetails(supabase, {
                formationId,
                userId: user?.id,
                guestEmail: email ?? null,
            })

            if ('error' in resolvedFormationPurchase) {
                const statusCode = resolvedFormationPurchase.requiresGuestDetails ? 401 : 400
                return NextResponse.json(
                    {
                        error: resolvedFormationPurchase.error,
                        requiresGuestDetails: Boolean(resolvedFormationPurchase.requiresGuestDetails),
                    },
                    { status: statusCode }
                )
            }

            checkoutAmount = resolvedFormationPurchase.amount
            checkoutDescription = resolvedFormationPurchase.description
            referenceId = resolvedFormationPurchase.referenceId

            if (!customerEmail) {
                return NextResponse.json(
                    { error: 'Correo requerido para continuar', requiresGuestDetails: true },
                    { status: 401 }
                )
            }

            if (!resolvedFormationPurchase.requiresPayment) {
                try {
                    const purchaseId = await createConfirmedFormationPurchaseAndGrantAccess({
                        supabase: createServiceClient(),
                        formationId,
                        userId: user?.id ?? null,
                        email: customerEmail,
                        fullName: fullName || profile.data?.full_name || null,
                        amountPaid: 0,
                        currency: 'MXN',
                        paymentReference: `formation-free-${crypto.randomUUID()}`,
                        metadata: {
                            analytics: analyticsContext ?? null,
                            attribution_snapshot: attributionSnapshot ?? null,
                            pricing: resolvedFormationPurchase.pricing,
                            source: 'free_formation_access',
                        },
                        source: 'formation_free_access',
                    })

                    try {
                        await sendFormationPurchaseConfirmation({
                            email: customerEmail,
                            formationTitle: resolvedFormationPurchase.formation.title,
                            amount: 0,
                            isGuest: !user,
                            purchaseId,
                            userId: user?.id ?? null,
                            userName: fullName || profile.data?.full_name || null,
                        })
                    } catch (emailError) {
                        console.error('[API] Failed to send formation access confirmation email:', emailError)
                    }
                } catch (purchaseError) {
                    console.error('[API] Failed to grant direct formation access:', purchaseError)
                    return NextResponse.json(
                        { error: 'No fue posible activar la formaci\u00F3n. Intenta de nuevo.' },
                        { status: 500 }
                    )
                }

                const redirectTo = user
                    ? `/dashboard/payment-success?kind=formation&formation_id=${resolvedFormationPurchase.formation.id}`
                    : `/compras/exito?kind=formation&slug=${resolvedFormationPurchase.formation.slug}`

                return NextResponse.json({ redirectTo })
            }

            try {
                pendingFormationPurchaseId = await createPendingFormationPurchase({
                    formationId,
                    userId: user?.id ?? null,
                    email: customerEmail,
                    fullName: fullName || profile.data?.full_name || null,
                    amount: checkoutAmount,
                    analyticsContext,
                    attributionSnapshot,
                })
            } catch (purchaseError) {
                console.error('[API] Failed to create pending formation purchase:', purchaseError)
                return NextResponse.json(
                    { error: 'No fue posible iniciar la compra. Intenta de nuevo.' },
                    { status: 500 }
                )
            }

            metadata = {
                formation_purchase_id: pendingFormationPurchaseId,
                buyer_full_name: fullName || profile.data?.full_name || '',
            }

            successUrl = `${appUrl}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}&kind=formation&formation_id=${resolvedFormationPurchase.formation.id}`
            cancelUrl = `${appUrl}/dashboard/payment-cancelled?kind=formation&formation_id=${resolvedFormationPurchase.formation.id}`

            if (!user) {
                successUrl = `${appUrl}/compras/exito?session_id={CHECKOUT_SESSION_ID}&kind=formation&slug=${resolvedFormationPurchase.formation.slug}`
                cancelUrl = `${appUrl}/compras/cancelada?kind=formation&slug=${resolvedFormationPurchase.formation.slug}`
                customerId = undefined
            }
        } else {
            return NextResponse.json({ error: 'Tipo de compra no valido' }, { status: 400 })
        }

        if (checkoutAmount <= 0) {
            const noPaymentMessage =
                purchaseType === 'formation_purchase'
                    ? 'Esta formacion no requiere pago. Activa el acceso directo.'
                    : 'Este evento no requiere pago. Usa el registro gratuito.'

            return NextResponse.json(
                { error: noPaymentMessage },
                { status: 400 }
            )
        }

        await recordAnalyticsServerEvent({
            eventName: 'checkout_started',
            eventSource: 'server',
            visitorId: analyticsContext?.visitorId ?? null,
            sessionId: analyticsContext?.sessionId ?? null,
            userId: user?.id ?? null,
            touch: (analyticsContext?.touch as any) ?? {
                funnel: purchaseType === 'event_purchase' ? 'event' : purchaseType === 'formation_purchase' ? 'formation' : 'ai_credits',
            },
            properties: {
                purchaseType,
                eventId: eventId ?? null,
                formationId: formationId ?? null,
                packageKey: packageKey ?? null,
                amount: checkoutAmount,
                guestCheckout: !user,
            },
        })

        const checkoutMetadata = {
            ...metadata,
            analytics_visitor_id: analyticsContext?.visitorId ?? '',
            analytics_session_id: analyticsContext?.sessionId ?? '',
            attribution_snapshot: compactAttributionSnapshotForStripe(attributionSnapshot),
            guest_checkout: user ? 'false' : 'true',
            guest_email: user ? '' : customerEmail,
        }

        // Attempt Stripe checkout, retry without customerId if customer is invalid
        let result
        try {
            try {
                result = await provider.createOneTimeCheckout({
                    purchaseType: purchaseType as 'ai_credits' | 'event_purchase' | 'formation_purchase',
                    amount: checkoutAmount,
                    customerEmail,
                    customerId,
                    userId: user?.id,
                    profileId: profile.data?.id,
                    description: checkoutDescription,
                    referenceId,
                    metadata: checkoutMetadata,
                    successUrl,
                    cancelUrl,
                    checkoutExpiresAt,
                })
            } catch (stripeError: any) {
                const msg = stripeError?.message || ''
                if (customerId && isInvalidStripeCustomerMessage(msg)) {
                    console.warn('[API] Invalid stripe_customer_id, clearing and retrying:', customerId)
                    if (profile.data?.id) {
                        await (createServiceClient() as any)
                            .from('profiles')
                            .update({ stripe_customer_id: null })
                            .eq('id', profile.data.id)
                    }

                    result = await provider.createOneTimeCheckout({
                        purchaseType: purchaseType as 'ai_credits' | 'event_purchase' | 'formation_purchase',
                        amount: checkoutAmount,
                        customerEmail,
                        customerId: undefined,
                        userId: user?.id,
                        profileId: profile.data?.id,
                        description: checkoutDescription,
                        referenceId,
                        metadata: checkoutMetadata,
                        successUrl,
                        cancelUrl,
                        checkoutExpiresAt,
                    })
                } else {
                    throw stripeError
                }
            }
        } catch (stripeError: any) {
            if (pendingEventPurchaseId) {
                await cancelPendingEventCheckoutPurchase({
                    purchaseId: pendingEventPurchaseId,
                    reason: 'checkout_session_creation_failed',
                })
            }

            if (pendingFormationPurchaseId) {
                await cancelPendingFormationPurchase({
                    purchaseId: pendingFormationPurchaseId,
                    reason: 'checkout_session_creation_failed',
                })
            }

            throw stripeError
        }

        if (purchaseType === 'event_purchase' && pendingEventPurchaseId) {
            try {
                await syncPendingEventCheckoutPurchase({
                    purchaseId: pendingEventPurchaseId,
                    userId: user?.id ?? null,
                    email: customerEmail,
                    fullName: fullName || profile.data?.full_name || null,
                    amount: checkoutAmount,
                    sessionId: result.sessionId,
                    checkoutUrl: result.checkoutUrl,
                    checkoutExpiresAt: result.expiresAt ?? checkoutExpiresAt,
                    analyticsContext,
                    attributionSnapshot,
                })
            } catch (syncError) {
                await cancelPendingEventCheckoutPurchase({
                    purchaseId: pendingEventPurchaseId,
                    reason: 'checkout_session_sync_failed',
                })

                throw syncError
            }
        }

        if (purchaseType === 'formation_purchase' && pendingFormationPurchaseId) {
            try {
                await syncPendingFormationPurchase({
                    purchaseId: pendingFormationPurchaseId,
                    userId: user?.id ?? null,
                    email: customerEmail,
                    fullName: fullName || profile.data?.full_name || null,
                    amount: checkoutAmount,
                    sessionId: result.sessionId,
                    checkoutUrl: result.checkoutUrl,
                    analyticsContext,
                    attributionSnapshot,
                })
            } catch (syncError) {
                await cancelPendingFormationPurchase({
                    purchaseId: pendingFormationPurchaseId,
                    reason: 'checkout_session_sync_failed',
                })

                throw syncError
            }
        }

        return NextResponse.json({
            checkoutUrl: result.checkoutUrl,
            sessionId: result.sessionId,
        })
    } catch (error) {
        console.error('[API] Checkout error:', error)
        return NextResponse.json(
            { error: 'Error al crear sesion de pago' },
            { status: 500 }
        )
    }
}

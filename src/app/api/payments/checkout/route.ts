// POST /api/payments/checkout
// Creates a Stripe Checkout Session for one-time payments (AI credits, events)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent, resolveAttributionSnapshot } from '@/lib/analytics/server'
import { getAppUrl } from '@/lib/config/app-url'
import { getPaymentProvider } from '@/lib/payments'
import { AI_CREDIT_PACKAGES, type AICreditPackageKey } from '@/lib/payments/config'
import {
    getEffectiveEventPriceForProfile,
    isPurchasableRecordingEvent,
    normalizeMemberAccessType,
} from '@/lib/events/pricing'
import { getActiveEntitlementForEvent } from '@/lib/events/access'
import { getUniqueEventAccessCount } from '@/lib/events/attendance'

async function userCanAccessEventCheckout(
    supabase: any,
    userId: string,
    profile: { role: string; membership_level: number | null },
    event: any
) {
    const audience = Array.isArray(event.target_audience) ? event.target_audience : ['public']
    const isRecordedProduct = isPurchasableRecordingEvent(event)

    if (audience.includes('public')) return true
    if (profile.role === 'admin') return true
    if (isRecordedProduct) return true
    if (audience.includes('members') && (profile.membership_level ?? 0) >= 1) return true
    if (audience.includes('psychologists') && profile.role === 'psychologist') return true
    if (audience.includes('patients') && profile.role === 'patient') return true

    if (audience.includes('active_patients') && profile.role === 'patient') {
        const { data: relationship } = await (supabase
            .from('patient_psychologist_relationships') as any)
            .select('id')
            .eq('patient_id', userId)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()

        return Boolean(relationship)
    }

    return false
}

function guestCanAccessEventCheckout(event: any) {
    const audience = Array.isArray(event.target_audience) ? event.target_audience : ['public']
    const isRecordedProduct = isPurchasableRecordingEvent(event)
    return audience.includes('public') || isRecordedProduct
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
        .select('id, slug, title, price, member_price, member_access_type, target_audience, status, created_by, recording_url, recording_expires_at, event_type, max_attendees')
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
            .select('role, membership_level, email')
            .eq('id', params.userId)
            .single()

        if (!profile) {
            return { error: 'Perfil no encontrado' as const }
        }

        if (profile.role === 'admin' || event.created_by === params.userId) {
            return { error: 'No necesitas checkout para este evento' as const }
        }

        const hasAccess = await userCanAccessEventCheckout(supabase, params.userId, profile, event)
        if (!hasAccess) {
            return { error: 'No tienes acceso a este evento' as const }
        }

        const existingEntitlement = profile.email
            ? await getActiveEntitlementForEvent({
                supabase,
                eventId: params.eventId,
                userId: params.userId,
                email: profile.email,
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
            },
            profile.role,
            profile.membership_level ?? 0
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

async function createPendingEventPurchase(params: {
    supabase: any
    eventId: string
    userId?: string | null
    email: string
    fullName?: string | null
    amount: number
    analyticsContext?: any
}) {
    const { data, error } = await (params.supabase
        .from('event_purchases') as any)
        .insert({
            event_id: params.eventId,
            user_id: params.userId ?? null,
            email: params.email.toLowerCase(),
            full_name: params.fullName ?? null,
            amount_paid: params.amount,
            currency: 'MXN',
            payment_method: 'card',
            status: 'pending',
            metadata: {
                analytics: params.analyticsContext ?? null,
            },
        })
        .select('id')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data.id as string
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const body = await request.json()
        const { purchaseType, packageKey, eventId, analyticsContext, email, fullName } = body as {
            purchaseType?: string
            packageKey?: AICreditPackageKey
            eventId?: string
            analyticsContext?: any
            email?: string
            fullName?: string
        }

        if (!purchaseType) {
            return NextResponse.json({ error: 'Tipo de compra requerido' }, { status: 400 })
        }

        if (!user && purchaseType !== 'event_purchase') {
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
        let customerEmail = user?.email || profile.data?.email || email || ''
        let customerId = profile.data?.stripe_customer_id || undefined
        let pendingEventPurchaseId = ''

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

            pendingEventPurchaseId = await createPendingEventPurchase({
                supabase,
                eventId,
                userId: user?.id ?? null,
                email: customerEmail,
                fullName: fullName || profile.data?.full_name || null,
                amount: checkoutAmount,
                analyticsContext,
            })

            metadata = {
                event_purchase_id: pendingEventPurchaseId,
                buyer_full_name: fullName || profile.data?.full_name || '',
            }

            if (!user) {
                successUrl = `${appUrl}/compras/exito?session_id={CHECKOUT_SESSION_ID}&slug=${resolvedEventPurchase.event.slug}`
                cancelUrl = `${appUrl}/compras/cancelada?slug=${resolvedEventPurchase.event.slug}`
                customerId = undefined
            }
        } else {
            return NextResponse.json({ error: 'Tipo de compra no valido' }, { status: 400 })
        }

        await recordAnalyticsServerEvent({
            eventName: 'checkout_started',
            eventSource: 'server',
            visitorId: analyticsContext?.visitorId ?? null,
            sessionId: analyticsContext?.sessionId ?? null,
            userId: user?.id ?? null,
            touch: (analyticsContext?.touch as any) ?? {
                funnel: purchaseType === 'event_purchase' ? 'event' : 'ai_credits',
            },
            properties: {
                purchaseType,
                eventId: eventId ?? null,
                packageKey: packageKey ?? null,
                amount: checkoutAmount,
                guestCheckout: !user,
            },
        })

        const result = await provider.createOneTimeCheckout({
            purchaseType: purchaseType as 'ai_credits' | 'event_purchase',
            amount: checkoutAmount,
            customerEmail,
            customerId,
            userId: user?.id,
            profileId: profile.data?.id,
            description: checkoutDescription,
            referenceId,
            metadata: {
                ...metadata,
                analytics_visitor_id: analyticsContext?.visitorId ?? '',
                analytics_session_id: analyticsContext?.sessionId ?? '',
                attribution_snapshot: JSON.stringify(attributionSnapshot),
                guest_checkout: user ? 'false' : 'true',
                guest_email: user ? '' : customerEmail,
            },
            successUrl,
            cancelUrl,
        })

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

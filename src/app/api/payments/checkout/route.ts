// POST /api/payments/checkout
// Creates a Stripe Checkout Session for one-time payments (AI credits, events)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent, resolveAttributionSnapshot } from '@/lib/analytics/server'
import { getAppUrl } from '@/lib/config/app-url'
import { getPaymentProvider } from '@/lib/payments'
import { AI_CREDIT_PACKAGES, type AICreditPackageKey } from '@/lib/payments/config'

async function userCanAccessEventCheckout(
    supabase: any,
    userId: string,
    profile: { role: string; membership_level: number | null },
    event: any
) {
    const audience = Array.isArray(event.target_audience) ? event.target_audience : ['public']

    if (audience.includes('public')) return true
    if (profile.role === 'admin') return true
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

async function resolveEventPurchaseDetails(supabase: any, userId: string, eventId: string) {
    const [{ data: event }, { data: profile }] = await Promise.all([
        (supabase
            .from('events') as any)
            .select('id, title, price, member_price, member_access_type, target_audience, status, created_by')
            .eq('id', eventId)
            .single(),
        (supabase
            .from('profiles') as any)
            .select('role, membership_level')
            .eq('id', userId)
            .single(),
    ])

    if (!event) {
        return { error: 'Evento no encontrado' as const }
    }

    if (!profile) {
        return { error: 'Perfil no encontrado' as const }
    }

    if (event.status === 'draft' || event.status === 'cancelled') {
        return { error: 'El evento no esta disponible para compra' as const }
    }

    if (profile.role === 'admin' || event.created_by === userId) {
        return { error: 'No necesitas checkout para este evento' as const }
    }

    const hasAccess = await userCanAccessEventCheckout(supabase, userId, profile, event)
    if (!hasAccess) {
        return { error: 'No tienes acceso a este evento' as const }
    }

    const { data: existingRegistration } = await (supabase
        .from('event_registrations') as any)
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'registered')
        .maybeSingle()

    if (existingRegistration) {
        return { error: 'Ya estas registrado en este evento' as const }
    }

    let amount = Number(event.price || 0)

    if (profile.role === 'patient') {
        amount = Number(event.price || 0)
    } else if (profile.role === 'psychologist' && (profile.membership_level ?? 0) > 0) {
        if (event.member_access_type === 'free') {
            amount = 0
        } else {
            amount = Number(event.member_price ?? event.price ?? 0)
        }
    } else if (profile.role === 'ponente') {
        amount = Number(event.price || 0)
    }

    if (amount <= 0) {
        return { error: 'Este evento no requiere pago. Usa el registro gratuito.' as const }
    }

    return {
        amount,
        description: `Registro a: ${event.title}`,
        referenceId: event.id,
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const body = await request.json()
        const { purchaseType, packageKey, eventId, analyticsContext } = body

        if (!purchaseType) {
            return NextResponse.json({ error: 'Tipo de compra requerido' }, { status: 400 })
        }

        const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('id, stripe_customer_id')
            .eq('id', user.id)
            .single() as { data: { id: string; stripe_customer_id: string | null } | null }

        if (!profile) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
        }

        const appUrl = getAppUrl()
        const provider = getPaymentProvider('stripe')
        const attributionSnapshot = await resolveAttributionSnapshot(analyticsContext)

        let checkoutAmount: number
        let checkoutDescription: string
        let referenceId = ''
        let metadata: Record<string, string> = {}

        if (purchaseType === 'ai_credits') {
            const pkg = AI_CREDIT_PACKAGES[packageKey as AICreditPackageKey]
            if (!pkg) {
                return NextResponse.json({ error: 'Paquete no valido' }, { status: 400 })
            }
            checkoutAmount = pkg.priceMXN
            checkoutDescription = `${pkg.label} - ${pkg.minutes} minutos de IA`
            referenceId = packageKey
            metadata = { minutes: String(pkg.minutes) }
        } else if (purchaseType === 'event_purchase') {
            if (!eventId) {
                return NextResponse.json({ error: 'Datos del evento requeridos' }, { status: 400 })
            }

            const resolvedEventPurchase = await resolveEventPurchaseDetails(supabase, user.id, eventId)
            if ('error' in resolvedEventPurchase) {
                return NextResponse.json({ error: resolvedEventPurchase.error }, { status: 400 })
            }

            checkoutAmount = resolvedEventPurchase.amount
            checkoutDescription = resolvedEventPurchase.description
            referenceId = resolvedEventPurchase.referenceId
        } else {
            return NextResponse.json({ error: 'Tipo de compra no valido' }, { status: 400 })
        }

        await recordAnalyticsServerEvent({
            eventName: 'checkout_started',
            eventSource: 'server',
            visitorId: analyticsContext?.visitorId ?? null,
            sessionId: analyticsContext?.sessionId ?? null,
            userId: user.id,
            touch: (analyticsContext?.touch as any) ?? {
                funnel: purchaseType === 'event_purchase' ? 'event' : 'ai_credits',
            },
            properties: {
                purchaseType,
                eventId: eventId ?? null,
                packageKey: packageKey ?? null,
                amount: checkoutAmount,
            },
        })

        const result = await provider.createOneTimeCheckout({
            purchaseType,
            amount: checkoutAmount,
            customerEmail: user.email!,
            customerId: (profile as any).stripe_customer_id || undefined,
            userId: user.id,
            profileId: profile.id,
            description: checkoutDescription,
            referenceId,
            metadata: {
                ...metadata,
                analytics_visitor_id: analyticsContext?.visitorId ?? '',
                analytics_session_id: analyticsContext?.sessionId ?? '',
                attribution_snapshot: JSON.stringify(attributionSnapshot),
            },
            successUrl: `${appUrl}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${appUrl}/dashboard/payment-cancelled`,
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

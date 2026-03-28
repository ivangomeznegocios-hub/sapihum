// POST /api/payments/subscribe
// Creates a Stripe Checkout Session in subscription mode

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent, resolveAttributionSnapshot } from '@/lib/analytics/server'
import { getAppUrl } from '@/lib/config/app-url'
import { getPaymentProvider } from '@/lib/payments'
import {
    getSubscriptionPlan,
    getStripePriceId,
    isStripePriceIdConfigured,
    type BillingInterval,
} from '@/lib/payments/config'
import { canUserSeeLevel3Offer, getSpecializationByCode } from '@/lib/specializations'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const body = await request.json()
        const { membershipLevel, billingInterval = 'monthly', specializationCode, analyticsContext, successPath } = body as {
            membershipLevel: number
            billingInterval?: BillingInterval
            specializationCode?: string
            analyticsContext?: {
                visitorId?: string | null
                sessionId?: string | null
                touch?: Record<string, unknown> | null
            }
            successPath?: string
        }

        if (!membershipLevel || typeof membershipLevel !== 'number') {
            return NextResponse.json({ error: 'Nivel de membresía requerido' }, { status: 400 })
        }

        const plan = getSubscriptionPlan(membershipLevel, specializationCode)
        if (!plan) {
            return NextResponse.json({ error: 'Plan no encontrado' }, { status: 400 })
        }

        const resolvedSpecializationCode = membershipLevel === 2
            ? (plan.specializationCode || specializationCode || null)
            : null

        if (membershipLevel === 2) {
            const specialization = getSpecializationByCode(resolvedSpecializationCode)
            if (!specialization || specialization.status !== 'active') {
                return NextResponse.json({ error: 'Especializacion no disponible para compra' }, { status: 400 })
            }
        }

        const priceId = getStripePriceId(membershipLevel, billingInterval, resolvedSpecializationCode)
        if (!priceId) {
            return NextResponse.json({ error: 'Precio no encontrado' }, { status: 400 })
        }

        if (!isStripePriceIdConfigured(priceId)) {
            return NextResponse.json(
                { error: 'Stripe no esta configurado completamente para este plan' },
                { status: 503 }
            )
        }

        // Get profile for Stripe customer ID
        const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('id, stripe_customer_id, membership_level, membership_specialization_code, role')
            .eq('id', user.id)
            .single() as {
                data: {
                    id: string
                    stripe_customer_id: string | null
                    membership_level: number | null
                    membership_specialization_code: string | null
                    role: string
                } | null
            }

        if (!profile) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
        }

        const currentLevel = profile.membership_level ?? 0
        const currentSpecializationCode = profile.membership_specialization_code

        if (membershipLevel === 3 && profile.role !== 'admin') {
            const canSeeLevel3 = canUserSeeLevel3Offer({
                membershipLevel: currentLevel,
                specializationCode: currentSpecializationCode,
                isAdmin: false,
            })
            if (!canSeeLevel3) {
                return NextResponse.json(
                    { error: 'Nivel 3 solo esta disponible despues de tener Nivel 2 activo' },
                    { status: 403 }
                )
            }
        }

        if (
            membershipLevel === 2 &&
            currentLevel >= 2 &&
            currentSpecializationCode &&
            resolvedSpecializationCode &&
            currentSpecializationCode !== resolvedSpecializationCode &&
            profile.role !== 'admin'
        ) {
            return NextResponse.json(
                { error: 'Ya tienes una especializacion activa. Contacta soporte para cambio.' },
                { status: 400 }
            )
        }

        const appUrl = getAppUrl()
        const provider = getPaymentProvider('stripe')
        const attributionSnapshot = await resolveAttributionSnapshot(analyticsContext)

        await recordAnalyticsServerEvent({
            eventName: 'checkout_started',
            eventSource: 'server',
            visitorId: analyticsContext?.visitorId ?? null,
            sessionId: analyticsContext?.sessionId ?? null,
            userId: user.id,
            touch: (analyticsContext?.touch as any) ?? {
                funnel: 'checkout',
                targetPlan: `level_${membershipLevel}`,
                targetSpecialization: resolvedSpecializationCode ?? null,
            },
            properties: {
                purchaseType: 'subscription_payment',
                membershipLevel,
                billingInterval,
                specializationCode: resolvedSpecializationCode ?? null,
            },
        })

        const result = await provider.createSubscriptionCheckout({
            membershipLevel,
            specializationCode: resolvedSpecializationCode ?? undefined,
            customerEmail: user.email!,
            customerId: profile.stripe_customer_id || undefined,
            userId: user.id,
            profileId: profile.id,
            trialDays: plan.trialDays,
            priceId,
            metadata: {
                analytics_visitor_id: analyticsContext?.visitorId ?? '',
                analytics_session_id: analyticsContext?.sessionId ?? '',
                attribution_snapshot: JSON.stringify(attributionSnapshot),
            },
            successUrl: `${appUrl}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}${successPath ? `&next=${encodeURIComponent(successPath)}` : ''}`,
            cancelUrl: `${appUrl}/dashboard/payment-cancelled`,
        })

        return NextResponse.json({
            checkoutUrl: result.checkoutUrl,
            sessionId: result.sessionId,
        })
    } catch (error) {
        console.error('[API] Subscribe error:', error)
        return NextResponse.json(
            { error: 'Error al crear sesión de pago' },
            { status: 500 }
        )
    }
}

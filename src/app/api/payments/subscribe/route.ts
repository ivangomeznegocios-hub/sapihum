// POST /api/payments/subscribe
// Creates a Stripe Checkout Session in subscription mode

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent, resolveAttributionSnapshot } from '@/lib/analytics/server'
import { getAppUrl } from '@/lib/config/app-url'
import { getPaymentProvider } from '@/lib/payments'
import { compactAttributionSnapshotForStripe } from '@/lib/payments/stripe-metadata'
import { createServiceClient } from '@/lib/supabase/service'
import {
    getSubscriptionPlan,
    getStripePriceId,
    type BillingInterval,
} from '@/lib/payments/config'
import { canUserSeeLevel3Offer, getSpecializationByCode } from '@/lib/specializations'

function normalizeEmail(value: string | null | undefined) {
    return value?.trim().toLowerCase() || ''
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const body = await request.json()
        const {
            membershipLevel,
            billingInterval = 'monthly',
            specializationCode,
            analyticsContext,
            successPath,
            email,
            fullName,
            offerCode,
        } = body as {
            membershipLevel: number
            billingInterval?: BillingInterval
            specializationCode?: string
            analyticsContext?: {
                visitorId?: string | null
                sessionId?: string | null
                consent?: {
                    necessary: true
                    analytics: boolean
                    marketing: boolean
                    version?: string
                    source?: string
                } | null
                touch?: Record<string, unknown> | null
            }
            successPath?: string
            email?: string
            fullName?: string
            offerCode?: string
        }

        if (!membershipLevel || typeof membershipLevel !== 'number') {
            return NextResponse.json({ error: 'Nivel de membresia requerido' }, { status: 400 })
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

        const isFounderOffer =
            offerCode === 'founders_mx_2026' &&
            membershipLevel === 1 &&
            billingInterval === 'monthly'
        const priceId = isFounderOffer
            ? process.env.STRIPE_PRICE_LEVEL_1_FOUNDER_MONTHLY || 'price_level1_founder_monthly_placeholder'
            : getStripePriceId(membershipLevel, billingInterval, resolvedSpecializationCode)
        if (!priceId) {
            return NextResponse.json({ error: 'Precio no encontrado' }, { status: 400 })
        }

        const normalizedGuestEmail = normalizeEmail(email)
        if (!user && !normalizedGuestEmail) {
            return NextResponse.json(
                { error: 'Correo requerido para continuar', requiresGuestDetails: true },
                { status: 401 }
            )
        }

        const profile = user
            ? await ((supabase as any)
                .from('profiles')
                .select('id, stripe_customer_id, membership_level, membership_specialization_code, role')
                .eq('id', user.id)
                .single() as Promise<{
                    data: {
                        id: string
                        stripe_customer_id: string | null
                        membership_level: number | null
                        membership_specialization_code: string | null
                        role: string
                    } | null
                }>)
            : { data: null }

        if (user && !profile.data) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
        }

        const currentLevel = profile.data?.membership_level ?? 0
        const currentSpecializationCode = profile.data?.membership_specialization_code ?? null

        if (membershipLevel === 3 && profile.data?.role !== 'admin') {
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
            profile.data?.role !== 'admin'
        ) {
            return NextResponse.json(
                { error: 'Ya tienes una especializacion activa. Contacta soporte para cambio.' },
                { status: 400 }
            )
        }

        const appUrl = getAppUrl()
        const provider = getPaymentProvider('stripe')
        const attributionSnapshot = await resolveAttributionSnapshot(analyticsContext)
        const nextPath = successPath?.startsWith('/') ? successPath : '/dashboard/subscription'
        const customerEmail = user?.email || normalizedGuestEmail
        let customerId = profile.data?.stripe_customer_id || undefined

        if (!customerEmail) {
            return NextResponse.json({ error: 'Correo requerido para continuar' }, { status: 400 })
        }

        let resolvedSuccessUrl = `${appUrl}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}${successPath ? `&next=${encodeURIComponent(nextPath)}` : ''}`
        let resolvedCancelUrl = `${appUrl}/dashboard/payment-cancelled`

        if (!user) {
            const subscriptionParams = new URLSearchParams({
                kind: 'subscription',
                session_id: '{CHECKOUT_SESSION_ID}',
                level: String(membershipLevel),
                next: nextPath,
            })

            if (resolvedSpecializationCode) {
                subscriptionParams.set('specialization', resolvedSpecializationCode)
            }

            if (customerEmail) {
                subscriptionParams.set('email', customerEmail)
            }

            resolvedSuccessUrl = `${appUrl}/compras/exito?${subscriptionParams.toString()}`
            resolvedCancelUrl = `${appUrl}/compras/cancelada?kind=subscription`
            customerId = undefined
        }

        await recordAnalyticsServerEvent({
            eventName: 'checkout_started',
            eventSource: 'server',
            visitorId: analyticsContext?.visitorId ?? null,
            sessionId: analyticsContext?.sessionId ?? null,
            userId: user?.id ?? null,
            consent: analyticsContext?.consent ?? null,
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
                guestCheckout: !user,
                offerCode: isFounderOffer ? offerCode : null,
                offerName: isFounderOffer ? 'Primeros 100 Miembros Fundadores SAPIHUM Mexico' : null,
            },
        })

        const checkoutMetadata = {
            analytics_visitor_id: analyticsContext?.visitorId ?? '',
            analytics_session_id: analyticsContext?.sessionId ?? '',
            attribution_snapshot: compactAttributionSnapshotForStripe(attributionSnapshot),
            consent_analytics: analyticsContext?.consent?.analytics ? 'true' : 'false',
            consent_marketing: analyticsContext?.consent?.marketing ? 'true' : 'false',
            consent_source: analyticsContext?.consent?.source ?? '',
            consent_version: analyticsContext?.consent?.version ?? '',
            guest_checkout: user ? 'false' : 'true',
            buyer_full_name: fullName?.trim() || '',
            post_checkout_path: nextPath,
            offer_code: isFounderOffer ? offerCode : '',
            offer_name: isFounderOffer ? 'Primeros 100 Miembros Fundadores SAPIHUM Mexico' : '',
            founder_price_locked: isFounderOffer ? 'true' : 'false',
        }

        let result
        try {
            result = await provider.createSubscriptionCheckout({
                membershipLevel,
                specializationCode: resolvedSpecializationCode ?? undefined,
                billingInterval,
                customerEmail,
                customerId,
                userId: user?.id || '',
                profileId: profile.data?.id || '',
                trialDays: plan.trialDays,
                priceId,
                overrideAmount: isFounderOffer ? 250 : undefined,
                overrideName: isFounderOffer ? 'Miembro Fundador SAPIHUM Mexico' : undefined,
                metadata: checkoutMetadata,
                successUrl: resolvedSuccessUrl,
                cancelUrl: resolvedCancelUrl,
            })
        } catch (stripeError: any) {
            const message = stripeError?.message || ''
            if (customerId && (message.includes('No such customer') || message.includes('customer'))) {
                if (profile.data?.id) {
                    await (createServiceClient() as any)
                        .from('profiles')
                        .update({ stripe_customer_id: null })
                        .eq('id', profile.data.id)
                }

                result = await provider.createSubscriptionCheckout({
                    membershipLevel,
                    specializationCode: resolvedSpecializationCode ?? undefined,
                    billingInterval,
                    customerEmail,
                    customerId: undefined,
                    userId: user?.id || '',
                    profileId: profile.data?.id || '',
                    trialDays: plan.trialDays,
                    priceId,
                    overrideAmount: isFounderOffer ? 250 : undefined,
                    overrideName: isFounderOffer ? 'Miembro Fundador SAPIHUM Mexico' : undefined,
                    metadata: checkoutMetadata,
                    successUrl: resolvedSuccessUrl,
                    cancelUrl: resolvedCancelUrl,
                })
            } else {
                throw stripeError
            }
        }

        return NextResponse.json({
            checkoutUrl: result.checkoutUrl,
            sessionId: result.sessionId,
        })
    } catch (error) {
        console.error('[API] Subscribe error:', error)
        return NextResponse.json(
            { error: 'Error al crear sesion de pago' },
            { status: 500 }
        )
    }
}

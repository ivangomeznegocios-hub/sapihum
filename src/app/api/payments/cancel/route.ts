// POST /api/payments/cancel
// Cancels a subscription at end of billing period

import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments'
import { getSubscriptionManagementSnapshot } from '@/lib/payments/subscription-management'
import { syncMembershipEntitlementsForUser } from '@/lib/membership-entitlements'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient, getUserProfile } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const body = await request.json()
        const { immediately = false } = body
        const profile = await getUserProfile()
        const billingSnapshot = await getSubscriptionManagementSnapshot({
            supabase,
            userId: user.id,
            fallbackCustomerId: profile?.stripe_customer_id ?? null,
        })
        const subscription = billingSnapshot.activeSubscription

        if (!subscription) {
            return NextResponse.json(
                { error: 'No tienes una suscripcion activa para cancelar' },
                { status: 400 }
            )
        }

        if (!subscription.provider_subscription_id) {
            return NextResponse.json(
                { error: 'No encontramos el identificador de Stripe para esta suscripcion' },
                { status: 400 }
            )
        }

        if (subscription.cancel_at_period_end && !immediately) {
            return NextResponse.json({
                success: true,
                message: 'Tu cancelacion ya estaba programada para el final del periodo actual',
            })
        }

        const provider = getPaymentProvider(subscription.payment_provider as 'stripe')
        await provider.cancelSubscription(subscription.provider_subscription_id, immediately)

        const { error: subscriptionUpdateError } = await (supabase as any)
            .from('subscriptions')
            .update({
                cancel_at_period_end: !immediately,
                cancelled_at: immediately ? new Date().toISOString() : null,
                status: immediately ? 'cancelled' : undefined,
                updated_at: new Date().toISOString(),
            })
            .eq('provider_subscription_id', subscription.provider_subscription_id)

        if (subscriptionUpdateError) {
            console.error('[API] Cancel subscription local update error:', subscriptionUpdateError)
            return NextResponse.json(
                { error: 'La suscripcion se cancelo en Stripe pero fallo la actualizacion interna. Revisa el estado manualmente.' },
                { status: 502 }
            )
        }

        if (immediately) {
            const admin = createServiceClient()
            const { error: profileUpdateError } = await (admin as any)
                .from('profiles')
                .update({
                    subscription_status: 'cancelled',
                    membership_level: 0,
                    membership_specialization_code: null,
                })
                .eq('id', user.id)

            if (profileUpdateError) {
                console.error('[API] Cancel profile update error:', profileUpdateError)
                return NextResponse.json(
                    { error: 'La suscripcion se cancelo, pero no se pudo actualizar el perfil local' },
                    { status: 502 }
                )
            }

            await syncMembershipEntitlementsForUser(user.id)
        }

        return NextResponse.json({
            success: true,
            message: immediately
                ? 'Suscripcion cancelada inmediatamente'
                : 'Tu suscripcion se cancelara al final del periodo actual',
        })
    } catch (error) {
        console.error('[API] Cancel error:', error)
        return NextResponse.json(
            { error: 'Error al cancelar la suscripcion' },
            { status: 500 }
        )
    }
}

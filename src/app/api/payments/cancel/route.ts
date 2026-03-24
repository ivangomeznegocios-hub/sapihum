// POST /api/payments/cancel
// Cancels a subscription at end of billing period

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPaymentProvider } from '@/lib/payments'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const body = await request.json()
        const { immediately = false } = body

        const { data: subscription, error: subscriptionError } = await (supabase as any)
            .from('subscriptions')
            .select('provider_subscription_id, payment_provider')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (subscriptionError) {
            console.error('[API] Cancel subscription lookup error:', subscriptionError)
            return NextResponse.json(
                { error: 'No fue posible consultar tu suscripcion actual' },
                { status: 500 }
            )
        }

        if (!subscription) {
            return NextResponse.json(
                { error: 'No tienes una suscripcion activa' },
                { status: 400 }
            )
        }

        const provider = getPaymentProvider(subscription.payment_provider)
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
            const { error: profileUpdateError } = await (supabase as any)
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

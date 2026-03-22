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

        // Find user's active subscription
        const { data: subscription } = await (supabase as any)
            .from('subscriptions')
            .select('provider_subscription_id, payment_provider')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!subscription) {
            return NextResponse.json(
                { error: 'No tienes una suscripción activa' },
                { status: 400 }
            )
        }

        const provider = getPaymentProvider(subscription.payment_provider)
        await provider.cancelSubscription(subscription.provider_subscription_id, immediately)

        // Update local record
        await (supabase as any)
            .from('subscriptions')
            .update({
                cancel_at_period_end: !immediately,
                cancelled_at: immediately ? new Date().toISOString() : null,
                status: immediately ? 'cancelled' : undefined,
                updated_at: new Date().toISOString(),
            })
            .eq('provider_subscription_id', subscription.provider_subscription_id)

        if (immediately) {
            await (supabase as any)
                .from('profiles')
                .update({
                    subscription_status: 'cancelled',
                    membership_level: 0,
                    membership_specialization_code: null,
                })
                .eq('id', user.id)
        }

        return NextResponse.json({
            success: true,
            message: immediately
                ? 'Suscripción cancelada inmediatamente'
                : 'Tu suscripción se cancelará al final del período actual',
        })
    } catch (error) {
        console.error('[API] Cancel error:', error)
        return NextResponse.json(
            { error: 'Error al cancelar la suscripción' },
            { status: 500 }
        )
    }
}

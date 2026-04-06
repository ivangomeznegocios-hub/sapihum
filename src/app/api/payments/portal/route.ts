// POST /api/payments/portal
// Creates a Stripe Customer Portal session for subscription self-service

import { NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/config/app-url'
import { createClient } from '@/lib/supabase/server'
import { getPaymentProvider } from '@/lib/payments'

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const { data: subscription } = await (supabase as any)
            .from('subscriptions')
            .select('provider_customer_id')
            .eq('user_id', user.id)
            .in('status', ['trialing', 'active', 'past_due'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        const customerId = subscription?.provider_customer_id
        if (!customerId) {
            return NextResponse.json(
                { error: 'No tienes una suscripción activa' },
                { status: 400 }
            )
        }

        const appUrl = getAppUrl()
        const provider = getPaymentProvider('stripe')

        if (!provider.createPortalSession) {
            return NextResponse.json(
                { error: 'Portal no disponible para este proveedor' },
                { status: 400 }
            )
        }

        const portalUrl = await provider.createPortalSession(
            customerId,
            `${appUrl}/dashboard/subscription`
        )

        return NextResponse.json({ portalUrl })
    } catch (error) {
        console.error('[API] Portal error:', error)
        return NextResponse.json(
            { error: 'Error al crear sesión del portal' },
            { status: 500 }
        )
    }
}

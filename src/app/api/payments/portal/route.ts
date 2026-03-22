// POST /api/payments/portal
// Creates a Stripe Customer Portal session for subscription self-service

import { NextRequest, NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/config/app-url'
import { createClient } from '@/lib/supabase/server'
import { getPaymentProvider } from '@/lib/payments'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        const customerId = (profile as any)?.stripe_customer_id
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

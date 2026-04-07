// POST /api/payments/portal
// Creates a Stripe Customer Portal session for subscription self-service

import { NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/config/app-url'
import { getPaymentProvider } from '@/lib/payments'
import { findStripeCustomerIdByEmail } from '@/lib/payments/stripe'
import { getSubscriptionManagementSnapshot } from '@/lib/payments/subscription-management'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient, getUserProfile } from '@/lib/supabase/server'

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const profile = await getUserProfile()
        const billingSnapshot = await getSubscriptionManagementSnapshot({
            supabase,
            userId: user.id,
            fallbackCustomerId: profile?.stripe_customer_id ?? null,
        })

        let customerId = billingSnapshot.customerId

        if (!customerId && profile?.email) {
            customerId = await findStripeCustomerIdByEmail(profile.email)

            if (customerId) {
                const admin = createServiceClient()

                await (admin as any)
                    .from('profiles')
                    .update({
                        stripe_customer_id: customerId,
                    })
                    .eq('id', user.id)

                if (billingSnapshot.latestSubscription?.id) {
                    await (admin as any)
                        .from('subscriptions')
                        .update({
                            provider_customer_id: customerId,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', billingSnapshot.latestSubscription.id)
                }
            }
        }

        if (!customerId) {
            return NextResponse.json(
                { error: 'No encontramos un portal de facturacion disponible para tu cuenta' },
                { status: 400 }
            )
        }

        const appUrl = getAppUrl()
        const paymentProvider = billingSnapshot.activeSubscription?.payment_provider
            || billingSnapshot.latestSubscription?.payment_provider
            || 'stripe'
        const provider = getPaymentProvider(paymentProvider as 'stripe')

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
            { error: 'Error al crear sesion del portal' },
            { status: 500 }
        )
    }
}

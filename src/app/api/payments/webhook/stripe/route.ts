// POST /api/payments/webhook/stripe
// Handles Stripe webhook events for subscriptions and payments

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getPaymentProvider } from '@/lib/payments'
import {
    expireCheckoutSession,
    fulfillSubscriptionCreated,
    fulfillSubscriptionRenewed,
    fulfillSubscriptionUpdated,
    fulfillOneTimePayment,
    refundOneTimePayment,
} from '@/lib/payments'
import { sendAdminOperationalAlertBestEffort } from '@/lib/admin/alerts'

// Disable body parsing - Stripe needs raw body for signature verification
export const dynamic = 'force-dynamic'

function getServiceSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase service role credentials not configured')
    }

    return createServiceClient(url, key)
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const headers: Record<string, string> = {}
        request.headers.forEach((value, key) => {
            headers[key] = value
        })

        const provider = getPaymentProvider('stripe')
        const event = await provider.handleWebhook(body, headers)
        const serviceSupabase = getServiceSupabase()

        const { data: shouldProcess, error: acquireError } = await (serviceSupabase as any).rpc('acquire_payment_webhook_event', {
            p_provider: 'stripe',
            p_provider_event_id: event.providerEventId,
            p_payload: event.data ?? {},
        })

        if (acquireError) {
            throw new Error(`Webhook idempotency lock failed: ${acquireError.message}`)
        }

        if (!shouldProcess) {
            return NextResponse.json({ received: true, deduplicated: true })
        }

        try {
            switch (event.type) {
                case 'subscription.created':
                    await fulfillSubscriptionCreated(event.data)
                    break

                case 'subscription.renewed':
                    await fulfillSubscriptionRenewed(event.data)
                    break

                case 'subscription.updated':
                case 'subscription.past_due':
                case 'subscription.cancelled':
                case 'subscription.deleted':
                    await fulfillSubscriptionUpdated(event.data)
                    break

                case 'payment.completed':
                    await fulfillOneTimePayment(event.data)
                    break

                case 'payment.refunded':
                    await refundOneTimePayment(event.data)
                    break

                case 'checkout.expired':
                    await expireCheckoutSession(event.data)
                    break

                case 'payment.failed':
                    console.warn('[Webhook] Payment failed:', event.data)
                    sendAdminOperationalAlertBestEffort({
                        level: 'warning',
                        subject: 'Pago fallido en Stripe',
                        title: 'Pago fallido',
                        summary: `Stripe reporto un pago fallido para ${event.data.customerEmail || 'cliente sin correo'}.`,
                        actionPath: event.data.customerEmail
                            ? `/dashboard/admin/operations?q=${encodeURIComponent(event.data.customerEmail)}`
                            : '/dashboard/admin/inbox',
                        entityType: 'payment_transaction',
                        targetEmail: event.data.customerEmail ?? null,
                        details: {
                            sessionId: event.data.sessionId,
                            paymentIntentId: event.data.paymentIntentId ?? null,
                            purchaseType: event.data.purchaseType ?? null,
                            referenceId: event.data.referenceId ?? null,
                            providerEventId: event.providerEventId,
                        },
                    })
                    break

                case 'unknown':
                    break
            }

            const { error: processedError } = await (serviceSupabase as any).rpc('mark_payment_webhook_processed', {
                p_provider: 'stripe',
                p_provider_event_id: event.providerEventId,
            })

            if (processedError) {
                throw new Error(`Webhook finalize failed: ${processedError.message}`)
            }

            return NextResponse.json({ received: true })
        } catch (error) {
            await (serviceSupabase as any).rpc('mark_payment_webhook_failed', {
                p_provider: 'stripe',
                p_provider_event_id: event.providerEventId,
                p_error_message: error instanceof Error ? error.message : 'Webhook processing failed',
            })

            sendAdminOperationalAlertBestEffort({
                level: 'error',
                subject: 'Webhook Stripe fallido',
                title: 'Webhook Stripe requiere revision',
                summary: error instanceof Error ? error.message : 'Webhook processing failed',
                actionPath: '/dashboard/admin/inbox',
                entityType: 'payment_webhook_event',
                entityId: event.providerEventId,
                details: {
                    providerEventId: event.providerEventId,
                    eventType: event.type,
                },
            })

            throw error
        }
    } catch (error) {
        console.error('[Webhook] Error processing Stripe webhook:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 400 }
        )
    }
}

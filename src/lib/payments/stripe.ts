// ============================================
// STRIPE PAYMENT PROVIDER ADAPTER
// ============================================

import Stripe from 'stripe'
import type {
    PaymentProviderAdapter,
    CreateSubscriptionParams,
    SubscriptionCheckoutResult,
    CreateOneTimeCheckoutParams,
    OneTimeCheckoutResult,
    WebhookEvent,
} from './types'
import { getSubscriptionPlan } from './config'

// Initialize Stripe with the secret key
function getStripeInstance(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
        throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    return new Stripe(key)
}

export const stripeAdapter: PaymentProviderAdapter = {
    name: 'stripe',

    // ---- Create Subscription Checkout ----
    async createSubscriptionCheckout(params: CreateSubscriptionParams): Promise<SubscriptionCheckoutResult> {
        const stripe = getStripeInstance()
        const plan = getSubscriptionPlan(params.membershipLevel, params.specializationCode)

        if (!plan) {
            throw new Error(`No subscription plan found for membership level ${params.membershipLevel}`)
        }

        // Build checkout session params
        const resolvedPriceId = params.priceId || plan.monthly.stripePriceId
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: resolvedPriceId,
                    quantity: 1,
                },
            ],
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            customer_email: params.customerId ? undefined : params.customerEmail,
            customer: params.customerId || undefined,
            metadata: {
                user_id: params.userId,
                profile_id: params.profileId,
                membership_level: String(params.membershipLevel),
                specialization_code: params.specializationCode || '',
                purchase_type: 'subscription_payment',
                ...(params.metadata || {}),
            },
            subscription_data: {
                metadata: {
                    user_id: params.userId,
                    profile_id: params.profileId,
                    membership_level: String(params.membershipLevel),
                    specialization_code: params.specializationCode || '',
                    ...(params.metadata || {}),
                },
                ...(plan.trialDays > 0 ? { trial_period_days: plan.trialDays } : {}),
            },
            locale: 'es',
            allow_promotion_codes: true,
        }

        const session = await stripe.checkout.sessions.create(sessionParams)

        return {
            checkoutUrl: session.url!,
            sessionId: session.id,
            provider: 'stripe',
        }
    },

    // ---- Cancel Subscription ----
    async cancelSubscription(providerSubscriptionId: string, immediately = false): Promise<void> {
        const stripe = getStripeInstance()

        if (immediately) {
            await stripe.subscriptions.cancel(providerSubscriptionId)
        } else {
            // Cancel at end of current billing period
            await stripe.subscriptions.update(providerSubscriptionId, {
                cancel_at_period_end: true,
            })
        }
    },

    // ---- One-time Checkout (AI credits, events) ----
    async createOneTimeCheckout(params: CreateOneTimeCheckoutParams): Promise<OneTimeCheckoutResult> {
        const stripe = getStripeInstance()

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: params.currency || 'mxn',
                        product_data: {
                            name: params.description,
                        },
                        unit_amount: Math.round(params.amount * 100), // Stripe uses cents
                    },
                    quantity: 1,
                },
            ],
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            customer_email: params.customerId ? undefined : params.customerEmail,
            customer: params.customerId || undefined,
            metadata: {
                user_id: params.userId || '',
                profile_id: params.profileId || '',
                purchase_type: params.purchaseType,
                reference_id: params.referenceId || '',
                ...(params.metadata || {}),
            },
            locale: 'es',
        }

        const session = await stripe.checkout.sessions.create(sessionParams)

        return {
            checkoutUrl: session.url!,
            sessionId: session.id,
            provider: 'stripe',
        }
    },

    // ---- Webhook Handler ----
    async handleWebhook(body: string, headers: Record<string, string>): Promise<WebhookEvent> {
        const stripe = getStripeInstance()
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
        }

        const sig = headers['stripe-signature']
        if (!sig) {
            throw new Error('Missing stripe-signature header')
        }

        let event: Stripe.Event
        try {
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
        } catch (err) {
            throw new Error(`Webhook signature verification failed: ${(err as Error).message}`)
        }

        return mapStripeEvent(event)
    },

    // ---- Customer Portal ----
    async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
        const stripe = getStripeInstance()

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        })

        return session.url
    },
}

// ---- Map Stripe events to our normalized WebhookEvent ----

function mapStripeEvent(event: Stripe.Event): WebhookEvent {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session
            if (session.mode === 'subscription') {
                return {
                    type: 'subscription.created',
                    providerEventId: event.id,
                    data: {
                        providerSubscriptionId: session.subscription as string,
                        providerCustomerId: session.customer as string,
                        status: 'active',
                        membershipLevel: Number(session.metadata?.membership_level || 0),
                        specializationCode: session.metadata?.specialization_code || undefined,
                        customerEmail: session.customer_email || session.customer_details?.email || '',
                        priceId: '',
                        metadata: session.metadata as Record<string, string>,
                    },
                }
            } else {
                // One-time payment completed
                return {
                    type: 'payment.completed',
                    providerEventId: event.id,
                    data: {
                        sessionId: session.id,
                        paymentIntentId: session.payment_intent as string,
                        amount: (session.amount_total || 0) / 100,
                        currency: session.currency || 'mxn',
                        customerEmail: session.customer_email || session.customer_details?.email || '',
                        customerId: session.customer as string,
                        metadata: session.metadata as Record<string, string>,
                        purchaseType: session.metadata?.purchase_type as any,
                        referenceId: session.metadata?.reference_id,
                    },
                }
            }
        }

        case 'invoice.payment_succeeded': {
            const invoice = event.data.object as Stripe.Invoice
            const sub = (invoice as any).subscription as string | null
            if (sub) {
                const pi = (invoice as any).payment_intent
                const invoiceAny = invoice as any
                return {
                    type: 'subscription.renewed',
                    providerEventId: event.id,
                    data: {
                        providerSubscriptionId: sub,
                        providerCustomerId: typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id || '',
                        status: 'active',
                        invoiceId: invoice.id,
                        paymentIntentId: typeof pi === 'string' ? pi : pi?.id || '',
                        amount: (invoice.amount_paid || 0) / 100,
                        currency: invoice.currency || 'mxn',
                        customerEmail: invoice.customer_email || '',
                        metadata: invoiceAny.parent?.subscription_details?.metadata as Record<string, string> | undefined,
                    },
                }
            }
            return { type: 'unknown', providerEventId: event.id, data: null }
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice
            const sub = (invoice as any).subscription as string | null
            if (sub) {
                return {
                    type: 'subscription.past_due',
                    providerEventId: event.id,
                    data: {
                        providerSubscriptionId: sub,
                        providerCustomerId: typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id || '',
                        status: 'past_due',
                        invoiceId: invoice.id,
                        customerEmail: invoice.customer_email || '',
                    },
                }
            }
            return { type: 'unknown', providerEventId: event.id, data: null }
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription
            const status = mapStripeSubscriptionStatus(subscription.status)
            // Access period dates via items or raw object
            const subAny = subscription as any
            return {
                type: 'subscription.updated',
                providerEventId: event.id,
                data: {
                    providerSubscriptionId: subscription.id,
                    providerCustomerId: typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as any).id,
                    status,
                    membershipLevel: Number(subscription.metadata?.membership_level || 0) || undefined,
                    specializationCode: subscription.metadata?.specialization_code || undefined,
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : undefined,
                    currentPeriodStart: subAny.current_period_start ? new Date(subAny.current_period_start * 1000).toISOString() : undefined,
                    currentPeriodEnd: subAny.current_period_end ? new Date(subAny.current_period_end * 1000).toISOString() : undefined,
                    priceId: subscription.items.data[0]?.price?.id,
                },
            }
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription
            return {
                type: 'subscription.deleted',
                providerEventId: event.id,
                data: {
                    providerSubscriptionId: subscription.id,
                    providerCustomerId: typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as any).id,
                    status: 'expired',
                    cancelledAt: new Date().toISOString(),
                },
            }
        }

        default:
            return { type: 'unknown', providerEventId: event.id, data: null }
    }
}

function mapStripeSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): import('./types').SubscriptionStatusType {
    const statusMap: Record<string, import('./types').SubscriptionStatusType> = {
        'trialing': 'trialing',
        'active': 'active',
        'past_due': 'past_due',
        'canceled': 'cancelled',
        'unpaid': 'past_due',
        'incomplete': 'incomplete',
        'incomplete_expired': 'expired',
        'paused': 'paused',
    }
    return statusMap[stripeStatus] || 'active'
}

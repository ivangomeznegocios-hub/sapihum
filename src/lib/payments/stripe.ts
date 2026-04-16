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
    PaymentWebhookData,
    SubscriptionWebhookData,
    WebhookEvent,
} from './types'
import { getSubscriptionPlan, isStripePriceIdConfigured } from './config'
import { sanitizeStripeMetadata } from './stripe-metadata'

// Initialize Stripe with the secret key
function getStripeInstance(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
        throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    return new Stripe(key)
}

export async function findStripeCustomerIdByEmail(email: string): Promise<string | null> {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
        return null
    }

    const stripe = getStripeInstance()
    const customers = await stripe.customers.list({
        email: normalizedEmail,
        limit: 10,
    })

    if (customers.data.length === 0) {
        return null
    }

    const summaries = await Promise.all(
        customers.data.map(async (customer) => {
            const subscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'all',
                limit: 10,
            })

            const hasPreferredSubscription = subscriptions.data.some((subscription) =>
                ['trialing', 'active', 'past_due', 'unpaid'].includes(subscription.status)
            )

            return {
                customerId: customer.id,
                created: customer.created ?? 0,
                hasPreferredSubscription,
                hasAnySubscription: subscriptions.data.length > 0,
            }
        })
    )

    summaries.sort((left, right) => {
        if (left.hasPreferredSubscription !== right.hasPreferredSubscription) {
            return left.hasPreferredSubscription ? -1 : 1
        }

        if (left.hasAnySubscription !== right.hasAnySubscription) {
            return left.hasAnySubscription ? -1 : 1
        }

        return right.created - left.created
    })

    return summaries[0]?.customerId ?? customers.data[0]?.id ?? null
}

export async function retrieveCompletedCheckoutPayment(sessionId: string): Promise<PaymentWebhookData | null> {
    const stripe = getStripeInstance()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.mode !== 'payment' || session.payment_status !== 'paid') {
        return null
    }

    return {
        sessionId: session.id,
        paymentIntentId:
            typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id || undefined,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || 'mxn',
        customerEmail: session.customer_email || session.customer_details?.email || '',
        customerId:
            typeof session.customer === 'string'
                ? session.customer
                : (session.customer as any)?.id || undefined,
        metadata: (session.metadata ?? {}) as Record<string, string>,
        purchaseType: session.metadata?.purchase_type as any,
        referenceId: session.metadata?.reference_id,
    }
}

export async function retrieveCompletedCheckoutSubscription(sessionId: string): Promise<SubscriptionWebhookData | null> {
    const stripe = getStripeInstance()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.mode !== 'subscription') {
        return null
    }

    const subscriptionId =
        typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id

    if (!subscriptionId) {
        return null
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const normalizedStatus = mapStripeSubscriptionStatus(subscription.status)

    if (!['trialing', 'active', 'past_due'].includes(normalizedStatus)) {
        return null
    }

    const subscriptionAny = subscription as any

    return {
        providerSubscriptionId: subscription.id,
        providerCustomerId:
            typeof subscription.customer === 'string'
                ? subscription.customer
                : (subscription.customer as any)?.id || '',
        status: normalizedStatus,
        membershipLevel:
            Number(session.metadata?.membership_level || subscription.metadata?.membership_level || 0) || undefined,
        specializationCode:
            session.metadata?.specialization_code || subscription.metadata?.specialization_code || undefined,
        currentPeriodStart: subscriptionAny.current_period_start
            ? new Date(subscriptionAny.current_period_start * 1000).toISOString()
            : undefined,
        currentPeriodEnd: subscriptionAny.current_period_end
            ? new Date(subscriptionAny.current_period_end * 1000).toISOString()
            : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : undefined,
        trialStart: subscriptionAny.trial_start
            ? new Date(subscriptionAny.trial_start * 1000).toISOString()
            : undefined,
        trialEnd: subscriptionAny.trial_end
            ? new Date(subscriptionAny.trial_end * 1000).toISOString()
            : undefined,
        priceId: subscription.items.data[0]?.price?.id || session.metadata?.price_id || undefined,
        customerEmail: session.customer_email || session.customer_details?.email || '',
        metadata: {
            ...(subscription.metadata || {}),
            ...((session.metadata || {}) as Record<string, string>),
        },
    }
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

        const billingInterval = params.billingInterval || 'monthly'
        const resolvedPriceId =
            params.priceId ||
            (billingInterval === 'annual' ? plan.annual.stripePriceId : plan.monthly.stripePriceId)
        const useCatalogPrice = isStripePriceIdConfigured(resolvedPriceId)
        const intervalAmount = billingInterval === 'annual' ? plan.annual.amount : plan.monthly.amount

        const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = useCatalogPrice
            ? {
                price: resolvedPriceId,
                quantity: 1,
            }
            : {
                price_data: {
                    currency: 'mxn',
                    product_data: {
                        name: plan.name,
                    },
                    recurring: {
                        interval: billingInterval === 'annual' ? 'year' : 'month',
                    },
                    unit_amount: Math.round(intervalAmount * 100),
                },
                quantity: 1,
            }

        const checkoutMetadata = sanitizeStripeMetadata({
            user_id: params.userId,
            profile_id: params.profileId,
            membership_level: String(params.membershipLevel),
            specialization_code: params.specializationCode || '',
            price_id: resolvedPriceId,
            purchase_type: 'subscription_payment',
            ...(params.metadata || {}),
        })
        const subscriptionMetadata = sanitizeStripeMetadata({
            user_id: params.userId,
            profile_id: params.profileId,
            membership_level: String(params.membershipLevel),
            specialization_code: params.specializationCode || '',
            price_id: resolvedPriceId,
            ...(params.metadata || {}),
        })

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [lineItem],
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            customer_email: params.customerId ? undefined : (params.customerEmail || undefined),
            customer: params.customerId || undefined,
            metadata: checkoutMetadata,
            subscription_data: {
                metadata: subscriptionMetadata,
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
        const checkoutExpiresAt = params.checkoutExpiresAt
            ? Math.floor(new Date(params.checkoutExpiresAt).getTime() / 1000)
            : undefined
        const checkoutMetadata = sanitizeStripeMetadata({
            user_id: params.userId || '',
            profile_id: params.profileId || '',
            purchase_type: params.purchaseType,
            reference_id: params.referenceId || '',
            ...(params.metadata || {}),
        })

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
            customer_email: params.customerId ? undefined : (params.customerEmail || undefined),
            customer: params.customerId || undefined,
            metadata: checkoutMetadata,
            payment_intent_data: {
                metadata: checkoutMetadata,
            },
            locale: 'es',
            allow_promotion_codes: true,
            ...(checkoutExpiresAt ? { expires_at: checkoutExpiresAt } : {}),
        }

        const session = await stripe.checkout.sessions.create(sessionParams)

        return {
            checkoutUrl: session.url!,
            sessionId: session.id,
            provider: 'stripe',
            expiresAt: session.expires_at
                ? new Date(session.expires_at * 1000).toISOString()
                : undefined,
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

        return await mapStripeEvent(stripe, event)
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

async function mapStripeEvent(stripe: Stripe, event: Stripe.Event): Promise<WebhookEvent> {
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
                        status: session.payment_status === 'no_payment_required' ? 'trialing' : 'active',
                        membershipLevel: Number(session.metadata?.membership_level || 0),
                        specializationCode: session.metadata?.specialization_code || undefined,
                        customerEmail: session.customer_email || session.customer_details?.email || '',
                        priceId: session.metadata?.price_id || '',
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

        case 'checkout.session.expired': {
            const session = event.data.object as Stripe.Checkout.Session
            if (session.mode !== 'payment') {
                return { type: 'unknown', providerEventId: event.id, data: null }
            }

            return {
                type: 'checkout.expired',
                providerEventId: event.id,
                data: {
                    sessionId: session.id,
                    purchaseType: session.metadata?.purchase_type as any,
                    referenceId: session.metadata?.reference_id,
                    customerEmail: session.customer_email || session.customer_details?.email || undefined,
                    metadata: (session.metadata ?? {}) as Record<string, string>,
                    expiresAt: session.expires_at
                        ? new Date(session.expires_at * 1000).toISOString()
                        : undefined,
                },
            }
        }

        case 'charge.refunded': {
            const charge = event.data.object as Stripe.Charge
            const paymentIntentId =
                typeof charge.payment_intent === 'string'
                    ? charge.payment_intent
                    : charge.payment_intent?.id
            const paymentIntent = paymentIntentId
                ? await stripe.paymentIntents.retrieve(paymentIntentId)
                : null
            const refundEntry = charge.refunds?.data?.[0]
            const metadata = {
                ...((paymentIntent?.metadata ?? {}) as Record<string, string>),
                ...((charge.metadata ?? {}) as Record<string, string>),
            }

            return {
                type: 'payment.refunded',
                providerEventId: event.id,
                data: {
                    refundId: refundEntry?.id || `charge_refunded:${charge.id}`,
                    chargeId: charge.id,
                    paymentIntentId: paymentIntentId || undefined,
                    amountRefunded: (charge.amount_refunded || 0) / 100,
                    originalAmount: (charge.amount || 0) / 100,
                    currency: charge.currency || 'mxn',
                    customerEmail: charge.billing_details?.email || undefined,
                    metadata,
                    purchaseType: metadata.purchase_type as any,
                    referenceId: metadata.reference_id,
                    isFullRefund: (charge.amount_refunded || 0) >= (charge.amount || 0),
                    refundReason: refundEntry?.reason || null,
                },
            }
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

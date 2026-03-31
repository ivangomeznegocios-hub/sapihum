// ============================================
// PAYMENT SYSTEM TYPES
// ============================================
// Extensible interfaces — add new providers by implementing PaymentProviderAdapter
// ============================================

export type PaymentProvider = 'stripe' | 'paypal' | 'mercadopago' | 'manual'
export type PurchaseType = 'subscription_payment' | 'ai_credits' | 'event_purchase' | 'formation_purchase'
export type SubscriptionStatusType = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'paused' | 'incomplete'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'

// ---- Subscription Checkout ----

export interface CreateSubscriptionParams {
    membershipLevel: number
    specializationCode?: string
    billingInterval?: 'monthly' | 'annual'
    customerEmail: string
    customerId?: string           // Existing Stripe customer ID
    userId: string
    profileId: string
    trialDays?: number
    priceId?: string              // Override price ID (for monthly/annual)
    metadata?: Record<string, string>
    successUrl: string
    cancelUrl: string
}

export interface SubscriptionCheckoutResult {
    checkoutUrl: string
    sessionId: string
    provider: PaymentProvider
}

// ---- One-time Checkout ----

export interface CreateOneTimeCheckoutParams {
    purchaseType: 'ai_credits' | 'event_purchase' | 'formation_purchase'
    amount: number                // In smallest currency unit or decimal
    currency?: string
    customerEmail: string
    customerId?: string
    userId?: string
    profileId?: string
    description: string
    referenceId?: string          // event_id, package name, etc.
    metadata?: Record<string, string>
    successUrl: string
    cancelUrl: string
}

export interface OneTimeCheckoutResult {
    checkoutUrl: string
    sessionId: string
    provider: PaymentProvider
}

// ---- Webhook Events ----

export interface SubscriptionWebhookData {
    providerSubscriptionId: string
    providerCustomerId: string
    status: SubscriptionStatusType
    membershipLevel?: number
    specializationCode?: string
    currentPeriodStart?: string
    currentPeriodEnd?: string
    cancelAtPeriodEnd?: boolean
    cancelledAt?: string
    trialStart?: string
    trialEnd?: string
    priceId?: string
    invoiceId?: string
    paymentIntentId?: string
    amount?: number
    currency?: string
    customerEmail?: string
    metadata?: Record<string, string>
}

export interface PaymentWebhookData {
    sessionId: string
    paymentIntentId?: string
    invoiceId?: string
    amount: number
    currency: string
    customerEmail: string
    customerId?: string
    metadata?: Record<string, string>
    purchaseType?: PurchaseType
    referenceId?: string
}

export type WebhookEvent =
    | { type: 'subscription.created'; providerEventId: string; data: SubscriptionWebhookData }
    | { type: 'subscription.updated'; providerEventId: string; data: SubscriptionWebhookData }
    | { type: 'subscription.renewed'; providerEventId: string; data: SubscriptionWebhookData }
    | { type: 'subscription.cancelled'; providerEventId: string; data: SubscriptionWebhookData }
    | { type: 'subscription.past_due'; providerEventId: string; data: SubscriptionWebhookData }
    | { type: 'subscription.deleted'; providerEventId: string; data: SubscriptionWebhookData }
    | { type: 'payment.completed'; providerEventId: string; data: PaymentWebhookData }
    | { type: 'payment.failed'; providerEventId: string; data: PaymentWebhookData }
    | { type: 'unknown'; providerEventId: string; data: null }

// ---- Provider Interface ----

export interface PaymentProviderAdapter {
    readonly name: PaymentProvider

    // Subscription management
    createSubscriptionCheckout(params: CreateSubscriptionParams): Promise<SubscriptionCheckoutResult>
    cancelSubscription(providerSubscriptionId: string, immediately?: boolean): Promise<void>

    // One-time payments
    createOneTimeCheckout(params: CreateOneTimeCheckoutParams): Promise<OneTimeCheckoutResult>

    // Webhook handling
    handleWebhook(body: string, headers: Record<string, string>): Promise<WebhookEvent>

    // Customer portal (optional)
    createPortalSession?(customerId: string, returnUrl: string): Promise<string>
}

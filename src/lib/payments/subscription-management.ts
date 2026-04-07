import type { Subscription } from '@/types/database'

const BILLING_ACTIVE_STATUSES: ReadonlySet<Subscription['status']> = new Set([
    'trialing',
    'active',
    'past_due',
])

export function isBillingActiveStatus(status: Subscription['status'] | null | undefined) {
    return status ? BILLING_ACTIVE_STATUSES.has(status) : false
}

export function canCancelBillingSubscription(
    subscription: Pick<Subscription, 'status' | 'cancel_at_period_end' | 'provider_subscription_id'> | null | undefined
) {
    if (!subscription?.provider_subscription_id) {
        return false
    }

    return isBillingActiveStatus(subscription.status) && !subscription.cancel_at_period_end
}

export interface SubscriptionManagementSnapshot {
    activeSubscription: Subscription | null
    latestSubscription: Subscription | null
    displaySubscription: Subscription | null
    customerId: string | null
    hasPortalAccess: boolean
    canCancel: boolean
}

export async function getSubscriptionManagementSnapshot(params: {
    supabase: any
    userId: string
    fallbackCustomerId?: string | null
}): Promise<SubscriptionManagementSnapshot> {
    const { data, error } = await ((params.supabase
        .from('subscriptions') as any)
        .select('*')
        .eq('user_id', params.userId)
        .order('created_at', { ascending: false })
        .limit(10))

    if (error) {
        throw error
    }

    const subscriptions = ((data ?? []) as Subscription[])
    const activeSubscription = subscriptions.find((entry) => isBillingActiveStatus(entry.status)) ?? null
    const latestSubscription = subscriptions[0] ?? null
    const displaySubscription = activeSubscription ?? latestSubscription
    const customerId =
        activeSubscription?.provider_customer_id
        || latestSubscription?.provider_customer_id
        || params.fallbackCustomerId
        || null

    return {
        activeSubscription,
        latestSubscription,
        displaySubscription,
        customerId,
        hasPortalAccess: Boolean(customerId),
        canCancel: canCancelBillingSubscription(activeSubscription),
    }
}

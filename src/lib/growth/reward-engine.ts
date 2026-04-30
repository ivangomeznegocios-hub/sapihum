import {
    LEVEL_2_DEFAULT_SPECIALIZATION,
    type SpecializationCode,
} from '@/lib/specializations'
import {
    getPlanByPriceId,
    isStripePriceIdConfigured,
    getStripePriceId,
    getSubscriptionPlan,
    type BillingInterval,
} from '@/lib/payments/config'
import {
    applyGrowthRewardDiscountToStripeSubscription,
    ensureGrowthRewardCoupon,
    removeGrowthRewardFromStripeSubscription,
} from '@/lib/payments/stripe'
import { syncMembershipEntitlementsForUser } from '@/lib/membership-entitlements'
import { getGrowthRewardFeatureFlags, isAdvancedGrowthRewardConfig } from '@/lib/growth/feature-flags'
import { createServiceClient } from '@/lib/supabase/service'
import {
    PROFESSIONAL_INVITE_PROGRAM_TYPE,
    isProfessionalInviteReferredRole,
    isProfessionalInviteReferrerRole,
} from '@/lib/growth/programs'
import {
    isHiddenGrowthProfile,
} from '@/lib/supabase/queries/growth-dashboard-filters'
import type {
    GrowthCampaign,
    GrowthRewardConfig,
    GrowthRewardGrant,
    GrowthRewardGrantStatus,
    PaymentSubscriptionStatus,
    Subscription,
} from '@/types/database'

const QUALIFYING_SUBSCRIPTION_STATUSES = new Set<PaymentSubscriptionStatus>(['active', 'trialing'])

type SupabaseAdmin = ReturnType<typeof createServiceClient>

type ReconcileTrigger =
    | 'signup'
    | 'subscription_created'
    | 'subscription_renewed'
    | 'subscription_updated'
    | 'subscription_deleted'
    | 'campaign_changed'
    | 'cron'
    | 'manual'

type ActiveSubscription = Subscription & {
    monthlyAmount: number
    interval: BillingInterval
}

type QualifiedReward = {
    campaign: GrowthCampaign
    config: GrowthRewardConfig
    attributionIds: string[]
    activeInviteCount: number
    resolvedBenefit: Record<string, any>
    monthlyValue: number
    priority: number
}

type EvaluatedReferrer = {
    userId: string
    qualified: QualifiedReward[]
    appliedGrantId: string | null
}

type ReconcileResult = {
    evaluated: number
    errors: Array<{ userId: string; message: string }>
    results: EvaluatedReferrer[]
    disabled?: boolean
    reason?: string
}

function toNumber(value: unknown, fallback = 0) {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : fallback
}

function asStringArray(value: unknown, fallback: string[]) {
    return Array.isArray(value) ? value.map(String).filter(Boolean) : fallback
}

function normalizeTargetMembershipLevel(value: unknown): GrowthRewardConfig['target_membership_level'] {
    if (value === 'current') return 'current'
    const level = Number(value)
    return level === 1 || level === 2 || level === 3 ? level : 'current'
}

export function normalizeGrowthRewardConfig(value: Record<string, any> | null | undefined): GrowthRewardConfig | null {
    if (!value || typeof value !== 'object') return null

    const thresholdCount = Math.trunc(toNumber(value.threshold_count))
    const benefitKind = value.benefit_kind

    if (thresholdCount <= 0) return null
    if (value.qualifier !== 'referred_active_membership') return null
    if (value.duration_policy !== 'while_qualified') return null
    if (benefitKind !== 'percent_discount' && benefitKind !== 'free_membership_level') return null

    const discountPercent = benefitKind === 'free_membership_level'
        ? 100
        : Math.max(1, Math.min(100, toNumber(value.discount_percent)))

    if (!discountPercent) return null

    return {
        threshold_count: thresholdCount,
        qualifier: 'referred_active_membership',
        require_referrer_active_membership: value.require_referrer_active_membership !== false,
        benefit_kind: benefitKind,
        discount_percent: discountPercent,
        target_membership_level: normalizeTargetMembershipLevel(value.target_membership_level),
        duration_policy: 'while_qualified',
        priority: Math.trunc(toNumber(value.priority)),
    }
}

export function selectBestGrowthReward(rewards: QualifiedReward[]): QualifiedReward | null {
    return [...rewards].sort((left, right) => {
        if (right.monthlyValue !== left.monthlyValue) {
            return right.monthlyValue - left.monthlyValue
        }

        return right.priority - left.priority
    })[0] ?? null
}

function isCampaignCurrentlyActive(campaign: GrowthCampaign, now = new Date()) {
    if (!campaign.is_active) return false
    const startsAt = campaign.starts_at ? new Date(campaign.starts_at) : null
    const endsAt = campaign.ends_at ? new Date(campaign.ends_at) : null

    if (startsAt && startsAt > now) return false
    if (endsAt && endsAt <= now) return false

    return true
}

function getPlanMonthlyAmount(level: number, specializationCode?: string | null) {
    return getSubscriptionPlan(level, specializationCode)?.monthly.amount ?? 0
}

function getSubscriptionMonthlyAmount(subscription: Subscription) {
    const planFromPrice = subscription.provider_price_id ? getPlanByPriceId(subscription.provider_price_id) : null
    if (planFromPrice) {
        return planFromPrice.interval === 'annual'
            ? planFromPrice.annual.monthlyEquivalent
            : planFromPrice.monthly.amount
    }

    return getPlanMonthlyAmount(subscription.membership_level, subscription.specialization_code)
}

function getSubscriptionBillingInterval(subscription: Subscription): BillingInterval {
    const planFromPrice = subscription.provider_price_id ? getPlanByPriceId(subscription.provider_price_id) : null
    return planFromPrice?.interval ?? 'monthly'
}

function isQualifyingSubscription(subscription: Pick<Subscription, 'status' | 'cancel_at_period_end'> | null | undefined) {
    return Boolean(
        subscription
        && QUALIFYING_SUBSCRIPTION_STATUSES.has(subscription.status)
        && !subscription.cancel_at_period_end
    )
}

function resolveTargetLevel(config: GrowthRewardConfig, currentLevel: number) {
    if (config.target_membership_level === 'current') {
        return currentLevel
    }

    return Math.max(currentLevel, Number(config.target_membership_level))
}

function resolveRewardBenefit(params: {
    campaign: GrowthCampaign
    config: GrowthRewardConfig
    subscription: ActiveSubscription
    activeInviteCount: number
    attributionIds: string[]
}) {
    const targetLevel = resolveTargetLevel(params.config, params.subscription.membership_level)
    const targetSpecializationCode =
        targetLevel === 2
            ? params.subscription.specialization_code ?? LEVEL_2_DEFAULT_SPECIALIZATION
            : null
    const discountPercent = params.config.benefit_kind === 'free_membership_level'
        ? 100
        : Math.max(1, Math.min(100, params.config.discount_percent ?? 0))
    const baseMonthlyAmount = targetLevel === params.subscription.membership_level
        ? params.subscription.monthlyAmount
        : getPlanMonthlyAmount(targetLevel, targetSpecializationCode)
    const monthlyValue = Math.round((baseMonthlyAmount * discountPercent) / 100)

    return {
        resolvedBenefit: {
            benefit_kind: params.config.benefit_kind,
            discount_percent: discountPercent,
            target_membership_level: targetLevel,
            target_specialization_code: targetSpecializationCode,
            source_membership_level: params.subscription.membership_level,
            source_specialization_code: params.subscription.specialization_code,
            source_price_id: params.subscription.provider_price_id,
            billing_interval: params.subscription.interval,
            monthly_value_mxn: monthlyValue,
            active_invite_count: params.activeInviteCount,
            threshold_count: params.config.threshold_count,
            attribution_ids: params.attributionIds,
            campaign_title: params.campaign.title,
        },
        monthlyValue,
    }
}

async function getLatestQualifyingSubscription(
    admin: SupabaseAdmin,
    userId: string
): Promise<ActiveSubscription | null> {
    const { data, error } = await (admin
        .from('subscriptions') as any)
        .select('*')
        .eq('user_id', userId)
        .in('status', Array.from(QUALIFYING_SUBSCRIPTION_STATUSES))
        .eq('cancel_at_period_end', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error(`Failed to load active subscription for ${userId}: ${error.message}`)
    }

    if (!data) return null

    const subscription = data as Subscription
    return {
        ...subscription,
        monthlyAmount: getSubscriptionMonthlyAmount(subscription),
        interval: getSubscriptionBillingInterval(subscription),
    }
}

async function getActiveSubscriptionsByUserId(admin: SupabaseAdmin, userIds: string[]) {
    if (userIds.length === 0) return new Map<string, Subscription>()

    const { data, error } = await (admin
        .from('subscriptions') as any)
        .select('*')
        .in('user_id', userIds)
        .in('status', Array.from(QUALIFYING_SUBSCRIPTION_STATUSES))
        .eq('cancel_at_period_end', false)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to load qualifying subscriptions: ${error.message}`)
    }

    const byUserId = new Map<string, Subscription>()
    for (const subscription of (data ?? []) as Subscription[]) {
        if (!byUserId.has(subscription.user_id) && isQualifyingSubscription(subscription)) {
            byUserId.set(subscription.user_id, subscription)
        }
    }

    return byUserId
}

async function getLatestRefundedSubscriptionUserIds(admin: SupabaseAdmin, userIds: string[]) {
    if (userIds.length === 0) return new Set<string>()

    const { data, error } = await (admin
        .from('payment_transactions') as any)
        .select('user_id, status, created_at')
        .in('user_id', userIds)
        .eq('purchase_type', 'subscription_payment')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to load subscription payment refund state: ${error.message}`)
    }

    const latestByUserId = new Map<string, any>()
    for (const row of data ?? []) {
        if (row.user_id && !latestByUserId.has(row.user_id)) {
            latestByUserId.set(row.user_id, row)
        }
    }

    return new Set(
        Array.from(latestByUserId.entries())
            .filter(([, row]) => row.status === 'refunded')
            .map(([userId]) => userId)
    )
}

async function getRewardCampaigns(admin: SupabaseAdmin) {
    const { data, error } = await (admin
        .from('growth_campaigns') as any)
        .select('*')
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

    if (error) {
        throw new Error(`Failed to load growth reward campaigns: ${error.message}`)
    }

    const flags = getGrowthRewardFeatureFlags()

    return ((data ?? []) as GrowthCampaign[])
        .filter((campaign) => {
            const config = normalizeGrowthRewardConfig(campaign.reward_config)
            if (!config) return false
            if (!flags.advancedPrograms && isAdvancedGrowthRewardConfig(config)) return false
            return true
        })
}

async function getReferrerAttributions(admin: SupabaseAdmin, referrerId: string) {
    const { data, error } = await (admin
        .from('invite_attributions') as any)
        .select(`
            *,
            referrer:profiles!invite_attributions_referrer_id_fkey(*),
            referred:profiles!invite_attributions_referred_id_fkey(*)
        `)
        .eq('referrer_id', referrerId)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

    if (error) {
        throw new Error(`Failed to load invite attributions: ${error.message}`)
    }

    return (data ?? []) as any[]
}

async function getExistingGrants(admin: SupabaseAdmin, referrerId: string) {
    const { data, error } = await (admin
        .from('growth_reward_grants') as any)
        .select('*')
        .eq('beneficiary_id', referrerId)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

    if (error) {
        throw new Error(`Failed to load growth reward grants: ${error.message}`)
    }

    return (data ?? []) as GrowthRewardGrant[]
}

async function writeAuditEvent(params: {
    admin: SupabaseAdmin
    grant: GrowthRewardGrant
    qualified: QualifiedReward
    status: GrowthRewardGrantStatus
    trigger: ReconcileTrigger
}) {
    const attributionId = params.qualified.attributionIds[0]
    if (!attributionId) return

    await (params.admin
        .from('invite_reward_events') as any)
        .insert({
            attribution_id: attributionId,
            beneficiary_id: params.grant.beneficiary_id,
            program_type: PROFESSIONAL_INVITE_PROGRAM_TYPE,
            reward_type: params.qualified.config.benefit_kind === 'percent_discount' ? 'discount' : 'membership_benefit',
            reward_value: {
                ...params.qualified.resolvedBenefit,
                grant_id: params.grant?.id ?? null,
                campaign_id: params.qualified.campaign.id,
                grant_status: params.status,
            },
            trigger_event: `growth_reward_${params.status}`,
            processed: params.status === 'applied',
            processed_at: params.status === 'applied' ? new Date().toISOString() : null,
            notes: `Automatic growth reward evaluation: ${params.trigger}`,
        })
}

async function upsertQualifiedGrant(params: {
    admin: SupabaseAdmin
    referrerId: string
    qualified: QualifiedReward
    status: GrowthRewardGrantStatus
    existing?: GrowthRewardGrant
    appliedFields?: Record<string, any>
    lastError?: string | null
    trigger: ReconcileTrigger
}) {
    const now = new Date().toISOString()
    const payload = {
        beneficiary_id: params.referrerId,
        campaign_id: params.qualified.campaign.id,
        program_type: PROFESSIONAL_INVITE_PROGRAM_TYPE,
        qualifying_attribution_ids: params.qualified.attributionIds,
        status: params.status,
        qualified_at: params.existing?.qualified_at ?? now,
        applied_at: params.status === 'applied' ? (params.existing?.applied_at ?? now) : params.existing?.applied_at ?? null,
        revoked_at: null,
        resolved_benefit: params.qualified.resolvedBenefit,
        last_evaluated_at: now,
        last_error: params.lastError ?? null,
        ...(params.appliedFields ?? {}),
    }

    const { data, error } = await (params.admin
        .from('growth_reward_grants') as any)
        .upsert(payload, { onConflict: 'beneficiary_id,campaign_id' })
        .select('*')
        .single()

    if (error) {
        throw new Error(`Failed to upsert growth reward grant: ${error.message}`)
    }

    const grant = data as GrowthRewardGrant
    if (!params.existing || params.existing.status !== params.status) {
        await writeAuditEvent({
            admin: params.admin,
            grant,
            qualified: params.qualified,
            status: params.status,
            trigger: params.trigger,
        })
    }

    return grant
}

async function revokeGrant(params: {
    admin: SupabaseAdmin
    grant: GrowthRewardGrant
    reason: string
    trigger: ReconcileTrigger
}) {
    const now = new Date().toISOString()
    let lastError: string | null = null

    if (params.grant.status === 'applied' || params.grant.status === 'sync_error') {
        try {
            if (params.grant.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
                await removeGrowthRewardFromStripeSubscription({
                    subscriptionId: params.grant.stripe_subscription_id,
                    priceId: params.grant.auto_upgraded ? params.grant.original_price_id : null,
                })
            }

            if (params.grant.auto_upgraded && params.grant.original_membership_level) {
                await (params.admin
                    .from('subscriptions') as any)
                    .update({
                        membership_level: params.grant.original_membership_level,
                        specialization_code: params.grant.original_specialization_code,
                        provider_price_id: params.grant.original_price_id,
                        updated_at: now,
                    })
                    .eq('provider_subscription_id', params.grant.stripe_subscription_id)

                await (params.admin
                    .from('profiles') as any)
                    .update({
                        membership_level: params.grant.original_membership_level,
                        membership_specialization_code:
                            params.grant.original_membership_level < 2
                                ? null
                                : params.grant.original_specialization_code,
                        subscription_status: 'active',
                    })
                    .eq('id', params.grant.beneficiary_id)

                await syncMembershipEntitlementsForUser(params.grant.beneficiary_id)
            }
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Failed to revoke Stripe growth reward'
        }
    }

    const { error } = await (params.admin
        .from('growth_reward_grants') as any)
        .update({
            status: lastError ? 'sync_error' : 'revoked',
            revoked_at: lastError ? params.grant.revoked_at : now,
            last_evaluated_at: now,
            last_stripe_sync_at: lastError ? params.grant.last_stripe_sync_at : now,
            last_error: lastError,
            resolved_benefit: {
                ...(params.grant.resolved_benefit ?? {}),
                revoked_reason: params.reason,
                revoke_trigger: params.trigger,
            },
        })
        .eq('id', params.grant.id)

    if (error) {
        throw new Error(`Failed to revoke growth reward grant: ${error.message}`)
    }
}

async function applyBestGrant(params: {
    admin: SupabaseAdmin
    referrerId: string
    qualified: QualifiedReward
    existing?: GrowthRewardGrant
    subscription: ActiveSubscription
    trigger: ReconcileTrigger
}) {
    const flags = getGrowthRewardFeatureFlags()
    const targetLevel = toNumber(
        params.qualified.resolvedBenefit.target_membership_level,
        params.subscription.membership_level
    )
    const targetSpecializationCode = params.qualified.resolvedBenefit.target_specialization_code as string | null
    const targetPriceId = targetLevel !== params.subscription.membership_level
        ? getStripePriceId(targetLevel, params.subscription.interval, targetSpecializationCode)
        : params.subscription.provider_price_id
    const autoUpgraded = Boolean(targetPriceId && targetPriceId !== params.subscription.provider_price_id)

    if (!flags.stripeDiscounts) {
        return upsertQualifiedGrant({
            admin: params.admin,
            referrerId: params.referrerId,
            qualified: {
                ...params.qualified,
                resolvedBenefit: {
                    ...params.qualified.resolvedBenefit,
                    not_applied_reason: 'stripe_discounts_disabled',
                },
            },
            status: 'qualified_not_applied',
            existing: params.existing,
            trigger: params.trigger,
        })
    }

    if (autoUpgraded && !flags.stripeUpgrades) {
        return upsertQualifiedGrant({
            admin: params.admin,
            referrerId: params.referrerId,
            qualified: {
                ...params.qualified,
                resolvedBenefit: {
                    ...params.qualified.resolvedBenefit,
                    not_applied_reason: 'stripe_upgrades_disabled',
                },
            },
            status: 'qualified_not_applied',
            existing: params.existing,
            trigger: params.trigger,
        })
    }

    if (!params.subscription.provider_subscription_id) {
        return upsertQualifiedGrant({
            admin: params.admin,
            referrerId: params.referrerId,
            qualified: params.qualified,
            status: 'sync_error',
            existing: params.existing,
            lastError: 'No Stripe subscription id is available for the qualifying member.',
            trigger: params.trigger,
        })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        return upsertQualifiedGrant({
            admin: params.admin,
            referrerId: params.referrerId,
            qualified: params.qualified,
            status: 'sync_error',
            existing: params.existing,
            lastError: 'STRIPE_SECRET_KEY is not configured.',
            trigger: params.trigger,
        })
    }

    if (autoUpgraded && !isStripePriceIdConfigured(targetPriceId)) {
        return upsertQualifiedGrant({
            admin: params.admin,
            referrerId: params.referrerId,
            qualified: params.qualified,
            status: 'sync_error',
            existing: params.existing,
            lastError: `Stripe price for membership level ${targetLevel} is not configured.`,
            trigger: params.trigger,
        })
    }

    const grantForStripe = params.existing ?? await upsertQualifiedGrant({
        admin: params.admin,
        referrerId: params.referrerId,
        qualified: params.qualified,
        status: 'qualified_not_applied',
        trigger: params.trigger,
    })

    try {
        const discountPercent = toNumber(params.qualified.resolvedBenefit.discount_percent, 100)
        const couponId = await ensureGrowthRewardCoupon(discountPercent)
        const stripeResult = await applyGrowthRewardDiscountToStripeSubscription({
            subscriptionId: params.subscription.provider_subscription_id,
            couponId,
            grantId: grantForStripe.id,
            campaignId: params.qualified.campaign.id,
            priceId: targetPriceId,
        })

        const grant = await upsertQualifiedGrant({
            admin: params.admin,
            referrerId: params.referrerId,
            qualified: params.qualified,
            status: 'applied',
            existing: grantForStripe,
            appliedFields: {
                stripe_subscription_id: params.subscription.provider_subscription_id,
                stripe_coupon_id: couponId,
                stripe_discount_id: stripeResult.discountId,
                original_subscription_item_id:
                    params.existing?.original_subscription_item_id ?? stripeResult.subscriptionItemId,
                original_price_id: params.existing?.original_price_id ?? params.subscription.provider_price_id,
                original_membership_level:
                    params.existing?.original_membership_level ?? params.subscription.membership_level,
                original_specialization_code:
                    params.existing?.original_specialization_code ?? params.subscription.specialization_code,
                auto_upgraded: autoUpgraded,
                last_stripe_sync_at: new Date().toISOString(),
            },
            trigger: params.trigger,
        })

        if (autoUpgraded) {
            await (params.admin
                .from('subscriptions') as any)
                .update({
                    membership_level: targetLevel,
                    specialization_code: targetLevel === 2 ? (targetSpecializationCode as SpecializationCode) : null,
                    provider_price_id: targetPriceId,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', params.subscription.id)

            await (params.admin
                .from('profiles') as any)
                .update({
                    membership_level: targetLevel,
                    membership_specialization_code: targetLevel === 2 ? targetSpecializationCode : null,
                    subscription_status: 'active',
                })
                .eq('id', params.referrerId)

            await syncMembershipEntitlementsForUser(params.referrerId)
        }

        return grant
    } catch (error) {
        return upsertQualifiedGrant({
            admin: params.admin,
            referrerId: params.referrerId,
            qualified: params.qualified,
            status: 'sync_error',
            existing: grantForStripe,
            lastError: error instanceof Error ? error.message : 'Failed to sync growth reward with Stripe.',
            trigger: params.trigger,
        })
    }
}

async function evaluateReferrer(params: {
    admin: SupabaseAdmin
    referrerId: string
    trigger: ReconcileTrigger
    campaigns: GrowthCampaign[]
}): Promise<EvaluatedReferrer> {
    const referrerSubscription = await getLatestQualifyingSubscription(params.admin, params.referrerId)
    const attributions = await getReferrerAttributions(params.admin, params.referrerId)
    const existingGrants = await getExistingGrants(params.admin, params.referrerId)
    const existingByCampaign = new Map(existingGrants.map((grant) => [grant.campaign_id, grant]))
    const qualified: QualifiedReward[] = []

    if (referrerSubscription && attributions.length > 0) {
        const referredIds = Array.from(new Set(attributions.map((row) => row.referred_id).filter(Boolean)))
        const referredSubscriptions = await getActiveSubscriptionsByUserId(params.admin, referredIds)
        const refundedReferredIds = await getLatestRefundedSubscriptionUserIds(params.admin, referredIds)

        for (const campaign of params.campaigns) {
            const config = normalizeGrowthRewardConfig(campaign.reward_config)
            if (!config || !isCampaignCurrentlyActive(campaign)) continue
            if (config.require_referrer_active_membership && !isQualifyingSubscription(referrerSubscription)) continue

            const referrerRoles = asStringArray(campaign.eligible_referrer_roles, ['psychologist', 'ponente'])
            const referredRoles = asStringArray(campaign.eligible_referred_roles, ['psychologist'])
            const qualifyingAttributions = attributions.filter((row) => {
                if (!isProfessionalInviteReferrerRole(row.referrer?.role)) return false
                if (!isProfessionalInviteReferredRole(row.referred?.role)) return false
                if (!referrerRoles.includes(row.referrer?.role)) return false
                if (!referredRoles.includes(row.referred?.role)) return false
                if (isHiddenGrowthProfile(row.referrer) || isHiddenGrowthProfile(row.referred)) return false
                if (refundedReferredIds.has(row.referred_id)) return false
                return referredSubscriptions.has(row.referred_id)
            })

            if (qualifyingAttributions.length < config.threshold_count) continue

            const attributionIds = qualifyingAttributions
                .slice(0, qualifyingAttributions.length)
                .map((row) => row.id as string)
            const benefit = resolveRewardBenefit({
                campaign,
                config,
                subscription: referrerSubscription,
                activeInviteCount: qualifyingAttributions.length,
                attributionIds,
            })

            qualified.push({
                campaign,
                config,
                attributionIds,
                activeInviteCount: qualifyingAttributions.length,
                resolvedBenefit: benefit.resolvedBenefit,
                monthlyValue: benefit.monthlyValue,
                priority: config.priority ?? 0,
            })
        }
    }

    const best = selectBestGrowthReward(qualified)
    const qualifiedCampaignIds = new Set(qualified.map((entry) => entry.campaign.id))
    let appliedGrantId: string | null = null

    for (const grant of existingGrants) {
        if (!qualifiedCampaignIds.has(grant.campaign_id)) {
            await revokeGrant({
                admin: params.admin,
                grant,
                reason: referrerSubscription ? 'no_longer_qualified' : 'referrer_membership_inactive',
                trigger: params.trigger,
            })
        }
    }

    for (const entry of qualified) {
        const existing = existingByCampaign.get(entry.campaign.id)
        if (best && entry.campaign.id === best.campaign.id) {
            const applied = await applyBestGrant({
                admin: params.admin,
                referrerId: params.referrerId,
                qualified: entry,
                existing,
                subscription: referrerSubscription!,
                trigger: params.trigger,
            })
            appliedGrantId = applied.id
        } else {
            if (existing?.status === 'applied') {
                await revokeGrant({
                    admin: params.admin,
                    grant: existing,
                    reason: 'better_growth_reward_selected',
                    trigger: params.trigger,
                })
            }

            await upsertQualifiedGrant({
                admin: params.admin,
                referrerId: params.referrerId,
                qualified: entry,
                status: 'qualified_not_applied',
                existing,
                trigger: params.trigger,
            })
        }
    }

    return {
        userId: params.referrerId,
        qualified,
        appliedGrantId,
    }
}

async function getAffectedReferrerIds(admin: SupabaseAdmin, userId?: string | null) {
    if (!userId) {
        const { data, error } = await (admin
            .from('invite_attributions') as any)
            .select('referrer_id')
            .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

        if (error) {
            throw new Error(`Failed to load growth reward referrers: ${error.message}`)
        }

        return Array.from(new Set((data ?? []).map((row: any) => row.referrer_id).filter(Boolean)))
    }

    const referrerIds = new Set<string>([userId])
    const { data, error } = await (admin
        .from('invite_attributions') as any)
        .select('referrer_id')
        .eq('referred_id', userId)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

    if (error) {
        throw new Error(`Failed to load affected growth reward referrers: ${error.message}`)
    }

    for (const row of data ?? []) {
        if (row.referrer_id) referrerIds.add(row.referrer_id)
    }

    return Array.from(referrerIds)
}

export async function reconcileGrowthRewards(params: {
    userId?: string | null
    trigger?: ReconcileTrigger
} = {}): Promise<ReconcileResult> {
    const flags = getGrowthRewardFeatureFlags()
    if (!flags.rewards) {
        return {
            evaluated: 0,
            errors: [],
            results: [],
            disabled: true,
            reason: 'ENABLE_GROWTH_REWARDS is not enabled',
        }
    }

    const admin = createServiceClient()
    const trigger = params.trigger ?? 'manual'
    const campaigns = await getRewardCampaigns(admin)
    const referrerIds = await getAffectedReferrerIds(admin, params.userId)
    const results: EvaluatedReferrer[] = []
    const errors: Array<{ userId: string; message: string }> = []

    for (const referrerId of referrerIds) {
        try {
            results.push(await evaluateReferrer({
                admin,
                referrerId: String(referrerId),
                trigger,
                campaigns,
            }))
        } catch (error) {
            errors.push({
                userId: String(referrerId),
                message: error instanceof Error ? error.message : 'Growth reward evaluation failed',
            })
        }
    }

    return {
        evaluated: results.length,
        errors,
        results,
    }
}

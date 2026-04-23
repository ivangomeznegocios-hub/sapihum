import { createServiceClient } from '@/lib/supabase/service'
import { ensureGrowthProfileForUser, getMemberReferralConfig } from '@/lib/growth/engine'

function getAdmin(): any {
    return createServiceClient() as any
}

function asArray<T = any>(value: unknown): T[] {
    return Array.isArray(value) ? value as T[] : []
}

function getRewardRules(config: any) {
    return Array.isArray(config?.reward_rules) ? config.reward_rules : []
}

function summarizeNextReward(config: any, qualifiedCount: number) {
    const nextRule = getRewardRules(config)
        .filter((rule: any) => Number(rule.threshold) > qualifiedCount)
        .sort((a: any, b: any) => Number(a.threshold) - Number(b.threshold))[0]

    if (!nextRule) return null

    return {
        threshold: Number(nextRule.threshold),
        remaining: Math.max(0, Number(nextRule.threshold) - qualifiedCount),
        rewardType: nextRule.reward_type,
        rewardValue: nextRule.reward_value ?? {},
        label: nextRule.reward_value?.label ?? nextRule.reward_type,
    }
}

export async function getGrowthUserDashboard(userId: string) {
    const admin = getAdmin()
    const profile = await ensureGrowthProfileForUser({ userId, programType: 'member', admin })
    const config = await getMemberReferralConfig(admin)

    const [attributionsResult, conversionsResult, rewardsResult, benefitsResult] = await Promise.all([
        (admin.from('growth_attributions') as any)
            .select(`
                *,
                invitee:profiles!growth_attributions_invitee_user_id_fkey(id, full_name, email, avatar_url, role)
            `)
            .eq('owner_profile_id', profile.id)
            .order('captured_at', { ascending: false }),
        (admin.from('growth_conversions') as any)
            .select('*')
            .eq('owner_profile_id', profile.id)
            .order('activated_at', { ascending: false }),
        (admin.from('growth_rewards') as any)
            .select('*')
            .eq('beneficiary_user_id', userId)
            .order('created_at', { ascending: false }),
        (admin.from('growth_membership_benefits') as any)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
    ])

    const attributions = asArray(attributionsResult.data)
    const conversions = asArray(conversionsResult.data)
    const rewards = asArray(rewardsResult.data)
    const benefits = asArray(benefitsResult.data)
    const qualifiedCount = conversions.filter((conversion: any) => conversion.status === 'qualified').length

    return {
        profile,
        attributions,
        conversions,
        rewards,
        benefits,
        summary: {
            totalInvites: attributions.length,
            registered: attributions.filter((row: any) => ['registered', 'paid', 'qualified'].includes(row.status)).length,
            paid: attributions.filter((row: any) => row.status === 'paid').length,
            qualified: qualifiedCount,
            pendingRewards: rewards.filter((row: any) => row.status === 'pending_review' || row.status === 'approved').length,
            grantedRewards: rewards.filter((row: any) => row.status === 'granted').length,
            nextReward: summarizeNextReward(config, qualifiedCount),
        },
    }
}

export async function getTopGrowthReferrers(limit = 10) {
    const admin = getAdmin()
    const { data } = await (admin.from('growth_attributions') as any)
        .select(`
            owner_user_id,
            status,
            owner:profiles!growth_attributions_owner_user_id_fkey(id, full_name, avatar_url, role)
        `)
        .not('owner_user_id', 'is', null)

    const map = new Map<string, any>()
    for (const row of asArray(data)) {
        if (!row.owner_user_id || !row.owner) continue
        const current = map.get(row.owner_user_id) ?? {
            id: row.owner_user_id,
            full_name: row.owner.full_name,
            avatar_url: row.owner.avatar_url,
            role: row.owner.role,
            total_referrals: 0,
            completed_referrals: 0,
        }

        current.total_referrals += 1
        if (row.status === 'qualified') current.completed_referrals += 1
        map.set(row.owner_user_id, current)
    }

    return Array.from(map.values())
        .sort((a, b) => b.completed_referrals - a.completed_referrals || b.total_referrals - a.total_referrals)
        .slice(0, limit)
}

export async function getGrowthAdminDashboard() {
    const admin = getAdmin()
    const [
        profilesCount,
        attributionsCount,
        paidCount,
        qualifiedCount,
        pendingRewardsCount,
        openFlagsCount,
        pendingRewardsResult,
        recentAttributionsResult,
        recentConversionsResult,
        openFlagsResult,
        configResult,
        topReferrers,
    ] = await Promise.all([
        (admin.from('growth_profiles') as any).select('*', { count: 'exact', head: true }).eq('status', 'active'),
        (admin.from('growth_attributions') as any).select('*', { count: 'exact', head: true }),
        (admin.from('growth_attributions') as any).select('*', { count: 'exact', head: true }).in('status', ['paid', 'qualified']),
        (admin.from('growth_attributions') as any).select('*', { count: 'exact', head: true }).eq('status', 'qualified'),
        (admin.from('growth_rewards') as any).select('*', { count: 'exact', head: true }).in('status', ['pending_review', 'approved']),
        (admin.from('growth_fraud_flags') as any).select('*', { count: 'exact', head: true }).eq('status', 'open'),
        (admin.from('growth_rewards') as any)
            .select(`
                *,
                beneficiary:profiles!growth_rewards_beneficiary_user_id_fkey(id, full_name, email, avatar_url, role)
            `)
            .in('status', ['pending_review', 'approved'])
            .order('created_at', { ascending: true })
            .limit(20),
        (admin.from('growth_attributions') as any)
            .select(`
                *,
                invitee:profiles!growth_attributions_invitee_user_id_fkey(id, full_name, email, role),
                owner:profiles!growth_attributions_owner_user_id_fkey(id, full_name, email, role)
            `)
            .order('created_at', { ascending: false })
            .limit(20),
        (admin.from('growth_conversions') as any)
            .select(`
                *,
                invitee:profiles!growth_conversions_invitee_user_id_fkey(id, full_name, email, role),
                owner:profiles!growth_conversions_owner_user_id_fkey(id, full_name, email, role)
            `)
            .order('created_at', { ascending: false })
            .limit(20),
        (admin.from('growth_fraud_flags') as any)
            .select(`
                *,
                user:profiles!growth_fraud_flags_user_id_fkey(id, full_name, email, role),
                related_user:profiles!growth_fraud_flags_related_user_id_fkey(id, full_name, email, role)
            `)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(20),
        (admin.from('growth_program_configs') as any)
            .select('*')
            .eq('program_key', 'member_referral')
            .maybeSingle(),
        getTopGrowthReferrers(20),
    ])

    return {
        stats: {
            activeProfiles: profilesCount.count ?? 0,
            totalAttributions: attributionsCount.count ?? 0,
            paidAttributions: paidCount.count ?? 0,
            qualifiedAttributions: qualifiedCount.count ?? 0,
            pendingRewards: pendingRewardsCount.count ?? 0,
            openFlags: openFlagsCount.count ?? 0,
        },
        pendingRewards: asArray(pendingRewardsResult.data),
        recentAttributions: asArray(recentAttributionsResult.data),
        recentConversions: asArray(recentConversionsResult.data),
        openFlags: asArray(openFlagsResult.data),
        config: configResult.data,
        topReferrers,
    }
}

export async function getGrowthAdminReviewData(params: {
    entityType: 'attributions' | 'conversions' | 'rewards' | 'flags'
    entityId: string
}) {
    const admin = getAdmin()
    let attributionId: string | null = null
    let conversionId: string | null = null
    let rewardId: string | null = null
    let flagId: string | null = null
    let primary: any = null

    if (params.entityType === 'attributions') {
        const { data } = await (admin.from('growth_attributions') as any)
            .select(`
                *,
                invitee:profiles!growth_attributions_invitee_user_id_fkey(id, full_name, email, role),
                owner:profiles!growth_attributions_owner_user_id_fkey(id, full_name, email, role)
            `)
            .eq('id', params.entityId)
            .maybeSingle()
        primary = data ?? null
        attributionId = data?.id ?? null
    }

    if (params.entityType === 'conversions') {
        const { data } = await (admin.from('growth_conversions') as any)
            .select(`
                *,
                invitee:profiles!growth_conversions_invitee_user_id_fkey(id, full_name, email, role),
                owner:profiles!growth_conversions_owner_user_id_fkey(id, full_name, email, role)
            `)
            .eq('id', params.entityId)
            .maybeSingle()
        primary = data ?? null
        conversionId = data?.id ?? null
        attributionId = data?.attribution_id ?? null
    }

    if (params.entityType === 'rewards') {
        const { data } = await (admin.from('growth_rewards') as any)
            .select(`
                *,
                beneficiary:profiles!growth_rewards_beneficiary_user_id_fkey(id, full_name, email, role)
            `)
            .eq('id', params.entityId)
            .maybeSingle()
        primary = data ?? null
        rewardId = data?.id ?? null
        conversionId = data?.conversion_id ?? null
        attributionId = data?.attribution_id ?? null
    }

    if (params.entityType === 'flags') {
        const { data } = await (admin.from('growth_fraud_flags') as any)
            .select(`
                *,
                user:profiles!growth_fraud_flags_user_id_fkey(id, full_name, email, role),
                related_user:profiles!growth_fraud_flags_related_user_id_fkey(id, full_name, email, role)
            `)
            .eq('id', params.entityId)
            .maybeSingle()
        primary = data ?? null
        flagId = data?.id ?? null
        conversionId = data?.growth_conversion_id ?? null
        attributionId = data?.growth_attribution_id ?? attributionId
    }

    if (!primary) return null

    const [
        attributionResult,
        conversionsResult,
        rewardsResult,
        flagsResult,
    ] = await Promise.all([
        attributionId
            ? (admin.from('growth_attributions') as any)
                .select(`
                    *,
                    invitee:profiles!growth_attributions_invitee_user_id_fkey(id, full_name, email, role),
                    owner:profiles!growth_attributions_owner_user_id_fkey(id, full_name, email, role)
                `)
                .eq('id', attributionId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        attributionId
            ? (admin.from('growth_conversions') as any)
                .select(`
                    *,
                    invitee:profiles!growth_conversions_invitee_user_id_fkey(id, full_name, email, role),
                    owner:profiles!growth_conversions_owner_user_id_fkey(id, full_name, email, role)
                `)
                .eq('attribution_id', attributionId)
                .order('created_at', { ascending: false })
            : conversionId
                ? (admin.from('growth_conversions') as any)
                    .select(`
                        *,
                        invitee:profiles!growth_conversions_invitee_user_id_fkey(id, full_name, email, role),
                        owner:profiles!growth_conversions_owner_user_id_fkey(id, full_name, email, role)
                    `)
                    .eq('id', conversionId)
                : Promise.resolve({ data: [] }),
        attributionId
            ? (admin.from('growth_rewards') as any)
                .select(`
                    *,
                    beneficiary:profiles!growth_rewards_beneficiary_user_id_fkey(id, full_name, email, role)
                `)
                .eq('attribution_id', attributionId)
                .order('created_at', { ascending: false })
            : rewardId
                ? (admin.from('growth_rewards') as any)
                    .select(`
                        *,
                        beneficiary:profiles!growth_rewards_beneficiary_user_id_fkey(id, full_name, email, role)
                    `)
                    .eq('id', rewardId)
                : Promise.resolve({ data: [] }),
        attributionId || conversionId
            ? (admin.from('growth_fraud_flags') as any)
                .select(`
                    *,
                    user:profiles!growth_fraud_flags_user_id_fkey(id, full_name, email, role),
                    related_user:profiles!growth_fraud_flags_related_user_id_fkey(id, full_name, email, role)
                `)
                .or(
                    [
                        attributionId ? `growth_attribution_id.eq.${attributionId}` : null,
                        conversionId ? `growth_conversion_id.eq.${conversionId}` : null,
                        flagId ? `id.eq.${flagId}` : null,
                    ].filter(Boolean).join(',')
                )
                .order('created_at', { ascending: false })
            : flagId
                ? (admin.from('growth_fraud_flags') as any)
                    .select(`
                        *,
                        user:profiles!growth_fraud_flags_user_id_fkey(id, full_name, email, role),
                        related_user:profiles!growth_fraud_flags_related_user_id_fkey(id, full_name, email, role)
                    `)
                    .eq('id', flagId)
                : Promise.resolve({ data: [] }),
    ])

    const rewards = asArray(rewardsResult.data)
    const rewardIds = rewards.map((reward: any) => reward.id)
    const benefitsResult = rewardIds.length > 0
        ? await (admin.from('growth_membership_benefits') as any)
            .select('*')
            .in('reward_id', rewardIds)
        : { data: [] }

    return {
        entityType: params.entityType,
        primary,
        attribution: attributionResult.data ?? null,
        conversions: asArray(conversionsResult.data),
        rewards,
        flags: asArray(flagsResult.data),
        benefits: asArray(benefitsResult.data),
    }
}

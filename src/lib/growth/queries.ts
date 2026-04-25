import { createServiceClient } from '@/lib/supabase/service'
import {
    ensureGrowthProfileForUser,
    getGrowthProgramConfig,
    getMemberReferralConfig,
    type GrowthProgramType,
} from '@/lib/growth/engine'

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

function getMonthStart(date = new Date()) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function sumRevenue(rows: any[]) {
    return rows.reduce((total, row) => {
        const amount = Number(row.amount ?? 0)
        return Number.isFinite(amount) ? total + amount : total
    }, 0)
}

function getTierInfo(config: any, currentTier?: string | null) {
    const tiers = Array.isArray(config?.tiers)
        ? config.tiers
        : [
            { tier: 'base', monthly_qualified_goal: Number(config?.monthly_goal ?? 3), label: 'Base' },
        ]
    const currentIndex = Math.max(0, tiers.findIndex((tier: any) => tier.tier === currentTier))
    const current = tiers[currentIndex] ?? tiers[0] ?? null
    const next = tiers[currentIndex + 1] ?? null

    return { tiers, current, next }
}

export async function getGrowthMonthlyLeaderboard(programType: GrowthProgramType | 'member' = 'member', limit = 10) {
    const admin = getAdmin()
    const monthStart = getMonthStart().toISOString()

    const { data: profiles } = await (admin.from('growth_profiles') as any)
        .select('id, user_id, program_type, status, referral_code')
        .eq('program_type', programType)
        .eq('status', 'active')

    const growthProfiles = asArray(profiles).filter((profile: any) => profile.user_id)
    if (growthProfiles.length === 0) return []

    const profileIds = growthProfiles.map((profile: any) => profile.id)
    const userIds = [...new Set(growthProfiles.map((profile: any) => profile.user_id).filter(Boolean))]

    const [conversionsResult, usersResult] = await Promise.all([
        (admin.from('growth_conversions') as any)
            .select('owner_profile_id, owner_user_id, status, amount, qualified_at, activated_at, created_at')
            .in('owner_profile_id', profileIds)
            .or(`qualified_at.gte.${monthStart},activated_at.gte.${monthStart}`),
        (admin.from('profiles') as any)
            .select('id, full_name, email, avatar_url, role')
            .in('id', userIds),
    ])

    const usersById = new Map(asArray(usersResult.data).map((user: any) => [user.id, user]))
    const rowsByProfileId = new Map<string, any>()

    for (const profile of growthProfiles) {
        const user = usersById.get(profile.user_id) ?? {}
        rowsByProfileId.set(profile.id, {
            id: profile.user_id,
            growth_profile_id: profile.id,
            full_name: user.full_name ?? user.email ?? 'Usuario',
            email: user.email ?? null,
            avatar_url: user.avatar_url ?? null,
            role: user.role ?? 'psychologist',
            program_type: profile.program_type,
            referral_code: profile.referral_code,
            monthly_qualified: 0,
            monthly_paid: 0,
            monthly_revenue: 0,
            latest_qualified_at: null as string | null,
            total_referrals: 0,
            completed_referrals: 0,
        })
    }

    for (const conversion of asArray(conversionsResult.data)) {
        const row = rowsByProfileId.get(conversion.owner_profile_id)
        if (!row) continue

        const activatedInMonth = conversion.activated_at && new Date(conversion.activated_at) >= new Date(monthStart)
        const qualifiedInMonth = conversion.qualified_at && new Date(conversion.qualified_at) >= new Date(monthStart)

        if (activatedInMonth && ['confirmed', 'qualified'].includes(conversion.status)) {
            row.monthly_paid += 1
            row.monthly_revenue += Number(conversion.amount ?? 0) || 0
            row.total_referrals += 1
        }

        if (qualifiedInMonth && conversion.status === 'qualified') {
            row.monthly_qualified += 1
            row.completed_referrals += 1
            if (!row.latest_qualified_at || new Date(conversion.qualified_at) > new Date(row.latest_qualified_at)) {
                row.latest_qualified_at = conversion.qualified_at
            }
        }
    }

    return Array.from(rowsByProfileId.values())
        .sort((a, b) =>
            b.monthly_qualified - a.monthly_qualified ||
            b.monthly_revenue - a.monthly_revenue ||
            new Date(b.latest_qualified_at ?? 0).getTime() - new Date(a.latest_qualified_at ?? 0).getTime()
        )
        .slice(0, limit)
        .map((row, index) => ({ ...row, rank_position: index + 1 }))
}

async function getGrowthOrganizationsDashboard(admin: any) {
    const { data: organizations } = await (admin.from('organizations') as any)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50)

    const rows = asArray(organizations)
    if (rows.length === 0) return []

    const organizationIds = rows.map((organization: any) => organization.id)
    const [profilesResult, attributionsResult, rewardsResult] = await Promise.all([
        (admin.from('growth_profiles') as any)
            .select('*')
            .eq('program_type', 'organization')
            .in('organization_id', organizationIds),
        (admin.from('growth_attributions') as any)
            .select('id, organization_id, status, created_at')
            .in('organization_id', organizationIds),
        (admin.from('growth_rewards') as any)
            .select('id, organization_id, status, reward_type, reward_value, created_at')
            .in('organization_id', organizationIds),
    ])

    const profilesByOrganizationId = new Map(asArray(profilesResult.data).map((profile: any) => [profile.organization_id, profile]))
    const profileIds = asArray(profilesResult.data).map((profile: any) => profile.id)
    const conversionsResult = profileIds.length > 0
        ? await (admin.from('growth_conversions') as any)
            .select('id, owner_profile_id, status, amount, currency, activated_at, qualified_at')
            .in('owner_profile_id', profileIds)
        : { data: [] }

    const conversions = asArray(conversionsResult.data)
    const attributions = asArray(attributionsResult.data)
    const rewards = asArray(rewardsResult.data)

    return rows.map((organization: any) => {
        const profile = profilesByOrganizationId.get(organization.id) ?? null
        const organizationAttributions = attributions.filter((row: any) => row.organization_id === organization.id)
        const organizationConversions = profile
            ? conversions.filter((row: any) => row.owner_profile_id === profile.id)
            : []
        const organizationRewards = rewards.filter((row: any) => row.organization_id === organization.id)
        const confirmedConversions = organizationConversions.filter((row: any) => ['confirmed', 'qualified'].includes(row.status))

        return {
            ...organization,
            growth_profile: profile,
            metrics: {
                registered: organizationAttributions.filter((row: any) => ['registered', 'paid', 'qualified'].includes(row.status)).length,
                paid: confirmedConversions.length,
                qualified: organizationConversions.filter((row: any) => row.status === 'qualified').length,
                revenue: sumRevenue(confirmedConversions),
                pendingRevenueShare: organizationRewards.filter((row: any) => ['pending_review', 'approved'].includes(row.status)).length,
            },
        }
    })
}

async function getGrowthPacksDashboard(admin: any) {
    const { data: packs } = await (admin.from('group_packs') as any)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50)

    const rows = asArray(packs)
    if (rows.length === 0) return []

    const packIds = rows.map((pack: any) => pack.id)
    const leaderIds = [...new Set(rows.map((pack: any) => pack.leader_user_id).filter(Boolean))]
    const [membersResult, leadersResult, rewardsResult] = await Promise.all([
        (admin.from('group_pack_members') as any)
            .select('*')
            .in('group_pack_id', packIds)
            .order('created_at', { ascending: true }),
        leaderIds.length > 0
            ? (admin.from('profiles') as any)
                .select('id, full_name, email, role')
                .in('id', leaderIds)
            : Promise.resolve({ data: [] }),
        (admin.from('growth_rewards') as any)
            .select('id, group_pack_id, status, reward_type, reward_value, created_at')
            .in('group_pack_id', packIds),
    ])

    const members = asArray(membersResult.data)
    const rewards = asArray(rewardsResult.data)
    const leadersById = new Map(asArray(leadersResult.data).map((leader: any) => [leader.id, leader]))

    return rows.map((pack: any) => {
        const packMembers = members.filter((member: any) => member.group_pack_id === pack.id)
        const packRewards = rewards.filter((reward: any) => reward.group_pack_id === pack.id)

        return {
            ...pack,
            leader: pack.leader_user_id ? leadersById.get(pack.leader_user_id) ?? null : null,
            members: packMembers,
            reward: packRewards[0] ?? null,
            metrics: {
                invited: packMembers.length,
                registered: packMembers.filter((member: any) => ['registered', 'activated', 'active'].includes(member.status)).length,
                active: packMembers.filter((member: any) => member.status === 'active').length,
                missing: Math.max(0, Number(pack.required_members ?? 0) - Number(pack.active_members_count ?? 0)),
            },
        }
    })
}

export async function getGrowthUserDashboard(userId: string) {
    const admin = getAdmin()
    const memberProfile = await ensureGrowthProfileForUser({ userId, programType: 'member', admin })
    const { data: activeEnrollment } = await (admin.from('growth_program_enrollments') as any)
        .select('*')
        .eq('user_id', userId)
        .in('program_type', ['host', 'ambassador'])
        .in('status', ['active', 'approved'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    const programType = (activeEnrollment?.program_type ?? 'member') as GrowthProgramType
    const profile = activeEnrollment
        ? await ensureGrowthProfileForUser({ userId, programType, admin })
        : memberProfile
    const config = activeEnrollment
        ? await getGrowthProgramConfig(programType, admin)
        : await getMemberReferralConfig(admin)
    const monthStart = getMonthStart().toISOString()

    const [attributionsResult, conversionsResult, rewardsResult, benefitsResult, groupPacksResult] = await Promise.all([
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
        (admin.from('group_packs') as any)
            .select('*')
            .eq('leader_user_id', userId)
            .order('updated_at', { ascending: false }),
    ])

    const attributions = asArray(attributionsResult.data)
    const conversions = asArray(conversionsResult.data)
    const rewards = asArray(rewardsResult.data)
    const benefits = asArray(benefitsResult.data)
    const groupPacks = asArray(groupPacksResult.data)
    const packIds = groupPacks.map((pack: any) => pack.id)
    const groupPackMembersResult = packIds.length > 0
        ? await (admin.from('group_pack_members') as any)
            .select('*')
            .in('group_pack_id', packIds)
            .order('created_at', { ascending: true })
        : { data: [] }
    const groupPackMembers = asArray(groupPackMembersResult.data)
    const groupPacksWithMembers = groupPacks.map((pack: any) => ({
        ...pack,
        members: groupPackMembers.filter((member: any) => member.group_pack_id === pack.id),
        missing: Math.max(0, Number(pack.required_members ?? 0) - Number(pack.active_members_count ?? 0)),
    }))
    const qualifiedCount = conversions.filter((conversion: any) => conversion.status === 'qualified').length
    const monthlyConversions = conversions.filter((conversion: any) => {
        const activatedAt = conversion.activated_at ? new Date(conversion.activated_at) : null
        const qualifiedAt = conversion.qualified_at ? new Date(conversion.qualified_at) : null
        const month = new Date(monthStart)
        return (activatedAt && activatedAt >= month) || (qualifiedAt && qualifiedAt >= month)
    })
    const monthlyQualified = monthlyConversions.filter((conversion: any) => (
        conversion.status === 'qualified' &&
        conversion.qualified_at &&
        new Date(conversion.qualified_at) >= new Date(monthStart)
    )).length
    const monthlyPaid = monthlyConversions.filter((conversion: any) => (
        ['confirmed', 'qualified'].includes(conversion.status) &&
        conversion.activated_at &&
        new Date(conversion.activated_at) >= new Date(monthStart)
    )).length
    const monthlyRevenue = sumRevenue(monthlyConversions.filter((conversion: any) => (
        ['confirmed', 'qualified'].includes(conversion.status) &&
        conversion.activated_at &&
        new Date(conversion.activated_at) >= new Date(monthStart)
    )))
    const tierInfo = getTierInfo(config, activeEnrollment?.tier)
    const leaderboard = activeEnrollment
        ? await getGrowthMonthlyLeaderboard(programType, 10)
        : []
    const currentRanking = leaderboard.find((row: any) => row.id === userId) ?? null

    return {
        profile,
        memberProfile,
        programEnrollment: activeEnrollment ?? null,
        programType,
        programConfig: config,
        programLeaderboard: leaderboard,
        currentRanking,
        attributions,
        conversions,
        rewards,
        benefits,
        groupPacks: groupPacksWithMembers,
        summary: {
            totalInvites: attributions.length,
            registered: attributions.filter((row: any) => ['registered', 'paid', 'qualified'].includes(row.status)).length,
            paid: attributions.filter((row: any) => row.status === 'paid').length,
            qualified: qualifiedCount,
            pendingRewards: rewards.filter((row: any) => row.status === 'pending_review' || row.status === 'approved').length,
            grantedRewards: rewards.filter((row: any) => row.status === 'granted').length,
            nextReward: summarizeNextReward(config, qualifiedCount),
        },
        programSummary: activeEnrollment
            ? {
                monthlyQualified,
                monthlyPaid,
                monthlyRevenue,
                monthlyGoal: Number(config.monthly_goal ?? tierInfo.current?.monthly_qualified_goal ?? 0),
                tier: activeEnrollment.tier ?? 'base',
                currentTier: tierInfo.current,
                nextTier: tierInfo.next,
                pendingRewards: rewards.filter((row: any) => (
                    row.growth_profile_id === profile.id &&
                    ['pending_review', 'approved'].includes(row.status)
                )).length,
                nextReward: summarizeNextReward(config, monthlyQualified),
            }
            : null,
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
    await Promise.all([
        getGrowthProgramConfig('host', admin),
        getGrowthProgramConfig('ambassador', admin),
        getGrowthProgramConfig('organization', admin),
        getGrowthProgramConfig('group_pack', admin),
    ])
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
        hostConfigResult,
        ambassadorConfigResult,
        organizationConfigResult,
        groupPackConfigResult,
        programEnrollmentsResult,
        organizations,
        groupPacks,
        topReferrers,
        hostLeaderboard,
        ambassadorLeaderboard,
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
                beneficiary:profiles!growth_rewards_beneficiary_user_id_fkey(id, full_name, email, avatar_url, role),
                organization:organizations!growth_rewards_organization_id_fkey(id, name, partner_code),
                group_pack:group_packs!growth_rewards_group_pack_id_fkey(id, pack_code, pack_type)
            `)
            .in('status', ['pending_review', 'approved'])
            .order('created_at', { ascending: true })
            .limit(20),
        (admin.from('growth_attributions') as any)
            .select(`
                *,
                invitee:profiles!growth_attributions_invitee_user_id_fkey(id, full_name, email, role),
                owner:profiles!growth_attributions_owner_user_id_fkey(id, full_name, email, role),
                organization:organizations!growth_attributions_organization_id_fkey(id, name, partner_code)
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
        (admin.from('growth_program_configs') as any)
            .select('*')
            .eq('program_key', 'host_program')
            .maybeSingle(),
        (admin.from('growth_program_configs') as any)
            .select('*')
            .eq('program_key', 'ambassador_program')
            .maybeSingle(),
        (admin.from('growth_program_configs') as any)
            .select('*')
            .eq('program_key', 'organization_program')
            .maybeSingle(),
        (admin.from('growth_program_configs') as any)
            .select('*')
            .eq('program_key', 'group_pack_program')
            .maybeSingle(),
        (admin.from('growth_program_enrollments') as any)
            .select(`
                *,
                user:profiles!growth_program_enrollments_user_id_fkey(id, full_name, email, role),
                growth_profile:growth_profiles!growth_program_enrollments_growth_profile_id_fkey(id, referral_code, referral_link_slug, status, program_type)
            `)
            .in('program_type', ['host', 'ambassador'])
            .order('updated_at', { ascending: false })
            .limit(50),
        getGrowthOrganizationsDashboard(admin),
        getGrowthPacksDashboard(admin),
        getTopGrowthReferrers(20),
        getGrowthMonthlyLeaderboard('host', 10),
        getGrowthMonthlyLeaderboard('ambassador', 10),
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
        hostConfig: hostConfigResult.data,
        ambassadorConfig: ambassadorConfigResult.data,
        organizationConfig: organizationConfigResult.data,
        groupPackConfig: groupPackConfigResult.data,
        programEnrollments: asArray(programEnrollmentsResult.data),
        organizations,
        groupPacks,
        hostLeaderboard,
        ambassadorLeaderboard,
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

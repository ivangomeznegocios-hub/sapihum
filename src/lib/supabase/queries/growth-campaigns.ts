import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PROFESSIONAL_INVITE_PROGRAM_TYPE } from '@/lib/growth/programs'
import { normalizeGrowthRewardConfig } from '@/lib/growth/reward-engine'
import type { GrowthCampaign } from '@/types/database'
import {
    type GrowthDashboardQueryOptions,
    isHiddenGrowthProfile,
    shouldShowGrowthAttribution,
} from './growth-dashboard-filters'

// ============================================
// GET ACTIVE CAMPAIGNS (filtered by user role)
// ============================================
export async function getActiveCampaigns(userRole: string): Promise<GrowthCampaign[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('growth_campaigns')
        .select('*')
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
        .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
        .contains('target_roles', [userRole])
        .order('sort_order', { ascending: true })

    if (error) {
        console.error('Error fetching active campaigns:', JSON.stringify(error, null, 2))
        return []
    }

    return (data || []) as GrowthCampaign[]
}

// ============================================
// GET ALL CAMPAIGNS (admin)
// ============================================
export async function getAllCampaigns(): Promise<GrowthCampaign[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('growth_campaigns')
        .select('*')
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all campaigns:', JSON.stringify(error, null, 2))
        return []
    }

    return (data || []) as GrowthCampaign[]
}

// ============================================
// GET TOP REFERRERS (leaderboard)
// ============================================
export async function getTopReferrers(
    limit: number = 10,
    options: GrowthDashboardQueryOptions = {}
): Promise<{
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string
    total_referrals: number
    completed_referrals: number
}[]> {
    const supabase = await createClient()

    // Get all attributions with referrer profiles
    const { data: attributions, error } = await (supabase as any)
        .from('invite_attributions')
        .select(`
            referrer_id,
            status,
            referrer:profiles!invite_attributions_referrer_id_fkey(*),
            referred:profiles!invite_attributions_referred_id_fkey(*)
        `)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

    if (error) {
        console.error('Error fetching top referrers:', JSON.stringify(error, null, 2))
        return []
    }

    // Aggregate by referrer
    const referrerMap = new Map<string, {
        id: string
        full_name: string | null
        avatar_url: string | null
        role: string
        total_referrals: number
        completed_referrals: number
    }>()

    for (const attr of (attributions || []).filter((row: any) => shouldShowGrowthAttribution(row, options))) {
        const referrer = attr.referrer
        if (!referrer) continue

        const existing = referrerMap.get(referrer.id)
        if (existing) {
            existing.total_referrals++
            if (attr.status === 'completed' || attr.status === 'rewarded') {
                existing.completed_referrals++
            }
        } else {
            referrerMap.set(referrer.id, {
                id: referrer.id,
                full_name: referrer.full_name,
                avatar_url: referrer.avatar_url,
                role: referrer.role,
                total_referrals: 1,
                completed_referrals: (attr.status === 'completed' || attr.status === 'rewarded') ? 1 : 0,
            })
        }
    }

    // Sort by total referrals and limit
    return Array.from(referrerMap.values())
        .sort((a, b) => b.total_referrals - a.total_referrals)
        .slice(0, limit)
}

export async function getGrowthRewardProgress(userId: string, userRole: string): Promise<Array<{
    campaign: GrowthCampaign
    thresholdCount: number
    activeInviteCount: number
    qualifyingInviteNames: string[]
    grantStatus: string | null
    activeBenefit: Record<string, any> | null
    lastEvaluatedAt: string | null
}>> {
    const admin = createServiceClient()
    const now = new Date().toISOString()

    const { data: campaigns, error: campaignError } = await (admin as any)
        .from('growth_campaigns')
        .select('*')
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .contains('target_roles', [userRole])
        .order('sort_order', { ascending: true })

    if (campaignError) {
        console.error('Error fetching growth reward progress campaigns:', campaignError)
        return []
    }

    const rewardCampaigns = ((campaigns ?? []) as GrowthCampaign[])
        .filter((campaign) => normalizeGrowthRewardConfig(campaign.reward_config))

    if (rewardCampaigns.length === 0) return []

    const { data: attributions, error: attributionError } = await (admin as any)
        .from('invite_attributions')
        .select(`
            *,
            referrer:profiles!invite_attributions_referrer_id_fkey(*),
            referred:profiles!invite_attributions_referred_id_fkey(*)
        `)
        .eq('referrer_id', userId)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

    if (attributionError) {
        console.error('Error fetching growth reward progress attributions:', attributionError)
        return []
    }

    const referredIds = Array.from(new Set((attributions ?? []).map((row: any) => row.referred_id).filter(Boolean)))
    const { data: subscriptions } = referredIds.length > 0
        ? await (admin as any)
            .from('subscriptions')
            .select('user_id, status, cancel_at_period_end')
            .in('user_id', referredIds)
            .in('status', ['active', 'trialing'])
            .eq('cancel_at_period_end', false)
        : { data: [] }

    const activeReferredIds = new Set((subscriptions ?? []).map((row: any) => row.user_id))

    const { data: grants } = await (admin as any)
        .from('growth_reward_grants')
        .select('*')
        .eq('beneficiary_id', userId)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

    const grantsByCampaign = new Map((grants ?? []).map((grant: any) => [grant.campaign_id, grant]))

    return rewardCampaigns.map((campaign) => {
        const config = normalizeGrowthRewardConfig(campaign.reward_config)!
        const eligibleReferrers = campaign.eligible_referrer_roles?.length ? campaign.eligible_referrer_roles : ['psychologist', 'ponente']
        const eligibleReferred = campaign.eligible_referred_roles?.length ? campaign.eligible_referred_roles : ['psychologist']
        const qualifying = (attributions ?? []).filter((row: any) => {
            if (isHiddenGrowthProfile(row.referrer) || isHiddenGrowthProfile(row.referred)) return false
            if (!eligibleReferrers.includes(row.referrer?.role)) return false
            if (!eligibleReferred.includes(row.referred?.role)) return false
            return activeReferredIds.has(row.referred_id)
        })
        const grant = grantsByCampaign.get(campaign.id) as any

        return {
            campaign,
            thresholdCount: config.threshold_count,
            activeInviteCount: qualifying.length,
            qualifyingInviteNames: qualifying.map((row: any) => row.referred?.full_name || row.referred?.email || 'Invitado'),
            grantStatus: grant?.status ?? null,
            activeBenefit: grant?.status === 'applied' ? grant.resolved_benefit : null,
            lastEvaluatedAt: grant?.last_evaluated_at ?? null,
        }
    })
}

export async function getGrowthRewardGrantAdminRows(): Promise<Array<{
    id: string
    status: string
    beneficiaryName: string
    beneficiaryEmail: string | null
    campaignTitle: string
    resolvedBenefit: Record<string, any>
    lastEvaluatedAt: string | null
    lastStripeSyncAt: string | null
    lastError: string | null
}>> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('growth_reward_grants')
        .select(`
            *,
            beneficiary:profiles!growth_reward_grants_beneficiary_id_fkey(full_name,email),
            campaign:growth_campaigns!growth_reward_grants_campaign_id_fkey(title)
        `)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)
        .order('updated_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching growth reward grants for admin:', error)
        return []
    }

    return (data ?? []).map((row: any) => ({
        id: row.id,
        status: row.status,
        beneficiaryName: row.beneficiary?.full_name || row.beneficiary?.email || 'Usuario',
        beneficiaryEmail: row.beneficiary?.email ?? null,
        campaignTitle: row.campaign?.title || 'Programa',
        resolvedBenefit: row.resolved_benefit ?? {},
        lastEvaluatedAt: row.last_evaluated_at ?? null,
        lastStripeSyncAt: row.last_stripe_sync_at ?? null,
        lastError: row.last_error ?? null,
    }))
}

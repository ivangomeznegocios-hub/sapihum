import { createClient } from '@/lib/supabase/server'
import {
    PROFESSIONAL_INVITE_PROGRAM_TYPE,
    isProfessionalInviteReferrerRole,
} from '@/lib/growth/programs'
import type {
    InviteCode,
    InviteAttribution,
    InviteAttributionWithProfiles,
    InviteRewardEvent,
} from '@/types/database'
import {
    type GrowthDashboardQueryOptions,
    isHiddenGrowthProfile,
    shouldShowGrowthAttribution,
    shouldShowGrowthReward,
} from './growth-dashboard-filters'

// ============================================
// INVITE CODE QUERIES
// ============================================

/**
 * Get an invite code by its owner's user ID
 */
export async function getInviteCodeByOwner(ownerId: string): Promise<InviteCode | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('invite_codes')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle()

    if (error) {
        console.error('Error fetching invite code by owner:', error)
        return null
    }

    return data as InviteCode | null
}

/**
 * Look up an invite code by its code string
 */
export async function getInviteCodeByCode(code: string): Promise<InviteCode | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('invite_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle()

    if (error) {
        console.error('Error fetching invite code:', error)
        return null
    }

    return data as InviteCode | null
}

// ============================================
// INVITE ATTRIBUTION QUERIES
// ============================================

/**
 * Get all people invited by a specific user
 */
export async function getInviteAttributionsByReferrer(
    referrerId: string,
    options: GrowthDashboardQueryOptions = {}
): Promise<InviteAttributionWithProfiles[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('invite_attributions')
        .select(`
            *,
            referrer:profiles!invite_attributions_referrer_id_fkey(*),
            referred:profiles!invite_attributions_referred_id_fkey(*)
        `)
        .eq('referrer_id', referrerId)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)
        .order('attributed_at', { ascending: false })

    if (error) {
        console.error('Error fetching invite attributions:', error)
        return []
    }

    return (data || []).filter((row: any) => shouldShowGrowthAttribution(row, options)) as InviteAttributionWithProfiles[]
}

/**
 * Get the attribution for a specific referred user (who invited them?)
 */
export async function getAttributionForUser(
    referredId: string,
    options: GrowthDashboardQueryOptions = {}
): Promise<InviteAttribution | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('invite_attributions')
        .select(`
            *,
            referrer:profiles!invite_attributions_referrer_id_fkey(*),
            referred:profiles!invite_attributions_referred_id_fkey(*)
        `)
        .eq('referred_id', referredId)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)
        .maybeSingle()

    if (error) {
        console.error('Error fetching attribution for user:', error)
        return null
    }

    if (!data || !shouldShowGrowthAttribution(data, options)) return null

    return data as InviteAttribution | null
}

// ============================================
// INVITE REWARD EVENT QUERIES
// ============================================

/**
 * Get reward events for a specific user (beneficiary)
 */
export async function getInviteRewardEvents(
    beneficiaryId: string,
    options: GrowthDashboardQueryOptions = {}
): Promise<InviteRewardEvent[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('invite_reward_events')
        .select(`
            *,
            beneficiary:profiles!invite_reward_events_beneficiary_id_fkey(*),
            attribution:invite_attributions!invite_reward_events_attribution_id_fkey(
                *,
                referrer:profiles!invite_attributions_referrer_id_fkey(*),
                referred:profiles!invite_attributions_referred_id_fkey(*)
            )
        `)
        .eq('beneficiary_id', beneficiaryId)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching reward events:', JSON.stringify(error, null, 2))
        return []
    }

    return (data || []).filter((row: any) => shouldShowGrowthReward(row, options)) as InviteRewardEvent[]
}

/**
 * Get unprocessed reward events (for admin processing)
 */
export async function getUnprocessedRewardEvents(
    options: GrowthDashboardQueryOptions = {}
): Promise<InviteRewardEvent[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('invite_reward_events')
        .select(`
            *,
            beneficiary:profiles!invite_reward_events_beneficiary_id_fkey(*),
            attribution:invite_attributions!invite_reward_events_attribution_id_fkey(
                *,
                referrer:profiles!invite_attributions_referrer_id_fkey(*),
                referred:profiles!invite_attributions_referred_id_fkey(*)
            )
        `)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)
        .eq('processed', false)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching unprocessed reward events:', JSON.stringify(error, null, 2))
        return []
    }

    return (data || []).filter((row: any) => shouldShowGrowthReward(row, options)) as InviteRewardEvent[]
}

// ============================================
// ADMIN: AGGREGATE STATS
// ============================================

/**
 * Get global invite stats for admin dashboard
 */
export async function getInviteSystemStats(options: GrowthDashboardQueryOptions = {}): Promise<{
    totalCodes: number
    totalAttributions: number
    completedAttributions: number
    rewardedAttributions: number
    pendingRewards: number
    psychologistAttributions: number
    ponenteAttributions: number
} | null> {
    const supabase = await createClient()

    // Count codes that belong to commercial-visible profiles.
    const { data: inviteCodes } = await (supabase as any)
        .from('invite_codes')
        .select(`
            id,
            owner:profiles!invite_codes_owner_id_fkey(*)
        `)

    const { data: attributionRows } = await (supabase as any)
        .from('invite_attributions')
        .select(`
            *,
            referrer:profiles!invite_attributions_referrer_id_fkey(*),
            referred:profiles!invite_attributions_referred_id_fkey(*)
        `)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

    const { data: rewardRows } = await (supabase as any)
        .from('invite_reward_events')
        .select(`
            *,
            beneficiary:profiles!invite_reward_events_beneficiary_id_fkey(*),
            attribution:invite_attributions!invite_reward_events_attribution_id_fkey(
                *,
                referrer:profiles!invite_attributions_referrer_id_fkey(*),
                referred:profiles!invite_attributions_referred_id_fkey(*)
            )
        `)
        .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

    const professionalCodes = (inviteCodes || []).filter((row: any) => isProfessionalInviteReferrerRole(row.owner?.role))
    const visibleCodes = options.includeHistory
        ? professionalCodes
        : professionalCodes.filter((row: any) => !isHiddenGrowthProfile(row.owner))
    const visibleAttributions = (attributionRows || []).filter((row: any) => shouldShowGrowthAttribution(row, options))
    const visibleRewards = (rewardRows || []).filter((row: any) => shouldShowGrowthReward(row, options))

    const psychologistAttributions = visibleAttributions.filter(
        (row: any) => row.referred?.role === 'psychologist'
    ).length
    const ponenteAttributions = visibleAttributions.filter(
        (row: any) => row.referred?.role === 'ponente'
    ).length

    return {
        totalCodes: visibleCodes.length,
        totalAttributions: visibleAttributions.length,
        completedAttributions: visibleAttributions.filter(
            (row: any) => row.status === 'completed' || row.status === 'rewarded'
        ).length,
        rewardedAttributions: visibleAttributions.filter((row: any) => row.status === 'rewarded').length,
        pendingRewards: visibleRewards.filter((row: any) => !row.processed).length,
        psychologistAttributions,
        ponenteAttributions,
    }
}

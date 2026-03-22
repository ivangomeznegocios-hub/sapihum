import { createClient } from '@/lib/supabase/server'
import type {
    InviteCode,
    InviteAttribution,
    InviteAttributionWithProfiles,
    InviteRewardEvent,
} from '@/types/database'

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
    referrerId: string
): Promise<InviteAttributionWithProfiles[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('invite_attributions')
        .select(`
            *,
            referred:referred_id(id, full_name, avatar_url, role, created_at)
        `)
        .eq('referrer_id', referrerId)
        .eq('program_type', 'professional_invite')
        .order('attributed_at', { ascending: false })

    if (error) {
        console.error('Error fetching invite attributions:', error)
        return []
    }

    return (data || []) as InviteAttributionWithProfiles[]
}

/**
 * Get the attribution for a specific referred user (who invited them?)
 */
export async function getAttributionForUser(
    referredId: string
): Promise<InviteAttribution | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('invite_attributions')
        .select(`
            *,
            referrer:referrer_id(id, full_name, avatar_url, role)
        `)
        .eq('referred_id', referredId)
        .eq('program_type', 'professional_invite')
        .maybeSingle()

    if (error) {
        console.error('Error fetching attribution for user:', error)
        return null
    }

    return data as InviteAttribution | null
}

// ============================================
// INVITE REWARD EVENT QUERIES
// ============================================

/**
 * Get reward events for a specific user (beneficiary)
 */
export async function getInviteRewardEvents(
    beneficiaryId: string
): Promise<InviteRewardEvent[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('invite_reward_events')
        .select('*')
        .eq('beneficiary_id', beneficiaryId)
        .eq('program_type', 'professional_invite')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching reward events:', JSON.stringify(error, null, 2))
        return []
    }

    return (data || []) as InviteRewardEvent[]
}

/**
 * Get unprocessed reward events (for admin processing)
 */
export async function getUnprocessedRewardEvents(): Promise<InviteRewardEvent[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('invite_reward_events')
        .select(`
            *,
            beneficiary:beneficiary_id(id, full_name, avatar_url, role)
        `)
        .eq('program_type', 'professional_invite')
        .eq('processed', false)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching unprocessed reward events:', JSON.stringify(error, null, 2))
        return []
    }

    return (data || []) as InviteRewardEvent[]
}

// ============================================
// ADMIN: AGGREGATE STATS
// ============================================

/**
 * Get global invite stats for admin dashboard
 */
export async function getInviteSystemStats(): Promise<{
    totalCodes: number
    totalAttributions: number
    completedAttributions: number
    rewardedAttributions: number
    pendingRewards: number
    psychologistAttributions: number
    ponenteAttributions: number
} | null> {
    const supabase = await createClient()

    // Count codes
    const { count: totalCodes } = await (supabase as any)
        .from('invite_codes')
        .select('*', { count: 'exact', head: true })

    // Count attributions by status
    const { count: totalAttributions } = await (supabase as any)
        .from('invite_attributions')
        .select('*', { count: 'exact', head: true })
        .eq('program_type', 'professional_invite')

    const { count: completedAttributions } = await (supabase as any)
        .from('invite_attributions')
        .select('*', { count: 'exact', head: true })
        .eq('program_type', 'professional_invite')
        .in('status', ['completed', 'rewarded'])

    const { count: rewardedAttributions } = await (supabase as any)
        .from('invite_attributions')
        .select('*', { count: 'exact', head: true })
        .eq('program_type', 'professional_invite')
        .eq('status', 'rewarded')

    // Count unprocessed rewards
    const { count: pendingRewards } = await (supabase as any)
        .from('invite_reward_events')
        .select('*', { count: 'exact', head: true })
        .eq('program_type', 'professional_invite')
        .eq('processed', false)

    const { data: attributionRoles } = await (supabase as any)
        .from('invite_attributions')
        .select(`
            referred:referred_id(role)
        `)
        .eq('program_type', 'professional_invite')

    const psychologistAttributions = (attributionRoles || []).filter(
        (row: any) => row.referred?.role === 'psychologist'
    ).length
    const ponenteAttributions = (attributionRoles || []).filter(
        (row: any) => row.referred?.role === 'ponente'
    ).length

    return {
        totalCodes: totalCodes || 0,
        totalAttributions: totalAttributions || 0,
        completedAttributions: completedAttributions || 0,
        rewardedAttributions: rewardedAttributions || 0,
        pendingRewards: pendingRewards || 0,
        psychologistAttributions,
        ponenteAttributions,
    }
}

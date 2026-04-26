import { createClient } from '@/lib/supabase/server'
import { PROFESSIONAL_INVITE_PROGRAM_TYPE } from '@/lib/growth/programs'
import type { GrowthCampaign } from '@/types/database'
import {
    type GrowthDashboardQueryOptions,
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

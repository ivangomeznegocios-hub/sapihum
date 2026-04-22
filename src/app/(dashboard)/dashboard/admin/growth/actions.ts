'use server'

import { createClient } from '@/lib/supabase/server'
import {
    approveGrowthReward,
    consolidateEligibleGrowthConversions,
    grantGrowthReward,
    revokeGrowthReward,
} from '@/lib/growth/engine'
import { revalidatePath } from 'next/cache'

// ============================================
// PROCESS REWARD EVENT (mark as processed)
// ============================================
export async function processRewardEvent(rewardEventId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Solo administradores' }
        }

        const { error } = await (supabase as any)
            .from('invite_reward_events')
            .update({
                processed: true,
                processed_at: new Date().toISOString(),
            })
            .eq('id', rewardEventId)
            .eq('program_type', 'professional_invite')

        if (error) {
            console.error('Error processing reward event:', error)
            return { success: false, error: 'Error al procesar recompensa' }
        }

        revalidatePath('/dashboard/admin/growth')
        revalidatePath('/dashboard/growth')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in processRewardEvent:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { supabase, user: null, error: 'Usuario no autenticado' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'admin') {
        return { supabase, user: null, error: 'Solo administradores' }
    }

    return { supabase, user, error: null }
}

export async function approveGrowthRewardAction(rewardId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        await approveGrowthReward({ rewardId, approvedBy: user.id, admin: supabase })
        revalidatePath('/dashboard/admin/growth')
        revalidatePath('/dashboard/growth')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in approveGrowthRewardAction:', err)
        return { success: false, error: 'Error al aprobar reward' }
    }
}

export async function grantGrowthRewardAction(rewardId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        await grantGrowthReward({
            rewardId,
            grantedBy: user.id,
            admin: supabase,
            notes: 'Reward otorgado por admin desde panel growth',
        })
        revalidatePath('/dashboard/admin/growth')
        revalidatePath('/dashboard/growth')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in grantGrowthRewardAction:', err)
        return { success: false, error: 'Error al otorgar reward' }
    }
}

export async function revokeGrowthRewardAction(rewardId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        await revokeGrowthReward({
            rewardId,
            revokedBy: user.id,
            reason: 'Reward revocado por admin desde panel growth',
            admin: supabase,
        })
        revalidatePath('/dashboard/admin/growth')
        revalidatePath('/dashboard/growth')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in revokeGrowthRewardAction:', err)
        return { success: false, error: 'Error al revocar reward' }
    }
}

export async function consolidateGrowthNowAction(): Promise<{
    success: boolean
    qualified?: number
    blocked?: number
    error?: string
}> {
    try {
        const { supabase, error } = await requireAdmin()
        if (error) return { success: false, error }

        const result = await consolidateEligibleGrowthConversions({ admin: supabase })
        revalidatePath('/dashboard/admin/growth')
        revalidatePath('/dashboard/growth')
        return { success: true, ...result }
    } catch (err) {
        console.error('Unexpected error in consolidateGrowthNowAction:', err)
        return { success: false, error: 'Error al consolidar conversiones' }
    }
}

export async function updateMemberReferralConfigAction(formData: FormData): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { supabase, user, error } = await requireAdmin()
        if (error || !user) return { success: false, error: error ?? 'Solo administradores' }

        const attributionWindowDays = Number(formData.get('attributionWindowDays') || 30)
        const consolidationDays = Number(formData.get('consolidationDays') || 30)
        const safeAttributionWindow = Number.isFinite(attributionWindowDays) && attributionWindowDays > 0
            ? Math.trunc(attributionWindowDays)
            : 30
        const safeConsolidationDays = Number.isFinite(consolidationDays) && consolidationDays > 0
            ? Math.trunc(consolidationDays)
            : 30

        const { data: current } = await (supabase as any)
            .from('growth_program_configs')
            .select('config_json')
            .eq('program_key', 'member_referral')
            .maybeSingle()

        const nextConfig = {
            ...((current?.config_json && typeof current.config_json === 'object') ? current.config_json : {}),
            attribution_window_days: safeAttributionWindow,
            consolidation_days: safeConsolidationDays,
        }

        const { error: updateError } = await (supabase as any)
            .from('growth_program_configs')
            .upsert(
                {
                    program_key: 'member_referral',
                    config_json: nextConfig,
                    is_active: true,
                    updated_by: user.id,
                },
                { onConflict: 'program_key' }
            )

        if (updateError) {
            return { success: false, error: 'Error al guardar configuracion' }
        }

        revalidatePath('/dashboard/admin/growth')
        revalidatePath('/dashboard/growth')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in updateMemberReferralConfigAction:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

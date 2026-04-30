'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PROFESSIONAL_INVITE_PROGRAM_TYPE } from '@/lib/growth/programs'
import { normalizeGrowthRewardConfig, reconcileGrowthRewards } from '@/lib/growth/reward-engine'
import type { GrowthCampaignInsert, GrowthCampaignUpdate } from '@/types/database'

const allowedMembershipTargets = new Set(['current', 1, 2, 3, '1', '2', '3'])

async function reconcileAfterCampaignChange() {
    try {
        await reconcileGrowthRewards({ trigger: 'campaign_changed' })
    } catch (error) {
        console.error('Error reconciling growth rewards after campaign change:', error)
    }
}

function validateCampaignPayload(data: GrowthCampaignInsert | GrowthCampaignUpdate) {
    if ('title' in data && typeof data.title === 'string' && !data.title.trim()) {
        return 'El titulo es requerido'
    }

    if (Array.isArray(data.target_roles) && data.target_roles.length === 0) {
        return 'Define al menos un rol visible'
    }
    if (Array.isArray(data.eligible_referrer_roles) && data.eligible_referrer_roles.length === 0) {
        return 'Define al menos un rol que puede invitar'
    }
    if (Array.isArray(data.eligible_referred_roles) && data.eligible_referred_roles.length === 0) {
        return 'Define al menos un rol invitable'
    }

    if (data.starts_at && data.ends_at) {
        const startsAt = new Date(data.starts_at)
        const endsAt = new Date(data.ends_at)
        if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
            return 'Las fechas no son validas'
        }
        if (endsAt <= startsAt) {
            return 'La fecha de fin debe ser posterior al inicio'
        }
    }

    if (data.reward_config) {
        const config = normalizeGrowthRewardConfig(data.reward_config)
        if (!config) return 'La configuracion de recompensa no es valida'
        if (config.threshold_count < 1) return 'El hito debe ser mayor a cero'
        if (!allowedMembershipTargets.has(config.target_membership_level)) return 'El nivel objetivo no es valido'
        if ((config.discount_percent ?? 0) < 1 || (config.discount_percent ?? 0) > 100) {
            return 'El descuento debe estar entre 1% y 100%'
        }
    }

    return null
}

// ============================================
// CREATE CAMPAIGN
// ============================================
export async function createCampaign(data: GrowthCampaignInsert): Promise<{
    success: boolean
    campaignId?: string
    error?: string
}> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' }
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Solo administradores pueden crear campañas' }
        }

        const validationError = validateCampaignPayload(data)
        if (validationError) {
            return { success: false, error: validationError }
        }

        const { data: campaign, error } = await (supabase as any)
            .from('growth_campaigns')
            .insert({
                ...data,
                program_type: PROFESSIONAL_INVITE_PROGRAM_TYPE,
                created_by: user.id,
            })
            .select('id')
            .single()

        if (error) {
            console.error('Error creating campaign:', error)
            return { success: false, error: 'Error al crear campaña' }
        }

        revalidatePath('/dashboard/admin/growth')
        revalidatePath('/dashboard/growth')
        await reconcileAfterCampaignChange()

        return { success: true, campaignId: campaign?.id }
    } catch (err) {
        console.error('Unexpected error in createCampaign:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

// ============================================
// UPDATE CAMPAIGN
// ============================================
export async function updateCampaign(
    campaignId: string,
    data: GrowthCampaignUpdate
): Promise<{
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
            return { success: false, error: 'Solo administradores pueden editar campañas' }
        }

        const validationError = validateCampaignPayload(data)
        if (validationError) {
            return { success: false, error: validationError }
        }

        const { error } = await (supabase as any)
            .from('growth_campaigns')
            .update({
                ...data,
                program_type: PROFESSIONAL_INVITE_PROGRAM_TYPE,
            })
            .eq('id', campaignId)

        if (error) {
            console.error('Error updating campaign:', error)
            return { success: false, error: 'Error al actualizar campaña' }
        }

        revalidatePath('/dashboard/admin/growth')
        revalidatePath('/dashboard/growth')
        await reconcileAfterCampaignChange()

        return { success: true }
    } catch (err) {
        console.error('Unexpected error in updateCampaign:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

// ============================================
// TOGGLE CAMPAIGN ACTIVE
// ============================================
export async function toggleCampaignActive(
    campaignId: string,
    isActive: boolean
): Promise<{
    success: boolean
    error?: string
}> {
    return updateCampaign(campaignId, { is_active: isActive })
}

// ============================================
// DELETE CAMPAIGN
// ============================================
export async function deleteCampaign(campaignId: string): Promise<{
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
            return { success: false, error: 'Solo administradores pueden eliminar campañas' }
        }

        const { error } = await (supabase as any)
            .from('growth_campaigns')
            .delete()
            .eq('id', campaignId)

        if (error) {
            console.error('Error deleting campaign:', error)
            return { success: false, error: 'Error al eliminar campaña' }
        }

        revalidatePath('/dashboard/admin/growth')
        revalidatePath('/dashboard/growth')
        await reconcileAfterCampaignChange()

        return { success: true }
    } catch (err) {
        console.error('Unexpected error in deleteCampaign:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

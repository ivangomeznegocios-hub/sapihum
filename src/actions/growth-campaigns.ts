'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { GrowthCampaignInsert, GrowthCampaignUpdate } from '@/types/database'

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

        const { data: campaign, error } = await (supabase as any)
            .from('growth_campaigns')
            .insert({
                ...data,
                program_type: 'professional_invite',
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

        const { error } = await (supabase as any)
            .from('growth_campaigns')
            .update({
                ...data,
                program_type: 'professional_invite',
            })
            .eq('id', campaignId)

        if (error) {
            console.error('Error updating campaign:', error)
            return { success: false, error: 'Error al actualizar campaña' }
        }

        revalidatePath('/dashboard/admin/growth')
        revalidatePath('/dashboard/growth')

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

        return { success: true }
    } catch (err) {
        console.error('Unexpected error in deleteCampaign:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

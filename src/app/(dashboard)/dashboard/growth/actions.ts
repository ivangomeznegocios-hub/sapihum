'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
    createGroupPack,
    inviteGroupPackMember,
    refreshGroupPackStatus,
} from '@/lib/growth/engine'

async function requireUser() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { user: null, error: 'Usuario no autenticado' }
    }

    return { user, error: null }
}

export async function createGroupPackAction(formData: FormData): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { user, error } = await requireUser()
        if (error || !user) return { success: false, error: error ?? 'Usuario no autenticado' }

        const packType = String(formData.get('packType') || 'pack_3')
        const customRequiredMembers = Number(formData.get('requiredMembers') || 3)
        const benefitLabel = String(formData.get('benefitLabel') || '').trim()

        if (!['pack_3', 'pack_5', 'pack_10', 'custom'].includes(packType)) {
            return { success: false, error: 'Tipo de pack invalido' }
        }

        const admin = createServiceClient()
        await createGroupPack({
            leaderUserId: user.id,
            packType: packType as 'pack_3' | 'pack_5' | 'pack_10' | 'custom',
            requiredMembers: Number.isFinite(customRequiredMembers) ? customRequiredMembers : null,
            benefitConfig: benefitLabel ? { label: benefitLabel } : undefined,
            admin,
        })

        revalidatePath('/dashboard/growth')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in createGroupPackAction:', err)
        return { success: false, error: 'Error al crear pack' }
    }
}

export async function inviteGroupPackMemberAction(formData: FormData): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { user, error } = await requireUser()
        if (error || !user) return { success: false, error: error ?? 'Usuario no autenticado' }

        const groupPackId = String(formData.get('groupPackId') || '').trim()
        const invitedEmail = String(formData.get('invitedEmail') || '').trim()
        const invitedPhone = String(formData.get('invitedPhone') || '').trim()

        if (!groupPackId) return { success: false, error: 'Pack requerido' }

        const admin = createServiceClient()
        await inviteGroupPackMember({
            groupPackId,
            leaderUserId: user.id,
            invitedEmail: invitedEmail || null,
            invitedPhone: invitedPhone || null,
            admin,
        })

        revalidatePath('/dashboard/growth')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in inviteGroupPackMemberAction:', err)
        return { success: false, error: 'Error al invitar integrante' }
    }
}

export async function refreshGroupPackAction(groupPackId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { user, error } = await requireUser()
        if (error || !user) return { success: false, error: error ?? 'Usuario no autenticado' }

        const admin = createServiceClient()
        const { data: pack } = await (admin
            .from('group_packs') as any)
            .select('id')
            .eq('id', groupPackId)
            .eq('leader_user_id', user.id)
            .maybeSingle()

        if (!pack) return { success: false, error: 'Pack no encontrado' }

        await refreshGroupPackStatus({ groupPackId, admin })
        revalidatePath('/dashboard/growth')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in refreshGroupPackAction:', err)
        return { success: false, error: 'Error al actualizar pack' }
    }
}

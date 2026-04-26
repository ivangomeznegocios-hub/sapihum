'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PROFESSIONAL_INVITE_PROGRAM_TYPE } from '@/lib/growth/programs'

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
            .eq('program_type', PROFESSIONAL_INVITE_PROGRAM_TYPE)

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

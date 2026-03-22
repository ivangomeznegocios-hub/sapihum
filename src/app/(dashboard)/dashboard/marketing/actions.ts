'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { initializeMarketingServices } from '@/lib/supabase/queries/marketing-services'

// ============================================
// INITIALIZE SERVICES (called on first page visit)
// ============================================
export async function initializeServicesIfNeeded(): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        await initializeMarketingServices(user.id)
        revalidatePath('/dashboard/marketing')
        return { success: true }
    } catch (err) {
        console.error('Error initializing marketing services:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

// ============================================
// SUBMIT / UPDATE BRAND BRIEF
// ============================================
export async function submitBrandBrief(formData: {
    brand_name: string
    tone_of_voice: string
    target_audience: string
    colors_and_style: string
    social_links: string
    goals: string
    additional_notes: string
}): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        // Check if user has level 3
        const { data: profile } = await supabase
            .from('profiles')
            .select('membership_level, role')
            .eq('id', user.id)
            .single()

        if (!profile) return { success: false, error: 'Perfil no encontrado' }

        const p = profile as any
        if (p.role !== 'admin' && (p.membership_level ?? 0) < 3) {
            return { success: false, error: 'Se requiere membresía nivel 3' }
        }

        // Upsert brief (one per user)
        const { error } = await (supabase as any)
            .from('marketing_briefs')
            .upsert(
                {
                    user_id: user.id,
                    ...formData,
                    status: 'submitted',
                },
                { onConflict: 'user_id' }
            )

        if (error) {
            console.error('Error submitting brief:', error)
            return { success: false, error: 'Error al guardar el brief' }
        }

        // Update community_manager service to in_progress if it was pending
        await (supabase as any)
            .from('marketing_services')
            .update({ status: 'in_progress' })
            .eq('user_id', user.id)
            .eq('service_key', 'community_manager')
            .eq('status', 'pending_brief')

        // Update content_creation to in_progress too
        await (supabase as any)
            .from('marketing_services')
            .update({ status: 'in_progress' })
            .eq('user_id', user.id)
            .eq('service_key', 'content_creation')
            .eq('status', 'pending_brief')

        revalidatePath('/dashboard/marketing')
        return { success: true }
    } catch (err) {
        console.error('Error in submitBrandBrief:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

'use server'

import { getCurrentInternalAccessContext } from '@/lib/access/internal-server'
import { canAccessMarketingHub } from '@/lib/access/internal-modules'
import { revalidatePath } from 'next/cache'
import { initializeMarketingServices } from '@/lib/supabase/queries/marketing-services'

async function requireMarketingHubAccess() {
    const { supabase, profile, viewer } = await getCurrentInternalAccessContext()

    if (!profile || !viewer) {
        return { supabase, profile: null, error: 'No autenticado' }
    }

    if (!canAccessMarketingHub(viewer)) {
        return { supabase, profile: null, error: 'No autorizado' }
    }

    return { supabase, profile, error: null }
}

export async function initializeServicesIfNeeded(): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const { profile, error } = await requireMarketingHubAccess()
        if (!profile) return { success: false, error: error || 'No autenticado' }

        await initializeMarketingServices(profile.id)
        revalidatePath('/dashboard/marketing')
        return { success: true }
    } catch (err) {
        console.error('Error initializing marketing services:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

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
        const { supabase, profile, error: accessError } = await requireMarketingHubAccess()
        if (!profile) return { success: false, error: accessError || 'No autenticado' }

        const { error } = await (supabase as any)
            .from('marketing_briefs')
            .upsert(
                {
                    user_id: profile.id,
                    ...formData,
                    status: 'submitted',
                },
                { onConflict: 'user_id' }
            )

        if (error) {
            console.error('Error submitting brief:', error)
            return { success: false, error: 'Error al guardar el brief' }
        }

        await (supabase as any)
            .from('marketing_services')
            .update({ status: 'in_progress' })
            .eq('user_id', profile.id)
            .eq('service_key', 'community_manager')
            .eq('status', 'pending_brief')

        await (supabase as any)
            .from('marketing_services')
            .update({ status: 'in_progress' })
            .eq('user_id', profile.id)
            .eq('service_key', 'content_creation')
            .eq('status', 'pending_brief')

        revalidatePath('/dashboard/marketing')
        return { success: true }
    } catch (err) {
        console.error('Error in submitBrandBrief:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

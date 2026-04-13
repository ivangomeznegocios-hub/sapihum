'use server'

import { createClient } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
import {
    HOME_FEATURED_SPEAKERS_SETTING_KEY,
    normalizeHomeFeaturedSpeakersSettings,
    type HomeFeaturedSpeakersMode,
} from '@/lib/home/featured-speakers'
import { revalidatePath } from 'next/cache'
import { initializeMarketingServices } from '@/lib/supabase/queries/marketing-services'

// ============================================
// UPDATE SERVICE STATUS (Admin)
// ============================================
export async function updateServiceStatus(
    serviceId: string,
    data: {
        status?: string
        notes?: string
        admin_notes?: string
        assigned_to?: string
        contact_link?: string
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Solo administradores' }
        }

        const { error } = await (supabase as any)
            .from('marketing_services')
            .update(data)
            .eq('id', serviceId)

        if (error) {
            console.error('Error updating service:', error)
            return { success: false, error: 'Error al actualizar servicio' }
        }

        await recordAnalyticsServerEvent({
            eventName: 'marketing_service_updated',
            eventSource: 'server',
            userId: user.id,
            touch: { funnel: 'admin_marketing' },
            properties: {
                serviceId,
                status: data.status ?? null,
                assignedTo: data.assigned_to ?? null,
            },
        })

        revalidatePath('/dashboard/admin/marketing')
        revalidatePath('/dashboard/marketing')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in updateServiceStatus:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

// ============================================
// UPDATE BRIEF STATUS (Admin)
// ============================================
export async function updateBriefStatus(
    briefId: string,
    status: 'reviewed' | 'approved'
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Solo administradores' }
        }

        const { error } = await (supabase as any)
            .from('marketing_briefs')
            .update({ status })
            .eq('id', briefId)

        if (error) {
            console.error('Error updating brief status:', error)
            return { success: false, error: 'Error al actualizar brief' }
        }

        await recordAnalyticsServerEvent({
            eventName: 'marketing_brief_updated',
            eventSource: 'server',
            userId: user.id,
            touch: { funnel: 'admin_marketing' },
            properties: {
                briefId,
                status,
            },
        })

        revalidatePath('/dashboard/admin/marketing')
        revalidatePath('/dashboard/marketing')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in updateBriefStatus:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

// ============================================
// INITIALIZE SERVICES FOR A USER (Admin)
// ============================================
export async function adminInitializeServices(userId: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Solo administradores' }
        }

        await initializeMarketingServices(userId)
        await recordAnalyticsServerEvent({
            eventName: 'marketing_services_initialized',
            eventSource: 'server',
            userId: user.id,
            touch: { funnel: 'admin_marketing' },
            properties: {
                targetUserId: userId,
            },
        })
        revalidatePath('/dashboard/admin/marketing')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in adminInitializeServices:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

export async function updateHomeFeaturedSpeakersSettings(input: {
    mode: HomeFeaturedSpeakersMode
    manualSpeakerIds: string[]
}): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') {
            return { success: false, error: 'Solo administradores' }
        }

        const normalizedSettings = normalizeHomeFeaturedSpeakersSettings(input)

        let validManualSpeakerIds: string[] = []
        if (normalizedSettings.manualSpeakerIds.length > 0) {
            const { data: publicSpeakers, error: speakersError } = await (supabase
                .from('speakers') as any)
                .select('id')
                .eq('is_public', true)
                .in('id', normalizedSettings.manualSpeakerIds)

            if (speakersError) {
                console.error('Error validating manual featured speakers:', speakersError)
                return { success: false, error: 'No fue posible validar los ponentes manuales' }
            }

            const publicIds = new Set(((publicSpeakers ?? []) as Array<{ id: string }>).map((speaker) => speaker.id))
            validManualSpeakerIds = normalizedSettings.manualSpeakerIds.filter((speakerId) => publicIds.has(speakerId))
        }

        const value = {
            ...normalizedSettings,
            manualSpeakerIds: validManualSpeakerIds,
            limit: 4,
        }

        const { error } = await (supabase
            .from('platform_settings') as any)
            .upsert({
                key: HOME_FEATURED_SPEAKERS_SETTING_KEY,
                value,
                description: 'Controls how the marketing homepage selects featured speakers.',
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key' })

        if (error) {
            console.error('Error updating home featured speakers settings:', error)
            return { success: false, error: 'No fue posible guardar la configuracion del home' }
        }

        await recordAnalyticsServerEvent({
            eventName: 'home_featured_speakers_updated',
            eventSource: 'server',
            userId: user.id,
            touch: { funnel: 'admin_marketing' },
            properties: {
                mode: value.mode,
                manualSpeakerIds: value.manualSpeakerIds,
            },
        })

        revalidatePath('/')
        revalidatePath('/dashboard/admin/marketing')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in updateHomeFeaturedSpeakersSettings:', err)
        return { success: false, error: 'Error inesperado' }
    }
}

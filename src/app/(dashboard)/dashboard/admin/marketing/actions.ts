'use server'

import { createClient } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
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

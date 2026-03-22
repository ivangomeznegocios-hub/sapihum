'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAdminSettings(cac: number, margin: number) {
    const supabase = await createClient()

    // 1. Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        return { error: 'No autorizado' }
    }

    // 2. Perform upsert
    const { error } = await (supabase
        .from('admin_settings') as any)
        .upsert({ 
            id: 'default', 
            cac_amount: cac, 
            gross_margin_percent: margin,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Error updating settings:', error)
        return { error: 'Error al actualizar configuraciones' }
    }

    // 3. Revalidate the analytics page to show new numbers
    revalidatePath('/dashboard/analytics')
    return { success: true }
}

export async function getAdminSettings() {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('admin_settings') as any)
        .select('cac_amount, gross_margin_percent')
        .eq('id', 'default')
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching settings:', error)
        return { cac: 0, margin: 85 }
    }

    return {
        cac: data?.cac_amount || 0,
        margin: data?.gross_margin_percent || 85
    }
}

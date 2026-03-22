'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado', supabase: null, user: null }

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'admin') {
        return { error: 'No tienes permisos de administrador', supabase: null, user: null }
    }

    return { error: null, supabase, user }
}

export async function assignReferral(referralId: string, psychologistId: string, adminNotes: string) {
    const { error: authError, supabase, user } = await verifyAdmin()
    if (authError || !supabase || !user) return { error: authError || 'Error de autenticacion' }

    const { data: psychProfile } = await (supabase
        .from('profiles') as any)
        .select('accepts_referral_terms, full_name')
        .eq('id', psychologistId)
        .single()

    if (!(psychProfile as any)?.accepts_referral_terms) {
        return { error: `${(psychProfile as any)?.full_name || 'El psicologo'} no ha aceptado los lineamientos de canalizacion` }
    }

    const { error } = await (supabase
        .from('referrals') as any)
        .update({
            receiving_psychologist_id: psychologistId,
            assigned_by: user.id,
            assigned_at: new Date().toISOString(),
            admin_notes: adminNotes || null,
            status: 'assigned',
            updated_at: new Date().toISOString(),
        })
        .eq('id', referralId)
        .eq('referral_domain', 'clinical_referral')

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin/referrals')
    return { success: true }
}

export async function markReferralHandoffCompleted(referralId: string) {
    const { error: authError, supabase } = await verifyAdmin()
    if (authError || !supabase) return { error: authError || 'Error de autenticacion' }

    const { data: referral } = await (supabase
        .from('referrals') as any)
        .select('status')
        .eq('id', referralId)
        .eq('referral_domain', 'clinical_referral')
        .single()

    if (!referral || (referral as any).status !== 'accepted') {
        return { error: 'La canalizacion debe estar aceptada antes de cerrar la transferencia clinica' }
    }

    const { error } = await (supabase
        .from('referrals') as any)
        .update({
            status: 'handoff_completed',
            handoff_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', referralId)
        .eq('referral_domain', 'clinical_referral')

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin/referrals')
    return { success: true }
}

export async function cancelReferral(referralId: string) {
    const { error: authError, supabase } = await verifyAdmin()
    if (authError || !supabase) return { error: authError || 'Error de autenticacion' }

    const { error } = await (supabase
        .from('referrals') as any)
        .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
        })
        .eq('id', referralId)
        .eq('referral_domain', 'clinical_referral')

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin/referrals')
    return { success: true }
}

export async function togglePublicReferrals(enable: boolean) {
    const { error: authError, supabase, user } = await verifyAdmin()
    if (authError || !supabase || !user) return { error: authError || 'Error de autenticacion' }

    const { error } = await (supabase
        .from('platform_settings') as any)
        .update({
            value: JSON.stringify(enable),
            updated_by: user.id,
            updated_at: new Date().toISOString(),
        })
        .eq('key', 'allow_public_referrals')

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin/referrals')
    return { success: true }
}

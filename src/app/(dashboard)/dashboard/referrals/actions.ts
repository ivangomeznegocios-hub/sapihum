'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createReferralRequest(data: {
    patientName: string
    patientAge: number | null
    patientContact: string
    reason: string
    specialtyNeeded: string
    populationType: string
    urgency: string
    notes: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role, accepts_referral_terms')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'psychologist') {
        return { error: 'Solo psicologos pueden solicitar canalizaciones clinicas' }
    }

    if (!(profile as any)?.accepts_referral_terms) {
        return { error: 'Debes aceptar primero los lineamientos de canalizacion clinica en Configuracion' }
    }

    const { error } = await (supabase
        .from('referrals') as any)
        .insert({
            referring_psychologist_id: user.id,
            referral_domain: 'clinical_referral',
            patient_name: data.patientName,
            patient_age: data.patientAge || null,
            patient_contact: data.patientContact || null,
            reason: data.reason,
            specialty_needed: data.specialtyNeeded || null,
            population_type: data.populationType || null,
            urgency: data.urgency || 'normal',
            notes: data.notes || null,
            status: 'pending',
        })

    if (error) {
        console.error('Error creating referral:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/referrals')
    return { success: true }
}

export async function acceptReceivedReferral(referralId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { error } = await (supabase
        .from('referrals') as any)
        .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', referralId)
        .eq('referral_domain', 'clinical_referral')
        .eq('receiving_psychologist_id', user.id)
        .eq('status', 'assigned')

    if (error) return { error: error.message }

    revalidatePath('/dashboard/referrals')
    return { success: true }
}

export async function rejectReceivedReferral(referralId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { error } = await (supabase
        .from('referrals') as any)
        .update({
            status: 'rejected',
            receiving_psychologist_id: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', referralId)
        .eq('referral_domain', 'clinical_referral')
        .eq('receiving_psychologist_id', user.id)
        .eq('status', 'assigned')

    if (error) return { error: error.message }

    revalidatePath('/dashboard/referrals')
    return { success: true }
}

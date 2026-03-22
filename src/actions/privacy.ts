'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * Export all user data in JSON format (GDPR Art. 20 — Data Portability)
 */
export async function exportUserData(): Promise<{
    success: boolean
    data?: Record<string, unknown>
    error?: string
}> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // Collect all user data across tables
        const [
            profileResult,
            appointmentsResult,
            clinicalRecordsResult,
            sessionSummariesResult,
            consentResult,
            arcoResult,
        ] = await Promise.all([
            (supabase.from('profiles') as any).select('*').eq('id', user.id).single(),
            (supabase.from('appointments') as any).select('*').or(`patient_id.eq.${user.id},psychologist_id.eq.${user.id}`),
            (supabase.from('clinical_records') as any).select('*').or(`patient_id.eq.${user.id},psychologist_id.eq.${user.id}`),
            (supabase.from('session_summaries') as any).select('*').or(`patient_id.eq.${user.id},psychologist_id.eq.${user.id}`),
            (supabase.from('consent_records') as any).select('*').eq('user_id', user.id),
            (supabase.from('arco_requests') as any).select('*').eq('user_id', user.id),
        ])

        const exportData = {
            exported_at: new Date().toISOString(),
            user_id: user.id,
            email: user.email,
            profile: profileResult.data || null,
            appointments: appointmentsResult.data || [],
            clinical_records: clinicalRecordsResult.data || [],
            session_summaries: sessionSummariesResult.data || [],
            consent_records: consentResult.data || [],
            arco_requests: arcoResult.data || [],
        }

        return { success: true, data: exportData }
    } catch (error) {
        console.error('Error exporting data:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
}

/**
 * Submit an ARCO/GDPR data rights request
 */
export async function submitARCORequest(
    requestType: 'access' | 'rectification' | 'cancellation' | 'opposition' | 'portability',
    description: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        const { error } = await (supabase.from('arco_requests') as any).insert({
            user_id: user.id,
            request_type: requestType,
            description: description,
            status: 'pending',
        })

        if (error) {
            console.error('Error submitting ARCO request:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Error submitting ARCO request:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
}

/**
 * Request account deletion (GDPR Art. 17 — Right to Erasure / LFPDPPP Cancelación)
 * This creates an ARCO request and marks the account for deletion
 */
export async function requestAccountDeletion(
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // Create a formal ARCO cancellation request
        const { error } = await (supabase.from('arco_requests') as any).insert({
            user_id: user.id,
            request_type: 'cancellation',
            description: reason || 'Solicitud de eliminación de cuenta y datos personales',
            status: 'pending',
        })

        if (error) {
            console.error('Error requesting account deletion:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Error requesting account deletion:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
}

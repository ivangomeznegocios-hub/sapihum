import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

/**
 * Get all patients assigned to the current psychologist
 */
export async function getAssignedPatients(): Promise<Profile[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get patient IDs from relationships
    const { data: relationships, error: relError } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('patient_id')
        .eq('psychologist_id', user.id)
        .eq('status', 'active')

    if (relError || !relationships?.length) return []

    const patientIds = relationships.map((r: any) => r.patient_id)

    // Get patient profiles
    const { data: patients, error: patError } = await (supabase
        .from('profiles') as any)
        .select('*')
        .in('id', patientIds)
        .order('full_name', { ascending: true })

    if (patError) {
        console.error('Error fetching patients:', patError)
        return []
    }

    return patients ?? []
}

/**
 * Get a specific patient's profile by ID
 * Only returns if the patient is assigned to the current psychologist
 */
export async function getPatientById(patientId: string): Promise<Profile | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Verify relationship exists
    const { data: relationship, error: relError } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id')
        .eq('psychologist_id', user.id)
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .single()

    if (relError || !relationship) return null

    // Get patient profile
    const { data: patient, error: patError } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', patientId)
        .single()

    if (patError) {
        console.error('Error fetching patient:', patError)
        return null
    }

    return patient
}

/**
 * Get patient count for current psychologist
 */
export async function getPatientCount(): Promise<number> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { count, error } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('*', { count: 'exact', head: true })
        .eq('psychologist_id', user.id)
        .eq('status', 'active')

    if (error) {
        console.error('Error counting patients:', error)
        return 0
    }

    return count ?? 0
}

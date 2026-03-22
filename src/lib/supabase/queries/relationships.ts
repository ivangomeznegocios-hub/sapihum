import { createClient } from '@/lib/supabase/server'
import type { PatientPsychologistRelationship, Profile } from '@/types/database'

/**
 * Returns the latest active relationship for a patient.
 * We order by created_at descending to avoid breaking when legacy duplicates exist.
 */
export async function getLatestActiveRelationshipForPatient(
    patientId: string
): Promise<PatientPsychologistRelationship | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id, patient_id, psychologist_id, status, created_at, updated_at')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error('Error fetching patient relationship:', error)
        return null
    }

    return data ?? null
}

/**
 * Returns the current psychologist assigned to a patient, if any.
 */
export async function getAssignedPsychologistForPatient(
    patientId: string
): Promise<Profile | null> {
    const relationship = await getLatestActiveRelationshipForPatient(patientId)
    if (!relationship?.psychologist_id) {
        return null
    }

    const supabase = await createClient()
    const { data, error } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', relationship.psychologist_id)
        .maybeSingle()

    if (error) {
        console.error('Error fetching assigned psychologist:', error)
        return null
    }

    return data ?? null
}

/**
 * Returns all active patients assigned to a psychologist.
 */
export async function getActivePatientsForPsychologist(
    psychologistId: string
): Promise<Profile[]> {
    const supabase = await createClient()

    const { data: relationships, error } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('patient_id, created_at')
        .eq('psychologist_id', psychologistId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    if (error || !relationships?.length) {
        if (error) {
            console.error('Error fetching active patients:', error)
        }
        return []
    }

    const patientIds = Array.from(
        new Set((relationships as any[]).map((relationship: any) => String(relationship.patient_id)))
    ) as string[]
    const { data: patients, error: patientError } = await (supabase
        .from('profiles') as any)
        .select('*')
        .in('id', patientIds)

    if (patientError) {
        console.error('Error fetching patient profiles:', patientError)
        return []
    }

    const patientById = new Map<string, Profile>()
    for (const patient of patients || []) {
        patientById.set(patient.id, patient as Profile)
    }

    return patientIds
        .map((patientId) => patientById.get(patientId))
        .filter(Boolean) as Profile[]
}

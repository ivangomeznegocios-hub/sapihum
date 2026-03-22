import { createClient } from '@/lib/supabase/server'
import type { ClinicalRecord, ClinicalRecordInsert, ClinicalRecordWithPatient } from '@/types/database'

/**
 * Get all clinical records for a specific patient
 */
export async function getPatientRecords(patientId: string): Promise<ClinicalRecord[]> {
    const supabase = await createClient()

    const { data: records, error } = await (supabase
        .from('clinical_records') as any)
        .select('*')
        .eq('patient_id', patientId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching clinical records:', error)
        return []
    }

    return (records ?? []) as ClinicalRecord[]
}

/**
 * Get all clinical records created by the current psychologist
 */
export async function getPsychologistRecords(): Promise<ClinicalRecordWithPatient[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: records, error } = await (supabase
        .from('clinical_records') as any)
        .select(`
            *,
            patient:profiles!clinical_records_patient_id_fkey (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('psychologist_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching psychologist records:', error)
        return []
    }

    return (records ?? []) as ClinicalRecordWithPatient[]
}

/**
 * Get a single clinical record by ID
 */
export async function getClinicalRecordById(recordId: string): Promise<ClinicalRecord | null> {
    const supabase = await createClient()

    const { data: record, error } = await (supabase
        .from('clinical_records') as any)
        .select('*')
        .eq('id', recordId)
        .is('deleted_at', null)
        .single()

    if (error) {
        console.error('Error fetching clinical record:', error)
        return null
    }

    return record as ClinicalRecord
}

/**
 * Create a new clinical record
 */
export async function createClinicalRecord(record: ClinicalRecordInsert): Promise<ClinicalRecord | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('clinical_records') as any)
        .insert(record as any)
        .select()
        .single()

    if (error) {
        console.error('Error creating clinical record:', error)
        return null
    }

    return data as ClinicalRecord
}

/**
 * Update a clinical record
 */
export async function updateClinicalRecord(
    recordId: string,
    updates: Partial<ClinicalRecordInsert>
): Promise<ClinicalRecord | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('clinical_records') as any)
        .update(updates as any)
        .eq('id', recordId)
        .is('deleted_at', null)
        .select()
        .single()

    if (error) {
        console.error('Error updating clinical record:', error)
        return null
    }

    return data as ClinicalRecord
}

/**
 * Delete a clinical record
 */
export async function deleteClinicalRecord(recordId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { error } = await (supabase
        .from('clinical_records') as any)
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', recordId)
        .is('deleted_at', null)

    if (error) {
        console.error('Error deleting clinical record:', error)
        return false
    }

    return true
}

/**
 * Get record count for a patient
 */
export async function getPatientRecordCount(patientId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await (supabase
        .from('clinical_records') as any)
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .is('deleted_at', null)

    if (error) {
        console.error('Error counting records:', error)
        return 0
    }

    return count ?? 0
}

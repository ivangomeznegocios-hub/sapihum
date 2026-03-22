import { createClient } from '@/lib/supabase/server'
import type { Appointment, AppointmentInsert, AppointmentWithPatient } from '@/types/database'

/**
 * Get all appointments for the current psychologist
 */
export async function getPsychologistAppointments(): Promise<AppointmentWithPatient[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: appointments, error } = await (supabase
        .from('appointments') as any)
        .select(`
            *,
            patient:profiles!appointments_patient_id_fkey (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('psychologist_id', user.id)
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching appointments:', error)
        return []
    }

    return (appointments ?? []) as AppointmentWithPatient[]
}

/**
 * Get upcoming appointments (future only)
 */
export async function getUpcomingAppointments(): Promise<AppointmentWithPatient[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: appointments, error } = await (supabase
        .from('appointments') as any)
        .select(`
            *,
            patient:profiles!appointments_patient_id_fkey (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('psychologist_id', user.id)
        .gte('start_time', new Date().toISOString())
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching upcoming appointments:', error)
        return []
    }

    return (appointments ?? []) as AppointmentWithPatient[]
}

/**
 * Get appointments for a specific patient
 */
export async function getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const supabase = await createClient()

    const { data: appointments, error } = await (supabase
        .from('appointments') as any)
        .select('*')
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false })

    if (error) {
        console.error('Error fetching patient appointments:', error)
        return []
    }

    return (appointments ?? []) as Appointment[]
}

/**
 * Get a single appointment by ID
 */
export async function getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    const supabase = await createClient()

    const { data: appointment, error } = await (supabase
        .from('appointments') as any)
        .select('*')
        .eq('id', appointmentId)
        .single()

    if (error) {
        console.error('Error fetching appointment:', error)
        return null
    }

    return appointment as Appointment
}

/**
 * Create a new appointment
 */
export async function createAppointment(appointment: AppointmentInsert): Promise<Appointment | null> {
    const supabase = await createClient()

    // Generate Jitsi meeting link
    const meetingId = `comunidad-psicologia-${Date.now()}`
    const meetingLink = `https://meet.jit.si/${meetingId}`

    const { data, error } = await (supabase
        .from('appointments') as any)
        .insert({
            ...appointment,
            meeting_link: appointment.meeting_link ?? meetingLink
        } as any)
        .select()
        .single()

    if (error) {
        console.error('Error creating appointment:', error)
        return null
    }

    return data as Appointment
}

/**
 * Update an appointment
 */
export async function updateAppointment(
    appointmentId: string,
    updates: Partial<AppointmentInsert>
): Promise<Appointment | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('appointments') as any)
        .update(updates as any)
        .eq('id', appointmentId)
        .select()
        .single()

    if (error) {
        console.error('Error updating appointment:', error)
        return null
    }

    return data as Appointment
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(appointmentId: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('appointments') as any)
        .update({ status: 'cancelled' } as any)
        .eq('id', appointmentId)

    if (error) {
        console.error('Error cancelling appointment:', error)
        return false
    }

    return true
}

/**
 * Get today's appointments for the psychologist
 */
export async function getTodayAppointments(): Promise<AppointmentWithPatient[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    const { data: appointments, error } = await (supabase
        .from('appointments') as any)
        .select(`
            *,
            patient:profiles!appointments_patient_id_fkey (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('psychologist_id', user.id)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching today appointments:', error)
        return []
    }

    return (appointments ?? []) as AppointmentWithPatient[]
}

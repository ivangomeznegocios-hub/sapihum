'use server'

import { findExternalCalendarConflictForUsers } from '@/lib/calendar-sync'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bookAppointment(data: {
    psychologistId: string
    date: string
    time: string
    duration: number
    type: string
    notes?: string
    serviceName?: string
    price?: number
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify role is patient
    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'patient') {
        return { error: 'Solo pacientes pueden agendar citas' }
    }

    // Build start and end times
    const startTime = new Date(`${data.date}T${data.time}`)
    const endTime = new Date(startTime.getTime() + data.duration * 60000)

    // Validate future date
    if (startTime < new Date()) {
        return { error: 'No puedes agendar citas en el pasado' }
    }

    // Check for conflicts
    const { data: conflicts } = await (supabase
        .from('appointments') as any)
        .select('id')
        .eq('psychologist_id', data.psychologistId)
        .neq('status', 'cancelled')
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString())

    if (conflicts && conflicts.length > 0) {
        return { error: 'Este horario ya está ocupado. Elige otro.' }
    }

    // Generate meeting link for video appointments
    const { data: patientConflicts } = await (supabase
        .from('appointments') as any)
        .select('id')
        .eq('patient_id', user.id)
        .neq('status', 'cancelled')
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString())
        .limit(1)

    if (patientConflicts && patientConflicts.length > 0) {
        return { error: 'Ya tienes otra cita en ese horario. Elige otro espacio.' }
    }

    try {
        const externalConflict = await findExternalCalendarConflictForUsers(
            [data.psychologistId],
            startTime.toISOString(),
            endTime.toISOString()
        )

        if (externalConflict) {
            const accountLabel = externalConflict.providerAccountLabel
                ? ` (${externalConflict.providerAccountLabel})`
                : ''

            return {
                error: `Ese horario ya aparece ocupado en Google Calendar${accountLabel}. Elige otro espacio.`,
            }
        }
    } catch (error) {
        console.error('[Booking] Error al validar disponibilidad externa:', error)
        return {
            error: 'No pudimos verificar la disponibilidad externa del profesional. Pidele reconectar Google Calendar e intenta de nuevo.',
        }
    }

    const meetingId = `cp-${user.id.slice(0, 6)}-${Date.now()}`
    const meetingLink = data.type === 'video' ? `https://meet.jit.si/${meetingId}` : null

    // Build notes
    const notesParts: string[] = []
    if (data.serviceName) notesParts.push(`Servicio: ${data.serviceName}`)
    if (data.notes) notesParts.push(data.notes)

    const { error } = await (supabase
        .from('appointments') as any)
        .insert({
            patient_id: user.id,
            psychologist_id: data.psychologistId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'pending',
            type: data.type || 'video',
            price: data.price || null,
            meeting_link: meetingLink,
            notes: notesParts.join(' | ') || null
        } as any)

    if (error) {
        console.error('Error booking appointment:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/booking')
    revalidatePath('/dashboard/calendar')
    return { success: true }
}

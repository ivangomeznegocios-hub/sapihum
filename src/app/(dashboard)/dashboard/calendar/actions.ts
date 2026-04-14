'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentInternalAccessContext } from '@/lib/access/internal-server'
import { canAccessClinicalWorkspace } from '@/lib/access/internal-modules'
import { findExternalCalendarConflictForUsers } from '@/lib/calendar-sync'
import { revalidatePath } from 'next/cache'
import { sendAppointmentConfirmationEmail, sendWelcomeEmail } from '@/lib/email'
import { createUserNotification } from '@/lib/notifications'
import { sendPushNotification } from '@/lib/onesignal'

async function requireClinicalPsychologist() {
    const { supabase, profile, viewer } = await getCurrentInternalAccessContext()

    if (!profile || !viewer) {
        return { supabase, profile: null, error: 'No autenticado' }
    }

    if (profile.role !== 'psychologist' || !canAccessClinicalWorkspace(viewer)) {
        return { supabase, profile: null, error: 'No autorizado' }
    }

    return { supabase, profile, error: null }
}

async function getAuthorizedAppointment(appointmentId: string) {
    const { supabase, profile, viewer } = await getCurrentInternalAccessContext()

    if (!profile || !viewer) {
        return { supabase, profile: null, appointment: null, error: 'No autenticado' }
    }

    const { data: appointment } = await (supabase
        .from('appointments') as any)
        .select('id, patient_id, psychologist_id, status')
        .eq('id', appointmentId)
        .maybeSingle()

    if (!appointment) {
        return { supabase, profile, appointment: null, error: 'Cita no encontrada' }
    }

    if (profile.role === 'admin') {
        return { supabase, profile, appointment, error: null }
    }

    if (profile.role === 'patient' && appointment.patient_id === profile.id) {
        return { supabase, profile, appointment, error: null }
    }

    if (profile.role === 'psychologist' && canAccessClinicalWorkspace(viewer) && appointment.psychologist_id === profile.id) {
        return { supabase, profile, appointment, error: null }
    }

    return { supabase, profile, appointment: null, error: 'No autorizado' }
}

export async function createAppointment(formData: FormData) {
    const { supabase, profile, error: accessError } = await requireClinicalPsychologist()
    if (accessError || !profile) return { error: accessError }

    const patientId = formData.get('patientId') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const duration = parseInt(formData.get('duration') as string) || 60
    const type = formData.get('type') as string || 'video'
    const notes = formData.get('notes') as string

    if (!patientId || !date || !time) {
        return { error: 'Faltan campos requeridos' }
    }

    const startTime = new Date(`${date}T${time}`)
    const endTime = new Date(startTime.getTime() + duration * 60000)

    // Validate the date is in the future
    if (startTime < new Date()) {
        return { error: 'No puedes crear citas en el pasado' }
    }

    const { data: relationship } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id')
        .eq('patient_id', patientId)
        .eq('psychologist_id', profile.id)
        .eq('status', 'active')
        .maybeSingle()

    if (!relationship) {
        return { error: 'No tienes una relacion activa con este paciente' }
    }

    const { data: overlappingAppointment } = await (supabase
        .from('appointments') as any)
        .select('id')
        .eq('psychologist_id', profile.id)
        .neq('status', 'cancelled')
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString())
        .limit(1)
        .maybeSingle()

    if (overlappingAppointment) {
        return { error: 'Ya tienes otra cita ocupando ese horario' }
    }

    try {
        const externalConflict = await findExternalCalendarConflictForUsers(
            [profile.id],
            startTime.toISOString(),
            endTime.toISOString()
        )

        if (externalConflict) {
            const accountLabel = externalConflict.providerAccountLabel
                ? ` (${externalConflict.providerAccountLabel})`
                : ''

            return {
                error: `Ese horario ya aparece ocupado en Google Calendar${accountLabel}. Cambia la hora para evitar doble reserva.`,
            }
        }
    } catch (externalError) {
        console.error('[CreateAppointment] Error al validar Google Calendar:', externalError)
        return {
            error: 'No pudimos confirmar tu disponibilidad externa. Reconecta Google Calendar e intenta de nuevo.',
        }
    }

    // Generate meeting link for video appointments
    const meetingId = `cp-${profile.id.slice(0, 6)}-${Date.now()}`
    const meetingLink = type === 'video' ? `https://meet.jit.si/${meetingId}` : null

    const { error } = await (supabase
        .from('appointments') as any)
        .insert({
            psychologist_id: profile.id,
            patient_id: patientId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            type: type,
            status: 'confirmed', // Psychologist creates → auto-confirmed
            notes: notes || null,
            meeting_link: meetingLink
        })

    if (error) {
        console.error('[CreateAppointment] Error:', error)
        return { error: error.message }
    }

    // Fetch patient profile to check email preferences
    const { data: patientProfile } = await (supabase
        .from('profiles') as any)
        .select('full_name, email, email_notifications')
        .eq('id', patientId)
        .single()

    if (patientProfile && patientProfile.email && patientProfile.email_notifications !== false) {
        const formattedDate = startTime.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        const formattedTime = startTime.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        })

        await sendAppointmentConfirmationEmail({
            to: patientProfile.email,
            patientName: patientProfile.full_name,
            psychologistName: profile.full_name || 'tu psicólogo(a)',
            date: formattedDate,
            time: formattedTime,
            meetingLink: meetingLink || undefined
        })
    }

    // Try sending Push Notification as well (if patient has linked devices, OneSignal handles delivery)
    // We send without checking a specific "push_notifications" profile boolean because OneSignal
    // already respects browser sub/unsub internally. 
    await sendPushNotification({
        title: "¡Nueva Cita Programada!",
        message: `Tienes una nueva cita con ${profile.full_name || 'tu psicólogo'} para el ${startTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })} a las ${startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
        targetExternalId: patientId,
        url: '/dashboard/calendar'
    })

    try {
        await createUserNotification({
            userId: patientId,
            category: 'calendar',
            level: 'info',
            kind: 'appointment_created',
            title: 'Nueva cita confirmada',
            body: `${profile.full_name || 'Tu psicologo'} agendo tu cita para el ${startTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })} a las ${startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}.`,
            actionUrl: '/dashboard/calendar',
            metadata: {
                psychologistId: profile.id,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                appointmentType: type,
            },
        })
    } catch (notificationError) {
        console.error('[CreateAppointment] Error creating internal notification:', notificationError)
    }

    revalidatePath('/dashboard/calendar')
    return { success: 'Cita creada exitosamente' }
}

export async function cancelAppointment(appointmentId: string) {
    const { supabase, appointment, error: accessError } = await getAuthorizedAppointment(appointmentId)
    if (accessError || !appointment) return { error: accessError }

    const { error } = await (supabase
        .from('appointments') as any)
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard/booking')
    return { success: true }
}

export async function confirmAppointment(appointmentId: string) {
    const { supabase, profile, appointment, error: accessError } = await getAuthorizedAppointment(appointmentId)
    if (accessError || !profile || !appointment) return { error: accessError }

    if (profile.role === 'patient') {
        return { error: 'Solo psicologos o administradores pueden confirmar citas' }
    }

    const { error } = await (supabase
        .from('appointments') as any)
        .update({ status: 'confirmed' })
        .eq('id', appointmentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/calendar')
    return { success: true }
}

export async function completeAppointment(appointmentId: string) {
    const { supabase, profile, appointment, error: accessError } = await getAuthorizedAppointment(appointmentId)
    if (accessError || !profile || !appointment) return { error: accessError }

    if (profile.role === 'patient') {
        return { error: 'Solo psicologos o administradores pueden completar citas' }
    }

    const { error } = await (supabase
        .from('appointments') as any)
        .update({ status: 'completed' })
        .eq('id', appointmentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/calendar')
    return { success: true }
}

/**
 * Quick-create a patient directly from the appointment form.
 * Supports name-only (no email required) or with email.
 */
export async function quickCreatePatient(formData: FormData) {
    const { supabase, profile, error: accessError } = await requireClinicalPsychologist()
    const adminSupabase = await createAdminClient()
    if (accessError || !profile) return { error: accessError }

    const fullName = (formData.get('fullName') as string || '').trim()
    const email = (formData.get('email') as string || '').trim().toLowerCase()
    const phone = (formData.get('phone') as string || '').trim()

    if (!fullName) {
        return { error: 'El nombre del paciente es requerido' }
    }

    let patientId: string

    if (email) {
        // Check if already exists
        const { data: existingPatient } = await (supabase
            .from('profiles') as any)
            .select('id, full_name')
            .eq('email', email)
            .single()

        if (existingPatient) {
            patientId = existingPatient.id
        } else {
            // Secure invite flow: Supabase handles the account activation link
            const { data: invitationData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
                email,
                {
                    data: {
                        full_name: fullName,
                        role: 'patient',
                    }
                }
            )

            if (inviteError) {
                return { error: `Error al invitar: ${inviteError.message}` }
            }

            patientId = invitationData.user.id

            const updates: any = { full_name: fullName }
            if (phone) updates.phone = phone
            await (adminSupabase.from('profiles') as any)
                .update(updates)
                .eq('id', patientId)

            await sendWelcomeEmail({
                to: email,
                name: fullName,
            })
        }
    } else {
        // Create local patient (no email account)
        const internalEmail = `local-patient-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@internal.comunidadpsicologia.app`
        const internalPassword = `CP-${crypto.randomUUID()}`

        const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
            email: internalEmail,
            password: internalPassword,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'patient',
                is_local_patient: true,
            }
        })

        if (createError) {
            return { error: `Error al crear paciente: ${createError.message}` }
        }

        patientId = newUser.user.id

        const updates: any = { full_name: fullName, role: 'patient' }
        if (phone) updates.phone = phone
        await (adminSupabase.from('profiles') as any)
            .update(updates)
            .eq('id', patientId)
    }

    // Check if relationship already exists
    const { data: existingRel } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id, status')
        .eq('patient_id', patientId)
        .eq('psychologist_id', profile.id)
        .single()

    if (existingRel) {
        if (existingRel.status !== 'active') {
            await (supabase
                .from('patient_psychologist_relationships') as any)
                .update({ status: 'active' })
                .eq('id', existingRel.id)
        }
    } else {
        await (supabase
            .from('patient_psychologist_relationships') as any)
            .insert({
                patient_id: patientId,
                psychologist_id: profile.id,
                status: 'active'
            })
    }

    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard/patients')
    return {
        success: '¡Paciente creado!',
        patient: { id: patientId, full_name: fullName }
    }
}

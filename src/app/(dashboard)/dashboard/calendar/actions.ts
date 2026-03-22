'use server'

import { createClient, createAdminClient, getUserProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendAppointmentConfirmationEmail, sendWelcomeEmail } from '@/lib/email'
import { sendPushNotification } from '@/lib/onesignal'

export async function createAppointment(formData: FormData) {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile || profile.role !== 'psychologist') {
        return { error: 'No autorizado' }
    }

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

    revalidatePath('/dashboard/calendar')
    return { success: 'Cita creada exitosamente' }
}

export async function cancelAppointment(appointmentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await (supabase
        .from('appointments') as any)
        .update({ status: 'confirmed' })
        .eq('id', appointmentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/calendar')
    return { success: true }
}

export async function completeAppointment(appointmentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

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
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()
    const profile = await getUserProfile()

    if (!profile || profile.role !== 'psychologist') {
        return { error: 'No autorizado' }
    }

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

'use server'

import { createClient } from '@/lib/supabase/server'
import { revokeGoogleToken } from '@/lib/calendar-sync'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const fullName = formData.get('fullName') as string
    const specialty = formData.get('specialty') as string

    const { error } = await (supabase
        .from('profiles') as any)
        .update({
            full_name: fullName,
            specialty: specialty || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function updatePsychologistProfile(data: {
    fullName: string
    specialty: string
    bio: string
    hourlyRate: number
    officeAddress: string
    services: any[]
    availability: any
    paymentMethods: any
    phone: string
    cedulaProfesional: string
    populationsServed: string[]
    therapeuticApproaches: string[]
    languages: string[]
    yearsExperience: number
    education: string
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify user is a psychologist
    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'psychologist') {
        return { error: 'Solo psicólogos pueden actualizar estos campos' }
    }

    const { error } = await (supabase
        .from('profiles') as any)
        .update({
            full_name: data.fullName,
            specialty: data.specialty || null,
            bio: data.bio || null,
            hourly_rate: data.hourlyRate || null,
            office_address: data.officeAddress || null,
            services: data.services || [],
            availability: data.availability || {},
            payment_methods: data.paymentMethods || {},
            phone: data.phone || null,
            cedula_profesional: data.cedulaProfesional || null,
            populations_served: data.populationsServed || [],
            therapeutic_approaches: data.therapeuticApproaches || [],
            languages: data.languages || [],
            years_experience: data.yearsExperience || null,
            education: data.education || null,
            updated_at: new Date().toISOString()
        } as any)
        .eq('id', user.id)

    if (error) {
        console.error('Error updating psychologist profile:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard/booking')
    return { success: true }
}

export async function acceptReferralTerms(accept: boolean) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify user is a psychologist
    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'psychologist') {
        return { error: 'Solo psicólogos pueden aceptar estos términos' }
    }

    const { error } = await (supabase
        .from('profiles') as any)
        .update({
            accepts_referral_terms: accept,
            referral_terms_accepted_at: accept ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        } as any)
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/referrals')
    return { success: true }
}

export async function changePassword(formData: FormData) {
    const supabase = await createClient()

    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden' }
    }

    if (newPassword.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres' }
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function updateGoogleCalendarSelection(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const selectedCalendarIds = formData
        .getAll('calendarIds')
        .map((value) => String(value))
        .filter(Boolean)

    const { error } = await ((supabase.from('calendar_integrations' as any) as any)
        .update({
            selected_calendar_ids: selectedCalendarIds.length > 0 ? selectedCalendarIds : ['primary'],
            status: 'connected',
            last_error: null,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('provider', 'google'))

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard/booking')
    return { success: true }
}

export async function disconnectGoogleCalendar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const { data: integration } = await ((supabase.from('calendar_integrations' as any) as any)
        .select('id, access_token, refresh_token')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle())

    if (!integration) {
        return { success: true }
    }

    await revokeGoogleToken(integration.refresh_token || integration.access_token || '')

    const { error } = await ((supabase.from('calendar_integrations' as any) as any)
        .delete()
        .eq('id', integration.id))

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard/booking')
    return { success: true }
}

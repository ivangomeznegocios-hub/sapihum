'use server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify current user is admin
    const { data: adminProfile } = await ((supabase
        .from('profiles') as any) as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if ((adminProfile as any)?.role !== 'admin') {
        return { error: 'No tienes permisos de administrador' }
    }

    // Validate role
    if (!['admin', 'support', 'psychologist', 'patient', 'ponente'].includes(newRole)) {
        return { error: 'Rol inválido' }
    }

    const { error } = await ((supabase
        .from('profiles') as any) as any)
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/users')
    return { success: true }
}

export async function assignPatientToPsychologist(patientId: string, psychologistId: string) {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify current user is admin
    const { data: adminProfile } = await ((supabase
        .from('profiles') as any) as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if ((adminProfile as any)?.role !== 'admin') {
        return { error: 'No tienes permisos de administrador' }
    }

    // Check if the patient is already assigned to this psychologist
    const { data: existing } = await ((adminSupabase
        .from('patient_psychologist_relationships') as any) as any)
        .select('id, status')
        .eq('patient_id', patientId)
        .eq('psychologist_id', psychologistId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    // Deactivate any other active psychologist assignment for the patient.
    const deactivateQuery = (adminSupabase
        .from('patient_psychologist_relationships') as any)
        .update({ status: 'inactive' })
        .eq('patient_id', patientId)
        .eq('status', 'active')

    const { error: deactivateError } = existing?.id
        ? await deactivateQuery.neq('id', existing.id)
        : await deactivateQuery

    if (deactivateError) {
        return { error: deactivateError.message }
    }

    if (existing) {
        const { error: reactivateError } = await ((adminSupabase
            .from('patient_psychologist_relationships') as any) as any)
            .update({ status: 'active' })
            .eq('id', existing.id)

        if (reactivateError) {
            return { error: reactivateError.message }
        }

        revalidatePath('/dashboard/admin/users')
        revalidatePath('/dashboard/messages')
        revalidatePath('/dashboard/my-psychologist')
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/booking')
        revalidatePath('/dashboard/patients')
        return { success: true }
    }

    const { error } = await ((adminSupabase
        .from('patient_psychologist_relationships') as any) as any)
        .insert({
            patient_id: patientId,
            psychologist_id: psychologistId,
            status: 'active'
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/users')
    revalidatePath('/dashboard/messages')
    revalidatePath('/dashboard/my-psychologist')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/booking')
    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function removePatientAssignment(patientId: string, psychologistId: string) {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify current user is admin
    const { data: adminProfile } = await ((supabase
        .from('profiles') as any) as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if ((adminProfile as any)?.role !== 'admin') {
        return { error: 'No tienes permisos de administrador' }
    }

    const { error } = await ((adminSupabase
        .from('patient_psychologist_relationships') as any) as any)
        .update({ status: 'inactive' })
        .eq('patient_id', patientId)
        .eq('psychologist_id', psychologistId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin/users')
    revalidatePath('/dashboard/messages')
    revalidatePath('/dashboard/my-psychologist')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/booking')
    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function adminUpdateProfile(
    userId: string,
    data: {
        full_name?: string | null,
        bio?: string | null,
        specialty?: string | null,
        hourly_rate?: number | null,
        is_test?: boolean
    }
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // Verify current user is admin
    const { data: adminProfile } = await ((supabase
        .from('profiles') as any) as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if ((adminProfile as any)?.role !== 'admin') {
        return { error: 'No tienes permisos de administrador' }
    }

    const { error } = await ((supabase
        .from('profiles') as any) as any)
        .update({
            full_name: data.full_name,
            bio: data.bio,
            specialty: data.specialty,
            hourly_rate: data.hourly_rate,
            is_test: data.is_test,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)

    if (error) {
        return { error: `Error al actualizar perfil: ${error.message}` }
    }

    revalidatePath('/dashboard/admin/users')
    return { success: true }
}

export async function adminCreateUser(data: { email: string, password?: string, fullName: string, role: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // Verify current user is admin
    const { data: adminProfile } = await ((supabase
        .from('profiles') as any) as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if ((adminProfile as any)?.role !== 'admin') {
        return { error: 'No tienes permisos de administrador' }
    }

    const adminSupabase = await createAdminClient()
    
    // Create auth user
    const { data: newAuthUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: data.email,
        password: data.password || undefined,
        email_confirm: true,
        user_metadata: {
            full_name: data.fullName
        }
    })

    if (createError) {
        return { error: `Error al crear usuario: ${createError.message}` }
    }
    
    if (!newAuthUser.user) {
        return { error: 'Error desconocido al crear usuario' }
    }

    // Update the auto-created profile with the selected role
    const { error: updateError } = await ((adminSupabase
        .from('profiles') as any) as any)
        .update({
            role: data.role,
            updated_at: new Date().toISOString()
        })
        .eq('id', newAuthUser.user.id)
        
    if (updateError) {
        // We created the user but failed to update their role
        return { error: `Usuario creado, pero hubo un error al asignar el rol: ${updateError.message}` }
    }

    revalidatePath('/dashboard/admin/users')
    return { success: true }
}

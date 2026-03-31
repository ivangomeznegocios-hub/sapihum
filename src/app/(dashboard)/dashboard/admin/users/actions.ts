'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { MAX_MEMBERSHIP_LEVEL } from '@/lib/membership'
import { syncMembershipEntitlementsForUser } from '@/lib/membership-entitlements'
import { LEVEL_2_DEFAULT_SPECIALIZATION, getMembershipSpecializations } from '@/lib/specializations'

type AdminMembershipStatus = 'inactive' | 'trial' | 'active' | 'past_due' | 'cancelled'

function revalidateAdminUsersViews() {
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/subscription')
    revalidatePath('/dashboard/admin/users')
    revalidatePath('/dashboard/admin/operations')
}

async function getAdminContext() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' as const }
    }

    const { data: adminProfile } = await ((supabase
        .from('profiles') as any) as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if ((adminProfile as any)?.role !== 'admin') {
        return { error: 'No tienes permisos de administrador' as const }
    }

    const adminSupabase = await createAdminClient()
    return {
        supabase,
        adminSupabase,
        user,
    }
}

function isValidMembershipStatus(value: string): value is AdminMembershipStatus {
    return ['inactive', 'trial', 'active', 'past_due', 'cancelled'].includes(value)
}

function mapProfileStatusToSubscriptionStatus(status: AdminMembershipStatus, membershipLevel: number) {
    if (membershipLevel <= 0 || status === 'inactive') return 'expired'
    if (status === 'trial') return 'trialing'
    if (status === 'cancelled') return 'cancelled'
    if (status === 'past_due') return 'past_due'
    return 'active'
}

async function syncAdminMembershipState(params: {
    adminSupabase: Awaited<ReturnType<typeof createAdminClient>>
    userId: string
    membershipLevel: number
    subscriptionStatus: AdminMembershipStatus
    specializationCode?: string | null
}) {
    const now = new Date().toISOString()
    const allowedSpecializations = new Set(getMembershipSpecializations().map((spec) => spec.code))
    const membershipLevel = Math.max(0, Math.min(MAX_MEMBERSHIP_LEVEL, Math.trunc(params.membershipLevel)))
    const hasMembershipAccess = membershipLevel > 0 && ['trial', 'active', 'past_due'].includes(params.subscriptionStatus)
    const specializationCode = membershipLevel >= 2
        ? (
            params.specializationCode && allowedSpecializations.has(params.specializationCode as any)
                ? params.specializationCode
                : LEVEL_2_DEFAULT_SPECIALIZATION
        )
        : null
    const profileStatus: AdminMembershipStatus = membershipLevel <= 0 ? 'inactive' : params.subscriptionStatus
    const subscriptionStatus = mapProfileStatusToSubscriptionStatus(profileStatus, membershipLevel)

    const { error: profileError } = await ((params.adminSupabase
        .from('profiles') as any) as any)
        .update({
            membership_level: membershipLevel,
            membership_specialization_code: specializationCode,
            subscription_status: profileStatus,
            updated_at: now,
        })
        .eq('id', params.userId)

    if (profileError) {
        throw new Error(`Error al actualizar perfil: ${profileError.message}`)
    }

    const { data: existingSubscription } = await ((params.adminSupabase
        .from('subscriptions') as any) as any)
        .select('id, payment_provider, provider_subscription_id, provider_customer_id, provider_price_id, current_period_start, current_period_end')
        .eq('user_id', params.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (existingSubscription?.id) {
        const { error: subscriptionError } = await ((params.adminSupabase
            .from('subscriptions') as any) as any)
            .update({
                membership_level: membershipLevel,
                specialization_code: specializationCode,
                status: subscriptionStatus,
                current_period_start: existingSubscription.current_period_start || now,
                current_period_end: hasMembershipAccess ? existingSubscription.current_period_end || null : now,
                cancel_at_period_end: false,
                cancelled_at: hasMembershipAccess ? null : now,
                updated_at: now,
            })
            .eq('id', existingSubscription.id)

        if (subscriptionError) {
            throw new Error(`Error al actualizar suscripcion: ${subscriptionError.message}`)
        }
    } else if (hasMembershipAccess) {
        const { error: insertSubscriptionError } = await ((params.adminSupabase
            .from('subscriptions') as any) as any)
            .insert({
                user_id: params.userId,
                profile_id: params.userId,
                membership_level: membershipLevel,
                specialization_code: specializationCode,
                payment_provider: 'manual',
                provider_subscription_id: `manual-${params.userId}`,
                status: subscriptionStatus,
                current_period_start: now,
                current_period_end: null,
                cancel_at_period_end: false,
                cancelled_at: null,
            })

        if (insertSubscriptionError) {
            throw new Error(`Error al crear suscripcion manual: ${insertSubscriptionError.message}`)
        }
    }

    await syncMembershipEntitlementsForUser(params.userId)
}

export async function updateUserRole(userId: string, newRole: string) {
    const context = await getAdminContext()
    if ('error' in context) {
        return { error: context.error }
    }

    if (!['admin', 'support', 'psychologist', 'patient', 'ponente'].includes(newRole)) {
        return { error: 'Rol invalido' }
    }

    const { error } = await ((context.adminSupabase
        .from('profiles') as any) as any)
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

    if (error) {
        return { error: error.message }
    }

    revalidateAdminUsersViews()
    return { success: true }
}

export async function adminConfirmUserEmail(userId: string) {
    const context = await getAdminContext()
    if ('error' in context) {
        return { error: context.error }
    }

    const { error } = await context.adminSupabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
    })

    if (error) {
        return { error: `No fue posible confirmar el correo: ${error.message}` }
    }

    revalidateAdminUsersViews()
    return { success: true }
}

export async function adminUpdateMembership(
    userId: string,
    data: {
        membershipLevel: number
        subscriptionStatus: string
        specializationCode?: string | null
    }
) {
    const context = await getAdminContext()
    if ('error' in context) {
        return { error: context.error }
    }

    if (!Number.isFinite(data.membershipLevel) || data.membershipLevel < 0 || data.membershipLevel > MAX_MEMBERSHIP_LEVEL) {
        return { error: 'Nivel invalido' }
    }

    if (!isValidMembershipStatus(data.subscriptionStatus)) {
        return { error: 'Estado de suscripcion invalido' }
    }

    try {
        await syncAdminMembershipState({
            adminSupabase: context.adminSupabase,
            userId,
            membershipLevel: data.membershipLevel,
            subscriptionStatus: data.subscriptionStatus,
            specializationCode: data.specializationCode ?? null,
        })
    } catch (error) {
        return { error: (error as Error).message }
    }

    revalidateAdminUsersViews()
    return { success: true }
}

export async function assignPatientToPsychologist(patientId: string, psychologistId: string) {
    const context = await getAdminContext()
    if ('error' in context) {
        return { error: context.error }
    }

    const { data: existing } = await ((context.adminSupabase
        .from('patient_psychologist_relationships') as any) as any)
        .select('id, status')
        .eq('patient_id', patientId)
        .eq('psychologist_id', psychologistId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const deactivateQuery = (context.adminSupabase
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
        const { error: reactivateError } = await ((context.adminSupabase
            .from('patient_psychologist_relationships') as any) as any)
            .update({ status: 'active' })
            .eq('id', existing.id)

        if (reactivateError) {
            return { error: reactivateError.message }
        }

        revalidatePath('/dashboard/messages')
        revalidatePath('/dashboard/my-psychologist')
        revalidatePath('/dashboard/booking')
        revalidatePath('/dashboard/patients')
        revalidateAdminUsersViews()
        return { success: true }
    }

    const { error } = await ((context.adminSupabase
        .from('patient_psychologist_relationships') as any) as any)
        .insert({
            patient_id: patientId,
            psychologist_id: psychologistId,
            status: 'active',
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/messages')
    revalidatePath('/dashboard/my-psychologist')
    revalidatePath('/dashboard/booking')
    revalidatePath('/dashboard/patients')
    revalidateAdminUsersViews()
    return { success: true }
}

export async function removePatientAssignment(patientId: string, psychologistId: string) {
    const context = await getAdminContext()
    if ('error' in context) {
        return { error: context.error }
    }

    const { error } = await ((context.adminSupabase
        .from('patient_psychologist_relationships') as any) as any)
        .update({ status: 'inactive' })
        .eq('patient_id', patientId)
        .eq('psychologist_id', psychologistId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/messages')
    revalidatePath('/dashboard/my-psychologist')
    revalidatePath('/dashboard/booking')
    revalidatePath('/dashboard/patients')
    revalidateAdminUsersViews()
    return { success: true }
}

export async function adminUpdateProfile(
    userId: string,
    data: {
        full_name?: string | null
        bio?: string | null
        specialty?: string | null
        hourly_rate?: number | null
        is_test?: boolean
    }
) {
    const context = await getAdminContext()
    if ('error' in context) {
        return { error: context.error }
    }

    const { error } = await ((context.adminSupabase
        .from('profiles') as any) as any)
        .update({
            full_name: data.full_name,
            bio: data.bio,
            specialty: data.specialty,
            hourly_rate: data.hourly_rate,
            is_test: data.is_test,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

    if (error) {
        return { error: `Error al actualizar perfil: ${error.message}` }
    }

    revalidateAdminUsersViews()
    return { success: true }
}

export async function adminCreateUser(data: { email: string, password?: string, fullName: string, role: string }) {
    const context = await getAdminContext()
    if ('error' in context) {
        return { error: context.error }
    }

    const { data: newAuthUser, error: createError } = await context.adminSupabase.auth.admin.createUser({
        email: data.email,
        password: data.password || undefined,
        email_confirm: true,
        user_metadata: {
            full_name: data.fullName,
        },
    })

    if (createError) {
        return { error: `Error al crear usuario: ${createError.message}` }
    }

    if (!newAuthUser.user) {
        return { error: 'Error desconocido al crear usuario' }
    }

    const { error: updateError } = await ((context.adminSupabase
        .from('profiles') as any) as any)
        .update({
            role: data.role,
            updated_at: new Date().toISOString(),
        })
        .eq('id', newAuthUser.user.id)

    if (updateError) {
        return { error: `Usuario creado, pero hubo un error al asignar el rol: ${updateError.message}` }
    }

    revalidateAdminUsersViews()
    return { success: true }
}

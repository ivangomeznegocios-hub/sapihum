import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

type GuardedRole = UserRole

type GuardedProfile = {
    id: string
    role: GuardedRole
    email: string | null
    full_name: string | null
}

export async function loadCurrentViewer() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { user: null, profile: null }
    }

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('id, role, email, full_name')
        .eq('id', user.id)
        .maybeSingle()

    return {
        user,
        profile: (profile ?? null) as GuardedProfile | null,
    }
}

function includesRole(roles: readonly GuardedRole[], role: GuardedRole | null | undefined) {
    return !!role && roles.includes(role)
}

export async function requirePageRoles(
    roles: readonly GuardedRole[],
    redirectTo = '/dashboard'
) {
    const { user, profile } = await loadCurrentViewer()

    if (!user) {
        redirect('/auth/login')
    }

    if (!includesRole(roles, profile?.role)) {
        redirect(redirectTo)
    }

    return {
        user: user as User,
        profile: profile as GuardedProfile,
    }
}

export async function requireActionRoles(
    roles: readonly GuardedRole[],
    unauthorizedMessage = 'No tienes permisos'
) {
    const { user, profile } = await loadCurrentViewer()

    if (!user) {
        throw new Error('No autenticado')
    }

    if (!includesRole(roles, profile?.role)) {
        throw new Error(unauthorizedMessage)
    }

    return {
        user,
        profile: profile as GuardedProfile,
    }
}

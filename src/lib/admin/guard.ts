import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const OPERATIONS_ROLES = new Set(['admin', 'support'])

async function loadCurrentProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { supabase, user: null, profile: null }
    }

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('id, role, email, full_name')
        .eq('id', user.id)
        .maybeSingle()

    return {
        supabase,
        user,
        profile: profile as {
            id: string
            role: string
            email: string | null
            full_name: string | null
        } | null,
    }
}

export async function requireAdminPage() {
    const { user, profile } = await loadCurrentProfile()

    if (!user) {
        redirect('/auth/login')
    }

    if (!profile || profile.role !== 'admin') {
        redirect('/dashboard')
    }

    return {
        user,
        profile: profile as {
            id: string
            role: string
            email: string | null
            full_name: string | null
        },
    }
}

export async function requireAdminAction() {
    const { user, profile } = await loadCurrentProfile()

    if (!user) {
        throw new Error('No autenticado')
    }

    if (!profile || profile.role !== 'admin') {
        throw new Error('No tienes permisos de administrador')
    }

    return {
        user,
        profile: profile as {
            id: string
            role: string
            email: string | null
            full_name: string | null
        },
    }
}

export async function requireOperationsPage() {
    const { user, profile } = await loadCurrentProfile()

    if (!user) {
        redirect('/auth/login')
    }

    if (!profile || !OPERATIONS_ROLES.has(profile.role)) {
        redirect('/dashboard')
    }

    return {
        user,
        profile,
    }
}

export async function requireOperationsAction() {
    const { user, profile } = await loadCurrentProfile()

    if (!user) {
        throw new Error('No autenticado')
    }

    if (!profile || !OPERATIONS_ROLES.has(profile.role)) {
        throw new Error('No tienes permisos para operar accesos')
    }

    return {
        user,
        profile,
    }
}

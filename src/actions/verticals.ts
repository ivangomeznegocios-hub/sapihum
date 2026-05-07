'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient, getViewerContext } from '@/lib/supabase/server'
import { getDefaultVerticalRole, normalizeVerticalCode } from '@/lib/verticals'
import type { VerticalCode } from '@/types/database'

const ACTIVE_VERTICAL_COOKIE = 'sapihum_active_vertical'

export async function setActiveVertical(verticalCode: string) {
    const normalizedCode = normalizeVerticalCode(verticalCode)
    if (!normalizedCode) {
        return { success: false, error: 'Vertical no valida' }
    }

    const viewer = await getViewerContext()
    if (!viewer.user || !viewer.profile) {
        return { success: false, error: 'No autenticado' }
    }

    const canUseVertical = viewer.verticalAccess.some((access) => access.vertical?.code === normalizedCode)
    if (!canUseVertical) {
        return { success: false, error: 'No tienes acceso a esta vertical' }
    }

    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_VERTICAL_COOKIE, normalizedCode, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 180,
    })

    const adminClient = await createAdminClient()
    const targetAccess = viewer.verticalAccess.find((access) => access.vertical?.code === normalizedCode)

    if (targetAccess && !targetAccess.id.startsWith('global-')) {
        const { error: clearDefaultError } = await (adminClient
            .from('user_vertical_access') as any)
            .update({ is_default: false })
            .eq('user_id', viewer.user.id)

        if (clearDefaultError) {
            return { success: false, error: clearDefaultError.message }
        }

        const { data: updatedDefault, error: setDefaultError } = await (adminClient
            .from('user_vertical_access') as any)
            .update({ is_default: true })
            .eq('user_id', viewer.user.id)
            .eq('vertical_id', targetAccess.vertical_id)
            .select('id')
            .maybeSingle()

        if (setDefaultError) {
            return { success: false, error: setDefaultError.message }
        }

        if (!updatedDefault) {
            return { success: false, error: 'No se pudo guardar la vertical predeterminada' }
        }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function createInterestedVerticalAccess(verticalCode: VerticalCode | string) {
    const normalizedCode = normalizeVerticalCode(verticalCode)
    if (!normalizedCode) {
        return { success: false, error: 'Vertical no valida' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'No autenticado' }
    }

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()

    if (!profile) {
        return { success: false, error: 'Perfil no encontrado' }
    }

    const adminClient = await createAdminClient()
    const { data: vertical } = await (adminClient
        .from('verticals') as any)
        .select('id')
        .eq('code', normalizedCode)
        .eq('status', 'active')
        .maybeSingle()

    if (!vertical) {
        return { success: false, error: 'Vertical no encontrada' }
    }

    const { count } = await (adminClient
        .from('user_vertical_access') as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    const { error } = await (adminClient
        .from('user_vertical_access') as any)
        .upsert({
            user_id: user.id,
            vertical_id: vertical.id,
            vertical_role: getDefaultVerticalRole(profile.role),
            access_status: 'interested',
            membership_level: 0,
            is_default: (count ?? 0) === 0,
        }, { onConflict: 'user_id,vertical_id' })

    if (error) {
        return { success: false, error: error.message }
    }

    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_VERTICAL_COOKIE, normalizedCode, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 180,
    })

    revalidatePath('/dashboard')
    return { success: true }
}

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { getCommercialAccessContext, type CommercialAccessSnapshot } from '@/lib/access/commercial'
import { createTimeoutFetch } from '@/lib/http/timeout-fetch'
import {
    DEFAULT_VERTICAL_CODE,
    getDefaultVerticalRole,
    normalizeVerticalCode,
} from '@/lib/verticals'
import type { Profile, UserRole, Database, UserVerticalAccess, Vertical, VerticalCode } from '@/types/database'

const supabaseServerFetch = createTimeoutFetch(12_000, 'Supabase server request')

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            global: {
                fetch: supabaseServerFetch,
            },
        }
    )
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface ViewerContext {
    supabase: ServerSupabaseClient
    user: User | null
    profile: Profile | null
    role: UserRole | null
    profileMembershipLevel: number
    membershipLevel: number
    membershipSpecializationCode: Profile['membership_specialization_code']
    commercialAccess: CommercialAccessSnapshot | null
    availableVerticals: Vertical[]
    activeVertical: Vertical | null
    activeVerticalAccess: UserVerticalAccess | null
    verticalAccess: UserVerticalAccess[]
}

export async function createAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables')
        throw new Error('Server misconfiguration: Missing Service Role Key')
    }

    return createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            global: {
                fetch: supabaseServerFetch,
            },
        }
    )
}

async function getProfileByUserId(
    supabase: ServerSupabaseClient,
    userId: string
): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

    if (error) {
        console.error('Error fetching user profile:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            userId,
        })

        throw new Error(
            `Failed to fetch current user profile (code: ${error.code ?? 'unknown'})`,
            { cause: error }
        )
    }

    return data as Profile | null
}

const getBaseViewerContext = cache(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            supabase,
            user: null,
            profile: null,
            role: null,
            profileMembershipLevel: 0,
            membershipSpecializationCode: null,
            availableVerticals: [],
            activeVertical: null,
            activeVerticalAccess: null,
            verticalAccess: [],
        }
    }

    const profile = await getProfileByUserId(supabase, user.id)

    const verticalContext = profile
        ? await resolveUserVerticalContext({
            supabase,
            userId: user.id,
            profile,
        })
        : {
            availableVerticals: [],
            activeVertical: null,
            activeVerticalAccess: null,
            verticalAccess: [],
        }

    return {
        supabase,
        user,
        profile,
        role: profile?.role ?? null,
        profileMembershipLevel: Number(profile?.membership_level ?? 0),
        membershipSpecializationCode: profile?.membership_specialization_code ?? null,
        ...verticalContext,
    }
})

async function getActiveVerticalCookieCode() {
    const cookieStore = await cookies()
    return normalizeVerticalCode(cookieStore.get('sapihum_active_vertical')?.value)
}

async function resolveUserVerticalContext(params: {
    supabase: ServerSupabaseClient
    userId: string
    profile: Profile
    requestedVerticalCode?: VerticalCode | null
}) {
    // PERF: Run both independent queries in parallel instead of sequentially.
    const [{ data: activeVerticalRows }, { data: accessRows }] = await Promise.all([
        (params.supabase
            .from('verticals') as any)
            .select('*')
            .eq('status', 'active')
            .order('name', { ascending: true }),
        (params.supabase
            .from('user_vertical_access') as any)
            .select('*, vertical:verticals(*)')
            .eq('user_id', params.userId)
            .neq('access_status', 'suspended')
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: true }),
    ])

    const allActiveVerticals = ((activeVerticalRows ?? []) as Vertical[])
        .filter((vertical) => vertical.code === 'psicologia' || vertical.code === 'ciencias_forenses')

    const storedAccess = ((accessRows ?? []) as UserVerticalAccess[])
        .filter((row) => row.vertical && row.vertical.status === 'active')

    const hasGlobalScope = params.profile.role === 'admin' || params.profile.role === 'support'
    const verticalAccess = hasGlobalScope
        ? mergeGlobalVerticalAccess({
            userId: params.userId,
            profile: params.profile,
            allActiveVerticals,
            storedAccess,
        })
        : storedAccess

    const availableVerticals = verticalAccess
        .map((row) => row.vertical)
        .filter((vertical): vertical is Vertical => Boolean(vertical))

    const requestedVerticalCode = params.requestedVerticalCode ?? await getActiveVerticalCookieCode()
    const requestedAccess = requestedVerticalCode
        ? verticalAccess.find((row) => row.vertical?.code === requestedVerticalCode)
        : null
    const defaultAccess = verticalAccess.find((row) => row.is_default) ?? null
    const singleAccess = verticalAccess.length === 1 ? verticalAccess[0] : null
    const fallbackAccess = verticalAccess.find((row) => row.vertical?.code === DEFAULT_VERTICAL_CODE) ?? verticalAccess[0] ?? null
    const activeVerticalAccess = requestedAccess ?? defaultAccess ?? singleAccess ?? fallbackAccess

    return {
        availableVerticals,
        activeVertical: activeVerticalAccess?.vertical ?? null,
        activeVerticalAccess: activeVerticalAccess ?? null,
        verticalAccess,
    }
}


function mergeGlobalVerticalAccess(params: {
    userId: string
    profile: Profile
    allActiveVerticals: Vertical[]
    storedAccess: UserVerticalAccess[]
}) {
    const storedByCode = new Map(
        params.storedAccess
            .filter((row) => row.vertical)
            .map((row) => [row.vertical!.code, row])
    )

    return params.allActiveVerticals.map((vertical) => {
        const existing = storedByCode.get(vertical.code)
        if (existing) {
            return {
                ...existing,
                vertical_role: getDefaultVerticalRole(params.profile.role),
                access_status: 'active' as const,
            }
        }

        return {
            id: `global-${params.userId}-${vertical.code}`,
            user_id: params.userId,
            vertical_id: vertical.id,
            vertical_role: getDefaultVerticalRole(params.profile.role),
            access_status: 'active' as const,
            membership_level: Number(params.profile.membership_level ?? 0),
            is_default: vertical.code === DEFAULT_VERTICAL_CODE,
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
            vertical,
        } satisfies UserVerticalAccess
    })
}

const getViewerContextCached = cache(async (
    includeCommercialAccess: boolean,
    requestedVerticalCode: VerticalCode | null
): Promise<ViewerContext> => {
    const base = await getBaseViewerContext()
    const verticalContext = base.user && base.profile && requestedVerticalCode
        ? await resolveUserVerticalContext({
            supabase: base.supabase,
            userId: base.user.id,
            profile: base.profile,
            requestedVerticalCode,
        })
        : {
            availableVerticals: base.availableVerticals,
            activeVertical: base.activeVertical,
            activeVerticalAccess: base.activeVerticalAccess,
            verticalAccess: base.verticalAccess,
        }

    if (!includeCommercialAccess || !base.user || !base.profile) {
        return {
            ...base,
            ...verticalContext,
            membershipLevel: base.profileMembershipLevel,
            commercialAccess: null,
        }
    }

    const commercialAccess = await getCommercialAccessContext({
        supabase: base.supabase,
        userId: base.user.id,
        profile: base.profile,
    })
    const verticalMembershipLevel = verticalContext.activeVerticalAccess
        ? Number(verticalContext.activeVerticalAccess.membership_level ?? 0)
        : null
    const verticalHasActiveMembership = Boolean(
        verticalContext.activeVerticalAccess?.access_status === 'active' &&
        verticalMembershipLevel !== null &&
        verticalMembershipLevel > 0
    )
    const effectiveMembershipLevel = verticalMembershipLevel ?? commercialAccess?.membershipLevel ?? base.profileMembershipLevel
    const effectiveCommercialAccess = commercialAccess
        ? {
            ...commercialAccess,
            membershipLevel: effectiveMembershipLevel,
            hasActiveMembership: commercialAccess.hasActiveMembership || verticalHasActiveMembership,
            viewer: {
                ...commercialAccess.viewer,
                membershipLevel: effectiveMembershipLevel,
                membershipActive: commercialAccess.viewer.membershipActive || verticalHasActiveMembership,
            },
        }
        : null

    return {
        ...base,
        ...verticalContext,
        membershipLevel: effectiveMembershipLevel,
        commercialAccess: effectiveCommercialAccess,
    }
})

export async function getViewerContext(options?: {
    includeCommercialAccess?: boolean
    activeVerticalCode?: string | null
}): Promise<ViewerContext> {
    return getViewerContextCached(
        Boolean(options?.includeCommercialAccess),
        normalizeVerticalCode(options?.activeVerticalCode)
    )
}

/**
 * Get the current user's profile from the database
 * Returns null if user is not authenticated or profile doesn't exist
 */
export async function getUserProfile(): Promise<Profile | null> {
    const viewer = await getViewerContext()
    return viewer.profile
}

/**
 * Get the current user's role
 * Returns null if user is not authenticated
 */
export async function getUserRole(): Promise<UserRole | null> {
    const viewer = await getViewerContext()
    return viewer.role
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
    const userRole = await getUserRole()
    return userRole === role
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
    return hasRole('admin')
}

/**
 * Check if the current user is a psychologist
 */
export async function isPsychologist(): Promise<boolean> {
    return hasRole('psychologist')
}

/**
 * Check if the current user is a patient
 */
export async function isPatient(): Promise<boolean> {
    return hasRole('patient')
}

/**
 * Get the current user's membership level
 * Returns 0 (free tier) if user is not authenticated
 */
export async function getUserMembershipLevel(): Promise<number> {
    const viewer = await getViewerContext()
    return viewer.profileMembershipLevel
}

/**
 * Check if the current user has at least the required membership level
 */
export async function hasMinimumMembershipLevel(requiredLevel: number): Promise<boolean> {
    const level = await getUserMembershipLevel()
    return level >= requiredLevel
}

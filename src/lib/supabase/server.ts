import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { getCommercialAccessContext, type CommercialAccessSnapshot } from '@/lib/access/commercial'
import type { Profile, UserRole, Database } from '@/types/database'

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
}

export async function createAdminClient() {
    const cookieStore = await cookies()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables')
        throw new Error('Server misconfiguration: Missing Service Role Key')
    }

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
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
        }
    }

    const profile = await getProfileByUserId(supabase, user.id)

    return {
        supabase,
        user,
        profile,
        role: profile?.role ?? null,
        profileMembershipLevel: Number(profile?.membership_level ?? 0),
        membershipSpecializationCode: profile?.membership_specialization_code ?? null,
    }
})

const getViewerContextCached = cache(async (includeCommercialAccess: boolean): Promise<ViewerContext> => {
    const base = await getBaseViewerContext()

    if (!includeCommercialAccess || !base.user || !base.profile) {
        return {
            ...base,
            membershipLevel: base.profileMembershipLevel,
            commercialAccess: null,
        }
    }

    const commercialAccess = await getCommercialAccessContext({
        supabase: base.supabase,
        userId: base.user.id,
        profile: base.profile,
    })

    return {
        ...base,
        membershipLevel: commercialAccess?.membershipLevel ?? base.profileMembershipLevel,
        commercialAccess,
    }
})

export async function getViewerContext(options?: {
    includeCommercialAccess?: boolean
}): Promise<ViewerContext> {
    return getViewerContextCached(Boolean(options?.includeCommercialAccess))
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

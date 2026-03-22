import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

/**
 * Get the current user's profile from the database
 * Returns null if user is not authenticated or profile doesn't exist
 */
export async function getUserProfile(): Promise<Profile | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }


    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Error fetching user profile:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            userId: user.id
        })
        return null
    }

    return data as Profile | null
}

/**
 * Get the current user's role
 * Returns null if user is not authenticated
 */
export async function getUserRole(): Promise<UserRole | null> {
    const profile = await getUserProfile()
    return profile?.role ?? null
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
    const profile = await getUserProfile()
    return profile?.membership_level ?? 0
}

/**
 * Check if the current user has at least the required membership level
 */
export async function hasMinimumMembershipLevel(requiredLevel: number): Promise<boolean> {
    const level = await getUserMembershipLevel()
    return level >= requiredLevel
}

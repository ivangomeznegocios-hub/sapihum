import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { Database, UserRole } from '@/types/database'

type AuthUserSnapshot = Pick<User, 'id' | 'email' | 'user_metadata'>

const REGISTRATION_PROFILE_ROLES = new Set<UserRole>(['psychologist', 'patient'])

let adminClient: ReturnType<typeof createClient<Database>> | null = null

function getAdminClient() {
    if (adminClient) {
        return adminClient
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase service-role credentials are required to provision missing profiles')
    }

    adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    return adminClient
}

function pickMetadataText(metadata: User['user_metadata'], key: string) {
    const value = metadata?.[key]
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function pickRegistrationRole(metadata: User['user_metadata']): UserRole {
    const requestedRole = pickMetadataText(metadata, 'registration_role')

    if (requestedRole && REGISTRATION_PROFILE_ROLES.has(requestedRole as UserRole)) {
        return requestedRole as UserRole
    }

    return 'patient'
}

export async function ensureProfileForAuthUser(user: AuthUserSnapshot) {
    const admin = getAdminClient()
    const fullName = pickMetadataText(user.user_metadata, 'full_name') ?? pickMetadataText(user.user_metadata, 'name')
    const avatarUrl = pickMetadataText(user.user_metadata, 'avatar_url')
    const registrationRole = pickRegistrationRole(user.user_metadata)

    const { error } = await (admin
        .from('profiles') as any)
        .upsert(
            {
                id: user.id,
                email: user.email ?? null,
                full_name: fullName,
                avatar_url: avatarUrl,
                role: registrationRole,
            },
            {
                onConflict: 'id',
                ignoreDuplicates: true,
            }
        )

    if (error) {
        console.error('Failed to provision missing profile for authenticated user', {
            userId: user.id,
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
        })
        return false
    }

    return true
}

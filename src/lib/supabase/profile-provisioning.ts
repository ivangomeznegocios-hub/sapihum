import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type AuthUserSnapshot = Pick<User, 'id' | 'email' | 'user_metadata'>

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

export async function ensureProfileForAuthUser(user: AuthUserSnapshot) {
    const admin = getAdminClient()
    const fullName = pickMetadataText(user.user_metadata, 'full_name') ?? pickMetadataText(user.user_metadata, 'name')
    const avatarUrl = pickMetadataText(user.user_metadata, 'avatar_url')

    const { error } = await (admin
        .from('profiles') as any)
        .upsert(
            {
                id: user.id,
                email: user.email ?? null,
                full_name: fullName,
                avatar_url: avatarUrl,
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

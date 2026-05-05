import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createTimeoutFetch } from '@/lib/http/timeout-fetch'
import type { Database } from '@/types/database'

let publicClient: ReturnType<typeof createSupabaseClient<Database>> | null = null
const supabasePublicFetch = createTimeoutFetch(12_000, 'Supabase public request')

export function createPublicClient() {
    if (!publicClient) {
        publicClient = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
                global: {
                    fetch: supabasePublicFetch,
                },
            }
        )
    }

    return publicClient
}

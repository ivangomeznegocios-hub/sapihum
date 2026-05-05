import { createClient } from '@supabase/supabase-js'
import { createTimeoutFetch } from '@/lib/http/timeout-fetch'
import type { Database } from '@/types/database'

const supabaseServiceFetch = createTimeoutFetch(12_000, 'Supabase service request')

export function createServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase service role credentials are not configured')
    }

    return createClient<Database>(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        global: {
            fetch: supabaseServiceFetch,
        },
    })
}

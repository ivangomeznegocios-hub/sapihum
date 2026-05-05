'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createTimeoutFetch } from '@/lib/http/timeout-fetch'

const supabaseBrowserFetch = createTimeoutFetch(12_000, 'Supabase browser request')

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                fetch: supabaseBrowserFetch,
            },
        }
    )
}

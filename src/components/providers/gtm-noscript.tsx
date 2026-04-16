'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { resolveTrackingRouteContext } from '@/lib/tracking/policy'

const googleTagManagerId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?.trim()

export function PublicSafeGtmNoscript() {
    const pathname = usePathname() || '/'
    const routeContext = useMemo(() => resolveTrackingRouteContext(pathname), [pathname])

    if (!googleTagManagerId || !routeContext.destinations.gtm) {
        return null
    }

    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(googleTagManagerId)}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
            />
        </noscript>
    )
}

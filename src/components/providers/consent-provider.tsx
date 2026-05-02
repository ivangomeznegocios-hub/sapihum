'use client'

import { useEffect, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
    buildGoogleConsentModeState,
    getConsentState,
} from '@/lib/consent'
import { shouldDisplayCookieControls } from '@/lib/tracking/policy'

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
    }
}

export function ConsentProvider() {
    const pathname = usePathname()
    const hasCookieControls = shouldDisplayCookieControls(pathname)

    useLayoutEffect(() => {
        document.documentElement.dataset.cookieSurface = hasCookieControls ? 'public' : 'private'
    }, [hasCookieControls])

    useEffect(() => {
        const consent = getConsentState()
        if (consent) {
            window.gtag?.('consent', 'update', buildGoogleConsentModeState(consent))
        }

        return () => {
            delete document.documentElement.dataset.cookieSurface
        }
    }, [])

    return null
}

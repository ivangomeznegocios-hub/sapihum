'use client'

import { useEffect, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { shouldDisplayCookieControls } from '@/lib/tracking/policy'
import { CookiebotBridge } from './cookiebot-bridge'

const cookiebotDomainGroupId = process.env.NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID?.trim()

export function CookiebotProvider() {
    const pathname = usePathname()
    const hasCookieControls = shouldDisplayCookieControls(pathname)
    const hasCookiebot = Boolean(cookiebotDomainGroupId) && hasCookieControls

    useLayoutEffect(() => {
        document.documentElement.dataset.cookieSurface = hasCookieControls ? 'public' : 'private'
    }, [hasCookieControls])

    useEffect(() => {
        return () => {
            delete document.documentElement.dataset.cookieSurface
        }
    }, [])

    return (
        <>
            {hasCookiebot ? (
                <Script
                    id="cookiebot"
                    src="https://consent.cookiebot.com/uc.js"
                    data-cbid={cookiebotDomainGroupId}
                    data-blockingmode="auto"
                    strategy="lazyOnload"
                />
            ) : null}
            <CookiebotBridge hasCookiebot={hasCookiebot} />
        </>
    )
}

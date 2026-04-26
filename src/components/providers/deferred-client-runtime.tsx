'use client'

import { useEffect, useState, type ElementType } from 'react'

type RuntimeComponent = ElementType

function scheduleIdle(callback: () => void) {
    if (typeof window === 'undefined') return undefined

    const requestIdle =
        window.requestIdleCallback
        ?? ((handler: IdleRequestCallback) =>
            window.setTimeout(() => handler({ didTimeout: false, timeRemaining: () => 0 }), 1400))
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout
    const idleId = requestIdle(callback, { timeout: 3000 })

    return () => cancelIdle(idleId)
}

export function DeferredClientRuntime() {
    const [components, setComponents] = useState<RuntimeComponent[]>([])

    useEffect(() => {
        let isMounted = true

        const cancel = scheduleIdle(() => {
            const isLocalhost =
                window.location.hostname === 'localhost'
                || window.location.hostname === '127.0.0.1'
                || window.location.hostname === '::1'
            const imports: Array<Promise<RuntimeComponent>> = [
                import('@/components/providers/analytics-provider').then((module) => module.AnalyticsProvider),
                import('@/components/gdpr/cookie-consent-banner').then((module) => module.CookieConsentBanner),
            ]

            if (!isLocalhost) {
                imports.push(
                    import('@/components/providers/cookiebot-provider').then((module) => module.CookiebotProvider),
                    import('@/components/providers/onesignal-provider').then((module) => module.OneSignalSetup),
                    import('@vercel/analytics/next').then((module) => module.Analytics),
                    import('@vercel/speed-insights/next').then((module) => module.SpeedInsights)
                )
            }

            void Promise.all(imports).then((loadedComponents) => {
                if (isMounted) {
                    setComponents(loadedComponents)
                }
            })
        })

        return () => {
            isMounted = false
            cancel?.()
        }
    }, [])

    return (
        <>
            {components.map((Component, index) => (
                <Component key={index} />
            ))}
        </>
    )
}

'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { CONSENT_CHANGE_EVENT } from '@/lib/consent'
import { collectAnalyticsEvent, ensureAnalyticsIds, inferFunnelFromPath } from '@/lib/analytics/client'
import type { AnalyticsEventName, AnalyticsFunnel } from '@/lib/analytics/types'

function getDatasetValue(element: HTMLElement, key: string): string | null {
    const value = element.dataset[key]
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function getClosestTrackableElement(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) return null
    return target.closest('[data-analytics-event],[data-analytics-cta]') as HTMLElement | null
}

export function AnalyticsProvider() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        ensureAnalyticsIds()
    }, [])

    useEffect(() => {
        const query = searchParams.toString()
        void collectAnalyticsEvent('page_view', {
            properties: {
                title: typeof document !== 'undefined' ? document.title : '',
                query,
            },
            touch: {
                landingPath: pathname,
                funnel: inferFunnelFromPath(pathname),
            },
        })
    }, [pathname, searchParams])

    useEffect(() => {
        const handleConsentChange = () => {
            ensureAnalyticsIds()
        }

        window.addEventListener(CONSENT_CHANGE_EVENT, handleConsentChange)
        return () => window.removeEventListener(CONSENT_CHANGE_EVENT, handleConsentChange)
    }, [])

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const element = getClosestTrackableElement(event.target)
            if (!element) return

            const explicitEvent = getDatasetValue(element, 'analyticsEvent')
            const isCta = element.hasAttribute('data-analytics-cta')
            const eventName = (explicitEvent ?? (isCta ? 'cta_clicked' : null)) as AnalyticsEventName | null
            if (!eventName) return

            const href = element instanceof HTMLAnchorElement ? element.href : getDatasetValue(element, 'analyticsHref')
            const funnel = (getDatasetValue(element, 'analyticsFunnel') ?? inferFunnelFromPath(pathname)) as AnalyticsFunnel

            void collectAnalyticsEvent(eventName, {
                properties: {
                    label: getDatasetValue(element, 'analyticsLabel') ?? element.textContent?.trim() ?? null,
                    href,
                    surface: getDatasetValue(element, 'analyticsSurface'),
                },
                touch: {
                    landingPath: pathname,
                    funnel,
                    targetPlan: getDatasetValue(element, 'analyticsPlan'),
                    targetSpecialization: getDatasetValue(element, 'analyticsSpecialization'),
                },
            })
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [pathname])

    return null
}

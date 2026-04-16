'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
    CONSENT_CHANGE_EVENT,
    hasMeasurementConsent,
    parseConsentCookieFromDocumentCookie,
    type StoredConsentState,
} from '@/lib/consent'
import {
    collectAnalyticsEvent,
    ensureAnalyticsIds,
    inferFunnelFromPath,
    pushTrackingContextToDataLayer,
} from '@/lib/analytics/client'
import { resolveTrackingRouteContext } from '@/lib/tracking/policy'
import type { AnalyticsEventName, AnalyticsFunnel } from '@/lib/analytics/types'

const googleTagManagerId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?.trim()

function getDatasetValue(element: HTMLElement, key: string): string | null {
    const value = element.dataset[key]
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function getClosestTrackableElement(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) return null
    return target.closest('[data-analytics-event],[data-analytics-cta],a[href],button[data-analytics-cta]') as HTMLElement | null
}

function getTrackedForm(target: EventTarget | null): HTMLFormElement | null {
    if (!(target instanceof HTMLElement)) return null
    return target.closest('form[data-analytics-form]') as HTMLFormElement | null
}

function isWhatsAppHref(value: string | null) {
    if (!value) return false
    return value.includes('wa.me') || value.includes('api.whatsapp.com')
}

function getInternalNavigationPath(value: string | null) {
    if (!value || typeof window === 'undefined') return null
    if (
        value.startsWith('#')
        || value.startsWith('mailto:')
        || value.startsWith('tel:')
        || value.startsWith('javascript:')
    ) {
        return null
    }

    try {
        const resolved = new URL(value, window.location.origin)
        if (resolved.origin !== window.location.origin) {
            return null
        }

        const normalizedPath = resolved.pathname.replace(/\/+$/, '') || '/'
        const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'

        if (normalizedPath === currentPath && !resolved.search && !resolved.hash) {
            return null
        }

        return normalizedPath
    } catch {
        return null
    }
}

function syncConsentState(): StoredConsentState | null {
    if (typeof document === 'undefined') return null
    return parseConsentCookieFromDocumentCookie(document.cookie)
}

function buildFormTrackingPayload(form: HTMLFormElement, pathname: string) {
    const funnel = (form.dataset.analyticsFunnel ?? inferFunnelFromPath(pathname)) as AnalyticsFunnel

    return {
        properties: {
            form_name: form.dataset.analyticsForm ?? 'unknown_form',
            surface: form.dataset.analyticsSurface ?? null,
        },
        touch: {
            landingPath: pathname,
            funnel,
            targetPlan: form.dataset.analyticsPlan ?? null,
            targetSpecialization: form.dataset.analyticsSpecialization ?? null,
        },
    }
}

export function AnalyticsProvider() {
    const pathname = usePathname() || '/'
    const routeContext = useMemo(() => resolveTrackingRouteContext(pathname), [pathname])
    const [consentState, setConsentState] = useState<StoredConsentState | null>(null)
    const lastPageViewKey = useRef<string | null>(null)
    const lastViewContentKey = useRef<string | null>(null)
    const startedForms = useRef(new Set<string>())

    useEffect(() => {
        setConsentState(syncConsentState())
    }, [])

    useEffect(() => {
        const handleConsentChange = () => {
            const nextConsentState = syncConsentState()
            setConsentState(nextConsentState)
            ensureAnalyticsIds()
            pushTrackingContextToDataLayer(routeContext)
        }

        window.addEventListener(CONSENT_CHANGE_EVENT, handleConsentChange)
        window.addEventListener('storage', handleConsentChange)

        return () => {
            window.removeEventListener(CONSENT_CHANGE_EVENT, handleConsentChange)
            window.removeEventListener('storage', handleConsentChange)
        }
    }, [routeContext])

    useEffect(() => {
        ensureAnalyticsIds()
    }, [])

    useEffect(() => {
        document.documentElement.dataset.trackingZone = routeContext.zone
        document.documentElement.dataset.trackingPageType = routeContext.pageType
        document.documentElement.dataset.trackingContentType = routeContext.contentType
        pushTrackingContextToDataLayer(routeContext)
    }, [routeContext])

    useEffect(() => {
        const canLoadGtm =
            Boolean(googleTagManagerId)
            && routeContext.destinations.gtm

        if (!canLoadGtm || typeof window === 'undefined') {
            return
        }

        window.__sapihumTracking = window.__sapihumTracking || {}
        if (window.__sapihumTracking.gtmLoaded) {
            return
        }

        window.__sapihumTracking.gtmLoaded = true
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({
            'gtm.start': Date.now(),
            event: 'gtm.js',
        })

        const script = document.createElement('script')
        script.async = true
        script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(googleTagManagerId!)}`
        script.dataset.sapihumTracking = 'gtm'
        document.head.appendChild(script)
    }, [routeContext.destinations.gtm])

    useEffect(() => {
        startedForms.current.clear()
    }, [pathname])

    useEffect(() => {
        if (!routeContext.allowAutoPageView || !hasMeasurementConsent(consentState)) {
            return
        }

        const pageViewKey = `${routeContext.pathname}:${routeContext.pageType}`
        if (lastPageViewKey.current !== pageViewKey) {
            lastPageViewKey.current = pageViewKey
            void collectAnalyticsEvent('page_view', {
                properties: {
                    title: typeof document !== 'undefined' ? document.title : null,
                },
                touch: {
                    landingPath: routeContext.pathname,
                    funnel: inferFunnelFromPath(routeContext.pathname),
                },
            })
        }

        if (routeContext.allowAutoViewContent) {
            const detailKey = `${routeContext.pathname}:${routeContext.contentType}`
            if (lastViewContentKey.current !== detailKey) {
                lastViewContentKey.current = detailKey
                const slug = routeContext.pathname.split('/').filter(Boolean).pop() ?? null

                void collectAnalyticsEvent('view_content', {
                    properties: {
                        title: typeof document !== 'undefined' ? document.title : null,
                        slug,
                    },
                    touch: {
                        landingPath: routeContext.pathname,
                        funnel: inferFunnelFromPath(routeContext.pathname),
                    },
                })
            }
        }
    }, [consentState, routeContext])

    useEffect(() => {
        if (!routeContext.allowAutoClickTracking) {
            return
        }

        const handleClick = (event: MouseEvent) => {
            const element = getClosestTrackableElement(event.target)
            if (!element) return

            const explicitEvent = getDatasetValue(element, 'analyticsEvent') as AnalyticsEventName | null
            const href =
                element instanceof HTMLAnchorElement
                    ? element.href
                    : getDatasetValue(element, 'analyticsHref')
            const isPhoneClick = typeof href === 'string' && href.startsWith('tel:')
            const isWhatsAppClick = isWhatsAppHref(href)
            const internalNavigationPath = getInternalNavigationPath(href)
            const isCta = element.hasAttribute('data-analytics-cta') || Boolean(internalNavigationPath)
            const eventName =
                explicitEvent
                ?? (isWhatsAppClick ? 'click_whatsapp' : null)
                ?? (isPhoneClick ? 'click_phone' : null)
                ?? (isCta ? 'cta_clicked' : null)

            if (!eventName) return

            const funnel = (getDatasetValue(element, 'analyticsFunnel') ?? inferFunnelFromPath(pathname)) as AnalyticsFunnel

            void collectAnalyticsEvent(eventName, {
                properties: {
                    label: getDatasetValue(element, 'analyticsLabel') ?? element.textContent?.trim() ?? null,
                    href,
                    target_path: internalNavigationPath,
                    surface: getDatasetValue(element, 'analyticsSurface') ?? routeContext.pageType,
                },
                touch: {
                    landingPath: routeContext.pathname,
                    funnel,
                    targetPlan: getDatasetValue(element, 'analyticsPlan'),
                    targetSpecialization: getDatasetValue(element, 'analyticsSpecialization'),
                },
            })
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [pathname, routeContext])

    useEffect(() => {
        if (!routeContext.allowAutoFormTracking) {
            return
        }

        const handleFormStart = (event: FocusEvent | Event) => {
            const form = getTrackedForm(event.target)
            if (!form) return

            const formName = form.dataset.analyticsForm ?? 'unknown_form'
            if (startedForms.current.has(formName)) {
                return
            }

            startedForms.current.add(formName)
            void collectAnalyticsEvent('form_start', buildFormTrackingPayload(form, routeContext.pathname))
        }

        const handleFormSubmit = (event: SubmitEvent) => {
            const form = event.target instanceof HTMLFormElement ? event.target : getTrackedForm(event.target)
            if (!form) return

            void collectAnalyticsEvent('form_submit', buildFormTrackingPayload(form, routeContext.pathname))
        }

        document.addEventListener('focusin', handleFormStart)
        document.addEventListener('input', handleFormStart)
        document.addEventListener('submit', handleFormSubmit)

        return () => {
            document.removeEventListener('focusin', handleFormStart)
            document.removeEventListener('input', handleFormStart)
            document.removeEventListener('submit', handleFormSubmit)
        }
    }, [routeContext])

    return null
}

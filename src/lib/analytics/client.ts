'use client'

import { hasAnalyticsConsent, parseConsentCookieFromDocumentCookie } from '@/lib/consent'
import { deriveAnalyticsChannel, normalizeAttributionTouch } from './attribution'
import type { AnalyticsCollectRequest, AnalyticsContext, AnalyticsEventName, AnalyticsFunnel, AttributionTouch } from './types'

export const ANALYTICS_VISITOR_KEY = 'cp_analytics_visitor_id'
export const ANALYTICS_SESSION_KEY = 'cp_analytics_session_id'

type DataLayerEvent = {
    event: string
    [key: string]: unknown
}

declare global {
    interface Window {
        dataLayer?: DataLayerEvent[]
    }
}

function getStoredValue(key: string): string | null {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
}

function setStoredValue(key: string, value: string) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
}

export function getBrowserAnalyticsConsent(): boolean {
    if (typeof document === 'undefined') return false
    const consent = parseConsentCookieFromDocumentCookie(document.cookie)
    return hasAnalyticsConsent(consent)
}

export function ensureAnalyticsIds() {
    if (typeof window === 'undefined' || !getBrowserAnalyticsConsent()) return null

    const visitorId = getStoredValue(ANALYTICS_VISITOR_KEY) ?? crypto.randomUUID()
    const sessionId = getStoredValue(ANALYTICS_SESSION_KEY) ?? crypto.randomUUID()

    setStoredValue(ANALYTICS_VISITOR_KEY, visitorId)
    setStoredValue(ANALYTICS_SESSION_KEY, sessionId)

    return { visitorId, sessionId }
}

export function buildBrowserTouch(overrides?: Partial<AttributionTouch> | null): AttributionTouch | null {
    if (typeof window === 'undefined') return null

    const url = new URL(window.location.href)
    const source = overrides?.source ?? url.searchParams.get('utm_source')
    const medium = overrides?.medium ?? url.searchParams.get('utm_medium')
    const campaign = overrides?.campaign ?? url.searchParams.get('utm_campaign')
    const ref = overrides?.ref ?? url.searchParams.get('ref')
    const gclid = overrides?.gclid ?? url.searchParams.get('gclid')
    const fbclid = overrides?.fbclid ?? url.searchParams.get('fbclid')
    const referrer = overrides?.referrer ?? document.referrer ?? null
    const landingPath = overrides?.landingPath ?? url.pathname
    const targetPlan = overrides?.targetPlan ?? url.searchParams.get('plan')
    const targetSpecialization = overrides?.targetSpecialization ?? url.searchParams.get('specialization')
    const funnel = overrides?.funnel ?? inferFunnelFromPath(url.pathname)

    return normalizeAttributionTouch(
        {
            ...overrides,
            source,
            medium,
            campaign,
            term: overrides?.term ?? url.searchParams.get('utm_term'),
            content: overrides?.content ?? url.searchParams.get('utm_content'),
            ref,
            gclid,
            fbclid,
            referrer,
            landingPath,
            targetPlan,
            targetSpecialization,
            funnel,
            channel: overrides?.channel ?? deriveAnalyticsChannel({ source, medium, ref, gclid, fbclid, referrer, landingPath }),
        },
        { landingPath, funnel }
    )
}

export function getClientAnalyticsContext(overrides?: Partial<AttributionTouch> | null): AnalyticsContext | null {
    const ids = ensureAnalyticsIds()
    if (!ids) return null

    return {
        visitorId: ids.visitorId,
        sessionId: ids.sessionId,
        touch: buildBrowserTouch(overrides),
    }
}

export function inferFunnelFromPath(pathname: string): AnalyticsFunnel {
    if (pathname.startsWith('/auth/register')) return 'registration'
    if (pathname.startsWith('/dashboard/subscription')) return 'subscription'
    if (pathname.startsWith('/dashboard/events')) return 'event'
    if (pathname.startsWith('/dashboard/admin/marketing')) return 'admin_marketing'
    if (pathname.startsWith('/dashboard/admin/growth')) return 'admin_growth'
    if (pathname.startsWith('/dashboard')) return 'dashboard'
    if (pathname.startsWith('/precios') || pathname.startsWith('/especialidades') || pathname === '/' || pathname.startsWith('/lp')) {
        return 'landing'
    }
    return 'landing'
}

export function pushDataLayerEvent(eventName: AnalyticsEventName, payload: Record<string, unknown> = {}) {
    if (typeof window === 'undefined' || !Array.isArray(window.dataLayer)) return
    window.dataLayer.push({
        event: eventName,
        ...payload,
    })
}

export async function collectAnalyticsEvent(
    eventName: AnalyticsEventName,
    input?: {
        properties?: Record<string, unknown>
        touch?: Partial<AttributionTouch> | null
        eventSource?: 'client' | 'server' | 'webhook'
    }
): Promise<{ skipped?: boolean; visitorId?: string; sessionId?: string }> {
    if (!getBrowserAnalyticsConsent()) {
        return { skipped: true }
    }

    const ids = ensureAnalyticsIds()
    if (!ids?.visitorId || !ids?.sessionId) {
        return { skipped: true }
    }

    const payload: AnalyticsCollectRequest = {
        eventName,
        eventSource: input?.eventSource ?? 'client',
        properties: input?.properties ?? {},
        visitorId: ids.visitorId,
        sessionId: ids.sessionId,
        touch: buildBrowserTouch(input?.touch),
    }

    pushDataLayerEvent(eventName, {
        ...payload.properties,
        channel: payload.touch?.channel,
        campaign: payload.touch?.campaign,
    })

    const response = await fetch('/api/analytics/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        return { skipped: true }
    }

    const data = await response.json()
    if (data.visitorId) setStoredValue(ANALYTICS_VISITOR_KEY, data.visitorId)
    if (data.sessionId) setStoredValue(ANALYTICS_SESSION_KEY, data.sessionId)
    return data
}

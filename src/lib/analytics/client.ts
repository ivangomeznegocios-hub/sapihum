'use client'

import {
    hasAnalyticsConsent,
    hasMeasurementConsent,
    parseConsentCookieFromDocumentCookie,
    type StoredConsentState,
} from '@/lib/consent'
import { getAllowedTrackingDestinations, getCanonicalTrackingEventName } from '@/lib/tracking/catalog'
import { resolveTrackingRouteContext, type TrackingRouteContext } from '@/lib/tracking/policy'
import { sanitizeTrackingProperties } from '@/lib/tracking/sanitize'
import { deriveAnalyticsChannel, normalizeAttributionTouch } from './attribution'
import type {
    AnalyticsCollectRequest,
    AnalyticsConsentSnapshot,
    AnalyticsContext,
    AnalyticsEventName,
    AnalyticsFunnel,
    AttributionTouch,
} from './types'

export const ANALYTICS_VISITOR_KEY = 'cp_analytics_visitor_id'
export const ANALYTICS_SESSION_KEY = 'cp_analytics_session_id'
export const ANALYTICS_LAST_TOUCH_KEY = 'cp_analytics_last_touch'

type DataLayerEvent = {
    event: string
    [key: string]: unknown
}

declare global {
    interface Window {
        dataLayer?: DataLayerEvent[]
        gtag?: (...args: unknown[]) => void
        __sapihumTracking?: {
            gtmLoaded?: boolean
        }
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

function getStoredTouch(): Partial<AttributionTouch> | null {
    const raw = getStoredValue(ANALYTICS_LAST_TOUCH_KEY)
    if (!raw) return null

    try {
        return JSON.parse(raw) as Partial<AttributionTouch>
    } catch {
        return null
    }
}

function setStoredTouch(touch: Partial<AttributionTouch>) {
    if (typeof window === 'undefined') return
    setStoredValue(ANALYTICS_LAST_TOUCH_KEY, JSON.stringify(touch))
}

function hasTouchSignal(touch: Partial<AttributionTouch> | null | undefined) {
    return Boolean(
        touch?.source ||
        touch?.medium ||
        touch?.campaign ||
        touch?.ref ||
        touch?.gclid ||
        touch?.fbclid ||
        touch?.ttclid ||
        touch?.liFatId
    )
}

function getCurrentPathname() {
    if (typeof window === 'undefined') return '/'
    return window.location.pathname || '/'
}

function getCurrentRouteContext() {
    return resolveTrackingRouteContext(getCurrentPathname())
}

function getCurrentConsentState(): StoredConsentState | null {
    if (typeof document === 'undefined') return null
    return parseConsentCookieFromDocumentCookie(document.cookie)
}

function toConsentSnapshot(state: StoredConsentState | null | undefined): AnalyticsConsentSnapshot | null {
    if (!state) return null

    return {
        necessary: true,
        analytics: state.analytics,
        marketing: state.marketing,
        version: state.version,
        source: state.source,
    }
}

function buildTrackedProperties(
    eventName: AnalyticsEventName,
    routeContext: TrackingRouteContext,
    eventId: string,
    properties?: Record<string, unknown>
) {
    return sanitizeTrackingProperties({
        ...(properties ?? {}),
        event_id: eventId,
        internal_event_name: eventName,
        canonical_event_name: getCanonicalTrackingEventName(eventName),
        tracking_zone: routeContext.zone,
        page_type: routeContext.pageType,
        content_type: routeContext.contentType,
        path: routeContext.pathname,
    })
}

function shouldPushToDataLayer(eventName: AnalyticsEventName, routeContext: TrackingRouteContext) {
    if (!getBrowserMeasurementConsent()) {
        return false
    }

    return getAllowedTrackingDestinations(eventName, routeContext).some((destination) => destination !== 'first_party_analytics')
}

export function getBrowserAnalyticsConsent(): boolean {
    return hasAnalyticsConsent(getCurrentConsentState())
}

export function getBrowserMeasurementConsent(): boolean {
    return hasMeasurementConsent(getCurrentConsentState())
}

export function getBrowserConsentSnapshot(): AnalyticsConsentSnapshot | null {
    return toConsentSnapshot(getCurrentConsentState())
}

export function ensureAnalyticsIds() {
    if (typeof window === 'undefined' || !getBrowserMeasurementConsent()) return null

    const visitorId = getStoredValue(ANALYTICS_VISITOR_KEY) ?? crypto.randomUUID()
    const sessionId = getStoredValue(ANALYTICS_SESSION_KEY) ?? crypto.randomUUID()

    setStoredValue(ANALYTICS_VISITOR_KEY, visitorId)
    setStoredValue(ANALYTICS_SESSION_KEY, sessionId)

    return { visitorId, sessionId }
}

export function buildBrowserTouch(overrides?: Partial<AttributionTouch> | null): AttributionTouch | null {
    if (typeof window === 'undefined') return null

    const url = new URL(window.location.href)
    const storedTouch = getStoredTouch()
    const source = overrides?.source ?? url.searchParams.get('utm_source') ?? storedTouch?.source ?? null
    const medium = overrides?.medium ?? url.searchParams.get('utm_medium') ?? storedTouch?.medium ?? null
    const campaign = overrides?.campaign ?? url.searchParams.get('utm_campaign') ?? storedTouch?.campaign ?? null
    const ref = overrides?.ref ?? url.searchParams.get('ref') ?? storedTouch?.ref ?? null
    const gclid = overrides?.gclid ?? url.searchParams.get('gclid') ?? storedTouch?.gclid ?? null
    const fbclid = overrides?.fbclid ?? url.searchParams.get('fbclid') ?? storedTouch?.fbclid ?? null
    const ttclid = overrides?.ttclid ?? url.searchParams.get('ttclid') ?? storedTouch?.ttclid ?? null
    const liFatId = overrides?.liFatId ?? url.searchParams.get('li_fat_id') ?? storedTouch?.liFatId ?? null
    const referrer = overrides?.referrer ?? document.referrer ?? null
    const landingPath = overrides?.landingPath ?? url.pathname
    const targetPlan = overrides?.targetPlan ?? url.searchParams.get('plan') ?? storedTouch?.targetPlan ?? null
    const targetSpecialization =
        overrides?.targetSpecialization ??
        url.searchParams.get('specialization') ??
        storedTouch?.targetSpecialization ??
        null
    const funnel = overrides?.funnel ?? inferFunnelFromPath(url.pathname)

    const touch = normalizeAttributionTouch(
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
            ttclid,
            liFatId,
            referrer,
            landingPath,
            targetPlan,
            targetSpecialization,
            funnel,
            channel: overrides?.channel ?? deriveAnalyticsChannel({
                source,
                medium,
                ref,
                gclid,
                fbclid,
                ttclid,
                liFatId,
                referrer,
                landingPath,
            }),
        },
        { landingPath, funnel }
    )

    if (hasTouchSignal(touch)) {
        setStoredTouch({
            source: touch?.source ?? null,
            medium: touch?.medium ?? null,
            campaign: touch?.campaign ?? null,
            term: touch?.term ?? null,
            content: touch?.content ?? null,
            ref: touch?.ref ?? null,
            gclid: touch?.gclid ?? null,
            fbclid: touch?.fbclid ?? null,
            ttclid: touch?.ttclid ?? null,
            liFatId: touch?.liFatId ?? null,
            channel: touch?.channel ?? undefined,
            targetPlan: touch?.targetPlan ?? null,
            targetSpecialization: touch?.targetSpecialization ?? null,
        })
    }

    return touch
}

export function getClientAnalyticsContext(overrides?: Partial<AttributionTouch> | null): AnalyticsContext | null {
    const ids = ensureAnalyticsIds()
    if (!ids) return null

    return {
        visitorId: ids.visitorId,
        sessionId: ids.sessionId,
        consent: getBrowserConsentSnapshot(),
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

export function pushTrackingContextToDataLayer(routeContext = getCurrentRouteContext()) {
    if (typeof window === 'undefined' || !Array.isArray(window.dataLayer) || !getBrowserMeasurementConsent()) return

    const consentSnapshot = getBrowserConsentSnapshot()
    window.dataLayer.push({
        event: 'tracking_context',
        tracking_zone: routeContext.zone,
        page_type: routeContext.pageType,
        content_type: routeContext.contentType,
        path: routeContext.pathname,
        consent_analytics: Boolean(consentSnapshot?.analytics),
        consent_marketing: Boolean(consentSnapshot?.marketing),
    })
}

export function pushDataLayerEvent(
    eventName: AnalyticsEventName,
    payload: Record<string, unknown> = {},
    routeContext = getCurrentRouteContext()
) {
    if (typeof window === 'undefined' || !Array.isArray(window.dataLayer) || !shouldPushToDataLayer(eventName, routeContext)) {
        return
    }

    window.dataLayer.push({
        event: getCanonicalTrackingEventName(eventName),
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
    const routeContext = getCurrentRouteContext()
    const eventId = crypto.randomUUID()
    const properties = buildTrackedProperties(eventName, routeContext, eventId, input?.properties)

    pushDataLayerEvent(eventName, properties, routeContext)

    if (!getBrowserMeasurementConsent()) {
        return { skipped: true }
    }

    const ids = ensureAnalyticsIds()
    if (!ids?.visitorId || !ids?.sessionId) {
        return { skipped: true }
    }

    const payload: AnalyticsCollectRequest = {
        eventName,
        eventId,
        eventSource: input?.eventSource ?? 'client',
        properties,
        visitorId: ids.visitorId,
        sessionId: ids.sessionId,
        consent: getBrowserConsentSnapshot(),
        touch: buildBrowserTouch(input?.touch),
    }

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

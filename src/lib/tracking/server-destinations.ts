import { getAppUrl } from '@/lib/config/app-url'
import type { AttributionTouch, AnalyticsConsentSnapshot, AnalyticsEventName } from '@/lib/analytics/types'
import { getAllowedTrackingDestinations, getCanonicalTrackingEventName } from './catalog'
import { resolveTrackingRouteContext } from './policy'
import { sanitizeTrackingProperties } from './sanitize'

interface DispatchExternalTrackingEventInput {
    eventName: AnalyticsEventName
    eventId: string
    occurredAt: string
    visitorId?: string | null
    sessionId?: string | null
    userId?: string | null
    consent?: AnalyticsConsentSnapshot | null
    touch?: AttributionTouch | null
    properties?: Record<string, unknown>
}

function isEnabled(value: string | undefined | null) {
    return value?.trim().toLowerCase() === 'true'
}

function asString(value: unknown) {
    if (typeof value !== 'string') return null
    const next = value.trim()
    return next.length > 0 ? next : null
}

function asNumber(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
    }
    return null
}

function buildEventSourceUrl(pathname: string | null | undefined) {
    const baseUrl = getAppUrl()

    try {
        return new URL(pathname || '/', baseUrl).toString()
    } catch {
        return baseUrl
    }
}

function normalizeItems(properties: Record<string, unknown>) {
    const rawItems = properties.items
    if (!Array.isArray(rawItems)) return undefined

    const items = rawItems
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
        .map((item) => sanitizeTrackingProperties(item))
        .filter((item) => Object.keys(item).length > 0)

    return items.length > 0 ? items : undefined
}

function buildGa4Params(input: {
    eventId: string
    canonicalName: string
    routePath: string
    pageType: string
    contentType: string
    properties: Record<string, unknown>
}) {
    const value = asNumber(input.properties.value ?? input.properties.amount)
    const currency = asString(input.properties.currency) ?? (input.canonicalName === 'purchase' ? 'MXN' : null)
    const transactionId =
        asString(input.properties.transaction_id)
        ?? asString(input.properties.referenceId)
        ?? asString(input.properties.purchase_id)
        ?? input.eventId

    const params: Record<string, unknown> = {
        event_id: input.eventId,
        page_location: buildEventSourceUrl(input.routePath),
        page_type: input.pageType,
        content_type: input.contentType,
    }

    if (value !== null) params.value = value
    if (currency) params.currency = currency
    if (input.canonicalName === 'purchase') params.transaction_id = transactionId

    const items = normalizeItems(input.properties)
    if (items) {
        params.items = items
    }

    return params
}

function buildMetaPayload(input: {
    eventId: string
    canonicalName: string
    occurredAt: string
    routePath: string
    pageType: string
    contentType: string
    properties: Record<string, unknown>
}) {
    const value = asNumber(input.properties.value ?? input.properties.amount)
    const currency = asString(input.properties.currency) ?? 'MXN'
    const referenceId =
        asString(input.properties.referenceId)
        ?? asString(input.properties.eventId)
        ?? asString(input.properties.formationId)
        ?? asString(input.properties.specializationCode)
        ?? input.eventId

    return {
        event_name: input.canonicalName === 'purchase' ? 'Purchase' : 'Lead',
        event_time: Math.floor(new Date(input.occurredAt).getTime() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        event_source_url: buildEventSourceUrl(input.routePath),
        custom_data: {
            currency,
            value: value ?? 0,
            content_name: asString(input.properties.title) ?? null,
            content_category: input.contentType,
            content_ids: [referenceId],
            page_type: input.pageType,
        },
    }
}

function buildTikTokPayload(input: {
    eventId: string
    canonicalName: string
    occurredAt: string
    routePath: string
    pageType: string
    contentType: string
    properties: Record<string, unknown>
    pixelId: string
}) {
    const value = asNumber(input.properties.value ?? input.properties.amount)
    const currency = asString(input.properties.currency) ?? 'MXN'
    const referenceId =
        asString(input.properties.referenceId)
        ?? asString(input.properties.eventId)
        ?? asString(input.properties.formationId)
        ?? asString(input.properties.specializationCode)
        ?? input.eventId

    return {
        event_source: 'web',
        event_source_id: input.pixelId,
        data: [
            {
                event: input.canonicalName === 'purchase' ? 'CompletePayment' : 'SubmitForm',
                event_time: Math.floor(new Date(input.occurredAt).getTime() / 1000),
                event_id: input.eventId,
                context: {
                    page: {
                        url: buildEventSourceUrl(input.routePath),
                    },
                },
                properties: {
                    value: value ?? 0,
                    currency,
                    content_type: input.contentType,
                    content_id: referenceId,
                    page_type: input.pageType,
                },
            },
        ],
    }
}

async function sendGa4MeasurementProtocolEvent(input: {
    eventId: string
    canonicalName: string
    occurredAt: string
    visitorId?: string | null
    userId?: string | null
    routePath: string
    pageType: string
    contentType: string
    properties: Record<string, unknown>
    consent?: AnalyticsConsentSnapshot | null
}) {
    const measurementId = process.env.GA4_MEASUREMENT_ID?.trim()
    const apiSecret = process.env.GA4_API_SECRET?.trim()

    if (!measurementId || !apiSecret || !input.consent?.analytics) {
        return
    }

    const body = {
        client_id: input.visitorId ?? input.eventId,
        user_id: input.userId ?? undefined,
        non_personalized_ads: !input.consent.marketing,
        timestamp_micros: `${new Date(input.occurredAt).getTime() * 1000}`,
        events: [
            {
                name: input.canonicalName,
                params: buildGa4Params(input),
            },
        ],
    }

    const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }
    )

    if (!response.ok) {
        throw new Error(`GA4 Measurement Protocol error: ${response.status}`)
    }
}

async function sendMetaConversionsApiEvent(input: {
    eventId: string
    canonicalName: string
    occurredAt: string
    routePath: string
    pageType: string
    contentType: string
    properties: Record<string, unknown>
    consent?: AnalyticsConsentSnapshot | null
}) {
    const pixelId = process.env.META_PIXEL_ID?.trim()
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim()
    const allowMeta = isEnabled(process.env.ENABLE_META_SERVER_TRACKING ?? process.env.NEXT_PUBLIC_ENABLE_META_TRACKING)

    if (!allowMeta || !pixelId || !accessToken || !input.consent?.marketing) {
        return
    }

    const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(pixelId)}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: [buildMetaPayload(input)],
            test_event_code: process.env.META_TEST_EVENT_CODE?.trim() || undefined,
            access_token: accessToken,
        }),
    })

    if (!response.ok) {
        throw new Error(`Meta Conversions API error: ${response.status}`)
    }
}

async function sendTikTokEventsApiEvent(input: {
    eventId: string
    canonicalName: string
    occurredAt: string
    routePath: string
    pageType: string
    contentType: string
    properties: Record<string, unknown>
    consent?: AnalyticsConsentSnapshot | null
}) {
    const pixelId = process.env.TIKTOK_PIXEL_ID?.trim()
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN?.trim()
    const allowTikTok = isEnabled(process.env.ENABLE_TIKTOK_SERVER_TRACKING ?? process.env.NEXT_PUBLIC_ENABLE_TIKTOK_TRACKING)

    if (!allowTikTok || !pixelId || !accessToken || !input.consent?.marketing) {
        return
    }

    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Token': accessToken,
        },
        body: JSON.stringify({
            ...buildTikTokPayload({ ...input, pixelId }),
            test_event_code: process.env.TIKTOK_TEST_EVENT_CODE?.trim() || undefined,
        }),
    })

    if (!response.ok) {
        throw new Error(`TikTok Events API error: ${response.status}`)
    }
}

export async function dispatchExternalTrackingEvent(input: DispatchExternalTrackingEventInput) {
    const canonicalName = getCanonicalTrackingEventName(input.eventName)
    if (canonicalName !== 'generate_lead' && canonicalName !== 'purchase') {
        return
    }

    const routePath = input.touch?.landingPath ?? '/'
    const routeContext = resolveTrackingRouteContext(routePath)
    const allowedDestinations = getAllowedTrackingDestinations(input.eventName, routeContext)
    const properties = sanitizeTrackingProperties(input.properties)

    const tasks: Array<Promise<void>> = []

    if (allowedDestinations.includes('ga4')) {
        tasks.push(sendGa4MeasurementProtocolEvent({
            eventId: input.eventId,
            canonicalName,
            occurredAt: input.occurredAt,
            visitorId: input.visitorId,
            userId: input.userId,
            routePath: routeContext.pathname,
            pageType: routeContext.pageType,
            contentType: routeContext.contentType,
            properties,
            consent: input.consent,
        }))
    }

    if (allowedDestinations.includes('meta_capi')) {
        tasks.push(sendMetaConversionsApiEvent({
            eventId: input.eventId,
            canonicalName,
            occurredAt: input.occurredAt,
            routePath: routeContext.pathname,
            pageType: routeContext.pageType,
            contentType: routeContext.contentType,
            properties,
            consent: input.consent,
        }))
    }

    if (allowedDestinations.includes('tiktok_events_api')) {
        tasks.push(sendTikTokEventsApiEvent({
            eventId: input.eventId,
            canonicalName,
            occurredAt: input.occurredAt,
            routePath: routeContext.pathname,
            pageType: routeContext.pageType,
            contentType: routeContext.contentType,
            properties,
            consent: input.consent,
        }))
    }

    const results = await Promise.allSettled(tasks)
    for (const result of results) {
        if (result.status === 'rejected') {
            console.error('[Tracking] External destination dispatch failed:', result.reason)
        }
    }
}

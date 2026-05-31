import { after, NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hasMeasurementConsent, parseConsentCookieFromCookieHeader } from '@/lib/consent'
import { ingestAnalyticsEvent } from '@/lib/analytics/server'
import { RequestTimeoutError, withTimeout } from '@/lib/http/timeout-fetch'
import type { AnalyticsCollectRequest } from '@/lib/analytics/types'

export const maxDuration = 10
const ANALYTICS_INGESTION_TIMEOUT_MS = 6_000

const AnalyticsEventNameSchema = z.enum([
    'page_view',
    'view_content',
    'click_whatsapp',
    'click_phone',
    'form_start',
    'form_submit',
    'generate_lead',
    'resource_downloaded',
    'organic_lead_updated',
    'book_appointment',
    'begin_checkout',
    'purchase',
    'sign_up',
    'cta_clicked',
    'registration_started',
    'registration_completed',
    'registration_verified',
    'waitlist_joined',
    'invite_applied',
    'invite_activated',
    'checkout_started',
    'payment_completed',
    'payment_failed',
    'payment_refunded',
    'subscription_created',
    'subscription_renewed',
    'subscription_cancelled',
    'subscription_past_due',
    'event_registered',
    'event_purchased',
    'formation_purchased',
    'ai_credits_purchased',
    'marketing_service_updated',
    'marketing_brief_updated',
    'marketing_services_initialized',
    'growth_campaign_created',
    'growth_campaign_updated',
    'growth_campaign_toggled',
    'growth_campaign_deleted',
    'manual_deal_created',
    'marketing_cost_recorded',
])

const AnalyticsCollectSchema = z.object({
    eventName: AnalyticsEventNameSchema,
    eventId: z.string().uuid().optional().nullable(),
    eventSource: z.enum(['client', 'server', 'webhook']).optional(),
    visitorId: z.string().uuid().optional().nullable(),
    sessionId: z.string().uuid().optional().nullable(),
    consent: z.object({
        necessary: z.literal(true),
        analytics: z.boolean(),
        marketing: z.boolean(),
        version: z.string().optional(),
        source: z.string().optional(),
    }).optional().nullable(),
    properties: z.record(z.string(), z.unknown()).optional(),
    touch: z.record(z.string(), z.unknown()).optional().nullable(),
})

function enqueueAnalyticsIngestion(payload: AnalyticsCollectRequest) {
    after(async () => {
        try {
            await withTimeout(
                ingestAnalyticsEvent(payload),
                ANALYTICS_INGESTION_TIMEOUT_MS,
                'Analytics background ingestion'
            )
        } catch (error) {
            if (error instanceof RequestTimeoutError) {
                console.warn('[Analytics] background ingestion timed out:', error.message)
                return
            }

            console.error('[Analytics] background ingestion failed:', error)
        }
    })
}

export async function POST(request: NextRequest) {
    try {
        const consent = parseConsentCookieFromCookieHeader(request.headers.get('cookie'))
        if (!hasMeasurementConsent(consent)) {
            return NextResponse.json({ skipped: true }, { status: 200 })
        }

        let requestBody: unknown
        try {
            requestBody = await request.json()
        } catch {
            return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
        }

        const parsedPayload = AnalyticsCollectSchema.safeParse(requestBody)
        if (!parsedPayload.success) {
            return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
        }

        const payload = parsedPayload.data as AnalyticsCollectRequest
        payload.consent = consent
        enqueueAnalyticsIngestion(payload)

        return NextResponse.json({
            accepted: true,
            visitorId: payload.visitorId,
            sessionId: payload.sessionId,
        }, { status: 202 })
    } catch (error) {
        console.error('[Analytics] collect error:', error)
        return NextResponse.json({ error: 'collect_failed' }, { status: 500 })
    }
}

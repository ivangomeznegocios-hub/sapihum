import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hasMeasurementConsent, parseConsentCookieFromCookieHeader } from '@/lib/consent'
import { ingestAnalyticsEvent } from '@/lib/analytics/server'
import type { AnalyticsCollectRequest } from '@/lib/analytics/types'

const AnalyticsEventNameSchema = z.enum([
    'page_view',
    'view_content',
    'click_whatsapp',
    'click_phone',
    'form_start',
    'form_submit',
    'generate_lead',
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

export async function POST(request: NextRequest) {
    try {
        const consent = parseConsentCookieFromCookieHeader(request.headers.get('cookie'))
        if (!hasMeasurementConsent(consent)) {
            return NextResponse.json({ skipped: true }, { status: 200 })
        }

        const parsedPayload = AnalyticsCollectSchema.safeParse(await request.json())
        if (!parsedPayload.success) {
            return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
        }

        const payload = parsedPayload.data as AnalyticsCollectRequest
        payload.consent = consent
        const result = await ingestAnalyticsEvent(payload)
        return NextResponse.json(result)
    } catch (error) {
        console.error('[Analytics] collect error:', error)
        return NextResponse.json({ error: 'collect_failed' }, { status: 500 })
    }
}

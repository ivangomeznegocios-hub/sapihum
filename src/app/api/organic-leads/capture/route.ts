import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recordAnalyticsServerEventBestEffort } from '@/lib/analytics/server'
import { sendAdminOperationalAlertBestEffort } from '@/lib/admin/alerts'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { captureOrganicLead } from '@/lib/organic-leads/capture'
import { getOrganicContentByAssetKey } from '@/lib/organic-leads/routing'
import {
    ORGANIC_LEAD_INTENTS,
    ORGANIC_SOURCE_TYPES,
} from '@/lib/organic-leads/taxonomy'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { OrganicLeadActionType, OrganicLeadCapturePayload } from '@/lib/organic-leads/types'

export const maxDuration = 15

const ActionTypeSchema = z.enum([
    'guide_view',
    'resource_download',
    'event_registration',
    'formation_interest',
    'commercial_cta',
    'checkout_or_purchase_intent',
])

const OrganicLeadCaptureSchema = z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(254),
    whatsapp: z.string().trim().max(40).optional().nullable().or(z.literal('')),
    country: z.string().trim().max(80).optional().nullable().or(z.literal('')),
    city: z.string().trim().max(120).optional().nullable().or(z.literal('')),
    role: z.string().trim().max(80).optional().nullable().or(z.literal('')),
    specialty: z.string().trim().max(120).optional().nullable().or(z.literal('')),
    yearsExperience: z.number().int().min(0).max(80).optional().nullable(),
    interestTags: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    professionalGoal: z.string().trim().max(240).optional().nullable().or(z.literal('')),
    intent: z.enum(ORGANIC_LEAD_INTENTS).default('learn'),
    sourcePage: z.string().trim().min(1).max(300),
    sourceTopic: z.string().trim().max(160).optional().nullable().or(z.literal('')),
    sourceAsset: z.string().trim().max(160).optional().nullable().or(z.literal('')),
    sourceType: z.enum(ORGANIC_SOURCE_TYPES).default('resource'),
    actionType: ActionTypeSchema.default('guide_view'),
    utms: z.record(z.string(), z.string().nullable().optional()).optional().nullable(),
    referrer: z.string().trim().max(600).optional().nullable().or(z.literal('')),
    analyticsContext: z.any().optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

function pickRequestUtms(request: NextRequest) {
    const utms: Record<string, string> = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
        const value = request.nextUrl.searchParams.get(key)
        if (value) utms[key] = value
    }
    return utms
}

function getDownloadUrl(sourceAsset: string | null | undefined) {
    if (!sourceAsset) return undefined
    return getOrganicContentByAssetKey(sourceAsset)?.gatedResource?.downloadUrl
}

function buildLeadEventProperties(data: OrganicLeadCapturePayload, leadId: string, created: boolean) {
    return {
        leadId,
        created,
        sourcePage: data.sourcePage,
        sourceTopic: data.sourceTopic ?? null,
        sourceAsset: data.sourceAsset ?? null,
        sourceType: data.sourceType,
        intent: data.intent,
        actionType: data.actionType,
        specialty: data.specialty ?? null,
        interestTags: data.interestTags ?? [],
    }
}

export async function POST(request: NextRequest) {
    const rlMinute = await checkRateLimit(request, { namespace: 'organic-leads:capture:minute', limit: 5, window: '1 m' })
    if (!rlMinute.success) return rateLimitResponse(rlMinute)

    const rlHour = await checkRateLimit(request, { namespace: 'organic-leads:capture:hour', limit: 30, window: '1 h' })
    if (!rlHour.success) return rateLimitResponse(rlHour)

    try {
        let requestBody: unknown
        try {
            requestBody = await request.json()
        } catch {
            return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
        }

        const parsed = OrganicLeadCaptureSchema.safeParse(requestBody)
        if (!parsed.success) {
            return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
        }

        const supabase = await createClient()
        const admin = await createAdminClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        const data = {
            ...parsed.data,
            whatsapp: parsed.data.whatsapp || null,
            country: parsed.data.country || null,
            city: parsed.data.city || null,
            role: parsed.data.role || null,
            specialty: parsed.data.specialty || null,
            professionalGoal: parsed.data.professionalGoal || null,
            sourceTopic: parsed.data.sourceTopic || null,
            sourceAsset: parsed.data.sourceAsset || null,
            referrer: parsed.data.referrer || request.headers.get('referer') || null,
            utms: {
                ...pickRequestUtms(request),
                ...(parsed.data.utms ?? {}),
            },
            actionType: parsed.data.actionType as OrganicLeadActionType,
        } satisfies OrganicLeadCapturePayload

        const result = await captureOrganicLead({
            admin,
            payload: data,
            userId: user?.id ?? null,
        })
        const downloadUrl = getDownloadUrl(data.sourceAsset)
        const eventProperties = buildLeadEventProperties(data, result.leadId, result.created)

        recordAnalyticsServerEventBestEffort({
            eventName: result.created ? 'generate_lead' : 'organic_lead_updated',
            eventSource: 'server',
            visitorId: data.analyticsContext?.visitorId ?? null,
            sessionId: data.analyticsContext?.sessionId ?? null,
            userId: user?.id ?? null,
            consent: data.analyticsContext?.consent ?? null,
            touch: data.analyticsContext?.touch ?? {
                funnel: 'landing',
                landingPath: data.sourcePage,
            },
            properties: eventProperties,
        })

        if (downloadUrl) {
            recordAnalyticsServerEventBestEffort({
                eventName: 'resource_downloaded',
                eventSource: 'server',
                visitorId: data.analyticsContext?.visitorId ?? null,
                sessionId: data.analyticsContext?.sessionId ?? null,
                userId: user?.id ?? null,
                consent: data.analyticsContext?.consent ?? null,
                touch: data.analyticsContext?.touch ?? {
                    funnel: 'landing',
                    landingPath: data.sourcePage,
                },
                properties: {
                    ...eventProperties,
                    downloadUrl,
                },
            })
        }

        sendAdminOperationalAlertBestEffort({
            level: 'info',
            subject: result.created ? 'Nuevo lead organico SAPIHUM' : 'Lead organico actualizado SAPIHUM',
            title: result.created ? 'Nuevo lead organico' : 'Lead organico enriquecido',
            summary: `${data.name} dejo sus datos desde ${data.sourcePage}.`,
            actionPath: `/dashboard/admin/operations?q=${encodeURIComponent(data.email.trim().toLowerCase())}`,
            entityType: 'organic_lead',
            entityId: result.leadId,
            targetEmail: data.email,
            targetUserId: user?.id ?? null,
            details: {
                sourcePage: data.sourcePage,
                sourceTopic: data.sourceTopic,
                sourceAsset: data.sourceAsset,
                sourceType: data.sourceType,
                intent: data.intent,
                actionType: data.actionType,
                lifecycleStage: result.lifecycleStage,
                scoreAction: data.actionType,
            },
        })

        return NextResponse.json({
            success: true,
            leadId: result.leadId,
            lifecycleStage: result.lifecycleStage,
            nextStepUrl: result.nextStepUrl,
            ...(downloadUrl ? { downloadUrl } : {}),
        })
    } catch (error) {
        console.error('[OrganicLeads] capture failed:', error)
        return NextResponse.json({ error: 'capture_failed' }, { status: 500 })
    }
}

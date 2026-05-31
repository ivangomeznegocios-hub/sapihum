import { resolveAttributionSnapshot } from '@/lib/analytics/server'
import { calculateLeadScoreDelta } from './scoring'
import { getOrganicNextStepUrl } from './routing'
import type { OrganicLeadCapturePayload, OrganicLeadUpsertInput, OrganicLifecycleStage } from './types'

function cleanText(value: string | null | undefined) {
    const normalized = value?.trim().replace(/\s+/g, ' ') ?? ''
    return normalized.length > 0 ? normalized : null
}

export function normalizeOrganicLeadEmail(value: string) {
    return value.trim().toLowerCase()
}

export function normalizeOrganicLeadPhone(value: string | null | undefined) {
    const cleaned = cleanText(value)
    if (!cleaned) return null
    return cleaned.replace(/[^\d+]/g, '').slice(0, 40) || null
}

export function normalizeOrganicLeadTags(values: Array<string | null | undefined> | null | undefined) {
    const seen = new Set<string>()
    const output: string[] = []

    for (const value of values ?? []) {
        const normalized = value?.trim().toLowerCase().replace(/\s+/g, '_') ?? ''
        if (!normalized || seen.has(normalized)) continue
        seen.add(normalized)
        output.push(normalized)
    }

    return output
}

export function mergeOrganicLeadTags(existing: string[] | null | undefined, next: string[] | null | undefined) {
    return normalizeOrganicLeadTags([...(existing ?? []), ...(next ?? [])])
}

export function mergeOrganicLeadMetadata(
    existing: Record<string, unknown> | null | undefined,
    next: Record<string, unknown> | null | undefined
) {
    return {
        ...(existing ?? {}),
        ...(next ?? {}),
    }
}

function normalizeUtms(payload: OrganicLeadCapturePayload) {
    const entries = Object.entries(payload.utms ?? {})
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : ''] as const)
        .filter(([, value]) => value.length > 0)

    return Object.fromEntries(entries)
}

export async function buildOrganicAttributionSnapshot(payload: OrganicLeadCapturePayload) {
    return resolveAttributionSnapshot(payload.analyticsContext ?? undefined)
}

export function prepareOrganicLeadInsert(input: OrganicLeadUpsertInput) {
    const { payload, userId, attributionSnapshot } = input
    const now = new Date().toISOString()
    const normalizedEmail = normalizeOrganicLeadEmail(payload.email)
    const scoreDelta = calculateLeadScoreDelta(payload.actionType)
    const interestTags = normalizeOrganicLeadTags(payload.interestTags)
    const metadata = mergeOrganicLeadMetadata(payload.metadata ?? {}, {
        professional_goal: cleanText(payload.professionalGoal),
        action_type: payload.actionType,
        analytics: payload.analyticsContext ?? null,
    })

    return {
        user_id: userId ?? null,
        email: normalizedEmail,
        name: cleanText(payload.name) ?? normalizedEmail,
        whatsapp: normalizeOrganicLeadPhone(payload.whatsapp),
        country: cleanText(payload.country),
        city: cleanText(payload.city),
        role: cleanText(payload.role),
        specialty: cleanText(payload.specialty),
        years_experience: payload.yearsExperience ?? null,
        interest_tags: interestTags,
        intent: payload.intent,
        source_page: payload.sourcePage,
        source_topic: cleanText(payload.sourceTopic),
        source_asset: cleanText(payload.sourceAsset),
        source_type: payload.sourceType,
        utms: normalizeUtms(payload),
        referrer: cleanText(payload.referrer),
        score: scoreDelta,
        lifecycle_stage: scoreDelta >= 8 ? 'qualified' : 'captured',
        attribution_snapshot: attributionSnapshot,
        metadata,
        first_engagement_at: now,
        last_engagement_at: now,
    }
}

export function prepareOrganicLeadUpdate(params: {
    existingLead: Record<string, any>
    input: OrganicLeadUpsertInput
}) {
    const { existingLead, input } = params
    const { payload, userId, attributionSnapshot } = input
    const scoreDelta = calculateLeadScoreDelta(payload.actionType)
    const currentScore = Number(existingLead.score ?? 0)
    const nextScore = currentScore + scoreDelta
    const nextStage =
        existingLead.lifecycle_stage === 'converted' || existingLead.lifecycle_stage === 'discarded'
            ? existingLead.lifecycle_stage
            : nextScore >= 15
                ? 'opportunity'
                : nextScore >= 8
                    ? 'qualified'
                    : 'engaged'

    const nextMetadata = mergeOrganicLeadMetadata(existingLead.metadata ?? {}, {
        ...(payload.metadata ?? {}),
        professional_goal: cleanText(payload.professionalGoal),
        last_action_type: payload.actionType,
        last_analytics: payload.analyticsContext ?? null,
    })

    return {
        user_id: existingLead.user_id ?? userId ?? null,
        name: cleanText(payload.name) ?? existingLead.name,
        whatsapp: normalizeOrganicLeadPhone(payload.whatsapp) ?? existingLead.whatsapp ?? null,
        country: cleanText(payload.country) ?? existingLead.country ?? null,
        city: cleanText(payload.city) ?? existingLead.city ?? null,
        role: cleanText(payload.role) ?? existingLead.role ?? null,
        specialty: cleanText(payload.specialty) ?? existingLead.specialty ?? null,
        years_experience: payload.yearsExperience ?? existingLead.years_experience ?? null,
        interest_tags: mergeOrganicLeadTags(existingLead.interest_tags, payload.interestTags),
        intent: payload.intent ?? existingLead.intent,
        source_page: payload.sourcePage || existingLead.source_page,
        source_topic: cleanText(payload.sourceTopic) ?? existingLead.source_topic ?? null,
        source_asset: cleanText(payload.sourceAsset) ?? existingLead.source_asset ?? null,
        source_type: payload.sourceType || existingLead.source_type,
        utms: mergeOrganicLeadMetadata(existingLead.utms ?? {}, normalizeUtms(payload)),
        referrer: cleanText(payload.referrer) ?? existingLead.referrer ?? null,
        score: nextScore,
        lifecycle_stage: nextStage,
        attribution_snapshot: attributionSnapshot,
        metadata: nextMetadata,
        last_engagement_at: new Date().toISOString(),
    }
}

export async function captureOrganicLead(params: {
    admin: any
    payload: OrganicLeadCapturePayload
    userId?: string | null
}) {
    const normalizedEmail = normalizeOrganicLeadEmail(params.payload.email)
    const attributionSnapshot = await buildOrganicAttributionSnapshot(params.payload)
    const input = {
        payload: {
            ...params.payload,
            email: normalizedEmail,
        },
        userId: params.userId ?? null,
        attributionSnapshot,
    }

    const { data: existingLead, error: lookupError } = await params.admin
        .from('organic_leads')
        .select('*')
        .eq('email_key', normalizedEmail)
        .maybeSingle()

    if (lookupError) {
        throw lookupError
    }

    if (existingLead) {
        const updatePayload = prepareOrganicLeadUpdate({ existingLead, input })
        const { data, error } = await params.admin
            .from('organic_leads')
            .update(updatePayload)
            .eq('id', existingLead.id)
            .select('id, lifecycle_stage')
            .single()

        if (error) throw error

        return {
            leadId: data.id as string,
            lifecycleStage: data.lifecycle_stage as OrganicLifecycleStage,
            nextStepUrl: getOrganicNextStepUrl(params.payload),
            created: false,
            attributionSnapshot,
        }
    }

    const insertPayload = prepareOrganicLeadInsert(input)
    const { data, error } = await params.admin
        .from('organic_leads')
        .insert(insertPayload)
        .select('id, lifecycle_stage')
        .single()

    if (error) throw error

    return {
        leadId: data.id as string,
        lifecycleStage: data.lifecycle_stage as OrganicLifecycleStage,
        nextStepUrl: getOrganicNextStepUrl(params.payload),
        created: true,
        attributionSnapshot,
    }
}

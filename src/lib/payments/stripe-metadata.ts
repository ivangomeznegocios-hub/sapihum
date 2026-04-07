import type { AttributionSnapshot, AttributionTouch } from '@/lib/analytics/types'

export const STRIPE_METADATA_VALUE_MAX_LENGTH = 500

function trimString(value: string | null | undefined, maxLength: number) {
    if (!value) return null
    return value.length > maxLength ? value.slice(0, maxLength) : value
}

function compactTouch(
    touch: AttributionTouch | null | undefined,
    stringLimit: number
): Partial<AttributionTouch> | null {
    if (!touch) return null

    return {
        occurredAt: trimString(touch.occurredAt, 40) ?? new Date().toISOString(),
        source: trimString(touch.source, stringLimit),
        medium: trimString(touch.medium, stringLimit),
        campaign: trimString(touch.campaign, stringLimit),
        landingPath: trimString(touch.landingPath, stringLimit),
        targetPlan: trimString(touch.targetPlan, stringLimit),
        targetSpecialization: trimString(touch.targetSpecialization, stringLimit),
        funnel: touch.funnel ?? null,
        channel: touch.channel,
        isDirect: touch.isDirect,
        eventName: touch.eventName ?? null,
    }
}

function serializeSnapshot(snapshot: {
    firstTouch: Partial<AttributionTouch> | null
    lastTouch: Partial<AttributionTouch> | null
    lastNonDirectTouch: Partial<AttributionTouch> | null
    resolvedAt: string
}) {
    return JSON.stringify(snapshot)
}

export function compactAttributionSnapshotForStripe(
    snapshot: AttributionSnapshot | null | undefined,
    maxLength = STRIPE_METADATA_VALUE_MAX_LENGTH
) {
    const resolvedAt = trimString(snapshot?.resolvedAt, 40) ?? new Date().toISOString()

    const candidates = [
        serializeSnapshot({
            firstTouch: compactTouch(snapshot?.firstTouch, 64),
            lastTouch: compactTouch(snapshot?.lastTouch, 64),
            lastNonDirectTouch: compactTouch(snapshot?.lastNonDirectTouch, 64),
            resolvedAt,
        }),
        serializeSnapshot({
            firstTouch: null,
            lastTouch: compactTouch(snapshot?.lastTouch, 56),
            lastNonDirectTouch: compactTouch(snapshot?.lastNonDirectTouch, 56),
            resolvedAt,
        }),
        serializeSnapshot({
            firstTouch: null,
            lastTouch: null,
            lastNonDirectTouch: compactTouch(
                snapshot?.lastNonDirectTouch ?? snapshot?.lastTouch ?? snapshot?.firstTouch,
                48
            ),
            resolvedAt,
        }),
        serializeSnapshot({
            firstTouch: null,
            lastTouch: null,
            lastNonDirectTouch: compactTouch(
                snapshot?.lastNonDirectTouch ?? snapshot?.lastTouch ?? snapshot?.firstTouch,
                32
            ),
            resolvedAt,
        }),
        serializeSnapshot({
            firstTouch: null,
            lastTouch: null,
            lastNonDirectTouch: null,
            resolvedAt,
        }),
    ]

    return candidates.find((candidate) => candidate.length <= maxLength) ?? candidates[candidates.length - 1]
}

function compactAttributionSnapshotString(value: string, maxLength: number) {
    if (value.length <= maxLength) {
        return value
    }

    try {
        return compactAttributionSnapshotForStripe(JSON.parse(value) as AttributionSnapshot, maxLength)
    } catch {
        return value.slice(0, maxLength)
    }
}

export function sanitizeStripeMetadata(
    metadata: Record<string, string> | undefined,
    maxLength = STRIPE_METADATA_VALUE_MAX_LENGTH
) {
    if (!metadata) {
        return {}
    }

    const sanitized: Record<string, string> = {}

    for (const [key, rawValue] of Object.entries(metadata)) {
        const value = typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')
        const normalizedValue = key === 'attribution_snapshot'
            ? compactAttributionSnapshotString(value, maxLength)
            : value.slice(0, maxLength)

        sanitized[key] = normalizedValue
    }

    return sanitized
}

import type {
    AnalyticsChannel,
    AnalyticsEventName,
    AnalyticsFunnel,
    AttributionModel,
    AttributionSnapshot,
    AttributionTouch,
} from './types'

function clean(value: string | null | undefined): string | null {
    if (!value) return null
    const next = value.trim()
    return next.length > 0 ? next : null
}

function lower(value: string | null | undefined): string | null {
    const next = clean(value)
    return next ? next.toLowerCase() : null
}

function isSearchEngine(referrerHost: string | null): boolean {
    if (!referrerHost) return false
    return ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'search.'].some((token) => referrerHost.includes(token))
}

function isSocialHost(referrerHost: string | null): boolean {
    if (!referrerHost) return false
    return ['facebook.', 'instagram.', 'linkedin.', 'twitter.', 'x.com', 'tiktok.', 'youtube.', 'whatsapp.'].some(
        (token) => referrerHost.includes(token)
    )
}

function getHost(urlValue: string | null | undefined): string | null {
    if (!urlValue) return null
    try {
        return new URL(urlValue).host.toLowerCase()
    } catch {
        return null
    }
}

export function deriveAnalyticsChannel(input: {
    source?: string | null
    medium?: string | null
    ref?: string | null
    gclid?: string | null
    fbclid?: string | null
    referrer?: string | null
    landingPath?: string | null
}): AnalyticsChannel {
    const source = lower(input.source)
    const medium = lower(input.medium)
    const ref = lower(input.ref)
    const referrerHost = getHost(input.referrer)

    if (ref) return 'invite'
    if (input.gclid || source === 'google' || medium === 'cpc' || medium === 'ppc' || medium === 'paid_search') {
        return 'paid_search'
    }
    if (
        input.fbclid ||
        medium === 'paid_social' ||
        medium === 'social_paid' ||
        (isSocialHost(referrerHost) && medium === 'cpc')
    ) {
        return 'paid_social'
    }
    if (medium === 'email' || source === 'email' || source === 'newsletter') return 'email'
    if (source === 'direct' || medium === 'direct') return 'direct'
    if (medium === 'referral') return 'referral'
    if (medium === 'organic_social' || (isSocialHost(referrerHost) && !input.fbclid)) return 'organic_social'
    if (medium === 'organic' || isSearchEngine(referrerHost)) return 'organic_search'
    if (source || medium) return 'unknown'
    if (referrerHost) return 'referral'
    return 'direct'
}

export function normalizeAttributionTouch(
    touch: Partial<AttributionTouch> | null | undefined,
    defaults?: {
        eventName?: AnalyticsEventName | null
        funnel?: AnalyticsFunnel | null
        occurredAt?: string
        landingPath?: string | null
    }
): AttributionTouch | null {
    const source = clean(touch?.source)
    const medium = clean(touch?.medium)
    const campaign = clean(touch?.campaign)
    const ref = clean(touch?.ref)
    const gclid = clean(touch?.gclid)
    const fbclid = clean(touch?.fbclid)
    const referrer = clean(touch?.referrer)
    const landingPath = clean(touch?.landingPath) ?? defaults?.landingPath ?? null
    const funnel = touch?.funnel ?? defaults?.funnel ?? null
    const channel = touch?.channel ?? deriveAnalyticsChannel({ source, medium, ref, gclid, fbclid, referrer, landingPath })
    const isDirect =
        touch?.isDirect ??
        (channel === 'direct' || (channel === 'internal' && !source && !medium && !campaign && !ref && !gclid && !fbclid))

    const hasSignal = Boolean(source || medium || campaign || ref || gclid || fbclid || referrer || landingPath || funnel)
    if (!hasSignal) return null

    return {
        occurredAt: touch?.occurredAt ?? defaults?.occurredAt ?? new Date().toISOString(),
        source,
        medium,
        campaign,
        term: clean(touch?.term),
        content: clean(touch?.content),
        ref,
        gclid,
        fbclid,
        referrer,
        landingPath,
        targetPlan: clean(touch?.targetPlan),
        targetSpecialization: clean(touch?.targetSpecialization),
        funnel,
        channel,
        isDirect,
        eventName: touch?.eventName ?? defaults?.eventName ?? null,
        metadata: touch?.metadata ?? {},
    }
}

export function hasMeaningfulTouch(touch: AttributionTouch | null | undefined): boolean {
    return Boolean(
        touch &&
        (touch.source ||
            touch.medium ||
            touch.campaign ||
            touch.ref ||
            touch.gclid ||
            touch.fbclid ||
            touch.referrer ||
            touch.landingPath)
    )
}

export function getTouchByModel(
    snapshot: AttributionSnapshot | null | undefined,
    model: AttributionModel
): AttributionTouch | null {
    if (!snapshot) return null
    if (model === 'first_touch') return snapshot.firstTouch
    if (model === 'last_touch') return snapshot.lastTouch
    return snapshot.lastNonDirectTouch ?? snapshot.lastTouch ?? snapshot.firstTouch
}

export function createAttributionSnapshot(input: {
    firstTouch?: AttributionTouch | null
    lastTouch?: AttributionTouch | null
    lastNonDirectTouch?: AttributionTouch | null
}): AttributionSnapshot {
    return {
        firstTouch: input.firstTouch ?? null,
        lastTouch: input.lastTouch ?? null,
        lastNonDirectTouch: input.lastNonDirectTouch ?? null,
        resolvedAt: new Date().toISOString(),
    }
}

export function touchToDbFields(touch: AttributionTouch | null | undefined) {
    if (!touch) {
        return {
            touch_source: null,
            touch_medium: null,
            touch_campaign: null,
            touch_term: null,
            touch_content: null,
            ref: null,
            gclid: null,
            fbclid: null,
            channel: 'direct',
            is_direct: true,
            referrer: null,
            landing_path: null,
            target_plan: null,
            target_specialization: null,
            funnel: null,
            metadata: {},
            event_name: null,
            occurred_at: new Date().toISOString(),
        }
    }

    return {
        touch_source: touch.source,
        touch_medium: touch.medium,
        touch_campaign: touch.campaign,
        touch_term: touch.term ?? null,
        touch_content: touch.content ?? null,
        ref: touch.ref ?? null,
        gclid: touch.gclid ?? null,
        fbclid: touch.fbclid ?? null,
        channel: touch.channel,
        is_direct: touch.isDirect,
        referrer: touch.referrer ?? null,
        landing_path: touch.landingPath ?? null,
        target_plan: touch.targetPlan ?? null,
        target_specialization: touch.targetSpecialization ?? null,
        funnel: touch.funnel ?? null,
        metadata: touch.metadata ?? {},
        event_name: touch.eventName ?? null,
        occurred_at: touch.occurredAt,
    }
}

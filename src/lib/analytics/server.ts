import { createAdminClient, createClient } from '@/lib/supabase/server'
import { createAttributionSnapshot, hasMeaningfulTouch, normalizeAttributionTouch, touchToDbFields } from './attribution'
import type { AnalyticsCollectRequest, AnalyticsContext, AnalyticsEventName, AttributionSnapshot, AttributionTouch } from './types'

function isUuid(value: string | null | undefined): value is string {
    return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

async function getAuthenticatedUserId(): Promise<string | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
}

async function syncVisitorIdentity(admin: any, visitorId: string, userId: string) {
    await Promise.all([
        admin.from('analytics_visitors').update({ user_id: userId }).eq('id', visitorId),
        admin.from('analytics_sessions').update({ user_id: userId }).eq('visitor_id', visitorId).is('user_id', null),
        admin.from('analytics_events').update({ user_id: userId }).eq('visitor_id', visitorId).is('user_id', null),
        admin.from('attribution_touches').update({ user_id: userId }).eq('visitor_id', visitorId).is('user_id', null),
    ])
}

export async function resolveAttributionSnapshot(context?: AnalyticsContext & { userId?: string | null }): Promise<AttributionSnapshot> {
    const admin = await createAdminClient()
    const visitorId = isUuid(context?.visitorId ?? null) ? context?.visitorId ?? null : null

    if (visitorId) {
        const { data: visitor } = await (admin as any)
            .from('analytics_visitors')
            .select('first_touch, last_touch, last_non_direct_touch')
            .eq('id', visitorId)
            .maybeSingle()

        if (visitor) {
            return createAttributionSnapshot({
                firstTouch: visitor.first_touch && Object.keys(visitor.first_touch).length > 0 ? visitor.first_touch : null,
                lastTouch: visitor.last_touch && Object.keys(visitor.last_touch).length > 0 ? visitor.last_touch : null,
                lastNonDirectTouch:
                    visitor.last_non_direct_touch && Object.keys(visitor.last_non_direct_touch).length > 0
                        ? visitor.last_non_direct_touch
                        : null,
            })
        }
    }

    const fallbackTouch = normalizeAttributionTouch(context?.touch, {
        occurredAt: new Date().toISOString(),
    })

    return createAttributionSnapshot({
        firstTouch: fallbackTouch,
        lastTouch: fallbackTouch,
        lastNonDirectTouch: fallbackTouch && !fallbackTouch.isDirect ? fallbackTouch : null,
    })
}

export async function ingestAnalyticsEvent(payload: AnalyticsCollectRequest) {
    const admin = await createAdminClient()
    const now = new Date().toISOString()
    const visitorId = isUuid(payload.visitorId ?? null) ? payload.visitorId! : null
    const sessionId = isUuid(payload.sessionId ?? null) ? payload.sessionId! : null
    const userId = (await getAuthenticatedUserId()) ?? null
    const touch = normalizeAttributionTouch(payload.touch, {
        eventName: payload.eventName,
        occurredAt: now,
    })

    if (!visitorId || !sessionId) {
        return {
            ok: false,
            skipped: true,
            visitorId,
            sessionId,
            attributionSnapshot: createAttributionSnapshot({}),
        }
    }

    const { data: existingVisitor } = await (admin as any)
        .from('analytics_visitors')
        .select('first_touch, last_touch, last_non_direct_touch, consent_state')
        .eq('id', visitorId)
        .maybeSingle()

    const nextFirstTouch =
        existingVisitor?.first_touch && Object.keys(existingVisitor.first_touch).length > 0
            ? existingVisitor.first_touch
            : touch && hasMeaningfulTouch(touch)
                ? touch
                : null

    const nextLastTouch =
        touch && hasMeaningfulTouch(touch)
            ? touch
            : existingVisitor?.last_touch && Object.keys(existingVisitor.last_touch).length > 0
                ? existingVisitor.last_touch
                : null

    const nextLastNonDirectTouch =
        touch && hasMeaningfulTouch(touch) && !touch.isDirect
            ? touch
            : existingVisitor?.last_non_direct_touch && Object.keys(existingVisitor.last_non_direct_touch).length > 0
                ? existingVisitor.last_non_direct_touch
                : null

    await (admin as any)
        .from('analytics_visitors')
        .upsert({
            id: visitorId,
            user_id: userId,
            consent_state: existingVisitor?.consent_state ?? {},
            first_touch: nextFirstTouch ?? {},
            last_touch: nextLastTouch ?? {},
            last_non_direct_touch: nextLastNonDirectTouch ?? {},
            first_seen_at: existingVisitor ? undefined : now,
            last_seen_at: now,
        })

    const attributionSnapshot = createAttributionSnapshot({
        firstTouch: nextFirstTouch,
        lastTouch: nextLastTouch,
        lastNonDirectTouch: nextLastNonDirectTouch,
    })

    await (admin as any)
        .from('analytics_sessions')
        .upsert({
            id: sessionId,
            visitor_id: visitorId,
            user_id: userId,
            landing_path: touch?.landingPath ?? nextLastTouch?.landingPath ?? nextFirstTouch?.landingPath ?? null,
            referrer: touch?.referrer ?? nextFirstTouch?.referrer ?? null,
            attribution_snapshot: attributionSnapshot,
            started_at: now,
            last_seen_at: now,
        })

    if (touch && hasMeaningfulTouch(touch)) {
        await (admin as any)
            .from('attribution_touches')
            .insert({
                visitor_id: visitorId,
                session_id: sessionId,
                user_id: userId,
                ...touchToDbFields(touch),
            })
    }

    await (admin as any)
        .from('analytics_events')
        .insert({
            visitor_id: visitorId,
            session_id: sessionId,
            user_id: userId,
            event_name: payload.eventName,
            event_source: payload.eventSource ?? 'client',
            page_path: touch?.landingPath ?? nextLastTouch?.landingPath ?? null,
            attribution_snapshot: attributionSnapshot,
            properties: payload.properties ?? {},
            occurred_at: now,
        })

    if (userId) {
        await syncVisitorIdentity(admin, visitorId, userId)
    }

    return {
        ok: true,
        visitorId,
        sessionId,
        attributionSnapshot,
    }
}

export async function recordAnalyticsServerEvent(input: {
    eventName: AnalyticsEventName
    eventSource?: 'client' | 'server' | 'webhook'
    visitorId?: string | null
    sessionId?: string | null
    userId?: string | null
    touch?: Partial<AttributionTouch> | null
    properties?: Record<string, unknown>
}) {
    const admin = await createAdminClient()
    const now = new Date().toISOString()
    const visitorId = isUuid(input.visitorId ?? null) ? input.visitorId! : null
    const sessionId = isUuid(input.sessionId ?? null) ? input.sessionId! : null
    const userId = input.userId ?? null
    const normalizedTouch = normalizeAttributionTouch(input.touch, {
        eventName: input.eventName,
        occurredAt: now,
    })

    const snapshot = await resolveAttributionSnapshot({
        visitorId,
        sessionId,
        touch: normalizedTouch,
        userId,
    })

    if (visitorId && sessionId) {
        await (admin as any)
            .from('analytics_sessions')
            .upsert({
                id: sessionId,
                visitor_id: visitorId,
                user_id: userId,
                landing_path: normalizedTouch?.landingPath ?? null,
                referrer: normalizedTouch?.referrer ?? null,
                attribution_snapshot: snapshot,
                started_at: now,
                last_seen_at: now,
            })
    }

    await (admin as any)
        .from('analytics_events')
        .insert({
            visitor_id: visitorId,
            session_id: sessionId,
            user_id: userId,
            event_name: input.eventName,
            event_source: input.eventSource ?? 'server',
            page_path: normalizedTouch?.landingPath ?? null,
            attribution_snapshot: snapshot,
            properties: input.properties ?? {},
            occurred_at: now,
        })

    if (visitorId && userId) {
        await syncVisitorIdentity(admin, visitorId, userId)
    }

    return snapshot
}

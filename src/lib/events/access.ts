import type { Event, EventEntitlementAccessKind, EventEntitlementSourceType } from '@/types/database'

export function getPrimaryAccessKindForEvent(event: Pick<Event, 'event_type'>): EventEntitlementAccessKind {
    if (event.event_type === 'course') return 'course_access'
    if (event.event_type === 'on_demand') return 'replay_access'
    return 'live_access'
}

export function getEntitlementEndDateForEvent(event: Pick<Event, 'event_type' | 'recording_expires_at'>) {
    if (event.event_type === 'on_demand') {
        return event.recording_expires_at ?? null
    }
    return null
}

export async function upsertEventEntitlement(params: {
    supabase: any
    event: Pick<Event, 'id' | 'event_type' | 'recording_expires_at'>
    email: string
    userId?: string | null
    sourceType: EventEntitlementSourceType
    sourceReference?: string | null
    metadata?: Record<string, any>
    accessKind?: EventEntitlementAccessKind
}) {
    const accessKind = params.accessKind ?? getPrimaryAccessKindForEvent(params.event)
    const endsAt = getEntitlementEndDateForEvent(params.event)

    const payload = {
        event_id: params.event.id,
        user_id: params.userId ?? null,
        email: params.email.toLowerCase(),
        access_kind: accessKind,
        source_type: params.sourceType,
        source_reference: params.sourceReference ?? null,
        status: 'active',
        starts_at: new Date().toISOString(),
        ends_at: endsAt,
        metadata: params.metadata ?? {},
    }

    return (params.supabase as any)
        .from('event_entitlements')
        .upsert(payload, {
            onConflict: 'event_id,access_kind,identity_key,source_type',
            ignoreDuplicates: false,
        })
}

export async function claimEventEntitlementsByEmail(params: {
    supabase: any
    userId: string
    email: string | null | undefined
}) {
    const normalizedEmail = params.email?.trim().toLowerCase()
    if (!normalizedEmail) return

    await (params.supabase as any)
        .from('event_entitlements')
        .update({ user_id: params.userId })
        .is('user_id', null)
        .eq('identity_key', normalizedEmail)
}

export async function getActiveEntitlementForEvent(params: {
    supabase: any
    eventId: string
    userId?: string | null
    email?: string | null
}) {
    const normalizedEmail = params.email?.trim().toLowerCase()
    const filters = [
        params.userId ? `user_id.eq.${params.userId}` : null,
        normalizedEmail ? `identity_key.eq.${normalizedEmail}` : null,
    ].filter(Boolean)

    if (filters.length === 0) return null

    const query = (params.supabase as any)
        .from('event_entitlements')
        .select('*')
        .eq('event_id', params.eventId)
        .eq('status', 'active')
        .or(filters.join(','))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const { data } = await query
    if (!data) return null

    if (data.ends_at && new Date(data.ends_at) <= new Date()) {
        return null
    }

    return data
}

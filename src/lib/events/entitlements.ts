import type { Event, EventEntitlement, EventEntitlementAccessKind, EventEntitlementSourceType } from '@/types/database'
import { createServiceClient } from '@/lib/supabase/service'

export function getEventAccessKinds(event: Pick<Event, 'event_type'>): EventEntitlementAccessKind[] {
    if (event.event_type === 'course') return ['course_access']
    if (event.event_type === 'on_demand') return ['replay_access']
    return ['live_access', 'replay_access']
}

export function getEventGrantAccessKinds(event: Pick<Event, 'event_type'>): EventEntitlementAccessKind[] {
    if (event.event_type === 'course') return ['course_access']
    if (event.event_type === 'on_demand') return ['replay_access']
    return ['live_access']
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

function getEntitlementEndAt(event: Pick<Event, 'event_type' | 'recording_expires_at'>, accessKind: EventEntitlementAccessKind) {
    if (accessKind === 'replay_access' || accessKind === 'course_access') {
        return event.recording_expires_at ?? null
    }

    return null
}

export async function grantEventEntitlements(params: {
    event: Pick<Event, 'id' | 'event_type' | 'recording_expires_at'>
    email: string
    userId?: string | null
    sourceType: EventEntitlementSourceType
    sourceReference?: string | null
    startsAt?: string | null
    endsAt?: string | null
    metadata?: Record<string, unknown>
}) {
    const admin = createServiceClient()
    const email = normalizeEmail(params.email)
    const accessKinds = getEventGrantAccessKinds(params.event)

    for (const accessKind of accessKinds) {
        const payload = {
            event_id: params.event.id,
            user_id: params.userId ?? null,
            email,
            access_kind: accessKind,
            source_type: params.sourceType,
            source_reference: params.sourceReference ?? null,
            status: 'active',
            starts_at: params.startsAt ?? new Date().toISOString(),
            ends_at: params.endsAt ?? getEntitlementEndAt(params.event, accessKind),
            metadata: params.metadata ?? {},
        }

        const { error } = await (admin
            .from('event_entitlements') as any)
            .upsert(payload, {
                onConflict: 'event_id,access_kind,identity_key,source_type',
            })

        if (error) {
            throw new Error(`Failed to grant entitlement ${accessKind}: ${error.message}`)
        }
    }
}

export async function revokeEventEntitlements(params: {
    eventId: string
    sourceType?: EventEntitlementSourceType
    sourceReference?: string
    userId?: string | null
    email?: string | null
}) {
    const admin = createServiceClient()
    let query = (admin
        .from('event_entitlements') as any)
        .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('event_id', params.eventId)
        .eq('status', 'active')

    if (params.sourceType) query = query.eq('source_type', params.sourceType)
    if (params.sourceReference !== undefined) query = query.eq('source_reference', params.sourceReference)
    if (params.userId) query = query.eq('user_id', params.userId)
    if (params.email) query = query.eq('email', normalizeEmail(params.email))

    const { error } = await query
    if (error) {
        throw new Error(`Failed to revoke entitlements: ${error.message}`)
    }
}

export function isEventEntitlementActive(
    entitlement: Pick<EventEntitlement, 'status' | 'starts_at' | 'ends_at'>,
    now = new Date()
) {
    if (entitlement.status !== 'active') return false
    if (entitlement.starts_at && new Date(entitlement.starts_at) > now) return false
    if (entitlement.ends_at && new Date(entitlement.ends_at) <= now) return false
    return true
}

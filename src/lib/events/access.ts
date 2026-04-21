import type { Event, EventEntitlementAccessKind, EventEntitlementSourceType } from '@/types/database'
import type { CommercialAccessSnapshot } from '@/lib/access/commercial'
import { audienceAllowsAccess } from '@/lib/access/commercial'
import { getMembershipAccessEnd } from '@/lib/access/catalog'
import { createServiceClient } from '@/lib/supabase/service'
import { getEventAccessKinds } from './entitlements'
import { getEffectiveEventPriceForProfile, normalizeMemberAccessType } from './pricing'

type EventAccessPolicyEvent = Pick<
    Event,
    'price' | 'member_price' | 'member_access_type' | 'specialization_code' | 'target_audience' | 'created_by'
>

type EventAccessPolicyEntitlement = {
    source_type?: EventEntitlementSourceType | string | null
} | null | undefined

type EventAccessPolicyCommercialAccess = Pick<
    CommercialAccessSnapshot,
    'role' | 'membershipLevel' | 'hasActiveMembership' | 'membershipSpecializationCode' | 'subscription' | 'viewer' | 'userId'
> | null | undefined

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

export function getMembershipEntitlementEndsAt(commercialAccess: EventAccessPolicyCommercialAccess) {
    if (!commercialAccess?.hasActiveMembership) return null
    return getMembershipAccessEnd(commercialAccess.subscription)?.toISOString() ?? null
}

function currentProfilePriceForEvent(
    event: EventAccessPolicyEvent,
    commercialAccess: EventAccessPolicyCommercialAccess
) {
    return getEffectiveEventPriceForProfile(
        {
            price: event.price,
            member_price: event.member_price,
            member_access_type: normalizeMemberAccessType(event.member_access_type),
            specialization_code: event.specialization_code,
        },
        {
            role: commercialAccess?.role,
            membershipLevel: commercialAccess?.membershipLevel ?? 0,
            hasActiveMembership: commercialAccess?.hasActiveMembership ?? false,
            membershipSpecializationCode: commercialAccess?.membershipSpecializationCode ?? null,
        }
    )
}

export function membershipEntitlementCanAccessEvent(params: {
    event: EventAccessPolicyEvent
    commercialAccess: EventAccessPolicyCommercialAccess
}) {
    const { event, commercialAccess } = params
    if (!commercialAccess?.hasActiveMembership) return false

    const hasAudienceAccess = audienceAllowsAccess(event.target_audience, commercialAccess as CommercialAccessSnapshot, {
        creatorId: event.created_by,
    })
    if (!hasAudienceAccess) return false

    return currentProfilePriceForEvent(event, commercialAccess) <= 0
}

export function eventRegistrationCanGrantAccess(params: {
    event: EventAccessPolicyEvent
    commercialAccess: EventAccessPolicyCommercialAccess
    registrationStatus?: string | null
}) {
    const { event, commercialAccess, registrationStatus } = params
    if (registrationStatus !== 'registered') return false

    const hasAudienceAccess = audienceAllowsAccess(event.target_audience, commercialAccess as CommercialAccessSnapshot, {
        creatorId: event.created_by,
    })
    if (!hasAudienceAccess) return false

    return currentProfilePriceForEvent(event, commercialAccess) <= 0
}

export function entitlementCanGrantEventAccess(params: {
    entitlement: EventAccessPolicyEntitlement
    event: EventAccessPolicyEvent
    commercialAccess: EventAccessPolicyCommercialAccess
}) {
    const { entitlement, event, commercialAccess } = params
    if (!entitlement) return false

    if (entitlement.source_type === 'membership') {
        return membershipEntitlementCanAccessEvent({ event, commercialAccess })
    }

    if (entitlement.source_type === 'registration') {
        return eventRegistrationCanGrantAccess({
            event,
            commercialAccess,
            registrationStatus: 'registered',
        })
    }

    return true
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
    userId: string
    email: string | null | undefined
}) {
    const normalizedEmail = params.email?.trim().toLowerCase()
    if (!normalizedEmail) return

    const admin = createServiceClient()

    await (admin as any)
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
    eventType?: Event['event_type'] | null
    allowedAccessKinds?: EventEntitlementAccessKind[]
}) {
    const normalizedEmail = params.email?.trim().toLowerCase()
    const filters = [
        params.userId ? `user_id.eq.${params.userId}` : null,
        normalizedEmail ? `identity_key.eq.${normalizedEmail}` : null,
    ].filter(Boolean)

    if (filters.length === 0) return null

    const allowedAccessKinds = params.allowedAccessKinds ?? (params.eventType ? getEventAccessKinds({ event_type: params.eventType } as Pick<Event, 'event_type'>) : null)

    let query = (params.supabase as any)
        .from('event_entitlements')
        .select('*')
        .eq('event_id', params.eventId)
        .eq('status', 'active')
        .or(filters.join(','))
        .order('created_at', { ascending: false })
        .limit(1)

    if (allowedAccessKinds?.length) {
        query = query.in('access_kind', allowedAccessKinds)
    }

    const { data } = await query.maybeSingle()
    if (!data) return null

    if (data.ends_at && new Date(data.ends_at) <= new Date()) {
        return null
    }

    return data
}

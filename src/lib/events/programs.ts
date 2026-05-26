import { audienceAllowsAccess, type CommercialAccessSnapshot } from '@/lib/access/commercial'
import { grantEventEntitlements } from '@/lib/events/entitlements'
import { getEffectiveEventPriceForProfile } from '@/lib/events/pricing'
import { createServiceClient } from '@/lib/supabase/service'
import type { EventEntitlementSourceType } from '@/types/database'

const PROGRAM_ALLOWED_STATUSES = ['upcoming', 'live', 'completed'] as const

const PROGRAM_PARENT_EVENT_SELECT = [
    'id',
    'slug',
    'status',
    'title',
    'price',
    'member_price',
    'member_access_type',
    'specialization_code',
    'target_audience',
    'created_by',
    'program_mode',
    'program_name',
    'program_type_label',
].join(', ')

const PROGRAM_CHILD_EVENT_SELECT = [
    'id',
    'slug',
    'status',
    'title',
    'subtitle',
    'description',
    'image_url',
    'start_time',
    'end_time',
    'event_type',
    'recording_url',
    'recording_expires_at',
    'price',
    'member_price',
    'member_access_type',
    'specialization_code',
    'target_audience',
    'session_config',
].join(', ')

function buildIdentityFilters(userId?: string | null, email?: string | null) {
    return [
        userId ? `user_id.eq.${userId}` : null,
        email ? `identity_key.eq.${email.trim().toLowerCase()}` : null,
    ].filter(Boolean)
}

function canMembershipAccessProgramParent(
    parentEvent: any,
    commercialAccess: CommercialAccessSnapshot | null | undefined
) {
    if (!commercialAccess?.hasActiveMembership) return false
    if (!audienceAllowsAccess(parentEvent.target_audience, commercialAccess, { creatorId: parentEvent.created_by })) {
        return false
    }

    return getEffectiveEventPriceForProfile(parentEvent, {
        role: commercialAccess.role,
        membershipLevel: commercialAccess.membershipLevel,
        hasActiveMembership: commercialAccess.hasActiveMembership,
        membershipSpecializationCode: commercialAccess.membershipSpecializationCode,
    }) <= 0
}

async function resolveProgramGrantSource(params: {
    commercialAccess?: CommercialAccessSnapshot | null
    email?: string | null
    parentEvent: any
    supabase: any
    userId?: string | null
}) {
    if (canMembershipAccessProgramParent(params.parentEvent, params.commercialAccess)) {
        return {
            sourceType: 'membership' as EventEntitlementSourceType,
            sourceReference: params.parentEvent.id,
            email: params.email?.trim().toLowerCase() ?? params.commercialAccess?.email?.trim().toLowerCase() ?? null,
            metadata: {
                program_bundle: true,
                program_parent_event_id: params.parentEvent.id,
                program_parent_event_slug: params.parentEvent.slug,
                grant_origin: 'membership_parent_access',
            },
        }
    }

    const filters = buildIdentityFilters(params.userId, params.email)
    if (filters.length === 0) return null

    const { data } = await (params.supabase
        .from('event_entitlements') as any)
        .select('id, email, source_type, source_reference, starts_at, ends_at, metadata')
        .eq('event_id', params.parentEvent.id)
        .eq('status', 'active')
        .or(filters.join(','))
        .order('created_at', { ascending: false })

    const now = Date.now()
    const activeParentGrant = (data ?? []).find((row: any) => {
        if (row.ends_at && new Date(row.ends_at).getTime() <= now) return false
        if (row.metadata?.program_child_access === true) return false
        if (row.source_type === 'membership') {
            return canMembershipAccessProgramParent(params.parentEvent, params.commercialAccess)
        }
        return true
    })

    if (!activeParentGrant) return null

    return {
        sourceType: activeParentGrant.source_type as EventEntitlementSourceType,
        sourceReference: activeParentGrant.source_reference ?? activeParentGrant.id,
        startsAt: activeParentGrant.starts_at ?? null,
        endsAt: activeParentGrant.ends_at ?? null,
        email: activeParentGrant.email ?? null,
        metadata: {
            program_bundle: true,
            program_parent_event_id: params.parentEvent.id,
            program_parent_event_slug: params.parentEvent.slug,
            grant_origin: 'parent_entitlement',
            parent_entitlement_id: activeParentGrant.id,
            parent_source_type: activeParentGrant.source_type,
        },
    }
}

export async function getProgramChildEventIds(supabase: any, parentEventId: string) {
    const { data, error } = await (supabase
        .from('event_program_items') as any)
        .select('child_event_id')
        .eq('parent_event_id', parentEventId)
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching program child event ids:', error)
        return []
    }

    return (data ?? [])
        .map((row: any) => row.child_event_id)
        .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
}

export async function getPublicProgramChildEvents(parentEventId: string) {
    const supabase = createServiceClient()

    const { data, error } = await (supabase
        .from('event_program_items') as any)
        .select(`
            display_order,
            event:events!event_program_items_child_event_id_fkey (
                ${PROGRAM_CHILD_EVENT_SELECT}
            )
        `)
        .eq('parent_event_id', parentEventId)
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching public program child events:', error)
        return []
    }

    return (data ?? [])
        .map((row: any) => {
            const event = Array.isArray(row.event) ? row.event[0] : row.event
            return event ? { ...event, program_display_order: row.display_order } : null
        })
        .filter((event: any) => event && PROGRAM_ALLOWED_STATUSES.includes(event.status))
}

export async function syncProgramBundleEntitlementsForIdentity(params: {
    commercialAccess?: CommercialAccessSnapshot | null
    email?: string | null
    supabase?: any
    userId?: string | null
}) {
    const normalizedEmail = params.email?.trim().toLowerCase()
        ?? params.commercialAccess?.email?.trim().toLowerCase()
        ?? null
    if (!params.userId && !normalizedEmail) return

    const supabase = params.supabase ?? createServiceClient()
    const filters = buildIdentityFilters(params.userId, normalizedEmail)
    if (filters.length === 0) return

    const { data: parentEntitlements, error: entitlementError } = await (supabase
        .from('event_entitlements') as any)
        .select('event_id, email')
        .eq('status', 'active')
        .or(filters.join(','))

    if (entitlementError) {
        console.error('Error fetching program parent entitlements:', entitlementError)
        return
    }

    const parentIds = Array.from(new Set(
        (parentEntitlements ?? [])
            .map((row: any) => row.event_id)
            .filter(Boolean)
    ))

    if (parentIds.length === 0) return

    const { data: parentEvents, error: parentError } = await (supabase
        .from('events') as any)
        .select(PROGRAM_PARENT_EVENT_SELECT)
        .in('id', parentIds)
        .eq('program_mode', 'program')
        .in('status', [...PROGRAM_ALLOWED_STATUSES])

    if (parentError) {
        console.error('Error fetching program parent events:', parentError)
        return
    }

    for (const parentEvent of parentEvents ?? []) {
        const grantSource = await resolveProgramGrantSource({
            supabase,
            parentEvent,
            userId: params.userId ?? null,
            email: normalizedEmail,
            commercialAccess: params.commercialAccess ?? null,
        })

        if (!grantSource) continue

        const childEvents = await getPublicProgramChildEvents(parentEvent.id)
        for (const childEvent of childEvents) {
            const grantEmail = grantSource.email?.trim().toLowerCase() ?? normalizedEmail
            if (!grantEmail) continue

            await grantEventEntitlements({
                event: childEvent,
                email: grantEmail,
                userId: params.userId ?? null,
                sourceType: grantSource.sourceType,
                sourceReference: grantSource.sourceReference,
                startsAt: grantSource.startsAt ?? undefined,
                endsAt: grantSource.endsAt ?? undefined,
                metadata: {
                    ...grantSource.metadata,
                    program_child_access: true,
                    child_event_id: childEvent.id,
                },
            })
        }
    }
}

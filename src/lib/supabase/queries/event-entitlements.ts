import { getActiveEntitlementForEvent, claimEventEntitlementsByEmail } from '@/lib/events/access'
import { getEventAccessKinds } from '@/lib/events/entitlements'
import { getPublicEventPath } from '@/lib/events/public'
import { createClient, getUserProfile } from '@/lib/supabase/server'

export async function claimCurrentUserEventEntitlements() {
    const profile = await getUserProfile()

    if (!profile?.id || !profile.email) return

    await claimEventEntitlementsByEmail({
        userId: profile.id,
        email: profile.email,
    })
}

export async function userHasEventHubAccess(event: any) {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        return {
            profile: null,
            entitlement: null,
            canAccess: false,
        }
    }

    await claimCurrentUserEventEntitlements()

    if (profile.role === 'admin' || profile.id === event.created_by) {
        return {
            profile,
            entitlement: null,
            canAccess: true,
        }
    }

    const entitlement = await getActiveEntitlementForEvent({
        supabase,
        eventId: event.id,
        userId: profile.id,
        email: profile.email,
        eventType: event.event_type,
    })

    return {
        profile,
        entitlement,
        canAccess: Boolean(entitlement),
    }
}

export async function getMyAccessibleEvents() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile?.id || !profile.email) return []

    await claimCurrentUserEventEntitlements()

    const { data: entitlements, error } = await (supabase
        .from('event_entitlements') as any)
        .select(`
            *,
            event:events (*)
        `)
        .eq('status', 'active')
        .order('starts_at', { ascending: false })

    if (error || !entitlements) {
        console.error('Error loading event entitlements:', error)
        return []
    }

    const dedupedByEvent = new Map<string, any>()

    for (const row of entitlements) {
        if (row.ends_at && new Date(row.ends_at) <= new Date()) {
            continue
        }

        if (!row.event) {
            continue
        }

        if (!getEventAccessKinds({ event_type: row.event.event_type }).includes(row.access_kind)) {
            continue
        }

        const existing = dedupedByEvent.get(row.event.id)
        if (!existing) {
            dedupedByEvent.set(row.event.id, row)
            continue
        }

        const currentStartsAt = row.starts_at ? new Date(row.starts_at).getTime() : 0
        const existingStartsAt = existing.starts_at ? new Date(existing.starts_at).getTime() : 0

        if (currentStartsAt >= existingStartsAt) {
            dedupedByEvent.set(row.event.id, row)
        }
    }

    return Array.from(dedupedByEvent.values()).map((row: any) => ({
        ...row,
        public_path: getPublicEventPath(row.event),
    }))
}

export async function getMyReplayAccessibleEvents() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile?.id || !profile.email) return []

    await claimCurrentUserEventEntitlements()

    const { data: entitlements, error } = await (supabase
        .from('event_entitlements') as any)
        .select(`
            *,
            event:events (*)
        `)
        .eq('status', 'active')
        .eq('access_kind', 'replay_access')
        .order('starts_at', { ascending: false })

    if (error || !entitlements) {
        console.error('Error loading replay entitlements:', error)
        return []
    }

    return entitlements
        .filter((row: any) => {
            if (row.ends_at && new Date(row.ends_at) <= new Date()) {
                return false
            }
            return Boolean(row.event)
        })
        .map((row: any) => ({
            ...row,
            public_path: getPublicEventPath(row.event),
        }))
}

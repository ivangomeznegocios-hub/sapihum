import { getActiveEntitlementForEvent, claimEventEntitlementsByEmail } from '@/lib/events/access'
import { getPublicEventPath } from '@/lib/events/public'
import { createClient, getUserProfile } from '@/lib/supabase/server'

export async function claimCurrentUserEventEntitlements() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile?.id || !profile.email) return

    await claimEventEntitlementsByEmail({
        supabase,
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

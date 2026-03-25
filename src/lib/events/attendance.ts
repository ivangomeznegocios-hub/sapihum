export async function getUniqueEventAccessCounts(supabase: any, eventIds: string[]) {
    if (eventIds.length === 0) {
        return {} as Record<string, number>
    }

    const [{ data: registrationRows }, { data: entitlementRows }] = await Promise.all([
        (supabase
            .from('event_registrations') as any)
            .select('event_id, user_id')
            .in('event_id', eventIds)
            .eq('status', 'registered'),
        (supabase
            .from('event_entitlements') as any)
            .select('event_id, user_id, identity_key')
            .in('event_id', eventIds)
            .eq('status', 'active')
            .in('source_type', ['registration', 'purchase', 'membership']),
    ])

    const identitiesByEvent = new Map<string, Set<string>>()

    for (const row of registrationRows ?? []) {
        const key = row.user_id ? `user:${row.user_id}` : null
        if (!key) continue
        const bucket = identitiesByEvent.get(row.event_id) ?? new Set<string>()
        bucket.add(key)
        identitiesByEvent.set(row.event_id, bucket)
    }

    for (const row of entitlementRows ?? []) {
        const key = row.user_id ? `user:${row.user_id}` : row.identity_key ? `email:${row.identity_key}` : null
        if (!key) continue
        const bucket = identitiesByEvent.get(row.event_id) ?? new Set<string>()
        bucket.add(key)
        identitiesByEvent.set(row.event_id, bucket)
    }

    return eventIds.reduce<Record<string, number>>((acc, eventId) => {
        acc[eventId] = identitiesByEvent.get(eventId)?.size ?? 0
        return acc
    }, {})
}

export async function getUniqueEventAccessCount(supabase: any, eventId: string) {
    const counts = await getUniqueEventAccessCounts(supabase, [eventId])
    return counts[eventId] ?? 0
}

import { createClient } from '@/lib/supabase/server'
import type {
    Event,
    EventInsert,
    EventWithRegistration,
    EventRegistration
} from '@/types/database'
import { getPublicCatalogKindForEvent } from '@/lib/events/public'
import { getUniqueEventAccessCount, getUniqueEventAccessCounts } from '@/lib/events/attendance'
import { audienceAllowsAccess, getCommercialAccessContext } from '@/lib/access/commercial'
import { canViewerSeeCatalogEvent } from '@/lib/access/catalog'



/**
 * Get events with user's registration status
 */
export async function getEventsWithRegistration(): Promise<EventWithRegistration[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get upcoming events
    const { data: events, error: eventsError } = await (supabase
        .from('events') as any)
        .select('*')
        .in('status', ['draft', 'upcoming', 'live', 'completed', 'cancelled'])
        .order('start_time', { ascending: true })

    if (eventsError || !events) {
        console.error('Error fetching events:', eventsError?.message || eventsError)
        return []
    }

    // Get user's registrations
    const eventIds = events.map((e: any) => e.id)
    const { data: registrations } = user
        ? await (supabase
            .from('event_registrations') as any)
            .select('*')
            .eq('user_id', user.id)
            .in('event_id', eventIds)
        : { data: [] }

    // Get attendee counts
    const { data: counts } = await (supabase
        .from('event_registrations') as any)
        .select('event_id')
        .in('event_id', eventIds)
        .eq('status', 'registered')

    // Count attendees per event
    const attendeeCounts: Record<string, number> = {}
    counts?.forEach((c: any) => {
        attendeeCounts[c.event_id] = (attendeeCounts[c.event_id] || 0) + 1
    })

    // Merge data
    const allEvents = events.map((event: any) => ({
        ...event,
        registration: registrations?.find((r: any) => r.event_id === event.id),
        attendee_count: attendeeCounts[event.id] || 0
    })) as EventWithRegistration[]

    if (!user) {
        return allEvents.filter((event) => canViewerSeeCatalogEvent(event as any, null))
    }

    const { data: profileData } = await (supabase
        .from('profiles') as any)
        .select('role, email, membership_level, subscription_status')
        .eq('id', user.id)
        .single()

    const profile = profileData as any

    if (!profile) return []

    const commercialAccess = await getCommercialAccessContext({
        supabase,
        userId: user.id,
        profile,
    })

    if (!commercialAccess) return []

    return allEvents.filter((event) => {
        if (!canViewerSeeCatalogEvent(event as any, commercialAccess.viewer)) {
            return false
        }

        return audienceAllowsAccess(event.target_audience as string[] | null | undefined, commercialAccess, {
            creatorId: event.created_by,
        })
    })
}

/**
 * Get a single event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
    const supabase = await createClient()

    const { data: event, error } = await (supabase
        .from('events') as any)
        .select('*')
        .eq('id', eventId)
        .single()

    if (error) {
        console.error('Error fetching event:', error)
        return null
    }

    // Increment views (fire and forget)
    if (event) {
        (supabase as any).rpc('increment_event_views', { event_id: eventId }).then(({ error }: any) => {
            if (error) console.error('Error incrementing views:', error)
        })
    }

    return event as Event
}

/**
 * Create a new event
 */
export async function createEvent(event: EventInsert): Promise<Event | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('events')
        .insert(event)
        .select()
        .single()

    if (error) {

        console.error('Error creating event:', error)
        return null
    }

    return data as Event
}

/**
 * Update an event
 */
export async function updateEvent(
    eventId: string,
    updates: Partial<EventInsert>
): Promise<Event | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single()

    if (error) {

        console.error('Error updating event:', error)
        return null
    }

    return data as Event
}

/**
 * Register for an event
 */
export async function registerForEvent(eventId: string, registrationData: any = {}): Promise<EventRegistration | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await (supabase as any)
        .from('event_registrations')
        .insert({
            event_id: eventId,
            user_id: user.id,
            status: 'registered',
            registration_data: registrationData
        })
        .select()
        .single()

    if (error) {

        console.error('Error registering for event:', error)
        return null
    }

    return data as EventRegistration
}

/**
 * Cancel event registration
 */
export async function cancelEventRegistration(eventId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { error } = await (supabase as any)
        .from('event_registrations')
        .update({ status: 'cancelled' })
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    if (error) {

        console.error('Error cancelling registration:', error)
        return false
    }

    return true
}

/**
 * Get registrations for an event (admin)
 */
export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('event_registrations') as any)
        .select(`
            *,
            user:profiles (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('event_id', eventId)
        .eq('status', 'registered')

    if (error) {
        console.error('Error fetching registrations:', error)
        return []
    }

    return (data ?? []) as EventRegistration[]
}

/**
 * Get public event by ID (no auth required - for embeds and sharing)
 * Filters out Draft and Cancelled events.
 */
export async function getPublicEventById(eventId: string): Promise<any | null> {
    const supabase = await createClient()

    const { data: event, error } = await (supabase
        .from('events') as any)
        .select('*')
        .eq('id', eventId)
        .not('status', 'eq', 'draft')
        .not('status', 'eq', 'cancelled')
        .single()

    if (error || !event) {
        console.error('Error fetching public event:', error)
        return null
    }

    // Get speakers
    const { data: speakers } = await (supabase
        .from('event_speakers') as any)
        .select(`
            *,
            speaker:speakers (
                *,
                profile:profiles (
                    id,
                    full_name,
                    avatar_url
                )
            )
        `)
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

    const attendeeCount = await getPublicEventAttendeeCount(supabase, eventId)

    return {
        ...event,
        speakers: speakers ?? [],
        attendee_count: attendeeCount,
    }
}

async function getPublicEventAttendeeCount(supabase: any, eventId: string) {
    return getUniqueEventAccessCount(supabase, eventId)
}

export async function getPublicEventBySlug(slug: string): Promise<any | null> {
    const supabase = await createClient()

    const { data: event, error } = await (supabase
        .from('events') as any)
        .select('*')
        .eq('slug', slug)
        .not('status', 'eq', 'draft')
        .not('status', 'eq', 'cancelled')
        .single()

    if (error || !event) {
        console.error('Error fetching public event by slug:', error)
        return null
    }

    const hydrated = await getPublicEventById(event.id)
    if (!hydrated) return null

    return {
        ...hydrated,
        public_kind: getPublicCatalogKindForEvent(hydrated),
    }
}

export async function getPublicCatalogEvents(kind: 'eventos' | 'cursos' | 'grabaciones') {
    const supabase = await createClient()

    let query = (supabase
        .from('events') as any)
        .select('*')
        .not('status', 'eq', 'draft')
        .not('status', 'eq', 'cancelled')

    if (kind === 'cursos') {
        query = query.eq('event_type', 'course')
    } else if (kind === 'grabaciones') {
        query = query.or('event_type.eq.on_demand,and(status.eq.completed,recording_url.not.is.null)')
    } else {
        query = query.not('event_type', 'eq', 'course').not('event_type', 'eq', 'on_demand')
    }

    const { data, error } = await query.order('start_time', { ascending: true })

    if (error || !data) {
        console.error('Error fetching public catalog events:', error)
        return []
    }

    const ids = data.map((event: any) => event.id)
    if (ids.length === 0) return []

    const [{ data: speakers }, attendeeCounts] = await Promise.all([
        (supabase
            .from('event_speakers') as any)
            .select(`
                *,
                speaker:speakers (
                    *,
                    profile:profiles (
                        id,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .in('event_id', ids)
            .order('display_order', { ascending: true }),
        getUniqueEventAccessCounts(supabase, ids),
    ])

    const speakerMap = new Map<string, any[]>()
    for (const row of speakers ?? []) {
        const collection = speakerMap.get(row.event_id) ?? []
        collection.push(row)
        speakerMap.set(row.event_id, collection)
    }

    return data.map((event: any) => ({
        ...event,
        speakers: speakerMap.get(event.id) ?? [],
        attendee_count: attendeeCounts[event.id] || 0,
        public_kind: getPublicCatalogKindForEvent(event),
    }))
}

/**
 * Get ALL published events (excluding on_demand recordings) — unified catalog for Academia.
 * Sorts upcoming first (by start_time ASC), completed last.
 */
export async function getUnifiedCatalogEvents() {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('events') as any)
        .select('*')
        .not('status', 'eq', 'draft')
        .not('status', 'eq', 'cancelled')
        .not('event_type', 'eq', 'on_demand')
        .order('start_time', { ascending: true })

    if (error || !data) {
        console.error('Error fetching unified catalog events:', error)
        return []
    }

    const ids = data.map((event: any) => event.id)
    if (ids.length === 0) return []

    const [{ data: speakers }, attendeeCounts] = await Promise.all([
        (supabase
            .from('event_speakers') as any)
            .select(`
                *,
                speaker:speakers (
                    *,
                    profile:profiles (
                        id,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .in('event_id', ids)
            .order('display_order', { ascending: true }),
        getUniqueEventAccessCounts(supabase, ids),
    ])

    const speakerMap = new Map<string, any[]>()
    for (const row of speakers ?? []) {
        const collection = speakerMap.get(row.event_id) ?? []
        collection.push(row)
        speakerMap.set(row.event_id, collection)
    }

    const enriched = data.map((event: any) => ({
        ...event,
        speakers: speakerMap.get(event.id) ?? [],
        attendee_count: attendeeCounts[event.id] || 0,
        public_kind: getPublicCatalogKindForEvent(event),
    }))

    // Sort: upcoming/live first, then completed, by start_time
    const now = new Date().toISOString()
    return enriched.sort((a: any, b: any) => {
        const aUpcoming = a.status === 'upcoming' || a.status === 'live' || a.start_time > now
        const bUpcoming = b.status === 'upcoming' || b.status === 'live' || b.start_time > now
        if (aUpcoming && !bUpcoming) return -1
        if (!aUpcoming && bUpcoming) return 1
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })
}

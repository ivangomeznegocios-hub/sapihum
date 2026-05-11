import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { unstable_cache } from 'next/cache'
import type {
    Event,
    EventStatus,
    EventInsert,
    EventWithRegistration,
    EventWithSpeakers,
    EventRegistration,
    Profile,
} from '@/types/database'
import { getPublicCatalogKindForEvent } from '@/lib/events/public'
import { getUniqueEventAccessCount, getUniqueEventAccessCounts } from '@/lib/events/attendance'
import { audienceAllowsAccess, getCommercialAccessContext, type CommercialAccessSnapshot } from '@/lib/access/commercial'
import { canViewerSeeCatalogEvent } from '@/lib/access/catalog'
import { applyVerticalContentFilter } from '@/lib/supabase/vertical-content'
import { normalizeVerticalCode } from '@/lib/verticals'
import { isSpeakerVisibleToPublic } from '@/lib/speakers/display'

interface EventViewerOptions {
    supabase?: any
    userId?: string | null
    activeVerticalId?: string | null
    statuses?: EventStatus[]
    limit?: number
    select?: string
    includeRegistrations?: boolean
    includeAttendeeCounts?: boolean
    profile?: Pick<
        Profile,
        'id' | 'role' | 'email' | 'membership_level' | 'subscription_status' | 'membership_specialization_code'
    > | null
    commercialAccess?: CommercialAccessSnapshot | null
}

export type PublicCatalogEvent = EventWithSpeakers & {
    attendee_count: number
    public_kind: ReturnType<typeof getPublicCatalogKindForEvent>
}

const PUBLIC_CATALOG_REVALIDATE_SECONDS = 300
const PUBLIC_CATALOG_EVENT_SELECT = [
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
    'price',
    'member_access_type',
    'specialization_code',
    'subcategory',
    'target_audience',
    'hero_badge',
    'public_cta_label',
    'formation_track',
    'ideal_for',
    'learning_outcomes',
    'seo_description',
    'og_description',
    'primary_vertical_id',
    'content_scope',
].join(', ')

const PUBLIC_CATALOG_SPEAKER_SELECT = `
    event_id,
    display_order,
    speaker:speakers (
        id,
        headline,
        photo_url,
        credentials,
        specialties,
        is_public,
        profile:profiles (
            id,
            full_name,
            avatar_url
        )
    )
`

function getPublishablePublicSpeakerRows(rows: any[] | null | undefined) {
    return (rows ?? [])
        .map((row) => {
            const speaker = Array.isArray(row.speaker) ? row.speaker[0] : row.speaker
            return speaker ? { ...row, speaker } : null
        })
        .filter((row): row is any => Boolean(row?.speaker && isSpeakerVisibleToPublic(row.speaker)))
}

async function getRegisteredEventCounts(supabase: any, eventIds: string[]) {
    if (eventIds.length === 0) {
        return {} as Record<string, number>
    }

    const { data: rpcCounts, error: rpcError } = await (supabase as any)
        .rpc('get_event_registered_counts', { p_event_ids: eventIds })

    if (!rpcError && Array.isArray(rpcCounts)) {
        const attendeeCounts: Record<string, number> = {}
        for (const row of rpcCounts) {
            attendeeCounts[row.event_id] = Number(row.attendee_count || 0)
        }
        return attendeeCounts
    }

    if (rpcError?.code && rpcError.code !== 'PGRST202') {
        console.error('Error fetching event registration counts:', rpcError.message || rpcError)
    }

    const { data: counts } = await (supabase
        .from('event_registrations') as any)
        .select('event_id')
        .in('event_id', eventIds)
        .eq('status', 'registered')

    const attendeeCounts: Record<string, number> = {}
    for (const row of counts ?? []) {
        attendeeCounts[row.event_id] = (attendeeCounts[row.event_id] || 0) + 1
    }
    return attendeeCounts
}


/**
 * Get events with user's registration status
 */
export async function getEventsWithRegistration(
    options?: EventViewerOptions
): Promise<EventWithRegistration[]> {
    const supabase = options?.supabase ?? await createClient()
    let userId = options?.userId ?? options?.profile?.id ?? null
    const statuses = options?.statuses ?? ['draft', 'upcoming', 'live', 'completed', 'cancelled']
    const shouldResolveUser = userId === null && options?.userId === undefined && !options?.profile
    const userPromise = shouldResolveUser
        ? supabase.auth.getUser()
        : Promise.resolve(null)

    let eventsQuery = (supabase
        .from('events') as any)
        .select(options?.select ?? '*')
        .in('status', statuses)
        .order('start_time', { ascending: true })

    eventsQuery = (await applyVerticalContentFilter(
        supabase,
        eventsQuery,
        { table: 'event_verticals', contentIdColumn: 'event_id' },
        options?.activeVerticalId
    )).query

    if (options?.limit) {
        eventsQuery = eventsQuery.limit(options.limit)
    }

    const [{ data: events, error: eventsError }, userResult] = await Promise.all([
        eventsQuery,
        userPromise,
    ])

    if (shouldResolveUser) {
        userId = userResult?.data.user?.id ?? null
    }

    if (eventsError || !events) {
        console.error('Error fetching events:', eventsError?.message || eventsError)
        return []
    }

    // Get user's registrations
    const eventIds = events.map((e: any) => e.id)
    if (eventIds.length === 0) {
        return []
    }

    const registrationsPromise = userId && options?.includeRegistrations !== false
        ? (supabase
            .from('event_registrations') as any)
            .select('*')
            .eq('user_id', userId)
            .in('event_id', eventIds)
        : Promise.resolve({ data: [] })

    // Get attendee counts
    const countsPromise = options?.includeAttendeeCounts === false
        ? Promise.resolve({} as Record<string, number>)
        : getRegisteredEventCounts(supabase, eventIds)

    const accessPromise = (async () => {
        if (!userId) {
            return {
                profile: null,
                commercialAccess: null,
            }
        }

        const profile = options?.profile ?? await (async () => {
            const { data: profileData } = await (supabase
                .from('profiles') as any)
                .select('id, role, email, membership_level, subscription_status, membership_specialization_code')
                .eq('id', userId)
                .maybeSingle()

            return (profileData as EventViewerOptions['profile']) ?? null
        })()

        if (!profile) {
            return {
                profile: null,
                commercialAccess: null,
            }
        }

        const commercialAccess = options?.commercialAccess ?? await getCommercialAccessContext({
            supabase,
            userId,
            profile,
        })

        return {
            profile,
            commercialAccess,
        }
    })()

    const [
        { data: registrations },
        attendeeCounts,
        { profile, commercialAccess },
    ] = await Promise.all([
        registrationsPromise,
        countsPromise,
        accessPromise,
    ])

    // Merge data
    const allEvents = events.map((event: any) => ({
        ...event,
        registration: registrations?.find((r: any) => r.event_id === event.id),
        attendee_count: attendeeCounts[event.id] || 0
    })) as EventWithRegistration[]

    if (!userId) {
        return allEvents.filter((event) => canViewerSeeCatalogEvent(event as any, null))
    }

    if (!profile) return []

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
    const supabase = createServiceClient()

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
        speakers: getPublishablePublicSpeakerRows(speakers),
        attendee_count: attendeeCount,
    }
}

async function getPublicEventAttendeeCount(supabase: any, eventId: string) {
    return getUniqueEventAccessCount(supabase, eventId)
}

async function getPublicVerticalId(supabase: any, verticalCode?: string | null) {
    const normalizedCode = normalizeVerticalCode(verticalCode)
    if (!normalizedCode) return null

    const { data, error } = await (supabase
        .from('verticals') as any)
        .select('id')
        .eq('code', normalizedCode)
        .eq('status', 'active')
        .maybeSingle()

    if (error || !data) {
        console.error('Error resolving public vertical:', error)
        return null
    }

    return data.id as string
}

async function fetchPublicEventBySlug(slug: string): Promise<any | null> {
    const supabase = createServiceClient()

    const { data: event, error } = await (supabase
        .from('events') as any)
        .select(`
            id,
            slug,
            status,
            formation:formations(id, slug, title)
        `)
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

    const formation = Array.isArray(event.formation)
        ? event.formation[0] ?? null
        : event.formation ?? null

    return {
        ...hydrated,
        formation,
        public_kind: getPublicCatalogKindForEvent(hydrated),
    }
}

export const getPublicEventBySlug = unstable_cache(
    fetchPublicEventBySlug,
    ['public-event-by-slug'],
    {
        revalidate: 120,
        tags: ['public-events'],
    }
)

async function fetchPublicCatalogEvents(
    kind: 'eventos' | 'cursos' | 'grabaciones',
    verticalCode?: string | null
): Promise<PublicCatalogEvent[]> {
    const supabase = createServiceClient()
    const activeVerticalId = await getPublicVerticalId(supabase, verticalCode)

    let query = (supabase
        .from('events') as any)
        .select(PUBLIC_CATALOG_EVENT_SELECT)
        .not('status', 'eq', 'draft')
        .not('status', 'eq', 'cancelled')

    if (kind === 'cursos') {
        query = query.eq('event_type', 'course')
    } else if (kind === 'grabaciones') {
        query = query.or('event_type.eq.on_demand,and(status.eq.completed,recording_url.not.is.null)')
    } else {
        query = query.not('event_type', 'eq', 'course').not('event_type', 'eq', 'on_demand')
    }

    query = (await applyVerticalContentFilter(
        supabase,
        query,
        { table: 'event_verticals', contentIdColumn: 'event_id' },
        activeVerticalId
    )).query

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
            .select(PUBLIC_CATALOG_SPEAKER_SELECT)
            .in('event_id', ids)
            .order('display_order', { ascending: true }),
        getUniqueEventAccessCounts(supabase, ids),
    ])

    const speakerMap = new Map<string, any[]>()
    for (const row of getPublishablePublicSpeakerRows(speakers)) {
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

export const getPublicCatalogEvents = unstable_cache(
    fetchPublicCatalogEvents,
    ['public-catalog-events'],
    {
        revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
        tags: ['public-events'],
    }
)

/**
 * Get ALL published events (excluding on_demand recordings) — unified catalog for Academia.
 * Sorts upcoming first (by start_time ASC), completed last.
 */
async function fetchUnifiedCatalogEvents(verticalCode?: string | null): Promise<PublicCatalogEvent[]> {
    const supabase = createServiceClient()
    const activeVerticalId = await getPublicVerticalId(supabase, verticalCode)

    let query = (supabase
        .from('events') as any)
        .select(PUBLIC_CATALOG_EVENT_SELECT)
        .not('status', 'eq', 'draft')
        .not('status', 'eq', 'cancelled')
        .not('event_type', 'eq', 'on_demand')

    query = (await applyVerticalContentFilter(
        supabase,
        query,
        { table: 'event_verticals', contentIdColumn: 'event_id' },
        activeVerticalId
    )).query

    const { data, error } = await query
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
            .select(PUBLIC_CATALOG_SPEAKER_SELECT)
            .in('event_id', ids)
            .order('display_order', { ascending: true }),
        getUniqueEventAccessCounts(supabase, ids),
    ])

    const speakerMap = new Map<string, any[]>()
    for (const row of getPublishablePublicSpeakerRows(speakers)) {
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

export const getUnifiedCatalogEvents = unstable_cache(
    fetchUnifiedCatalogEvents,
    ['unified-catalog-events'],
    {
        revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
        tags: ['public-events'],
    }
)

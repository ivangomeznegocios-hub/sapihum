import { createServiceClient } from '@/lib/supabase/service'
import type { EventType } from '@/types/database'
import type { CommercialAccessSnapshot } from '@/lib/access/commercial'
import { audienceAllowsAccess } from '@/lib/access/commercial'
import { getEffectiveEventPriceForProfile } from '@/lib/events/pricing'
import { grantEventEntitlements } from '@/lib/events/entitlements'

const CONGRESS_PARENT_EVENT_SELECT = [
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
].join(', ')

const CONGRESS_CHILD_EVENT_SELECT = [
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
].join(', ')

const CONGRESS_CHILD_SPEAKER_SELECT = `
    id,
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

const CONGRESS_ALLOWED_STATUSES = ['upcoming', 'live', 'completed'] as const

export type CongressLandingConfig = {
    key: string
    parentEventSlug: string
    title: string
    shortTitle: string
    subtitle: string
    claim: string
    quote: string
    dateWindow: {
        timeZone: string
        startDate: string
        endDate: string
        startUtc: string
        endExclusiveUtc: string
    }
    primaryCtaMode: 'membership_first'
    visualVariant: 'sapihum-editorial-gold'
    cta: {
        membershipLabel: string
        purchaseLabel: string
    }
    valuePillars: Array<{
        title: string
        description: string
    }>
    benefitBullets: string[]
    faq: Array<{
        question: string
        answer: string
    }>
}

export type CongressLandingEvent = {
    id: string
    slug: string
    status: string | null
    title: string
    subtitle?: string | null
    description?: string | null
    image_url?: string | null
    start_time: string
    end_time?: string | null
    event_type?: EventType | null
    recording_url?: string | null
    recording_expires_at?: string | null
    price?: number | null
    member_price?: number | null
    member_access_type?: string | null
    specialization_code?: string | null
    target_audience?: string[] | null
    speakers?: CongressLandingSpeakerRow[]
    attendee_count?: number
    created_by?: string | null
}

export type CongressLandingSpeakerRow = {
    id?: string
    event_id?: string
    display_order?: number | null
    speaker?: {
        id?: string | null
        headline?: string | null
        photo_url?: string | null
        credentials?: string[] | null
        specialties?: string[] | null
        is_public?: boolean | null
        profile?: {
            id?: string | null
            full_name?: string | null
            avatar_url?: string | null
        } | null
    } | null
}

export type AggregatedCongressSpeaker = {
    key: string
    display_order: number
    first_event_start: string
    event_count: number
    event_titles: string[]
    speaker: NonNullable<CongressLandingSpeakerRow['speaker']>
}

type CongressGrantSource = {
    sourceType: 'registration' | 'purchase' | 'membership' | 'manual' | 'support' | 'gift' | 'alliance' | 'migration'
    sourceReference: string | null
    startsAt?: string | null
    metadata: Record<string, unknown>
}

export const CONGRESS_LANDING_CONFIGS: CongressLandingConfig[] = [
    {
        key: 'sapihum-psychology-congress-2026',
        parentEventSlug: 'congreso-de-psicologia-2026-especial-dia-del-psicologo',
        title: 'Congreso de Psicologia 2026',
        shortTitle: 'Congreso de Psicologia 2026',
        subtitle: 'Especial Dia del Psicologo',
        claim: 'Comprender al ser humano para transformar realidades.',
        quote: 'Ciencia, etica, compasion e impacto en una agenda viva durante el cierre de mayo.',
        dateWindow: {
            timeZone: 'America/Mexico_City',
            startDate: '2026-05-20',
            endDate: '2026-05-31',
            startUtc: '2026-05-20T06:00:00.000Z',
            endExclusiveUtc: '2026-06-01T06:00:00.000Z',
        },
        primaryCtaMode: 'membership_first',
        visualVariant: 'sapihum-editorial-gold',
        cta: {
            membershipLabel: 'Acceder con membresia',
            purchaseLabel: 'Comprar congreso por $250 MXN',
        },
        valuePillars: [
            {
                title: 'Agenda dinamica',
                description: 'Integra automaticamente cada evento publico creado entre el 20 y el 31 de mayo.',
            },
            {
                title: 'Ponentes de SAPIHUM',
                description: 'Reune a especialistas publicos de la plataforma en una sola experiencia editorial.',
            },
            {
                title: 'Acceso remoto',
                description: 'Seguimiento 100% online con rutas individuales por cada evento y su ficha completa.',
            },
            {
                title: 'Archivo vivo',
                description: 'La landing conserva agenda, ponentes y estado historico despues de terminar mayo.',
            },
        ],
        benefitBullets: [
            'La membresia activa desbloquea el congreso sin costo y concentra el acceso desde un solo punto.',
            'La compra del congreso habilita automaticamente todos los eventos publicados en la ventana oficial.',
            'Cada sesion mantiene su propia ficha, perfil de ponentes, materiales y flujo de acceso.',
            'La agenda se actualiza conforme agregas nuevas sesiones o nuevos ponentes a la plataforma.',
        ],
        faq: [
            {
                question: 'Que cubre exactamente el acceso al congreso?',
                answer: 'Incluye todos los eventos publicos de SAPIHUM publicados entre el 20 y el 31 de mayo de 2026 dentro de esta programacion.',
            },
            {
                question: 'Si compro el congreso y despues agregan mas eventos, tambien quedan incluidos?',
                answer: 'Si. Los eventos nuevos que entren en la ventana oficial del congreso se sincronizan con quienes ya tengan acceso.',
            },
            {
                question: 'La membresia tambien desbloquea los eventos individuales del congreso?',
                answer: 'Si. Para esta edicion, la membresia activa habilita el acceso al congreso y a los eventos que forman parte de esta agenda.',
            },
            {
                question: 'Puedo entrar a cada evento por separado?',
                answer: 'Si. La agenda del congreso enlaza a la ficha individual de cada sesion para conservar detalles, perfiles y materiales.',
            },
        ],
    },
]

export function getCongressLandingByParentSlug(slug: string | null | undefined) {
    if (!slug) return null
    return CONGRESS_LANDING_CONFIGS.find((config) => config.parentEventSlug === slug) ?? null
}

function formatDateKeyInTimeZone(value: string, timeZone: string) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })

    const parts = formatter.formatToParts(new Date(value))
    const year = parts.find((part) => part.type === 'year')?.value
    const month = parts.find((part) => part.type === 'month')?.value
    const day = parts.find((part) => part.type === 'day')?.value

    if (!year || !month || !day) return null
    return `${year}-${month}-${day}`
}

export function isEventIncludedInCongressWindow(
    event: Pick<CongressLandingEvent, 'id' | 'slug' | 'status' | 'start_time'>,
    config: CongressLandingConfig,
    parentEventId?: string | null
) {
    if (!event.start_time) return false
    if (!CONGRESS_ALLOWED_STATUSES.includes((event.status ?? '') as (typeof CONGRESS_ALLOWED_STATUSES)[number])) {
        return false
    }
    if (event.slug === config.parentEventSlug) return false
    if (parentEventId && event.id === parentEventId) return false

    const dateKey = formatDateKeyInTimeZone(event.start_time, config.dateWindow.timeZone)
    if (!dateKey) return false

    return dateKey >= config.dateWindow.startDate && dateKey <= config.dateWindow.endDate
}

export function getCongressLandingForEvent(
    event: Pick<CongressLandingEvent, 'id' | 'slug' | 'status' | 'start_time'>,
    parentEventId?: string | null
) {
    if (getCongressLandingByParentSlug(event.slug)) {
        return getCongressLandingByParentSlug(event.slug)
    }

    return CONGRESS_LANDING_CONFIGS.find((config) =>
        isEventIncludedInCongressWindow(event, config, parentEventId)
    ) ?? null
}

export function getCongressChildEvents(
    events: CongressLandingEvent[],
    config: CongressLandingConfig,
    parentEventId?: string | null
) {
    return events
        .filter((event) => isEventIncludedInCongressWindow(event, config, parentEventId))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
}

export function getAggregatedCongressSpeakers(events: CongressLandingEvent[]): AggregatedCongressSpeaker[] {
    const speakers = new Map<string, AggregatedCongressSpeaker>()

    for (const event of [...events].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())) {
        for (const item of event.speakers ?? []) {
            const speaker = item.speaker
            if (!speaker) continue

            const key =
                speaker.id
                ?? speaker.profile?.id
                ?? speaker.profile?.full_name
                ?? speaker.headline
                ?? `${event.id}-${item.display_order ?? 999}`

            const displayOrder = Number(item.display_order ?? 999)
            const existing = speakers.get(key)

            if (!existing) {
                speakers.set(key, {
                    key,
                    display_order: displayOrder,
                    first_event_start: event.start_time,
                    event_count: 1,
                    event_titles: [event.title],
                    speaker,
                })
                continue
            }

            speakers.set(key, {
                ...existing,
                display_order: Math.min(existing.display_order, displayOrder),
                first_event_start:
                    new Date(existing.first_event_start).getTime() <= new Date(event.start_time).getTime()
                        ? existing.first_event_start
                        : event.start_time,
                event_count: existing.event_count + 1,
                event_titles: existing.event_titles.includes(event.title)
                    ? existing.event_titles
                    : [...existing.event_titles, event.title],
            })
        }
    }

    return Array.from(speakers.values()).sort((a, b) => {
        if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order
        }

        return new Date(a.first_event_start).getTime() - new Date(b.first_event_start).getTime()
    })
}

export function getCongressLandingPath(config: Pick<CongressLandingConfig, 'parentEventSlug'>) {
    return `/eventos/${config.parentEventSlug}`
}

function canMembershipAccessCongressParent(
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

function buildIdentityFilters(userId?: string | null, email?: string | null) {
    return [
        userId ? `user_id.eq.${userId}` : null,
        email ? `identity_key.eq.${email.trim().toLowerCase()}` : null,
    ].filter(Boolean)
}

async function resolveCongressGrantSource(params: {
    supabase: any
    parentEvent: any
    userId?: string | null
    email?: string | null
    commercialAccess?: CommercialAccessSnapshot | null
}) {
    if (canMembershipAccessCongressParent(params.parentEvent, params.commercialAccess)) {
        return {
            sourceType: 'membership',
            sourceReference: params.parentEvent.id,
            metadata: {
                congress_bundle: true,
                congress_parent_event_id: params.parentEvent.id,
                congress_parent_event_slug: params.parentEvent.slug,
                grant_origin: 'membership_parent_access',
            },
        } satisfies CongressGrantSource
    }

    const filters = buildIdentityFilters(params.userId, params.email)
    if (filters.length === 0) return null

    const { data } = await (params.supabase
        .from('event_entitlements') as any)
        .select('id, source_type, source_reference, starts_at, ends_at, metadata')
        .eq('event_id', params.parentEvent.id)
        .eq('status', 'active')
        .or(filters.join(','))
        .order('created_at', { ascending: false })

    const now = Date.now()
    const activeParentGrant = (data ?? []).find((row: any) => {
        if (row.ends_at && new Date(row.ends_at).getTime() <= now) return false
        if (row.source_type === 'membership') {
            return canMembershipAccessCongressParent(params.parentEvent, params.commercialAccess)
        }
        return true
    })

    if (!activeParentGrant) return null

    return {
        sourceType: activeParentGrant.source_type,
        sourceReference: activeParentGrant.source_reference ?? activeParentGrant.id,
        startsAt: activeParentGrant.starts_at ?? null,
        metadata: {
            congress_bundle: true,
            congress_parent_event_id: params.parentEvent.id,
            congress_parent_event_slug: params.parentEvent.slug,
            grant_origin: 'parent_entitlement',
            parent_entitlement_id: activeParentGrant.id,
            parent_source_type: activeParentGrant.source_type,
        },
    } satisfies CongressGrantSource
}

async function fetchCongressChildEventsForSync(params: {
    supabase: any
    config: CongressLandingConfig
    parentEventId: string
}) {
    const { data, error } = await (params.supabase
        .from('events') as any)
        .select(CONGRESS_CHILD_EVENT_SELECT)
        .in('status', [...CONGRESS_ALLOWED_STATUSES])
        .gte('start_time', params.config.dateWindow.startUtc)
        .lt('start_time', params.config.dateWindow.endExclusiveUtc)
        .neq('id', params.parentEventId)
        .neq('slug', params.config.parentEventSlug)
        .not('event_type', 'eq', 'on_demand')
        .order('start_time', { ascending: true })

    if (error) {
        console.error('Error fetching congress child events:', error)
        return []
    }

    return (data ?? []) as any[]
}

export async function syncCongressBundleEntitlementsForIdentity(params: {
    supabase?: any
    userId?: string | null
    email?: string | null
    commercialAccess?: CommercialAccessSnapshot | null
}) {
    const normalizedEmail = params.email?.trim().toLowerCase()
        ?? params.commercialAccess?.email?.trim().toLowerCase()
        ?? null
    if (!params.userId && !normalizedEmail) return
    if (!normalizedEmail) return

    const supabase = params.supabase ?? createServiceClient()
    const parentSlugs = CONGRESS_LANDING_CONFIGS.map((config) => config.parentEventSlug)

    const { data: parentEvents, error } = await (supabase
        .from('events') as any)
        .select(CONGRESS_PARENT_EVENT_SELECT)
        .in('slug', parentSlugs)
        .in('status', [...CONGRESS_ALLOWED_STATUSES])

    if (error) {
        console.error('Error fetching congress parent events:', error)
        return
    }

    for (const config of CONGRESS_LANDING_CONFIGS) {
        const parentEvent = (parentEvents ?? []).find((item: any) => item.slug === config.parentEventSlug)
        if (!parentEvent) continue

        const grantSource = await resolveCongressGrantSource({
            supabase,
            parentEvent,
            userId: params.userId ?? null,
            email: normalizedEmail,
            commercialAccess: params.commercialAccess ?? null,
        })

        if (!grantSource) continue

        const childEvents = await fetchCongressChildEventsForSync({
            supabase,
            config,
            parentEventId: parentEvent.id,
        })

        for (const childEvent of childEvents) {
            await grantEventEntitlements({
                event: childEvent,
                email: normalizedEmail,
                userId: params.userId ?? null,
                sourceType: grantSource.sourceType,
                sourceReference: grantSource.sourceReference,
                startsAt: grantSource.startsAt ?? undefined,
                metadata: {
                    ...grantSource.metadata,
                    child_event_id: childEvent.id,
                },
            })
        }
    }
}

export function isCongressBundleGrantMetadata(metadata: Record<string, unknown> | null | undefined) {
    return Boolean(metadata && metadata.congress_bundle === true)
}

export async function getCongressIncludedEvents(
    config: CongressLandingConfig,
    parentEventId: string
): Promise<CongressLandingEvent[]> {
    const supabase = createServiceClient()
    const { data, error } = await (supabase
        .from('events') as any)
        .select(CONGRESS_CHILD_EVENT_SELECT)
        .in('status', [...CONGRESS_ALLOWED_STATUSES])
        .gte('start_time', config.dateWindow.startUtc)
        .lt('start_time', config.dateWindow.endExclusiveUtc)
        .neq('id', parentEventId)
        .neq('slug', config.parentEventSlug)
        .not('event_type', 'eq', 'on_demand')
        .order('start_time', { ascending: true })

    if (error || !data) {
        console.error('Error fetching congress included events:', error)
        return []
    }

    const eventIds = data.map((event: any) => event.id)
    if (eventIds.length === 0) return []

    const [{ data: speakers }, { getUniqueEventAccessCounts }] = await Promise.all([
        (supabase
            .from('event_speakers') as any)
            .select(CONGRESS_CHILD_SPEAKER_SELECT)
            .in('event_id', eventIds)
            .order('display_order', { ascending: true }),
        import('@/lib/events/attendance'),
    ])

    const attendeeCounts = await getUniqueEventAccessCounts(supabase, eventIds)
    const speakerMap = new Map<string, CongressLandingSpeakerRow[]>()

    for (const row of speakers ?? []) {
        const speaker = Array.isArray(row.speaker) ? row.speaker[0] : row.speaker
        if (!speaker?.is_public) continue
        const collection = speakerMap.get(row.event_id) ?? []
        collection.push({ ...row, speaker })
        speakerMap.set(row.event_id, collection)
    }

    return (data as CongressLandingEvent[]).map((event) => ({
        ...event,
        speakers: speakerMap.get(event.id) ?? [],
        attendee_count: attendeeCounts[event.id] ?? 0,
    }))
}

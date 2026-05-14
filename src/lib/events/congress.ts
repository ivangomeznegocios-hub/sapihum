import { audienceAllowsAccess } from '@/lib/access/commercial'
import type { CommercialAccessSnapshot } from '@/lib/access/commercial'
import { grantEventEntitlements } from '@/lib/events/entitlements'
import { getEffectiveEventPriceForProfile } from '@/lib/events/pricing'
import { createServiceClient } from '@/lib/supabase/service'
import type { EventSubcategory, EventType, SpeakerWithProfile } from '@/types/database'

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
    'subcategory',
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
        bio,
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

export type CongressLandingHeroDetail = {
    label: string
    value: string
}

export type CongressLandingMetric = {
    value: string
    label: string
    description: string
}

export type CongressLandingBenefit = {
    title: string
    description: string
}

export type CongressGalleryOrientation = 'landscape' | 'portrait' | 'square'

export type CongressGalleryAssetConfig = {
    alt?: string
    caption?: string
    eventSlug?: string | null
    featured?: boolean
    id: string
    orientation?: CongressGalleryOrientation
    src?: string | null
}

export type ResolvedCongressGalleryAsset = {
    alt: string
    caption?: string
    featured: boolean
    id: string
    orientation: CongressGalleryOrientation
    src: string
}

export type CongressLandingConfig = {
    about: string[]
    benefits: CongressLandingBenefit[]
    cta: {
        membershipCaption: string
        membershipLabel: string
        purchaseLabel: string
    }
    dateWindow: {
        endDate: string
        endExclusiveUtc: string
        startDate: string
        startUtc: string
        timeZone: string
    }
    description: string
    gallery: {
        description: string
        eyebrow: string
        items: CongressGalleryAssetConfig[]
        title: string
    }
    heroDetails: CongressLandingHeroDetail[]
    key: string
    metrics: CongressLandingMetric[]
    parentEventSlug: string
    pricing: {
        membershipNote: string
        purchaseNote: string
    }
    programmingEmptyState: string
    programmingIntro: string
    shortTitle: string
    speakersIntro: string
    subtitle: string
    supportingText: string
    title: string
    faq: Array<{
        answer: string
        question: string
    }>
}

export type CongressSpeakerProfile = {
    bio?: string | null
    credentials?: string[] | null
    headline?: string | null
    id?: string | null
    is_public?: boolean | null
    photo_url?: string | null
    profile?: {
        avatar_url?: string | null
        full_name?: string | null
        id?: string | null
    } | null
    specialties?: string[] | null
}

export type CongressLandingEvent = {
    attendee_count?: number
    created_by?: string | null
    description?: string | null
    end_time?: string | null
    event_type?: EventType | null
    id: string
    image_url?: string | null
    member_access_type?: string | null
    member_price?: number | null
    price?: number | null
    recording_expires_at?: string | null
    recording_url?: string | null
    slug: string
    speakers?: CongressLandingSpeakerRow[]
    specialization_code?: string | null
    start_time: string
    status: string | null
    subcategory?: EventSubcategory | null
    subtitle?: string | null
    target_audience?: string[] | null
    title: string
}

export type CongressLandingSpeakerRow = {
    display_order?: number | null
    event_id?: string
    id?: string
    speaker?: CongressSpeakerProfile | null
}

export type AggregatedCongressSpeaker = {
    display_order: number
    event_count: number
    event_titles: string[]
    first_event_start: string | null
    key: string
    source: 'agenda' | 'directory'
    speaker: CongressSpeakerProfile
}

type CongressGrantSource = {
    metadata: Record<string, unknown>
    sourceReference: string | null
    sourceType: 'registration' | 'purchase' | 'membership' | 'manual' | 'support' | 'gift' | 'alliance' | 'migration'
    startsAt?: string | null
}

export const CONGRESS_LANDING_CONFIGS: CongressLandingConfig[] = [
    {
        key: 'sapihum-psychology-congress-2026',
        parentEventSlug: 'congreso-de-psicologia-2026-especial-dia-del-psicologo',
        title: 'Congreso de Psicología 2026',
        shortTitle: 'Congreso de Psicología 2026',
        subtitle: 'Especial Día del Psicólogo',
        description: 'Del 20 al 31 de mayo, vive una programación online con conferencias, talleres, clases y espacios de actualización profesional para psicólogos, estudiantes y profesionales de la salud mental.',
        supportingText: 'Un solo acceso te permite participar en todos los eventos incluidos dentro de la programación especial del Congreso de Psicología 2026.',
        dateWindow: {
            timeZone: 'America/Mexico_City',
            startDate: '2026-05-20',
            endDate: '2026-05-31',
            startUtc: '2026-05-20T06:00:00.000Z',
            endExclusiveUtc: '2026-06-01T06:00:00.000Z',
        },
        heroDetails: [
            { label: 'Fecha', value: 'Del 20 al 31 de mayo de 2026' },
            { label: 'Formato', value: 'Online en vivo' },
            { label: 'Acceso', value: 'Incluye todos los eventos del congreso' },
            { label: 'Dirigido a', value: 'Psicólogos, estudiantes de psicología, terapeutas y profesionales de la salud mental' },
            { label: 'Inversión', value: '$250 MXN' },
            { label: 'Membresía', value: 'Incluido sin costo adicional con membresía activa SAPIHUM' },
        ],
        metrics: [
            { value: '+1,200', label: 'Psicólogos invitados', description: 'Convocados para esta programación especial.' },
            { value: '12 días', label: 'De actividades online', description: 'Con encuentros en vivo del 20 al 31 de mayo.' },
            { value: '20–31 mayo', label: 'Programación especial', description: 'Una agenda diseñada como congreso, no como evento único.' },
            { value: 'Acceso completo', label: 'A todos los eventos incluidos', description: 'Un solo registro para toda la experiencia del congreso.' },
        ],
        gallery: {
            eyebrow: 'Vista previa del congreso',
            title: 'Imágenes reales de la programación',
            description: 'Explora algunas piezas visuales y sesiones destacadas que forman parte de la programación especial del congreso.',
            items: [
                {
                    id: 'congreso-hero',
                    eventSlug: 'congreso-de-psicologia-2026-especial-dia-del-psicologo',
                    featured: true,
                    orientation: 'landscape',
                    alt: 'Imagen principal del Congreso de Psicología 2026 | Especial Día del Psicólogo',
                },
                {
                    id: 'congreso-cognitivo-conductual',
                    eventSlug: 'fundamentos-teoricos-de-cognitivo-conductual',
                    orientation: 'portrait',
                },
                {
                    id: 'congreso-desgaste-empatia',
                    eventSlug: 'sindrome-del-desgaste-por-empatia-en-profesionales-del-cuidado',
                    orientation: 'portrait',
                },
                {
                    id: 'congreso-humanismo',
                    eventSlug: 'fundamentos-teoricos-del-humanismo',
                    orientation: 'portrait',
                },
                {
                    id: 'congreso-psicologia-educativa',
                    eventSlug: 'psicologia-educativa',
                    orientation: 'portrait',
                },
            ],
        },
        about: [
            'El Congreso de Psicología 2026 | Especial Día del Psicólogo es una programación online creada por SAPIHUM para celebrar y fortalecer la práctica profesional de la psicología.',
            'Del 20 al 31 de mayo de 2026, las y los participantes tendrán acceso a una serie de eventos en vivo con especialistas invitados en distintas áreas de la psicología, incluyendo conferencias, talleres, clases y espacios de actualización profesional.',
            'A diferencia de un evento aislado, este congreso reúne varios encuentros dentro de una misma experiencia. Con un solo acceso podrás participar en todos los eventos incluidos en la programación especial.',
            'Este espacio está diseñado para psicólogos, estudiantes, terapeutas, docentes y profesionales vinculados a la salud mental que buscan actualizarse, conectar con otros colegas y formar parte de una comunidad profesional en crecimiento.',
        ],
        benefits: [
            {
                title: 'Acceso a todos los eventos del congreso',
                description: 'Participa en la programación especial del 20 al 31 de mayo con un solo registro.',
            },
            {
                title: 'Conferencias, talleres y clases online',
                description: 'Accede a sesiones en vivo con especialistas invitados de SAPIHUM.',
            },
            {
                title: 'Materiales y recursos disponibles',
                description: 'Recibe los materiales que cada ponente comparta durante sus sesiones.',
            },
            {
                title: 'Constancia de participación',
                description: 'Obtén constancia según las condiciones de participación del congreso.',
            },
            {
                title: 'Acceso preferencial como miembro',
                description: 'Si tienes membresía activa SAPIHUM, este congreso queda incluido sin costo adicional.',
            },
        ],
        pricing: {
            purchaseNote: 'El acceso individual al congreso tiene un costo de $250 MXN e incluye la programación especial del 20 al 31 de mayo de 2026.',
            membershipNote: 'Si cuentas con membresía activa SAPIHUM, el acceso al congreso está incluido sin costo adicional.',
        },
        speakersIntro: 'Especialistas invitados durante la programación del 20 al 31 de mayo.',
        programmingIntro: 'Estos son algunos de los eventos incluidos dentro del acceso al Congreso de Psicología 2026.',
        programmingEmptyState: 'La programación completa se irá publicando conforme se confirmen las sesiones del congreso.',
        cta: {
            purchaseLabel: 'Adquirir acceso completo',
            membershipLabel: 'Unirme a SAPIHUM',
            membershipCaption: 'Incluye acceso al congreso sin costo adicional.',
        },
        faq: [
            {
                question: '¿Cómo funciona mi acceso al congreso?',
                answer: 'Con tu registro podrás acceder a los eventos incluidos dentro de la programación especial del 20 al 31 de mayo de 2026.',
            },
            {
                question: '¿El acceso es para un solo evento?',
                answer: 'No. El acceso corresponde al Congreso de Psicología 2026 e incluye los eventos contemplados dentro de la programación del 20 al 31 de mayo.',
            },
            {
                question: '¿Qué pasa si ya soy miembro de SAPIHUM?',
                answer: 'Si tienes membresía activa, el congreso queda incluido sin costo adicional.',
            },
            {
                question: '¿Recibiré constancia?',
                answer: 'Sí, se podrá emitir constancia de participación conforme a las condiciones del congreso y la asistencia registrada.',
            },
            {
                question: '¿Dónde se realizarán los eventos?',
                answer: 'Todos los eventos serán online.',
            },
            {
                question: '¿Necesito cuenta para entrar?',
                answer: 'El acceso debe poder recuperarse con el correo usado en el registro o compra. Si el usuario crea cuenta, debe poder visualizar sus accesos desde su área privada.',
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

function getCongressSpeakerKey(speaker: CongressSpeakerProfile, fallbackKey: string) {
    return speaker.id ?? speaker.profile?.id ?? speaker.profile?.full_name ?? speaker.headline ?? fallbackKey
}

function normalizeDirectorySpeaker(speaker: SpeakerWithProfile): CongressSpeakerProfile {
    return {
        id: speaker.id,
        headline: speaker.headline,
        bio: speaker.bio,
        photo_url: speaker.photo_url,
        credentials: speaker.credentials ?? null,
        specialties: speaker.specialties ?? null,
        is_public: speaker.is_public,
        profile: speaker.profile
            ? {
                id: speaker.profile.id,
                full_name: speaker.profile.full_name,
                avatar_url: speaker.profile.avatar_url,
            }
            : null,
    }
}

function mergeSpeakerProfiles(
    primary: CongressSpeakerProfile,
    fallback: CongressSpeakerProfile
): CongressSpeakerProfile {
    return {
        id: primary.id ?? fallback.id ?? null,
        headline: primary.headline ?? fallback.headline ?? null,
        bio: primary.bio ?? fallback.bio ?? null,
        photo_url: primary.photo_url ?? fallback.photo_url ?? null,
        credentials: primary.credentials?.length ? primary.credentials : (fallback.credentials ?? null),
        specialties: primary.specialties?.length ? primary.specialties : (fallback.specialties ?? null),
        is_public: primary.is_public ?? fallback.is_public ?? null,
        profile: {
            id: primary.profile?.id ?? fallback.profile?.id ?? null,
            full_name: primary.profile?.full_name ?? fallback.profile?.full_name ?? null,
            avatar_url: primary.profile?.avatar_url ?? fallback.profile?.avatar_url ?? null,
        },
    }
}

function guessGalleryOrientation(index: number): CongressGalleryOrientation {
    if (index === 0) return 'landscape'
    if (index % 3 === 0) return 'square'
    return 'portrait'
}

export function resolveCongressGalleryAssets(
    config: Pick<CongressLandingConfig, 'gallery' | 'parentEventSlug' | 'title'>,
    parentEvent: Pick<CongressLandingEvent, 'image_url' | 'slug' | 'title'>,
    includedEvents: Array<Pick<CongressLandingEvent, 'image_url' | 'slug' | 'title'>>
): ResolvedCongressGalleryAsset[] {
    const eventMap = new Map<string, Pick<CongressLandingEvent, 'image_url' | 'slug' | 'title'>>([
        [parentEvent.slug, parentEvent],
        ...includedEvents.map((event) => [event.slug, event] as const),
    ])

    const configuredItems = config.gallery.items
        .map((item, index) => {
            const referencedEvent = item.eventSlug ? eventMap.get(item.eventSlug) : null
            const src = item.src ?? referencedEvent?.image_url ?? null

            if (!src) return null

            return {
                id: item.id,
                src,
                alt: item.alt ?? referencedEvent?.title ?? config.title,
                caption: item.caption,
                featured: Boolean(item.featured),
                orientation: item.orientation ?? guessGalleryOrientation(index),
            } satisfies ResolvedCongressGalleryAsset
        })
        .filter((item) => item !== null)

    if (configuredItems.length > 0) {
        return configuredItems
    }

    const defaultItems = [parentEvent, ...includedEvents]
        .filter((event) => Boolean(event.image_url))
        .map((event, index) => ({
            id: `gallery-${event.slug}`,
            src: event.image_url as string,
            alt: event.title,
            featured: index === 0,
            orientation: guessGalleryOrientation(index),
        }))

    return defaultItems
}

export function isEventIncludedInCongressWindow(
    event: Pick<CongressLandingEvent, 'id' | 'slug' | 'start_time' | 'status'>,
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
    event: Pick<CongressLandingEvent, 'id' | 'slug' | 'start_time' | 'status'>,
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

            const key = getCongressSpeakerKey(speaker, `${event.id}-${item.display_order ?? 999}`)
            const displayOrder = Number(item.display_order ?? 999)
            const existing = speakers.get(key)

            if (!existing) {
                speakers.set(key, {
                    key,
                    display_order: displayOrder,
                    first_event_start: event.start_time,
                    event_count: 1,
                    event_titles: [event.title],
                    source: 'agenda',
                    speaker,
                })
                continue
            }

            speakers.set(key, {
                ...existing,
                display_order: Math.min(existing.display_order, displayOrder),
                first_event_start:
                    existing.first_event_start && new Date(existing.first_event_start).getTime() <= new Date(event.start_time).getTime()
                        ? existing.first_event_start
                        : event.start_time,
                event_count: existing.event_count + 1,
                event_titles: existing.event_titles.includes(event.title)
                    ? existing.event_titles
                    : [...existing.event_titles, event.title],
                speaker: mergeSpeakerProfiles(existing.speaker, speaker),
            })
        }
    }

    return Array.from(speakers.values()).sort((a, b) => {
        if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order
        }

        const aStart = a.first_event_start ? new Date(a.first_event_start).getTime() : Number.POSITIVE_INFINITY
        const bStart = b.first_event_start ? new Date(b.first_event_start).getTime() : Number.POSITIVE_INFINITY
        return aStart - bStart
    })
}

export function mergeCongressSpeakersWithDirectory(
    events: CongressLandingEvent[],
    directorySpeakers: SpeakerWithProfile[]
): AggregatedCongressSpeaker[] {
    const merged = new Map(
        getAggregatedCongressSpeakers(events).map((item) => [item.key, item] as const)
    )

    let displayOrder = Math.max(0, ...Array.from(merged.values()).map((item) => item.display_order)) + 1

    for (const speaker of directorySpeakers) {
        const normalized = normalizeDirectorySpeaker(speaker)
        const key = getCongressSpeakerKey(normalized, `directory-${displayOrder}`)
        const existing = merged.get(key)

        if (existing) {
            merged.set(key, {
                ...existing,
                speaker: mergeSpeakerProfiles(existing.speaker, normalized),
            })
            continue
        }

        merged.set(key, {
            key,
            display_order: displayOrder,
            first_event_start: null,
            event_count: 0,
            event_titles: [],
            source: 'directory',
            speaker: normalized,
        })
        displayOrder += 1
    }

    return Array.from(merged.values())
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
    commercialAccess?: CommercialAccessSnapshot | null
    email?: string | null
    parentEvent: any
    supabase: any
    userId?: string | null
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
    config: CongressLandingConfig
    parentEventId: string
    supabase: any
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
    commercialAccess?: CommercialAccessSnapshot | null
    email?: string | null
    supabase?: any
    userId?: string | null
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

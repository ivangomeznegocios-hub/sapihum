import type { Event, EventType } from '@/types/database'
import { isEventPast } from '@/lib/timezone'

/**
 * All public events route to /eventos canonically.
 * Legacy /cursos and /grabaciones routes should not be surfaced publicly.
 */
export type PublicCatalogKind = 'eventos'

export function slugifyCatalogText(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '-')
        .replace(/-{2,}/g, '-')
}

export function isCourseEventType(eventType?: EventType | null) {
    return eventType === 'course'
}

export function isRecordingEventType(eventType?: EventType | null) {
    return eventType === 'on_demand'
}

export function getPublicCatalogKindForEvent(event: Pick<Event, 'event_type' | 'recording_url' | 'status'>): PublicCatalogKind {
    void event
    return 'eventos'
}

export function getPublicEventPath(event: Pick<Event, 'slug' | 'event_type' | 'recording_url' | 'status'>) {
    return `/eventos/${event.slug}`
}

export function isMembersOnlyAudience(audience: unknown) {
    if (!Array.isArray(audience) || audience.length === 0) return false
    return audience.includes('members') && !audience.includes('public')
}

export function isMembersOnlyEvent(event: {
    target_audience?: unknown
    is_members_only?: boolean | null
}) {
    if (event.is_members_only) return true
    if (isMembersOnlyAudience(event.target_audience)) return true
    return false
}

export function canShowPublicEventOffer(event: {
    target_audience?: unknown
    is_members_only?: boolean | null
}) {
    const audience = Array.isArray(event.target_audience) && event.target_audience.length > 0
        ? event.target_audience
        : ['public']

    return audience.includes('public') || isMembersOnlyEvent(event)
}

export function buildPublicEventUrl(baseUrl: string, event: Pick<Event, 'slug' | 'event_type' | 'recording_url' | 'status'>) {
    return `${baseUrl}${getPublicEventPath(event)}`
}

export function getPublicCatalogTitle(kind: PublicCatalogKind) {
    void kind
    return 'Eventos'
}

export function getPublicCatalogDescription(kind: PublicCatalogKind) {
    void kind
    return 'Eventos en vivo, formaciones, talleres, conferencias y experiencias de la comunidad SAPIHUM.'
}

type PublicCatalogTimelineEvent = Pick<Event, 'status' | 'start_time' | 'end_time'>

export function isUpcomingPublicCatalogEvent(event: PublicCatalogTimelineEvent) {
    if (event.status === 'completed' || event.status === 'cancelled') return false

    if (event.status === 'live') {
        if (event.end_time) {
            return new Date(event.end_time) >= new Date()
        }

        return true
    }

    return !isEventPast(event.start_time)
}

export function isPastPublicCatalogEvent(event: PublicCatalogTimelineEvent) {
    if (event.status === 'completed') return true
    if (event.status === 'cancelled') return false

    if (event.status === 'live') {
        return Boolean(event.end_time && new Date(event.end_time) < new Date())
    }

    return isEventPast(event.start_time)
}

export function splitPublicCatalogEvents<T extends PublicCatalogTimelineEvent>(events: T[]) {
    const upcoming = events
        .filter((event) => isUpcomingPublicCatalogEvent(event))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

    const past = events
        .filter((event) => isPastPublicCatalogEvent(event))
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

    return { upcoming, past }
}

export function buildEventSeoDescription(event: Pick<Event, 'seo_description' | 'og_description' | 'description' | 'title'>) {
    const description = event.seo_description || event.og_description || event.description || `${event.title} en SAPIHUM`
    return description.slice(0, 160)
}

export function getEventTypeLabel(eventType?: EventType | null): string {
    const labels: Record<string, string> = {
        live: 'En vivo',
        course: 'Formacion',
        on_demand: 'Contenido exclusivo',
        presencial: 'Presencial',
    }
    return labels[eventType || ''] || 'Evento'
}

export function getDefaultPublicCtaLabel(event: Pick<Event, 'price' | 'event_type' | 'public_cta_label' | 'status' | 'recording_url'>) {
    if (event.public_cta_label) return event.public_cta_label
    if (Number(event.price) <= 0) return 'Registrarme gratis'
    return 'Comprar acceso'
}

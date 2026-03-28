import type { Event, EventType } from '@/types/database'

/**
 * All public events route to /eventos/ canonically.
 * The old 'cursos' and 'grabaciones' routes now redirect here.
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

/**
 * All events now resolve to 'eventos' as their public kind.
 * Recordings are no longer a separate public catalog.
 */
export function getPublicCatalogKindForEvent(_event: Pick<Event, 'event_type' | 'recording_url' | 'status'>): PublicCatalogKind {
    return 'eventos'
}

export function getPublicEventPath(event: Pick<Event, 'slug' | 'event_type' | 'recording_url' | 'status'>) {
    return `/eventos/${event.slug}`
}

export function buildPublicEventUrl(baseUrl: string, event: Pick<Event, 'slug' | 'event_type' | 'recording_url' | 'status'>) {
    return `${baseUrl}${getPublicEventPath(event)}`
}

export function getPublicCatalogTitle(_kind: PublicCatalogKind) {
    return 'Eventos'
}

export function getPublicCatalogDescription(_kind: PublicCatalogKind) {
    return 'Eventos en vivo, formaciones, talleres, conferencias y experiencias de la comunidad SAPIHUM.'
}

export function buildEventSeoDescription(event: Pick<Event, 'seo_description' | 'og_description' | 'description' | 'title'>) {
    const description = event.seo_description || event.og_description || event.description || `${event.title} en Comunidad de Psicologia`
    return description.slice(0, 160)
}

export function getEventTypeLabel(eventType?: EventType | null): string {
    const labels: Record<string, string> = {
        live: 'En Vivo',
        course: 'Formación',
        on_demand: 'Grabación',
        presencial: 'Presencial',
    }
    return labels[eventType || ''] || 'Evento'
}

export function getDefaultPublicCtaLabel(event: Pick<Event, 'price' | 'event_type' | 'public_cta_label' | 'status' | 'recording_url'>) {
    if (event.public_cta_label) return event.public_cta_label
    if (Number(event.price) <= 0) return 'Registrarme gratis'
    return 'Comprar acceso'
}

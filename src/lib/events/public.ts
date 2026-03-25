import type { Event, EventType } from '@/types/database'

export type PublicCatalogKind = 'eventos' | 'cursos' | 'grabaciones'

export function slugifyCatalogText(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-')
}

export function isCourseEventType(eventType?: EventType | null) {
    return eventType === 'course'
}

export function isRecordingEventType(eventType?: EventType | null) {
    return eventType === 'on_demand'
}

export function getPublicCatalogKindForEvent(event: Pick<Event, 'event_type' | 'recording_url' | 'status'>): PublicCatalogKind {
    if (isCourseEventType(event.event_type)) return 'cursos'
    if (isRecordingEventType(event.event_type)) return 'grabaciones'
    if (event.status === 'completed' && event.recording_url) return 'grabaciones'
    return 'eventos'
}

export function getPublicEventPath(event: Pick<Event, 'slug' | 'event_type' | 'recording_url' | 'status'>) {
    return `/${getPublicCatalogKindForEvent(event)}/${event.slug}`
}

export function buildPublicEventUrl(baseUrl: string, event: Pick<Event, 'slug' | 'event_type' | 'recording_url' | 'status'>) {
    return `${baseUrl}${getPublicEventPath(event)}`
}

export function getPublicCatalogTitle(kind: PublicCatalogKind) {
    if (kind === 'cursos') return 'Cursos'
    if (kind === 'grabaciones') return 'Grabaciones'
    return 'Eventos'
}

export function getPublicCatalogDescription(kind: PublicCatalogKind) {
    if (kind === 'cursos') {
        return 'Programas cohortizados y cursos evergreen con enfoque clínico, educativo y de negocio.'
    }
    if (kind === 'grabaciones') {
        return 'Replays, clases bajo demanda y contenidos que siguen vendiendo después del vivo.'
    }
    return 'Eventos en vivo, cohortes y experiencias públicas o exclusivas para la comunidad.'
}

export function buildEventSeoDescription(event: Pick<Event, 'seo_description' | 'og_description' | 'description' | 'title'>) {
    const description = event.seo_description || event.og_description || event.description || `${event.title} en Comunidad de Psicologia`
    return description.slice(0, 160)
}

export function getDefaultPublicCtaLabel(event: Pick<Event, 'price' | 'event_type' | 'public_cta_label' | 'status' | 'recording_url'>) {
    if (event.public_cta_label) return event.public_cta_label
    if (event.price <= 0) return 'Registrarme gratis'
    if (isCourseEventType(event.event_type)) return 'Comprar curso'
    if (isRecordingEventType(event.event_type) || (event.status === 'completed' && event.recording_url)) {
        return 'Comprar acceso'
    }
    return 'Comprar acceso'
}

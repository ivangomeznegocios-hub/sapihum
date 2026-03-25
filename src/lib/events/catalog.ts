import type { Event } from '@/types/database'

export type PublicCatalogSection = 'eventos' | 'cursos' | 'grabaciones'

type EventRouteLike = Pick<Event, 'event_type' | 'slug' | 'recording_url' | 'status'>

export function slugifyEventTitle(title: string) {
    return title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'evento'
}

export function getPublicCatalogSection(event: Pick<EventRouteLike, 'event_type'>): PublicCatalogSection {
    if (event.event_type === 'course') return 'cursos'
    if (event.event_type === 'on_demand') return 'grabaciones'
    return 'eventos'
}

export function getPublicEventPath(event: Pick<EventRouteLike, 'event_type' | 'slug'>) {
    return `/${getPublicCatalogSection(event)}/${event.slug}`
}

export function getPublicEventEmbedPath(event: Pick<EventRouteLike, 'event_type' | 'slug'>) {
    return `${getPublicEventPath(event)}/embed`
}

export function getHubPath(slug: string) {
    return `/hub/${slug}`
}

export function getAccessRecoveryPath(next?: string) {
    if (!next) return '/compras/recuperar'
    return `/compras/recuperar?next=${encodeURIComponent(next)}`
}

export function getBlogArticlePath(slug: string) {
    return `/blog/${slug}`
}

export function getCatalogSectionTitle(section: PublicCatalogSection) {
    if (section === 'cursos') return 'Cursos'
    if (section === 'grabaciones') return 'Grabaciones'
    return 'Eventos'
}

export function getCatalogSectionDescription(section: PublicCatalogSection) {
    if (section === 'cursos') {
        return 'Programas y cohortes con contenido estructurado, acceso privado y continuidad formativa.'
    }

    if (section === 'grabaciones') {
        return 'Replays y contenidos on-demand listos para compra, distribución y posicionamiento.'
    }

    return 'Eventos, cohortes y sesiones en vivo diseñadas como activos de captación, conversión y autoridad.'
}

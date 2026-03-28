import type { Event } from '@/types/database'

export type PublicCatalogSection = 'eventos'

type EventRouteLike = Pick<Event, 'event_type' | 'slug' | 'recording_url' | 'status'>

export function slugifyEventTitle(title: string) {
    return title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'evento'
}

/**
 * All events are in the 'eventos' section. No more cursos/grabaciones split.
 */
export function getPublicCatalogSection(_event: Pick<EventRouteLike, 'event_type'>): PublicCatalogSection {
    return 'eventos'
}

export function getPublicEventPath(event: Pick<EventRouteLike, 'event_type' | 'slug'>) {
    return `/eventos/${event.slug}`
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

export function getCatalogSectionTitle(_section: PublicCatalogSection) {
    return 'Eventos'
}

export function getCatalogSectionDescription(_section: PublicCatalogSection) {
    return 'Eventos, formaciones y experiencias en vivo diseñadas para la comunidad de psicología profesional.'
}

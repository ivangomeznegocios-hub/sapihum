import type { Metadata } from 'next'
import { brandFullName, brandName } from '@/lib/brand'
import { getAppUrl } from '@/lib/config/app-url'
import type { OrganicContentAsset, OrganicSourceType } from './types'

export type OrganicRouteKind =
    | 'guides'
    | 'resources'
    | 'resourceFormats'
    | 'resourceScales'
    | 'authors'
    | 'books'
    | 'approaches'
    | 'tools'
    | 'psychologists'
    | 'specialties'

export interface OrganicRouteConfig {
    kind: OrganicRouteKind
    label: string
    pathPrefix: string
    sourceType: OrganicSourceType
}

export const ORGANIC_ROUTE_CONFIG: Record<OrganicRouteKind, OrganicRouteConfig> = {
    guides: { kind: 'guides', label: 'Guias', pathPrefix: '/guias', sourceType: 'guide' },
    resources: { kind: 'resources', label: 'Recursos', pathPrefix: '/recursos', sourceType: 'resource' },
    resourceFormats: { kind: 'resourceFormats', label: 'Formatos', pathPrefix: '/recursos/formatos', sourceType: 'resource_format' },
    resourceScales: { kind: 'resourceScales', label: 'Escalas', pathPrefix: '/recursos/escalas', sourceType: 'resource_scale' },
    authors: { kind: 'authors', label: 'Autores', pathPrefix: '/autores', sourceType: 'author' },
    books: { kind: 'books', label: 'Libros', pathPrefix: '/libros', sourceType: 'book' },
    approaches: { kind: 'approaches', label: 'Enfoques', pathPrefix: '/enfoques', sourceType: 'approach' },
    tools: { kind: 'tools', label: 'Herramientas', pathPrefix: '/herramientas', sourceType: 'tool' },
    psychologists: { kind: 'psychologists', label: 'Psicologos', pathPrefix: '/psicologos', sourceType: 'psychologist' },
    specialties: { kind: 'specialties', label: 'Especialidades', pathPrefix: '/especialidades', sourceType: 'specialty' },
}

import { ORGANIC_CONTENT } from './content'

export function getOrganicRouteConfig(kind: OrganicRouteKind) {
    return ORGANIC_ROUTE_CONFIG[kind]
}

export function getOrganicContentByRoute(kind: OrganicRouteKind, slug: string) {
    const config = getOrganicRouteConfig(kind)
    return ORGANIC_CONTENT.find((item) => item.sourceType === config.sourceType && item.slug === slug) ?? null
}

export function getOrganicContentByAssetKey(assetKey: string) {
    return ORGANIC_CONTENT.find((item) => item.gatedResource?.assetKey === assetKey) ?? null
}

export function getOrganicContentForSitemap() {
    return ORGANIC_CONTENT.map((item) => {
        const route = Object.values(ORGANIC_ROUTE_CONFIG).find((config) => config.sourceType === item.sourceType)
        return route ? { content: item, path: `${route.pathPrefix}/${item.slug}` } : null
    }).filter((item): item is { content: OrganicContentAsset; path: string } => Boolean(item))
}

export function getOrganicStaticParams(kind: OrganicRouteKind) {
    const config = getOrganicRouteConfig(kind)
    return ORGANIC_CONTENT
        .filter((item) => item.sourceType === config.sourceType)
        .map((item) => ({ slug: item.slug }))
}

export function buildOrganicPath(kind: OrganicRouteKind, slug: string) {
    const config = getOrganicRouteConfig(kind)
    return `${config.pathPrefix}/${slug}`
}

export function getOrganicNextStepUrl(input: {
    intent?: string | null
    sourceType?: OrganicSourceType | null
    specialty?: string | null
}) {
    if (input.intent === 'attend_event') return '/eventos'
    if (input.intent === 'explore_formation') return '/formaciones'
    if (input.intent === 'evaluate_membership' || input.intent === 'commercial_interest') return '/membresia'
    if (input.specialty) return `/especialidades/${input.specialty.replaceAll('_', '-')}`
    if (input.sourceType === 'resource_format' || input.sourceType === 'resource_scale') return '/recursos'
    return '/comunidad'
}

export function buildOrganicMetadata(kind: OrganicRouteKind, slug: string): Metadata {
    const content = getOrganicContentByRoute(kind, slug)
    if (!content) {
        return {
            title: `Contenido no encontrado | ${brandName}`,
            robots: { index: false, follow: false },
        }
    }

    const canonical = buildOrganicPath(kind, content.slug)

    return {
        title: `${content.title} | ${brandName}`,
        description: content.description,
        alternates: { canonical },
        openGraph: {
            title: content.title,
            description: content.description,
            url: canonical,
            type: 'article',
            siteName: brandFullName,
        },
        twitter: {
            card: 'summary_large_image',
            title: content.title,
            description: content.description,
        },
        robots: {
            index: true,
            follow: true,
        },
    }
}

export function getOrganicAbsoluteUrl(pathname: string) {
    return `${getAppUrl()}${pathname}`
}

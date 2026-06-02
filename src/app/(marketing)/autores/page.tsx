import type { Metadata } from 'next'
import { ORGANIC_CONTENT } from '@/lib/organic-leads/content'
import { getOrganicAbsoluteUrl } from '@/lib/organic-leads/routing'
import { OrganicHubLayout } from '@/components/organic-leads/organic-hub-layout'
import type { OrganicRouteKind } from '@/lib/organic-leads/routing'

export const metadata: Metadata = {
    title: 'Autores y Teóricos Destacados en Psicología | SAPIHUM',
    description: 'Conoce la biografía técnica, trayectoria académica, aportes cardinales y el legado clínico de figuras pioneras de la salud mental como Beck, Ellis, Rogers, Linehan y Hayes.',
    alternates: {
        canonical: '/autores',
    },
}

const ROUTE_KIND_MAP: Record<string, OrganicRouteKind> = {
    guide: 'guides',
    resource: 'resources',
    resource_format: 'resourceFormats',
    resource_scale: 'resourceScales',
    author: 'authors',
    book: 'books',
    approach: 'approaches',
    tool: 'tools',
    psychologist: 'psychologists',
    specialty: 'specialties',
}

export default function AutoresHubPage() {
    // Filter authors
    const authors = ORGANIC_CONTENT.filter((item) => item.contentType === 'author')

    const breadcrumbs = [
        { name: 'SAPIHUM', url: getOrganicAbsoluteUrl('/') },
        { name: 'Autores', url: getOrganicAbsoluteUrl('/autores') },
    ]

    return (
        <OrganicHubLayout
            title="Autores y Clínicos Pioneros"
            serifSubtitle="que redefinieron la salud mental"
            description="Explora las trayectorias científicas, conceptos nucleares desarrollados y el impacto conceptual de los teóricos y prácticos más importantes de la historia de la psicoterapia."
            badge="Catálogo de Autores"
            items={authors}
            routeKindMap={ROUTE_KIND_MAP}
            breadcrumbs={breadcrumbs}
            canonicalPath="/autores"
        />
    )
}
export const dynamic = 'force-static'

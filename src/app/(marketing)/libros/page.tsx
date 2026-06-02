import type { Metadata } from 'next'
import { ORGANIC_CONTENT } from '@/lib/organic-leads/content'
import { getOrganicAbsoluteUrl } from '@/lib/organic-leads/routing'
import { OrganicHubLayout } from '@/components/organic-leads/organic-hub-layout'
import type { OrganicRouteKind } from '@/lib/organic-leads/routing'

export const metadata: Metadata = {
    title: 'Libros y Rutas de Lectura recomendadas | SAPIHUM',
    description: 'Encuentra las mejores recomendaciones y reseñas críticas de manuales de psicología clínica, guías de terapia cognitivo-conductual y lecturas de despegue para recién egresados.',
    alternates: {
        canonical: '/libros',
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
}

export default function LibrosHubPage() {
    // Filter books
    const books = ORGANIC_CONTENT.filter((item) => item.contentType === 'book')

    const breadcrumbs = [
        { name: 'SAPIHUM', url: getOrganicAbsoluteUrl('/') },
        { name: 'Libros', url: getOrganicAbsoluteUrl('/libros') },
    ]

    return (
        <OrganicHubLayout
            title="Libros y Rutas de Lectura"
            serifSubtitle="para tu actualización científica"
            description="Revisa nuestra cuidada curaduría de lecturas esenciales, manuales de tratamientos psicológicos eficaces y guías teóricas comentadas para consolidar tu ejercicio clínico."
            badge="Catálogo de Libros"
            items={books}
            routeKindMap={ROUTE_KIND_MAP}
            breadcrumbs={breadcrumbs}
            canonicalPath="/libros"
        />
    )
}
export const dynamic = 'force-static'

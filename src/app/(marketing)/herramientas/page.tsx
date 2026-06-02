import type { Metadata } from 'next'
import { ORGANIC_CONTENT } from '@/lib/organic-leads/content'
import { getOrganicAbsoluteUrl } from '@/lib/organic-leads/routing'
import { OrganicHubLayout } from '@/components/organic-leads/organic-hub-layout'
import type { OrganicRouteKind } from '@/lib/organic-leads/routing'

export const metadata: Metadata = {
    title: 'Herramientas Digitales y Tecnológicas para Psicólogos | SAPIHUM',
    description: 'Índice de herramientas, aplicaciones y checklists de digitalización para consulta de psicología. Descubre cómo implementar teleconsulta segura, expedientes electrónicos e inteligencia artificial.',
    alternates: {
        canonical: '/herramientas',
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

export default function HerramientasHubPage() {
    // Filter tools
    const tools = ORGANIC_CONTENT.filter((item) => item.contentType === 'tool')

    const breadcrumbs = [
        { name: 'SAPIHUM', url: getOrganicAbsoluteUrl('/') },
        { name: 'Herramientas', url: getOrganicAbsoluteUrl('/herramientas') },
    ]

    return (
        <OrganicHubLayout
            title="Herramientas y Tecnología"
            serifSubtitle="para digitalizar tu práctica clínica"
            description="Explora recursos indispensables para la digitalización de tu consulta, checklists de protección de datos, plataformas seguras de teleconsulta y guías de IA en salud mental."
            badge="Catálogo de Herramientas"
            items={tools}
            routeKindMap={ROUTE_KIND_MAP}
            breadcrumbs={breadcrumbs}
            canonicalPath="/herramientas"
        />
    )
}
export const dynamic = 'force-static'

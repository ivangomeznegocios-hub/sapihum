import type { Metadata } from 'next'
import { ORGANIC_CONTENT } from '@/lib/organic-leads/content'
import { getOrganicAbsoluteUrl } from '@/lib/organic-leads/routing'
import { OrganicHubLayout } from '@/components/organic-leads/organic-hub-layout'
import type { OrganicRouteKind } from '@/lib/organic-leads/routing'

export const metadata: Metadata = {
    title: 'Enfoques Psicoterapéuticos y Modelos Clínicos | SAPIHUM',
    description: 'Explora los fundamentos teóricos, técnicas Cardinales y el respaldo empírico de enfoques clínicos como TCC, ACT, DBT, terapia sistémica, humanista y psicoanálisis.',
    alternates: {
        canonical: '/enfoques',
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

export default function EnfoquesHubPage() {
    // Filter approaches
    const approaches = ORGANIC_CONTENT.filter((item) => item.contentType === 'approach')

    const breadcrumbs = [
        { name: 'SAPIHUM', url: getOrganicAbsoluteUrl('/') },
        { name: 'Enfoques', url: getOrganicAbsoluteUrl('/enfoques') },
    ]

    return (
        <OrganicHubLayout
            title="Enfoques Psicoterapéuticos"
            serifSubtitle="fundamentados en la evidencia"
            description="Revisa los principios científicos, metodologías clínicas y campos de aplicación práctica de las principales orientaciones psicoterapéuticas contemporáneas."
            badge="Catálogo de Enfoques"
            items={approaches}
            routeKindMap={ROUTE_KIND_MAP}
            breadcrumbs={breadcrumbs}
            canonicalPath="/enfoques"
        />
    )
}
export const dynamic = 'force-static'

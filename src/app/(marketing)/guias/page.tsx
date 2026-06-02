import type { Metadata } from 'next'
import { ORGANIC_CONTENT } from '@/lib/organic-leads/content'
import { getOrganicAbsoluteUrl } from '@/lib/organic-leads/routing'
import { OrganicHubLayout } from '@/components/organic-leads/organic-hub-layout'
import type { OrganicRouteKind } from '@/lib/organic-leads/routing'

export const metadata: Metadata = {
    title: 'Guías Clínicas y de Práctica Profesional | SAPIHUM',
    description: 'Colección de guías rigurosas para psicólogos sobre captación de pacientes, marketing ético, cobros por consulta, expediente clínico y organización del consultorio.',
    alternates: {
        canonical: '/guias',
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

export default function GuiasHubPage() {
    // Filter guides (content type guide)
    const guides = ORGANIC_CONTENT.filter((item) => item.contentType === 'guide')

    const breadcrumbs = [
        { name: 'SAPIHUM', url: getOrganicAbsoluteUrl('/') },
        { name: 'Guías', url: getOrganicAbsoluteUrl('/guias') },
    ]

    return (
        <OrganicHubLayout
            title="Guías de Práctica Profesional"
            serifSubtitle="construidas con rigurosidad clínica"
            description="Explora guías y manuales desarrollados para resolver la gestión cotidiana de tu consulta privada, tus estrategias de captación y tus estándares de documentación clínica."
            badge="Catálogo de Guías"
            items={guides}
            routeKindMap={ROUTE_KIND_MAP}
            breadcrumbs={breadcrumbs}
            canonicalPath="/guias"
        />
    )
}
export const dynamic = 'force-static'

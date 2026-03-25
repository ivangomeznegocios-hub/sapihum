import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { PublicEventLanding } from '@/components/catalog/public-event-landing'
import { buildEventSeoDescription, getPublicEventPath } from '@/lib/events/public'
import { getPublicCatalogEvents, getPublicEventBySlug } from '@/lib/supabase/queries/events'

interface PageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const event = await getPublicEventBySlug(slug)

    if (!event) {
        return { title: 'Curso no encontrado | Comunidad de Psicologia' }
    }

    return {
        title: event.seo_title || `${event.title} | Comunidad de Psicologia`,
        description: buildEventSeoDescription(event),
        openGraph: {
            title: event.seo_title || event.title,
            description: buildEventSeoDescription(event),
            images: event.image_url ? [{ url: event.image_url }] : undefined,
        },
        alternates: {
            canonical: getPublicEventPath(event),
        },
    }
}

export default async function CursoPublicoPage({ params }: PageProps) {
    const { slug } = await params
    const event = await getPublicEventBySlug(slug)

    if (!event) notFound()

    const canonicalPath = getPublicEventPath(event)
    if (!canonicalPath.startsWith('/cursos/')) {
        redirect(canonicalPath)
    }

    const relatedEvents = (await getPublicCatalogEvents('cursos'))
        .filter((item: any) => item.id !== event.id)
        .slice(0, 3)

    return <PublicEventLanding event={event} relatedEvents={relatedEvents} />
}

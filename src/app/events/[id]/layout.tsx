import { Metadata } from 'next'
import { buildEventSeoDescription, getPublicEventPath } from '@/lib/events/public'
import { getPublicEventById } from '@/lib/supabase/queries/events'

interface LayoutProps {
    children: React.ReactNode
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const event = await getPublicEventById(id)

    if (!event) {
        return {
            title: 'Evento no encontrado | Comunidad de Psicologia',
        }
    }

    const description = buildEventSeoDescription(event)
    const imageUrl = event.image_url || undefined

    return {
        title: event.seo_title || `${event.title} | Comunidad de Psicologia`,
        description,
        alternates: {
            canonical: getPublicEventPath(event),
        },
        openGraph: {
            title: event.seo_title || event.title,
            description,
            type: 'website',
            ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630 }] }),
        },
        twitter: {
            card: imageUrl ? 'summary_large_image' : 'summary',
            title: event.seo_title || event.title,
            description,
            ...(imageUrl && { images: [imageUrl] }),
        },
    }
}

export default function PublicEventLayout({ children }: LayoutProps) {
    return <>{children}</>
}

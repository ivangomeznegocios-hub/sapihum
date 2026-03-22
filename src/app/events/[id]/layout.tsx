import { Metadata } from 'next'
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
            title: 'Evento no encontrado | Comunidad de Psicología',
        }
    }

    const description = event.og_description || event.description || `${event.title} - Evento de la Comunidad de Psicología`
    const imageUrl = event.image_url || undefined

    return {
        title: `${event.title} | Comunidad de Psicología`,
        description: description.slice(0, 160),
        openGraph: {
            title: event.title,
            description: description.slice(0, 160),
            type: 'website',
            ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630 }] }),
        },
        twitter: {
            card: imageUrl ? 'summary_large_image' : 'summary',
            title: event.title,
            description: description.slice(0, 160),
            ...(imageUrl && { images: [imageUrl] }),
        },
    }
}

export default function PublicEventLayout({ children }: LayoutProps) {
    return <>{children}</>
}

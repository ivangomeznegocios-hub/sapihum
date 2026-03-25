import { notFound } from 'next/navigation'
import { PublicEventEmbed } from '@/components/catalog/public-event-embed'
import { getPublicEventBySlug } from '@/lib/supabase/queries/events'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function EventEmbedPage({ params }: PageProps) {
    const { slug } = await params
    const event = await getPublicEventBySlug(slug)

    if (!event || event.public_kind !== 'eventos') {
        notFound()
    }

    return <PublicEventEmbed event={event} />
}

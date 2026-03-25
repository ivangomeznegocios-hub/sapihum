import { notFound, redirect } from 'next/navigation'
import { getPublicEventById } from '@/lib/supabase/queries/events'
import { getPublicEventPath } from '@/lib/events/public'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function LegacyEmbedEventPage({ params }: PageProps) {
    const { id } = await params
    const event = await getPublicEventById(id)

    if (!event) {
        notFound()
    }

    redirect(`${getPublicEventPath(event)}/embed`)
}

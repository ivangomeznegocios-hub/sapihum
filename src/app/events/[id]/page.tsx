import { notFound, redirect } from 'next/navigation'
import { getPublicEventPath } from '@/lib/events/public'
import { getPublicEventById } from '@/lib/supabase/queries/events'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function LegacyPublicEventPage({ params }: PageProps) {
    const { id } = await params
    const event = await getPublicEventById(id)

    if (!event) {
        notFound()
    }

    redirect(getPublicEventPath(event))
}

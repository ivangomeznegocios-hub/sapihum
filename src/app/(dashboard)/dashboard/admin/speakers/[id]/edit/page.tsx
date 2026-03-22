import { notFound, redirect } from 'next/navigation'
import { getSpeakerById } from '@/lib/supabase/queries/speakers'
import { getUserProfile } from '@/lib/supabase/server'
import EditSpeakerForm from './edit-form'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditSpeakerPage({ params }: PageProps) {
    const { id } = await params
    const speaker = await getSpeakerById(id)
    const currentUser = await getUserProfile()

    if (!speaker) {
        notFound()
    }

    // Only allow admins or the speaker themselves
    if (currentUser?.role !== 'admin' && currentUser?.id !== speaker.id) {
        redirect('/dashboard/speakers')
    }

    return <EditSpeakerForm speaker={speaker} />
}

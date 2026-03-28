import { redirect } from 'next/navigation'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function RecordingEmbedRedirect({ params }: PageProps) {
    const { slug } = await params
    redirect(`/eventos/${slug}/embed`)
}

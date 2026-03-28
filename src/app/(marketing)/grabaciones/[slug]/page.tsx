import { redirect } from 'next/navigation'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function GrabacionSlugRedirect({ params }: PageProps) {
    const { slug } = await params
    redirect(`/eventos/${slug}`)
}

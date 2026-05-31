import { notFound } from 'next/navigation'
import { OrganicContentPage } from '@/components/organic-leads/organic-content-page'
import { buildOrganicMetadata, getOrganicContentByRoute, getOrganicStaticParams } from '@/lib/organic-leads/routing'

type PageProps = { params: Promise<{ slug: string }> }
const routeKind = 'tools' as const

export function generateStaticParams() {
    return getOrganicStaticParams(routeKind)
}

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params
    return buildOrganicMetadata(routeKind, slug)
}

export default async function OrganicToolPage({ params }: PageProps) {
    const { slug } = await params
    const content = getOrganicContentByRoute(routeKind, slug)
    if (!content) notFound()
    return <OrganicContentPage routeKind={routeKind} content={content} />
}

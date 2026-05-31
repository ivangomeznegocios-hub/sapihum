import type { Metadata } from 'next'
import { brandFullName, brandName } from '@/lib/brand'

export interface SeoMetadataInput {
    title: string
    description: string
    canonical: string
    image?: string | null
    robots?: Metadata['robots']
    type?: 'website' | 'article'
}

export function buildSeoMetadata(input: SeoMetadataInput): Metadata {
    const title = input.title.includes(brandName) ? input.title : `${input.title} | ${brandName}`

    return {
        title,
        description: input.description,
        alternates: {
            canonical: input.canonical,
        },
        openGraph: {
            title: input.title,
            description: input.description,
            url: input.canonical,
            type: input.type ?? 'website',
            siteName: brandFullName,
            images: input.image
                ? [{
                    url: input.image,
                    width: 1200,
                    height: 630,
                    alt: input.title,
                }]
                : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title: input.title,
            description: input.description,
            images: input.image ? [input.image] : undefined,
        },
        robots: input.robots ?? {
            index: true,
            follow: true,
        },
    }
}

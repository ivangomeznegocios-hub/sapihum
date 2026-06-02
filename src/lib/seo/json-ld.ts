import { brandName } from '@/lib/brand'
import { getAppUrl } from '@/lib/config/app-url'
import type { OrganicContentAsset, OrganicRelatedAsset } from '@/lib/organic-leads/types'

type JsonLdObject = Record<string, unknown>

function compactObject<T extends JsonLdObject>(value: T): T {
    return Object.fromEntries(
        Object.entries(value).filter(([, entryValue]) => {
            if (entryValue === undefined || entryValue === null) return false
            if (Array.isArray(entryValue) && entryValue.length === 0) return false
            return true
        })
    ) as T
}

export function serializeJsonLd(value: JsonLdObject | JsonLdObject[]) {
    return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function buildOrganizationJsonLd(): JsonLdObject {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: brandName,
        url: getAppUrl(),
    }
}

export function buildArticleJsonLd(input: {
    title: string
    description: string
    url: string
    publishedAt?: string | null
    updatedAt?: string | null
    authorName?: string | null
}) {
    return compactObject({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: input.title,
        description: input.description,
        url: input.url,
        datePublished: input.publishedAt ?? undefined,
        dateModified: input.updatedAt ?? input.publishedAt ?? undefined,
        author: input.authorName
            ? { '@type': 'Person', name: input.authorName }
            : { '@type': 'Organization', name: brandName },
        publisher: { '@type': 'Organization', name: brandName },
        inLanguage: 'es-MX',
    })
}

export function buildBreadcrumbListJsonLd(items: Array<{ name: string; url: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }
}

export function buildPersonJsonLd(input: { name: string; description?: string; url: string }) {
    return compactObject({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: input.name,
        description: input.description,
        url: input.url,
    })
}

export function buildBookJsonLd(input: { name: string; description: string; url: string; authorName?: string | null }) {
    return compactObject({
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: input.name,
        description: input.description,
        url: input.url,
        author: input.authorName ? { '@type': 'Person', name: input.authorName } : undefined,
    })
}

export function buildItemListJsonLd(input: { name: string; items: OrganicRelatedAsset[] }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: input.name,
        itemListElement: input.items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            url: `${getAppUrl()}${item.href}`,
        })),
    }
}

export function buildFAQPageJsonLd(items: Array<{ question: string; answer: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    }
}

export function buildCourseJsonLd(input: { name: string; description: string; url: string }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: input.name,
        description: input.description,
        url: input.url,
        provider: { '@type': 'Organization', name: brandName, url: getAppUrl() },
        inLanguage: 'es-MX',
    }
}

export function buildEventJsonLd(input: { name: string; description: string; url: string }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: input.name,
        description: input.description,
        url: input.url,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        organizer: { '@type': 'Organization', name: brandName, url: getAppUrl() },
    }
}

export function buildSoftwareApplicationJsonLd(input: { name: string; description: string; url: string }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: input.name,
        description: input.description,
        url: input.url,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
    }
}

export function buildOrganicContentJsonLd(input: {
    content: OrganicContentAsset
    url: string
    breadcrumbs: Array<{ name: string; url: string }>
}) {
    const schemas: JsonLdObject[] = [buildOrganizationJsonLd()]

    if (input.content.schemaTypes.includes('Article')) {
        schemas.push(buildArticleJsonLd({
            title: input.content.title,
            description: input.content.description,
            url: input.url,
            publishedAt: input.content.publishedAt,
            updatedAt: input.content.updatedAt,
            authorName: input.content.authorName,
        }))
    }

    if (input.content.schemaTypes.includes('BreadcrumbList')) {
        schemas.push(buildBreadcrumbListJsonLd(input.breadcrumbs))
    }

    if (input.content.schemaTypes.includes('Person')) {
        schemas.push(buildPersonJsonLd({
            name: input.content.authorName ?? input.content.title,
            description: input.content.description,
            url: input.url,
        }))
    }

    if (input.content.schemaTypes.includes('Book')) {
        schemas.push(buildBookJsonLd({
            name: input.content.title,
            description: input.content.description,
            url: input.url,
            authorName: input.content.authorName,
        }))
    }

    if (input.content.schemaTypes.includes('Course')) {
        schemas.push(buildCourseJsonLd({
            name: input.content.title,
            description: input.content.description,
            url: input.url,
        }))
    }

    if (input.content.schemaTypes.includes('Event')) {
        schemas.push(buildEventJsonLd({
            name: input.content.title,
            description: input.content.description,
            url: input.url,
        }))
    }

    if (input.content.schemaTypes.includes('SoftwareApplication')) {
        schemas.push(buildSoftwareApplicationJsonLd({
            name: input.content.title,
            description: input.content.description,
            url: input.url,
        }))
    }

    if (input.content.schemaTypes.includes('FAQPage') && input.content.faqs?.length) {
        schemas.push(buildFAQPageJsonLd(input.content.faqs))
    }

    if (input.content.schemaTypes.includes('ItemList') && input.content.relatedAssets.length > 0) {
        schemas.push(buildItemListJsonLd({
            name: `Relacionados con ${input.content.title}`,
            items: input.content.relatedAssets,
        }))
    }

    return serializeJsonLd(schemas)
}

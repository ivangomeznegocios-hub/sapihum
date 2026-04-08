import { createClient } from '@supabase/supabase-js'
import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/config/app-url'
import type { Database } from '@/types/database'

function createPublicSupabaseClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

function toAbsoluteUrl(baseUrl: string, pathname: string) {
    return `${baseUrl}${pathname}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const appUrl = getAppUrl()
    const supabase = createPublicSupabaseClient()

    const [eventsResponse, formationsResponse] = await Promise.all([
        (supabase
            .from('events') as any)
            .select('slug, updated_at')
            .not('status', 'eq', 'draft')
            .not('status', 'eq', 'cancelled')
            .not('slug', 'is', null),
        (supabase
            .from('formations') as any)
            .select('slug, updated_at')
            .eq('status', 'active')
            .not('slug', 'is', null),
    ])

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: toAbsoluteUrl(appUrl, '/'),
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: toAbsoluteUrl(appUrl, '/academia'),
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.95,
        },
        {
            url: toAbsoluteUrl(appUrl, '/eventos'),
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: toAbsoluteUrl(appUrl, '/formaciones'),
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: toAbsoluteUrl(appUrl, '/precios'),
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: toAbsoluteUrl(appUrl, '/blog'),
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: toAbsoluteUrl(appUrl, '/casos-de-exito'),
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.65,
        },
    ]

    const eventRoutes: MetadataRoute.Sitemap = (eventsResponse.data ?? []).map((event: { slug: string; updated_at: string }) => ({
        url: toAbsoluteUrl(appUrl, `/eventos/${event.slug}`),
        lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
    }))

    const formationRoutes: MetadataRoute.Sitemap = (formationsResponse.data ?? []).map((formation: { slug: string; updated_at: string }) => ({
        url: toAbsoluteUrl(appUrl, `/formaciones/${formation.slug}`),
        lastModified: formation.updated_at ? new Date(formation.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
    }))

    return [
        ...staticRoutes,
        ...eventRoutes,
        ...formationRoutes,
    ]
}

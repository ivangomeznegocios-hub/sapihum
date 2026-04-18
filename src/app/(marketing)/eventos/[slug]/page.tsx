import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicEventLanding } from '@/components/catalog/public-event-landing'
import { applyEventCampaignCopy, getEventCampaignForEvent } from '@/lib/events/campaigns'
import { buildEventSeoDescription, getPublicEventPath } from '@/lib/events/public'
import { getUnifiedCatalogEvents, getPublicEventBySlug } from '@/lib/supabase/queries/events'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import { getCommercialAccessContext } from '@/lib/access/commercial'
import { getActiveEntitlementForEvent } from '@/lib/events/access'
import { brandFullName } from '@/lib/brand'

interface PageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const rawEvent = await getPublicEventBySlug(slug)
    const event = rawEvent ? applyEventCampaignCopy(rawEvent) : null

    if (!event) {
        return { title: 'Evento no encontrado | SAPIHUM' }
    }

    return {
        title: event.seo_title || `${event.title} | SAPIHUM`,
        description: buildEventSeoDescription(event),
        openGraph: {
            title: event.seo_title || event.title,
            description: buildEventSeoDescription(event),
            images: event.image_url ? [{
                url: event.image_url,
                width: 1200,
                height: 630,
                alt: event.title,
            }] : undefined,
            type: 'website',
            siteName: brandFullName,
        },
        twitter: {
            card: 'summary_large_image',
            title: event.seo_title || event.title,
            description: buildEventSeoDescription(event),
            images: event.image_url ? [event.image_url] : undefined,
        },
        alternates: {
            canonical: getPublicEventPath(event),
        },
    }
}

export default async function EventoPublicoPage({ params }: PageProps) {
    const { slug } = await params
    const rawEvent = await getPublicEventBySlug(slug)
    const event = rawEvent ? applyEventCampaignCopy(rawEvent) : null

    if (!event) notFound()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const profile = user ? await getUserProfile() : null
    const commercialAccess = user && profile 
        ? await getCommercialAccessContext({ supabase, userId: user.id, profile }) 
        : null
    
    const membershipLevel = commercialAccess?.membershipLevel ?? 0

    const entitlement = user ? await getActiveEntitlementForEvent({
        supabase,
        eventId: event.id,
        userId: user.id,
        email: user.email,
    }) : null

    const allEvents = (await getUnifiedCatalogEvents()).map((item: any) => applyEventCampaignCopy(item))
    const campaign = getEventCampaignForEvent(event)
    const relatedEvents = campaign
        ? allEvents
            .filter((item: any) => item.id !== event.id && item.formation_track === campaign.formationTrack)
            .slice(0, 3)
        : allEvents
            .filter((item: any) => item.id !== event.id && (item.status === 'upcoming' || item.status === 'live'))
            .slice(0, 3)

    return (
        <PublicEventLanding 
            event={event} 
            relatedEvents={relatedEvents} 
            membershipLevel={membershipLevel}
            hasActiveMembership={commercialAccess?.hasActiveMembership ?? false}
            membershipSpecializationCode={commercialAccess?.membershipSpecializationCode ?? null}
            hasAccess={!!entitlement}
        />
    )
}

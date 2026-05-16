import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { PublicEventLanding } from '@/components/catalog/public-event-landing'
import { PublicCongressLanding } from '@/components/catalog/public-congress-landing'
import { applyEventCampaignCopy, getEventCampaignForEvent } from '@/lib/events/campaigns'
import { buildEventSeoDescription, getPublicEventPath } from '@/lib/events/public'
import {
    getCongressIncludedEvents,
    getCongressLandingByParentSlug,
    getCongressLandingForEvent,
    getCongressLandingPath,
} from '@/lib/events/congress'
import { getUnifiedCatalogEvents, getPublicEventBySlug, getPublicEventSlugs } from '@/lib/supabase/queries/events'
import { getPublicSpeakersForEventLanding } from '@/lib/supabase/queries/speakers'
import { brandFullName } from '@/lib/brand'

interface PageProps {
    params: Promise<{ slug: string }>
}

// PERF: Keep public event landings cacheable for anonymous traffic. Per-user
// access checks happen in the CTA/API flow and private hub, not in this shell.
export const revalidate = 300
export const dynamicParams = true

export async function generateStaticParams() {
    return getPublicEventSlugs()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const rawEvent = await getPublicEventBySlug(slug)
    const event = rawEvent ? applyEventCampaignCopy(rawEvent) : null

    if (!event) {
        return { title: 'Evento no encontrado | SAPIHUM' }
    }

    const congressLanding = getCongressLandingByParentSlug(event.slug)
    if (congressLanding) {
        const title = `${congressLanding.title} | ${congressLanding.subtitle} | SAPIHUM`
        const description = congressLanding.description

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: event.image_url ? [{
                    url: event.image_url,
                    width: 1200,
                    height: 630,
                    alt: `${congressLanding.title} | ${congressLanding.subtitle}`,
                }] : undefined,
                type: 'website',
                siteName: brandFullName,
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: event.image_url ? [event.image_url] : undefined,
            },
            alternates: {
                canonical: getPublicEventPath(event),
            },
        }
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

    const congressLanding = getCongressLandingByParentSlug(event.slug)
    if (congressLanding) {
        const [includedEvents, directorySpeakers] = await Promise.all([
            getCongressIncludedEvents(congressLanding, event.id),
            getPublicSpeakersForEventLanding(),
        ])

        return (
            <PublicCongressLanding
                event={event}
                config={congressLanding}
                includedEvents={includedEvents}
                directorySpeakers={directorySpeakers}
                membershipLevel={0}
                hasActiveMembership={false}
                membershipSpecializationCode={null}
                hasAccess={false}
            />
        )
    }

    const allEvents = (await getUnifiedCatalogEvents()).map((item: any) => applyEventCampaignCopy(item))
    const campaign = getEventCampaignForEvent(event)
    const congressContext = getCongressLandingForEvent(event)
    const relatedEvents = campaign
        ? allEvents
            .filter((item: any) => item.id !== event.id && item.formation_track === campaign.formationTrack)
            .slice(0, 3)
        : allEvents
            .filter((item: any) => item.id !== event.id && (item.status === 'upcoming' || item.status === 'live'))
            .slice(0, 3)

    return (
        <>
            {congressContext && (
                <section className="border-b border-brand-border bg-brand-surface-soft/80">
                    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 text-sm text-brand-text sm:flex-row sm:items-center sm:justify-between sm:px-8">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue">
                                Parte del congreso
                            </p>
                            <p className="mt-1 leading-relaxed">
                                Este encuentro forma parte de <strong>{congressContext.shortTitle}</strong> y aparece automaticamente dentro de la agenda del 20 al 31 de mayo.
                            </p>
                        </div>
                        <Link
                            href={getCongressLandingPath(congressContext)}
                            className="inline-flex items-center gap-2 font-medium text-brand-blue hover:text-brand-text-strong"
                        >
                            Volver a la landing del congreso
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            )}

            <PublicEventLanding 
                event={event} 
                relatedEvents={relatedEvents} 
                membershipLevel={0}
                hasActiveMembership={false}
                membershipSpecializationCode={null}
                hasAccess={false}
            />
        </>
    )
}

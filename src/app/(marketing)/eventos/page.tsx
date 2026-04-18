import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PublicCatalogCard } from '@/components/catalog/public-catalog-card'
import { EventCampaignSpotlight } from '@/components/catalog/event-campaign-spotlight'
import {
    applyEventCampaignCopy,
    getAllEventCampaigns,
    getCampaignEventsFromCatalog,
    getEventCampaignByKey,
    sortCampaignEventsFirst,
} from '@/lib/events/campaigns'
import { splitPublicCatalogEvents } from '@/lib/events/public'
import { getUnifiedCatalogEvents } from '@/lib/supabase/queries/events'

const eventosDescription =
    'Eventos en vivo, conferencias, talleres y webinars de la comunidad SAPIHUM. Formacion continua para profesionales de la psicologia.'

export const metadata: Metadata = {
    title: 'Eventos en Vivo | SAPIHUM',
    description: eventosDescription,
    alternates: {
        canonical: '/eventos',
    },
    openGraph: {
        title: 'Eventos en Vivo | SAPIHUM',
        description: eventosDescription,
        url: '/eventos',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Eventos en Vivo | SAPIHUM',
        description: eventosDescription,
    },
}

interface EventosPageProps {
    searchParams?: Promise<{ track?: string }>
}

export default async function EventosPage({ searchParams }: EventosPageProps) {
    const params = (await searchParams) ?? {}
    const activeCampaign = getEventCampaignByKey(params.track)
    const allItems = (await getUnifiedCatalogEvents()).map((item: any) => applyEventCampaignCopy(item))
    const items = splitPublicCatalogEvents(allItems).upcoming.filter((event: any) =>
        event.event_type !== 'course' &&
        event.event_type !== 'on_demand'
    )
    const campaignBlocks = getAllEventCampaigns()
        .map((campaign) => ({
            campaign,
            events: getCampaignEventsFromCatalog(items, campaign),
        }))
        .filter((entry) => entry.events.length > 0)

    const visibleItems = activeCampaign
        ? getCampaignEventsFromCatalog(items, activeCampaign)
        : sortCampaignEventsFirst(items)

    return (
        <div className="relative flex w-full flex-1 flex-col items-center bg-background">
            <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-background">
                <div className="sapihum-grid-bg absolute inset-0 opacity-15" />
                <div className="pointer-events-none absolute left-1/3 top-0 h-[400px] w-[400px] rounded-full bg-brand-yellow/8 blur-[120px]" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                    <div className="max-w-4xl space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-brand-yellow">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-yellow opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-yellow" />
                            </span>
                            Agenda secundaria
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                            Eventos en Vivo
                        </h1>
                        <p className="max-w-3xl text-lg leading-relaxed text-neutral-400">
                            Esta ruta funciona como vista complementaria para enlaces compartidos, filtros y agenda puntual. La experiencia principal de descubrimiento y conversion vive ahora en Academia.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/eventos">
                                <Button variant={!activeCampaign ? 'default' : 'outline'}>
                                    Ver todo
                                </Button>
                            </Link>
                            {getAllEventCampaigns().map((campaign) => (
                                <Link key={campaign.key} href={`/eventos?track=${campaign.key}`}>
                                    <Button variant={activeCampaign?.key === campaign.key ? 'default' : 'outline'}>
                                        {campaign.title}
                                    </Button>
                                </Link>
                            ))}
                            <Link href="/academia" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-yellow transition-colors hover:text-brand-yellow">
                                &larr; Ir al hub principal en Academia
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
            </section>

            {campaignBlocks.length > 0 && (
                <section className="w-full px-4 py-10 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl space-y-6">
                        {campaignBlocks.map(({ campaign, events }) => (
                            <EventCampaignSpotlight
                                key={campaign.key}
                                campaign={campaign}
                                events={events}
                                sourceSurface="events_index"
                                redirectAfterDownload
                                secondaryHref={activeCampaign?.key === campaign.key ? '/eventos' : `/eventos?track=${campaign.key}`}
                                secondaryLabel={activeCampaign?.key === campaign.key ? 'Mostrar todos los eventos' : 'Ver solo este bloque'}
                            />
                        ))}
                    </div>
                </section>
            )}

            <section className="w-full px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    {visibleItems.length > 0 ? (
                        <>
                            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-yellow">
                                        {activeCampaign ? 'Filtro activo' : 'Agenda general'}
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                                        {activeCampaign ? activeCampaign.title : 'Todos los eventos activos'}
                                    </h2>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {visibleItems.length} {visibleItems.length === 1 ? 'evento disponible' : 'eventos disponibles'}
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {visibleItems.map((event: any) => (
                                    <PublicCatalogCard key={event.id} event={event} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-3xl border-2 border-dashed border-border/40 bg-gradient-to-br from-muted/30 to-muted/10 px-6 py-20 text-center">
                            <div className="mx-auto max-w-sm space-y-4">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-3xl">
                                    Eventos
                                </div>
                                <h2 className="text-xl font-bold">Proximamente</h2>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Estamos preparando nuevos eventos en vivo. Mientras tanto, explora todo nuestro catalogo de formacion.
                                </p>
                                <Link href="/academia">
                                    <Button variant="outline" className="mt-3 gap-2">
                                        Explorar catalogo completo
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

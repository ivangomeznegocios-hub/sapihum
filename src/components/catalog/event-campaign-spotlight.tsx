import Link from 'next/link'
import { ArrowRight, CalendarDays, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    getCampaignPrimaryEvent,
    getCampaignPrimaryEventPath,
    type EventCampaignConfig,
    type EventCampaignKey,
} from '@/lib/events/campaigns'
import { DEFAULT_TIMEZONE } from '@/lib/timezone'
import { CampaignLeadMagnetButton } from './campaign-lead-magnet-button'

function formatShortDate(date: string | null | undefined) {
    if (!date) return 'Fecha por confirmar'
    return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: DEFAULT_TIMEZONE,
    }).format(new Date(date))
}

interface EventCampaignSpotlightProps {
    campaign: EventCampaignConfig
    events: any[]
    sourceSurface: string
    redirectAfterDownload?: boolean
    secondaryHref?: string | null
    secondaryLabel?: string | null
}

export function EventCampaignSpotlight({
    campaign,
    events,
    sourceSurface,
    redirectAfterDownload = false,
    secondaryHref,
    secondaryLabel,
}: EventCampaignSpotlightProps) {
    const primaryEvent = events.find((event) => event.slug === campaign.primaryEventSlug) ?? events[0] ?? getCampaignPrimaryEvent(campaign)
    const primaryEventPath = getCampaignPrimaryEventPath(campaign)

    return (
        <article className="relative overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-sm shadow-black/5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(246,174,2,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(122,86,2,0.12),transparent_32%)]" />
            <div className="relative grid gap-8 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-yellow">
                            Ruta activa
                        </span>
                        <span className="inline-flex rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                            {events.length} {events.length === 1 ? 'evento listo para impulsar' : 'eventos listos para impulsar'}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            {campaign.title}
                        </h2>
                        <p className="max-w-3xl text-base leading-relaxed text-foreground/90 md:text-lg">
                            {campaign.promise}
                        </p>
                        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                            {campaign.summary}
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        {campaign.events.map((event) => {
                            const liveEvent = events.find((item) => item.slug === event.slug)
                            const href = `/eventos/${event.slug}`

                            return (
                                <Link
                                    key={event.slug}
                                    href={href}
                                    className="group rounded-2xl border border-border/60 bg-background/75 p-4 transition-colors hover:border-brand-yellow/30 hover:bg-background"
                                >
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-yellow">
                                        {liveEvent?.slug === primaryEvent?.slug ? 'Evento prioritario' : 'Agenda del bloque'}
                                    </p>
                                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-brand-yellow">
                                        {liveEvent?.title || event.title}
                                    </h3>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        <span>{formatShortDate(liveEvent?.start_time)}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="rounded-[24px] border border-border/60 bg-background/85 p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Proximo paso recomendado
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-foreground">
                        {primaryEvent?.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Empieza por el evento mas cercano y deja tus datos si quieres recibir el temario completo del bloque.
                    </p>

                    <div className="mt-5 space-y-3">
                        <Link href={primaryEventPath} className="block">
                            <Button className="w-full justify-between">
                                Ver evento principal
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>

                        <CampaignLeadMagnetButton
                            campaignKey={campaign.key as EventCampaignKey}
                            eventId={primaryEvent?.id ?? null}
                            eventSlug={primaryEvent?.slug ?? campaign.primaryEventSlug}
                            sourceSurface={sourceSurface}
                            triggerLabel="Descargar temario"
                            redirectAfterSuccess={redirectAfterDownload}
                            className="w-full"
                        />

                        {secondaryHref && secondaryLabel && (
                            <Link href={secondaryHref} className="block">
                                <Button variant="ghost" className="w-full justify-between">
                                    <span className="inline-flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        {secondaryLabel}
                                    </span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}

                        <p className="flex items-start gap-2 rounded-xl border border-brand-yellow/20 bg-brand-yellow/10 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
                            <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-yellow" />
                            El temario entrega el objetivo del bloque, temas clave, perfil ideal y el siguiente evento recomendado para avanzar.
                        </p>
                    </div>
                </div>
            </div>
        </article>
    )
}

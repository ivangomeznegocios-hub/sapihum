import Link from 'next/link'
import { ArrowRight, CalendarDays, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type EventCampaignConfig, type EventCampaignKey, getCampaignPrimaryEvent, getCampaignPrimaryEventPath } from '@/lib/events/campaigns'
import { DEFAULT_TIMEZONE } from '@/lib/timezone'
import { cn } from '@/lib/utils'
import { CampaignLeadMagnetButton } from './campaign-lead-magnet-button'
import { CampaignLeadMagnetInline } from './campaign-lead-magnet-inline'

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

function getCampaignPalette(campaignKey: EventCampaignKey) {
    if (campaignKey === 'forense') {
        return {
            shell: 'border-white/10 bg-[linear-gradient(145deg,#080808_10%,#120f0a_55%,#050505_100%)]',
            glow: 'bg-[radial-gradient(circle_at_top_right,rgba(246,174,2,0.2),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(122,86,2,0.18),transparent_28%)]',
            badge: 'border-brand-yellow/20 bg-brand-yellow/10 text-brand-yellow',
            accentPanel: 'border-white/10 bg-black/25',
        }
    }

    return {
        shell: 'border-white/10 bg-[linear-gradient(145deg,#080808_10%,#0b1012_55%,#050505_100%)]',
        glow: 'bg-[radial-gradient(circle_at_top_right,rgba(192,191,188,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(246,174,2,0.14),transparent_28%)]',
        badge: 'border-white/15 bg-white/10 text-white',
        accentPanel: 'border-white/10 bg-black/25',
    }
}

type SpotlightVariant = 'utility' | 'editorial' | 'home' | 'compact'

interface EventCampaignSpotlightProps {
    campaign: EventCampaignConfig
    events: any[]
    sourceSurface: string
    redirectAfterDownload?: boolean
    secondaryHref?: string | null
    secondaryLabel?: string | null
    variant?: SpotlightVariant
    showLeadCapture?: boolean
    primaryHref?: string | null
    primaryLabel?: string | null
}

function CampaignEventList({
    campaign,
    events,
    compact = false,
}: {
    campaign: EventCampaignConfig
    events: any[]
    compact?: boolean
}) {
    return (
        <div className={cn('grid gap-3', compact ? 'md:grid-cols-1' : 'md:grid-cols-3')}>
            {campaign.events.map((campaignEvent) => {
                const liveEvent = events.find((item) => item.slug === campaignEvent.slug)
                const href = `/eventos/${campaignEvent.slug}`
                const speakerName = liveEvent?.speakers?.[0]?.speaker?.profile?.full_name || null

                return (
                    <Link
                        key={campaignEvent.slug}
                        href={href}
                        className="group rounded-[22px] border border-white/10 bg-black/20 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-yellow/30 hover:bg-black/30"
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-yellow/80">
                            {liveEvent?.slug === campaign.primaryEventSlug ? 'Evento ancla' : 'Ruta activa'}
                        </p>
                        <h3 className={cn('mt-2 font-semibold text-white transition-colors group-hover:text-brand-yellow', compact ? 'text-sm' : 'text-sm md:text-base')}>
                            {liveEvent?.title || campaignEvent.title}
                        </h3>
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-brand-yellow" />
                                {formatShortDate(liveEvent?.start_time)}
                            </span>
                            {speakerName && <span className="line-clamp-1">{speakerName}</span>}
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}

export function EventCampaignSpotlight({
    campaign,
    events,
    sourceSurface,
    redirectAfterDownload = false,
    secondaryHref,
    secondaryLabel,
    variant = 'utility',
    showLeadCapture,
    primaryHref,
    primaryLabel,
}: EventCampaignSpotlightProps) {
    const primaryEvent = events.find((event) => event.slug === campaign.primaryEventSlug) ?? events[0] ?? getCampaignPrimaryEvent(campaign)
    const primaryEventPath = primaryHref || getCampaignPrimaryEventPath(campaign)
    const palette = getCampaignPalette(campaign.key)
    const academiaTrackHref = `/academia?track=${campaign.key}`
    const includeLeadCapture = showLeadCapture ?? variant === 'editorial'

    if (variant === 'home') {
        return (
            <article className={cn('relative overflow-hidden rounded-[32px] border p-7 shadow-2xl shadow-black/20', palette.shell)}>
                <div className={cn('pointer-events-none absolute inset-0', palette.glow)} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div className="relative space-y-6">
                    <div className="space-y-4">
                        <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]', palette.badge)}>
                            Rutas activas ahora
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-bold tracking-tight text-white">
                                {campaign.title}
                            </h3>
                            <p className="text-base leading-relaxed text-neutral-200">
                                {campaign.promise}
                            </p>
                            <p className="text-sm leading-relaxed text-neutral-400">
                                {campaign.summary}
                            </p>
                        </div>
                    </div>

                    <CampaignEventList campaign={campaign} events={events} compact />

                    <div className="flex flex-wrap gap-3">
                        <Link href={academiaTrackHref}>
                            <Button className="gap-2">
                                Explorar ruta en Academia
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href={primaryEventPath}>
                            <Button variant="outline" className="gap-2">
                                Ver evento ancla
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </article>
        )
    }

    if (variant === 'compact') {
        return (
            <article className={cn('relative overflow-hidden rounded-[30px] border p-6 shadow-2xl shadow-black/20', palette.shell)}>
                <div className={cn('pointer-events-none absolute inset-0', palette.glow)} />
                <div className="relative space-y-5">
                    <div className="space-y-3">
                        <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]', palette.badge)}>
                            Agenda activa
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight text-white">{campaign.title}</h3>
                        <p className="max-w-3xl text-sm leading-relaxed text-neutral-300">
                            Empieza por la ruta activa y usa Academia como el punto principal para explorar agenda, registro y temario.
                        </p>
                    </div>

                    <CampaignEventList campaign={campaign} events={events} compact />

                    <div className="flex flex-wrap gap-3">
                        <Link href={academiaTrackHref}>
                            <Button className="gap-2">
                                Ver ruta en Academia
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href={primaryEventPath}>
                            <Button variant="outline" className="gap-2">
                                Ver evento principal
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </article>
        )
    }

    if (variant === 'editorial') {
        return (
            <article className={cn('relative overflow-hidden rounded-[34px] border p-6 shadow-2xl shadow-black/25 md:p-8', palette.shell)}>
                <div className={cn('pointer-events-none absolute inset-0', palette.glow)} />
                <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_380px] lg:items-start">
                    <div className="space-y-7">
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]', palette.badge)}>
                                    Ruta activa
                                </span>
                                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300">
                                    {campaign.events.length} {campaign.events.length === 1 ? 'evento clave' : 'eventos conectados'}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <h2 className="max-w-4xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                                    {campaign.title}
                                </h2>
                                <p className="max-w-4xl text-lg leading-relaxed text-neutral-200">
                                    {campaign.promise}
                                </p>
                                <p className="max-w-3xl text-sm leading-relaxed text-neutral-400 md:text-base">
                                    {campaign.summary}
                                </p>
                            </div>
                        </div>

                        <CampaignEventList campaign={campaign} events={events} />

                        <div className="flex flex-wrap gap-3">
                            <Link href={primaryEventPath}>
                                <Button className="gap-2">
                                    {primaryLabel || 'Ver evento principal'}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href={academiaTrackHref}>
                                <Button variant="outline" className="gap-2">
                                    Ver ruta filtrada
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </Link>
                            {secondaryHref && secondaryLabel && (
                                <Link href={secondaryHref}>
                                    <Button variant="ghost" className="gap-2">
                                        {secondaryLabel}
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className={cn('rounded-[28px] border p-1', palette.accentPanel)}>
                        {includeLeadCapture ? (
                            <CampaignLeadMagnetInline
                                campaignKey={campaign.key}
                                eventId={primaryEvent?.id ?? null}
                                eventSlug={primaryEvent?.slug ?? campaign.primaryEventSlug}
                                sourceSurface={sourceSurface}
                                redirectAfterSuccess={redirectAfterDownload}
                                compact
                                eyebrow="Temario de la ruta"
                                title={`Recibe el temario de ${campaign.title}`}
                                description="Deja tus datos y te enviamos el PDF del bloque con la agenda activa y el evento recomendado para empezar."
                                submitLabel="Quiero el temario"
                                className="border-transparent bg-transparent shadow-none"
                            />
                        ) : (
                            <div className="space-y-4 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                                    Evento ancla
                                </p>
                                <h3 className="text-2xl font-bold text-white">{primaryEvent?.title}</h3>
                                <p className="text-sm leading-relaxed text-neutral-400">
                                    Empieza por el encuentro mas cercano y usa esta ruta para mantener continuidad entre eventos relacionados.
                                </p>
                                <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-neutral-300">
                                    <p className="font-medium text-white">Fecha recomendada</p>
                                    <p className="mt-2 inline-flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 text-brand-yellow" />
                                        {formatShortDate(primaryEvent?.start_time)}
                                    </p>
                                </div>
                                <Link href={primaryEventPath}>
                                    <Button className="w-full gap-2">
                                        Ver evento
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </article>
        )
    }

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

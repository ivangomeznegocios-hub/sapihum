import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarDays, CheckCircle2, Filter, Sparkles } from 'lucide-react'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { AcademiaCatalog } from '@/components/catalog/academia-catalog'
import { CampaignLeadMagnetInline } from '@/components/catalog/campaign-lead-magnet-inline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    applyEventCampaignCopy,
    getAllEventCampaigns,
    getCampaignEventsFromCatalog,
    getEventCampaignByKey,
    getCampaignPrimaryEventPath,
    type EventCampaignConfig,
} from '@/lib/events/campaigns'
import { getPublicEventPath, splitPublicCatalogEvents } from '@/lib/events/public'
import { getSpecializationByCode } from '@/lib/specializations'
import { getUnifiedCatalogEvents } from '@/lib/supabase/queries/events'
import { getPublicFormations } from '@/app/(marketing)/formaciones/actions'
import { DEFAULT_TIMEZONE, formatEventDate, formatEventTime } from '@/lib/timezone'

export const metadata: Metadata = {
    title: 'Academia SAPIHUM | Formacion Continua en Psicologia',
    description: 'Explora el catalogo completo de formacion continua: encuentros en vivo, talleres y supervision clinica para profesionales de la psicologia.',
    alternates: {
        canonical: '/academia',
    },
    openGraph: {
        title: 'Academia SAPIHUM | Formacion Continua en Psicologia',
        description: 'Encuentros en vivo, talleres y supervision clinica. Desarrollo profesional con respaldo cientifico.',
        url: '/academia',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Academia SAPIHUM | Formacion Continua en Psicologia',
        description: 'Encuentros en vivo, talleres y supervision clinica. Desarrollo profesional con respaldo cientifico.',
    },
}

function formatCurrency(value: number | null | undefined) {
    return `$${Number(value || 0)} MXN`
}

function formatHours(value: number | null | undefined) {
    const hours = Number(value || 0)
    if (!hours) return null
    return Number.isInteger(hours) ? `${hours} horas` : `${hours.toFixed(1)} horas`
}

interface AcademiaPageProps {
    searchParams?: Promise<{ track?: string }>
}

export default async function AcademiaPage({ searchParams }: AcademiaPageProps) {
    const params = (await searchParams) ?? {}
    const [allEvents, formations] = await Promise.all([
        getUnifiedCatalogEvents(),
        getPublicFormations(),
    ])

    const normalizedEvents = allEvents.map((event: any) => applyEventCampaignCopy(event))
    const { upcoming, past } = splitPublicCatalogEvents(normalizedEvents)
    const activeCampaign = getEventCampaignByKey(params.track)
    const campaignBlocks = getAllEventCampaigns()
        .map((campaign) => ({
            campaign,
            events: getCampaignEventsFromCatalog(upcoming, campaign),
        }))

    const visibleCampaignBlocks = activeCampaign
        ? campaignBlocks.filter((entry) => entry.campaign.key === activeCampaign.key)
        : campaignBlocks

    const visibleUpcoming = activeCampaign
        ? visibleCampaignBlocks[0]?.events ?? []
        : upcoming

    const featuredEvent = activeCampaign
        ? visibleCampaignBlocks[0]?.events[0] ?? upcoming.find((event: any) => event.image_url) ?? upcoming[0]
        : campaignBlocks[0]?.events[0] ?? upcoming.find((event: any) => event.image_url) ?? upcoming[0]

    return (
        <div className="relative flex w-full flex-1 flex-col items-center bg-background">
            <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-background">
                <div className="sapihum-grid-bg pointer-events-none absolute inset-0 opacity-10" />
                <div className="pointer-events-none absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-brand-yellow/5 blur-[150px]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-brand-brown/5 blur-[140px]" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
                        <div className="flex flex-col">
                            <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-sm border border-brand-yellow/20 bg-brand-yellow/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-yellow" />
                                </span>
                                {activeCampaign
                                    ? `Ruta destacada: ${activeCampaign.title}`
                                    : `${campaignBlocks.length} rutas destacadas y ${upcoming.length} encuentro${upcoming.length !== 1 ? 's' : ''} disponibles`}
                            </div>

                            <h1 className="mb-6 text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-6xl">
                                {activeCampaign ? 'La ruta recomendada para avanzar en' : 'Formacion continua para psicologos que quieren avanzar con mas'}{' '}
                                <span className="font-serif italic font-normal text-[#c0bfbc]">
                                    {activeCampaign ? activeCampaign.title.toLowerCase() : 'criterio, profundidad y aplicacion real'}
                                </span>
                            </h1>

                            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-neutral-400/90 md:text-xl">
                                {activeCampaign
                                    ? activeCampaign.promise
                                    : 'Explora rutas destacadas, encuentros en vivo y programas completos para seguir formandote con claridad, respaldo academico y una siguiente accion evidente en cada paso.'}
                            </p>

                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                <a href="#rutas-activas">
                                    <Button size="lg" className="h-12 w-full px-7 font-bold uppercase text-xs tracking-[0.1em] sm:w-auto">
                                        Ver rutas destacadas
                                    </Button>
                                </a>
                                <a href="#catalogo">
                                    <Button size="lg" variant="outline" className="h-12 w-full px-7 font-bold uppercase text-xs tracking-[0.1em] sm:w-auto">
                                        Explorar agenda
                                    </Button>
                                </a>
                                <Link href="/formaciones">
                                    <Button size="lg" variant="outline" className="h-12 w-full px-7 text-sm font-semibold backdrop-blur-sm sm:w-auto">
                                        Ver formaciones
                                    </Button>
                                </Link>
                            </div>

                            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
                                <Link href="/academia" className="block sm:w-auto">
                                    <Button variant={!activeCampaign ? 'default' : 'outline'} size="sm" className="!h-auto !whitespace-normal w-full justify-start px-4 py-3 text-left sm:w-auto sm:justify-center sm:text-center">
                                        Toda la academia
                                    </Button>
                                </Link>
                                {campaignBlocks.map(({ campaign }) => (
                                    <Link key={campaign.key} href={`/academia?track=${campaign.key}`} className="block sm:w-auto">
                                        <Button
                                            variant={activeCampaign?.key === campaign.key ? 'default' : 'outline'}
                                            size="sm"
                                            className="!h-auto !whitespace-normal w-full justify-start px-4 py-3 text-left sm:w-auto sm:justify-center sm:text-center"
                                        >
                                            {campaign.title}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {featuredEvent && (
                            <div className="hidden lg:block">
                                <FeaturedEventCard event={featuredEvent} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </section>

            {visibleCampaignBlocks.length > 0 && (
                <section id="rutas-activas" className="scroll-mt-20 w-full px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                    <div className="mx-auto max-w-7xl space-y-10">
                        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,#090909_15%,#121212_58%,#050505_100%)] p-6 shadow-2xl shadow-black/25 md:p-8">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(246,174,2,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(192,191,188,0.12),transparent_30%)]" />
                            <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                                            {activeCampaign ? 'Ruta destacada' : 'Rutas destacadas'}
                                        </p>
                                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
                                            {activeCampaign ? activeCampaign.title : 'Empieza por la ruta que mejor encaja con tu practica'}
                                        </h2>
                                        <p className="mt-4 max-w-3xl text-base leading-relaxed text-neutral-300 md:text-lg">
                                            {activeCampaign
                                                ? 'Esta ruta concentra el evento recomendado para empezar, el recorrido sugerido y el temario para ayudarte a decidir con mas claridad.'
                                                : 'Cada ruta te muestra el evento recomendado para comenzar, los siguientes pasos del recorrido y un temario descargable para revisar el detalle antes de inscribirte.'}
                                        </p>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow">Ruta guiada</p>
                                            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                                                Ve el orden sugerido para avanzar sin perderte entre demasiadas opciones.
                                            </p>
                                        </div>
                                        <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow">Evento recomendado</p>
                                            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                                                Cada bloque te dice por donde conviene empezar hoy.
                                            </p>
                                        </div>
                                        <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow">Temario descargable</p>
                                            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                                                Recibe el PDF con temas clave, enfoque y siguiente paso recomendado.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[28px] border border-white/10 bg-black/30 p-5">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-yellow">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Como empezar
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        {[
                                            'Elige la ruta que mejor se acerca a tu practica actual.',
                                            'Revisa el encuentro recomendado para entrar con mas claridad.',
                                            'Si quieres mas detalle, pide el temario y decide con mejor contexto.',
                                        ].map((step, index) => (
                                            <div key={step} className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white">
                                                    {index + 1}
                                                </div>
                                                <p className="text-sm leading-relaxed text-neutral-300">{step}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex flex-col gap-3">
                                        {activeCampaign ? (
                                            <Link href="/academia#catalogo">
                                                <Button className="w-full justify-between">
                                                    Ver agenda de esta ruta
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        ) : (
                                            <a href="#catalogo">
                                                <Button className="w-full justify-between">
                                                    Ver agenda completa
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        )}
                                        <Link href="/formaciones">
                                            <Button variant="outline" className="w-full justify-between">
                                                Ver formaciones completas
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {visibleCampaignBlocks.map(({ campaign, events }) => (
                                <AcademiaRouteLeadCard
                                    key={campaign.key}
                                    campaign={campaign}
                                    events={events}
                                    isFocusedView={activeCampaign?.key === campaign.key}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section id="catalogo" className="scroll-mt-20 w-full px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                                Agenda en vivo
                            </p>
                            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                                {activeCampaign ? `Eventos de ${activeCampaign.title}` : 'Proximos encuentros'}
                            </h2>
                            <p className="mt-2 max-w-2xl text-muted-foreground">
                                {activeCampaign
                                    ? 'Aqui ves solo los encuentros de esta ruta para mantener la decision mas simple y enfocada.'
                                    : 'Encuentra lo que viene en camino. Filtra por area tematica, formato o busca por nombre.'}
                            </p>
                        </div>
                        {activeCampaign && (
                            <div className="flex flex-wrap gap-3">
                                <Link href="/academia">
                                    <Button variant="outline">Ver todas las rutas</Button>
                                </Link>
                                <Link href={getCampaignPrimaryEventPath(activeCampaign)}>
                                    <Button>Ver evento recomendado</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                    <AcademiaCatalog events={visibleUpcoming} />
                </div>
            </section>

            {formations.length > 0 && (
                <section className="w-full border-y border-border/60 bg-[#050505] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                                    Formaciones completas
                                </p>
                                <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                                    Programas listos para comprar y cursar por ruta
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400 md:text-base">
                                    Despues de revisar la agenda activa, aqui puedes pasar a programas completos con una compra y un recorrido guiado.
                                </p>
                            </div>
                            <Link href="/formaciones" className="shrink-0">
                                <Button variant="outline" className="font-bold uppercase text-[10px] tracking-[0.1em]">
                                    Ver todas las formaciones
                                </Button>
                            </Link>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {formations.map((formation) => {
                                const specialization = getSpecializationByCode(formation.specialization_code)
                                const totalHours = formatHours(formation.total_hours)

                                return (
                                    <article
                                        key={formation.id}
                                        className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-brand-yellow/30 hover:shadow-2xl hover:shadow-black/20"
                                    >
                                        <div className="grid h-full gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                                            <div className="relative min-h-[220px] overflow-hidden bg-gradient-to-br from-brand-yellow/20 via-black to-brand-brown/40">
                                                {formation.image_url ? (
                                                    <Image
                                                        src={formation.image_url}
                                                        alt={formation.title}
                                                        fill
                                                        unoptimized
                                                        sizes="(min-width: 1024px) 50vw, 100vw"
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <BrandWordmark className="text-2xl text-white/10 sm:text-3xl lg:text-4xl lg:tracking-[0.18em]" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                                <div className="absolute left-4 top-4">
                                                    <span className="inline-flex rounded-full bg-brand-yellow px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
                                                        Formacion
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex h-full flex-col p-6 md:p-7">
                                                <div className="mb-4 flex flex-wrap gap-2">
                                                    {specialization && (
                                                        <Badge variant="outline" className="border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow">
                                                            {specialization.name}
                                                        </Badge>
                                                    )}
                                                    {totalHours && (
                                                        <Badge variant="outline" className="border-white/10 bg-white/5 text-neutral-200">
                                                            {totalHours}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="border-white/10 bg-white/5 text-neutral-200">
                                                        Programa completo
                                                    </Badge>
                                                </div>

                                                <h3 className="text-2xl font-bold leading-tight text-white">
                                                    {formation.title}
                                                </h3>

                                                {formation.subtitle && (
                                                    <p className="mt-2 text-base font-medium text-neutral-300">
                                                        {formation.subtitle}
                                                    </p>
                                                )}

                                                {formation.description && (
                                                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-neutral-400">
                                                        {formation.description}
                                                    </p>
                                                )}

                                                <div className="flex-1" />

                                                <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                                                            Inversion completa
                                                        </p>
                                                        <p className="mt-1 text-2xl font-black text-white">
                                                            {formatCurrency(formation.bundle_price)}
                                                        </p>
                                                    </div>
                                                    <Link href={`/formaciones/${formation.slug}`}>
                                                        <Button className="w-full font-bold uppercase text-xs tracking-[0.1em] sm:w-auto">
                                                            Ver programa completo
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {past.length > 0 && (
                <section className="w-full px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                    <div className="mx-auto max-w-7xl border-t border-border/60 pt-16">
                        <div className="mb-10">
                            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Eventos pasados</h2>
                        </div>
                        <AcademiaCatalog events={past} />
                    </div>
                </section>
            )}

            <section className="w-full px-4 py-16">
                <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
                    <div className="sapihum-grid-bg absolute inset-0 opacity-10" />
                    <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-yellow/5 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-brand-brown/3 blur-3xl" />

                    <div className="relative z-10 p-8 text-center text-white md:p-14">
                        <div className="mb-3 inline-flex items-center gap-1 rounded-sm border border-brand-yellow/20 bg-brand-yellow/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-yellow">
                            Beneficio de membresia
                        </div>
                        <h3 className="mb-4 text-2xl font-bold md:text-3xl">La Academia esta incluida en tu membresia</h3>
                        <p className="mx-auto mb-8 max-w-2xl text-neutral-400/90 md:text-lg">
                            Al suscribirte a SAPIHUM, obtienes acceso a encuentros exclusivos, precios preferenciales y una comunidad de aprendizaje continuo.
                        </p>
                        <Link href="/precios">
                            <Button size="lg" className="h-13 px-8 font-bold uppercase text-xs tracking-[0.1em]">
                                Ver planes y precios
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

function formatRouteDateTime(dateStr: string | null | undefined) {
    if (!dateStr) return 'Fecha por anunciar'
    return `${formatEventDate(dateStr, DEFAULT_TIMEZONE)} | ${formatEventTime(dateStr, DEFAULT_TIMEZONE)}`
}

function AcademiaRouteLeadCard({
    campaign,
    events,
    isFocusedView,
}: {
    campaign: EventCampaignConfig
    events: any[]
    isFocusedView: boolean
}) {
    const primaryEvent = events.find((event) => event.slug === campaign.primaryEventSlug) ?? events[0] ?? null
    const primaryEventHref = primaryEvent
        ? getPublicEventPath(primaryEvent)
        : isFocusedView
            ? `#temario-${campaign.key}`
            : `/academia?track=${campaign.key}#temario-${campaign.key}`
    const routeHref = `/academia?track=${campaign.key}`
    const deliverables = [
        'PDF detallado con la agenda activa de la ruta.',
        'Objetivo del bloque y temas clave para ubicarte rapido.',
        'Perfil ideal para saber si esta ruta encaja contigo.',
        'Siguiente paso recomendado para avanzar sin adivinar.',
    ]
    const stepLabels = ['Evento recomendado', 'Siguiente paso', 'Profundiza']

    return (
        <article className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,#080808_12%,#100f0d_58%,#050505_100%)] p-6 shadow-2xl shadow-black/25 md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(246,174,2,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(122,86,2,0.14),transparent_30%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="relative space-y-7">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-yellow">
                            Ruta destacada
                        </span>
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300">
                            {campaign.events.length} {campaign.events.length === 1 ? 'paso recomendado' : 'pasos sugeridos'}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <h3 className="max-w-4xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                            {campaign.title}
                        </h3>
                        <p className="max-w-4xl text-lg leading-relaxed text-neutral-200">
                            {campaign.promise}
                        </p>
                        <p className="max-w-3xl text-sm leading-relaxed text-neutral-400 md:text-base">
                            {campaign.summary}
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-start">
                    <div className="order-2 space-y-6 lg:order-1">
                        <div className="rounded-[30px] border border-white/10 bg-black/20 p-5 md:p-6">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow">
                                        Recorrido sugerido
                                    </p>
                                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-300">
                                        Empieza por un punto claro y avanza por la ruta con una sensacion real de progreso, no como si estuvieras viendo un catalogo suelto.
                                    </p>
                                </div>
                                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300">
                                    {campaign.events.length} {campaign.events.length === 1 ? 'etapa visible' : 'etapas conectadas'}
                                </span>
                            </div>

                            <div className="relative space-y-4">
                                <div className="pointer-events-none absolute bottom-6 left-[1rem] top-6 w-px bg-[linear-gradient(to_bottom,rgba(246,174,2,0.55),rgba(255,255,255,0.06))] md:left-[1.1rem]" />
                                {campaign.events.map((routeEvent, index) => {
                                    const liveEvent = events.find((event) => event.slug === routeEvent.slug)
                                    const stepHref = liveEvent ? getPublicEventPath(liveEvent) : routeHref
                                    const stepLabel = stepLabels[index] || `Paso ${index + 1}`

                                    return (
                                        <Link
                                            key={routeEvent.slug}
                                            href={stepHref}
                                            className="group relative flex gap-4 rounded-[26px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-yellow/30 hover:bg-black/30"
                                        >
                                            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-yellow/30 bg-[#14110a] text-xs font-bold text-brand-yellow shadow-[0_0_18px_rgba(246,174,2,0.18)]">
                                                {index + 1}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow">
                                                        {stepLabel}
                                                    </p>
                                                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-neutral-300">
                                                        {liveEvent ? formatRouteDateTime(liveEvent.start_time) : 'Fecha por anunciar'}
                                                    </span>
                                                </div>
                                                <h4 className="mt-2 text-lg font-semibold leading-snug text-white transition-colors group-hover:text-brand-yellow">
                                                    {liveEvent?.title || routeEvent.title}
                                                </h4>
                                                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-400">
                                                    {liveEvent?.subtitle || routeEvent.subtitle}
                                                </p>
                                            </div>

                                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-500 transition-colors group-hover:text-brand-yellow" />
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow">
                                        Para quien encaja mejor
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                                        Si te reconoces en uno de estos perfiles, esta ruta ya te da un siguiente paso mucho mas claro.
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                                    <Sparkles className="h-3.5 w-3.5 text-brand-yellow" />
                                    Decision mas simple
                                </span>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                {campaign.temario.idealFor.slice(0, 3).map((item) => (
                                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-neutral-300">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="order-1 relative lg:order-2">
                        <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(246,174,2,0.22),transparent_52%)] blur-2xl" />
                        <div className="relative overflow-hidden rounded-[32px] border border-brand-yellow/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-6 lg:sticky lg:top-24">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(246,174,2,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_55%)]" />
                            <div className="relative space-y-6">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/20 bg-[#1a1407] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-yellow">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Descarga premium
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                                            Recurso de decision
                                        </p>
                                        <h3 className="text-3xl font-bold leading-tight text-white">
                                            Recibe <span className="font-serif text-[1.05em] italic font-normal text-[#f3d27d]">El Temario Oficial</span>
                                        </h3>
                                        <p className="text-sm leading-relaxed text-neutral-300">
                                            No es un flyer generico. Es el PDF con la agenda activa, el enfoque del bloque y la recomendacion concreta para saber por donde empezar.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-[26px] border border-white/10 bg-black/25 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow">
                                        Lo que obtienes al descargarlo
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        {deliverables.map((item) => (
                                            <div key={item} className="flex items-start gap-3 text-sm leading-relaxed text-neutral-200">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                                                <p>{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[26px] border border-white/10 bg-black/25 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                                        Evento recomendado para empezar
                                    </p>
                                    <h4 className="mt-3 text-2xl font-bold leading-tight text-white">
                                        {primaryEvent ? primaryEvent.title : campaign.title}
                                    </h4>
                                    <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                                        {primaryEvent
                                            ? `Si ya vienes decidido, este es el punto de entrada mas claro dentro de ${campaign.title.toLowerCase()}.`
                                            : 'Si primero quieres contexto antes de inscribirte, pide el temario y te dejamos lista la recomendacion inicial.'}
                                    </p>

                                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                                            {primaryEvent ? 'Fecha sugerida' : 'Ruta lista para revisar'}
                                        </p>
                                        <p className="mt-2 inline-flex items-center gap-2 text-sm text-white">
                                            <CalendarDays className="h-4 w-4 text-brand-yellow" />
                                            {primaryEvent ? formatRouteDateTime(primaryEvent.start_time) : 'Solicitud inmediata del temario'}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3">
                                        <Link href={primaryEventHref}>
                                            <Button className="w-full justify-between">
                                                {primaryEvent ? 'Ver evento recomendado' : 'Ver ruta y recibir temario'}
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={isFocusedView ? '/academia' : routeHref}>
                                            <Button variant="outline" className="w-full justify-between">
                                                {isFocusedView ? 'Ver todas las rutas' : 'Ver solo esta ruta'}
                                                {isFocusedView ? <Filter className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                <CampaignLeadMagnetInline
                                    campaignKey={campaign.key}
                                    eventId={primaryEvent?.id ?? null}
                                    eventSlug={primaryEvent?.slug ?? campaign.primaryEventSlug}
                                    sourceSurface="academia_route_section"
                                    redirectAfterSuccess
                                    compact
                                    sectionId={`temario-${campaign.key}`}
                                    eyebrow="Acceso inmediato"
                                    title="Completa tus datos y recibe el PDF"
                                    description="Te enviamos el temario oficial, la agenda activa y el siguiente paso recomendado dentro de la ruta."
                                    submitLabel="Quiero el temario oficial"
                                    className="border-white/10 bg-black/25 shadow-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

function FeaturedEventCard({ event }: { event: any }) {
    const price = Number(event.price || 0)
    const dateStr = formatEventDate(event.start_time, DEFAULT_TIMEZONE)
    const timeStr = formatEventTime(event.start_time, DEFAULT_TIMEZONE)
    const speakerName = event.speakers?.[0]?.speaker?.profile?.full_name
    const speakerAvatar = event.speakers?.[0]?.speaker?.profile?.avatar_url
    const isLive = event.status === 'live'
    const specialization = getSpecializationByCode(event.specialization_code)

    const subcategoryLabels: Record<string, string> = {
        curso: 'Curso',
        diplomado: 'Diplomado',
        clase: 'Clase',
        taller: 'Taller',
        conferencia: 'Conferencia',
        seminario: 'Seminario',
        congreso: 'Congreso',
        meetup: 'Meetup',
    }

    const badgeLabel = isLive
        ? 'En vivo'
        : event.subcategory
            ? subcategoryLabels[event.subcategory] || 'Encuentro'
            : 'Encuentro'
    const publicPath = getPublicEventPath(event)

    return (
        <Link
            href={publicPath}
            aria-label={`Ver detalles de ${event.title}`}
            className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-sm transition-all duration-500 hover:border-brand-yellow/20"
        >
            <div className="relative aspect-[16/9] overflow-hidden">
                {event.image_url ? (
                    <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-yellow/60 to-white/40">
                        <span className="text-6xl opacity-20">S</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white ${
                            isLive ? 'animate-pulse bg-red-500' : 'bg-gradient-to-r from-brand-yellow to-white'
                        }`}
                    >
                        {isLive && (
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                            </span>
                        )}
                        {badgeLabel}
                    </span>
                    {event.hero_badge && (
                        <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                            {event.hero_badge}
                        </span>
                    )}
                    {specialization && (
                        <span className="inline-flex items-center rounded-full bg-brand-brown/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                            {specialization.name}
                        </span>
                    )}
                </div>

                <div className="absolute bottom-3 right-3">
                    <span className="rounded bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-yellow backdrop-blur-sm">
                        Proximo encuentro
                    </span>
                </div>
            </div>

            <div className="space-y-3 p-5">
                {speakerName && (
                    <div className="flex items-center gap-2">
                        {speakerAvatar ? (
                            <Image
                                src={speakerAvatar}
                                alt=""
                                width={24}
                                height={24}
                                unoptimized
                                className="h-6 w-6 rounded-full object-cover ring-1 ring-white/20"
                            />
                        ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-yellow/30 text-[10px] font-bold text-brand-yellow">
                                {speakerName.charAt(0)}
                            </div>
                        )}
                        <span className="text-xs font-medium text-neutral-500">{speakerName}</span>
                    </div>
                )}

                <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white">{event.title}</h3>

                <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span>{dateStr}</span>
                    <span className="text-neutral-600">&middot;</span>
                    <span>{timeStr}</span>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    {price > 0 ? (
                        <span className="text-lg font-bold text-white">${price.toFixed(0)} MXN</span>
                    ) : (
                        <span className="text-sm font-bold text-brand-brown">Gratis</span>
                    )}
                    <span className="text-xs font-semibold text-brand-yellow transition-colors group-hover:text-brand-yellow">
                        Ver detalles
                    </span>
                </div>
            </div>
        </Link>
    )
}

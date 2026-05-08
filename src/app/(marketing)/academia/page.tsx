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

// PERF: ISR — serve cached HTML for 5 minutes per variant.
export const revalidate = 300

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
                <section className="relative w-full overflow-hidden bg-gradient-to-b from-background via-brand-blue-soft/60 to-background">
                <div className="sapihum-grid-bg pointer-events-none absolute inset-0 opacity-10" />
                <div className="pointer-events-none absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-brand-blue/5 blur-[150px]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-brand-blue-hover/5 blur-[140px]" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
                        <div className="flex flex-col">
                            <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-sm border border-brand-blue/20 bg-brand-blue/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue" />
                                </span>
                                {activeCampaign
                                    ? `Ruta destacada: ${activeCampaign.title}`
                                    : `Qué viene en la Academia`}
                            </div>

                            <h1 className="mb-6 font-serif text-4xl font-bold leading-[1.05] tracking-normal text-brand-text-strong md:text-5xl lg:text-6xl">
                                {activeCampaign ? 'La ruta recomendada para avanzar en' : 'Formacion continua para psicologos que quieren avanzar con mas'}{' '}
                                <span className="italic font-bold text-brand-blue-dark">
                                    {activeCampaign ? activeCampaign.title.toLowerCase() : 'criterio, profundidad y aplicacion real'}
                                </span>
                            </h1>

                            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-brand-text-muted md:text-xl">
                                {activeCampaign
                                    ? activeCampaign.promise
                                    : 'Encuentros en vivo y programas completos para seguir formandote con claridad, respaldo academico y una siguiente accion evidente en cada paso.'}
                            </p>

                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                <a href="#catalogo">
                                    <Button size="lg" className="h-12 w-full px-7 font-bold uppercase text-xs tracking-[0.1em] sm:w-auto">
                                        Ver agenda en vivo
                                    </Button>
                                </a>
                                {activeCampaign && (
                                    <a href="#temario">
                                        <Button size="lg" variant="outline" className="h-12 w-full px-7 font-bold uppercase text-xs tracking-[0.1em] sm:w-auto">
                                            Recibir temario
                                        </Button>
                                    </a>
                                )}
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

            <section id="catalogo" className="scroll-mt-20 w-full px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                                Agenda en vivo
                            </p>
                            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                {activeCampaign ? `Eventos de ${activeCampaign.title}` : 'Eventos'}
                            </h2>
                            <p className="mt-2 max-w-2xl text-muted-foreground">
                                {activeCampaign
                                    ? 'Aqui ves solo los encuentros de esta ruta para mantener la decision mas simple y enfocada.'
                                    : 'Encuentra lo que viene en camino. Filtra por area tematica, formato o busca por nombre.'}
                            </p>
                        </div>
                    </div>

                    <div className="mb-8 flex flex-wrap gap-2">
                        <Link href="/academia#catalogo">
                            <Badge 
                                variant={!activeCampaign ? 'default' : 'outline'} 
                                className={!activeCampaign ? 'bg-brand-blue text-white hover:bg-brand-blue-hover px-4 py-1.5' : 'border-brand-border hover:bg-brand-surface-soft px-4 py-1.5'}
                            >
                                Toda la agenda
                            </Badge>
                        </Link>
                        {campaignBlocks.map(({ campaign }) => (
                            <Link key={campaign.key} href={`/academia?track=${campaign.key}#catalogo`}>
                                <Badge 
                                    variant={activeCampaign?.key === campaign.key ? 'default' : 'outline'} 
                                    className={activeCampaign?.key === campaign.key ? 'bg-brand-blue text-white hover:bg-brand-blue-hover px-4 py-1.5' : 'border-brand-border hover:bg-brand-surface-soft px-4 py-1.5'}
                                >
                                    {campaign.title}
                                </Badge>
                            </Link>
                        ))}
                    </div>

                    <AcademiaCatalog events={visibleUpcoming} />
                </div>
            </section>

            {visibleCampaignBlocks.length > 0 && (
                <section id="rutas-activas" className="w-full border-y border-border/60 bg-background px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                    <div className="mx-auto max-w-7xl space-y-10">
                        {activeCampaign ? (
                            <div id="temario" className="scroll-mt-20">
                                <AcademiaRouteLeadCard
                                    campaign={activeCampaign}
                                    events={visibleUpcoming}
                                    isFocusedView={true}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="mb-8">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                                        Rutas guiadas
                                    </p>
                                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                        Explora por especialidad
                                    </h2>
                                    <p className="mt-2 max-w-2xl text-muted-foreground">
                                        Si buscas un recorrido estructurado, estas rutas te dan un evento inicial, siguientes pasos recomendados y un temario oficial.
                                    </p>
                                </div>
                                <div className="grid gap-6">
                                    {campaignBlocks.map(({ campaign, events }) => (
                                        <CompactRouteCard
                                            key={campaign.key}
                                            campaign={campaign}
                                            events={events}
                                        />
                                    ))}
                                </div>

                                <div className="mt-12 overflow-hidden rounded-3xl border border-brand-blue/20 bg-brand-blue/5 p-6 md:p-8">
                                    <div className="grid gap-8 md:grid-cols-2 md:items-center">
                                        <div>
                                            <h3 className="text-2xl font-bold text-foreground">¿No sabes por dónde empezar?</h3>
                                            <p className="mt-2 text-brand-text-muted">Recibe un resumen con el temario y enfoque de las rutas activas para tomar una mejor decisión.</p>
                                        </div>
                                        <div>
                                            <CampaignLeadMagnetInline
                                                campaignKey={campaignBlocks[0]?.campaign.key || 'general'}
                                                eventId={null}
                                                eventSlug={campaignBlocks[0]?.campaign.primaryEventSlug || 'general'}
                                                sourceSurface="academia_general_bottom"
                                                redirectAfterSuccess
                                                compact
                                                sectionId="temario-general"
                                                eyebrow="Descarga el temario"
                                                title="Recibe el temario oficial"
                                                description=""
                                                submitLabel="Quiero el temario"
                                                className="bg-transparent shadow-none border-none p-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}

            {formations.length > 0 && (
                <section className="w-full px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                                    Formaciones completas
                                </p>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                    Programas listos para comprar y cursar por ruta
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-text-muted md:text-base">
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
                                        className="group overflow-hidden rounded-3xl border border-brand-border bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-2xl hover:shadow-slate-200/80"
                                    >
                                        <div className="grid h-full gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                                            <div className="relative min-h-[220px] overflow-hidden bg-gradient-to-br from-brand-blue/20 via-background to-brand-blue-hover/40">
                                                {formation.image_url ? (
                                                    <Image
                                                        src={formation.image_url}
                                                        alt={formation.title}
                                                        fill
                                                        quality={58}
                                                        sizes="(min-width: 1024px) 50vw, 100vw"
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <BrandWordmark className="text-2xl text-foreground/10 sm:text-3xl lg:text-4xl lg:tracking-[0.18em]" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />
                                                <div className="absolute left-4 top-4">
                                                    <span className="inline-flex rounded-full bg-brand-blue px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                                                        Formacion
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex h-full flex-col p-6 md:p-7">
                                                <div className="mb-4 flex flex-wrap gap-2">
                                                    {specialization && (
                                                        <Badge variant="outline" className="border-brand-blue/30 bg-brand-blue/10 text-brand-blue">
                                                            {specialization.name}
                                                        </Badge>
                                                    )}
                                                    {totalHours && (
                                                        <Badge variant="outline" className="border-brand-border bg-brand-surface-soft text-brand-text">
                                                            {totalHours}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="border-brand-border bg-brand-surface-soft text-brand-text">
                                                        Programa completo
                                                    </Badge>
                                                </div>

                                                <h3 className="text-2xl font-bold leading-tight text-foreground">
                                                    {formation.title}
                                                </h3>

                                                {formation.subtitle && (
                                                    <p className="mt-2 text-base font-medium text-brand-text-muted">
                                                        {formation.subtitle}
                                                    </p>
                                                )}

                                                {formation.description && (
                                                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-brand-text-muted">
                                                        {formation.description}
                                                    </p>
                                                )}

                                                <div className="flex-1" />

                                                <div className="mt-6 flex flex-col gap-4 border-t border-brand-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-text-muted">
                                                            Inversion completa
                                                        </p>
                                                        <p className="mt-1 text-2xl font-black text-foreground">
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
                            <div className="absolute inset-0 bg-gradient-to-br from-card via-brand-blue-soft to-background" />
                    <div className="sapihum-grid-bg absolute inset-0 opacity-10" />
                    <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-blue/5 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-brand-blue-hover/3 blur-3xl" />

                    <div className="relative z-10 p-8 text-center text-foreground md:p-14">
                        <div className="mb-3 inline-flex items-center gap-1 rounded-sm border border-brand-blue/20 bg-brand-blue/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-blue">
                            Beneficio de membresia
                        </div>
                        <h3 className="mb-4 text-2xl font-bold md:text-3xl">La Academia esta incluida en tu membresia</h3>
                        <p className="mx-auto mb-8 max-w-2xl text-brand-text-muted md:text-lg">
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

function CompactRouteCard({ campaign, events }: { campaign: EventCampaignConfig; events: any[] }) {
    const routeHref = `/academia?track=${campaign.key}#catalogo`
    const primaryEvent = events.find((event) => event.slug === campaign.primaryEventSlug) ?? events[0] ?? null

    return (
                                    <div className="group relative flex flex-col gap-5 overflow-hidden rounded-[24px] border border-border bg-[linear-gradient(145deg,#ffffff_15%,#eff6ff_58%,#fafaf9_100%)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-2xl hover:shadow-slate-200/70 md:flex-row md:items-center md:p-6 lg:p-8">
            <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-brand-blue/20 bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue">
                        Ruta destacada
                    </span>
                    <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-surface-soft px-2.5 py-0.5 text-[10px] font-medium text-brand-text-muted">
                        {events.length} {events.length === 1 ? 'paso' : 'pasos'}
                    </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                    {campaign.title}
                </h3>
                <p className="max-w-3xl text-sm leading-relaxed text-brand-text-muted line-clamp-2">
                    {campaign.summary}
                </p>
            </div>
            
            <div className="shrink-0 space-y-3 md:w-64">
                {primaryEvent && (
                    <div className="rounded-xl border border-brand-border bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue">Empieza con</p>
                        <p className="mt-1 text-xs font-medium text-foreground line-clamp-2">{primaryEvent.title}</p>
                    </div>
                )}
                <Link href={routeHref} className="block">
                    <Button className="w-full justify-between" variant="outline">
                        Ver ruta y agenda
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
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
                                            <article className="relative overflow-hidden rounded-[34px] border border-border bg-[linear-gradient(145deg,#ffffff_12%,#eff6ff_58%,#fafaf9_100%)] p-6 shadow-2xl shadow-slate-200/70 md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(30,58,138,0.14),transparent_30%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="relative space-y-7">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue">
                            Ruta destacada
                        </span>
                        <span className="inline-flex items-center rounded-full border border-brand-border bg-brand-surface-soft px-3 py-1 text-xs font-medium text-brand-text-muted">
                            {campaign.events.length} {campaign.events.length === 1 ? 'paso recomendado' : 'pasos sugeridos'}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <h3 className="max-w-4xl font-serif text-3xl font-bold tracking-normal text-brand-text-strong md:text-4xl">
                            {campaign.title}
                        </h3>
                        <p className="max-w-4xl text-lg leading-relaxed text-brand-text">
                            {campaign.promise}
                        </p>
                        <p className="max-w-3xl text-sm leading-relaxed text-brand-text-muted md:text-base">
                            {campaign.summary}
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-start">
                    <div className="order-2 space-y-6 lg:order-1">
                        <div className="rounded-[30px] border border-brand-border bg-white p-5 md:p-6">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue">
                                        Recorrido sugerido
                                    </p>
                                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-text-muted">
                                        Empieza por un punto claro y avanza por la ruta con una sensacion real de progreso, no como si estuvieras viendo un catalogo suelto.
                                    </p>
                                </div>
                                <span className="inline-flex rounded-full border border-brand-border bg-brand-surface-soft px-3 py-1 text-xs font-medium text-brand-text-muted">
                                    {campaign.events.length} {campaign.events.length === 1 ? 'etapa visible' : 'etapas conectadas'}
                                </span>
                            </div>

                            <div className="relative space-y-4">
                                <div className="pointer-events-none absolute bottom-6 left-[1rem] top-6 w-px bg-[linear-gradient(to_bottom,rgba(37,99,235,0.55),rgba(255,255,255,0.06))] md:left-[1.1rem]" />
                                {campaign.events.map((routeEvent, index) => {
                                    const liveEvent = events.find((event) => event.slug === routeEvent.slug)
                                    const stepHref = liveEvent ? getPublicEventPath(liveEvent) : routeHref
                                    const stepLabel = stepLabels[index] || `Paso ${index + 1}`

                                    return (
                                        <Link
                                            key={routeEvent.slug}
                                            href={stepHref}
                                            className="group relative flex gap-4 rounded-[26px] border border-brand-border bg-[linear-gradient(160deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-blue/30 hover:bg-white"
                                        >
                                            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-blue/30 bg-[#EFF6FF] text-xs font-bold text-brand-blue shadow-[0_0_18px_rgba(37,99,235,0.18)]">
                                                {index + 1}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue">
                                                        {stepLabel}
                                                    </p>
                                                    <span className="inline-flex rounded-full border border-brand-border bg-brand-surface-soft px-2.5 py-1 text-[10px] font-medium text-brand-text-muted">
                                                        {liveEvent ? formatRouteDateTime(liveEvent.start_time) : 'Fecha por anunciar'}
                                                    </span>
                                                </div>
                                                <h4 className="mt-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-brand-blue">
                                                    {liveEvent?.title || routeEvent.title}
                                                </h4>
                                                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-brand-text-muted">
                                                    {liveEvent?.subtitle || routeEvent.subtitle}
                                                </p>
                                            </div>

                                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-brand-text-muted transition-colors group-hover:text-brand-blue" />
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-brand-border bg-white p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue">
                                        Para quien encaja mejor
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">
                                        Si te reconoces en uno de estos perfiles, esta ruta ya te da un siguiente paso mucho mas claro.
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface-soft px-3 py-1 text-xs text-brand-text-muted">
                                    <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
                                    Decision mas simple
                                </span>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                {campaign.temario.idealFor.slice(0, 3).map((item) => (
                                    <div key={item} className="rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm leading-relaxed text-brand-text-muted">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="order-1 relative lg:order-2">
                        <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.22),transparent_52%)] blur-2xl" />
                        <div className="relative overflow-hidden rounded-[32px] border border-brand-blue/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-6 lg:sticky lg:top-24">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_55%)]" />
                            <div className="relative space-y-6">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Descarga premium
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
                                            Recurso de decision
                                        </p>
                                        <h3 className="text-3xl font-bold leading-tight text-foreground">
                                            Recibe <span className="font-serif text-[1.05em] italic font-normal text-brand-blue-dark">El Temario Oficial</span>
                                        </h3>
                                        <p className="text-sm leading-relaxed text-brand-text-muted">
                                            No es un flyer generico. Es el PDF con la agenda activa, el enfoque del bloque y la recomendacion concreta para saber por donde empezar.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-[26px] border border-brand-border bg-brand-surface-soft p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue">
                                        Lo que obtienes al descargarlo
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        {deliverables.map((item) => (
                                            <div key={item} className="flex items-start gap-3 text-sm leading-relaxed text-brand-text">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                                                <p>{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[26px] border border-brand-border bg-brand-surface-soft p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
                                        Evento recomendado para empezar
                                    </p>
                                    <h4 className="mt-3 text-2xl font-bold leading-tight text-foreground">
                                        {primaryEvent ? primaryEvent.title : campaign.title}
                                    </h4>
                                    <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">
                                        {primaryEvent
                                            ? `Si ya vienes decidido, este es el punto de entrada mas claro dentro de ${campaign.title.toLowerCase()}.`
                                            : 'Si primero quieres contexto antes de inscribirte, pide el temario y te dejamos lista la recomendacion inicial.'}
                                    </p>

                                    <div className="mt-4 rounded-2xl border border-brand-border bg-brand-surface-soft p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
                                            {primaryEvent ? 'Fecha sugerida' : 'Ruta lista para revisar'}
                                        </p>
                                        <p className="mt-2 inline-flex items-center gap-2 text-sm text-foreground">
                                            <CalendarDays className="h-4 w-4 text-brand-blue" />
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
                                    className="border-brand-border bg-brand-surface-soft shadow-none"
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
            className="group relative block overflow-hidden rounded-2xl border border-brand-border bg-white shadow-2xl backdrop-blur-sm transition-all duration-500 hover:border-brand-blue/20"
        >
            <div className="relative aspect-[16/9] overflow-hidden">
                {event.image_url ? (
                    <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        quality={58}
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-blue/60 to-white/40">
                        <span className="text-6xl opacity-20">S</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

                <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-foreground ${
                            isLive ? 'animate-pulse bg-red-500' : 'bg-gradient-to-r from-brand-blue to-white'
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
                        <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
                            {event.hero_badge}
                        </span>
                    )}
                    {specialization && (
                                                    <span className="inline-flex items-center rounded-full bg-brand-blue-hover/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">
                            {specialization.name}
                        </span>
                    )}
                </div>

                <div className="absolute bottom-3 right-3">
                    <span className="rounded bg-background/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-blue backdrop-blur-sm">
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
                                quality={58}
                                className="h-6 w-6 rounded-full object-cover ring-1 ring-white/20"
                            />
                        ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue/30 text-[10px] font-bold text-brand-blue">
                                {speakerName.charAt(0)}
                            </div>
                        )}
                        <span className="text-xs font-medium text-brand-text-muted">{speakerName}</span>
                    </div>
                )}

                <h3 className="line-clamp-2 text-lg font-bold leading-snug text-foreground">{event.title}</h3>

                <div className="flex items-center gap-3 text-xs text-brand-text-muted">
                    <span>{dateStr}</span>
                    <span className="text-neutral-600">&middot;</span>
                    <span>{timeStr}</span>
                </div>

                <div className="flex items-center justify-between border-t border-border/5 pt-2">
                    {price > 0 ? (
                        <span className="text-lg font-bold text-foreground">${price.toFixed(0)} MXN</span>
                    ) : (
                        <span className="text-sm font-bold text-brand-blue-hover">Gratis</span>
                    )}
                    <span className="text-xs font-semibold text-brand-blue transition-colors group-hover:text-brand-blue">
                        Ver detalles
                    </span>
                </div>
            </div>
        </Link>
    )
}

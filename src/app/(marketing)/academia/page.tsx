import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { AcademiaCatalog } from '@/components/catalog/academia-catalog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

export default async function AcademiaPage() {
    const [allEvents, formations] = await Promise.all([
        getUnifiedCatalogEvents(),
        getPublicFormations(),
    ])
    const { upcoming, past } = splitPublicCatalogEvents(allEvents)

    const featuredEvent = upcoming.find((event: any) => event.image_url) || upcoming[0]

    return (
        <div className="relative flex w-full flex-1 flex-col items-center bg-background">
            <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#0a0a0a] via-[#111111] to-background">
                <div className="sapihum-grid-bg pointer-events-none absolute inset-0 opacity-10" />
                <div className="pointer-events-none absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-brand-yellow/3 blur-[150px]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-brand-brown/3 blur-[120px]" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                        <div className="flex flex-col">
                            <div className="sapihum-fade-up mb-8 inline-flex w-fit items-center gap-2 rounded-sm border border-brand-yellow/20 bg-brand-yellow/5 px-4 py-2 text-[10px] font-bold text-brand-yellow uppercase tracking-[0.2em] backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-yellow" />
                                </span>
                                {upcoming.length > 0
                                    ? `${upcoming.length} encuentro${upcoming.length !== 1 ? 's' : ''} activo${upcoming.length !== 1 ? 's' : ''}`
                                    : 'Academia SAPIHUM'}
                            </div>

                            <h1
                                className="sapihum-fade-up mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl"
                                style={{ animationDelay: '0.1s' }}
                            >
                                Donde se forman los{' '}
                                <span className="relative inline-block">
                                    <span className="relative font-serif italic font-normal text-[#c0bfbc]">
                                        mejores psicologos
                                    </span>
                                </span>
                            </h1>

                            <p
                                className="sapihum-fade-up mb-10 max-w-xl text-lg leading-relaxed text-neutral-400/90 md:text-xl"
                                style={{ animationDelay: '0.2s' }}
                            >
                                Talleres, formaciones clinicas, supervision y networking con profesionales de habla hispana, todo en vivo.
                            </p>

                            <div className="sapihum-fade-up flex flex-wrap gap-3" style={{ animationDelay: '0.3s' }}>
                                <Link href="/formaciones">
                                    <Button size="lg" className="h-12 px-7 font-bold uppercase text-xs tracking-[0.1em]">
                                        Ver formaciones
                                    </Button>
                                </Link>
                                <a href="#catalogo">
                                    <Button size="lg" variant="outline" className="h-12 px-7 font-bold uppercase text-xs tracking-[0.1em]">
                                        Explorar catalogo
                                    </Button>
                                </a>
                                <Link href="/precios">
                                    <Button size="lg" variant="outline" className="h-12 px-7 text-sm font-semibold backdrop-blur-sm">
                                        Ver planes
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {featuredEvent && (
                            <div className="sapihum-fade-up hidden lg:block" style={{ animationDelay: '0.25s' }}>
                                <FeaturedEventCard event={featuredEvent} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </section>

            <section id="catalogo" className="scroll-mt-8 w-full px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Proximos Encuentros</h2>
                        <p className="mt-2 max-w-2xl text-muted-foreground">
                            Encuentra lo que viene en camino. Filtra por area tematica, formato o busca por nombre.
                        </p>
                    </div>
                    <AcademiaCatalog events={upcoming} />
                </div>
            </section>

            {formations.length > 0 && (
                <section className="w-full border-y border-border/60 bg-[#050505] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                                    Formaciones Completas
                                </p>
                                <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                                    Programas listos para comprar y cursar por ruta
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400 md:text-base">
                                    Despues de explorar los proximos encuentros, aqui puedes ver los programas completos con una sola compra y un recorrido guiado.
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
                            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Eventos Pasados</h2>
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
                        <div className="mb-3 inline-flex items-center gap-1 rounded-sm border border-brand-yellow/20 bg-brand-yellow/5 px-3 py-1 text-[10px] font-bold text-brand-yellow uppercase tracking-[0.15em]">
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

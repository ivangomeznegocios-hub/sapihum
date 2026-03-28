import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AcademiaCatalog } from '@/components/catalog/academia-catalog'
import { getUnifiedCatalogEvents } from '@/lib/supabase/queries/events'

export const metadata: Metadata = {
    title: 'Academia SAPIHUM | Formación Continua en Psicología',
    description: 'Explora el catálogo completo de formación continua: eventos en vivo, formaciones, talleres, supervisión clínica y más para profesionales de la psicología.',
    openGraph: {
        title: 'Academia SAPIHUM | Formación Continua en Psicología',
        description: 'Eventos en vivo, formaciones, talleres y supervisión clínica. Desarrollo profesional con respaldo científico.',
    },
}

export default async function AcademiaPage() {
    const allEvents = await getUnifiedCatalogEvents()

    const featuredEvent = allEvents.find(
        (e: any) => (e.status === 'upcoming' || e.status === 'live') && e.image_url
    ) || allEvents.find((e: any) => e.status === 'upcoming' || e.status === 'live')

    const upcomingCount = allEvents.filter((e: any) => e.status === 'upcoming' || e.status === 'live').length

    return (
        <div className="flex flex-col items-center flex-1 w-full relative bg-background">
            {/* ── HERO ── */}
            <section className="w-full relative overflow-hidden bg-gradient-to-b from-[#0A1628] via-[#0E1D35] to-background">
                {/* Background effects */}
                <div className="absolute inset-0 sapihum-grid-bg opacity-20" />
                <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-teal-500/8 blur-[150px] pointer-events-none" />
                <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-emerald-500/6 blur-[120px] pointer-events-none" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Text */}
                        <div className="flex flex-col">
                            <div className="sapihum-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/50 px-4 py-2 text-sm font-semibold text-teal-300 w-fit backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
                                </span>
                                {upcomingCount > 0
                                    ? `${upcomingCount} evento${upcomingCount !== 1 ? 's' : ''} activo${upcomingCount !== 1 ? 's' : ''}`
                                    : 'Academia SAPIHUM'
                                }
                            </div>

                            <h1 className="sapihum-fade-up text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1] text-white" style={{ animationDelay: '0.1s' }}>
                                Donde se forman los{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300">
                                    mejores psicólogos
                                </span>
                            </h1>

                            <p className="sapihum-fade-up text-lg md:text-xl text-slate-300/90 max-w-xl mb-10 leading-relaxed" style={{ animationDelay: '0.2s' }}>
                                Eventos en vivo, formaciones clínicas, talleres y supervisión con los mejores profesionales de habla hispana.
                            </p>

                            <div className="sapihum-fade-up flex flex-wrap gap-3" style={{ animationDelay: '0.3s' }}>
                                <a href="#catalogo">
                                    <Button size="lg" className="h-12 px-7 text-sm shadow-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold border-0 sapihum-glow-cta">
                                        Explorar catálogo
                                    </Button>
                                </a>
                                <Link href="/precios">
                                    <Button size="lg" variant="outline" className="h-12 px-7 text-sm border-slate-500/40 text-slate-200 hover:bg-white/5 hover:text-white hover:border-teal-400/50 transition-all backdrop-blur-sm">
                                        Ver Planes →
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Featured Event Card */}
                        {featuredEvent && (
                            <div className="sapihum-fade-up hidden lg:block" style={{ animationDelay: '0.25s' }}>
                                <FeaturedEventCard event={featuredEvent} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </section>

            {/* ── CATÁLOGO ── */}
            <section id="catalogo" className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-8 scroll-mt-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                            Catálogo de Formación
                        </h2>
                        <p className="mt-2 text-muted-foreground max-w-2xl">
                            Encuentra tu próximo evento. Filtra por tipo, área temática o busca por nombre.
                        </p>
                    </div>
                    <AcademiaCatalog events={allEvents} />
                </div>
            </section>

            {/* ── CTA BAND ── */}
            <section className="w-full py-16 px-4">
                <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl shadow-2xl">
                    {/* Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#0E1D35] to-[#0A1628]" />
                    <div className="absolute inset-0 sapihum-grid-bg opacity-20" />
                    <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-teal-500/15 blur-3xl" />
                    <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

                    <div className="relative z-10 p-8 md:p-14 text-center text-white">
                        <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-teal-500/10 border border-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300">
                            ✨ Beneficio de membresía
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            La Academia está incluida en tu membresía
                        </h3>
                        <p className="text-slate-300/90 md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                            Al suscribirte a SAPIHUM, obtienes acceso a eventos exclusivos, precios preferenciales
                            y una comunidad de aprendizaje continuo.
                        </p>
                        <Link href="/precios">
                            <Button size="lg" className="h-13 px-8 text-base bg-white text-[#0A1628] hover:bg-slate-100 border-0 font-bold shadow-xl">
                                Ver Planes y Precios
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

/* ──────────────────────────────────────
   Featured Event Card (Server Component)
   ────────────────────────────────────── */
function FeaturedEventCard({ event }: { event: any }) {
    const price = Number(event.price || 0)
    const dateStr = new Date(event.start_time).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
    const timeStr = new Date(event.start_time).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
    const speakerName = event.speakers?.[0]?.speaker?.profile?.full_name
    const speakerAvatar = event.speakers?.[0]?.speaker?.profile?.avatar_url
    const isLive = event.status === 'live'

    const typeLabels: Record<string, string> = {
        live: 'En Vivo',
        course: 'Formación',
        presencial: 'Presencial',
    }

    return (
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-2xl group hover:border-teal-500/20 transition-all duration-500">
            {/* Image */}
            <div className="relative aspect-[16/9] overflow-hidden">
                {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-teal-900/60 to-emerald-900/40 flex items-center justify-center">
                        <span className="text-6xl opacity-20">🎓</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white uppercase tracking-wide ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-teal-600 to-emerald-600'}`}>
                        {isLive && (
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                            </span>
                        )}
                        {typeLabels[event.event_type] || 'Evento'}
                    </span>
                    {event.hero_badge && (
                        <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white">
                            {event.hero_badge}
                        </span>
                    )}
                </div>

                {/* Floating label */}
                <div className="absolute bottom-3 right-3">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                        Próximo evento ✨
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
                {speakerName && (
                    <div className="flex items-center gap-2">
                        {speakerAvatar ? (
                            <img src={speakerAvatar} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/20" />
                        ) : (
                            <div className="h-6 w-6 rounded-full bg-teal-500/30 flex items-center justify-center text-[10px] font-bold text-teal-300">
                                {speakerName.charAt(0)}
                            </div>
                        )}
                        <span className="text-xs font-medium text-slate-400">{speakerName}</span>
                    </div>
                )}

                <h3 className="text-lg font-bold text-white line-clamp-2 leading-snug">{event.title}</h3>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">📅 {dateStr}</span>
                    <span className="text-slate-600">·</span>
                    <span className="flex items-center gap-1">🕐 {timeStr}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    {price > 0 ? (
                        <span className="text-lg font-bold text-white">${price.toFixed(0)} MXN</span>
                    ) : (
                        <span className="text-sm font-bold text-emerald-400">Gratis</span>
                    )}
                    <span className="text-xs font-semibold text-teal-400 group-hover:text-teal-300 transition-colors">
                        Ver detalles →
                    </span>
                </div>
            </div>
        </div>
    )
}

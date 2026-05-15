import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPublicCatalogEvents } from '@/lib/supabase/queries/events'
import { getFeaturedPublicSpeakers } from '@/lib/supabase/queries/speakers'
import { splitPublicCatalogEvents } from '@/lib/events/public'
import { PublicCatalogCard } from '@/components/catalog/public-catalog-card'
import { getSpeakerHeadline, getSpeakerImage, getSpeakerName } from '@/lib/speakers/display'

export const metadata: Metadata = {
    title: 'SAPIHUM | Ciencias Forenses',
    description: 'Formación especializada, eventos en vivo y comunidad académica para profesionales vinculados al sistema de justicia.',
    alternates: {
        canonical: '/ciencias-forenses',
    },
}

export const revalidate = 300

const AREAS = [
    {
        code: 'criminalistica',
        name: 'Criminalística',
        tagline: 'Estudio material y científico de los indicios.',
        description: 'Investigación en el lugar de los hechos, balística, dactiloscopia y grafoscopía.',
        placeholder: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        position: 'center',
    },
    {
        code: 'criminologia',
        name: 'Criminología',
        tagline: 'Análisis del comportamiento delictivo.',
        description: 'Causas del delito, victimología, prevención y perfiles criminales.',
        placeholder: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=800&q=80',
        position: 'center',
    },
    {
        code: 'psicologia_forense',
        name: 'Psicología Forense',
        tagline: 'Evaluación clínica aplicada a la justicia.',
        description: 'Peritajes psicológicos, imputabilidad, daño moral y credibilidad del testimonio.',
        placeholder: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
        position: 'center',
    },
    {
        code: 'perfilacion',
        name: 'Perfilación Criminal',
        tagline: 'Investigación conductual y análisis.',
        description: 'Técnicas para identificar características de ofensores desconocidos.',
        placeholder: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80',
        position: 'center',
    },
    {
        code: 'derecho_penal',
        name: 'Derecho Penal',
        tagline: 'El marco legal de la prueba científica.',
        description: 'Sistema Acusatorio, litigación oral y valoración de la prueba pericial.',
        placeholder: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
        position: 'center',
    },
]

const FAQS = [
    {
        q: "¿Qué es SAPIHUM Ciencias Forenses?",
        a: "Es la vertical especializada de SAPIHUM diseñada para profesionales del ámbito forense y legal. Ofrecemos formación continua, eventos de actualización y un espacio de conexión para criminólogos, criminalistas, psicólogos forenses y abogados."
    },
    {
        q: "¿Quiénes pueden unirse a esta comunidad?",
        a: "Está abierta a peritos activos, estudiantes de carreras afines, abogados penalistas, miembros de fiscalías y cualquier profesional interesado en el rigor científico aplicado a la justicia."
    },
    {
        q: "¿La formación tiene validez oficial?",
        a: "Nuestros programas cuentan con el respaldo de expertos en activo y convenios institucionales que se especifican en cada curso o diplomado."
    },
    {
        q: "¿Cómo accedo a los eventos?",
        a: "Puedes revisar el catálogo de eventos en esta página. Algunos son gratuitos para la comunidad y otros requieren registro o forman parte de los planes de membresía."
    }
]

export default async function CienciasForensesPage() {
    const [catalogEvents, featuredSpeakers] = await Promise.all([
        getPublicCatalogEvents('eventos', 'ciencias_forenses'),
        getFeaturedPublicSpeakers(4),
    ])
    
    const featuredEvents = splitPublicCatalogEvents(catalogEvents).upcoming.slice(0, 3)

    return (
        <div className="marketing-long-page flex flex-col items-center flex-1 w-full bg-slate-950 text-slate-200">
            {/* ══════════════════════════════════════════════════
                1. HERO
            ══════════════════════════════════════════════════ */}
            <section className="relative flex w-full items-center overflow-hidden min-h-[76svh] md:min-h-[82svh] border-b border-slate-800">
                <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_18%_10%,rgba(30,41,59,0.4),transparent_34%),radial-gradient(circle_at_82%_80%,rgba(15,23,42,0.4),transparent_30%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]" />
                <div className="absolute inset-0 -z-0 sapihum-grid-bg opacity-[0.05]" />
                
                <div className="relative z-10 mx-auto max-w-[88rem] px-4 py-20 sm:px-6 md:py-24 lg:px-8 lg:py-28">
                    <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
                        <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-5 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-300 shadow-sm backdrop-blur-sm">
                            <Shield className="h-3.5 w-3.5 fill-slate-400 text-slate-400" />
                            Vertical Especializada en Ciencias Forenses
                        </div>

                        <h1 className="font-serif text-[clamp(2.85rem,4.65vw,5.85rem)] font-bold leading-[1.04] tracking-normal text-white">
                            <span className="block md:whitespace-nowrap">Rigor científico para la</span>
                            <span className="block pt-2 text-[0.88em] italic font-bold text-slate-300 md:whitespace-nowrap">
                                práctica <span className="text-[#2563EB]">forense actual.</span>
                            </span>
                        </h1>

                        <div className="mt-10 max-w-3xl text-xl leading-relaxed text-slate-400 md:text-2xl">
                            <p>Criminólogos, Criminalistas, Peritos y Abogados.</p>
                            <p className="font-semibold text-white">Uniendo ciencia y justicia</p>
                            <p>con los más altos estándares éticos.</p>
                        </div>

                        <div className="mt-14 flex w-full flex-col gap-5 text-sm sm:w-auto sm:flex-row">
                            <Link href="/ciencias-forenses/eventos" className="w-full sm:w-auto">
                                <Button size="lg" className="h-14 w-full px-10 text-base font-bold bg-white text-slate-950 hover:bg-slate-200">
                                    Ver eventos
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/ciencias-forenses/planes" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="h-14 w-full px-10 text-base font-bold border-slate-700 text-white hover:bg-slate-800 backdrop-blur-sm">
                                    Ver planes
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                2. BLOQUE DE CREDIBILIDAD
            ══════════════════════════════════════════════════ */}
            <section className="w-full border-b border-slate-800 bg-slate-950 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                        {[
                            "Rigor Pericial",
                            "Formación Especializada",
                            "Comunidad de Expertos",
                            "Investigación Forense",
                            "Actualización Continua"
                        ].map((pill) => (
                            <div key={pill} className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mr-3" />
                                {pill}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                3. QUÉ ES SAPIHUM FORENSES
            ══════════════════════════════════════════════════ */}
            <section className="relative w-full py-32 border-b border-slate-800 overflow-hidden bg-slate-950">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
                
                <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-4">
                        El Ecosistema
                    </p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
                        Qué es SAPIHUM Forenses
                    </h2>
                    <p className="mt-8 text-xl leading-relaxed text-slate-300 font-medium">
                        Es un entorno diseñado exclusivamente para el <span className="text-white font-semibold">rigor pericial y académico</span>. Integramos formación especializada, eventos en vivo y una comunidad activa para elevar el nivel de la práctica forense en el sistema de justicia.
                    </p>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                4. ÁREAS DE ENFOQUE (Grid Premium)
            ══════════════════════════════════════════════════ */}
            <section className="w-full py-32 bg-slate-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
                                Áreas de{" "}
                                <span className="font-serif italic font-normal text-[#2563EB]">enfoque</span>
                            </h2>
                            <div className="h-px w-20 bg-[#2563EB]" />
                        </div>
                        <p className="text-slate-400 max-w-sm text-sm font-light leading-relaxed">
                            Nuestra formación abarca las disciplinas esenciales para el análisis criminal y la impartición de justicia.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-800 border border-slate-800">
                        {AREAS.map((area, idx) => (
                            <div
                                key={area.code}
                                className="group relative isolate min-h-[320px] overflow-hidden bg-slate-900"
                            >
                                <Image
                                    src={area.placeholder}
                                    alt={area.name}
                                    fill
                                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                    quality={52}
                                    className="absolute inset-0 object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-40 mix-blend-luminosity"
                                    style={{
                                        objectPosition: area.position,
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                                
                                <div className="relative z-10 flex h-full flex-col justify-between p-10">
                                    <div>
                                        <div className="mb-6 font-serif text-2xl text-[#2563EB]">
                                            {String(idx + 1).padStart(2, '0')}.
                                        </div>
                                        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors duration-500 group-hover:text-slate-300">
                                            {area.name}
                                        </h3>
                                        <p className="max-w-[18rem] text-xs leading-relaxed text-slate-400">
                                            {area.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">
                                        Explorar <span className="ml-1 transition-transform duration-500 group-hover:translate-x-2">→</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                5. PRÓXIMOS EVENTOS
            ══════════════════════════════════════════════════ */}
            {featuredEvents.length > 0 && (
                <section className="w-full py-24 bg-slate-950 border-y border-slate-800">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
                            <div className="max-w-3xl">
                                <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-4">
                                    Agenda SAPIHUM
                                </p>
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                                    Próximos eventos forenses
                                </h2>
                                <p className="mt-3 text-slate-400 font-light">
                                    Conferencias, talleres y análisis de casos diseñados para fortalecer tu práctica pericial.
                                </p>
                            </div>
                            <Link href="/ciencias-forenses/eventos" className="shrink-0">
                                <Button variant="outline" className="gap-2 font-bold uppercase text-[10px] tracking-[0.1em] border-slate-700 text-white hover:bg-slate-800">
                                    Ver todos
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {featuredEvents.map((event) => (
                                <PublicCatalogCard key={event.id} event={event} fixedLayout />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════════════
                6. DOCENTES DESTACADOS
            ══════════════════════════════════════════════════ */}
            {featuredSpeakers.length > 0 && (
                <section className="w-full py-32 bg-slate-950">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="max-w-3xl mx-auto text-center mb-16">
                            <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] mb-4">
                                Docentes destacados
                            </p>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
                                Aprende con docentes de {" "}
                                <span className="font-serif italic font-normal text-slate-400">
                                    alto nivel académico
                                </span>
                            </h2>
                            <p className="text-slate-400 text-lg font-light leading-relaxed">
                                Profesionales en activo con amplia experiencia en peritajes y el sistema de justicia.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {featuredSpeakers.map((speaker) => {
                                const name = getSpeakerName(speaker)
                                const photoUrl = getSpeakerImage(speaker)
                                const headline = getSpeakerHeadline(speaker)
                                const mainSpecialty = speaker.specialties?.[0]
                                const credential = speaker.credentials?.length > 0 ? speaker.credentials.join(' · ') : headline

                                return (
                                    <Link
                                        key={speaker.id}
                                        href={`/speakers/${speaker.id}`}
                                        className="group cursor-pointer block"
                                    >
                                        <div className="relative w-full aspect-[4/5] bg-slate-900 mb-5 overflow-hidden rounded-md border border-slate-800">
                                            {photoUrl ? (
                                                <Image
                                                    src={photoUrl}
                                                    alt={name}
                                                    fill
                                                    quality={58}
                                                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                                                    className="object-cover transition-all duration-700 opacity-90 group-hover:opacity-100 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                                    <span className="text-slate-600 font-serif italic text-6xl">
                                                        {name.split(' ')[1]?.[0] || name[0]}
                                                    </span>
                                                </div>
                                            )}

                                            <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-[0.2] transition-opacity duration-500 pointer-events-none"
                                                style={{ backgroundColor: '#2563EB', mixBlendMode: 'multiply' as any }}
                                            />

                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                                            <div className="absolute bottom-4 left-4 right-4 z-10">
                                                {mainSpecialty && (
                                                    <p className="text-[10px] text-[#2563EB] uppercase tracking-widest font-semibold mb-1">
                                                        {mainSpecialty}
                                                    </p>
                                                )}
                                                <h3 className="text-xl font-serif text-white leading-tight">{name}</h3>
                                            </div>
                                        </div>

                                        <div className="pl-4 border-l border-slate-800 group-hover:border-[#2563EB] transition-colors duration-300">
                                            {credential && (
                                                <p className="text-xs text-slate-500 mb-2 leading-relaxed line-clamp-2">
                                                    {credential}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════════════
                7. FAQS
            ══════════════════════════════════════════════════ */}
            <section className="w-full py-32 bg-slate-950 border-y border-slate-800">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-serif italic">Consultas frecuentes</h2>
                    </div>
                    <div className="space-y-4">
                        {FAQS.map((faq, idx) => (
                            <details key={idx} className="group border-b border-slate-800 pb-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                                <summary className="flex items-center justify-between outline-none">
                                    <span className="text-lg font-light text-slate-300 group-open:text-[#2563EB] transition-all">{faq.q}</span>
                                    <span className="ml-4 text-[#2563EB] text-xl font-light transition-transform duration-300 group-open:rotate-45">+</span>
                                </summary>
                                <div className="pt-6 text-sm text-slate-400 leading-relaxed font-light">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                8. FINAL CTA
            ══════════════════════════════════════════════════ */}
            <section className="w-full py-40 bg-slate-950">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative">
                    <div className="absolute inset-0 bg-[#2563EB]/5 blur-[120px] rounded-full pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white mb-6">
                            Eleva el nivel de tu práctica pericial y académica
                        </h2>
                        <p className="mx-auto max-w-3xl text-lg text-slate-400 font-light leading-relaxed">
                            Explora nuestros eventos, conoce las rutas de formación y accede a una comunidad diseñada para el rigor científico.
                        </p>
                        
                        <div className="mt-16 flex flex-col sm:flex-row gap-6 justify-center items-center uppercase text-xs tracking-[0.1em]">
                            <Link href="/ciencias-forenses/eventos" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full h-14 px-12 font-bold bg-white text-slate-950 hover:bg-slate-200">
                                    Ver Eventos
                                </Button>
                            </Link>
                            <Link href="/ciencias-forenses/planes" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="w-full h-14 px-12 font-bold border-slate-700 text-white hover:bg-slate-800">
                                    Conocer Planes
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

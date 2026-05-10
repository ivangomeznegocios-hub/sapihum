import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Calendar, Users, GraduationCap, Briefcase, Microscope, Scale, FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'SAPIHUM Ciencias Forenses',
    description: 'Formación especializada, eventos en vivo y comunidad académica para profesionales vinculados al sistema de justicia.',
    alternates: {
        canonical: '/ciencias-forenses',
    },
}

export default function CienciasForensesPage() {
    return (
        <div className="flex-1 w-full bg-slate-950 text-slate-200">
            {/* Hero Section */}
            <section className="relative min-h-[85vh] flex items-center overflow-hidden border-b border-slate-800">
                <Image
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=80"
                    alt="Ciencias Forenses"
                    fill
                    priority
                    quality={85}
                    sizes="100vw"
                    className="object-cover opacity-30 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
                
                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300 backdrop-blur-sm mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-500"></span>
                            </span>
                            Vertical Especializada
                        </div>
                        
                        <h1 className="font-serif text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
                            Ciencias Forenses para la práctica profesional actual
                        </h1>
                        
                        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
                            Formación especializada, eventos en vivo y comunidad académica para criminólogos, criminalistas, psicólogos forenses, abogados penalistas, peritos, estudiantes avanzados y profesionales vinculados al sistema de justicia.
                        </p>
                        
                        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                            <Link href="/ciencias-forenses/eventos">
                                <Button size="lg" className="h-14 w-full gap-2 px-8 text-base font-semibold bg-white text-slate-950 hover:bg-slate-200 sm:w-auto">
                                    Ver próximos eventos
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/ciencias-forenses/planes">
                                <Button size="lg" variant="outline" className="h-14 w-full border-slate-700 bg-slate-900/50 px-8 text-base font-semibold text-white hover:bg-slate-800 backdrop-blur-sm sm:w-auto">
                                    Ver planes
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Qué encontrarás */}
            <section className="border-b border-slate-800 bg-slate-950 py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            ¿Qué encontrarás en esta vertical?
                        </h2>
                        <p className="mt-4 text-slate-400 text-lg">
                            Un ecosistema diseñado exclusivamente para el rigor pericial y académico.
                        </p>
                    </div>

                    <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Card 1 */}
                        <div className="group relative flex flex-col items-start justify-between rounded-2xl border border-slate-800 bg-slate-900 p-8 transition-colors hover:border-slate-700 hover:bg-slate-800/50">
                            <div className="rounded-xl bg-slate-800 p-3 ring-1 ring-slate-700/50">
                                <Calendar className="h-6 w-6 text-slate-300" />
                            </div>
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold text-white">Eventos especializados</h3>
                                <p className="mt-3 leading-relaxed text-slate-400">
                                    Masterclasses, sesiones en vivo y análisis de temas actuales en ciencias forenses.
                                </p>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="group relative flex flex-col items-start justify-between rounded-2xl border border-slate-800 bg-slate-900 p-8 transition-colors hover:border-slate-700 hover:bg-slate-800/50">
                            <div className="rounded-xl bg-slate-800 p-3 ring-1 ring-slate-700/50">
                                <GraduationCap className="h-6 w-6 text-slate-300" />
                            </div>
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold text-white">Formación profesional</h3>
                                <p className="mt-3 leading-relaxed text-slate-400">
                                    Programas, diplomados y rutas académicas enfocadas en la práctica pericial y el sistema de justicia.
                                </p>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="group relative flex flex-col items-start justify-between rounded-2xl border border-slate-800 bg-slate-900 p-8 transition-colors hover:border-slate-700 hover:bg-slate-800/50 sm:col-span-2 lg:col-span-1">
                            <div className="rounded-xl bg-slate-800 p-3 ring-1 ring-slate-700/50">
                                <Users className="h-6 w-6 text-slate-300" />
                            </div>
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold text-white">Comunidad forense</h3>
                                <p className="mt-3 leading-relaxed text-slate-400">
                                    Un espacio para conectar con docentes, especialistas, estudiantes y profesionales del sector.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Áreas principales */}
            <section className="bg-slate-900 py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Áreas principales
                        </h2>
                        <p className="mt-4 text-slate-400 text-lg">
                            Nuestra formación abarca las disciplinas esenciales para el análisis criminal y la impartición de justicia.
                        </p>
                    </div>

                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
                            <Microscope className="mt-1 h-6 w-6 shrink-0 text-slate-500" />
                            <div>
                                <h4 className="font-bold text-white text-lg">Criminalística</h4>
                                <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                                    Estudio material y científico de los indicios en el lugar de los hechos.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
                            <Users className="mt-1 h-6 w-6 shrink-0 text-slate-500" />
                            <div>
                                <h4 className="font-bold text-white text-lg">Criminología</h4>
                                <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                                    Análisis del comportamiento delictivo, sus causas y estrategias de prevención.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
                            <FileSignature className="mt-1 h-6 w-6 shrink-0 text-slate-500" />
                            <div>
                                <h4 className="font-bold text-white text-lg">Psicología Forense</h4>
                                <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                                    Evaluación clínica y peritaje psicológico aplicado a procesos judiciales.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm lg:col-start-1 lg:col-end-2 lg:ml-[50%] lg:translate-x-[25%]">
                            <Briefcase className="mt-1 h-6 w-6 shrink-0 text-slate-500" />
                            <div>
                                <h4 className="font-bold text-white text-lg">Perfilación Criminal</h4>
                                <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                                    Técnicas de investigación conductual para identificar características de ofensores.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-sm lg:col-start-2 lg:col-end-3 lg:ml-[50%] lg:translate-x-[25%]">
                            <Scale className="mt-1 h-6 w-6 shrink-0 text-slate-500" />
                            <div>
                                <h4 className="font-bold text-white text-lg">Derecho Penal</h4>
                                <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                                    Comprensión del Sistema Acusatorio y el rol de la prueba científica.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="relative overflow-hidden border-t border-slate-800 bg-slate-950 py-24 sm:py-32">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 opacity-50"></div>
                <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-5xl">
                        Forma parte de la nueva comunidad forense de SAPIHUM
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                        Explora próximos eventos, conoce las rutas de formación y accede a planes diseñados para profesionales y estudiantes del área forense.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href="/ciencias-forenses/eventos">
                            <Button size="lg" className="h-12 w-full min-w-[200px] gap-2 px-8 font-semibold bg-white text-slate-950 hover:bg-slate-200 sm:w-auto">
                                Ver eventos
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/ciencias-forenses/planes">
                            <Button size="lg" variant="outline" className="h-12 w-full min-w-[200px] border-slate-700 bg-transparent px-8 font-semibold text-white hover:bg-slate-900 sm:w-auto">
                                Ver planes
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

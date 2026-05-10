import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Planes | SAPIHUM Ciencias Forenses',
    description: 'Conoce nuestros planes de formación y comunidad para profesionales forenses.',
}

export default function ForensicPlanesPage() {
    return (
        <div className="flex-1 w-full bg-slate-950 text-slate-200">
            {/* Hero */}
            <section className="border-b border-slate-800 bg-slate-950 py-20">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        Planes de Ciencias Forenses
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
                        Accede a eventos, formación especializada y beneficios diseñados para estudiantes avanzados, profesionales y especialistas del área forense.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
                        
                        {/* Plan Comunidad */}
                        <div className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-sm ring-1 ring-slate-800/50 sm:p-10">
                            <h3 className="text-2xl font-bold text-white">Comunidad Forense</h3>
                            <p className="mt-4 text-slate-400">
                                Ideal para estudiantes y profesionales en etapa de exploración de las ciencias forenses.
                            </p>
                            
                            <div className="mt-8 flex items-baseline text-4xl font-bold tracking-tight text-white">
                                Próximamente
                            </div>
                            
                            <ul className="mt-10 flex flex-col gap-4 flex-1">
                                <li className="flex gap-3">
                                    <Check className="h-5 w-5 shrink-0 text-slate-400" />
                                    <span className="text-slate-300">Acceso a eventos seleccionados</span>
                                </li>
                                <li className="flex gap-3">
                                    <Check className="h-5 w-5 shrink-0 text-slate-400" />
                                    <span className="text-slate-300">Avisos de próximas masterclasses</span>
                                </li>
                                <li className="flex gap-3">
                                    <Check className="h-5 w-5 shrink-0 text-slate-400" />
                                    <span className="text-slate-300">Participación en actividades de la vertical</span>
                                </li>
                            </ul>
                            
                            <Link href="/auth/register?vertical=ciencias_forenses" className="mt-10">
                                <Button className="w-full h-12 bg-white text-slate-950 hover:bg-slate-200 font-semibold text-base">
                                    Unirme en apertura
                                </Button>
                            </Link>
                        </div>

                        {/* Plan Profesional */}
                        <div className="relative flex flex-col rounded-3xl border border-slate-700 bg-slate-800/50 p-8 shadow-md ring-2 ring-slate-700 sm:p-10 overflow-hidden">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-slate-700/50 blur-3xl"></div>
                            
                            <div className="inline-flex w-fit items-center rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-6">
                                Profesional
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white">Profesional Forense</h3>
                            <p className="mt-4 text-slate-400">
                                Ideal para profesionales activos o en especialización que buscan actualización continua.
                            </p>
                            
                            <div className="mt-8 flex items-baseline text-4xl font-bold tracking-tight text-white">
                                Próximamente
                            </div>
                            
                            <ul className="mt-10 flex flex-col gap-4 flex-1 relative z-10">
                                <li className="flex gap-3">
                                    <Check className="h-5 w-5 shrink-0 text-white" />
                                    <span className="text-slate-200 font-medium">Acceso preferente a todos los eventos</span>
                                </li>
                                <li className="flex gap-3">
                                    <Check className="h-5 w-5 shrink-0 text-white" />
                                    <span className="text-slate-200 font-medium">Descuentos en diplomados y programas</span>
                                </li>
                                <li className="flex gap-3">
                                    <Check className="h-5 w-5 shrink-0 text-white" />
                                    <span className="text-slate-200 font-medium">Contenido especializado exclusivo</span>
                                </li>
                                <li className="flex gap-3">
                                    <Check className="h-5 w-5 shrink-0 text-white" />
                                    <span className="text-slate-200 font-medium">Networking en el Directorio Pericial</span>
                                </li>
                            </ul>
                            
                            <Link href="/auth/register?vertical=ciencias_forenses" className="mt-10 relative z-10">
                                <Button className="w-full h-12 bg-slate-900 text-white hover:bg-slate-950 border border-slate-700 font-semibold text-base">
                                    Avisarme del lanzamiento
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        
                    </div>
                </div>
            </section>
        </div>
    )
}

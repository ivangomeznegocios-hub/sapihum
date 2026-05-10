import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Eventos | SAPIHUM Ciencias Forenses',
    description: 'Próximos eventos, masterclasses y sesiones en vivo de Ciencias Forenses.',
}

export default function ForensicEventsPage() {
    // Para simplificar la primera iteración pública y asegurar que no haya
    // fallos al buscar eventos de una vertical nueva, mostramos el estado de apertura.
    
    return (
        <div className="flex-1 w-full bg-slate-950 text-slate-200">
            <section className="min-h-[80vh] flex items-center justify-center py-20">
                <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-800">
                        <Calendar className="h-10 w-10 text-slate-400" />
                    </div>
                    
                    <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        Próximos eventos forenses en apertura
                    </h1>
                    
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
                        Estamos integrando las primeras sesiones, docentes y programas de la vertical de Ciencias Forenses. Muy pronto encontrarás aquí masterclasses, eventos en vivo y sesiones especializadas.
                    </p>
                    
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href="/ciencias-forenses">
                            <Button size="lg" variant="outline" className="h-12 w-full min-w-[200px] gap-2 border-slate-700 bg-transparent px-8 font-semibold text-white hover:bg-slate-900 sm:w-auto">
                                <ArrowLeft className="h-4 w-4" />
                                Volver a Ciencias Forenses
                            </Button>
                        </Link>
                        <Link href="/ciencias-forenses/planes">
                            <Button size="lg" className="h-12 w-full min-w-[200px] gap-2 px-8 font-semibold bg-white text-slate-950 hover:bg-slate-200 sm:w-auto">
                                Ver planes
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Seleccionar area | SAPIHUM',
    description: 'Elige si quieres ingresar a SAPIHUM Psicologia o SAPIHUM Ciencias Forenses.',
    alternates: {
        canonical: '/areas',
    },
}

export default function AreasPage() {
    return (
        <main className="min-h-screen bg-brand-surface px-4 py-8 text-brand-text sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
                <header className="flex items-center justify-between">
                    <Link href="/" aria-label="SAPIHUM">
                        <BrandWordmark className="text-base" />
                    </Link>
                    <Link href="/auth/login">
                        <Button variant="outline" size="sm" className="font-semibold">
                            Iniciar sesion
                        </Button>
                    </Link>
                </header>

                <section className="flex flex-1 flex-col justify-center py-16">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-blue">
                            Entrada SAPIHUM
                        </p>
                        <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-brand-text-strong sm:text-5xl">
                            Elige el area a la que quieres ingresar.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-text-muted sm:text-lg">
                            SAPIHUM mantiene una sola cuenta y un solo core. La experiencia publica de Psicologia se conserva como estaba; Ciencias Forenses inicia como una vertical separada.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-4 md:grid-cols-2">
                        <Link
                            href="/"
                            className="group rounded-md border border-brand-border bg-white p-6 shadow-sm transition-colors hover:border-brand-blue/50"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue">
                                SAPIHUM Psicologia
                            </p>
                            <h2 className="mt-3 text-2xl font-bold text-brand-text-strong">
                                Psicologia
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">
                                Ingresa a la experiencia publica ya existente de SAPIHUM para psicologos, especialidades, academia, recursos y planes.
                            </p>
                            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue">
                                Entrar a Psicologia
                                <ArrowRight className="h-4 w-4" />
                            </span>
                        </Link>

                        <Link
                            href="/ciencias-forenses"
                            className="group rounded-md border border-brand-border bg-white p-6 shadow-sm transition-colors hover:border-brand-blue/50"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue">
                                SAPIHUM Ciencias Forenses
                            </p>
                            <h2 className="mt-3 text-2xl font-bold text-brand-text-strong">
                                Ciencias Forenses
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">
                                Ingresa a la nueva vertical forense para construir una experiencia separada de la psicologia.
                            </p>
                            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue">
                                Entrar a Ciencias Forenses
                                <ArrowRight className="h-4 w-4" />
                            </span>
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    )
}

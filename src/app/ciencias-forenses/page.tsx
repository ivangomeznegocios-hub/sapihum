import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'SAPIHUM Ciencias Forenses',
    description: 'Entrada separada para la vertical de Ciencias Forenses en SAPIHUM.',
    alternates: {
        canonical: '/ciencias-forenses',
    },
}

const forensicTracks = [
    'Criminalistica',
    'Criminologia',
    'Psicologia forense',
    'Perfilacion criminal',
]

const forensicModules = [
    'Eventos y clases forenses',
    'Diplomados y formaciones',
    'Comunidad pericial',
    'Recursos tecnicos en preparacion',
]

export default function CienciasForensesPage() {
    return (
        <main className="min-h-screen bg-background text-brand-text">
            <header className="sticky top-0 z-40 border-b border-brand-border bg-brand-surface/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" aria-label="SAPIHUM">
                        <BrandWordmark className="text-base" />
                    </Link>
                    <nav className="hidden items-center gap-5 text-sm font-semibold text-brand-text-muted md:flex">
                        <a href="#tracks" className="hover:text-brand-blue">Tracks</a>
                        <a href="#modulos" className="hover:text-brand-blue">Modulos</a>
                        <a href="#estado" className="hover:text-brand-blue">Estado</a>
                    </nav>
                    <Link href="/auth/register?vertical=ciencias_forenses">
                        <Button size="sm" className="font-semibold">
                            Unirme
                        </Button>
                    </Link>
                </div>
            </header>

            <section className="relative min-h-[72svh] overflow-hidden bg-slate-950 text-white">
                <Image
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1800&q=80"
                    alt="Ciencias Forenses"
                    fill
                    priority
                    quality={72}
                    sizes="100vw"
                    className="object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/78 to-slate-950/20" />
                <div className="relative z-10 mx-auto flex min-h-[72svh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200">
                            SAPIHUM Ciencias Forenses
                        </p>
                        <h1 className="mt-5 font-serif text-4xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                            Una nueva vertical para formacion forense y trabajo pericial.
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
                            Esta experiencia se construye separada de Psicologia, con sus propios contenidos, rutas y prioridades, manteniendo una sola cuenta SAPIHUM.
                        </p>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <Link href="/auth/register?vertical=ciencias_forenses">
                                <Button size="lg" className="h-12 w-full gap-2 px-7 font-semibold sm:w-auto">
                                    Crear acceso forense
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/">
                                <Button size="lg" variant="outline" className="h-12 w-full border-white/30 bg-white/10 px-7 font-semibold text-white hover:bg-white hover:text-slate-950 sm:w-auto">
                                    Cambiar area
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section id="tracks" className="border-b border-brand-border bg-white px-4 py-14 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                        Tracks iniciales
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {forensicTracks.map((track) => (
                            <span key={track} className="rounded-full border border-brand-border bg-brand-surface-soft px-4 py-2 text-sm font-medium">
                                {track}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <section id="modulos" className="px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="max-w-2xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                            Modulos forenses
                        </p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-text-strong">
                            Estructura separada, sin modificar Psicologia
                        </h2>
                    </div>
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        {forensicModules.map((module) => (
                            <div key={module} className="flex gap-3 rounded-md border border-brand-border bg-white p-5 shadow-sm">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                                <span className="font-medium">{module}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="estado" className="border-t border-brand-border bg-brand-surface-soft px-4 py-14 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <h2 className="text-2xl font-bold tracking-tight text-brand-text-strong">
                        Estado de la vertical
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-text-muted">
                        Ciencias Forenses queda separada a nivel de experiencia. El siguiente paso, con aprobacion previa, sera conectar productos, precios y checkout propios de esta vertical.
                    </p>
                </div>
            </section>
        </main>
    )
}

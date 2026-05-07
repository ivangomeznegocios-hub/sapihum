import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VerticalExperience } from '@/lib/vertical-experience'

interface VerticalLandingProps {
    experience: VerticalExperience
}

export function VerticalLanding({ experience }: VerticalLandingProps) {
    return (
        <div className="flex w-full flex-1 flex-col bg-background">
            <section className="relative min-h-[72svh] overflow-hidden bg-slate-950 text-white">
                <Image
                    src={experience.heroImage}
                    alt={experience.name}
                    fill
                    priority
                    quality={72}
                    sizes="100vw"
                    className="object-cover opacity-62"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/72 to-slate-950/20" />
                <div className="relative z-10 mx-auto flex min-h-[72svh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200">
                            {experience.eyebrow}
                        </p>
                        <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.05] tracking-normal sm:text-5xl lg:text-6xl">
                            {experience.headline}
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
                            {experience.description}
                        </p>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <Link href={experience.secondaryAction.href}>
                                <Button size="lg" className="h-12 w-full gap-2 px-7 font-semibold sm:w-auto">
                                    {experience.secondaryAction.label}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button size="lg" variant="outline" className="h-12 w-full border-white/30 bg-white/10 px-7 font-semibold text-white hover:bg-white hover:text-slate-950 sm:w-auto">
                                    Crear cuenta
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-border bg-white px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                            Para quien es
                        </p>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-text-strong">
                            Una vertical con experiencia propia dentro de SAPIHUM
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">
                            La cuenta, pagos y tecnologia se mantienen en un solo core, pero el contenido,
                            dashboard y rutas de trabajo cambian segun el area activa.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {experience.audience.map((item) => (
                            <div key={item} className="flex items-center gap-3 rounded-md border border-brand-border bg-brand-surface-soft px-4 py-3">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-blue" />
                                <span className="text-sm font-medium text-brand-text">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 max-w-2xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                            Modulos principales
                        </p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                            Lo que veras en {experience.name}
                        </h2>
                    </div>
                    <div className="grid gap-5 md:grid-cols-3">
                        {experience.publicModules.map((module) => (
                            <Link
                                key={module.href}
                                href={module.href}
                                className="group rounded-md border border-brand-border bg-white p-5 shadow-sm transition-colors hover:border-brand-blue/40"
                            >
                                <h3 className="text-lg font-semibold text-brand-text-strong group-hover:text-brand-blue">
                                    {module.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">
                                    {module.description}
                                </p>
                                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue">
                                    Abrir
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-y border-border bg-brand-surface-soft px-4 py-14 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                        Tracks y lineas tematicas
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {experience.specialties.map((specialty) => (
                            <span key={specialty} className="rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-text">
                                {specialty}
                            </span>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

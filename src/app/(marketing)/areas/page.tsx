import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VERTICAL_EXPERIENCE_LIST } from '@/lib/vertical-experience'

export const metadata: Metadata = {
    title: 'Areas SAPIHUM | Psicologia y Ciencias Forenses',
    description: 'Elige entre Psicologia y Ciencias Forenses dentro de una sola plataforma SAPIHUM.',
    alternates: {
        canonical: '/areas',
    },
}

export default function AreasPage() {
    return (
        <div className="flex w-full flex-1 flex-col bg-background">
            <section className="border-b border-border bg-white px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-blue">
                        SAPIHUM multi-vertical
                    </p>
                    <h1 className="mt-4 max-w-4xl font-serif text-4xl font-bold leading-[1.05] tracking-normal text-brand-text-strong md:text-5xl">
                        Elige el area desde donde quieres trabajar.
                    </h1>
                    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-brand-text-muted">
                        Una sola cuenta, una sola plataforma y experiencias separadas para Psicologia y Ciencias Forenses.
                    </p>
                </div>
            </section>

            <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
                    {VERTICAL_EXPERIENCE_LIST.map((experience) => (
                        <article key={experience.code} className="overflow-hidden rounded-md border border-brand-border bg-white shadow-sm">
                            <div className="relative aspect-[16/9] bg-slate-950">
                                <Image
                                    src={experience.heroImage}
                                    alt={experience.name}
                                    fill
                                    quality={72}
                                    sizes="(min-width: 1024px) 50vw, 100vw"
                                    className="object-cover opacity-72"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/84 via-slate-950/24 to-transparent" />
                                <div className="absolute bottom-5 left-5 right-5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
                                        {experience.eyebrow}
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold text-white">
                                        {experience.name}
                                    </h2>
                                </div>
                            </div>
                            <div className="space-y-5 p-6">
                                <p className="text-sm leading-relaxed text-brand-text-muted">
                                    {experience.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {experience.specialties.slice(0, 4).map((specialty) => (
                                        <span key={specialty} className="rounded-full bg-brand-surface-soft px-3 py-1 text-xs font-medium text-brand-text">
                                            {specialty}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Link href={experience.primaryAction.href}>
                                        <Button className="w-full gap-2 sm:w-auto">
                                            {experience.primaryAction.label}
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link href={experience.secondaryAction.href}>
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            {experience.secondaryAction.label}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    )
}

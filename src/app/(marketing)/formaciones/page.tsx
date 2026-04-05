import Link from 'next/link'
import { GraduationCap, ArrowRight, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPublicFormations } from './actions'
import { getSpecializationByCode } from '@/lib/specializations'

export const metadata = {
    title: 'Formaciones Completas | SAPIHUM',
    description: 'Rutas de formacion profesional integral en psicologia clinica.',
}

function formatCurrency(value: number | null | undefined) {
    return `$${Number(value || 0)} MXN`
}

export default async function FormationsCatalogPage() {
    const formations = await getPublicFormations()

    return (
        <div className="min-h-screen bg-neutral-50">
            <section className="relative overflow-hidden bg-[#0a0a0a] py-24 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/20 via-transparent to-brand-brown/20" />

                <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl space-y-6">
                        <Badge variant="outline" className="mb-4 gap-2 border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow">
                            <GraduationCap className="h-4 w-4" />
                            Academia SAPIHUM
                        </Badge>

                        <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
                            Formaciones <span className="bg-gradient-to-r from-brand-yellow to-brand-brown bg-clip-text text-transparent">Completas</span>
                        </h1>

                        <p className="text-xl font-light text-neutral-300 md:text-2xl">
                            Programas integrales que unen multiples cursos para darte una acreditacion especializada y una ventaja real en tu desarrollo profesional.
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-20">
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    {formations.length === 0 ? (
                        <div className="rounded-2xl border bg-white py-20 text-center shadow-sm">
                            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
                            <h3 className="text-2xl font-bold text-neutral-800">Proximamente</h3>
                            <p className="mt-2 text-neutral-500">
                                Estamos construyendo nuevos programas formativos completos.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-10">
                            {formations.map((formation: any) => {
                                const specialization = getSpecializationByCode(formation.specialization_code)

                                return (
                                    <article
                                        key={formation.id}
                                        className="grid items-center gap-8 rounded-3xl border bg-white p-6 shadow-xl shadow-neutral-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:grid-cols-2 md:p-8 lg:p-12"
                                    >
                                        <div className="order-2 space-y-6 md:order-1">
                                            {specialization && (
                                                <Badge variant="outline" className="w-fit border-brand-brown/20 bg-brand-brown/10 text-brand-brown">
                                                    Incluida en {specialization.name} Nivel 2+
                                                </Badge>
                                            )}

                                            <div className="space-y-4">
                                                <h2 className="text-3xl font-bold leading-tight tracking-tight text-neutral-900">
                                                    {formation.title}
                                                </h2>
                                                {formation.subtitle && (
                                                    <p className="text-xl font-medium text-neutral-600">
                                                        {formation.subtitle}
                                                    </p>
                                                )}
                                            </div>

                                            {formation.description && (
                                                <p className="line-clamp-3 leading-relaxed text-neutral-500">
                                                    {formation.description}
                                                </p>
                                            )}

                                            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
                                                <Button asChild size="lg" className="w-full rounded-full px-8 text-base sm:w-auto">
                                                    <Link href={`/formaciones/${formation.slug}`}>
                                                        Ver programa completo
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>

                                                <div className="text-center sm:text-left">
                                                    <span className="block text-sm text-neutral-500">Inversion bundle</span>
                                                    <span className="text-xl font-bold text-neutral-900">
                                                        {formatCurrency(formation.bundle_price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="order-1 md:order-2">
                                            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-900/5">
                                                {formation.image_url ? (
                                                    <img
                                                        src={formation.image_url}
                                                        alt={formation.title}
                                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-yellow/20 to-white">
                                                        <PlayCircle className="h-20 w-20 text-brand-yellow" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

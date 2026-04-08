import Link from 'next/link'
import Image from 'next/image'
import type { Formation } from '@/types/database'
import { GraduationCap, ArrowRight, PlayCircle, Award, Clock3, Sparkles, Layers3, LibraryBig } from 'lucide-react'
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

function formatHours(value: number | null | undefined) {
    const hours = Number(value || 0)
    if (!hours) return null
    return Number.isInteger(hours) ? `${hours} horas` : `${hours.toFixed(1)} horas`
}

function getCertificateLabel(formation: Formation) {
    if (formation.full_certificate_type && formation.full_certificate_type !== 'none') {
        return formation.full_certificate_label || 'Certificado final'
    }

    if (formation.individual_certificate_type && formation.individual_certificate_type !== 'none') {
        return 'Certificados por modulo'
    }

    return 'Ruta guiada'
}

function getMemberBenefitLabel(formation: Formation) {
    if (formation.bundle_member_access_type === 'free') {
        return 'Incluida para miembros activos'
    }

    if (formation.bundle_member_access_type === 'discounted') {
        return `Desde ${formatCurrency(formation.bundle_member_price)} para miembros`
    }

    return 'Compra directa disponible'
}

export default async function FormationsCatalogPage() {
    const formations = await getPublicFormations()

    return (
        <div className="min-h-screen bg-[#030303] text-white">
            <section className="relative overflow-hidden bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#030303] py-24 text-white">
                <div className="sapihum-grid-bg pointer-events-none absolute inset-0 opacity-10" />
                <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-brand-yellow/10 blur-[130px]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-brand-brown/10 blur-[120px]" />

                <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
                        <div className="max-w-3xl space-y-6">
                            <Badge variant="outline" className="gap-2 border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow">
                                <GraduationCap className="h-4 w-4" />
                                Academia SAPIHUM
                            </Badge>

                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                                    Formaciones
                                    <span className="block font-serif text-[#c0bfbc] italic font-normal">
                                        completas y comprables
                                    </span>
                                </h1>

                                <p className="max-w-2xl text-lg leading-relaxed text-neutral-400 md:text-xl">
                                    Programas pensados como una ruta real: una sola compra, un orden claro de avance,
                                    materiales complementarios y una experiencia coherente con el nivel profesional de SAPIHUM.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                                    Lo que encuentras aqui
                                </p>
                                <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                                    Rutas premium con acceso inmediato, bloques organizados por modulo y beneficios claros para miembros.
                                </p>
                            </div>

                            <div className="grid gap-3">
                                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Compra</p>
                                    <p className="mt-2 text-sm text-neutral-200">Un solo pago por programa completo, sin perder el detalle de cada modulo.</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Ruta</p>
                                    <p className="mt-2 text-sm text-neutral-200">Secuencia clara de eventos y materiales para avanzar con orden.</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Beneficios</p>
                                    <p className="mt-2 text-sm text-neutral-200">Certificacion final y acceso preferencial para miembros cuando aplica.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto w-full max-w-7xl">
                    {formations.length === 0 ? (
                        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] py-20 text-center shadow-2xl shadow-black/30">
                            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-brand-yellow" />
                            <h3 className="text-2xl font-bold text-white">Proximamente</h3>
                            <p className="mt-2 text-neutral-400">
                                Estamos construyendo nuevos programas formativos completos.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-8 lg:grid-cols-2">
                            {formations.map((formation) => {
                                const specialization = getSpecializationByCode(formation.specialization_code)
                                const totalHours = formatHours(formation.total_hours)
                                const certificateLabel = getCertificateLabel(formation)
                                const memberBenefit = getMemberBenefitLabel(formation)
                                const materialCount = formation.material_links?.length || 0

                                return (
                                    <article
                                        key={formation.id}
                                        className="group overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-brand-yellow/20"
                                    >
                                        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-gradient-to-br from-brand-yellow/20 via-black to-brand-brown/30">
                                            {formation.image_url ? (
                                                <Image
                                                    src={formation.image_url}
                                                    alt={formation.title}
                                                    fill
                                                    unoptimized
                                                    sizes="(min-width: 1024px) 50vw, 100vw"
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <PlayCircle className="h-16 w-16 text-white/20" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                                                <span className="inline-flex rounded-full bg-brand-yellow px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
                                                    Formacion
                                                </span>
                                                {specialization && (
                                                    <span className="inline-flex rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                                                        {specialization.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-6 p-6 md:p-8">
                                            <div className="space-y-3">
                                                <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
                                                    {formation.title}
                                                </h2>
                                                {formation.subtitle && (
                                                    <p className="text-base font-medium leading-relaxed text-neutral-300">
                                                        {formation.subtitle}
                                                    </p>
                                                )}
                                                {formation.description && (
                                                    <p className="line-clamp-3 text-sm leading-relaxed text-neutral-400">
                                                        {formation.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {totalHours && (
                                                    <Badge variant="outline" className="border-white/10 bg-white/5 text-neutral-200">
                                                        {totalHours}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="border-white/10 bg-white/5 text-neutral-200">
                                                    Programa completo
                                                </Badge>
                                                <Badge variant="outline" className="border-white/10 bg-white/5 text-neutral-200">
                                                    {materialCount > 0 ? `${materialCount} materiales` : 'Ruta guiada'}
                                                </Badge>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                                                        <Clock3 className="h-4 w-4 text-brand-yellow" />
                                                        Duracion
                                                    </div>
                                                    <p className="mt-3 text-sm font-medium text-white">{totalHours || 'Ruta por modulos'}</p>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                                                        <Award className="h-4 w-4 text-brand-yellow" />
                                                        Certificacion
                                                    </div>
                                                    <p className="mt-3 text-sm font-medium text-white">{certificateLabel}</p>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                                                        <Sparkles className="h-4 w-4 text-brand-yellow" />
                                                        Membresia
                                                    </div>
                                                    <p className="mt-3 text-sm font-medium text-white">{memberBenefit}</p>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                                                        {materialCount > 0 ? (
                                                            <LibraryBig className="h-4 w-4 text-brand-yellow" />
                                                        ) : (
                                                            <Layers3 className="h-4 w-4 text-brand-yellow" />
                                                        )}
                                                        Recursos
                                                    </div>
                                                    <p className="mt-3 text-sm font-medium text-white">
                                                        {materialCount > 0 ? `${materialCount} enlaces incluidos` : 'Acceso por modulos'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
                                                        Inversion completa
                                                    </p>
                                                    <p className="mt-2 text-3xl font-black text-white">
                                                        {formatCurrency(formation.bundle_price)}
                                                    </p>
                                                </div>

                                                <Button asChild size="lg" className="w-full sm:w-auto">
                                                    <Link href={`/formaciones/${formation.slug}`}>
                                                        Ver programa completo
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
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

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import type { Formation } from '@/types/database'
import { GraduationCap, ArrowRight, PlayCircle, Award, Clock3, Sparkles, Layers3, LibraryBig } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPublicFormations } from './actions'
import { getSpecializationByCode } from '@/lib/specializations'

const formacionesDescription = 'Rutas de formacion profesional integral en psicologia clinica.'

export const metadata: Metadata = {
    title: 'Formaciones Completas | SAPIHUM',
    description: formacionesDescription,
    alternates: {
        canonical: '/formaciones',
    },
    openGraph: {
        title: 'Formaciones Completas | SAPIHUM',
        description: formacionesDescription,
        url: '/formaciones',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Formaciones Completas | SAPIHUM',
        description: formacionesDescription,
    },
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
        <div className="min-h-screen bg-background text-foreground">
            <section className="relative overflow-hidden bg-gradient-to-b from-background via-brand-blue-soft/60 to-background py-24 text-foreground">
                <div className="sapihum-grid-bg pointer-events-none absolute inset-0 opacity-10" />
                <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-brand-blue/10 blur-[130px]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-brand-blue-hover/10 blur-[120px]" />

                <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
                        <div className="max-w-3xl space-y-6">
                            <Badge variant="outline" className="gap-2 border-brand-blue/30 bg-brand-blue/10 text-brand-blue">
                                <GraduationCap className="h-4 w-4" />
                                Academia SAPIHUM
                            </Badge>

                            <div className="space-y-4">
                                <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-normal text-brand-text-strong md:text-5xl lg:text-6xl">
                                    Formaciones
                                    <span className="block italic font-bold text-brand-blue-dark">
                                        completas y comprables
                                    </span>
                                </h1>

                                <p className="max-w-2xl text-lg leading-relaxed text-brand-text-muted md:text-xl">
                                    Programas pensados como una ruta real: una sola compra, un orden claro de avance,
                                    materiales complementarios y una experiencia coherente con el nivel profesional de SAPIHUM.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 rounded-3xl border border-brand-border bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                                    Lo que encuentras aqui
                                </p>
                                <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">
                                    Rutas premium con acceso inmediato, bloques organizados por modulo y beneficios claros para miembros.
                                </p>
                            </div>

                            <div className="grid gap-3">
                                <div className="rounded-2xl border border-brand-border bg-brand-surface-soft p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-text-muted">Compra</p>
                                    <p className="mt-2 text-sm text-brand-text">Un solo pago por programa completo, sin perder el detalle de cada modulo.</p>
                                </div>
                                <div className="rounded-2xl border border-brand-border bg-brand-surface-soft p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-text-muted">Ruta</p>
                                    <p className="mt-2 text-sm text-brand-text">Secuencia clara de eventos y materiales para avanzar con orden.</p>
                                </div>
                                <div className="rounded-2xl border border-brand-border bg-brand-surface-soft p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-text-muted">Beneficios</p>
                                    <p className="mt-2 text-sm text-brand-text">Certificacion final y acceso preferencial para miembros cuando aplica.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto w-full max-w-7xl">
                    {formations.length === 0 ? (
                        <div className="rounded-[32px] border border-brand-border bg-white py-20 text-center shadow-sm">
                            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-brand-blue" />
                            <h3 className="text-2xl font-bold text-brand-text-strong">Proximamente</h3>
                            <p className="mt-2 text-brand-text-muted">
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
                                        className="group overflow-hidden rounded-[32px] border border-brand-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
                                    >
                                        <div className="relative aspect-[16/10] overflow-hidden border-b border-border/10 bg-gradient-to-br from-brand-blue/20 via-background to-brand-blue-hover/30">
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
                                                    <PlayCircle className="h-16 w-16 text-foreground/20" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-slate-950/18 to-transparent" />

                                            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                                                <span className="inline-flex rounded-full bg-brand-blue px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                                                    Formacion
                                                </span>
                                                {specialization && (
                                                    <span className="inline-flex rounded-full border border-white/30 bg-white/88 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-strong">
                                                        {specialization.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-6 p-6 md:p-8">
                                            <div className="space-y-3">
                                                <h2 className="font-serif text-3xl font-bold leading-tight tracking-normal text-brand-text-strong">
                                                    {formation.title}
                                                </h2>
                                                {formation.subtitle && (
                                                    <p className="text-base font-medium leading-relaxed text-brand-text-muted">
                                                        {formation.subtitle}
                                                    </p>
                                                )}
                                                {formation.description && (
                                                    <p className="line-clamp-3 text-sm leading-relaxed text-brand-text-muted">
                                                        {formation.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {totalHours && (
                                                    <Badge variant="outline" className="border-brand-border bg-brand-surface-soft text-brand-text">
                                                        {totalHours}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="border-brand-border bg-brand-surface-soft text-brand-text">
                                                    Programa completo
                                                </Badge>
                                                <Badge variant="outline" className="border-brand-border bg-brand-surface-soft text-brand-text">
                                                    {materialCount > 0 ? `${materialCount} materiales` : 'Ruta guiada'}
                                                </Badge>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="rounded-2xl border border-brand-border bg-brand-surface-soft p-4">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-text-muted">
                                                        <Clock3 className="h-4 w-4 text-brand-blue" />
                                                        Duracion
                                                    </div>
                                                    <p className="mt-3 text-sm font-medium text-brand-text">{totalHours || 'Ruta por modulos'}</p>
                                                </div>

                                                <div className="rounded-2xl border border-brand-border bg-brand-surface-soft p-4">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-text-muted">
                                                        <Award className="h-4 w-4 text-brand-blue" />
                                                        Certificacion
                                                    </div>
                                                    <p className="mt-3 text-sm font-medium text-brand-text">{certificateLabel}</p>
                                                </div>

                                                <div className="rounded-2xl border border-brand-border bg-brand-surface-soft p-4">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-text-muted">
                                                        <Sparkles className="h-4 w-4 text-brand-blue" />
                                                        Membresia
                                                    </div>
                                                    <p className="mt-3 text-sm font-medium text-brand-text">{memberBenefit}</p>
                                                </div>

                                                <div className="rounded-2xl border border-brand-border bg-brand-surface-soft p-4">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-text-muted">
                                                        {materialCount > 0 ? (
                                                            <LibraryBig className="h-4 w-4 text-brand-blue" />
                                                        ) : (
                                                            <Layers3 className="h-4 w-4 text-brand-blue" />
                                                        )}
                                                        Recursos
                                                    </div>
                                                    <p className="mt-3 text-sm font-medium text-brand-text">
                                                        {materialCount > 0 ? `${materialCount} enlaces incluidos` : 'Acceso por modulos'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-4 border-t border-border/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-text-muted">
                                                        Inversion completa
                                                    </p>
                                                    <p className="mt-2 text-3xl font-black text-brand-text-strong">
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

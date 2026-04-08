import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
    GraduationCap,
    CheckCircle2,
    Award,
    PlayCircle,
    ArrowRight,
    ShieldCheck,
    Clock3,
    Sparkles,
    CalendarDays,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPublicFormationBySlug } from '../actions'
import { CheckoutButton } from '@/components/payments/CheckoutButton'
import { getSpecializationByCode } from '@/lib/specializations'

export const metadata = {
    title: 'Formacion Completa | SAPIHUM',
}

function formatHours(hours: number | null | undefined) {
    const resolved = Number(hours || 0)
    if (!resolved) return null
    return Number.isInteger(resolved) ? `${resolved} horas` : `${resolved.toFixed(1)} horas`
}

function formatCurrency(value: number | null | undefined) {
    return `$${Number(value || 0)} MXN`
}

function formatEventDate(value: string | null | undefined) {
    if (!value) return null

    return new Date(value).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function getEventTypeLabel(value: string | null | undefined) {
    if (value === 'on_demand') return 'Grabacion'
    if (value === 'presencial') return 'Presencial'
    if (value === 'live') return 'En vivo'
    return 'Modulo'
}

export default async function FormationLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const data = await getPublicFormationBySlug(slug)

    if (!data) {
        notFound()
    }

    const { courses, userState, pricing } = data
    const totalIndividualValue = courses.reduce((sum: number, course: any) => sum + (Number(course.event?.price) || 0), 0)
    const savings = totalIndividualValue - pricing.effectivePrice
    const totalHoursLabel = formatHours(data.total_hours)
    const showsFullCertificate = data.full_certificate_type && data.full_certificate_type !== 'none'
    const specialization = getSpecializationByCode(data.specialization_code)
    const materialLinks = Array.isArray(data.material_links)
        ? data.material_links.filter((item: any) => item?.title && item?.url)
        : []

    return (
        <div className="min-h-screen bg-white">
            <section className="relative overflow-hidden bg-black py-24 sm:py-28">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(246,174,2,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(122,86,2,0.22),_transparent_28%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(10,10,10,0.94),rgba(0,0,0,0.82))]" />

                <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8">
                    <div className="max-w-2xl space-y-6 text-white">
                        <Badge variant="outline" className="gap-2 border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow">
                            <GraduationCap className="h-4 w-4" />
                            Formacion Premium
                        </Badge>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                                {data.title}
                            </h1>

                            {data.subtitle && (
                                <p className="text-lg font-light leading-relaxed text-neutral-300 sm:text-2xl">
                                    {data.subtitle}
                                </p>
                            )}

                            {data.description && (
                                <p className="max-w-xl text-base leading-relaxed text-neutral-400">
                                    {data.description}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            {showsFullCertificate && (
                                <div className="flex items-center gap-2 rounded-full border border-brand-brown/20 bg-brand-brown/10 px-4 py-2 text-sm font-medium text-brand-brown">
                                    <Award className="h-4 w-4" />
                                    Incluye {data.full_certificate_label || 'certificado final'}
                                </div>
                            )}

                            {specialization && (
                                <div className="rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-2 text-sm font-medium text-brand-yellow">
                                    {specialization.name}
                                </div>
                            )}

                            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-200">
                                {courses.length} eventos o cursos incluidos
                            </div>

                            {totalHoursLabel && (
                                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-200">
                                    <Clock3 className="h-4 w-4 text-brand-yellow" />
                                    {totalHoursLabel} totales
                                </div>
                            )}

                            {materialLinks.length > 0 && (
                                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-200">
                                    {materialLinks.length} materiales por enlace
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:justify-self-end">
                        <div className="rounded-[28px] bg-white p-8 text-center shadow-2xl ring-1 ring-black/5">
                            {userState.hasPurchasedBundle ? (
                                <div className="flex w-full flex-col items-center py-8">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-brown/10 text-brand-brown">
                                        <ShieldCheck className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-black">Ya estas inscrito</h3>
                                    <p className="mb-8 mt-2 text-neutral-500">
                                        Tienes acceso completo a toda esta formacion.
                                    </p>
                                    <Button asChild size="lg" className="w-full rounded-full">
                                        <Link href="/dashboard/mi-acceso">Ir a Mis Accesos</Link>
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-neutral-400">
                                        Paquete Completo
                                    </h3>

                                    <div className="mb-2 flex items-baseline justify-center gap-2">
                                        <span className="text-5xl font-black text-black">{pricing.effectivePrice}</span>
                                        <span className="text-lg font-bold text-neutral-500">MXN</span>
                                    </div>

                                    {specialization && (
                                        <Badge variant="outline" className="mb-3 border-brand-brown/20 bg-brand-brown/10 text-brand-brown">
                                            Incluida en {specialization.name} Nivel 2+
                                        </Badge>
                                    )}

                                    {pricing.discountedByMembership && (
                                        <Badge variant="outline" className="mb-3 border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow">
                                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                                            Precio preferencial por membresia
                                        </Badge>
                                    )}

                                    {pricing.complimentaryByMembership && (
                                        <Badge variant="outline" className="mb-3 border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow">
                                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                                            Incluido gratis con membresia activa
                                        </Badge>
                                    )}

                                    <div className="mb-1 text-sm text-neutral-500 line-through">
                                        Valor individual: {formatCurrency(totalIndividualValue)}
                                    </div>

                                    {savings > 0 && (
                                        <Badge className="mb-4 border-brand-yellow bg-brand-yellow text-black hover:bg-brand-yellow/90 font-bold uppercase tracking-wider">
                                            Ahorras {formatCurrency(savings)}
                                        </Badge>
                                    )}

                                    {pricing.memberMessage?.note && (
                                        <p className="mb-6 text-xs leading-relaxed text-neutral-500">
                                            {pricing.memberMessage.note}
                                        </p>
                                    )}

                                    <CheckoutButton
                                        purchaseType="formation_purchase"
                                        formationId={data.id}
                                        title={data.title}
                                        label={pricing.needsPayment ? 'Comprar Formacion Completa' : 'Activar Formacion'}
                                        className="w-full rounded-full py-6 text-lg"
                                    />

                                    <p className="mt-4 text-xs leading-relaxed text-neutral-400">
                                        Obtienes acceso inmediato a los {courses.length} eventos o cursos vinculados
                                        {totalHoursLabel ? ` y a ${totalHoursLabel} de contenido` : ''}.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-[#050505] py-20 sm:py-24">
                <div className="sapihum-grid-bg pointer-events-none absolute inset-0 opacity-10" />
                <div className="pointer-events-none absolute left-0 top-0 h-[320px] w-[320px] rounded-full bg-brand-yellow/8 blur-[110px]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-[340px] w-[340px] rounded-full bg-brand-brown/10 blur-[120px]" />

                <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                                Ruta de Formacion
                            </p>
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Tu recorrido completo dentro del programa
                            </h2>
                            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
                                Avanza modulo por modulo con una secuencia clara. Cada paso mantiene el contexto del programa y te acerca a la certificacion final.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Modulos</p>
                                <p className="mt-2 text-2xl font-black text-white">{courses.length}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Duracion</p>
                                <p className="mt-2 text-sm font-semibold text-white">{totalHoursLabel || 'Ruta guiada'}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Resultado</p>
                                <p className="mt-2 text-sm font-semibold text-white">
                                    {showsFullCertificate ? (data.full_certificate_label || 'Certificado final') : 'Acceso por modulo'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative space-y-5 before:absolute before:bottom-0 before:left-6 before:top-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-white/15 before:to-transparent md:before:left-8">
                        {courses.map((course: any, index: number) => {
                            const event = course.event
                            if (!event) return null

                            const hasAccess = userState.accessibleEventIds.includes(event.id) || userState.hasPurchasedBundle
                            const eventDate = formatEventDate(event.start_time)

                            return (
                                <div key={course.id} className="relative grid gap-4 pl-16 md:grid-cols-[72px_minmax(0,1fr)] md:pl-0">
                                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-brand-yellow/30 bg-black text-sm font-bold text-brand-yellow shadow-[0_0_30px_rgba(246,174,2,0.12)] md:mt-6 md:h-16 md:w-16">
                                        {index + 1}
                                    </div>

                                    <article className={`overflow-hidden rounded-[28px] border transition-all duration-300 ${hasAccess ? 'border-brand-yellow/25 bg-white/[0.04]' : 'border-white/10 bg-white/[0.03]'} hover:-translate-y-0.5 hover:border-brand-yellow/20`}>
                                        <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                                            <div className="relative min-h-[220px] overflow-hidden border-b border-white/10 bg-gradient-to-br from-brand-yellow/20 via-black to-brand-brown/30 lg:border-b-0 lg:border-r">
                                                {event.image_url ? (
                                                    <img
                                                        src={event.image_url}
                                                        alt={event.title}
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <PlayCircle className="h-10 w-10 text-white/20" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                                                <div className="absolute left-4 top-4">
                                                    <span className="inline-flex rounded-full bg-brand-yellow px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                                                        Modulo {index + 1}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-5 p-5 md:p-6">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {event.hero_badge && (
                                                        <Badge variant="outline" className="border-brand-yellow/30 bg-brand-yellow/10 text-xs text-brand-yellow">
                                                            {event.hero_badge}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="border-white/10 bg-white/5 text-xs text-neutral-200">
                                                        {getEventTypeLabel(event.event_type)}
                                                    </Badge>
                                                    {eventDate && (
                                                        <Badge variant="outline" className="border-white/10 bg-white/5 text-xs text-neutral-200">
                                                            <CalendarDays className="mr-1 h-3 w-3" />
                                                            {eventDate}
                                                        </Badge>
                                                    )}
                                                    {hasAccess ? (
                                                        <Badge className="border-none bg-brand-yellow/20 text-brand-yellow hover:bg-brand-yellow/20">
                                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                                            Tienes acceso
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-white/10 font-mono text-xs text-white">
                                                            {formatCurrency(event.price)}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <h3 className="text-2xl font-bold leading-tight text-white">
                                                        <Link href={`/eventos/${event.slug}`} className="transition-colors hover:text-brand-yellow">
                                                            {event.title}
                                                        </Link>
                                                    </h3>

                                                    {event.subtitle && (
                                                        <p className="line-clamp-2 text-sm leading-relaxed text-neutral-400">
                                                            {event.subtitle}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Estado dentro de tu ruta</p>
                                                        <p className="mt-2 text-sm font-medium text-white">
                                                            {hasAccess ? 'Incluido en tu acceso actual' : 'Disponible por separado o dentro del bundle'}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Tipo de avance</p>
                                                        <p className="mt-2 text-sm font-medium text-white">
                                                            {course.is_required ? 'Modulo requerido para completar la ruta' : 'Modulo complementario'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <p className="text-sm leading-relaxed text-neutral-400">
                                                        {hasAccess
                                                            ? 'Ya puedes entrar a este modulo desde tu acceso o desde el bundle completo.'
                                                            : 'Puedes revisar este modulo por separado o activarlo junto con toda la formacion.'}
                                                    </p>

                                                    {!hasAccess && !userState.hasPurchasedBundle && (
                                                        <Button variant="outline" size="sm" asChild className="shrink-0">
                                                            <Link href={`/eventos/${event.slug}`}>
                                                                Ver detalle individual
                                                                <ArrowRight className="ml-2 h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {userState.hasPurchasedBundle && materialLinks.length > 0 && (
                <section className="pb-20 sm:pb-24">
                    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-8">
                            <div className="mb-8">
                                <h2 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
                                    Materiales Incluidos
                                </h2>
                                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
                                    Estos enlaces estan disponibles para quienes ya activaron la formacion completa.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {materialLinks.map((item: any) => (
                                    <div key={item.id || item.url} className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-base font-bold text-black">{item.title}</p>
                                            <p className="mt-1 text-sm text-neutral-500">
                                                {item.type === 'presentation' ? 'Presentacion' :
                                                    item.type === 'document' ? 'Documento' :
                                                        item.type === 'folder' ? 'Carpeta' :
                                                            item.type === 'download' ? 'Descarga' : 'Enlace externo'}
                                            </p>
                                        </div>
                                        <Button asChild variant="outline" className="shrink-0">
                                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                Abrir material
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}

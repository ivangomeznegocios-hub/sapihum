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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPublicFormationBySlug } from '../actions'
import { CheckoutButton } from '@/components/payments/CheckoutButton'

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

                            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-200">
                                {courses.length} cursos especializados
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
                                        Obtienes acceso inmediato a los {courses.length} cursos
                                        {totalHoursLabel ? ` y a ${totalHoursLabel} de contenido` : ''}.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 sm:py-24">
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-14 text-center">
                        <h2 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
                            Ruta de Formacion
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-neutral-500">
                            Completa paso a paso cada uno de estos modulos para obtener tu certificacion final.
                        </p>
                    </div>

                    <div className="relative space-y-8 before:absolute before:bottom-0 before:left-7 before:top-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent md:before:left-1/2 md:before:-translate-x-1/2">
                        {courses.map((course: any, index: number) => {
                            const event = course.event
                            if (!event) return null

                            const hasAccess = userState.purchasedCourses.includes(event.id) || userState.hasPurchasedBundle

                            return (
                                <div
                                    key={course.id}
                                    className="relative flex items-start gap-4 md:grid md:grid-cols-[1fr_72px_1fr] md:gap-6"
                                >
                                    <div className={`md:${index % 2 === 0 ? 'col-start-1' : 'col-start-3'} ${index % 2 === 0 ? '' : 'md:text-left'}`}>
                                        <div className="rounded-2xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                                            <div className="flex flex-col gap-4 sm:flex-row">
                                                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-100 sm:w-36 shrink-0">
                                                    {event.image_url ? (
                                                        <img
                                                            src={event.image_url}
                                                            alt={event.title}
                                                            className="absolute inset-0 h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <PlayCircle className="h-8 w-8 text-neutral-300" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {event.hero_badge && (
                                                            <Badge variant="outline" className="bg-brand-yellow/10 text-xs text-brand-yellow">
                                                                {event.hero_badge}
                                                            </Badge>
                                                        )}

                                                        {hasAccess ? (
                                                            <Badge className="border-none bg-brand-yellow/20 text-brand-yellow hover:bg-brand-brown">
                                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                Tienes acceso
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs font-mono">
                                                                {formatCurrency(event.price)}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <h3 className="text-lg font-bold leading-tight text-black hover:underline">
                                                        <Link href={`/eventos/${event.slug}`}>{event.title}</Link>
                                                    </h3>

                                                    {event.subtitle && (
                                                        <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">
                                                            {event.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {!hasAccess && !userState.hasPurchasedBundle && (
                                                <div className="mt-4 flex justify-end border-t pt-4">
                                                    <Button variant="ghost" size="sm" asChild className="text-neutral-600 hover:text-primary">
                                                        <Link href={`/eventos/${event.slug}`}>
                                                            Ver curso individual
                                                            <ArrowRight className="ml-2 h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-white shadow md:col-start-2 md:mx-auto">
                                        <span className="font-bold text-neutral-400">{index + 1}</span>
                                    </div>
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

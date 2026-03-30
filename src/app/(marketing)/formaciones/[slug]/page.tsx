import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, CheckCircle2, Award, PlayCircle, ArrowRight, ShieldCheck, Clock3, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPublicFormationBySlug } from '../actions'
import { CheckoutButton } from '@/components/payments/CheckoutButton'

export const metadata = {
    title: 'FormaciÃ³n Completa | SAPIHUM',
}

function formatHours(hours: number | null | undefined) {
    const resolved = Number(hours || 0)
    if (!resolved) return null
    return Number.isInteger(resolved) ? `${resolved} horas` : `${resolved.toFixed(1)} horas`
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

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <section className="relative overflow-hidden pt-24 pb-32">
                <div className="absolute inset-0 bg-slate-900 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-slate-900/30" />
                </div>

                <div className="container relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6 text-white max-w-2xl">
                            <Badge variant="outline" className="border-indigo-400 text-indigo-300 gap-2 bg-indigo-500/10 backdrop-blur-sm">
                                <GraduationCap className="h-4 w-4" /> FormaciÃ³n Premium
                            </Badge>

                            <h1 className="text-4xl sm:text-5xl lg:text-5xl 2xl:text-6xl font-black leading-tight tracking-tight">
                                {data.title}
                            </h1>

                            {data.subtitle && (
                                <p className="text-xl sm:text-2xl text-slate-300 font-light leading-snug">
                                    {data.subtitle}
                                </p>
                            )}

                            {data.description && (
                                <p className="text-base text-slate-400 max-w-xl">
                                    {data.description}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                {showsFullCertificate && (
                                    <div className="flex items-center gap-2 text-sm text-brand-brown font-medium bg-brand-brown/10 px-4 py-2 rounded-full border border-brand-brown/20">
                                        <Award className="h-5 w-5" />
                                        Incluye {data.full_certificate_label || 'CertificaciÃ³n MÃºltiple'}
                                    </div>
                                )}
                                <div className="text-sm font-medium text-slate-300">
                                    {courses.length} cursos especializados
                                </div>
                                {totalHoursLabel && (
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                                        <Clock3 className="h-4 w-4 text-indigo-300" />
                                        {totalHoursLabel} totales
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:w-[480px] lg:justify-self-end">
                            <div className="bg-white rounded-3xl p-8 shadow-2xl ring-1 ring-slate-900/5 flex flex-col items-center text-center">
                                {userState.hasPurchasedBundle ? (
                                    <div className="full-w py-8 flex flex-col items-center">
                                        <div className="h-16 w-16 bg-brand-brown rounded-full flex items-center justify-center text-brand-brown mb-4">
                                            <ShieldCheck className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900">Â¡Ya estÃ¡s inscrito!</h3>
                                        <p className="text-slate-500 mt-2 mb-8">Tienes acceso completo a toda esta formaciÃ³n.</p>
                                        <Button asChild size="lg" className="w-full rounded-full">
                                            <Link href="/dashboard/mi-acceso">Ir a Mis Accesos</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Paquete Completo</h3>
                                        <div className="flex items-baseline gap-2 justify-center mb-2">
                                            <span className="text-5xl font-black text-slate-900">${pricing.effectivePrice}</span>
                                            <span className="text-lg font-bold text-slate-500">MXN</span>
                                        </div>

                                        {pricing.discountedByMembership && (
                                            <Badge variant="outline" className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-700">
                                                <Sparkles className="mr-1 h-3.5 w-3.5" />
                                                Precio preferencial por membresÃ­a
                                            </Badge>
                                        )}

                                        {pricing.complimentaryByMembership && (
                                            <Badge variant="outline" className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-700">
                                                <Sparkles className="mr-1 h-3.5 w-3.5" />
                                                Incluido gratis con membresÃ­a activa
                                            </Badge>
                                        )}

                                        <div className="text-sm text-slate-500 line-through mb-1">
                                            Valor individual: ${totalIndividualValue} MXN
                                        </div>
                                        {savings > 0 && (
                                            <Badge className="bg-brand-brown text-brand-brown hover:bg-brand-brown border-brand-brown mb-4">
                                                Ahorras ${savings} MXN
                                            </Badge>
                                        )}

                                        {pricing.memberMessage?.note && (
                                            <p className="text-xs text-slate-500 leading-relaxed mb-6">
                                                {pricing.memberMessage.note}
                                            </p>
                                        )}

                                        <div className="w-full">
                                            <CheckoutButton
                                                purchaseType="formation_purchase"
                                                formationId={data.id}
                                                title={data.title}
                                                label={pricing.needsPayment ? 'Comprar FormaciÃ³n Completa' : 'Activar FormaciÃ³n'}
                                                className="w-full py-6 text-lg rounded-full"
                                            />
                                        </div>

                                        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                                            Obtienes acceso inmediato a los {courses.length} cursos{totalHoursLabel ? ` y a ${totalHoursLabel} de contenido` : ''}.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 container max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Ruta de FormaciÃ³n</h2>
                    <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">
                        Completa paso a paso cada uno de estos mÃ³dulos para obtener tu certificaciÃ³n final.
                    </p>
                </div>

                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[3.5rem] md:before:ml-[4.5rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {courses.map((course: any, index: number) => {
                        const event = course.event
                        if (!event) return null

                        const hasAccess = userState.purchasedCourses.includes(event.id) || userState.hasPurchasedBundle

                        return (
                            <div key={course.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-slate-50 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 transition-transform duration-300">
                                    <span className="font-bold text-slate-400">{index + 1}</span>
                                </div>

                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="relative w-full sm:w-32 aspect-video bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                            {event.image_url ? (
                                                <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <PlayCircle className="h-8 w-8 text-slate-300" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {event.hero_badge && (
                                                    <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700">{event.hero_badge}</Badge>
                                                )}
                                                {hasAccess ? (
                                                    <Badge className="bg-brand-brown text-brand-brown hover:bg-brand-brown border-none">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Tienes acceso
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs font-mono">${event.price} MXN</Badge>
                                                )}
                                            </div>

                                            <h3 className="font-bold leading-tight line-clamp-2 hover:underline">
                                                <Link href={`/hub/${event.slug}`}>{event.title}</Link>
                                            </h3>

                                            {event.subtitle && (
                                                <p className="text-sm text-slate-500 line-clamp-2">{event.subtitle}</p>
                                            )}
                                        </div>
                                    </div>

                                    {!hasAccess && !userState.hasPurchasedBundle && (
                                        <div className="mt-4 pt-4 border-t flex justify-end">
                                            <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-primary">
                                                <Link href={`/hub/${event.slug}`}>
                                                    Ver curso individual <ArrowRight className="h-4 w-4 ml-2" />
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}

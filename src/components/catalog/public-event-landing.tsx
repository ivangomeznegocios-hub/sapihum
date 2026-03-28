'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getEventMemberAccessMessage } from '@/lib/events/pricing'
import { getDefaultPublicCtaLabel, getPublicCatalogTitle, getPublicEventPath } from '@/lib/events/public'
import { PublicAccessCta } from './public-access-cta'

function formatEventDate(date: string) {
    return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date))
}

function getAudienceLabel(audience: string[] | null | undefined): string {
    if (!audience || audience.length === 0) return 'Público general'
    const labels: Record<string, string> = {
        public: 'Público general',
        members: 'Miembros de la comunidad',
        psychologist: 'Profesionales de psicología',
        admin: 'Administradores',
        ponente: 'Ponentes',
    }
    return audience.map(a => labels[a] || a).join(' · ')
}

function buildFaq(event: any) {
    const items = [
        {
            question: '¿Cómo funciona el acceso después de registrarme o comprar?',
            answer: 'Recibirás acceso al hub privado del evento. Desde ahí podrás entrar al vivo, ver materiales y recuperar tu acceso con tu correo.',
        },
        {
            question: '¿Necesito una cuenta completa para participar?',
            answer: 'No. Puedes comenzar con acceso rápido por correo y crear tu cuenta después si quieres acceder a la comunidad y networking.',
        },
    ]

    if (event.recording_url || event.event_type === 'on_demand') {
        items.push({
            question: '¿La grabación queda disponible después?',
            answer: event.recording_expires_at
                ? `Sí. La ventana actual termina el ${new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(event.recording_expires_at))}.`
                : 'Sí. La grabación queda disponible mientras tu acceso esté activo.',
        })
    }

    if (Number(event.price || 0) > 0) {
        items.push({
            question: '¿Qué obtengo si ya soy miembro?',
            answer: getEventMemberAccessMessage(event).note || 'La membresía puede incluir acceso o precio preferencial según la oferta de este evento.',
        })
    }

    return items
}

function buildStructuredData(event: any) {
    const schemaType = event.event_type === 'course'
        ? 'Course'
        : event.event_type === 'on_demand' || (event.status === 'completed' && event.recording_url)
            ? 'Product'
            : 'Event'

    const base: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name: event.seo_title || event.title,
        description: event.seo_description || event.og_description || event.description || event.title,
        image: event.image_url ? [event.image_url] : undefined,
    }

    if (schemaType === 'Event') {
        base.startDate = event.start_time
        base.endDate = event.end_time || undefined
        base.eventAttendanceMode = event.location ? 'https://schema.org/MixedEventAttendanceMode' : 'https://schema.org/OnlineEventAttendanceMode'
        base.location = event.location || 'Online'
        base.offers = { '@type': 'Offer', price: Number(event.price || 0), priceCurrency: 'MXN', availability: 'https://schema.org/InStock' }
    }

    if (schemaType === 'Course') {
        base.provider = { '@type': 'Organization', name: 'SAPIHUM' }
        base.educationalCredentialAwarded = 'Formación continua'
    }

    if (schemaType === 'Product') {
        base.offers = { '@type': 'Offer', price: Number(event.price || 0), priceCurrency: 'MXN', availability: 'https://schema.org/InStock' }
    }

    return JSON.stringify(base)
}

function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <div className="divide-y divide-border/50">
            {items.map((item, index) => (
                <div key={item.question}>
                    <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-foreground transition-colors hover:text-teal-600"
                    >
                        {item.question}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`ml-2 shrink-0 text-muted-foreground transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`}
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                        <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function PublicEventLanding({
    event,
    relatedEvents,
}: {
    event: any
    relatedEvents: any[]
}) {
    const ctaLabel = getDefaultPublicCtaLabel(event)
    const requiresPayment = Number(event.price || 0) > 0
    const memberMessage = getEventMemberAccessMessage(event)
    const faqItems = buildFaq(event)
    const publicCategory = getPublicCatalogTitle(event.public_kind ?? 'eventos')
    const formatLabel = event.event_type === 'course' ? 'Curso / cohorte'
        : event.event_type === 'on_demand' ? 'On demand'
            : 'Evento en vivo'

    return (
        <div className="space-y-14 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildStructuredData(event) }} />

            {/* ── HERO ── */}
            <section className="relative overflow-hidden rounded-3xl">
                {/* Background image or gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900/80">
                    {event.image_url && (
                        <img src={event.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 blur-sm" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-slate-900/50" />
                    {/* Decorative */}
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl" />
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                </div>

                <div className="relative grid gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1fr_380px] lg:py-16">
                    {/* Left: Event details */}
                    <div className="space-y-6">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal-300">
                                {publicCategory}
                            </span>
                            {event.hero_badge && (
                                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                                    {event.hero_badge}
                                </span>
                            )}
                            {event.member_access_type === 'free' && Number(event.price || 0) > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                    Incluido para miembros
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <div className="space-y-3">
                            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                                {event.title}
                            </h1>
                            {event.subtitle && (
                                <p className="max-w-2xl text-lg text-slate-300 sm:text-xl">{event.subtitle}</p>
                            )}
                        </div>

                        {/* Speakers inline */}
                        {event.speakers?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-4">
                                {event.speakers.map((item: any) => {
                                    const name = item.speaker?.profile?.full_name || 'Ponente'
                                    const avatar = item.speaker?.profile?.avatar_url
                                    return (
                                        <div key={item.id} className="flex items-center gap-2.5">
                                            {avatar ? (
                                                <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20" />
                                            ) : (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600/30 text-xs font-bold text-teal-200">
                                                    {name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-white">{name}</p>
                                                {item.speaker?.headline && (
                                                    <p className="text-xs text-slate-400">{item.speaker.headline}</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Info pills */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                                </svg>
                                <span className="text-sm text-slate-200">{formatEventDate(event.start_time)}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                                    <path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                                </svg>
                                <span className="text-sm text-slate-200">{formatLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                </svg>
                                <span className="text-sm text-slate-200">{getAudienceLabel(event.target_audience)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Pricing Card */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
                            <div className="space-y-5 p-6">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Precio</p>
                                    <p className="mt-1 text-3xl font-bold text-white">
                                        {Number(event.price || 0) > 0 ? `$${Number(event.price).toFixed(0)} MXN` : 'Gratis'}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm">
                                    <p className="font-medium text-white">{memberMessage.label}</p>
                                    {memberMessage.note && <p className="mt-1.5 text-xs text-slate-400">{memberMessage.note}</p>}
                                </div>

                                <PublicAccessCta
                                    eventId={event.id}
                                    eventSlug={event.slug}
                                    title={event.title}
                                    label={ctaLabel}
                                    requiresPayment={requiresPayment}
                                />

                                <p className="text-center text-[11px] text-slate-400">
                                    ¿Ya compraste?{' '}
                                    <Link href="/compras/recuperar" className="font-medium text-teal-400 hover:underline">
                                        Recupera tu acceso
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CONTENT ── */}
            <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
                <div className="space-y-8">
                    {/* Description */}
                    {event.description && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-xl">Acerca de este evento</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
                                {event.description.split('\n').map((paragraph: string, index: number) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* What you'll get */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-xl">¿Qué incluye?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { icon: '🎯', title: 'Acceso completo', desc: 'Link exclusivo al evento en vivo o grabación' },
                                    { icon: '📧', title: 'Acceso por correo', desc: 'Inicia sin cuenta. Recupera tu acceso cuando quieras' },
                                    ...(event.recording_url || event.event_type === 'on_demand' ? [
                                        { icon: '🔄', title: 'Replay disponible', desc: event.recording_expires_at ? 'Acceso temporal a la grabación' : 'Grabación disponible mientras tu acceso esté activo' }
                                    ] : []),
                                    ...(Number(event.price || 0) > 0 ? [
                                        { icon: '💳', title: 'Pago seguro', desc: 'Procesado de forma segura con Stripe' }
                                    ] : []),
                                ].map((item) => (
                                    <div key={item.title} className="flex gap-3 rounded-xl border border-border/40 bg-muted/30 p-3.5">
                                        <span className="text-lg">{item.icon}</span>
                                        <div>
                                            <p className="text-sm font-medium">{item.title}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Speakers section */}
                    {event.speakers?.length > 0 && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-xl">Ponentes</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                {event.speakers.map((item: any) => {
                                    const name = item.speaker?.profile?.full_name || 'Ponente'
                                    const avatar = item.speaker?.profile?.avatar_url
                                    return (
                                        <div key={item.id} className="flex items-start gap-3.5 rounded-xl border border-border/40 bg-muted/30 p-4">
                                            {avatar ? (
                                                <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover ring-2 ring-border" />
                                            ) : (
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                                                    {name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium">{name}</p>
                                                {item.speaker?.headline && (
                                                    <p className="mt-0.5 text-sm text-muted-foreground">{item.speaker.headline}</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* FAQ */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-xl">Preguntas frecuentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FaqAccordion items={faqItems} />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                    {/* For members */}
                    <Card className="border-border/50 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 dark:from-teal-950/30 dark:to-emerald-950/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                Para miembros
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>La membresía potencia tu acceso con ahorro acumulado y contenido preferencial.</p>
                            <ul className="space-y-1.5 text-sm">
                                <li className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-teal-600"><polyline points="20 6 9 17 4 12" /></svg>
                                    Acceso incluido o precio preferencial
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-teal-600"><polyline points="20 6 9 17 4 12" /></svg>
                                    Biblioteca privada de replays
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-teal-600"><polyline points="20 6 9 17 4 12" /></svg>
                                    Comunidad y networking exclusivo
                                </li>
                            </ul>
                            <Link href="/precios" className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700">
                                Ver planes
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Related */}
                    {relatedEvents.length > 0 && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base">También te puede interesar</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {relatedEvents.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={getPublicEventPath(item)}
                                        className="group flex items-start gap-3 rounded-xl border border-border/40 p-3 transition-colors hover:bg-muted/50"
                                    >
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.title} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                                        ) : (
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium group-hover:text-teal-600 transition-colors">{item.title}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {Number(item.price || 0) > 0 ? `$${Number(item.price).toFixed(0)} MXN` : 'Gratis'}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    )
}

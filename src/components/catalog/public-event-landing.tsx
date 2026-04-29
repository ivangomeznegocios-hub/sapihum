'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, Download, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getEffectiveEventPriceForProfile, getEventMemberAccessMessage, isEventIncludedForMatchingSpecialization } from '@/lib/events/pricing'
import { getEventCampaignForEvent } from '@/lib/events/campaigns'
import { getDefaultPublicCtaLabel, getEventTypeLabel, getPublicEventPath } from '@/lib/events/public'
import { brandName } from '@/lib/brand'
import { getSpecializationByCode } from '@/lib/specializations'
import { DEFAULT_TIMEZONE } from '@/lib/timezone'
import { cn } from '@/lib/utils'
import { CampaignLeadMagnetInline } from './campaign-lead-magnet-inline'
import { PublicAccessCta } from './public-access-cta'
import { PublicCatalogCard } from './public-catalog-card'

const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ?? ''

function formatEventDate(date: string) {
    return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: DEFAULT_TIMEZONE,
    }).format(new Date(date))
}

function getAudienceLabel(audience: string[] | null | undefined): string {
    if (!audience || audience.length === 0) return 'Publico general'
    const labels: Record<string, string> = {
        public: 'Publico general',
        members: 'Miembros de la comunidad',
        psychologist: 'Profesionales de psicologia',
        admin: 'Administradores',
        ponente: 'Ponentes',
    }
    return audience.map((value) => labels[value] || value).join(' / ')
}

function buildFaq(event: any) {
    const items = [
        {
            question: 'Como funciona el acceso despues de registrarme o comprar?',
            answer: 'Recibiras acceso al hub privado del evento. Desde ahi podras entrar al vivo, ver materiales y recuperar tu acceso con tu correo.',
        },
        {
            question: 'Necesito una cuenta completa para participar?',
            answer: 'No. Puedes comenzar con acceso rapido por correo y crear tu cuenta despues si quieres acceder a la comunidad y networking.',
        },
    ]

    if (Number(event.price || 0) > 0) {
        items.push({
            question: 'Que obtengo si ya soy miembro?',
            answer: getEventMemberAccessMessage(event).note || 'La membresia puede incluir acceso o precio preferencial segun la oferta de este evento.',
        })
    }

    return items
}

function buildAbsoluteUrl(pathname: string) {
    return publicAppUrl ? `${publicAppUrl}${pathname}` : pathname
}

function getEventStatusUrl(status: string | null | undefined) {
    if (status === 'live') return 'https://schema.org/EventScheduled'
    if (status === 'completed') return 'https://schema.org/EventCompleted'
    if (status === 'cancelled') return 'https://schema.org/EventCancelled'
    return 'https://schema.org/EventScheduled'
}

function buildEventLocation(event: any, eventUrl: string) {
    if (event.location && event.meeting_link) {
        return [
            {
                '@type': 'Place',
                name: event.location,
                address: event.location,
            },
            {
                '@type': 'VirtualLocation',
                url: event.meeting_link,
            },
        ]
    }

    if (event.location) {
        return {
            '@type': 'Place',
            name: event.location,
            address: event.location,
        }
    }

    return {
        '@type': 'VirtualLocation',
        url: event.meeting_link || eventUrl,
    }
}

function buildStructuredData(event: any, faqItems: { question: string; answer: string }[]) {
    const schemaType = event.event_type === 'course' ? 'Course' : 'Event'
    const eventPath = getPublicEventPath(event)
    const eventUrl = buildAbsoluteUrl(eventPath)
    const isFull = event.max_attendees ? (event.attendee_count || 0) >= event.max_attendees : false
    const speakers = Array.isArray(event.speakers)
        ? event.speakers
            .map((item: any) => item?.speaker?.profile?.full_name || item?.speaker?.headline)
            .filter(Boolean)
        : []

    const base: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name: event.seo_title || event.title,
        description: event.seo_description || event.og_description || event.description || event.title,
        image: event.image_url ? [event.image_url] : undefined,
        url: eventUrl,
        organizer: {
            '@type': 'Organization',
            name: brandName,
            url: buildAbsoluteUrl('/'),
        },
    }

    if (schemaType === 'Event') {
        base.startDate = event.start_time
        base.endDate = event.end_time || undefined
        base.eventAttendanceMode = event.location && event.meeting_link
            ? 'https://schema.org/MixedEventAttendanceMode'
            : event.location
                ? 'https://schema.org/OfflineEventAttendanceMode'
                : 'https://schema.org/OnlineEventAttendanceMode'
        base.eventStatus = getEventStatusUrl(event.status)
        base.location = buildEventLocation(event, eventUrl)
        base.offers = {
            '@type': 'Offer',
            url: eventUrl,
            price: Number(event.price || 0),
            priceCurrency: 'MXN',
            availability: isFull ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        }
        base.isAccessibleForFree = Number(event.price || 0) <= 0
        if (speakers.length > 0) {
            base.performer = speakers.map((name: string) => ({
                '@type': 'Person',
                name,
            }))
        }
    }

    if (schemaType === 'Course') {
        base.provider = {
            '@type': 'Organization',
            name: brandName,
            url: buildAbsoluteUrl('/'),
        }
        base.educationalCredentialAwarded = event.certificate_type || 'Formacion continua'
        base.courseMode = event.location ? 'blended' : 'online'
        base.hasCourseInstance = [{
            '@type': 'CourseInstance',
            courseMode: event.location ? 'blended' : 'online',
            startDate: event.start_time,
            endDate: event.end_time || undefined,
            location: buildEventLocation(event, eventUrl),
            instructor: speakers.map((name: string) => ({
                '@type': 'Person',
                name,
            })),
            offers: {
                '@type': 'Offer',
                url: eventUrl,
                price: Number(event.price || 0),
                priceCurrency: 'MXN',
                availability: isFull ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            },
        }]
    }

    const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Academia',
                item: buildAbsoluteUrl('/academia'),
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Eventos',
                item: buildAbsoluteUrl('/eventos'),
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: event.title,
                item: eventUrl,
            },
        ],
    }

    const faq = faqItems.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer,
                },
            })),
        }
        : null

    return JSON.stringify([base, breadcrumb, faq].filter(Boolean)).replace(/</g, '\\u003c')
}

function getSpeakerImage(speaker: any) {
    return speaker?.photo_url || speaker?.profile?.avatar_url || null
}

function getPublicSpeakerHref(speaker: any, returnTo?: string) {
    if (!speaker?.id || !speaker?.is_public) return null
    if (!returnTo) return `/speakers/${speaker.id}`
    return `/speakers/${speaker.id}?returnTo=${encodeURIComponent(returnTo)}`
}

function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <div className="divide-y divide-white/10">
            {items.map((item, index) => (
                <div key={item.question}>
                    <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-white transition-colors hover:text-brand-yellow"
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
                            className={`ml-2 shrink-0 text-neutral-500 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`}
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                        <p className="text-sm leading-relaxed text-neutral-400">{item.answer}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function PublicEventLanding({
    event,
    relatedEvents,
    membershipLevel = 0,
    hasActiveMembership = false,
    membershipSpecializationCode = null,
    hasAccess = false,
}: {
    event: any
    relatedEvents: any[]
    membershipLevel: number
    hasActiveMembership: boolean
    membershipSpecializationCode: string | null
    hasAccess: boolean
}) {
    const ctaLabel = getDefaultPublicCtaLabel(event)
    const isMembersOnly = Array.isArray(event.target_audience)
        ? event.target_audience.includes('members') && !event.target_audience.includes('public')
        : false
    const specialization = getSpecializationByCode(event.specialization_code)
    const finalPrice = getEffectiveEventPriceForProfile(event, {
        membershipLevel,
        hasActiveMembership,
        membershipSpecializationCode,
    })
    const formatLabel = getEventTypeLabel(event.event_type)
    const faqItems = buildFaq(event)
    const speakerReturnTo = getPublicEventPath(event)
    const campaign = getEventCampaignForEvent(event)
    const isFull = event.max_attendees ? (event.attendee_count || 0) >= event.max_attendees : false
    const isExpired = event.recording_expires_at ? new Date(event.recording_expires_at) < new Date() : false
    const isBlocked = !hasAccess && (isFull || isExpired)
    const materialLinks = Array.isArray(event.material_links)
        ? event.material_links.filter((item: any) => item?.title && item?.url)
        : []
    const includedBySpecialization = isEventIncludedForMatchingSpecialization(event, {
        membershipLevel,
        hasActiveMembership,
        membershipSpecializationCode,
    })
    const showMembershipUpsell =
        !hasAccess &&
        !isBlocked &&
        !hasActiveMembership &&
        (
            isMembersOnly ||
            (Number(event.price || 0) > 0 && Boolean(event.specialization_code)) ||
            (Number(event.price || 0) > 0 && event.member_access_type !== 'full_price')
        )
    const membershipCtaLabel = isMembersOnly
        ? 'Hazte miembro para participar'
        : specialization
            ? event.member_access_type === 'discounted'
                ? 'Activa tu especialidad o suscribete y ahorra'
                : event.member_access_type === 'free'
                    ? 'Suscribete y accede sin costo'
                    : 'Activa tu especialidad y accede sin costo'
            : `Suscribete y ${event.member_access_type === 'free' ? 'accede gratis' : 'ahorra'}`

    const valueItems = [
        { title: 'Acceso completo', description: 'Link exclusivo al evento y sus materiales.' },
        { title: 'Acceso por correo', description: 'Puedes empezar sin cuenta y recuperar tu acceso cuando quieras.' },
        ...(event.certificate_type && event.certificate_type !== 'none'
            ? [{
                title: event.certificate_type === 'completion'
                    ? 'Diploma de finalizacion'
                    : event.certificate_type === 'specialized'
                        ? 'Acreditacion especializada'
                        : 'Constancia de participacion',
                description: 'Documento acreditativo sujeto a las condiciones del evento.',
            }]
            : []),
        ...(event.included_resources?.length > 0
            ? [{
                title: 'Recursos extra',
                description: `${event.included_resources.length} materiales complementarios disponibles para tu proceso.`,
            }]
            : []),
    ]

    return (
        <div className="pb-28">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildStructuredData(event, faqItems) }} />

            {/* HERO SECTION */}
            <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24">
                {/* Refined Background Effect */}
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-[0.15] pointer-events-none rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(246,174,2,0.8) 0%, transparent 70%)' }} />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative mx-auto px-6 sm:px-8 max-w-7xl">
                    <div className="grid gap-12 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] lg:gap-16 items-start">
                        
                        {/* LEFT: Text Content */}
                        <div className="space-y-8 pt-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-yellow">
                                    {formatLabel}
                                </span>
                                {event.hero_badge && (
                                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90">
                                        {event.hero_badge}
                                    </span>
                                )}
                                {specialization && (
                                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white">
                                        {specialization.name}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-5">
                                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
                                    {event.title}
                                </h1>
                                {event.subtitle && (
                                    <p className="max-w-2xl text-lg leading-relaxed text-neutral-400 sm:text-xl font-light">
                                        {event.subtitle}
                                    </p>
                                )}
                                {event.campaign_problem && (
                                    <div className="max-w-2xl rounded-2xl border border-brand-yellow/20 bg-brand-yellow/5 p-4">
                                        <p className="text-sm leading-relaxed text-brand-yellow/90 sm:text-base">
                                            {event.campaign_problem}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {event.speakers?.length > 0 && (
                                <div className="flex flex-wrap items-center gap-5 pt-4">
                                    {event.speakers.map((item: any) => {
                                        const speaker = item.speaker
                                        const name = speaker?.profile?.full_name || 'Ponente'
                                        const avatar = getSpeakerImage(speaker)
                                        const speakerHref = getPublicSpeakerHref(speaker, speakerReturnTo)

                                        const content = (
                                            <>
                                                {avatar ? (
                                                    <div
                                                        role="img"
                                                        aria-label={name}
                                                        className="h-12 w-12 rounded-full bg-cover bg-center ring-2 ring-white/10 shadow-lg"
                                                        style={{ backgroundImage: `url("${avatar}")` }}
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-yellow/20 text-sm font-bold text-brand-yellow ring-2 ring-white/10">
                                                        {name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{name}</p>
                                                    {speaker?.headline && (
                                                        <p className="text-xs text-neutral-400 mt-0.5">{speaker.headline}</p>
                                                    )}
                                                </div>
                                            </>
                                        )

                                        if (!speakerHref) {
                                            return <div key={item.id} className="flex items-center gap-3">{content}</div>
                                        }

                                        return (
                                            <Link key={item.id} href={speakerHref} className="group flex items-center gap-3 transition-opacity hover:opacity-80">
                                                {content}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-x-12 gap-y-6 pt-6 border-t border-white/10">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Fecha y Hora</p>
                                    <p className="mt-2 text-sm font-medium text-white">{formatEventDate(event.start_time)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Formato</p>
                                    <p className="mt-2 text-sm font-medium text-white">{formatLabel}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Dirigido a</p>
                                    <p className="mt-2 text-sm font-medium text-white">{getAudienceLabel(event.target_audience)}</p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Image & CTA */}
                        <aside className="space-y-6 lg:sticky lg:top-24">
                            {event.image_url && (
                                <div className="aspect-[4/3] sm:aspect-video lg:aspect-[4/5] w-full rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative group">
                                    <div 
                                        role="img" 
                                        aria-label={event.title}
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                                        style={{ backgroundImage: `url("${event.image_url}")` }} 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[32px] pointer-events-none" />
                                    {event.formation_track && (
                                        <div className="absolute bottom-4 left-4 right-4 text-center">
                                            <span className="inline-block rounded-full bg-black/60 backdrop-blur-md px-4 py-1.5 text-xs font-medium tracking-wide text-brand-yellow border border-white/10">
                                                Ruta: {event.formation_track}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="rounded-[32px] border border-white/10 bg-[#0A0A0A]/80 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                                {/* Subtle internal glow for the card */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-brand-yellow/5 blur-3xl pointer-events-none" />
                                
                                <div className="relative z-10">
                                    <div className="flex items-end justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Inversion</p>
                                            <p className="mt-1 text-3xl font-bold tracking-tight text-white">
                                                {finalPrice > 0 ? `$${finalPrice.toFixed(0)} MXN` : 'Gratis'}
                                            </p>
                                        </div>
                                        {finalPrice > 0 && finalPrice < Number(event.price || 0) && (
                                            <div className="text-right">
                                                <p className="text-xs text-neutral-500 line-through">${Number(event.price).toFixed(0)}</p>
                                                <p className="text-xs font-medium text-brand-yellow">Ahorras ${Number(event.price - finalPrice).toFixed(0)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {includedBySpecialization && (
                                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-yellow/10 px-3 py-2 text-xs font-medium text-brand-yellow border border-brand-yellow/20">
                                            <Check className="h-3.5 w-3.5" />
                                            Acceso incluido por tu especialidad
                                        </div>
                                    )}

                                    <div className="mt-6 space-y-3">
                                        {hasAccess ? (
                                            <>
                                                <Link href={`/hub/${event.slug}`}>
                                                    <Button className="w-full h-12 text-base font-semibold shadow-lg shadow-brand-yellow/20" size="lg">
                                                        Entrar al hub privado
                                                    </Button>
                                                </Link>
                                                <p className="text-center text-xs font-medium text-brand-yellow">
                                                    Ya tienes acceso a este contenido
                                                </p>
                                            </>
                                        ) : isBlocked ? (
                                            <>
                                                <Button variant="secondary" className="w-full h-12 text-base opacity-60 cursor-not-allowed" disabled>
                                                    {isExpired ? 'Este material ya expiro' : 'Cupo lleno'}
                                                </Button>
                                                <p className="text-center text-xs text-neutral-500">
                                                    {isExpired ? 'Este acceso ya no esta disponible.' : 'Lo sentimos, este evento ya alcanzo su maxima capacidad.'}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                {!isMembersOnly && (
                                                    <PublicAccessCta
                                                        eventId={event.id}
                                                        eventSlug={event.slug}
                                                        title={event.title}
                                                        label={finalPrice > 0 ? ctaLabel : 'Recibir acceso gratis'}
                                                        requiresPayment={finalPrice > 0}
                                                    />
                                                )}

                                                {showMembershipUpsell && (
                                                    <>
                                                        {!isMembersOnly && (
                                                            <div className="relative py-2">
                                                                <div className="absolute inset-x-0 top-1/2 border-t border-white/5" />
                                                                <span className="relative mx-auto flex w-fit bg-[#0A0A0A] px-3 text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                                                                    o tambien
                                                                </span>
                                                            </div>
                                                        )}
                                                        <Link href={`/precios?next=/eventos/${event.slug}&autoCheckout=true`}>
                                                            <Button
                                                                variant={isMembersOnly ? 'default' : 'outline'}
                                                                className={cn('w-full h-12 text-sm', isMembersOnly ? 'text-base font-semibold' : 'border-white/10 text-white hover:bg-white/5 hover:text-white')}
                                                                size="lg"
                                                            >
                                                                {isMembersOnly && <Lock className="h-4 w-4 mr-2" />}
                                                                {membershipCtaLabel}
                                                            </Button>
                                                        </Link>
                                                    </>
                                                )}

                                                {campaign && (
                                                    <a href="#campaign-temario" className="block pt-2">
                                                        <Button variant="ghost" className="w-full text-xs text-neutral-400 hover:text-white hover:bg-white/5">
                                                            <Download className="h-3.5 w-3.5 mr-2" />
                                                            Descargar temario PDF
                                                        </Button>
                                                    </a>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {!hasAccess && (
                                        <p className="mt-5 text-center text-[11px] text-neutral-500">
                                            Ya lo adquiriste?{' '}
                                            <Link href="/compras/recuperar" className="font-medium text-white hover:text-brand-yellow transition-colors underline underline-offset-2">
                                                Recupera tu acceso
                                            </Link>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            {campaign && (
                <div className="mx-auto max-w-7xl px-6 sm:px-8 mb-16">
                    <CampaignLeadMagnetInline
                        campaignKey={campaign.key}
                        eventId={event.id}
                        eventSlug={event.slug}
                        sourceSurface="event_detail_inline"
                        eyebrow="Temario detallado"
                        title={`Recibe el temario de ${campaign.title}`}
                        description="Descarga el PDF del bloque, entiende que aprenderas en esta ruta y recibe una recomendacion clara del siguiente evento para seguir avanzando."
                        sectionId="campaign-temario"
                    />
                </div>
            )}

            {/* MAIN CONTENT SECTION */}
            <section className="mx-auto max-w-7xl px-6 sm:px-8">
                <div className="grid gap-12 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] items-start">
                    
                    {/* LEFT: Details */}
                    <div className="space-y-16">
                        {event.description && (
                            <div>
                                <h2 className="text-2xl font-semibold text-white mb-6">Acerca de este encuentro</h2>
                                <div className="space-y-4 text-base leading-relaxed text-neutral-400">
                                    {event.description.split('\n').map((paragraph: string, index: number) => (
                                        <p key={index}>{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(event.ideal_for?.length > 0 || event.learning_outcomes?.length > 0) && (
                            <div>
                                <h2 className="text-2xl font-semibold text-white mb-8">Valor Academico</h2>
                                <div className="grid gap-8 sm:grid-cols-2">
                                    {event.ideal_for?.length > 0 && (
                                        <div className="space-y-5">
                                            <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">A quien va dirigido</h3>
                                            <ul className="space-y-4">
                                                {event.ideal_for.map((item: string) => (
                                                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-neutral-300">
                                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-brand-yellow">
                                                            <Check className="h-3 w-3" />
                                                        </span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {event.learning_outcomes?.length > 0 && (
                                        <div className="space-y-5">
                                            <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Que aprenderas</h3>
                                            <ul className="space-y-4">
                                                {event.learning_outcomes.map((item: string) => (
                                                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-neutral-300">
                                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/10 text-brand-yellow">
                                                            <ArrowRight className="h-3 w-3" />
                                                        </span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <h2 className="text-2xl font-semibold text-white mb-6">Que incluye tu acceso</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {valueItems.map((item) => (
                                    <div key={item.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
                                        <p className="text-base font-medium text-white">{item.title}</p>
                                        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {event.speakers?.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-semibold text-white mb-6">Conoce a los ponentes</h2>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {event.speakers.map((item: any) => {
                                        const speaker = item.speaker
                                        const name = speaker?.profile?.full_name || 'Ponente'
                                        const avatar = getSpeakerImage(speaker)
                                        const speakerHref = getPublicSpeakerHref(speaker, speakerReturnTo)
                                        const specialties = Array.isArray(speaker?.specialties) ? speaker.specialties.filter(Boolean).slice(0, 3) : []
                                        const credentials = Array.isArray(speaker?.credentials) ? speaker.credentials.filter(Boolean).slice(0, 2) : []

                                        const content = (
                                            <div className="flex flex-col h-full rounded-[24px] border border-white/5 bg-white/[0.02] overflow-hidden hover:border-brand-yellow/30 hover:bg-white/[0.04] transition-all group">
                                                <div className="p-6 pb-0 flex items-center gap-4">
                                                    {avatar ? (
                                                        <div
                                                            role="img"
                                                            aria-label={name}
                                                            className="h-16 w-16 shrink-0 rounded-full bg-cover bg-center ring-2 ring-white/10"
                                                            style={{ backgroundImage: `url("${avatar}")` }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-yellow/10 text-xl font-bold text-brand-yellow ring-2 ring-brand-yellow/20">
                                                            {name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-lg font-semibold text-white group-hover:text-brand-yellow transition-colors">{name}</p>
                                                        {speaker?.headline && (
                                                            <p className="mt-1 text-sm text-neutral-400">{speaker.headline}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-6 flex flex-col justify-between flex-1">
                                                    <div className="space-y-4">
                                                        {specialties.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {specialties.map((specialty: string) => (
                                                                    <span key={specialty} className="rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-neutral-300">
                                                                        {specialty}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {credentials.length > 0 && (
                                                            <div className="space-y-2">
                                                                {credentials.map((credential: string) => (
                                                                    <p key={credential} className="text-xs leading-relaxed text-neutral-500">
                                                                        • {credential}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )

                                        if (!speakerHref) return <div key={item.id} className="h-full">{content}</div>
                                        return <Link key={item.id} href={speakerHref} className="block h-full">{content}</Link>
                                    })}
                                </div>
                            </div>
                        )}

                        {hasAccess && materialLinks.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-semibold text-white mb-6">Materiales del evento</h2>
                                <div className="space-y-3">
                                    {materialLinks.map((item: any) => (
                                        <div key={item.id || item.url} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                                            <div>
                                                <p className="text-base font-medium text-white">{item.title}</p>
                                                <p className="mt-1 text-sm text-neutral-500">
                                                    {item.type === 'presentation' ? 'Presentacion' :
                                                        item.type === 'document' ? 'Documento' :
                                                            item.type === 'folder' ? 'Carpeta' :
                                                                item.type === 'download' ? 'Descarga' : 'Enlace externo'}
                                                </p>
                                            </div>
                                            <Button asChild variant="secondary" size="sm" className="shrink-0 bg-white/10 hover:bg-white/20 text-white">
                                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                    Abrir
                                                </a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-8 border-t border-white/10">
                            <h2 className="text-2xl font-semibold text-white mb-6">Preguntas frecuentes</h2>
                            <div className="max-w-3xl">
                                <FaqAccordion items={faqItems} />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Supplemental Links */}
                    <aside className="space-y-8 lg:sticky lg:top-24">
                        {event.formation && !Array.isArray(event.formation) && (
                            <div className="rounded-2xl border border-brand-yellow/20 bg-brand-yellow/5 p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                </div>
                                <h3 className="text-sm font-semibold uppercase tracking-widest text-brand-yellow mb-3">Parte de una ruta mayor</h3>
                                <p className="text-sm leading-relaxed text-neutral-300">
                                    Este encuentro forma parte de <strong className="text-white font-medium">{event.formation.title}</strong>. Puedes tomarlo por separado o revisar la ruta completa para obtener la certificacion.
                                </p>
                                <Link href={`/formaciones/${event.formation.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-yellow hover:text-white transition-colors">
                                    Ver diplomado completo
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        )}

                        <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-6">
                            <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-400 mb-4">Para Miembros</h3>
                            <div className="space-y-4 text-sm leading-relaxed text-neutral-400">
                                <p>La membresia potencia tu acceso con ahorro acumulado y una entrada mas continua a eventos, contenidos y networking.</p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                                        Acceso incluido o precio preferencial.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                                        Comunidad y networking con colegas.
                                    </li>
                                </ul>
                                <Link href="/precios" className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-brand-yellow transition-colors underline underline-offset-4">
                                    Explorar planes
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            {relatedEvents.length > 0 && (
                <section className="mx-auto max-w-7xl px-6 sm:px-8 mt-24">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-brand-yellow mb-2">
                                {campaign ? 'Agenda relacionada' : 'Siguiente paso'}
                            </p>
                            <h2 className="text-3xl font-bold text-white">
                                {campaign ? 'Eventos de esta ruta' : 'Tambien te puede interesar'}
                            </h2>
                        </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {relatedEvents.map((item) => (
                            <PublicCatalogCard key={item.id} event={item} fixedLayout />
                        ))}
                    </div>
                </section>
            )}

            {!isBlocked && (
                <div className="fixed inset-x-0 bottom-0 z-50 p-4 lg:hidden bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pointer-events-none">
                    <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-3 shadow-2xl backdrop-blur-xl pointer-events-auto">
                        <div className="min-w-0 flex-1">
                            {hasAccess ? (
                                <Link href={`/hub/${event.slug}`} className="block">
                                    <Button className="w-full">Entrar al hub</Button>
                                </Link>
                            ) : (
                                <PublicAccessCta
                                    eventId={event.id}
                                    eventSlug={event.slug}
                                    title={event.title}
                                    label={finalPrice > 0 ? ctaLabel : 'Recibir acceso gratis'}
                                    requiresPayment={finalPrice > 0}
                                />
                            )}
                        </div>
                        {campaign && (
                            <a href="#campaign-temario" className="shrink-0">
                                <Button variant="secondary" className="gap-2 bg-white/5 text-white hover:bg-white/10 border-none">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

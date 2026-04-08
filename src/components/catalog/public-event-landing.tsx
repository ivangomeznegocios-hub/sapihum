'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getEffectiveEventPriceForProfile, getEventMemberAccessMessage, isEventIncludedForMatchingSpecialization } from '@/lib/events/pricing'
import { getDefaultPublicCtaLabel, getEventTypeLabel, getPublicEventPath } from '@/lib/events/public'
import { brandName } from '@/lib/brand'
import { getSpecializationByCode } from '@/lib/specializations'
import { PublicAccessCta } from './public-access-cta'

const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ?? ''

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
    if (!audience || audience.length === 0) return 'Publico general'
    const labels: Record<string, string> = {
        public: 'Publico general',
        members: 'Miembros de la comunidad',
        psychologist: 'Profesionales de psicologia',
        admin: 'Administradores',
        ponente: 'Ponentes',
    }
    return audience.map(a => labels[a] || a).join(' / ')
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
    const schemaType = event.event_type === 'course'
        ? 'Course'
        : 'Event'
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
        <div className="divide-y divide-border/50">
            {items.map((item, index) => (
                <div key={item.question}>
                    <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-foreground transition-colors hover:text-brand-yellow"
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
    const memberMessage = getEventMemberAccessMessage(event)
    const formatLabel = getEventTypeLabel(event.event_type)
    const faqItems = buildFaq(event)
    const speakerReturnTo = getPublicEventPath(event)
    
    // Validate edge/blocking cases
    const isFull = event.max_attendees ? (event.attendee_count || 0) >= event.max_attendees : false
    const isExpired = event.recording_expires_at ? new Date(event.recording_expires_at) < new Date() : false
    const isBlocked = !hasAccess && (isFull || isExpired)
    const materialLinks = Array.isArray(event.material_links)
        ? event.material_links.filter((item: any) => item?.title && item?.url)
        : []
    
    // Determine the state logic for the CTA box
    const userIsMember = hasActiveMembership
    const includedBySpecialization = isEventIncludedForMatchingSpecialization(event, {
        membershipLevel,
        hasActiveMembership,
        membershipSpecializationCode,
    })
    const showMembershipUpsell =
        !hasAccess
        && !isBlocked
        && !userIsMember
        && (
            isMembersOnly
            || (Number(event.price || 0) > 0 && Boolean(event.specialization_code))
            || (Number(event.price || 0) > 0 && event.member_access_type !== 'full_price')
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

    return (
        <div className="space-y-14 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildStructuredData(event, faqItems) }} />

            {/* -- HERO -- */}
            <section className="relative overflow-hidden rounded-3xl">
                {/* Background image or gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-brand-brown/80">
                    {event.image_url && (
                        <div
                            role="img"
                            aria-label={event.title}
                            className="absolute inset-0 h-full w-full bg-cover bg-center opacity-20 blur-sm"
                            style={{ backgroundImage: `url("${event.image_url}")` }}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/95 via-neutral-900/70 to-neutral-900/50" />
                    {/* Decorative */}
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-yellow/10 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-brand-brown/8 blur-3xl" />
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                </div>

                <div className="relative grid gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1fr_380px] lg:py-16">
                    {/* Left: Event details */}
                    <div className="space-y-6">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-yellow">
                                {getEventTypeLabel(event.event_type)}
                            </span>
                            {event.hero_badge && (
                                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                                    {event.hero_badge}
                                </span>
                            )}
                            {specialization && (
                                <span className="inline-flex items-center rounded-full border border-brand-brown/30 bg-brand-brown/20 px-3 py-1 text-xs font-semibold text-white">
                                    {specialization.name}
                                </span>
                            )}
                            {event.formation && !Array.isArray(event.formation) ? (
                                <Link href={`/formaciones/${event.formation.slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/20 border border-brand-yellow/30 px-3 py-1 text-xs font-semibold tracking-wide text-brand-yellow hover:bg-brand-yellow/40 hover:text-white transition-colors cursor-pointer group">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-rotate-12 transition-transform"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                    Parte de: {event.formation.title}
                                </Link>
                            ) : event.formation_track ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/20 border border-brand-yellow/20 px-3 py-1 text-xs font-semibold tracking-wide text-brand-yellow">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                    Parte de: {event.formation_track}
                                </span>
                            ) : null}
                            {!event.specialization_code && event.member_access_type === 'free' && Number(event.price || 0) > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-brand-brown/20 px-3 py-1 text-xs font-semibold text-brand-brown">
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
                                <p className="max-w-2xl text-lg text-neutral-400 sm:text-xl">{event.subtitle}</p>
                            )}
                        </div>

                        {/* Speakers inline */}
                        {event.speakers?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-4">
                                {event.speakers.map((item: any) => {
                                    const speaker = item.speaker
                                    const name = speaker?.profile?.full_name || 'Ponente'
                                    const avatar = getSpeakerImage(speaker)
                                    const speakerHref = getPublicSpeakerHref(speaker, speakerReturnTo)
                                    const speakerPreview = (
                                        <>
                                            {avatar ? (
                                                <div
                                                    role="img"
                                                    aria-label={name}
                                                    className="h-8 w-8 rounded-full bg-cover bg-center ring-2 ring-white/20"
                                                    style={{ backgroundImage: `url("${avatar}")` }}
                                                />
                                            ) : (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow/30 text-xs font-bold text-brand-yellow">
                                                    {name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-white">{name}</p>
                                                {speaker?.headline && (
                                                    <p className="text-xs text-neutral-500">{speaker.headline}</p>
                                                )}
                                                {speakerHref && (
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-yellow/90">
                                                        Ver perfil
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )

                                    if (!speakerHref) {
                                        return (
                                            <div key={item.id} className="flex items-center gap-2.5">
                                                {speakerPreview}
                                            </div>
                                        )
                                    }

                                    return (
                                        <Link
                                            key={item.id}
                                            href={speakerHref}
                                            className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:border-brand-yellow/30 hover:bg-white/10"
                                        >
                                            {speakerPreview}
                                        </Link>
                                    )
                                })}
                            </div>
                        )}

                        {/* Info pills */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-yellow">
                                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                                </svg>
                                <span className="text-sm text-neutral-200">{formatEventDate(event.start_time)}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-yellow">
                                    <path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                                </svg>
                                <span className="text-sm text-neutral-200">{formatLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-yellow">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                </svg>
                                <span className="text-sm text-neutral-200">{getAudienceLabel(event.target_audience)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
                            <div className="space-y-5 p-6">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Precio</p>
                                    <p className="mt-1 text-3xl font-bold text-white">
                                        {finalPrice > 0 ? `$${finalPrice.toFixed(0)} MXN` : 'Gratis'}
                                    </p>
                                    {includedBySpecialization && (
                                        <p className="mt-1 text-sm font-medium text-brand-brown">
                                            Incluido por tu especialidad
                                        </p>
                                    )}
                                    {finalPrice > 0 && finalPrice < Number(event.price || 0) && (
                                        <p className="mt-1 text-sm text-brand-brown font-medium">
                                            Tienes precio preferencial de miembro
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm">
                                    <p className="font-medium text-white">{memberMessage.label}</p>
                                    {memberMessage.note && <p className="mt-1.5 text-xs text-neutral-500">{memberMessage.note}</p>}
                                </div>

                                {event.formation && !Array.isArray(event.formation) && (
                                    <div className="rounded-xl border border-brand-yellow/20 bg-brand-yellow/10 p-4 text-sm">
                                        <p className="font-medium text-white">
                                            Este curso forma parte del diplomado {event.formation.title}.
                                        </p>
                                        <p className="mt-1 text-xs text-neutral-400">
                                            Puedes comprar solo este curso o ver el paquete completo del diplomado.
                                        </p>
                                        <Link
                                            href={`/formaciones/${event.formation.slug}`}
                                            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-yellow hover:text-brand-yellow"
                                        >
                                            Ver diplomado completo
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                )}

                                {hasAccess ? (
                                    <div className="space-y-3 pt-2">
                                        <Link href={`/hub/${event.slug}`}>
                                            <Button className="w-full" size="lg">
                                                Entrar al hub privado
                                            </Button>
                                        </Link>
                                        <p className="text-center text-xs text-brand-brown font-medium">
                                            Ya tienes acceso a este contenido
                                        </p>
                                    </div>
                                ) : isBlocked ? (
                                    <div className="space-y-4 pt-2">
                                        <Button variant="secondary" className="w-full text-base font-semibold py-6 opacity-60 cursor-not-allowed" disabled>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                            {isExpired ? 'Este material ya expiro' : 'Cupo Lleno'}
                                        </Button>
                                        <p className="text-center text-xs text-neutral-500">
                                            {isExpired 
                                                ? 'Este acceso ya no esta disponible.'
                                                : 'Lo sentimos, este evento ya alcanzo su maxima capacidad.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
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
                                                <div className="relative py-3 flex items-center">
                                                    <div className="flex-grow border-t border-white/10"></div>
                                                    <span className="shrink-0 px-3 text-xs text-neutral-500 uppercase tracking-widest">O tambien</span>
                                                    <div className="flex-grow border-t border-white/10"></div>
                                                </div>
                                                )}
                                                <Link href={`/precios?next=/eventos/${event.slug}&autoCheckout=true`} className="block w-full">
                                                    <Button
                                                        variant={isMembersOnly ? "default" : "outline"}
                                                        className={`w-full ${isMembersOnly ? 'py-6 text-base shadow-lg' : 'border-primary/20 bg-primary/10 text-primary hover:border-primary/30 hover:bg-primary/15 hover:text-primary'}`}
                                                        size="lg"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                                        {membershipCtaLabel}
                                                    </Button>
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )}

                                {!hasAccess && (
                                    <p className="text-center text-[11px] text-neutral-500 mt-4">
                                        Ya lo adquiriste?{' '}
                                        <Link href="/compras/recuperar" className="font-medium text-brand-yellow hover:underline">
                                            Recupera tu acceso
                                        </Link>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* -- CONTENT -- */}
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

                    {/* Academic Value */}
                    {(event.ideal_for?.length > 0 || event.learning_outcomes?.length > 0) && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-xl">Valor Academico</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-8 sm:grid-cols-2">
                                {event.ideal_for?.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-primary flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                            A quien va dirigido?
                                        </h4>
                                        <ul className="space-y-3">
                                            {event.ideal_for.map((item: string, i: number) => (
                                                <li key={i} className="flex items-start text-sm text-foreground">
                                                    <svg className="mr-2 h-4 w-4 shrink-0 text-brand-brown mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    <span className="leading-snug">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {event.learning_outcomes?.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-brand-yellow flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>
                                            Que aprenderas?
                                        </h4>
                                        <ul className="space-y-3">
                                            {event.learning_outcomes.map((item: string, i: number) => (
                                                <li key={i} className="flex items-start text-sm text-foreground">
                                                    <svg className="mr-2 h-4 w-4 shrink-0 text-brand-yellow mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    <span className="leading-snug">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* What you'll get */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-xl">Que incluye?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { icon: '+', title: 'Acceso completo', desc: 'Link exclusivo al evento y sus materiales' },
                                    { icon: '+', title: 'Acceso por correo', desc: 'Inicia sin cuenta. Recupera tu acceso cuando quieras' },
                                    ...(event.certificate_type && event.certificate_type !== 'none' ? [{
                                        icon: '+',
                                        title: event.certificate_type === 'completion' ? 'Diploma de finalizacion' : event.certificate_type === 'specialized' ? 'Acreditacion Especializada' : 'Constancia por asistencia',
                                        desc: 'Documento acreditativo'
                                    }] : []),
                                    ...(event.included_resources?.length > 0 ? [{
                                        icon: '+',
                                        title: 'Recursos extra',
                                        desc: `${event.included_resources.length} materiales descargables`
                                    }] : []),
                                    ...(Number(event.price || 0) > 0 ? [
                                        { icon: '+', title: 'Pago seguro', desc: 'Procesado de forma segura con Stripe' }
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

                    {hasAccess && materialLinks.length > 0 && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-xl">Materiales del Evento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {materialLinks.map((item: any) => (
                                        <div key={item.id || item.url} className="flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm font-medium">{item.title}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
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
                            </CardContent>
                        </Card>
                    )}

                    {/* Speakers section */}
                    {event.speakers?.length > 0 && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-xl">Ponentes</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                {event.speakers.map((item: any) => {
                                    const speaker = item.speaker
                                    const name = speaker?.profile?.full_name || 'Ponente'
                                    const avatar = getSpeakerImage(speaker)
                                    const speakerHref = getPublicSpeakerHref(speaker, speakerReturnTo)
                                    const specialties = Array.isArray(speaker?.specialties)
                                        ? speaker.specialties.filter(Boolean).slice(0, 3)
                                        : []
                                    const credentials = Array.isArray(speaker?.credentials)
                                        ? speaker.credentials.filter(Boolean).slice(0, 2)
                                        : []
                                    const speakerCard = (
                                        <>
                                            {avatar ? (
                                                <div
                                                    role="img"
                                                    aria-label={name}
                                                    className="h-12 w-12 rounded-full bg-cover bg-center ring-2 ring-border"
                                                    style={{ backgroundImage: `url("${avatar}")` }}
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-bold text-brand-yellow">
                                                    {name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1 space-y-3">
                                                <div>
                                                    <p className="font-medium">{name}</p>
                                                    {speaker?.headline && (
                                                        <p className="mt-0.5 text-sm text-muted-foreground">{speaker.headline}</p>
                                                    )}
                                                </div>

                                                {specialties.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {specialties.map((specialty: string) => (
                                                            <span
                                                                key={specialty}
                                                                className="inline-flex rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                                                            >
                                                                {specialty}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {credentials.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        {credentials.map((credential: string) => (
                                                            <p key={credential} className="line-clamp-2 text-sm text-muted-foreground">
                                                                {credential}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}

                                                {speakerHref && (
                                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-yellow">
                                                        Ver perfil completo
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M5 12h14" />
                                                            <path d="m12 5 7 7-7 7" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )

                                    if (!speakerHref) {
                                        return (
                                            <div key={item.id} className="flex items-start gap-3.5 rounded-xl border border-border/40 bg-muted/30 p-4">
                                                {speakerCard}
                                            </div>
                                        )
                                    }

                                    return (
                                        <Link
                                            key={item.id}
                                            href={speakerHref}
                                            className="group flex h-full items-start gap-3.5 rounded-xl border border-border/40 bg-muted/30 p-4 transition-colors hover:border-brand-yellow/30 hover:bg-muted/50"
                                        >
                                            {speakerCard}
                                        </Link>
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
                    <Card className="border-border/50 bg-gradient-to-br from-brand-yellow/50 to-brand-dark/30 dark:from-brand-yellow/30 dark:to-brand-dark/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-yellow"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                Para miembros
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>La membresia potencia tu acceso con ahorro acumulado y contenido preferencial.</p>
                            <ul className="space-y-1.5 text-sm">
                                <li className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-brand-yellow"><polyline points="20 6 9 17 4 12" /></svg>
                                    Acceso incluido o precio preferencial
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-brand-yellow"><polyline points="20 6 9 17 4 12" /></svg>
                                    Acceso preferencial a encuentros y contenidos
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-brand-yellow"><polyline points="20 6 9 17 4 12" /></svg>
                                    Comunidad y networking exclusivo
                                </li>
                            </ul>
                            <Link href="/precios" className="inline-flex items-center gap-1 text-sm font-medium text-brand-yellow hover:text-brand-yellow">
                                Ver planes
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Related */}
                    {relatedEvents.length > 0 && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base">Tambien te puede interesar</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {relatedEvents.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={getPublicEventPath(item)}
                                        className="group flex items-start gap-3 rounded-xl border border-border/40 p-3 transition-colors hover:bg-muted/50"
                                    >
                                        {item.image_url ? (
                                            <div
                                                role="img"
                                                aria-label={item.title}
                                                className="h-12 w-12 shrink-0 rounded-lg bg-cover bg-center"
                                                style={{ backgroundImage: `url("${item.image_url}")` }}
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium group-hover:text-brand-yellow transition-colors">{item.title}</p>
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

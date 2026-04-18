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

function DetailShell({
    title,
    eyebrow,
    children,
    className,
}: {
    title: string
    eyebrow?: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <section className={cn('rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/10 backdrop-blur-sm md:p-7', className)}>
            {eyebrow && (
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                    {eyebrow}
                </p>
            )}
            <h2 className={cn('font-bold tracking-tight text-white', eyebrow ? 'mt-3 text-2xl md:text-3xl' : 'text-2xl md:text-3xl')}>
                {title}
            </h2>
            <div className="mt-5">{children}</div>
        </section>
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
        <div className="space-y-10 pb-28">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildStructuredData(event, faqItems) }} />

            <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,#070707_10%,#111111_55%,#050505_100%)] shadow-2xl shadow-black/25">
                <div className="absolute inset-0">
                    {event.image_url && (
                        <div
                            role="img"
                            aria-label={event.title}
                            className="absolute inset-0 h-full w-full bg-cover bg-center opacity-20 blur-sm"
                            style={{ backgroundImage: `url("${event.image_url}")` }}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/60" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(246,174,2,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(122,86,2,0.18),transparent_30%)]" />
                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                </div>

                <div className="relative grid gap-8 px-6 py-10 sm:px-8 md:px-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:py-14">
                    <div className="space-y-7">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-yellow">
                                {formatLabel}
                            </span>
                            {event.hero_badge && (
                                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                                    {event.hero_badge}
                                </span>
                            )}
                            {specialization && (
                                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white">
                                    {specialization.name}
                                </span>
                            )}
                            {event.formation_track && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-yellow">
                                    Ruta: {event.formation_track}
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                                {event.title}
                            </h1>
                            {event.subtitle && (
                                <p className="max-w-3xl text-lg leading-relaxed text-neutral-300 sm:text-xl">
                                    {event.subtitle}
                                </p>
                            )}
                            {event.campaign_problem && (
                                <p className="max-w-3xl border-l border-brand-yellow/40 pl-4 text-sm leading-relaxed text-neutral-400 sm:text-base">
                                    {event.campaign_problem}
                                </p>
                            )}
                        </div>

                        {event.speakers?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-4">
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
                                                    className="h-9 w-9 rounded-full bg-cover bg-center ring-2 ring-white/15"
                                                    style={{ backgroundImage: `url("${avatar}")` }}
                                                />
                                            ) : (
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow/20 text-sm font-bold text-brand-yellow">
                                                    {name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-white">{name}</p>
                                                {speaker?.headline && (
                                                    <p className="text-xs text-neutral-500">{speaker.headline}</p>
                                                )}
                                            </div>
                                        </>
                                    )

                                    if (!speakerHref) {
                                        return (
                                            <div key={item.id} className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                                                {content}
                                            </div>
                                        )
                                    }

                                    return (
                                        <Link
                                            key={item.id}
                                            href={speakerHref}
                                            className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:border-brand-yellow/30 hover:bg-white/10"
                                        >
                                            {content}
                                        </Link>
                                    )
                                })}
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Fecha</p>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-200">{formatEventDate(event.start_time)}</p>
                            </div>
                            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Formato</p>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-200">{formatLabel}</p>
                            </div>
                            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Dirigido a</p>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-200">{getAudienceLabel(event.target_audience)}</p>
                            </div>
                        </div>
                    </div>

                    <aside className="lg:sticky lg:top-24">
                        <div className="rounded-[28px] border border-white/10 bg-black/30 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Inversion</p>
                                <p className="mt-2 text-3xl font-bold text-white">
                                    {finalPrice > 0 ? `$${finalPrice.toFixed(0)} MXN` : 'Gratis'}
                                </p>
                                {includedBySpecialization && (
                                    <p className="mt-1 text-sm font-medium text-brand-yellow">
                                        Incluido por tu especialidad
                                    </p>
                                )}
                                {finalPrice > 0 && finalPrice < Number(event.price || 0) && (
                                    <p className="mt-1 text-sm font-medium text-brand-yellow">
                                        Tienes precio preferencial de miembro
                                    </p>
                                )}
                            </div>

                            <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm">
                                <p className="font-medium text-white">{memberMessage.label}</p>
                                {memberMessage.note && <p className="mt-2 leading-relaxed text-neutral-400">{memberMessage.note}</p>}
                            </div>

                            <div className="mt-5 space-y-3">
                                {hasAccess ? (
                                    <>
                                        <Link href={`/hub/${event.slug}`}>
                                            <Button className="w-full" size="lg">
                                                Entrar al hub privado
                                            </Button>
                                        </Link>
                                        <p className="text-center text-xs font-medium text-brand-yellow">
                                            Ya tienes acceso a este contenido
                                        </p>
                                    </>
                                ) : isBlocked ? (
                                    <>
                                        <Button variant="secondary" className="w-full cursor-not-allowed py-6 text-base opacity-60" disabled>
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
                                                        <div className="absolute inset-x-0 top-1/2 border-t border-white/10" />
                                                        <span className="relative mx-auto flex w-fit bg-black px-3 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                                                            o tambien
                                                        </span>
                                                    </div>
                                                )}
                                                <Link href={`/precios?next=/eventos/${event.slug}&autoCheckout=true`}>
                                                    <Button
                                                        variant={isMembersOnly ? 'default' : 'outline'}
                                                        className={cn('w-full', isMembersOnly ? 'py-6 text-base' : 'border-brand-yellow/30 text-brand-yellow hover:bg-brand-yellow/10')}
                                                        size="lg"
                                                    >
                                                        {isMembersOnly && <Lock className="h-4 w-4" />}
                                                        {membershipCtaLabel}
                                                    </Button>
                                                </Link>
                                            </>
                                        )}

                                        {campaign && (
                                            <a href="#campaign-temario">
                                                <Button variant="outline" className="w-full gap-2">
                                                    <Download className="h-4 w-4" />
                                                    Descargar temario
                                                </Button>
                                            </a>
                                        )}
                                    </>
                                )}
                            </div>

                            {!hasAccess && (
                                <p className="mt-4 text-center text-[11px] text-neutral-500">
                                    Ya lo adquiriste?{' '}
                                    <Link href="/compras/recuperar" className="font-medium text-brand-yellow hover:underline">
                                        Recupera tu acceso
                                    </Link>
                                </p>
                            )}
                        </div>
                    </aside>
                </div>
            </section>

            {campaign && (
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
            )}

            <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-8">
                    {event.description && (
                        <DetailShell title="Acerca de este encuentro" eyebrow="Contexto">
                            <div className="space-y-3 text-sm leading-relaxed text-neutral-300 md:text-base">
                                {event.description.split('\n').map((paragraph: string, index: number) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                        </DetailShell>
                    )}

                    {(event.ideal_for?.length > 0 || event.learning_outcomes?.length > 0) && (
                        <DetailShell title="A quien va dirigido y que aprenderas" eyebrow="Valor academico">
                            <div className="grid gap-8 md:grid-cols-2">
                                {event.ideal_for?.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white">A quien va dirigido</h3>
                                        <ul className="space-y-3">
                                            {event.ideal_for.map((item: string) => (
                                                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-neutral-300">
                                                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-yellow/10 text-brand-yellow">
                                                        <Check className="h-3 w-3" />
                                                    </span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {event.learning_outcomes?.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white">Que aprenderas</h3>
                                        <ul className="space-y-3">
                                            {event.learning_outcomes.map((item: string) => (
                                                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-neutral-300">
                                                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-brand-yellow">
                                                        <ArrowRight className="h-3 w-3" />
                                                    </span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </DetailShell>
                    )}

                    <DetailShell title="Que incluye tu acceso" eyebrow="Acceso">
                        <div className="grid gap-3 md:grid-cols-2">
                            {valueItems.map((item) => (
                                <div key={item.title} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                                    <p className="text-sm font-semibold text-white">{item.title}</p>
                                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </DetailShell>

                    {event.speakers?.length > 0 && (
                        <DetailShell title="Ponentes" eyebrow="Docencia">
                            <div className="grid gap-4 md:grid-cols-2">
                                {event.speakers.map((item: any) => {
                                    const speaker = item.speaker
                                    const name = speaker?.profile?.full_name || 'Ponente'
                                    const avatar = getSpeakerImage(speaker)
                                    const speakerHref = getPublicSpeakerHref(speaker, speakerReturnTo)
                                    const specialties = Array.isArray(speaker?.specialties) ? speaker.specialties.filter(Boolean).slice(0, 3) : []
                                    const credentials = Array.isArray(speaker?.credentials) ? speaker.credentials.filter(Boolean).slice(0, 2) : []

                                    const content = (
                                        <>
                                            {avatar ? (
                                                <div
                                                    role="img"
                                                    aria-label={name}
                                                    className="h-14 w-14 rounded-full bg-cover bg-center ring-2 ring-white/15"
                                                    style={{ backgroundImage: `url("${avatar}")` }}
                                                />
                                            ) : (
                                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-yellow/20 text-lg font-bold text-brand-yellow">
                                                    {name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1 space-y-3">
                                                <div>
                                                    <p className="font-medium text-white">{name}</p>
                                                    {speaker?.headline && (
                                                        <p className="mt-1 text-sm text-neutral-500">{speaker.headline}</p>
                                                    )}
                                                </div>

                                                {specialties.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {specialties.map((specialty: string) => (
                                                            <span key={specialty} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-300">
                                                                {specialty}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {credentials.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        {credentials.map((credential: string) => (
                                                            <p key={credential} className="text-sm leading-relaxed text-neutral-400">
                                                                {credential}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )

                                    if (!speakerHref) {
                                        return (
                                            <div key={item.id} className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
                                                {content}
                                            </div>
                                        )
                                    }

                                    return (
                                        <Link
                                            key={item.id}
                                            href={speakerHref}
                                            className="group flex items-start gap-4 rounded-[24px] border border-white/10 bg-black/20 p-4 transition-colors hover:border-brand-yellow/30 hover:bg-black/30"
                                        >
                                            {content}
                                        </Link>
                                    )
                                })}
                            </div>
                        </DetailShell>
                    )}

                    {hasAccess && materialLinks.length > 0 && (
                        <DetailShell title="Materiales del evento" eyebrow="Materiales">
                            <div className="space-y-3">
                                {materialLinks.map((item: any) => (
                                    <div key={item.id || item.url} className="flex flex-col gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white">{item.title}</p>
                                            <p className="mt-1 text-xs text-neutral-500">
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
                        </DetailShell>
                    )}

                    <DetailShell title="Preguntas frecuentes" eyebrow="FAQ">
                        <FaqAccordion items={faqItems} />
                    </DetailShell>
                </div>

                <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    {event.formation && !Array.isArray(event.formation) && (
                        <DetailShell title="Parte de una ruta mayor" eyebrow="Formacion" className="p-5">
                            <p className="text-sm leading-relaxed text-neutral-300">
                                Este encuentro forma parte de {event.formation.title}. Puedes tomarlo por separado o revisar la ruta completa.
                            </p>
                            <Link href={`/formaciones/${event.formation.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-yellow hover:text-brand-yellow">
                                Ver diplomado completo
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </DetailShell>
                    )}

                    <DetailShell title="Para miembros" eyebrow="Comunidad" className="p-5">
                        <div className="space-y-3 text-sm leading-relaxed text-neutral-300">
                            <p>La membresia potencia tu acceso con ahorro acumulado y una entrada mas continua a eventos, contenidos y networking.</p>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                                    Acceso incluido o precio preferencial cuando aplica.
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                                    Comunidad y networking con colegas del ecosistema.
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                                    Continuidad entre academia, rutas y experiencias en vivo.
                                </li>
                            </ul>
                            <Link href="/precios" className="inline-flex items-center gap-2 text-sm font-medium text-brand-yellow hover:text-brand-yellow">
                                Ver planes
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </DetailShell>
                </aside>
            </section>

            {relatedEvents.length > 0 && (
                <DetailShell
                    title={campaign ? 'Eventos relacionados de esta ruta' : 'Tambien te puede interesar'}
                    eyebrow={campaign ? 'Agenda relacionada' : 'Siguiente paso'}
                >
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {relatedEvents.map((item) => (
                            <PublicCatalogCard key={item.id} event={item} fixedLayout />
                        ))}
                    </div>
                </DetailShell>
            )}

            {!isBlocked && (
                <div className="fixed inset-x-0 bottom-3 z-40 px-3 lg:hidden">
                    <div className="mx-auto flex max-w-xl items-center gap-3 rounded-[22px] border border-white/10 bg-black/85 p-3 shadow-2xl shadow-black/30 backdrop-blur-md">
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
                                <Button variant="outline" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Temario
                                </Button>
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

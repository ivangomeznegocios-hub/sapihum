import Image from 'next/image'
import Link from 'next/link'
import {
    ArrowRight,
    CalendarDays,
    Check,
    Clock3,
    Globe,
    Layers3,
    Sparkles,
    Users,
} from 'lucide-react'
import { PublicAccessCta } from '@/components/catalog/public-access-cta'
import { Button } from '@/components/ui/button'
import type {
    AggregatedCongressSpeaker,
    CongressLandingConfig,
    CongressLandingEvent,
    CongressSpeakerProfile,
} from '@/lib/events/congress'
import {
    getCongressLandingPath,
    mergeCongressSpeakersWithDirectory,
} from '@/lib/events/congress'
import { getEffectiveEventPriceForProfile } from '@/lib/events/pricing'
import type { SpeakerWithProfile } from '@/types/database'

function formatCongressDate(value: string, timeZone: string) {
    return new Intl.DateTimeFormat('es-MX', {
        timeZone,
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(value))
}

function formatCongressTime(value: string, timeZone: string) {
    return new Intl.DateTimeFormat('es-MX', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value))
}

function getProgramTypeLabel(event: CongressLandingEvent) {
    const subcategoryLabels: Record<string, string> = {
        clase: 'Clase',
        conferencia: 'Conferencia',
        congreso: 'Congreso',
        curso: 'Curso',
        diplomado: 'Diplomado',
        meetup: 'Encuentro',
        otro: 'Sesión especial',
        seminario: 'Seminario',
        taller: 'Taller',
    }

    if (event.subcategory && subcategoryLabels[event.subcategory]) {
        return subcategoryLabels[event.subcategory]
    }

    if (event.event_type === 'course') return 'Clase'
    if (event.event_type === 'presencial') return 'Sesión presencial'
    return 'Sesión en vivo'
}

function normalizeText(value?: string | null) {
    const text = value?.replace(/\s+/g, ' ').trim()
    return text ? text : null
}

function trimText(value: string, maxLength: number) {
    if (value.length <= maxLength) return value
    return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

function joinNaturalList(items: string[]) {
    if (items.length === 0) return ''
    if (items.length === 1) return items[0]
    if (items.length === 2) return `${items[0]} y ${items[1]}`
    return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`
}

function summarizeBio(bio?: string | null) {
    const normalized = normalizeText(bio)
    if (!normalized) return null

    const firstParagraph = normalized.split(/(?<=[.!?])\s+/)[0] ?? normalized
    return trimText(firstParagraph, 150)
}

function isGenericHeadline(headline?: string | null) {
    const value = normalizeText(headline)?.toLocaleLowerCase('es-MX')
    if (!value) return true

    return [
        'psicóloga clínica',
        'psicologo clinico',
        'psicóloga',
        'psicologo',
        'neuropsicólogo',
        'neuropsicologo',
        'ponente invitado',
    ].includes(value)
}

function getSpeakerHref(speaker: CongressSpeakerProfile, returnTo: string) {
    if (!speaker?.id || !speaker?.is_public) return null
    return `/speakers/${speaker.id}?returnTo=${encodeURIComponent(returnTo)}`
}

function getSpeakerImage(speaker: CongressSpeakerProfile) {
    return speaker?.photo_url || speaker?.profile?.avatar_url || null
}

function getSpeakerName(speaker: CongressSpeakerProfile) {
    return normalizeText(speaker?.profile?.full_name) ?? normalizeText(speaker?.headline) ?? 'Ponente invitado'
}

function getSpeakerPrimaryText(speaker: CongressSpeakerProfile) {
    const headline = normalizeText(speaker.headline)
    const credentials = Array.from(
        new Set((speaker.credentials ?? []).map((item) => normalizeText(item)).filter(Boolean) as string[])
    )
    const bioSummary = summarizeBio(speaker.bio)

    if (headline && !isGenericHeadline(headline) && headline.length >= 24) {
        return trimText(headline, 120)
    }

    if (credentials.length >= 2) {
        return trimText(joinNaturalList(credentials.slice(0, 3)), 130)
    }

    if (bioSummary && (!headline || isGenericHeadline(headline))) {
        return bioSummary
    }

    if (headline) {
        return trimText(headline, 110)
    }

    if (credentials.length > 0) {
        return trimText(joinNaturalList(credentials.slice(0, 2)), 120)
    }

    return 'Perfil público de especialista invitado en la programación del congreso.'
}

function getSpeakerAreas(speaker: CongressSpeakerProfile) {
    return Array.from(
        new Set((speaker.specialties ?? []).map((item) => normalizeText(item)).filter(Boolean) as string[])
    )
}

function getEventSpeakerNames(event: CongressLandingEvent) {
    const names = Array.from(
        new Set(
            (event.speakers ?? [])
                .map((item) => item.speaker ? getSpeakerName(item.speaker) : null)
                .filter(Boolean) as string[]
        )
    )

    return names.length > 0 ? names.join(' · ') : 'Ponente por confirmar'
}

function getOfficialCongressImage(event: any) {
    return (
        event?.cover_image_url
        ?? event?.image_url
        ?? event?.featured_image
        ?? event?.hero_image
        ?? event?.coverImage
        ?? event?.coverImageUrl
        ?? null
    )
}

function MembershipCta({
    eventSlug,
    label,
    className,
}: {
    eventSlug: string
    label: string
    className?: string
}) {
    return (
        <Link href={`/precios?next=/eventos/${eventSlug}&autoCheckout=true`} className="block w-full max-w-full">
            <Button
                size="lg"
                variant="outline"
                className={className ?? 'min-h-12 h-auto w-full max-w-full whitespace-normal px-5 py-3 text-center'}
            >
                {label}
            </Button>
        </Link>
    )
}

function SectionHeading({
    eyebrow,
    title,
    description,
    light = false,
}: {
    eyebrow: string
    title: string
    description?: string
    light?: boolean
}) {
    return (
        <div className="min-w-0 max-w-3xl">
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${light ? 'text-[#f0c98f]' : 'text-[#9a6a2e]'}`}>
                {eyebrow}
            </p>
            <h2 className={`mt-3 font-serif text-3xl leading-tight sm:text-4xl ${light ? 'text-[#fff8ef]' : 'text-[#271a13]'}`}>
                {title}
            </h2>
            {description && (
                <p className={`mt-3 max-w-2xl text-base leading-relaxed ${light ? 'text-[#eadfce]' : 'text-[#5a4b40]'}`}>
                    {description}
                </p>
            )}
        </div>
    )
}

function CongressCtaGroup({
    event,
    config,
    finalPrice,
    hasAccess,
    dark = false,
}: {
    event: any
    config: CongressLandingConfig
    finalPrice: number
    hasAccess: boolean
    dark?: boolean
}) {
    const purchaseButtonClass = dark
        ? 'min-h-12 h-auto w-full max-w-full whitespace-normal border border-[#c49b63] bg-[#c49b63] px-5 py-3 text-center text-[#1e140f] hover:bg-[#d5ae78]'
        : 'min-h-12 h-auto w-full max-w-full whitespace-normal border border-[#a77739] bg-[#a77739] px-5 py-3 text-center text-white hover:bg-[#8f632f]'
    const membershipButtonClass = dark
        ? 'min-h-12 h-auto w-full max-w-full whitespace-normal border-[#c49b63]/50 bg-transparent px-5 py-3 text-center text-[#f9efe2] hover:bg-[#2a1c14] hover:text-white'
        : 'min-h-12 h-auto w-full max-w-full whitespace-normal border-[#d7c0a3] bg-white px-5 py-3 text-center text-[#3d2a1d] hover:bg-[#f8f1e8]'
    const accessButtonClass = dark
        ? 'min-h-12 h-auto w-full max-w-full whitespace-normal border border-[#c49b63] bg-[#c49b63] px-5 py-3 text-center text-[#1e140f] hover:bg-[#d5ae78]'
        : 'min-h-12 h-auto w-full max-w-full whitespace-normal border border-[#a77739] bg-[#a77739] px-5 py-3 text-center text-white hover:bg-[#8f632f]'
    const captionClass = dark ? 'text-[#ddcfbf]' : 'text-[#6c5b4d]'

    if (hasAccess) {
        return (
            <Link href={`/hub/${event.slug}`} className="block w-full max-w-full">
                <Button className={accessButtonClass} size="lg">
                    Acceder al congreso
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </Link>
        )
    }

    return (
        <div className="flex min-w-0 w-full flex-col gap-3">
            <div className="min-w-0">
                <PublicAccessCta
                    eventId={event.id}
                    eventSlug={event.slug}
                    title={event.title}
                    label={config.cta.purchaseLabel}
                    requiresPayment={finalPrice > 0}
                    buttonClassName={purchaseButtonClass}
                />
            </div>

            <div className="min-w-0">
                <MembershipCta
                    eventSlug={event.slug}
                    label={config.cta.membershipLabel}
                    className={membershipButtonClass}
                />
                <p className={`mt-2 text-sm leading-relaxed ${captionClass}`}>
                    {config.cta.membershipCaption}
                </p>
            </div>
        </div>
    )
}

function OfficialImageSection({
    config,
    event,
}: {
    config: CongressLandingConfig
    event: any
}) {
    const imageSrc = getOfficialCongressImage(event)
    if (!imageSrc) return null

    return (
        <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 md:py-14">
            <div className="overflow-hidden rounded-[32px] border border-[#2f2118] bg-[#120c09] p-6 shadow-[0_24px_80px_rgba(18,12,9,0.22)] sm:p-8">
                <div className="min-w-0">
                    <SectionHeading
                        eyebrow={config.officialImage.eyebrow}
                        title={config.officialImage.title}
                        description={config.officialImage.description}
                        light
                    />
                </div>

                <figure className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(214,173,111,0.18),transparent_42%),#1a120d]">
                    <div className="relative aspect-[16/9] min-w-0">
                        <Image
                            src={imageSrc}
                            alt={`${config.title} | ${config.subtitle}`}
                            fill
                            priority
                            quality={86}
                            sizes="(min-width: 1280px) 1120px, (min-width: 768px) calc(100vw - 4rem), calc(100vw - 3rem)"
                            className="object-contain p-3 sm:p-5"
                        />
                    </div>
                </figure>
            </div>
        </section>
    )
}

function SpeakerCard({
    item,
    returnTo,
}: {
    item: AggregatedCongressSpeaker
    returnTo: string
}) {
    const name = getSpeakerName(item.speaker)
    const image = getSpeakerImage(item.speaker)
    const href = getSpeakerHref(item.speaker, returnTo)
    const primaryText = getSpeakerPrimaryText(item.speaker)
    const allAreas = getSpeakerAreas(item.speaker)
    const visibleAreas = allAreas.slice(0, 3)
    const extraAreas = Math.max(allAreas.length - visibleAreas.length, 0)

    const content = (
        <article className="flex h-full min-w-0 flex-col rounded-[28px] border border-[#e3d6c7] bg-white p-6 shadow-[0_20px_60px_rgba(44,28,17,0.08)] transition-transform duration-200 hover:-translate-y-1 hover:border-[#c79d67]">
            <div className="flex items-start gap-4">
                {image ? (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#dcc4a5]">
                        <Image
                            src={image}
                            alt={name}
                            fill
                            sizes="64px"
                            quality={58}
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#dcc4a5] bg-[linear-gradient(135deg,#f5e8d6,#e8d0ae)] text-xl font-semibold text-[#7d5727]">
                        {name.charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a6a2e]">
                        {item.event_count > 0
                            ? `${item.event_count} ${item.event_count === 1 ? 'evento incluido' : 'eventos incluidos'}`
                            : 'Perfil público SAPIHUM'}
                    </p>
                    <h3 className="mt-2 line-clamp-2 font-serif text-2xl leading-tight text-[#241913]">{name}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#5f5146]">{primaryText}</p>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                {visibleAreas.map((area) => (
                    <span
                        key={area}
                        className="rounded-full border border-[#e5d5bf] bg-[#fbf6ef] px-3 py-1 text-xs font-medium text-[#6b4a24]"
                    >
                        {area}
                    </span>
                ))}
                {extraAreas > 0 && (
                    <span className="rounded-full border border-[#e5d5bf] bg-[#f5eee4] px-3 py-1 text-xs font-medium text-[#7b6654]">
                        +{extraAreas}
                    </span>
                )}
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm text-[#6b5a4c]">
                <span className="min-w-0 truncate">
                    {item.source === 'agenda' ? 'Ponente dentro de la agenda del congreso' : 'Perfil disponible en speakers'}
                </span>
                <span className="inline-flex shrink-0 items-center gap-2 font-medium text-[#9a6a2e]">
                    Ver perfil
                    <ArrowRight className="h-4 w-4" />
                </span>
            </div>
        </article>
    )

    if (!href) {
        return <div className="h-full min-w-0">{content}</div>
    }

    return <Link href={href} className="block h-full min-w-0">{content}</Link>
}

function ProgrammingCard({
    event,
    timeZone,
}: {
    event: CongressLandingEvent
    timeZone: string
}) {
    return (
        <article className="flex h-full min-w-0 flex-col rounded-[28px] border border-[#e3d6c7] bg-white p-6 shadow-[0_20px_60px_rgba(44,28,17,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#f6ead8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8c5e27]">
                    {formatCongressDate(event.start_time, timeZone)}
                </span>
                <span className="rounded-full border border-[#ead8c2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b5a4c]">
                    {getProgramTypeLabel(event)}
                </span>
            </div>

            <h3 className="mt-5 font-serif text-2xl leading-tight text-[#241913]">
                {event.title}
            </h3>

            {event.subtitle && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#5f5146]">{event.subtitle}</p>
            )}

            <div className="mt-5 space-y-3 text-sm text-[#5f5146]">
                <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6a2e]" />
                    <span>{formatCongressTime(event.start_time, timeZone)}</span>
                </div>
                <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6a2e]" />
                    <span>{getEventSpeakerNames(event)}</span>
                </div>
            </div>

            <div className="mt-auto pt-6">
                <Link
                    href={`/eventos/${event.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#9a6a2e] hover:text-[#7d5727]"
                >
                    Ver detalle
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </article>
    )
}

function FaqList({ items }: { items: CongressLandingConfig['faq'] }) {
    return (
        <div className="space-y-3">
            {items.map((item) => (
                <details
                    key={item.question}
                    className="overflow-hidden rounded-[24px] border border-[#e3d6c7] bg-white px-5 py-4 shadow-[0_16px_45px_rgba(44,28,17,0.06)]"
                >
                    <summary className="cursor-pointer list-none text-base font-semibold text-[#241913]">
                        {item.question}
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-[#5f5146]">{item.answer}</p>
                </details>
            ))}
        </div>
    )
}

export function PublicCongressLanding({
    event,
    config,
    includedEvents,
    directorySpeakers,
    membershipLevel = 0,
    hasActiveMembership = false,
    membershipSpecializationCode = null,
    hasAccess = false,
}: {
    event: any
    config: CongressLandingConfig
    includedEvents: CongressLandingEvent[]
    directorySpeakers: SpeakerWithProfile[]
    membershipLevel: number
    hasActiveMembership: boolean
    membershipSpecializationCode: string | null
    hasAccess: boolean
}) {
    const speakers = mergeCongressSpeakersWithDirectory(includedEvents, directorySpeakers)
    const finalPrice = getEffectiveEventPriceForProfile(event, {
        membershipLevel,
        hasActiveMembership,
        membershipSpecializationCode,
    })
    const timeZone = config.dateWindow.timeZone
    const returnTo = getCongressLandingPath(config)

    return (
        <div className="overflow-x-clip bg-[#f5efe6] pb-28 text-[#241913]">
            <section className="relative overflow-hidden border-b border-[#2f2118] bg-[#1a120d] text-[#fff8ef]">
                <div className="absolute inset-0">
                    {event.image_url && (
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-20"
                            style={{ backgroundImage: `url("${event.image_url}")` }}
                        />
                    )}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,173,111,0.24),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(120,78,27,0.25),transparent_24%),linear-gradient(180deg,rgba(18,12,9,0.88),rgba(18,12,9,0.96))]" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-8 md:py-20">
                    <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
                        <div className="min-w-0 space-y-8">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full border border-[#c49b63]/40 bg-[#c49b63]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f0c98f]">
                                    Congreso online SAPIHUM
                                </span>
                                {hasAccess && (
                                    <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                                        Tu acceso ya está activo
                                    </span>
                                )}
                            </div>

                            <div className="space-y-5">
                                <h1 className="max-w-4xl font-serif text-4xl leading-[0.98] text-[#fff8ef] sm:text-5xl lg:text-7xl">
                                    <span className="block">{config.title}</span>
                                    <span className="mt-2 block text-[#f0c98f]">{config.subtitle}</span>
                                </h1>
                                <p className="max-w-3xl text-lg leading-relaxed text-[#f0e6da] sm:text-xl">
                                    {config.description}
                                </p>
                                <p className="max-w-3xl text-base leading-relaxed text-[#ddcfbf] sm:text-lg">
                                    {config.supportingText}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {config.heroDetails.map((item) => (
                                    <div
                                        key={item.label}
                                        className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm"
                                    >
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f0c98f]">
                                            {item.label}
                                        </p>
                                        <p className="mt-2 text-sm leading-relaxed text-[#fff8ef]">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <aside className="min-w-0 rounded-[28px] border border-[#4f3824] bg-black/30 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0c98f]">
                                Acceso completo al congreso
                            </p>
                            <div className="mt-5">
                                <p className="font-serif text-5xl text-[#fff8ef]">$250</p>
                                <p className="mt-2 text-base text-[#eadfce]">MXN por toda la programación especial</p>
                            </div>

                            <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#eadfce]">
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#f0c98f]" />
                                    <span>Del 20 al 31 de mayo de 2026.</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#f0c98f]" />
                                    <span>Todas las actividades se realizan online y en vivo.</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-[#f0c98f]" />
                                    <span>Un solo acceso cubre todos los eventos incluidos del congreso.</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#f0c98f]" />
                                    <span>La membresía activa SAPIHUM lo incluye sin costo adicional.</span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <CongressCtaGroup
                                    event={event}
                                    config={config}
                                    finalPrice={finalPrice}
                                    hasAccess={hasAccess}
                                    dark
                                />
                                <div className="space-y-2 text-sm text-[#ddcfbf]">
                                    <p>{config.pricing.purchaseNote}</p>
                                    <p>{config.pricing.membershipNote}</p>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            <section className="relative mx-auto max-w-7xl px-6 py-10 sm:px-8 md:py-14">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {config.metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="min-w-0 rounded-[28px] border border-[#e3d6c7] bg-white p-6 shadow-[0_18px_55px_rgba(44,28,17,0.08)]"
                        >
                            <p className="text-3xl font-semibold text-[#9a6a2e]">{metric.value}</p>
                            <p className="mt-3 font-serif text-2xl leading-tight text-[#241913]">{metric.label}</p>
                            <p className="mt-3 text-sm leading-relaxed text-[#5f5146]">{metric.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <OfficialImageSection config={config} event={event} />

            <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 md:py-12">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                    <div className="min-w-0 rounded-[32px] border border-[#e3d6c7] bg-white p-7 shadow-[0_20px_60px_rgba(44,28,17,0.08)] sm:p-8">
                        <SectionHeading
                            eyebrow="Panorama del congreso"
                            title="Acerca de este encuentro"
                            description="Una experiencia pensada como congreso completo."
                        />
                        <div className="mt-6 space-y-4 text-base leading-relaxed text-[#4f4238]">
                            {config.about.map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                        </div>
                    </div>

                    <div className="min-w-0 rounded-[32px] border border-[#dac6ae] bg-[#fbf6ef] p-6 shadow-[0_20px_60px_rgba(44,28,17,0.06)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a6a2e]">
                            Dirigido a
                        </p>
                        <p className="mt-4 text-sm leading-relaxed text-[#4f4238]">
                            Psicólogos, estudiantes de psicología, terapeutas, docentes y profesionales vinculados a la salud mental que buscan actualizarse y conectar con una comunidad profesional en crecimiento.
                        </p>

                        <div className="mt-6 space-y-3 text-sm text-[#4f4238]">
                            <div className="flex items-start gap-3">
                                <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6a2e]" />
                                <span>Programación en vivo con especialistas invitados de SAPIHUM.</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6a2e]" />
                                <span>Acceso a todos los eventos incluidos con un solo registro.</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6a2e]" />
                                <span>Constancia sujeta a las condiciones de participación del congreso.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 md:py-12">
                <SectionHeading
                    eyebrow="Beneficios del acceso"
                    title="Qué incluye tu acceso"
                    description="Con un solo acceso participas en el paquete completo del congreso y en los recursos que lo acompañan."
                />

                <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {config.benefits.map((benefit) => (
                        <div
                            key={benefit.title}
                            className="min-w-0 rounded-[28px] border border-[#e3d6c7] bg-white p-6 shadow-[0_20px_60px_rgba(44,28,17,0.08)]"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f6ead8] text-[#9a6a2e]">
                                <Check className="h-5 w-5" />
                            </div>
                            <h3 className="mt-5 font-serif text-2xl leading-tight text-[#241913]">{benefit.title}</h3>
                            <p className="mt-3 text-sm leading-relaxed text-[#5f5146]">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
                <div className="overflow-hidden rounded-[32px] border border-[#d7c0a3] bg-[linear-gradient(135deg,#fff9f0,#f2e4cf)] p-7 shadow-[0_24px_80px_rgba(44,28,17,0.08)] sm:p-8">
                    <div className="grid min-w-0 gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-center">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9a6a2e]">
                                ACCESO Y MEMBRESÍA
                            </p>
                            <h2 className="mt-3 font-serif text-3xl leading-tight text-[#241913] sm:text-4xl">
                                Compra tu acceso al congreso o entra sin costo adicional con tu membresía
                            </h2>
                            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#4f4238]">
                                <p>{config.pricing.purchaseNote}</p>
                                <p>{config.pricing.membershipNote}</p>
                            </div>
                        </div>

                        <div className="min-w-0">
                            <CongressCtaGroup
                                event={event}
                                config={config}
                                finalPrice={finalPrice}
                                hasAccess={hasAccess}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 md:py-12">
                <SectionHeading
                    eyebrow="Ponentes invitados"
                    title="Conoce a los ponentes"
                    description={config.speakersIntro}
                />

                {speakers.length > 0 ? (
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {speakers.map((item) => (
                            <SpeakerCard key={item.key} item={item} returnTo={returnTo} />
                        ))}
                    </div>
                ) : (
                    <div className="mt-8 rounded-[28px] border border-dashed border-[#d7c0a3] bg-white px-6 py-14 text-center text-sm text-[#5f5146]">
                        Los perfiles públicos de ponentes se mostrarán aquí conforme se publiquen en la plataforma.
                    </div>
                )}
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 md:py-12">
                <SectionHeading
                    eyebrow="Agenda del congreso"
                    title="Programación incluida"
                    description={config.programmingIntro}
                />

                {includedEvents.length > 0 ? (
                    <div className="mt-8 grid gap-5 lg:grid-cols-2">
                        {includedEvents.map((includedEvent) => (
                            <ProgrammingCard
                                key={includedEvent.id}
                                event={includedEvent}
                                timeZone={timeZone}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="mt-8 rounded-[28px] border border-dashed border-[#d7c0a3] bg-white px-6 py-16 text-center shadow-[0_16px_45px_rgba(44,28,17,0.05)]">
                        <p className="text-base leading-relaxed text-[#5f5146]">
                            {config.programmingEmptyState}
                        </p>
                    </div>
                )}
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 md:py-12">
                <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_0.95fr]">
                    <SectionHeading
                        eyebrow="FAQ del congreso"
                        title="Preguntas frecuentes"
                        description="Resolvemos aquí las dudas más comunes sobre el acceso, la membresía y la forma de participar en la programación del congreso."
                    />

                    <FaqList items={config.faq} />
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 md:py-12">
                <div className="overflow-hidden rounded-[32px] bg-[#1a120d] px-7 py-10 text-[#fff8ef] shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:px-8">
                    <div className="grid min-w-0 gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-center">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0c98f]">
                                Cierre comercial
                            </p>
                            <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
                                El Congreso de Psicología 2026 reúne toda una programación, no un solo horario
                            </h2>
                            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#ddcfbf]">
                                <p>{config.pricing.purchaseNote}</p>
                                <p>{config.pricing.membershipNote}</p>
                            </div>
                        </div>

                        <div className="min-w-0">
                            <CongressCtaGroup
                                event={event}
                                config={config}
                                finalPrice={finalPrice}
                                hasAccess={hasAccess}
                                dark
                            />
                        </div>
                    </div>
                </div>
            </section>

            {!hasAccess && (
                <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:hidden">
                    <div className="mx-auto max-w-md rounded-[28px] border border-[#c9a169] bg-[#120c09]/96 p-3 shadow-2xl backdrop-blur">
                        <div className="space-y-3">
                            <PublicAccessCta
                                eventId={event.id}
                                eventSlug={event.slug}
                                title={event.title}
                                label={config.cta.purchaseLabel}
                                requiresPayment={finalPrice > 0}
                                buttonClassName="min-h-11 h-auto w-full max-w-full whitespace-normal border border-[#c49b63] bg-[#c49b63] px-4 py-3 text-center text-[#1e140f] hover:bg-[#d5ae78]"
                            />
                            <div>
                                <MembershipCta
                                    eventSlug={event.slug}
                                    label={config.cta.membershipLabel}
                                    className="min-h-11 h-auto w-full max-w-full whitespace-normal border-[#c49b63]/50 bg-transparent px-4 py-3 text-center text-[#f9efe2] hover:bg-[#2a1c14] hover:text-white"
                                />
                                <p className="mt-2 text-sm leading-relaxed text-[#ddcfbf]">
                                    {config.cta.membershipCaption}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

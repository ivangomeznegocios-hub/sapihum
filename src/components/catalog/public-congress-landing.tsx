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
} from '@/lib/events/congress'
import {
    getAggregatedCongressSpeakers,
    getCongressLandingPath,
} from '@/lib/events/congress'
import { getEventTypeLabel } from '@/lib/events/public'
import { getEffectiveEventPriceForProfile } from '@/lib/events/pricing'

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

function getSpeakerHref(speaker: AggregatedCongressSpeaker['speaker'], returnTo: string) {
    if (!speaker?.id || !speaker?.is_public) return null
    return `/speakers/${speaker.id}?returnTo=${encodeURIComponent(returnTo)}`
}

function getSpeakerImage(speaker: AggregatedCongressSpeaker['speaker']) {
    return speaker?.photo_url || speaker?.profile?.avatar_url || null
}

function getStatusLabel(status: string | null | undefined) {
    if (status === 'live') return 'En vivo'
    if (status === 'completed') return 'Archivo'
    return 'Programado'
}

function getStatusClasses(status: string | null | undefined) {
    if (status === 'live') {
        return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
    }

    if (status === 'completed') {
        return 'border-white/10 bg-white/6 text-stone-200'
    }

    return 'border-amber-300/20 bg-amber-300/10 text-amber-50'
}

function MembershipCta({
    eventSlug,
    label,
    emphasized = false,
}: {
    eventSlug: string
    label: string
    emphasized?: boolean
}) {
    return (
        <Link href={`/precios?next=/eventos/${eventSlug}&autoCheckout=true`}>
            <Button
                size="lg"
                className={
                    emphasized
                        ? 'h-12 w-full border border-[#d0a96a]/30 bg-[#d0a96a] text-[#0d0c0b] hover:bg-[#e1bc7a]'
                        : 'h-12 w-full border border-[#6f5730] bg-transparent text-[#f2e7cf] hover:bg-[#20170f]'
                }
                variant={emphasized ? 'default' : 'outline'}
            >
                {label}
            </Button>
        </Link>
    )
}

function FaqList({ items }: { items: CongressLandingConfig['faq'] }) {
    return (
        <div className="space-y-3">
            {items.map((item) => (
                <details
                    key={item.question}
                    className="rounded-sm border border-white/10 bg-black/25 px-5 py-4 text-left"
                >
                    <summary className="cursor-pointer list-none text-sm font-semibold text-[#f5ecd9]">
                        {item.question}
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-stone-300">{item.answer}</p>
                </details>
            ))}
        </div>
    )
}

function AgendaItem({
    event,
    timeZone,
}: {
    event: CongressLandingEvent
    timeZone: string
}) {
    const speakerNames = (event.speakers ?? [])
        .map((item) => item.speaker?.profile?.full_name || item.speaker?.headline)
        .filter(Boolean)
        .slice(0, 3)

    return (
        <Link href={`/eventos/${event.slug}`} className="block h-full">
            <article className="flex h-full flex-col justify-between border border-[#3a2d1b] bg-[#120f0b]/92 p-5 transition-colors hover:border-[#c59a53] hover:bg-[#17120d]">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getStatusClasses(event.status)}`}>
                            {getStatusLabel(event.status)}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-300">
                            {getEventTypeLabel(event.event_type)}
                        </span>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c59a53]">
                            {formatCongressDate(event.start_time, timeZone)}
                        </p>
                        <h3 className="mt-2 font-serif text-2xl leading-tight text-[#f5ecd9]">
                            {event.title}
                        </h3>
                        {event.subtitle && (
                            <p className="mt-3 text-sm leading-relaxed text-stone-300">{event.subtitle}</p>
                        )}
                    </div>

                    <div className="space-y-2 text-sm text-stone-300">
                        <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-[#c59a53]" />
                            <span>{formatCongressTime(event.start_time, timeZone)}</span>
                        </div>
                        {speakerNames.length > 0 && (
                            <div className="flex items-start gap-2">
                                <Users className="mt-0.5 h-4 w-4 text-[#c59a53]" />
                                <span>{speakerNames.join(' · ')}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#f2d6a1]">
                    Ver ficha individual
                    <ArrowRight className="h-4 w-4" />
                </div>
            </article>
        </Link>
    )
}

function SpeakerCard({
    item,
    returnTo,
}: {
    item: AggregatedCongressSpeaker
    returnTo: string
}) {
    const name = item.speaker?.profile?.full_name || item.speaker?.headline || 'Ponente'
    const image = getSpeakerImage(item.speaker)
    const href = getSpeakerHref(item.speaker, returnTo)
    const specialties = (item.speaker?.specialties ?? []).filter(Boolean).slice(0, 3)

    const content = (
        <article className="flex h-full flex-col justify-between border border-[#3a2d1b] bg-[#110e0a]/92 p-5 transition-colors hover:border-[#c59a53] hover:bg-[#17120d]">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    {image ? (
                        <div
                            role="img"
                            aria-label={name}
                            className="h-16 w-16 shrink-0 rounded-full border border-[#6d5530] bg-cover bg-center"
                            style={{ backgroundImage: `url("${image}")` }}
                        />
                    ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#6d5530] bg-[#1d1711] text-xl font-semibold text-[#f2d6a1]">
                            {name.charAt(0)}
                        </div>
                    )}

                    <div>
                        <h3 className="font-serif text-2xl leading-tight text-[#f5ecd9]">{name}</h3>
                        {item.speaker?.headline && (
                            <p className="mt-1 text-sm text-stone-300">{item.speaker.headline}</p>
                        )}
                    </div>
                </div>

                {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {specialties.map((specialty) => (
                            <span
                                key={specialty}
                                className="rounded-full border border-[#574123] px-2.5 py-1 text-[11px] text-stone-200"
                            >
                                {specialty}
                            </span>
                        ))}
                    </div>
                )}

                {item.speaker?.credentials?.length ? (
                    <div className="space-y-2 text-sm leading-relaxed text-stone-300">
                        {item.speaker.credentials.filter(Boolean).slice(0, 2).map((credential) => (
                            <p key={credential}>{credential}</p>
                        ))}
                    </div>
                ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 text-sm text-stone-300">
                <span>{item.event_count} {item.event_count === 1 ? 'sesion' : 'sesiones'} en la agenda</span>
                <span className="inline-flex items-center gap-2 font-medium text-[#f2d6a1]">
                    Ver perfil
                    <ArrowRight className="h-4 w-4" />
                </span>
            </div>
        </article>
    )

    if (!href) {
        return <div className="h-full">{content}</div>
    }

    return <Link href={href} className="block h-full">{content}</Link>
}

export function PublicCongressLanding({
    event,
    config,
    includedEvents,
    membershipLevel = 0,
    hasActiveMembership = false,
    membershipSpecializationCode = null,
    hasAccess = false,
}: {
    event: any
    config: CongressLandingConfig
    includedEvents: CongressLandingEvent[]
    membershipLevel: number
    hasActiveMembership: boolean
    membershipSpecializationCode: string | null
    hasAccess: boolean
}) {
    const speakers = getAggregatedCongressSpeakers(includedEvents)
    const finalPrice = getEffectiveEventPriceForProfile(event, {
        membershipLevel,
        hasActiveMembership,
        membershipSpecializationCode,
    })
    const timeZone = config.dateWindow.timeZone
    const returnTo = getCongressLandingPath(config)
    const totalAccessCount = includedEvents.reduce((sum, item) => sum + Number(item.attendee_count || 0), 0)
    const showMembershipPriority = !hasAccess

    return (
        <div className="relative overflow-hidden bg-[#060505] pb-28 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,168,106,0.14),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(128,87,31,0.18),transparent_22%),linear-gradient(180deg,#080707_0%,#050505_48%,#090805_100%)]" />
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(to right, rgba(197,154,83,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(197,154,83,0.1) 1px, transparent 1px)', backgroundSize: '88px 88px' }} />

            <section className="relative overflow-hidden border-b border-[#2b2218]">
                <div className="absolute inset-0">
                    {event.image_url && (
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-20"
                            style={{ backgroundImage: `url("${event.image_url}")` }}
                        />
                    )}
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,5,5,0.94)_0%,rgba(6,5,5,0.8)_52%,rgba(6,5,5,0.88)_100%)]" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-8 md:py-20">
                    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 text-[#f2d6a1]">
                                <span className="h-px w-14 bg-[#8e6a36]" />
                                <span className="text-xs font-semibold uppercase tracking-[0.28em]">Sapihum</span>
                            </div>

                            <div className="space-y-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#c59a53]">
                                    Mayo 2026 · Congreso online 100% remoto
                                </p>
                                <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] text-[#f5ecd9] sm:text-6xl lg:text-7xl">
                                    {config.title}
                                </h1>
                                <p className="font-serif text-2xl italic text-stone-200 sm:text-3xl">
                                    {config.subtitle}
                                </p>
                                <div className="max-w-2xl space-y-4">
                                    <p className="text-lg leading-relaxed text-stone-200">{config.claim}</p>
                                    <p className="text-base leading-relaxed text-stone-300">{config.quote}</p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="border border-[#3a2d1b] bg-black/30 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c59a53]">Agenda</p>
                                    <p className="mt-2 text-3xl font-semibold text-[#f5ecd9]">{includedEvents.length}</p>
                                    <p className="mt-1 text-sm text-stone-300">eventos entre el 20 y el 31 de mayo</p>
                                </div>
                                <div className="border border-[#3a2d1b] bg-black/30 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c59a53]">Ponentes</p>
                                    <p className="mt-2 text-3xl font-semibold text-[#f5ecd9]">{speakers.length}</p>
                                    <p className="mt-1 text-sm text-stone-300">perfiles publicos agregados automaticamente</p>
                                </div>
                                <div className="border border-[#3a2d1b] bg-black/30 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c59a53]">Comunidad</p>
                                    <p className="mt-2 text-3xl font-semibold text-[#f5ecd9]">{totalAccessCount}</p>
                                    <p className="mt-1 text-sm text-stone-300">accesos acumulados en la agenda visible</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {showMembershipPriority ? (
                                    <>
                                        <div className="w-full sm:w-auto sm:min-w-[250px]">
                                            <MembershipCta eventSlug={event.slug} label={config.cta.membershipLabel} emphasized />
                                        </div>
                                        <div className="w-full sm:w-auto sm:min-w-[280px]">
                                            <PublicAccessCta
                                                eventId={event.id}
                                                eventSlug={event.slug}
                                                title={event.title}
                                                label={config.cta.purchaseLabel}
                                                requiresPayment={finalPrice > 0}
                                                buttonVariant="ghost"
                                                buttonClassName="h-12 w-full border border-[#6f5730] bg-transparent text-[#f2e7cf] hover:bg-[#20170f] hover:text-[#f5ecd9]"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full sm:w-auto sm:min-w-[250px]">
                                        <Link href={`/hub/${event.slug}`}>
                                            <Button className="h-12 w-full border border-[#d0a96a]/30 bg-[#d0a96a] text-[#0d0c0b] hover:bg-[#e1bc7a]">
                                                Acceder al congreso
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-stone-300">
                                Membresia primero. Compra directa disponible para quienes solo necesitan este congreso.
                            </p>
                        </div>

                        <aside className="border border-[#4d3a21] bg-black/35 p-6 backdrop-blur">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c59a53]">Ventana oficial</p>
                                    <p className="mt-3 font-serif text-4xl text-[#f5ecd9]">20 al 31</p>
                                    <p className="mt-2 text-base text-stone-300">de mayo de 2026</p>
                                </div>

                                <div className="h-px bg-[#3a2d1b]" />

                                <div className="space-y-4 text-sm leading-relaxed text-stone-300">
                                    <div className="flex items-start gap-3">
                                        <CalendarDays className="mt-0.5 h-4 w-4 text-[#c59a53]" />
                                        <span>La agenda se llena automaticamente con cada evento publico creado dentro del periodo.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Globe className="mt-0.5 h-4 w-4 text-[#c59a53]" />
                                        <span>Cada sesion conserva su ficha individual para detalle, perfiles y materiales.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Layers3 className="mt-0.5 h-4 w-4 text-[#c59a53]" />
                                        <span>Compra unica del congreso o acceso incluido con membresia activa.</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            <section className="relative border-b border-[#1d1811]">
                <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8">
                    <div className="mb-8 flex items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c59a53]">Propuesta de valor</p>
                            <h2 className="mt-3 font-serif text-4xl text-[#f5ecd9]">Una landing editorial que vende y organiza la agenda real del congreso</h2>
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {config.valuePillars.map((item) => (
                            <div key={item.title} className="border border-[#322618] bg-[#0f0d0a] p-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#c59a53]">{item.title}</p>
                                <p className="mt-3 text-sm leading-relaxed text-stone-300">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative border-b border-[#1d1811]">
                <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8">
                    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c59a53]">Agenda cronologica</p>
                            <h2 className="mt-3 font-serif text-4xl text-[#f5ecd9]">Eventos publicados del 20 al 31 de mayo</h2>
                            <p className="mt-3 text-base leading-relaxed text-stone-300">
                                Cada tarjeta abre la ficha individual del evento correspondiente. La agenda se actualiza conforme agregas nuevas sesiones a la plataforma.
                            </p>
                        </div>
                        <div className="text-sm text-stone-300">
                            {includedEvents.length} {includedEvents.length === 1 ? 'evento visible' : 'eventos visibles'}
                        </div>
                    </div>

                    {includedEvents.length > 0 ? (
                        <div className="grid gap-5 lg:grid-cols-2">
                            {includedEvents.map((item) => (
                                <AgendaItem key={item.id} event={item} timeZone={timeZone} />
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed border-[#4c3a20] bg-[#0e0b08] px-6 py-16 text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c59a53]">Agenda en preparacion</p>
                            <h3 className="mt-3 font-serif text-3xl text-[#f5ecd9]">Todavia no hay sesiones publicadas en esta ventana</h3>
                            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-stone-300">
                                La landing ya esta lista. En cuanto publiques eventos entre el 20 y el 31 de mayo, apareceran aqui automaticamente con sus ponentes y accesos.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <section className="relative border-b border-[#1d1811]">
                <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8">
                    <div className="mb-8 max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c59a53]">Ponentes</p>
                        <h2 className="mt-3 font-serif text-4xl text-[#f5ecd9]">Todos los perfiles publicos agregados desde la agenda</h2>
                        <p className="mt-3 text-base leading-relaxed text-stone-300">
                            La seccion se alimenta de los speakers publicos ya existentes en SAPIHUM, manteniendo foto, headline, especialidades y enlace a perfil.
                        </p>
                    </div>

                    {speakers.length > 0 ? (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {speakers.map((item) => (
                                <SpeakerCard key={item.key} item={item} returnTo={returnTo} />
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed border-[#4c3a20] bg-[#0e0b08] px-6 py-14 text-center">
                            <p className="text-sm text-stone-300">Aun no hay ponentes publicos visibles en la agenda del congreso.</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="relative border-b border-[#1d1811]">
                <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c59a53]">Acceso y beneficios</p>
                        <h2 className="mt-3 font-serif text-4xl text-[#f5ecd9]">Membresia como via principal, compra directa como alternativa</h2>
                        <div className="mt-6 space-y-4">
                            {config.benefitBullets.map((item) => (
                                <div key={item} className="flex items-start gap-3 text-sm leading-relaxed text-stone-300">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c59a53]" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border border-[#4d3a21] bg-[#0f0d0a] p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c59a53]">Conversion principal</p>
                        <div className="mt-5 space-y-3">
                            {hasAccess ? (
                                <Link href={`/hub/${event.slug}`}>
                                    <Button className="h-12 w-full border border-[#d0a96a]/30 bg-[#d0a96a] text-[#0d0c0b] hover:bg-[#e1bc7a]">
                                        Acceder al congreso
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <MembershipCta eventSlug={event.slug} label={config.cta.membershipLabel} emphasized />
                                    <PublicAccessCta
                                        eventId={event.id}
                                        eventSlug={event.slug}
                                        title={event.title}
                                        label={config.cta.purchaseLabel}
                                        requiresPayment={finalPrice > 0}
                                        buttonVariant="ghost"
                                        buttonClassName="h-12 w-full border border-[#6f5730] bg-transparent text-[#f2e7cf] hover:bg-[#20170f] hover:text-[#f5ecd9]"
                                    />
                                </>
                            )}
                        </div>

                        <div className="mt-6 space-y-3 text-sm text-stone-300">
                            <div className="flex items-start gap-3">
                                <Sparkles className="mt-0.5 h-4 w-4 text-[#c59a53]" />
                                <span>Precio publico actual: {finalPrice > 0 ? `$${finalPrice.toFixed(0)} MXN` : 'Incluido con membresia'}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Globe className="mt-0.5 h-4 w-4 text-[#c59a53]" />
                                <span>Acceso centralizado desde la landing del congreso y desde cada ficha individual.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative">
                <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:px-8 lg:grid-cols-[1fr_0.92fr]">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c59a53]">Preguntas frecuentes</p>
                        <h2 className="mt-3 font-serif text-4xl text-[#f5ecd9]">Todo queda resuelto desde la misma URL del congreso</h2>
                        <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-300">
                            La landing vive como pagina paraguas y conserva el archivo historico del congreso incluso despues de mayo.
                        </p>
                    </div>

                    <FaqList items={config.faq} />
                </div>
            </section>

            {!hasAccess && (
                <div className="fixed inset-x-0 bottom-0 z-50 p-4 lg:hidden">
                    <div className="mx-auto max-w-md border border-[#5c4526] bg-[#0c0906]/96 p-3 shadow-2xl backdrop-blur">
                        <div className="space-y-3">
                            <MembershipCta eventSlug={event.slug} label={config.cta.membershipLabel} emphasized />
                            <PublicAccessCta
                                eventId={event.id}
                                eventSlug={event.slug}
                                title={event.title}
                                label={config.cta.purchaseLabel}
                                requiresPayment={finalPrice > 0}
                                buttonVariant="ghost"
                                buttonClassName="h-11 w-full border border-[#6f5730] bg-transparent text-[#f2e7cf] hover:bg-[#20170f] hover:text-[#f5ecd9]"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

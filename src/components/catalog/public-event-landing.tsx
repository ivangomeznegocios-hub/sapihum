import Link from 'next/link'
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

function buildFaq(event: any) {
    const items = [
        {
            question: 'Como funciona el acceso despues de registrarme o comprar?',
            answer: 'Recibiras acceso al hub privado del activo. Desde ahi podras entrar al vivo, ver materiales y recuperar tu acceso con tu correo.',
        },
        {
            question: 'Necesito una cuenta completa para entrar?',
            answer: 'No. Puedes empezar con acceso ligero por correo y despues completar tu cuenta solo si quieres comunidad, networking o historial ampliado.',
        },
    ]

    if (event.recording_url || event.event_type === 'on_demand') {
        items.push({
            question: 'La grabacion queda disponible despues?',
            answer: event.recording_expires_at
                ? `Si. La ventana actual termina el ${new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(event.recording_expires_at))}.`
                : 'Si. La grabacion queda disponible mientras tu acceso siga activo.',
        })
    }

    if (Number(event.price || 0) > 0) {
        items.push({
            question: 'Que obtengo si ya soy miembro?',
            answer: getEventMemberAccessMessage(event).note || 'La membresia puede incluir acceso o precio preferencial segun la oferta de este activo.',
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
        base.offers = {
            '@type': 'Offer',
            price: Number(event.price || 0),
            priceCurrency: 'MXN',
            availability: 'https://schema.org/InStock',
        }
    }

    if (schemaType === 'Course') {
        base.provider = {
            '@type': 'Organization',
            name: 'Comunidad de Psicologia',
        }
        base.educationalCredentialAwarded = 'Formacion continua'
    }

    if (schemaType === 'Product') {
        base.offers = {
            '@type': 'Offer',
            price: Number(event.price || 0),
            priceCurrency: 'MXN',
            availability: 'https://schema.org/InStock',
        }
    }

    return JSON.stringify(base)
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

    return (
        <div className="space-y-12 pb-16">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildStructuredData(event) }} />

            <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/10 via-background to-amber-50/50">
                <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.2fr)_380px] lg:px-10 lg:py-10">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge>{publicCategory}</Badge>
                            {event.hero_badge ? <Badge variant="secondary">{event.hero_badge}</Badge> : null}
                            {event.member_access_type === 'free' && Number(event.price || 0) > 0 ? (
                                <Badge variant="outline">Incluido para miembros</Badge>
                            ) : null}
                        </div>

                        <div className="space-y-4">
                            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">{event.title}</h1>
                            {event.subtitle ? (
                                <p className="max-w-3xl text-lg text-muted-foreground sm:text-xl">{event.subtitle}</p>
                            ) : null}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-2xl border bg-background/75 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fecha</p>
                                <p className="mt-2 text-sm font-medium">{formatEventDate(event.start_time)}</p>
                            </div>
                            <div className="rounded-2xl border bg-background/75 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Formato</p>
                                <p className="mt-2 text-sm font-medium">
                                    {event.event_type === 'course' ? 'Curso / cohorte' : event.event_type === 'on_demand' ? 'On demand' : 'Evento en vivo'}
                                </p>
                            </div>
                            <div className="rounded-2xl border bg-background/75 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Audiencia</p>
                                <p className="mt-2 text-sm font-medium">
                                    {Array.isArray(event.target_audience) && event.target_audience.length > 0
                                        ? event.target_audience.join(', ')
                                        : 'Publico general'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card className="border-border/70 bg-background/90 shadow-xl">
                        <CardHeader className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Acceso actual</p>
                                <CardTitle className="mt-1 text-3xl">
                                    {Number(event.price || 0) > 0 ? `$${Number(event.price).toFixed(2)} MXN` : 'Gratis'}
                                </CardTitle>
                            </div>
                            <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">{memberMessage.label}</p>
                                {memberMessage.note ? <p className="mt-2">{memberMessage.note}</p> : null}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <PublicAccessCta
                                eventId={event.id}
                                eventSlug={event.slug}
                                title={event.title}
                                label={ctaLabel}
                                requiresPayment={requiresPayment}
                            />
                            <p className="text-xs text-muted-foreground">
                                Si ya compraste o te registraste, recupera tu acceso en{' '}
                                <Link href="/compras/recuperar" className="font-medium text-foreground underline-offset-4 hover:underline">
                                    compras/recuperar
                                </Link>.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen del activo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            {event.description ? (
                                event.description.split('\n').map((paragraph: string, index: number) => (
                                    <p key={index}>{paragraph}</p>
                                ))
                            ) : (
                                <p>Este activo funciona como una landing canónica de ventas, detalle y acceso para la comunidad.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Que vas a encontrar aqui</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border p-4">
                                    <p className="font-medium">Promesa principal</p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Una pagina propia, indexable y compartible para convertir este activo en un punto de captacion, exposicion y ventas.
                                    </p>
                                </div>
                                <div className="rounded-2xl border p-4">
                                    <p className="font-medium">Seguimiento</p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Acceso ligero por correo, recuperacion de compras y transicion opcional a cuenta completa cuando haya valor real.
                                    </p>
                                </div>
                                <div className="rounded-2xl border p-4">
                                    <p className="font-medium">Entrega</p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        El consumo vive en un hub privado separado para no mezclar SEO, ventas y acceso operativo en la misma pantalla.
                                    </p>
                                </div>
                                <div className="rounded-2xl border p-4">
                                    <p className="font-medium">Monetizacion</p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Compra individual, beneficios para miembros y capacidad de seguir vendiendo replays o cohortes sin perder claridad.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {event.speakers?.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Ponentes</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                {event.speakers.map((item: any) => (
                                    <div key={item.id} className="rounded-2xl border p-4">
                                        <p className="font-medium">{item.speaker?.profile?.full_name || 'Ponente'}</p>
                                        {item.speaker?.headline ? (
                                            <p className="mt-2 text-sm text-muted-foreground">{item.speaker.headline}</p>
                                        ) : null}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : null}

                    <Card>
                        <CardHeader>
                            <CardTitle>Preguntas frecuentes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {faqItems.map((item) => (
                                <div key={item.question} className="rounded-2xl border p-4">
                                    <p className="font-medium">{item.question}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Para miembros</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>La membresia no sustituye el catalogo. Lo potencia con ahorro acumulado, acceso preferencial y continuidad.</p>
                            <ul className="space-y-2">
                                <li>Acceso incluido o precio preferencial segun oferta</li>
                                <li>Biblioteca privada y replays recurrentes</li>
                                <li>Comunidad y networking como siguiente capa de valor</li>
                            </ul>
                            <Link href="/membresia" className="inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline">
                                Ver membresia
                            </Link>
                        </CardContent>
                    </Card>

                    {relatedEvents.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Relacionados</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {relatedEvents.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={getPublicEventPath(item)}
                                        className="block rounded-2xl border p-4 transition-colors hover:bg-muted/40"
                                    >
                                        <p className="font-medium">{item.title}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.subtitle || item.description || 'Explora otro activo de la plataforma'}
                                        </p>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </section>
        </div>
    )
}

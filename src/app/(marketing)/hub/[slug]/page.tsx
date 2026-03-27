import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VideoPlayer } from '@/components/ui/video-player'
import { AddToCalendarButton } from '@/components/add-to-calendar'
import { InteractiveToolViewer } from '@/components/interactive-tool-viewer'
import { getPublicEventBySlug } from '@/lib/supabase/queries/events'
import { userHasEventHubAccess } from '@/lib/supabase/queries/event-entitlements'
import { getResourcesByEvent } from '@/lib/supabase/queries/resources'
import { createClient } from '@/lib/supabase/server'
import { getActiveEntitlementForEvent } from '@/lib/events/access'
import {
    ArrowLeft,
    Calendar,
    Clock,
    ExternalLink,
    Lock,
    Play,
    ShieldCheck,
    Video,
} from 'lucide-react'

export const metadata = {
    title: 'Hub privado | Comunidad Psicología',
    robots: {
        index: false,
        follow: false,
    },
}

interface PageProps {
    params: Promise<{ slug: string }>
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default async function EventHubPage({ params }: PageProps) {
    const { slug } = await params
    const event = await getPublicEventBySlug(slug)

    if (!event) {
        notFound()
    }

    const access = await userHasEventHubAccess(event)

    if (!access.profile) {
        redirect(`/compras/recuperar?next=${encodeURIComponent(`/hub/${slug}`)}`)
    }

    if (!access.canAccess) {
        return (
            <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader className="space-y-3 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                            <Lock className="h-6 w-6" />
                        </div>
                        <CardTitle>No encontramos un acceso activo para este hub</CardTitle>
                        <CardDescription>
                            Si compraste o te registraste con otro correo, recupera tu acceso desde el email correcto o vuelve a la
                            página pública para revisar la oferta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button asChild>
                            <Link href={`/compras/recuperar?next=${encodeURIComponent(`/hub/${slug}`)}`}>Recuperar acceso por correo</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={`/${event.public_kind}/${event.slug}`}>Volver a la página pública</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        )
    }

    const eventResources = await getResourcesByEvent(event.id)
    const supabase = await createClient()
    const now = new Date()
    const eventDate = new Date(event.start_time)
    const eventEndDate = event.end_time ? new Date(event.end_time) : new Date(eventDate.getTime() + 2 * 60 * 60000)
    const isSameDay = now.toDateString() === eventDate.toDateString()
    const isEventTime = now >= new Date(eventDate.getTime() - 30 * 60000) && now <= eventEndDate
    const canSeeMeetingLink = Boolean(event.meeting_link) && event.status !== 'completed' && (isSameDay || isEventTime)
    const replayEntitlement = access.profile
        ? await getActiveEntitlementForEvent({
            supabase,
            eventId: event.id,
            userId: access.profile.id,
            email: access.profile.email,
            allowedAccessKinds: ['replay_access'],
        })
        : null
    const canSeeRecording = Boolean(event.recording_url) && event.status === 'completed' && (
        !event.recording_expires_at || new Date(event.recording_expires_at) > now
    ) && (
        Boolean(replayEntitlement) || event.event_type === 'on_demand'
    )

    return (
        <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <Link href="/mi-acceso" className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a mis accesos
                    </Link>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Hub privado
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
                    {event.subtitle && <p className="max-w-3xl text-muted-foreground">{event.subtitle}</p>}
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                    <Button asChild variant="outline">
                        <Link href={`/${event.public_kind}/${event.slug}`}>
                            Ver página pública
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    {event.status === 'upcoming' && <AddToCalendarButton event={event} className="w-full sm:w-auto" />}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr,0.9fr]">
                <div className="space-y-6">
                    {event.image_url && (
                        <div className="overflow-hidden rounded-2xl border bg-muted">
                            <img src={event.image_url} alt={event.title} className="aspect-[16/9] w-full object-cover" />
                        </div>
                    )}

                    {canSeeMeetingLink && (
                        <Card className="border-emerald-500/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-emerald-700">
                                    <Video className="h-5 w-5" />
                                    Tu enlace de acceso en vivo
                                </CardTitle>
                                <CardDescription>
                                    La sala se habilita en la ventana de acceso. Usa este botón para entrar directamente a la sesión.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild size="lg">
                                    <a href={event.meeting_link} target="_blank" rel="noopener noreferrer">
                                        Unirme ahora
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {canSeeRecording && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Play className="h-5 w-5 text-primary" />
                                    Grabación disponible
                                </CardTitle>
                                {event.recording_expires_at && (
                                    <CardDescription>
                                        Disponible hasta el {new Date(event.recording_expires_at).toLocaleDateString('es-MX')}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <VideoPlayer src={event.recording_url} title={event.title} poster={event.image_url} />
                            </CardContent>
                        </Card>
                    )}

                    {event.status === 'completed' && !event.recording_url && (
                        <Card className="border-amber-500/30">
                            <CardContent className="flex items-start gap-3 pt-6">
                                <Video className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                                <div>
                                    <p className="font-medium text-amber-800">Grabación en proceso</p>
                                    <p className="text-sm text-amber-700/90">
                                        Todavía no publicamos el replay. Si este activo incluye grabación, aparecerá aquí automáticamente.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {eventResources.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Materiales y recursos</CardTitle>
                                <CardDescription>Todo lo que forma parte de este activo vive dentro del hub privado.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {eventResources.map((resource) => {
                                    const eventResource = resource.event_resource
                                    const isLocked = eventResource?.is_locked && new Date(event.start_time) > now
                                    const isInteractiveTool = resource.type === 'tool' && (resource as any).html_content

                                    return (
                                        <div key={resource.id} className="space-y-3 rounded-xl border p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="font-medium">{resource.title}</h3>
                                                    {resource.description && (
                                                        <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>
                                                    )}
                                                </div>
                                                {isLocked ? (
                                                    <Badge variant="outline">Se abre al iniciar</Badge>
                                                ) : (
                                                    <Badge variant="secondary">{resource.type}</Badge>
                                                )}
                                            </div>

                                            {!isLocked && !isInteractiveTool && resource.url && (
                                                <Button asChild variant="outline" size="sm">
                                                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                        Abrir recurso
                                                        <ExternalLink className="ml-2 h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}

                                            {!isLocked && isInteractiveTool && (
                                                <InteractiveToolViewer
                                                    htmlContent={(resource as any).html_content}
                                                    title={resource.title}
                                                    height="480px"
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen del activo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Fecha</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(event.start_time)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Horario</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatTime(event.start_time)}
                                        {event.end_time ? ` - ${formatTime(event.end_time)}` : ''}
                                    </p>
                                </div>
                            </div>
                            {event.description && (
                                <div className="rounded-xl border p-4">
                                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{event.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

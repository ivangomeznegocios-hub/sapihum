import Image from 'next/image'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VideoPlayer } from '@/components/ui/video-player'
import { ShareEventButton } from '../share-button'
import { getEventSpeakers } from '@/lib/supabase/queries/speakers'
import { getResourcesByEvent } from '@/lib/supabase/queries/resources'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { EventRegistrationButton, EditEventButton, DeleteEventButton, DuplicateEventButton } from '../event-forms'
import { CheckoutButton } from '@/components/payments/CheckoutButton'
import { AddToCalendarButton } from '@/components/add-to-calendar'
import { InteractiveToolViewer } from '@/components/interactive-tool-viewer'
import { getActiveEntitlementForEvent } from '@/lib/events/access'
import { getUniqueEventAccessCount } from '@/lib/events/attendance'
import { getEventEditorAccessForUser } from '@/lib/events/permissions'
import {
    getEffectiveEventPriceForProfile,
    getEventMemberAccessMessage,
    isPurchasableRecordingEvent,
    normalizeMemberAccessType,
} from '@/lib/events/pricing'
import { audienceAllowsAccess, getCommercialAccessContext, isCommunityReadOnlyViewer } from '@/lib/access/commercial'
import { getSpecializationByCode } from '@/lib/specializations'
import {
    Calendar,
    Clock,
    Users,
    ArrowLeft,
    Video,
    ExternalLink,
    Lock,
    Play,
    Share2,
    ClipboardList
} from 'lucide-react'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    const commercialAccess = await getCommercialAccessContext({
        supabase,
        userId: profile.id,
        profile,
    })
    const isReadOnly = isCommunityReadOnlyViewer(commercialAccess)

    // Get event details
    const { data: eventData, error } = await supabase
        .from('events' as any)
        .select('*')
        .eq('id', id)
        .single()

    const event = eventData as any

    if (!event || error) {
        notFound()
    }

    // Check if user is registered
    const { data: registrationData } = await supabase
        .from('event_registrations' as any)
        .select('id, status')
        .eq('event_id', id)
        .eq('user_id', profile.id)
        .single()

    const registration = registrationData as any

    const isRegistered = registration?.status === 'registered'

    const { canManageEvent, canEditEvent } = await getEventEditorAccessForUser({
        supabase,
        eventId: id,
        userId: profile.id,
        role: profile.role,
        createdBy: event.created_by,
    })

    const accessEntitlement = canEditEvent
        ? null
        : await getActiveEntitlementForEvent({
            supabase,
            eventId: id,
            userId: profile.id,
            email: profile.email,
            eventType: event.event_type,
        })

    const replayEntitlement = canEditEvent
        ? null
        : await getActiveEntitlementForEvent({
            supabase,
            eventId: id,
            userId: profile.id,
            email: profile.email,
            allowedAccessKinds: ['replay_access'],
        })

    const canReachOffer = commercialAccess
        ? audienceAllowsAccess(event.target_audience, commercialAccess, { creatorId: event.created_by })
        : false

    if (!canEditEvent && !canReachOffer && !isRegistered && !accessEntitlement) {
        return (
            <div className="space-y-8">
                <Link
                    href="/dashboard/events"
                    className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a eventos
                </Link>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <h3 className="text-lg font-medium mb-2">Acceso restringido</h3>
                        <p className="text-muted-foreground text-sm max-w-md">
                            Este evento no esta disponible para tu perfil actual.
                        </p>
                        {profile.role === 'psychologist' ? (
                            <div className="mt-4">
                                <Button asChild>
                                    <Link href="/precios">Ver membresia</Link>
                                </Button>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        )
    }

    const attendeeCount = await getUniqueEventAccessCount(supabase, id)
    const hasEventAccess = canEditEvent || isRegistered || Boolean(accessEntitlement)

    // Get all registrations with user info (for admins/creators only)
    let allRegistrations: any[] = []
    if (canManageEvent) {
        const { data: regsData } = await supabase
            .from('event_registrations' as any)
            .select(`
                id,
                user_id,
                status,
                registration_data,
                registered_at,
                profiles:user_id (id, full_name, avatar_url)
            `)
            .eq('event_id', id)
            .eq('status', 'registered')
            .order('registered_at', { ascending: false })
        allRegistrations = (regsData || []) as any[]
    }

    // Calculate effective price for user
    let currentPrice = event.price || 0
    let needsToPay = false
    const recordingProductAvailable = isPurchasableRecordingEvent(event)

    if (!hasEventAccess && !canManageEvent) {
        currentPrice = getEffectiveEventPriceForProfile(
            {
                price: event.price,
                member_price: event.member_price,
                member_access_type: normalizeMemberAccessType(event.member_access_type),
                specialization_code: event.specialization_code,
            },
            {
                role: commercialAccess?.role ?? profile.role,
                membershipLevel: commercialAccess?.membershipLevel ?? 0,
                hasActiveMembership: commercialAccess?.hasActiveMembership ?? false,
                membershipSpecializationCode: commercialAccess?.membershipSpecializationCode ?? null,
            }
        )

        if (profile.role !== 'admin' && currentPrice > 0) {
            needsToPay = true
        }
    }

    // Get event speakers
    const eventSpeakers = await getEventSpeakers(id)

    // Get linked resources
    const eventResources = await getResourcesByEvent(id)
    const directMaterialLinks = Array.isArray(event.material_links)
        ? event.material_links.filter((item: any) => item?.title && item?.url)
        : []

    // Check if user can see meeting link
    const now = new Date()
    const eventDate = new Date(event.start_time)
    const eventEndDate = event.end_time ? new Date(event.end_time) : new Date(eventDate.getTime() + 2 * 60 * 60000) // 2 hours after start
    const hubPath = `/hub/${event.slug}`

    // Meeting link visible: same day, user has access, event not completed
    const isSameDay = now.toDateString() === eventDate.toDateString()
    const isEventTime = now >= new Date(eventDate.getTime() - 30 * 60000) && now <= eventEndDate // 30 min before to end
    const canSeeMeetingLink = event.meeting_link && hasEventAccess && (isSameDay || isEventTime) && event.status !== 'completed'

    // Check if user can see recording while access is still active
    const canSeeRecording = Boolean(event.recording_url) && event.status === 'completed' && (
        (!event.recording_expires_at || new Date(event.recording_expires_at) > now) &&
        (canEditEvent || Boolean(replayEntitlement) || (event.event_type === 'on_demand' && Boolean(accessEntitlement)))
    )

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'live': return 'En Vivo'
            case 'on_demand': return 'Grabado'
            case 'course': return 'Curso'
            case 'webinar': return 'Webinar'
            case 'workshop': return 'Taller'
            case 'group': return 'Sesión Grupal'
            default: return type
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-brand-yellow text-brand-yellow'
            case 'live': return 'surface-alert-success animate-pulse'
            case 'completed': return 'bg-gray-100 text-gray-800'
            case 'cancelled': return 'surface-alert-error'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getAudienceLabels = (audience: string[]) => {
        const labels: Record<string, string> = {
            'public': 'Público',
            'members': 'Miembros',
            'psychologists': 'Psicólogos',
            'patients': 'Pacientes',
            'active_patients': 'Pacientes Activos'
        }
        return audience?.map(a => labels[a] || a).join(', ') || 'Público'
    }

    const eventSpecialization = getSpecializationByCode(event.specialization_code)

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    href="/dashboard/events"
                    className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a eventos
                </Link>

                {canEditEvent && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                        <EditEventButton event={event} userRole={profile.role || ''} />
                        {canManageEvent && <DuplicateEventButton eventId={event.id} />}
                        {canManageEvent && <DeleteEventButton eventId={event.id} />}
                    </div>
                )}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Event Image */}
                    {event.image_url && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                            <Image
                                src={event.image_url}
                                alt={event.title}
                                fill
                                unoptimized
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 66vw"
                            />
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(event.status)}`}>
                                            {event.status === 'upcoming' ? 'Próximo' :
                                                event.status === 'live' ? '🔴 En vivo' :
                                                    event.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                                        </span>
                                        {event.is_members_only && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-brand-yellow text-brand-yellow flex items-center gap-1">
                                                <Lock className="h-3 w-3" />
                                                Solo Miembros
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="text-2xl">
                                        {event.title}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Event Details Grid */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Fecha</p>
                                        <p className="font-medium">{formatDate(event.start_time)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Hora</p>
                                        <p className="font-medium">
                                            {formatTime(event.start_time)}
                                            {event.end_time && ` - ${formatTime(event.end_time)}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <Video className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tipo</p>
                                        <p className="font-medium">{getTypeLabel(event.event_type || event.type)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Asistentes</p>
                                        <p className="font-medium">
                                            {attendeeCount || 0}
                                            {event.max_attendees && ` / ${event.max_attendees}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Meeting Link Section - ONLY VISIBLE DAY OF EVENT */}
                            {canSeeMeetingLink && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                        <Video className="h-5 w-5" />
                                        Enlace de la Reunión
                                    </h3>
                                    <p className="text-sm text-green-700 mb-3">
                                        ¡El evento está por comenzar! Haz clic para unirte:
                                    </p>
                                    <a
                                        href={event.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Unirse a la reunión
                                    </a>
                                </div>
                            )}

                            {/* Recording Section - Embedded Video Player */}
                            {canSeeRecording && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Play className="h-5 w-5 text-brand-brown" />
                                            Grabación del Evento
                                        </h3>
                                        {event.recording_expires_at && (
                                            <span className="text-xs px-2 py-1 bg-brand-brown text-brand-brown rounded-full">
                                                Disponible hasta: {formatDate(event.recording_expires_at)}
                                            </span>
                                        )}
                                    </div>
                                    <VideoPlayer
                                        src={event.recording_url}
                                        title={event.title}
                                        poster={event.image_url}
                                    />
                                </div>
                            )}

                            {/* Recording pending message */}
                            {event.status === 'completed' && !event.recording_url && hasEventAccess && (
                                <div className="p-4 bg-brand-yellow dark:bg-brand-yellow/30 border border-brand-yellow dark:border-brand-yellow rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Video className="h-5 w-5 text-brand-yellow flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-brand-yellow dark:text-brand-yellow">
                                                Grabación en proceso
                                            </p>
                                            <p className="text-sm text-brand-yellow dark:text-brand-yellow mt-1">
                                                La grabación estará disponible en un plazo de hasta 24 horas.
                                                Te notificaremos cuando esté lista.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {event.description && (
                                <div>
                                    <h3 className="font-semibold mb-2">Descripción</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {event.description}
                                    </p>
                                </div>
                            )}

                            {(canManageEvent || hasEventAccess) && directMaterialLinks.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3">Materiales por enlace</h3>
                                    <div className="space-y-3">
                                        {directMaterialLinks.map((item: any) => (
                                            <div key={item.id || item.url} className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-medium">{item.title}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {item.type === 'presentation' ? 'Presentacion' :
                                                            item.type === 'document' ? 'Documento' :
                                                                item.type === 'folder' ? 'Carpeta' :
                                                                    item.type === 'download' ? 'Descarga' : 'Enlace externo'}
                                                    </p>
                                                </div>
                                                <Button asChild variant="secondary" size="sm">
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                        Abrir
                                                        <ExternalLink className="h-3 w-3 ml-1" />
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Audience */}
                            {event.target_audience && (
                                <div>
                                    <h3 className="font-semibold mb-2">Audiencia</h3>
                                    <p className="text-muted-foreground">
                                        {getAudienceLabels(event.target_audience)}
                                    </p>
                                </div>
                            )}

                            {/* Speakers */}
                            {eventSpeakers.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3">Ponentes</h3>
                                    <div className="space-y-3">
                                        {eventSpeakers.map((es) => (
                                            <Link key={es.id} href={`/dashboard/speakers/${es.speaker_id}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                <div className="relative w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                                                    {(es.speaker as any)?.photo_url ? (
                                                        <Image
                                                            src={(es.speaker as any).photo_url}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                            sizes="40px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary/50">
                                                            {(es.speaker as any)?.profile?.full_name?.charAt(0) || 'P'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{(es.speaker as any)?.profile?.full_name || 'Ponente'}</p>
                                                    {(es.speaker as any)?.headline && (
                                                        <p className="text-xs text-muted-foreground">{(es.speaker as any).headline}</p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Linked Resources / Materials */}
                            {eventResources.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                        </svg>
                                        Materiales del Evento
                                    </h3>
                                    <div className="space-y-4">
                                        {eventResources.map((resource) => {
                                            const er = resource.event_resource
                                            const isLocked = er?.is_locked && new Date(event.start_time) > now
                                            const isInteractiveTool = resource.type === 'tool' && (resource as any).html_content
                                            const typeLabels: Record<string, string> = {
                                                pdf: 'PDF', video: 'Video', audio: 'Audio',
                                                link: 'Enlace', document: 'Documento', tool: 'Herramienta'
                                            }

                                            return (
                                                <div key={resource.id} className="space-y-2">
                                                    <div
                                                        className={`flex items-center justify-between p-3 rounded-lg border ${
                                                            isLocked ? 'bg-muted/50 opacity-75' : 'hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {isLocked ? (
                                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                                            ) : isInteractiveTool ? (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-yellow">
                                                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                                                </svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                                    <polyline points="14 2 14 8 20 8" />
                                                                </svg>
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium">{resource.title}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {typeLabels[resource.type] || resource.type}
                                                                    {isInteractiveTool && ' — Interactiva'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {isLocked ? (
                                                            <Badge variant="outline" className="text-[10px] gap-1">
                                                                <Lock className="h-3 w-3" />
                                                                Disponible al iniciar
                                                            </Badge>
                                                        ) : hasEventAccess ? (
                                                            !isInteractiveTool && (
                                                                <Button asChild size="sm" variant="secondary">
                                                                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                                        Abrir
                                                                        <ExternalLink className="h-3 w-3 ml-1" />
                                                                    </a>
                                                                </Button>
                                                            )
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px]">
                                                                Obtén acceso para abrirlo
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Render interactive tool inline for users with access */}
                                                    {isInteractiveTool && !isLocked && hasEventAccess && (
                                                        <InteractiveToolViewer
                                                            htmlContent={(resource as any).html_content}
                                                            title={resource.title}
                                                            height="500px"
                                                        />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Registration Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Registro</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {event.status === 'cancelled' ? (
                                <p className="text-center text-muted-foreground">
                                    Este evento ha sido cancelado
                                </p>
                            ) : event.status === 'completed' ? (
                                <div className="text-center">
                                    <p className="text-muted-foreground mb-2">
                                        Este evento ya finalizó
                                    </p>
                                    {canSeeRecording && (
                                        <p className="text-sm text-brand-brown">
                                            ¡Grabación disponible arriba!
                                        </p>
                                    )}
                                    {hasEventAccess && (
                                        <div className="mt-3">
                                            <Button asChild className="w-full">
                                                <Link href={hubPath}>Abrir hub privado</Link>
                                            </Button>
                                        </div>
                                    )}
                                    {!canSeeRecording && recordingProductAvailable && event.price > 0 && (
                                        <div className="mt-3">
                                            <CheckoutButton
                                                purchaseType="event_purchase"
                                                eventId={event.id}
                                                className="w-full"
                                                label="Comprar grabacion"
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : hasEventAccess ? (
                                <>
                                    <div className="rounded-lg border border-brand-brown bg-brand-brown p-3 text-center text-sm text-brand-brown">
                                        Ya tienes acceso activo a este contenido.
                                    </div>
                                    <Button asChild className="w-full">
                                        <Link href={hubPath}>Abrir hub privado</Link>
                                    </Button>
                                    {event.status === 'upcoming' && (
                                        <div className="mt-3">
                                            <AddToCalendarButton event={event} className="w-full" />
                                        </div>
                                    )}
                                </>
                            ) : isReadOnly ? (
                                <>
                                    <div className="text-center mb-4">
                                        <span className="text-2xl font-bold text-green-600">
                                            Acceso individual disponible
                                        </span>
                                    </div>
                                    {event.price > 0 && (
                                        <div className="mb-3">
                                            <CheckoutButton
                                                purchaseType="event_purchase"
                                                eventId={event.id}
                                                className="w-full"
                                                label={recordingProductAvailable ? 'Comprar grabacion' : 'Comprar acceso'}
                                            />
                                        </div>
                                    )}
                                    <Button asChild variant="outline" className="w-full bg-primary/5 hover:bg-primary/10 border-primary/20">
                                        <Link href="/dashboard/subscription">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                            Actualizar Membresía para Participar
                                        </Link>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="text-center mb-4">
                                        <span className="text-2xl font-bold text-green-600">
                                            {currentPrice > 0 ? `$${currentPrice} MXN` : 'Gratis'}
                                        </span>
                                    </div>
                                    {needsToPay ? (
                                        <CheckoutButton 
                                            purchaseType="event_purchase"
                                            eventId={event.id}
                                            className="w-full"
                                            label="Comprar Acceso"
                                        />
                                    ) : (
                                        <EventRegistrationButton
                                            event={event}
                                            isRegistered={isRegistered}
                                        />
                                    )}
                                    {hasEventAccess && event.status === 'upcoming' && (
                                        <div className="mt-3">
                                            <AddToCalendarButton event={event} className="w-full" />
                                        </div>
                                    )}
                                    {!hasEventAccess && event.meeting_link && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            El enlace de la reunión estará disponible el día del evento
                                        </p>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Share Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Share2 className="h-4 w-4" />
                                Compartir
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Dual pricing display */}
                            {eventSpecialization && event.price > 0 && (
                                <div className="p-2 bg-brand-brown/10 rounded-lg border border-brand-brown/20 text-center">
                                    <p className="text-sm font-medium text-brand-brown">
                                        Incluido en {eventSpecialization.name} Nivel 2+
                                    </p>
                                </div>
                            )}
                            {!eventSpecialization && normalizeMemberAccessType(event.member_access_type) === 'free' && event.price > 0 && (
                                <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 text-center">
                                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                        ✨ Gratis para miembros
                                    </p>
                                </div>
                            )}
                            {!eventSpecialization && normalizeMemberAccessType(event.member_access_type) === 'discounted' && (
                                <div className="p-2 bg-brand-yellow dark:bg-brand-yellow rounded-lg border border-brand-yellow dark:border-brand-yellow text-center">
                                    <p className="text-sm font-medium text-brand-yellow dark:text-brand-yellow">
                                        ✨ Miembros: ${event.member_price?.toFixed(2)} MXN
                                    </p>
                                </div>
                            )}
                            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                                {getEventMemberAccessMessage(event).note || 'Compra individual disponible cuando el evento tiene precio.'}
                            </div>
                            <ShareEventButton
                                eventSlug={event.slug}
                                eventType={event.event_type}
                                eventStatus={event.status}
                                recordingUrl={event.recording_url}
                                eventTitle={event.title}
                                isEmbeddable={event.is_embeddable !== false}
                                speakerRef={eventSpeakers[0]?.speaker_id ? `speaker:${eventSpeakers[0].speaker_id}` : null}
                                campaignName={event.formation_track || event.slug}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Admin Section: Attendees List */}
            {canManageEvent && allRegistrations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Asistentes Registrados ({allRegistrations.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-3 font-medium">Nombre</th>
                                        <th className="text-left py-2 px-3 font-medium">Fecha Registro</th>
                                        {event.registration_fields?.map((field: any, i: number) => (
                                            <th key={i} className="text-left py-2 px-3 font-medium">{field.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allRegistrations.map((reg: any) => (
                                        <tr key={reg.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    {reg.profiles?.avatar_url ? (
                                                        <div className="relative h-6 w-6 overflow-hidden rounded-full">
                                                            <Image
                                                                src={reg.profiles.avatar_url}
                                                                alt=""
                                                                fill
                                                                className="object-cover"
                                                                sizes="24px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                                            {reg.profiles?.full_name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    <span>{reg.profiles?.full_name || 'Usuario'}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-muted-foreground">
                                                {new Date(reg.registered_at).toLocaleDateString('es-MX', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            {event.registration_fields?.map((field: any, i: number) => (
                                                <td key={i} className="py-2 px-3">
                                                    {reg.registration_data?.[field.label] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

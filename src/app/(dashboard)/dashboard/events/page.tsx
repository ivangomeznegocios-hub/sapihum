import Image from 'next/image'
import Link from 'next/link'
import { getEventsWithRegistration } from '@/lib/supabase/queries/events'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckoutButton } from '@/components/payments/CheckoutButton'
import { AddToCalendarButton } from '@/components/add-to-calendar'
import { RecordingCountdown } from './recordings/recording-countdown'
import { EventsCategoryNav } from './events-filter'
import type { EventWithRegistration } from '@/types/database'
import { isEventPast } from '@/lib/timezone'
import {
    getEffectiveEventPriceForProfile,
    getEventTypePurchaseLabel,
    isPurchasableRecordingEvent,
} from '@/lib/events/pricing'
import { getCommercialAccessContext, isCommunityReadOnlyViewer } from '@/lib/access/commercial'

// Helper to format date in Spanish
function formatEventDate(dateStr: string) {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit'
    }).format(date)
}

// Status badge component
function EventStatusBadge({ status }: { status: string }) {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
        draft: 'secondary' as any,
        upcoming: 'default',
        live: 'success',
        completed: 'secondary' as any,
        cancelled: 'destructive'
    }

    const labels: Record<string, string> = {
        draft: 'Borrador',
        upcoming: 'Próximo',
        live: 'En Vivo',
        completed: 'Finalizado',
        cancelled: 'Cancelado'
    }

    return (
        <Badge variant={variants[status] as any || 'default'}>
            {status === 'live' && (
                <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
            )}
            {labels[status] || status}
        </Badge>
    )
}

// Event card component
function EventCard({
    event,
    userId,
    commercialAccess,
    isReadOnly = false,
}: {
    event: EventWithRegistration
    userId?: string
    commercialAccess?: {
        role: string
        membershipLevel: number
        hasActiveMembership: boolean
        membershipSpecializationCode?: string | null
    }
    isReadOnly?: boolean
}) {
    const isRegistered = event.registration?.status === 'registered'
    const hasRecording = event.status === 'completed' && event.recording_url
    const isFull = event.max_attendees && (event.attendee_count || 0) >= event.max_attendees
    const isCreator = userId && event.created_by === userId
    const recordingProductAvailable = isPurchasableRecordingEvent(event)
    const effectivePrice = getEffectiveEventPriceForProfile(
        {
            price: event.price,
            member_price: event.member_price,
            member_access_type: event.member_access_type,
            specialization_code: event.specialization_code,
        },
        commercialAccess
    )

    // ──── READ-ONLY MODE (level 0 psychologists) ────
    if (isReadOnly) {
        return (
            <Card className="relative min-w-0 overflow-hidden opacity-75">
                <div className="block relative aspect-[16/9] bg-gradient-to-br from-primary/20 to-primary/5">
                    {event.image_url ? (
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary/30">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="m9 16 2 2 4-4" />
                            </svg>
                        </div>
                    )}
                    <div className="absolute top-3 left-3"><EventStatusBadge status={event.status} /></div>
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            Solo Miembros
                        </div>
                    </div>
                </div>
                <CardHeader className="min-w-0 space-y-1">
                    <CardTitle className="min-w-0 break-words line-clamp-2 text-muted-foreground">{event.title}</CardTitle>
                    <CardDescription className="min-w-0 flex items-start gap-2 break-words">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                        {formatEventDate(event.start_time)}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {event.description && <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>}
                    <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="min-w-0 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            {event.attendee_count || 0} inscritos{event.max_attendees && ` / ${event.max_attendees}`}
                        </span>
                        {effectivePrice > 0 ? <span className="font-semibold text-primary">${effectivePrice.toFixed(2)} MXN</span> : <span className="text-green-600 font-medium">Gratis</span>}
                    </div>
                    <div className="pt-3">
                        {recordingProductAvailable && effectivePrice > 0 ? (
                            <CheckoutButton
                                purchaseType="event_purchase"
                                eventId={event.id}
                                className="w-full"
                                label={`Comprar ${getEventTypePurchaseLabel(event.event_type)}` }
                            />
                        ) : (
                            <Button asChild variant="outline" className="w-full justify-center whitespace-normal text-center leading-snug">
                                <Link href="/dashboard/subscription">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    Hazte Miembro para Participar
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="min-w-0 overflow-hidden group transition-shadow hover:shadow-lg">
            {/* Event Image - Clickable */}
            <Link href={`/dashboard/events/${event.id}`} className="block relative aspect-[16/9] min-w-0 bg-gradient-to-br from-primary/20 to-primary/5">
                {event.image_url ? (
                    <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary/30"
                        >
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                            <path d="m9 16 2 2 4-4" />
                        </svg>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <EventStatusBadge status={event.status} />
                </div>

                {/* Members Badge */}
                {event.is_members_only && (
                    <div className="absolute top-3 right-3">
                        <Badge variant={"warning" as any} className="bg-brand-yellow/90">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-1"
                            >
                                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                                <path d="M8.5 8.5v.01" />
                                <path d="M16 15.5v.01" />
                                <path d="M12 12v.01" />
                                <path d="M11 17v.01" />
                                <path d="M7 14v.01" />
                            </svg>
                            Solo Miembros
                        </Badge>
                    </div>
                )}
            </Link>

            <CardHeader className="min-w-0 space-y-1">
                <Link href={`/dashboard/events/${event.id}`} className="hover:underline">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                    </CardTitle>
                </Link>
                <CardDescription className="min-w-0 flex items-start gap-2 break-words">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    {formatEventDate(event.start_time)}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Description */}
                {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                    </p>
                )}

                {/* Meta info */}
                <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="min-w-0 flex items-center gap-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {event.attendee_count || 0} inscritos
                        {event.max_attendees && ` / ${event.max_attendees}`}
                    </span>

                    {/* Views - Only for creator */}
                    {isCreator && (event as any).views > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-brand-brown text-brand-brown px-2 py-0.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            {(event as any).views}
                        </span>
                    )}

                    {effectivePrice > 0 ? (
                        <span className="shrink-0 font-semibold text-primary">
                            ${effectivePrice.toFixed(2)} MXN
                        </span>
                    ) : (
                        <span className="shrink-0 font-medium text-green-600">Gratis</span>
                    )}
                </div>

                {/* Action Button */}
                <div className="pt-2">
                    {isCreator ? (
                        <Button asChild variant="outline" className="w-full justify-center whitespace-normal text-center leading-snug">
                            <Link href={`/dashboard/events/${event.id}`}>
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
                                    className="mr-2"
                                >
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                                Gestionar Evento
                            </Link>
                        </Button>
                    ) : hasRecording && isRegistered ? (
                        <div className="space-y-2">
                            {/* Recording countdown if expires */}
                            {event.recording_expires_at && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Expira:</span>
                                    <RecordingCountdown expiresAt={event.recording_expires_at} />
                                </div>
                            )}
                            <Button asChild className="w-full justify-center whitespace-normal text-center leading-snug">
                                <Link href={`/dashboard/events/${event.id}`}>
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
                                        className="mr-2"
                                    >
                                        <polygon points="6 3 20 12 6 21 6 3" />
                                    </svg>
                                    Ver Grabación
                                </Link>
                            </Button>
                        </div>
                    ) : hasRecording && recordingProductAvailable && effectivePrice > 0 ? (
                        <CheckoutButton
                            purchaseType="event_purchase"
                            eventId={event.id}
                            className="w-full"
                            label={`Comprar ${getEventTypePurchaseLabel(event.event_type)}`}
                        />
                    ) : hasRecording ? (
                        <Button asChild variant="outline" className="w-full justify-center whitespace-normal text-center leading-snug">
                            <Link href={`/dashboard/events/${event.id}`}>
                                Ver detalles
                            </Link>
                        </Button>
                    ) : isRegistered ? (
                        <>
                            <Button asChild variant="secondary" className="w-full justify-center whitespace-normal text-center leading-snug">
                                <Link href={`/dashboard/events/${event.id}`}>
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
                                        className="mr-2"
                                    >
                                        <path d="M15 12h-5" />
                                        <path d="M15 8h-5" />
                                        <path d="M19 17V5a2 2 0 0 0-2-2H4" />
                                        <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v2a2 2 0 0 0 2 2Z" />
                                    </svg>
                                    Ir al Evento
                                </Link>
                            </Button>
                            <div className="mt-2">
                                <AddToCalendarButton event={event} className="w-full" />
                            </div>
                        </>
                    ) : isFull ? (
                        <Button variant="outline" className="w-full" disabled>
                            Cupo Lleno
                        </Button>
                    ) : event.status === 'cancelled' ? (
                        <Button variant="outline" className="w-full" disabled>
                            Cancelado
                        </Button>
                    ) : (
                        <Button asChild className="w-full justify-center whitespace-normal text-center leading-snug">
                            <Link href={`/dashboard/events/${event.id}`}>
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
                                    className="mr-2"
                                >
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" x2="19" y1="8" y2="14" />
                                    <line x1="22" x2="16" y1="11" y2="11" />
                                </svg>
                                Inscribirse
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card >
    )
}

export default async function EventsPage() {
    const events = await getEventsWithRegistration()
    const profile = await getUserProfile()
    const supabase = profile ? await createClient() : null
    const commercialAccess = profile && supabase
        ? await getCommercialAccessContext({
            supabase,
            userId: profile.id,
            profile,
        })
        : null

    const isPsychologist = profile?.role === 'psychologist'
    const isActiveMember = Boolean(
        commercialAccess?.hasActiveMembership ||
        profile?.role === 'admin' ||
        profile?.role === 'ponente'
    )
    const isReadOnly = commercialAccess
        ? isCommunityReadOnlyViewer(commercialAccess)
        : Boolean(isPsychologist)

    // Separate events by status AND date
    // Events with status 'upcoming' but start_time in the past should go to past section
    const drafts = events.filter(e => e.status === 'draft')
    const upcoming = events.filter(e => {
        if (e.status === 'completed' || e.status === 'draft' || e.status === 'cancelled') return false
        if (e.status === 'live') return true
        return !isEventPast(e.start_time)
    })
    const past = events.filter(e => {
        if (e.status === 'completed') return true
        if (e.status === 'draft' || e.status === 'cancelled') return false
        return e.status === 'upcoming' && isEventPast(e.start_time)
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Eventos y Talleres</h1>
                    <p className="text-muted-foreground">
                        Talleres en vivo y grabaciones exclusivas para la comunidad
                    </p>
                </div>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    {/* Admin Analytics Link */}
                    {profile?.role === 'admin' && (
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href="/dashboard/events/analytics">
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
                                    className="mr-2"
                                >
                                    <line x1="18" x2="18" y1="20" y2="10" />
                                    <line x1="12" x2="12" y1="20" y2="4" />
                                    <line x1="6" x2="6" y1="20" y2="14" />
                                </svg>
                                Estadísticas
                            </Link>
                        </Button>
                    )}
                    {/* Create Event Button (Admin + Ponente) */}
                    {(profile?.role === 'admin' || profile?.role === 'ponente') && (
                        <Button asChild className="w-full sm:w-auto">
                            <Link href="/dashboard/events/new">
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
                                    className="mr-2"
                                >
                                    <line x1="12" x2="12" y1="5" y2="19" />
                                    <line x1="5" x2="19" y1="12" y2="12" />
                                </svg>
                                Crear Evento
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Category Filter Tabs */}
            <EventsCategoryNav />

            {/* Membership Banner - only for psychologists without paid plan */}
            {isPsychologist && !isActiveMember && (
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-primary"
                                >
                                    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                                    <path d="M8.5 8.5v.01" />
                                    <path d="M16 15.5v.01" />
                                    <path d="M12 12v.01" />
                                    <path d="M11 17v.01" />
                                    <path d="M7 14v.01" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium">Acceso Completo con Membresía</p>
                                <p className="text-sm text-muted-foreground">
                                    Obtén acceso a todas las grabaciones y eventos exclusivos
                                </p>
                            </div>
                        </div>
                        <Button asChild className="w-full sm:w-auto">
                            <Link href="/precios">Ver Planes</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Draft Events */}
            {drafts.length > 0 && (
                <section>
                    <h2 className="mb-4 flex min-w-0 items-center gap-2 text-xl font-semibold">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground"
                        >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Borradores Pendientes
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {drafts.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                userId={profile?.id}
                                commercialAccess={commercialAccess ? {
                                    role: commercialAccess.role,
                                    membershipLevel: commercialAccess.membershipLevel,
                                    hasActiveMembership: commercialAccess.hasActiveMembership,
                                } : undefined}
                                isReadOnly={isReadOnly}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Upcoming Events */}
            {upcoming.length > 0 && (
                <section>
                    <h2 className="mb-6 flex min-w-0 items-center gap-2 text-2xl font-bold tracking-tight">
                        <div className="flex items-center justify-center p-2 rounded-xl bg-brand-yellow/10 text-brand-yellow dark:text-brand-yellow">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                <line x1="16" x2="16" y1="2" y2="6" />
                                <line x1="8" x2="8" y1="2" y2="6" />
                                <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                        </div>
                        Próximos Eventos en Vivo
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {upcoming.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                userId={profile?.id}
                                commercialAccess={commercialAccess ? {
                                    role: commercialAccess.role,
                                    membershipLevel: commercialAccess.membershipLevel,
                                    hasActiveMembership: commercialAccess.hasActiveMembership,
                                } : undefined}
                                isReadOnly={isReadOnly}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Past Events / Recordings Library */}
            {past.length > 0 && (
                <section className="mt-12 pt-10 border-t border-border/50">
                    <div className="mb-6 space-y-1">
                        <h2 className="flex min-w-0 items-center gap-2 text-2xl font-bold tracking-tight">
                            <div className="flex items-center justify-center p-2 rounded-xl bg-brand-brown/10 text-brand-brown dark:text-brand-brown">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="6 3 20 12 6 21 6 3" />
                                </svg>
                            </div>
                            Biblioteca de Grabaciones
                        </h2>
                        <p className="text-muted-foreground ml-12 text-sm">
                            Eventos anteriores a los que tienes acceso o que puedes adquirir.
                        </p>
                    </div>
                    
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {past.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                userId={profile?.id}
                                commercialAccess={commercialAccess ? {
                                    role: commercialAccess.role,
                                    membershipLevel: commercialAccess.membershipLevel,
                                    hasActiveMembership: commercialAccess.hasActiveMembership,
                                } : undefined}
                                isReadOnly={isReadOnly}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {events.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground mb-4"
                        >
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <h3 className="text-lg font-medium mb-1">No hay eventos programados</h3>
                        <p className="text-sm text-muted-foreground">
                            Pronto agregaremos nuevos talleres y eventos
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

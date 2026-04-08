import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddToCalendarButton } from '@/components/add-to-calendar'
import type { EventWithRegistration } from '@/types/database'

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

function EventStatusBadge({ status }: { status: string }) {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
        upcoming: 'default',
        live: 'success',
        completed: 'secondary' as any,
        cancelled: 'destructive'
    }

    const labels: Record<string, string> = {
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

const CATEGORY_BADGES: Record<string, { label: string; className: string }> = {
    networking: { label: 'Networking', className: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow' },
    clinical: { label: 'Clínico', className: 'bg-brand-brown text-brand-brown dark:bg-brand-brown/30 dark:text-brand-brown' },
    business: { label: 'Negocios', className: 'bg-brand-brown text-brand-brown dark:bg-brand-brown/30 dark:text-brand-brown' },
}

const SUBCATEGORY_LABELS: Record<string, string> = {
    curso: 'Curso',
    diplomado: 'Diplomado',
    clase: 'Clase',
    taller: 'Taller',
    conferencia: 'Conferencia',
    seminario: 'Seminario',
    congreso: 'Congreso',
    meetup: 'Meetup',
    otro: 'Otro',
}

export function EventCard({
    event,
    isActiveMember,
    userId,
    isReadOnly = false,
}: {
    event: EventWithRegistration
    isActiveMember: boolean
    userId?: string
    isReadOnly?: boolean
}) {
    const isRegistered = event.registration?.status === 'registered'
    const hasRecording = event.status === 'completed' && event.recording_url
    const isFull = event.max_attendees && (event.attendee_count || 0) >= event.max_attendees
    const isCreator = userId && event.created_by === userId
    const category = (event as any).category as string
    const subcategory = (event as any).subcategory as string

    // ──── READ-ONLY MODE (level 0 psychologists) ────
    if (isReadOnly) {
        return (
            <Card className="relative min-w-0 overflow-hidden opacity-75">
                {/* Event Image — not clickable */}
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
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                        <EventStatusBadge status={event.status} />
                        {category && CATEGORY_BADGES[category] && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_BADGES[category].className}`}>
                                {CATEGORY_BADGES[category].label}
                            </span>
                        )}
                    </div>
                    {/* Lock overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Solo Miembros
                        </div>
                    </div>
                </div>

                <CardHeader className="min-w-0 space-y-1">
                    <CardTitle className="min-w-0 break-words line-clamp-2 text-muted-foreground">
                        {event.title}
                    </CardTitle>
                    <CardDescription className="min-w-0 flex items-start gap-2 break-words">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        {formatEventDate(event.start_time)}
                    </CardDescription>
                    {subcategory && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full w-fit">
                            {SUBCATEGORY_LABELS[subcategory] || subcategory}
                        </span>
                    )}
                </CardHeader>

                <CardContent>
                    {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="min-w-0 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            {event.attendee_count || 0} inscritos
                            {event.max_attendees && ` / ${event.max_attendees}`}
                        </span>
                        {event.price > 0 ? (
                            <span className="shrink-0 font-semibold text-primary">${event.price.toFixed(2)} MXN</span>
                        ) : (
                            <span className="shrink-0 font-medium text-green-600">Gratis</span>
                        )}
                    </div>
                    <div className="pt-3">
                        <Button asChild variant="outline" className="w-full justify-center whitespace-normal text-center leading-snug">
                            <Link href="/dashboard/subscription">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Hazte Miembro para Participar
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // ──── NORMAL MODE ────
    return (
        <Card className="min-w-0 overflow-hidden group transition-shadow hover:shadow-lg">
            {/* Event Image */}
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary/30">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="m9 16 2 2 4-4" />
                        </svg>
                    </div>
                )}

                <div className="absolute top-3 left-3 flex items-center gap-2">
                    <EventStatusBadge status={event.status} />
                    {category && CATEGORY_BADGES[category] && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_BADGES[category].className}`}>
                            {CATEGORY_BADGES[category].label}
                        </span>
                    )}
                </div>

                {event.is_members_only && (
                    <div className="absolute top-3 right-3">
                        <Badge variant={"warning" as any} className="bg-brand-yellow/90">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                                <path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /><path d="M11 17v.01" /><path d="M7 14v.01" />
                            </svg>
                            Solo Miembros
                        </Badge>
                    </div>
                )}
            </Link>

            <CardHeader className="min-w-0 space-y-1">
                <Link href={`/dashboard/events/${event.id}`} className="block min-w-0 hover:underline">
                    <CardTitle className="min-w-0 break-words line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                    </CardTitle>
                </Link>
                <CardDescription className="min-w-0 flex items-start gap-2 break-words">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    {formatEventDate(event.start_time)}
                </CardDescription>
                {subcategory && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full w-fit">
                        {SUBCATEGORY_LABELS[subcategory] || subcategory}
                    </span>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                )}

                <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="min-w-0 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {event.attendee_count || 0} inscritos
                        {event.max_attendees && ` / ${event.max_attendees}`}
                    </span>
                    {event.price > 0 ? (
                        <span className="shrink-0 font-semibold text-primary">${event.price.toFixed(2)} MXN</span>
                    ) : (
                        <span className="shrink-0 font-medium text-green-600">Gratis</span>
                    )}
                </div>

                <div className="pt-2">
                    {isCreator ? (
                        <Button asChild variant="outline" className="w-full justify-center whitespace-normal text-center leading-snug">
                            <Link href={`/dashboard/events/${event.id}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                                Gestionar Evento
                            </Link>
                        </Button>
                    ) : hasRecording && isActiveMember ? (
                            <Button asChild className="w-full justify-center whitespace-normal text-center leading-snug">
                            <Link href={`/dashboard/events/${event.id}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <polygon points="6 3 20 12 6 21 6 3" />
                                </svg>
                                Ver Grabación
                            </Link>
                        </Button>
                    ) : hasRecording && !isActiveMember ? (
                        <Button asChild variant="outline" className="w-full justify-center whitespace-normal text-center leading-snug">
                            <Link href="/precios">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Hazte Miembro para Ver
                            </Link>
                        </Button>
                    ) : isRegistered ? (
                        <>
                            <Button asChild variant="secondary" className="w-full justify-center whitespace-normal text-center leading-snug">
                                <Link href={`/dashboard/events/${event.id}`}>Ir al Evento</Link>
                            </Button>
                            <div className="mt-2">
                                <AddToCalendarButton event={event} className="w-full" />
                            </div>
                        </>
                    ) : isFull ? (
                        <Button variant="outline" className="w-full" disabled>Cupo Lleno</Button>
                    ) : event.status === 'cancelled' ? (
                        <Button variant="outline" className="w-full" disabled>Cancelado</Button>
                    ) : (
                        <Button asChild className="w-full justify-center whitespace-normal text-center leading-snug">
                            <Link href={`/dashboard/events/${event.id}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" />
                                </svg>
                                Inscribirse
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

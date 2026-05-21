import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Mic2, ArrowRight, Users, DollarSign, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { ProgressRing } from './ui/ProgressRing'
import { MilestoneTracker, type Milestone } from './ui/MilestoneTracker'

interface PonenteDashboardProps {
    userName: string
    greeting: string
    totalEvents: number
    upcomingEvents: number
    totalAttendees: number
    profileCompleteness: number
    events: {
        id: string
        title: string
        status: string
        start_time: string
        attendee_count: number
    }[]
    totalAccumulated?: number
    availableForPayment?: number
    pendingAmount?: number
    currentMonthEarnings?: number
    nextPaymentDate?: string | null
}

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}

function getSpeakerMilestones(profileComplete: number, totalEvents: number, totalAttendees: number): Milestone[] {
    return [
        { title: 'Perfil completo', completed: profileComplete >= 80, current: profileComplete < 80, icon: 'Mic2' },
        { title: 'Primer evento', completed: totalEvents > 0, current: profileComplete >= 80 && totalEvents === 0, icon: 'CalendarDays' },
        { title: '50 asistentes', completed: totalAttendees >= 50, current: totalEvents > 0 && totalAttendees < 50, icon: 'Users' },
        { title: 'Speaker certificado', completed: false, current: totalAttendees >= 50, icon: 'Award' },
    ]
}

const statusBadges: Record<string, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'bg-muted text-muted-foreground' },
    upcoming: { label: 'Próximo', color: 'bg-brand-blue text-white' },
    live: { label: 'En vivo', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    completed: { label: 'Finalizado', color: 'bg-muted text-muted-foreground' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

function formatMXN(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

export function PonenteDashboard({
    userName,
    greeting: initialGreeting,
    totalEvents,
    upcomingEvents,
    totalAttendees,
    profileCompleteness,
    events,
    totalAccumulated = 0,
    availableForPayment = 0,
    pendingAmount = 0,
    currentMonthEarnings = 0,
    nextPaymentDate = null,
}: PonenteDashboardProps) {
    const greeting = initialGreeting || getGreeting()
    const heroGreeting = userName ? `${greeting}, ${userName}` : 'Tu panel de ponente'
    const milestones = getSpeakerMilestones(profileCompleteness, totalEvents, totalAttendees)
    const nextEvent = events.find((event) => event.status === 'upcoming' || event.status === 'live') ?? null

    return (
        <div className="space-y-7 dashboard-stagger">
            <div className="rounded-xl border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <ProgressRing
                        percentage={profileCompleteness}
                        label="Tu perfil"
                        sublabel="Perfil de ponente"
                        color="secondary"
                        size={92}
                    />
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {heroGreeting}
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Eventos, perfil y ganancias en una vista más clara.
                        </p>
                    </div>
                    <Button asChild className="min-h-11 shrink-0 sm:min-h-9">
                        <Link href="/dashboard/events/new">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Crear evento
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base">Próximo evento</CardTitle>
                            <CardDescription>Lo más importante para preparar ahora</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm" className="min-h-11 w-full sm:min-h-8 sm:w-auto">
                            <Link href="/dashboard/events">
                                Ver mis eventos
                                <ArrowRight className="ml-2 h-3 w-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {nextEvent ? (
                            <Link href={`/dashboard/events/${nextEvent.id}`}>
                                <div className="rounded-xl border bg-muted/40 p-4 transition-colors hover:bg-muted">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">{nextEvent.title}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {new Date(nextEvent.start_time).toLocaleDateString('es-MX', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                {nextEvent.attendee_count}
                                            </span>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadges[nextEvent.status]?.color ?? statusBadges.draft.color}`}>
                                                {statusBadges[nextEvent.status]?.label ?? statusBadges.draft.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                <CalendarDays className="mx-auto mb-4 h-12 w-12 opacity-30" />
                                <p>No tienes eventos próximos</p>
                                <Button asChild variant="outline" size="sm" className="mt-4 min-h-11 w-full sm:min-h-8 sm:w-auto">
                                    <Link href="/dashboard/events/new">Crear evento</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Mic2 className="h-4 w-4 text-brand-blue-hover" />
                            Perfil de ponente
                        </CardTitle>
                        <CardDescription>Tu carta de presentación pública</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="mb-1.5 flex justify-between text-xs">
                                <span className="text-muted-foreground">Completitud</span>
                                <span className="font-medium">{profileCompleteness}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-brand-blue-hover transition-all duration-1000"
                                    style={{ width: `${profileCompleteness}%` }}
                                />
                            </div>
                        </div>
                        {profileCompleteness < 100 && (
                            <p className="text-xs text-muted-foreground">
                                Completa biografía, especialidades y foto para mejorar tu landing.
                            </p>
                        )}
                        <Button asChild variant="outline" className="w-full justify-between">
                            <Link href="/dashboard/settings">
                                Actualizar perfil
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <DollarSign className="h-4 w-4 text-brand-blue-hover" />
                            Ganancias
                        </CardTitle>
                        <CardDescription>Resumen financiero de tus eventos</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm" className="min-h-11 w-full sm:min-h-8 sm:w-auto">
                        <Link href="/dashboard/earnings">
                            Ver ganancias
                            <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border bg-muted/35 p-3">
                            <div className="mb-1 flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5 text-brand-blue" />
                                <span className="text-xs text-muted-foreground">Total acumulado</span>
                            </div>
                            <p className="text-lg font-bold">{formatMXN(totalAccumulated)}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/35 p-3">
                            <div className="mb-1 flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                                <span className="text-xs text-muted-foreground">Disponible</span>
                            </div>
                            <p className="text-lg font-bold text-emerald-700">{formatMXN(availableForPayment)}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/35 p-3">
                            <div className="mb-1 flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-amber-700" />
                                <span className="text-xs text-muted-foreground">En garantía</span>
                            </div>
                            <p className="text-lg font-bold text-amber-800">{formatMXN(pendingAmount)}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/35 p-3">
                            <div className="mb-1 flex items-center gap-2">
                                <CalendarDays className="h-3.5 w-3.5 text-brand-blue" />
                                <span className="text-xs text-muted-foreground">Este mes</span>
                            </div>
                            <p className="text-lg font-bold">{formatMXN(currentMonthEarnings)}</p>
                        </div>
                    </div>
                    {nextPaymentDate && (
                        <p className="mt-4 text-xs text-muted-foreground">
                            Próximo pago estimado: {new Date(nextPaymentDate).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium">Eventos creados</p>
                            <p className="text-2xl font-bold">{totalEvents}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium">Próximos</p>
                            <p className="text-2xl font-bold">{upcomingEvents}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium">Asistentes</p>
                            <p className="text-2xl font-bold">{totalAttendees}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-xl border bg-card p-5">
                <MilestoneTracker
                    milestones={milestones}
                    title="Tu progreso como ponente"
                />
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            Mis eventos
                        </CardTitle>
                        <CardDescription>Últimos eventos creados o asignados</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm" className="min-h-11 w-full sm:min-h-8 sm:w-auto">
                        <Link href="/dashboard/events">
                            Ver todos
                            <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {events.length > 0 ? (
                        <div className="space-y-2.5">
                            {events.slice(0, 5).map((event) => {
                                const badge = statusBadges[event.status] || statusBadges.draft
                                return (
                                    <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                                        <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{event.title}</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {new Date(event.start_time).toLocaleDateString('es-MX', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="ml-0 flex shrink-0 flex-wrap items-center gap-2 sm:ml-3">
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Users className="h-3 w-3" />
                                                    {event.attendee_count}
                                                </span>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            <CalendarDays className="mx-auto mb-4 h-12 w-12 opacity-30" />
                            <p>Aún no has creado eventos</p>
                            <Button asChild variant="outline" size="sm" className="mt-4 min-h-11 w-full sm:min-h-8 sm:w-auto">
                                <Link href="/dashboard/events/new">Crear mi primer evento</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

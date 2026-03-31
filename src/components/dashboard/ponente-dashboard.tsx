import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Mic2, ArrowRight, Users, DollarSign, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { ProgressRing } from './ui/ProgressRing'
import { MilestoneTracker, type Milestone } from './ui/MilestoneTracker'
import { StatCard } from './ui/StatCard'

interface PonenteDashboardProps {
    userName: string
    greeting: string
    // New dynamic data
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
    // Financial data
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
        { title: 'Perfil Completo', completed: profileComplete >= 80, current: profileComplete < 80, icon: 'Mic2' },
        { title: 'Primer Evento', completed: totalEvents > 0, current: profileComplete >= 80 && totalEvents === 0, icon: 'CalendarDays' },
        { title: '50 Asistentes', completed: totalAttendees >= 50, current: totalEvents > 0 && totalAttendees < 50, icon: 'Users' },
        { title: 'Speaker Certificado', completed: false, current: totalAttendees >= 50, icon: 'Award' },
    ]
}

const statusBadges: Record<string, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'bg-muted text-muted-foreground' },
    upcoming: { label: 'Próximo', color: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/40 dark:text-brand-yellow' },
    live: { label: 'En Vivo', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    completed: { label: 'Finalizado', color: 'bg-muted text-muted-foreground' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
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

    return (
        <div className="space-y-8 dashboard-stagger">
            {/* Hero Banner */}
            <div className="rounded-2xl border bg-gradient-to-br from-card to-brand-brown/30 dark:from-card dark:to-brand-brown/10 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <ProgressRing
                        percentage={profileCompleteness}
                        label="Tu Perfil"
                        sublabel="Completa tu perfil"
                        color="secondary"
                        size={100}
                    />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            {heroGreeting}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Tu panel de ponente. Gestiona tus eventos y perfil profesional.
                        </p>
                    </div>
                    <Button asChild className="min-h-11 w-full sm:min-h-9 sm:w-auto">
                        <Link href="/dashboard/events/new" className="sm:flex-shrink-0">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Crear Evento
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Milestone Tracker */}
            <div className="rounded-xl border bg-card p-5">
                <MilestoneTracker
                    milestones={milestones}
                    title="Tu Journey como Ponente"
                />
            </div>

            {/* Financial Summary */}
            <div className="rounded-xl border bg-card p-5">
                <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-brand-brown" />
                        Resumen Financiero
                    </h2>
                    <Button asChild variant="outline" size="sm" className="min-h-11 w-full sm:min-h-8 sm:w-auto">
                        <Link href="/dashboard/earnings">
                            Ver Panel Completo
                            <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-3 rounded-lg bg-brand-yellow/50 dark:bg-brand-yellow/20 border border-brand-yellow/50 dark:border-brand-yellow/30">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-3.5 w-3.5 text-brand-yellow" />
                            <span className="text-xs text-muted-foreground">Total Acumulado</span>
                        </div>
                        <p className="text-lg font-bold">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalAccumulated)}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-brand-brown/50 dark:bg-brand-brown/20 border border-brand-brown/50 dark:border-brand-brown/30">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-brown" />
                            <span className="text-xs text-muted-foreground">Disponible</span>
                        </div>
                        <p className="text-lg font-bold text-brand-brown dark:text-brand-brown">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(availableForPayment)}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-brand-yellow/50 dark:bg-brand-yellow/20 border border-brand-yellow/50 dark:border-brand-yellow/30">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3.5 w-3.5 text-brand-yellow" />
                            <span className="text-xs text-muted-foreground">En Garantía (30d)</span>
                        </div>
                        <p className="text-lg font-bold text-brand-yellow dark:text-brand-yellow">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(pendingAmount)}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-brand-brown/50 dark:bg-brand-brown/20 border border-brand-brown/50 dark:border-brand-brown/30">
                        <div className="flex items-center gap-2 mb-1">
                            <CalendarDays className="h-3.5 w-3.5 text-brand-brown" />
                            <span className="text-xs text-muted-foreground">Este Mes</span>
                        </div>
                        <p className="text-lg font-bold">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(currentMonthEarnings)}
                        </p>
                    </div>
                </div>
                {nextPaymentDate && (
                    <p className="mt-4 text-xs text-muted-foreground">
                        Proximo pago estimado: {new Date(nextPaymentDate).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Eventos Creados"
                    value={totalEvents}
                    subtitle="Total de eventos"
                    icon="CalendarDays"
                    color="secondary"
                    delay={0}
                />
                <StatCard
                    title="Eventos Próximos"
                    value={upcomingEvents}
                    subtitle="Próximamente"
                    icon="Eye"
                    color="primary"
                    delay={80}
                />
                <StatCard
                    title="Asistentes Totales"
                    value={totalAttendees}
                    subtitle="Acumulados"
                    icon="Users"
                    color="primary"
                    delay={160}
                />
            </div>

            {/* Events Grid + Profile */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* My Events */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                Mis Eventos
                            </CardTitle>
                            <CardDescription>Gestiona y visualiza tus eventos</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm" className="min-h-11 w-full sm:min-h-8 sm:w-auto">
                            <Link href="/dashboard/events">
                                Ver Todos
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
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {new Date(event.start_time).toLocaleDateString('es-MX', {
                                                            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 ml-0 sm:ml-3">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {event.attendee_count}
                                                    </span>
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>Aún no has creado eventos</p>
                                <Button asChild variant="outline" size="sm" className="mt-4 min-h-11 w-full sm:min-h-8 sm:w-auto">
                                    <Link href="/dashboard/events/new">
                                        Crear Mi Primer Evento
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Profile Completion */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Mic2 className="h-4 w-4 text-brand-brown" />
                            Perfil de Ponente
                        </CardTitle>
                        <CardDescription>
                            Mantén actualizado tu perfil para tu audiencia
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Completion bar */}
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-muted-foreground">Completitud</span>
                                <span className="font-medium">{profileCompleteness}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-brown rounded-full transition-all duration-1000"
                                    style={{ width: `${profileCompleteness}%` }}
                                />
                            </div>
                        </div>

                        {profileCompleteness < 100 && (
                            <p className="text-xs text-muted-foreground">
                                Completa tu biografía, especialidades y foto para tu landing page.
                            </p>
                        )}

                        <div className="flex flex-col gap-2">
                            <Button asChild variant="secondary" className="w-full justify-start gap-3 whitespace-normal text-left sm:justify-between">
                                <Link href="/dashboard/settings">
                                    Actualizar Mi Perfil
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full justify-start gap-3 whitespace-normal text-left sm:justify-between">
                                <Link href="/dashboard/events/new">
                                    Crear Nuevo Evento
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

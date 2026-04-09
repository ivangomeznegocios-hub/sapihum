import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
    Users,
    Calendar,
    FileText,
    TrendingUp,
    ArrowRight,
    UserPlus,
    Sparkles,
    CheckCircle2,
    Zap,
} from 'lucide-react'
import { ProgressRing } from './ui/ProgressRing'
import { MilestoneTracker, type Milestone } from './ui/MilestoneTracker'
import { StatCard } from './ui/StatCard'
import { ActivityFeed, type ActivityItem } from './ui/ActivityFeed'
import { ContentCarousel, type ContentItem } from './ui/ContentCarousel'

interface PsychologistDashboardProps {
    membershipLevel: number
    patientCount: number
    appointmentsToday: number
    hoursMonth: number
    userName: string
    greeting: string
    upcomingAppointments: any[]
    activeEvents: number
    availableResources: number
    // New data for dynamic dashboard
    profileCompleteness: number
    eventsAttended: number
    completedSessions: number
    recentActivity: ActivityItem[]
    contentItems: ContentItem[]
    pendingReferrals: number
}

function getLevel1Milestones(eventsAttended: number, resourcesViewed: number): Milestone[] {
    return [
        { title: 'Registro', completed: true, icon: 'CheckCircle2' },
        { title: 'Perfil Completo', completed: true, icon: 'Users' },
        { title: 'Primer Evento', completed: eventsAttended > 0, current: eventsAttended === 0, icon: 'Calendar' },
        { title: '3 Recursos', completed: resourcesViewed >= 3, current: eventsAttended > 0 && resourcesViewed < 3, icon: 'BookOpen' },
        { title: 'Certificación', completed: false, current: resourcesViewed >= 3, icon: 'Award' },
    ]
}

function getLevel2Milestones(patients: number, sessions: number, referrals: number): Milestone[] {
    return [
        { title: 'Primer Paciente', completed: patients > 0, current: patients === 0, icon: 'UserPlus' },
        { title: '5 Pacientes', completed: patients >= 5, current: patients > 0 && patients < 5, icon: 'Users' },
        { title: '20 Sesiones', completed: sessions >= 20, current: patients >= 5 && sessions < 20, icon: 'Calendar' },
        { title: 'Referencia', completed: referrals > 0, current: sessions >= 20 && referrals === 0, icon: 'Star' },
        { title: 'Certificación Clínica', completed: false, current: referrals > 0, icon: 'Award' },
    ]
}

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}

export function PsychologistDashboard({
    membershipLevel,
    patientCount,
    appointmentsToday,
    hoursMonth,
    userName,
    greeting: initialGreeting,
    upcomingAppointments,
    activeEvents,
    availableResources,
    profileCompleteness,
    eventsAttended,
    completedSessions,
    recentActivity,
    contentItems,
    pendingReferrals,
}: PsychologistDashboardProps) {
    const greeting = initialGreeting || getGreeting()
    const heroGreeting = userName ? `${greeting}, ${userName}` : 'Tu espacio profesional'

    // Level 1: Comunidad y Crecimiento
    if (membershipLevel === 1) {
        const milestones = getLevel1Milestones(eventsAttended, availableResources)

        return (
            <div className="space-y-8 dashboard-stagger">
                {/* Hero Banner */}
                <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <ProgressRing
                            percentage={profileCompleteness}
                            label="Tu Perfil"
                            sublabel="Completa tu perfil"
                            color="primary"
                            size={100}
                        />
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                                {heroGreeting}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Tu espacio de crecimiento profesional en SAPIHUM
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-brown text-brand-brown dark:bg-brand-brown/30 dark:text-brand-brown font-medium">
                                    Nivel 1 · Comunidad y Crecimiento
                                </span>
                            </div>
                        </div>
                        <Link href="/dashboard/events" className="flex-shrink-0">
                            <Button className="min-h-11 sm:min-h-9">
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Ver Eventos
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Milestone Tracker */}
                <div className="rounded-xl border bg-card p-5">
                    <MilestoneTracker
                        milestones={milestones}
                        title="Tu Journey Profesional"
                    />
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Eventos Próximos"
                        value={activeEvents}
                        subtitle="Masterclasses y talleres"
                        icon="Calendar"
                        color="primary"
                        delay={0}
                    />
                    <StatCard
                        title="Recursos Disponibles"
                        value={availableResources}
                        subtitle="Documentos y plantillas"
                        icon="FileText"
                        color="secondary"
                        delay={100}
                    />
                    <StatCard
                        title="Comunidad"
                        value="Activa"
                        subtitle="Conecta con colegas"
                        icon="Users"
                        color="primary"
                        delay={200}
                    />
                </div>

                {/* Content Carousel + CTA */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <ContentCarousel
                            items={contentItems}
                            title="Contenido Nuevo Para Ti"
                            viewAllHref="/dashboard/events"
                            viewAllLabel="Ver todo"
                        />
                    </div>

                    {/* Upgrade CTA */}
                    <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-brand-brown/10 border-primary/20 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Haz crecer tu consulta
                            </CardTitle>
                            <CardDescription>
                                Lleva tu práctica al siguiente nivel
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-foreground/80">
                                El plan <strong>Consultorio Digital</strong> te da una capa operativa más completa:
                                web profesional, agenda, plataforma con pacientes, pagos y soporte para tu consulta.
                            </p>
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-brown" />
                                    Página web profesional
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-brown" />
                                    Agenda online 24/7
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-brown" />
                                    Pagos y dashboard financiero
                                </li>
                            </ul>
                            <Link href="/dashboard/subscription" className="block">
                                <Button className="w-full">
                                    <Zap className="mr-2 h-4 w-4" />
                                    Conocer Consultorio Digital
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {[
                                { title: 'Hub de Recursos', href: '/dashboard/resources', icon: FileText },
                                { title: 'Calendario de Eventos', href: '/dashboard/events', icon: Calendar },
                                { title: 'Comunidad', href: '/dashboard/community', icon: Users },
                                { title: 'Mi Suscripción', href: '/dashboard/subscription', icon: TrendingUp },
                            ].map((action, i) => (
                                <Link key={i} href={action.href}>
                                    <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 whitespace-normal text-left sm:justify-between">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <action.icon className="h-4 w-4" />
                                            <span className="min-w-0 text-left leading-snug">{action.title}</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Level 2 & 3: Consultorio Digital & Premium
    const milestones = getLevel2Milestones(patientCount, completedSessions, pendingReferrals)

    return (
        <div className="space-y-8 dashboard-stagger">
            {/* Hero Banner */}
            <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <ProgressRing
                        percentage={profileCompleteness}
                        label="Tu Consultorio"
                        sublabel={appointmentsToday > 0 ? `${appointmentsToday} cita${appointmentsToday > 1 ? 's' : ''} hoy` : 'Sin citas hoy'}
                        color={membershipLevel === 3 ? 'primary' : 'secondary'}
                        size={100}
                    />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            {heroGreeting}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Tu {membershipLevel === 3 ? 'panel premium de gestión y marketing' : 'consultorio digital'}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${membershipLevel === 3
                                    ? 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow'
                                    : 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow'
                                }`}>
                                Nivel {membershipLevel} · {membershipLevel === 3 ? 'Gestión y Marketing Premium' : 'Consultorio Digital'}
                            </span>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 flex-shrink-0 sm:w-auto sm:flex-row">
                        {membershipLevel === 3 && (
                            <Link href="/dashboard/marketing">
                                <Button variant="outline" className="w-full border-brand-yellow/50 text-brand-yellow hover:bg-brand-yellow dark:hover:bg-brand-yellow sm:w-auto">
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Agencia
                                </Button>
                            </Link>
                        )}
                        <Link href="/dashboard/patients">
                            <Button className="w-full sm:w-auto">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Agregar Paciente
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Milestone Tracker */}
            <div className="rounded-xl border bg-card p-5">
                <MilestoneTracker
                    milestones={milestones}
                    title="Tu Journey Clínico"
                />
            </div>

            {/* Level 3 Premium Stats */}
            {membershipLevel === 3 && (
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Marketing & Anuncios"
                        value="Activo"
                        subtitle="Campaña de captación en curso"
                        icon="TrendingUp"
                        color="primary"
                        delay={0}
                    />
                    <StatCard
                        title="Pacientes Nuevos"
                        value={`+${Math.floor(patientCount * 0.2)}`}
                        subtitle="Crecimiento estimado este mes"
                        icon="UserPlus"
                        color="primary"
                        delay={100}
                    />
                    <StatCard
                        title="Asesoría de Negocios"
                        value="Disponible"
                        subtitle="Agenda tu mentoría 1 a 1"
                        icon="Users"
                        color="primary"
                        delay={200}
                    />
                </div>
            )}

            {/* Core Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Mis Pacientes"
                    value={patientCount}
                    subtitle="Pacientes activos"
                    icon="Users"
                    color="primary"
                    delay={0}
                />
                <StatCard
                    title="Citas Hoy"
                    value={appointmentsToday}
                    subtitle="Sesiones programadas"
                    icon="Calendar"
                    color="primary"
                    delay={80}
                />
                <StatCard
                    title="Horas del Mes"
                    value={hoursMonth}
                    subtitle="Sesiones completadas"
                    icon="Clock"
                    color="secondary"
                    delay={160}
                />
                <StatCard
                    title="Comunidad & Eventos"
                    value={activeEvents}
                    subtitle="Masterclasses este mes"
                    icon="TrendingUp"
                    color="primary"
                    delay={240}
                />
            </div>

            {/* Upcoming Appointments + Activity Feed */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Appointments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Próximas Citas</CardTitle>
                        <CardDescription>Tu agenda de hoy y mañana</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointments.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingAppointments.map((apt: any) => {
                                    const aptDate = new Date(apt.start_time)
                                    const now = new Date()
                                    const diffMs = aptDate.getTime() - now.getTime()
                                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
                                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

                                    let timeLabel = ''
                                    if (diffMs < 0) timeLabel = 'En curso'
                                    else if (diffHrs > 24) timeLabel = `En ${Math.floor(diffHrs / 24)}d`
                                    else if (diffHrs > 0) timeLabel = `En ${diffHrs}h ${diffMins}m`
                                    else timeLabel = `En ${diffMins}m`

                                    return (
                                        <div key={apt.id} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-background rounded-full">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{apt.patient?.full_name}</p>
                                                    <p className="break-words text-xs text-muted-foreground">
                                                        {aptDate.toLocaleString('es-MX', {
                                                            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full self-start sm:self-auto ${diffMs < 0
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : diffHrs < 1
                                                        ? 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {timeLabel}
                                            </span>
                                        </div>
                                    )
                                })}
                                <Button asChild variant="outline" className="mt-1 min-h-11 w-full sm:min-h-9">
                                    <Link href="/dashboard/calendar">
                                        Ver calendario completo
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>No hay citas programadas</p>
                                <Button asChild variant="outline" size="sm" className="mt-4 min-h-11 sm:min-h-8">
                                    <Link href="/dashboard/calendar">
                                        Ir al calendario
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <ActivityFeed
                    items={recentActivity}
                    title="Actividad Reciente"
                    emptyMessage="Tu actividad clínica aparecerá aquí"
                />
            </div>

            {/* Content Carousel */}
            <ContentCarousel
                items={contentItems}
                title="Contenido Nuevo Para Ti"
                viewAllHref="/dashboard/events"
            />

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                    <CardDescription>Funciones más utilizadas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {[
                            { title: 'Ver Mis Pacientes', href: '/dashboard/patients', icon: Users },
                            { title: 'Revisar Agenda', href: '/dashboard/calendar', icon: Calendar },
                            { title: 'Asignar Tareas', href: '/dashboard/tasks', icon: FileText },
                            { title: 'Hub de Recursos', href: '/dashboard/resources', icon: TrendingUp },
                        ].map((action, i) => (
                            <Link key={i} href={action.href}>
                                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3 whitespace-normal text-left sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <action.icon className="h-4 w-4" />
                                        <span className="min-w-0 text-left leading-snug">{action.title}</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

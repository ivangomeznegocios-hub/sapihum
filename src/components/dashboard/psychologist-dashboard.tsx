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
        { title: 'Perfil completo', completed: true, icon: 'Users' },
        { title: 'Primer evento', completed: eventsAttended > 0, current: eventsAttended === 0, icon: 'Calendar' },
        { title: '3 recursos', completed: resourcesViewed >= 3, current: eventsAttended > 0 && resourcesViewed < 3, icon: 'BookOpen' },
        { title: 'Certificación', completed: false, current: resourcesViewed >= 3, icon: 'Award' },
    ]
}

function getLevel2Milestones(patients: number, sessions: number, referrals: number): Milestone[] {
    return [
        { title: 'Primer paciente', completed: patients > 0, current: patients === 0, icon: 'UserPlus' },
        { title: '5 pacientes', completed: patients >= 5, current: patients > 0 && patients < 5, icon: 'Users' },
        { title: '20 sesiones', completed: sessions >= 20, current: patients >= 5 && sessions < 20, icon: 'Calendar' },
        { title: 'Primera referencia', completed: referrals > 0, current: sessions >= 20 && referrals === 0, icon: 'Star' },
        { title: 'Certificación clínica', completed: false, current: referrals > 0, icon: 'Award' },
    ]
}

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}

function DashboardSection({
    title,
    description,
    children,
}: {
    title: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {children}
        </section>
    )
}

function UpcomingAppointmentsCard({ appointments }: { appointments: any[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Próximas citas</CardTitle>
                <CardDescription>Tu agenda de hoy y mañana</CardDescription>
            </CardHeader>
            <CardContent>
                {appointments.length > 0 ? (
                    <div className="space-y-3">
                        {appointments.map((apt: any) => {
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
                                        <div className="rounded-full bg-background p-2">
                                            <Calendar className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{apt.patient?.full_name}</p>
                                            <p className="break-words text-xs text-muted-foreground">
                                                {aptDate.toLocaleString('es-MX', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`self-start rounded-full px-2 py-1 text-xs font-medium sm:self-auto ${diffMs < 0
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : diffHrs < 1
                                                ? 'bg-brand-blue text-white'
                                                : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {timeLabel}
                                    </span>
                                </div>
                            )
                        })}
                        <Button asChild variant="outline" className="mt-1 min-h-11 w-full sm:min-h-9">
                            <Link href="/dashboard/calendar">Ver agenda completa</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="py-8 text-center text-muted-foreground">
                        <Calendar className="mx-auto mb-4 h-12 w-12 opacity-30" />
                        <p>No hay citas programadas</p>
                        <Button asChild variant="outline" size="sm" className="mt-4 min-h-11 sm:min-h-8">
                            <Link href="/dashboard/calendar">Ir a la agenda</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
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

    if (membershipLevel === 1) {
        const milestones = getLevel1Milestones(eventsAttended, availableResources)

        return (
            <div className="space-y-7 dashboard-stagger">
                <div className="rounded-xl border bg-card p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <ProgressRing
                            percentage={profileCompleteness}
                            label="Tu perfil"
                            sublabel="Completa tu perfil"
                            color="primary"
                            size={92}
                        />
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                {heroGreeting}
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                Comunidad, eventos y biblioteca para crecer como profesional.
                            </p>
                            <div className="mt-3">
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                    Nivel 1 · Comunidad y crecimiento
                                </span>
                            </div>
                        </div>
                        <Button asChild className="min-h-11 shrink-0 sm:min-h-9">
                            <Link href="/dashboard/events">
                                Ver eventos
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <DashboardSection title="Tu progreso">
                    <div className="rounded-xl border bg-card p-5">
                        <MilestoneTracker milestones={milestones} title="Tu progreso" />
                    </div>
                </DashboardSection>

                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Eventos próximos"
                        value={activeEvents}
                        subtitle="Masterclasses y talleres"
                        icon="Calendar"
                        color="primary"
                        delay={0}
                    />
                    <StatCard
                        title="Biblioteca"
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

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <ContentCarousel
                            items={contentItems}
                            title="Contenido nuevo para ti"
                            viewAllHref="/dashboard/events"
                            viewAllLabel="Ver todo"
                        />
                    </div>

                    <Card className="border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Siguiente nivel
                            </CardTitle>
                            <CardDescription>
                                Cuando necesites operar tu consulta desde SAPIHUM.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-foreground/80">
                                Consultorio Digital suma agenda, pacientes, pagos y soporte sin quitarte comunidad ni biblioteca.
                            </p>
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue-hover" />
                                    Página web profesional
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue-hover" />
                                    Agenda online 24/7
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue-hover" />
                                    Panel para pacientes y pagos
                                </li>
                            </ul>
                            <Button asChild className="w-full">
                                <Link href="/dashboard/subscription">
                                    <Zap className="mr-2 h-4 w-4" />
                                    Ver Consultorio Digital
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Accesos útiles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {[
                                { title: 'Biblioteca', href: '/dashboard/resources', icon: FileText },
                                { title: 'Eventos y comunidad', href: '/dashboard/events', icon: Calendar },
                                { title: 'Mis cursos y eventos', href: '/dashboard/mi-acceso', icon: Users },
                                { title: 'Suscripción', href: '/dashboard/subscription', icon: TrendingUp },
                            ].map((action) => (
                                <Link key={action.href} href={action.href}>
                                    <Button variant="outline" className="h-auto w-full justify-start gap-3 py-3 text-left whitespace-normal sm:justify-between">
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

    const milestones = getLevel2Milestones(patientCount, completedSessions, pendingReferrals)

    return (
        <div className="space-y-7 dashboard-stagger">
            <div className="rounded-xl border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <ProgressRing
                        percentage={profileCompleteness}
                        label="Tu consultorio"
                        sublabel={appointmentsToday > 0 ? `${appointmentsToday} cita${appointmentsToday > 1 ? 's' : ''} hoy` : 'Sin citas hoy'}
                        color={membershipLevel === 3 ? 'primary' : 'secondary'}
                        size={92}
                    />
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {heroGreeting}
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Consultorio, comunidad y crecimiento profesional en un solo lugar.
                        </p>
                        <div className="mt-3">
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                Nivel {membershipLevel} · {membershipLevel === 3 ? 'Consultorio + marketing profesional' : 'Consultorio Digital'}
                            </span>
                        </div>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
                        {membershipLevel === 3 && (
                            <Button asChild variant="outline" className="w-full sm:w-auto">
                                <Link href="/dashboard/marketing">
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Marketing profesional
                                </Link>
                            </Button>
                        )}
                        <Button asChild className="w-full sm:w-auto">
                            <Link href="/dashboard/patients">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Agregar paciente
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <DashboardSection
                title="Tu consultorio"
                description="Lo operativo va primero: citas, pacientes, tareas y seguimiento."
            >
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Pacientes activos"
                        value={patientCount}
                        subtitle="En seguimiento"
                        icon="Users"
                        color="primary"
                        delay={0}
                    />
                    <StatCard
                        title="Citas hoy"
                        value={appointmentsToday}
                        subtitle="Sesiones programadas"
                        icon="Calendar"
                        color="primary"
                        delay={80}
                    />
                    <StatCard
                        title="Horas del mes"
                        value={hoursMonth}
                        subtitle="Sesiones completadas"
                        icon="Clock"
                        color="secondary"
                        delay={160}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <UpcomingAppointmentsCard appointments={upcomingAppointments} />
                    <ActivityFeed
                        items={recentActivity}
                        title="Actividad reciente"
                        emptyMessage="Tu actividad clínica aparecerá aquí"
                    />
                </div>
            </DashboardSection>

            <DashboardSection
                title="Tu comunidad profesional"
                description="Conserva eventos, biblioteca y contenido del nivel 1."
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <StatCard
                        title="Eventos y comunidad"
                        value={activeEvents}
                        subtitle="Masterclasses disponibles"
                        icon="TrendingUp"
                        color="primary"
                        delay={0}
                    />
                    <StatCard
                        title="Biblioteca"
                        value={availableResources}
                        subtitle="Recursos para tu práctica"
                        icon="FileText"
                        color="secondary"
                        delay={80}
                    />
                </div>

                <ContentCarousel
                    items={contentItems}
                    title="Contenido nuevo para ti"
                    viewAllHref="/dashboard/events"
                />
            </DashboardSection>

            <DashboardSection
                title="Tu crecimiento"
                description="Progreso de tu consultorio y beneficios de tu nivel."
            >
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border bg-card p-5 lg:col-span-2">
                        <MilestoneTracker
                            milestones={milestones}
                            title="Progreso de tu consultorio"
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-4 w-4 text-primary" />
                                {membershipLevel === 3 ? 'Impulso profesional' : 'Perfil y crecimiento'}
                            </CardTitle>
                            <CardDescription>
                                {membershipLevel === 3
                                    ? 'Herramientas para captar y posicionarte mejor.'
                                    : 'Mantén tu perfil completo y activa más funciones.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="mb-1.5 flex justify-between text-xs">
                                    <span className="text-muted-foreground">Completitud del perfil</span>
                                    <span className="font-medium">{profileCompleteness}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-brand-blue-hover transition-all duration-1000"
                                        style={{ width: `${profileCompleteness}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Button asChild variant="outline" className="w-full justify-between">
                                    <Link href="/dashboard/settings">
                                        Actualizar perfil
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full justify-between">
                                    <Link href="/dashboard/growth">
                                        Invita colegas
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                {membershipLevel === 3 && (
                                    <Button asChild className="w-full justify-between">
                                        <Link href="/dashboard/marketing">
                                            Marketing profesional
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardSection>
        </div>
    )
}

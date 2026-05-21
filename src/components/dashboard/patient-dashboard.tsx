import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
    UserCog,
    Calendar,
    Heart,
    ArrowRight,
    Clock,
    CheckSquare,
    Brain,
    Sparkles,
    BookOpen,
} from 'lucide-react'
import { ProgressRing } from './ui/ProgressRing'
import { MilestoneTracker, type Milestone } from './ui/MilestoneTracker'
import { ContentCarousel, type ContentItem } from './ui/ContentCarousel'

interface PatientDashboardProps {
    psychologistName: string | null
    upcomingAppointments: number
    resourcesAvailable: number
    userName: string
    greeting: string
    completedSessions: number
    completedTasks: number
    totalTasks: number
    pendingTasks: { id: string; title: string; type: string; due_date?: string }[]
    nextAppointment: { start_time: string; psychologist_name: string } | null
    contentItems: ContentItem[]
}

const WELLNESS_TIPS = [
    { title: 'Respira', text: 'Dedica 5 minutos a respirar profundo y bajar el ritmo.' },
    { title: 'Registra', text: 'Escribe 3 cosas que te ayudaron hoy, aunque sean pequeñas.' },
    { title: 'Muévete', text: 'Una caminata corta puede ayudar a ordenar el día.' },
    { title: 'Conecta', text: 'Habla con alguien que te haga sentir acompañado.' },
    { title: 'Descansa', text: 'El descanso también forma parte del proceso.' },
    { title: 'Crea', text: 'Dibuja, escribe o haz algo breve que te permita expresarte.' },
    { title: 'Sé amable', text: 'Háblate con la misma paciencia que tendrías con alguien querido.' },
]

function getWellnessTip() {
    const dayOfWeek = new Date().getDay()
    return WELLNESS_TIPS[dayOfWeek]
}

function getPatientMilestones(sessions: number, completedTasks: number): Milestone[] {
    return [
        { title: 'Primera sesión', completed: sessions > 0, current: sessions === 0, icon: 'Calendar' },
        { title: '3 sesiones', completed: sessions >= 3, current: sessions > 0 && sessions < 3, icon: 'UserCog' },
        { title: 'Primera tarea', completed: completedTasks > 0, current: sessions >= 3 && completedTasks === 0, icon: 'CheckSquare' },
        { title: '5 tareas', completed: completedTasks >= 5, current: completedTasks > 0 && completedTasks < 5, icon: 'BookOpen' },
        { title: 'Autoevaluación', completed: false, current: completedTasks >= 5, icon: 'Brain' },
    ]
}

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}

const taskTypeLabels: Record<string, string> = {
    journal: 'Diario',
    exercise: 'Ejercicio',
    reading: 'Lectura',
    form: 'Formulario',
    general: 'General',
}

export function PatientDashboard({
    psychologistName,
    upcomingAppointments,
    resourcesAvailable,
    userName,
    greeting: initialGreeting,
    completedSessions,
    completedTasks,
    totalTasks,
    pendingTasks,
    nextAppointment,
    contentItems,
}: PatientDashboardProps) {
    const greeting = initialGreeting || getGreeting()
    const heroGreeting = userName ? `${greeting}, ${userName}` : 'Tu espacio de bienestar'
    const tip = getWellnessTip()
    const milestones = getPatientMilestones(completedSessions, completedTasks)
    const totalActions = completedTasks + completedSessions
    const wellnessPercentage = Math.min(100, Math.round((totalActions / Math.max(totalActions + pendingTasks.length, 10)) * 100))
    const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return (
        <div className="space-y-7 dashboard-stagger">
            <div className="rounded-xl border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <ProgressRing
                        percentage={wellnessPercentage}
                        label="Tu bienestar"
                        sublabel="Progreso de actividades"
                        color="primary"
                        size={92}
                    />
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {heroGreeting}
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Citas, tareas y recursos de tu proceso.
                        </p>
                        {psychologistName && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                Tu psicólogo: <span className="font-medium text-foreground">{psychologistName}</span>
                            </p>
                        )}
                    </div>
                    <Button asChild className="min-h-11 shrink-0 sm:min-h-9">
                        <Link href="/dashboard/tasks">
                            Ver tareas
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Próxima cita</CardTitle>
                        <CardDescription>Tu siguiente sesión</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {nextAppointment ? (
                            <div className="rounded-xl border bg-muted/40 p-5">
                                <div className="flex items-start gap-4">
                                    <div className="rounded-xl bg-background p-3">
                                        <Calendar className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold">
                                            {new Date(nextAppointment.start_time).toLocaleDateString('es-MX', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                            })}
                                        </p>
                                        <p className="mt-0.5 break-words text-sm text-muted-foreground">
                                            {new Date(nextAppointment.start_time).toLocaleTimeString('es-MX', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                            {' · '}con {nextAppointment.psychologist_name}
                                        </p>
                                        <Button asChild size="sm" className="mt-3 min-h-11 sm:min-h-8">
                                            <Link href="/dashboard/calendar">Ver detalles</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                <Clock className="mx-auto mb-4 h-12 w-12 opacity-30" />
                                <p>No hay citas programadas</p>
                                {psychologistName && (
                                    <p className="mt-2 text-sm">
                                        Contacta a {psychologistName} para agendar.
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base">Tareas pendientes</CardTitle>
                            <CardDescription>
                                {completedTasks} de {totalTasks} completadas
                            </CardDescription>
                        </div>
                        {totalTasks > 0 && (
                            <span className="text-2xl font-bold text-brand-blue-hover">
                                {taskCompletion}%
                            </span>
                        )}
                    </CardHeader>
                    <CardContent>
                        {pendingTasks.length > 0 ? (
                            <div className="space-y-2.5">
                                {pendingTasks.slice(0, 3).map((task) => (
                                    <div key={task.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                        <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{task.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {taskTypeLabels[task.type] || task.type}
                                                {task.due_date && ` · Vence ${new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <Button asChild variant="outline" className="mt-1 min-h-11 w-full sm:min-h-9">
                                    <Link href="/dashboard/tasks">Ver todas las tareas</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="py-6 text-center text-muted-foreground">
                                <CheckSquare className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                <p className="text-sm">No tienes tareas pendientes</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium">Citas programadas</p>
                            <p className="text-2xl font-bold">{upcomingAppointments}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium">Recursos</p>
                            <p className="text-2xl font-bold">{resourcesAvailable}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <Heart className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-sm font-medium">Sesiones completadas</p>
                            <p className="text-2xl font-bold">{completedSessions}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-xl border bg-card p-5">
                <MilestoneTracker milestones={milestones} title="Tu progreso" />
            </div>

            {contentItems.length > 0 && (
                <ContentCarousel
                    items={contentItems}
                    title="Eventos para ti"
                    viewAllHref="/dashboard/events"
                />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Accesos útiles</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { title: 'Mi psicólogo', href: '/dashboard/my-psychologist', icon: UserCog },
                            { title: 'Citas', href: '/dashboard/calendar', icon: Calendar },
                            { title: 'Tareas', href: '/dashboard/tasks', icon: CheckSquare },
                            { title: 'Recursos', href: '/dashboard/documents', icon: BookOpen },
                            { title: 'Herramientas', href: '/dashboard/tools', icon: Brain },
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

            <div className="rounded-xl border bg-muted/35 p-5">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 rounded-full bg-background p-2.5">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Tip del día: {tip.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{tip.text}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

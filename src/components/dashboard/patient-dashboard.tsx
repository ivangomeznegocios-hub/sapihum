import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
    UserCog,
    Calendar,
    BookOpen,
    Heart,
    ArrowRight,
    Clock,
    CheckSquare,
    Brain,
    Sparkles,
} from 'lucide-react'
import { ProgressRing } from './ui/ProgressRing'
import { MilestoneTracker, type Milestone } from './ui/MilestoneTracker'
import { StatCard } from './ui/StatCard'
import { ContentCarousel, type ContentItem } from './ui/ContentCarousel'

interface PatientDashboardProps {
    psychologistName: string | null
    upcomingAppointments: number
    resourcesAvailable: number
    userName: string
    greeting: string
    // New dynamic data
    completedSessions: number
    completedTasks: number
    totalTasks: number
    pendingTasks: { id: string; title: string; type: string; due_date?: string }[]
    nextAppointment: { start_time: string; psychologist_name: string } | null
    contentItems: ContentItem[]
}

const WELLNESS_TIPS = [
    { title: 'Mindfulness', text: 'Dedica 5 minutos a respirar profundamente. Inhala por la nariz, exhala por la boca. Tu mente te lo agradecerá.' },
    { title: 'Gratitud', text: 'Escribe 3 cosas por las que estás agradecido hoy. La gratitud transforma la perspectiva.' },
    { title: 'Movimiento', text: 'Tu cuerpo necesita moverse. Una caminata de 15 minutos puede mejorar significativamente tu estado de ánimo.' },
    { title: 'Conexión', text: 'Habla con alguien que te haga sentir bien. Las relaciones son pilares de la salud mental.' },
    { title: 'Descanso', text: 'El descanso no es un lujo, es una necesidad. Intenta dormir 7-8 horas esta noche.' },
    { title: 'Creatividad', text: 'Haz algo creativo hoy: dibuja, escribe, baila. La creatividad libera emociones.' },
    { title: 'Amabilidad', text: 'Sé amable contigo mismo. Háblate como le hablarías a tu mejor amigo.' },
]

function getWellnessTip() {
    const dayOfWeek = new Date().getDay()
    return WELLNESS_TIPS[dayOfWeek]
}

function getPatientMilestones(sessions: number, completedTasks: number): Milestone[] {
    return [
        { title: 'Primera Sesión', completed: sessions > 0, current: sessions === 0, icon: 'Calendar' },
        { title: '3 Sesiones', completed: sessions >= 3, current: sessions > 0 && sessions < 3, icon: 'UserCog' },
        { title: 'Primera Tarea', completed: completedTasks > 0, current: sessions >= 3 && completedTasks === 0, icon: 'CheckSquare' },
        { title: '5 Tareas', completed: completedTasks >= 5, current: completedTasks > 0 && completedTasks < 5, icon: 'BookOpen' },
        { title: 'Auto-evaluación', completed: false, current: completedTasks >= 5, icon: 'Brain' },
    ]
}

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}

const taskTypeLabels: Record<string, string> = {
    journal: '📝 Diario',
    exercise: '💪 Ejercicio',
    reading: '📖 Lectura',
    form: '📋 Formulario',
    general: '📌 General',
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
    const greeting = initialGreeting
    const tip = getWellnessTip()
    const milestones = getPatientMilestones(completedSessions, completedTasks)

    // Wellness progress based on task completion and sessions
    const totalActions = completedTasks + completedSessions
    const wellnessPercentage = Math.min(100, Math.round((totalActions / Math.max(totalActions + pendingTasks.length, 10)) * 100))

    return (
        <div className="space-y-8 dashboard-stagger">
            {/* Hero Banner */}
            <div className="rounded-2xl border bg-gradient-to-br from-card via-brand-brown/20 to-green-50/30 dark:from-card dark:via-brand-brown/10 dark:to-green-950/10 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <ProgressRing
                        percentage={wellnessPercentage}
                        label="Tu Bienestar"
                        sublabel="Progreso de actividades"
                        color="primary"
                        size={100}
                    />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            {greeting}, {userName} 🌱
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Tu espacio de bienestar personal
                        </p>
                        {psychologistName && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Tu psicólogo: <span className="font-medium text-foreground">{psychologistName}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Milestone Tracker */}
            <div className="rounded-xl border bg-card p-5">
                <MilestoneTracker
                    milestones={milestones}
                    title="Tu Journey de Bienestar"
                />
            </div>

            {/* Stats + Next Appointment */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Mi Psicólogo"
                    value={psychologistName || 'Sin asignar'}
                    subtitle={psychologistName ? 'Asignado' : 'Contacta al administrador'}
                    icon="UserCog"
                    color="primary"
                    delay={0}
                />
                <StatCard
                    title="Próximas Citas"
                    value={upcomingAppointments}
                    subtitle="Programadas"
                    icon="Calendar"
                    color="primary"
                    delay={80}
                />
                <StatCard
                    title="Recursos Disponibles"
                    value={resourcesAvailable}
                    subtitle="Asignados para ti"
                    icon="BookOpen"
                    color="secondary"
                    delay={160}
                />
            </div>

            {/* Next Appointment Card + Pending Tasks */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Next Appointment */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Próxima Cita</CardTitle>
                        <CardDescription>Tu siguiente sesión</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {nextAppointment ? (
                            <div className="bg-gradient-to-br from-brand-yellow to-brand-yellow/50 dark:from-brand-yellow/30 dark:to-brand-yellow/20 rounded-xl p-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-brand-yellow dark:bg-brand-yellow/50 rounded-xl">
                                        <Calendar className="h-6 w-6 text-brand-yellow dark:text-brand-yellow" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-brand-yellow dark:text-brand-yellow">
                                            {new Date(nextAppointment.start_time).toLocaleDateString('es-MX', {
                                                weekday: 'long', day: 'numeric', month: 'long'
                                            })}
                                        </p>
                                        <p className="mt-0.5 break-words whitespace-normal text-sm text-brand-yellow dark:text-brand-yellow">
                                            {new Date(nextAppointment.start_time).toLocaleTimeString('es-MX', {
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                            {' · '}con {nextAppointment.psychologist_name}
                                        </p>
                                        <div className="mt-3">
                                            <Button asChild size="sm" className="min-h-11 bg-brand-yellow hover:bg-brand-yellow sm:min-h-8">
                                                <Link href="/dashboard/calendar">
                                                    Ver Detalles
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>No hay citas programadas</p>
                                {psychologistName && (
                                    <p className="text-sm mt-2">
                                        Contacta a {psychologistName} para agendar
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Tasks */}
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base">Tareas Pendientes</CardTitle>
                            <CardDescription>
                                {completedTasks} de {totalTasks} completadas
                            </CardDescription>
                        </div>
                        {totalTasks > 0 && (
                            <div className="text-right">
                                <span className="text-2xl font-bold text-brand-brown">
                                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                                </span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {pendingTasks.length > 0 ? (
                            <div className="space-y-2.5">
                                {pendingTasks.slice(0, 3).map((task) => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{task.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {taskTypeLabels[task.type] || task.type}
                                                {task.due_date && ` · Vence ${new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <Button asChild variant="outline" className="mt-1 min-h-11 w-full sm:min-h-9">
                                    <Link href="/dashboard/tasks">
                                        Ver todas las tareas
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">¡Excelente! No tienes tareas pendientes</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Content Carousel */}
            {contentItems.length > 0 && (
                <ContentCarousel
                    items={contentItems}
                    title="Recursos Para Ti"
                    viewAllHref="/dashboard/resources"
                />
            )}

            {/* Quick Access */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Acceso Rápido</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            { title: 'Mi Psicólogo', href: '/dashboard/my-psychologist', icon: UserCog },
                            { title: 'Mis Citas', href: '/dashboard/calendar', icon: Calendar },
                            { title: 'Mis Tareas', href: '/dashboard/tasks', icon: CheckSquare },
                            { title: 'Herramientas', href: '/dashboard/tools', icon: Brain },
                            { title: 'Eventos', href: '/dashboard/events', icon: Heart },
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

            {/* Wellness Tip */}
            <div className="rounded-xl bg-gradient-to-r from-green-50 to-brand-dark dark:from-green-950/20 dark:to-brand-dark/20 border border-green-200 dark:border-green-800 p-5">
                <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-green-100 dark:bg-green-900 rounded-full flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-200">
                            Tip del día: {tip.title}
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {tip.text}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

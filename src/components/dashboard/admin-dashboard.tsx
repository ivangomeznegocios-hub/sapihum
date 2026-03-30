import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
    Users,
    UserCog,
    Calendar,
    BarChart3,
    ArrowRight,
    Shield,
    Activity,
    TrendingUp,
    FileText,
    Newspaper,
    Handshake,
    Mic2,
    UserPlus,
} from 'lucide-react'
import { StatCard } from './ui/StatCard'
import { ActivityFeed, type ActivityItem } from './ui/ActivityFeed'

interface AdminDashboardProps {
    totalUsers: number
    totalPsychologists: number
    totalPatients: number
    activeEvents: number
    userName: string
    greeting: string
    // New dynamic data
    recentUsers: { id: string; full_name: string | null; role: string; created_at: string }[]
    recentActivity: ActivityItem[]
    usersThisWeek: number
    eventsThisMonth: number
    pendingReferrals: number
    mrr: number
    eventsGmv: number
}

function formatMXN(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumSignificantDigits: 3 }).format(amount)
}

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}

const roleLabels: Record<string, { label: string; color: string }> = {
    psychologist: { label: 'Psicólogo', color: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/40 dark:text-brand-yellow' },
    patient: { label: 'Paciente', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    admin: { label: 'Admin', color: 'bg-brand-brown text-brand-brown dark:bg-brand-brown/40 dark:text-brand-brown' },
    ponente: { label: 'Ponente', color: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/40 dark:text-brand-yellow' },
}

export function AdminDashboard({
    totalUsers,
    totalPsychologists,
    totalPatients,
    activeEvents,
    userName,
    greeting: initialGreeting,
    recentUsers,
    recentActivity,
    usersThisWeek,
    eventsThisMonth,
    pendingReferrals,
    mrr,
    eventsGmv,
}: AdminDashboardProps) {
    const greeting = initialGreeting

    return (
        <div className="space-y-8 dashboard-stagger">
            {/* Hero Banner */}
            <div className="rounded-2xl border bg-gradient-to-br from-card to-brand-brown/30 dark:from-card dark:to-brand-brown/10 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Panel de Administración 🔐
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {greeting}, {userName}. Gestiona la plataforma desde aquí.
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                Sistema Operativo
                            </span>
                            {pendingReferrals > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow font-medium">
                                    {pendingReferrals} referencia{pendingReferrals > 1 ? 's' : ''} pendiente{pendingReferrals > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                    <Link href="/dashboard/admin/users">
                        <Button className="w-full sm:w-auto">
                            <UserCog className="mr-2 h-4 w-4" />
                            Gestionar Usuarios
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Usuarios"
                    value={totalUsers}
                    subtitle="Registrados en la plataforma"
                    trend={usersThisWeek > 0 ? `+${usersThisWeek} esta semana` : undefined}
                    icon="Users"
                    color="primary"
                    delay={0}
                />
                <StatCard
                    title="Psicólogos"
                    value={totalPsychologists}
                    subtitle="Profesionales activos"
                    icon="Shield"
                    color="secondary"
                    delay={80}
                />
                <StatCard
                    title="Pacientes"
                    value={totalPatients}
                    subtitle="En tratamiento"
                    icon="Activity"
                    color="primary"
                    delay={160}
                />
                <StatCard
                    title="Eventos Activos"
                    value={activeEvents}
                    subtitle="Próximamente"
                    trend={eventsThisMonth > 0 ? `${eventsThisMonth} este mes` : undefined}
                    icon="Calendar"
                    color="primary"
                    delay={240}
                />
                <StatCard
                    title="MRR"
                    value={formatMXN(mrr)}
                    subtitle="Suscripciones Activas"
                    icon="TrendingUp"
                    color="primary"
                    delay={320}
                />
                <StatCard
                    title="GMV Eventos"
                    value={formatMXN(eventsGmv)}
                    subtitle="Ventas de este mes"
                    icon="Activity"
                    color="primary"
                    delay={400}
                />
            </div>

            {/* Recent Users + Activity Feed */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Users */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Inscripciones Recientes
                        </CardTitle>
                        <CardDescription>Últimos usuarios registrados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentUsers.length > 0 ? (
                            <div className="space-y-2.5">
                                {recentUsers.map((user) => {
                                    const role = roleLabels[user.role] || roleLabels.patient
                                    const timeAgo = getTimeAgo(user.created_at)
                                    return (
                                        <div key={user.id} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                    {(user.full_name || 'U')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{user.full_name || 'Sin nombre'}</p>
                                                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${role.color}`}>
                                                {role.label}
                                            </span>
                                        </div>
                                    )
                                })}
                                <Link href="/dashboard/admin/users">
                                    <Button variant="link" className="w-full mt-1" size="sm">
                                        Ver todos los usuarios
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No hay registros recientes</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <ActivityFeed
                    items={recentActivity}
                    title="Actividad de la Plataforma"
                    emptyMessage="No hay actividad reciente en la plataforma"
                />
            </div>

            {/* Quick Actions Grid */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Gestión de Plataforma</CardTitle>
                    <CardDescription>Acciones administrativas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    { title: 'Gestionar Usuarios', href: '/dashboard/admin/users', icon: UserCog },
                            { title: 'Ver Estadísticas', href: '/dashboard/analytics', icon: BarChart3 },
                            { title: 'Admin Analytics', href: '/dashboard/admin/analytics', icon: TrendingUp },
                            { title: 'Gestionar Eventos', href: '/dashboard/events', icon: Calendar },
                            { title: 'Ver Recursos', href: '/dashboard/resources', icon: FileText },
                            { title: 'Newsletter', href: '/dashboard/admin/newsletters', icon: Newspaper },
                            { title: 'Convenios', href: '/dashboard/admin/agreements', icon: Handshake },
                            { title: 'Gestionar Ponentes', href: '/dashboard/speakers', icon: Mic2 },
                            { title: 'Referencias', href: '/dashboard/admin/referrals', icon: TrendingUp },
                            { title: 'Suscripciones', href: '/dashboard/subscription', icon: Activity },
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

            {/* System Health */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Estado del Sistema</CardTitle>
                    <CardDescription>Estado general de la plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: 'Estado del sistema', value: 'Operativo', ok: true },
                            { label: 'Base de datos', value: 'Conectada', ok: true },
                            { label: 'Autenticación', value: 'Activa', ok: true },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-sm">{item.label}</span>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function getTimeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHrs < 24) return `Hace ${diffHrs}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

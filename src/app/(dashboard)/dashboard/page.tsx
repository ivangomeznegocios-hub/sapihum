import { getViewerContext } from '@/lib/supabase/server'
import { PsychologistDashboard, PatientDashboard, AdminDashboard, PonenteDashboard } from '@/components/dashboard'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ActivityItem } from '@/components/dashboard/ui/ActivityFeed'
import type { ContentItem } from '@/components/dashboard/ui/ContentCarousel'
import { getAssignedPsychologistForPatient } from '@/lib/supabase/queries/relationships'
import { canAccessClinicalWorkspace, getPsychologistDashboardLevel } from '@/lib/access/internal-modules'
import { getEventsWithRegistration } from '@/lib/supabase/queries/events'
import { getUniqueEventAccessCounts } from '@/lib/events/attendance'
import { getVisibleResources } from '@/lib/supabase/queries/resources'
import { DEFAULT_TIMEZONE, getGreetingForTimezone } from '@/lib/timezone'
import { ArrowRight, CalendarDays, GraduationCap, Library, ShieldCheck } from 'lucide-react'
import { createInterestedVerticalAccess, setActiveVertical } from '@/actions/verticals'
import { normalizeVerticalCode } from '@/lib/verticals'
import type { Vertical } from '@/types/database'

const DASHBOARD_EVENT_SELECT = [
    'id',
    'title',
    'image_url',
    'start_time',
    'status',
    'target_audience',
    'created_by',
].join(', ')

const DASHBOARD_RESOURCE_SELECT = [
    'id',
    'title',
    'thumbnail_url',
    'visibility',
    'target_audience',
    'min_membership_level',
    'created_by',
    'expires_at',
].join(', ')

function calculatePsychologistCompleteness(profile: any): number {
    const fields = [
        'full_name', 'avatar_url', 'phone', 'cedula_profesional',
        'specialty', 'bio', 'education', 'therapeutic_approaches',
        'populations_served', 'hourly_rate',
    ]
    let filled = 0
    for (const field of fields) {
        const val = profile[field]
        if (val && (!Array.isArray(val) || val.length > 0)) filled++
    }
    return Math.round((filled / fields.length) * 100)
}

function calculateSpeakerCompleteness(speaker: any): number {
    if (!speaker) return 10
    const fields = ['headline', 'bio', 'photo_url', 'credentials', 'specialties', 'social_links']
    let filled = 0
    for (const field of fields) {
        const val = speaker[field]
        if (val && (!Array.isArray(val) || val.length > 0) && (typeof val !== 'object' || Object.keys(val).length > 0)) filled++
    }
    return Math.round((filled / fields.length) * 100)
}

function timeAgo(dateStr: string): string {
    const now = new Date()
    const d = new Date(dateStr)
    const diffMs = now.getTime() - d.getTime()
    const mins = Math.floor(diffMs / (1000 * 60))
    const hrs = Math.floor(diffMs / (1000 * 60 * 60))
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (mins < 60) return `Hace ${mins}m`
    if (hrs < 24) return `Hace ${hrs}h`
    if (days < 7) return `Hace ${days}d`
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function DashboardAccessShortcut() {
    return (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/10">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Library className="h-4 w-4" />
                        Mi acceso
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Tus eventos, cursos y grabaciones activas en un solo lugar.
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/dashboard/mi-acceso">
                        Abrir mis accesos
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}

function ForensicVerticalDashboard({
    userName,
}: {
    userName: string
}) {
    const displayName = userName || 'Hola'

    return (
        <div className="space-y-6">
            <DashboardAccessShortcut />

            <div className="space-y-2">
                <p className="text-sm font-medium text-primary">Ciencias Forenses</p>
                <h1 className="text-2xl font-bold tracking-tight">
                    {displayName}, tu area forense
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    Consulta eventos, formaciones y materiales activos de la vertical forense sin mezclar modulos clinicos de psicologia.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="space-y-4 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Eventos forenses</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Conferencias, sesiones y actividades filtradas para Ciencias Forenses.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/dashboard/events">
                                Ver eventos
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-4 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Formaciones</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Diplomados y rutas formativas disponibles para tu acceso actual.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/dashboard/events/formations">
                                Ver formaciones
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-4 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Acceso activo</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Revisa compras, grabaciones y beneficios asignados a esta vertical.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/dashboard/mi-acceso">
                                Abrir mi acceso
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

async function selectDashboardVertical(verticalCode: string) {
    'use server'
    await setActiveVertical(verticalCode)
}

async function createDashboardVerticalAccess(verticalCode: string) {
    'use server'
    await createInterestedVerticalAccess(verticalCode)
}

function VerticalChoicePanel({
    title,
    description,
    verticals,
    mode,
}: {
    title: string
    description: string
    verticals: Vertical[]
    mode: 'select' | 'onboard'
}) {
    return (
        <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-3xl items-center justify-center py-10">
            <div className="w-full space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {verticals.map((vertical) => {
                        const action = mode === 'onboard'
                            ? createDashboardVerticalAccess.bind(null, vertical.code)
                            : selectDashboardVertical.bind(null, vertical.code)

                        return (
                            <form key={vertical.code} action={action}>
                                <Card className="h-full transition-colors hover:border-primary/50">
                                    <CardContent className="flex h-full flex-col gap-4 p-5">
                                        <div className="space-y-1">
                                            <h2 className="text-lg font-semibold">{vertical.name}</h2>
                                            <p className="text-sm text-muted-foreground">
                                                {vertical.code === 'ciencias_forenses'
                                                    ? 'Eventos, diplomados y recursos forenses dentro del mismo SAPIHUM.'
                                                    : 'Comunidad, eventos, recursos y herramientas para psicologia.'}
                                            </p>
                                        </div>
                                        <Button type="submit" className="mt-auto w-full">
                                            Entrar a {vertical.name}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </form>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams?: Promise<{ vertical?: string }>
}) {
    const params = await searchParams
    const requestedVerticalCode = normalizeVerticalCode(params?.vertical)
    const {
        supabase,
        user,
        profile,
        commercialAccess,
        membershipLevel: effectiveMembershipLevel,
        activeVertical,
        availableVerticals,
    } = await getViewerContext({
        includeCommercialAccess: true,
        activeVerticalCode: requestedVerticalCode,
    })

    if (!user) {
        redirect('/auth/login?next=/dashboard')
    }

    if (!profile) {
        redirect('/auth/login?error=profile_not_found&next=/dashboard')
    }

    if (availableVerticals.length === 0) {
        const { data: verticals } = await (supabase
            .from('verticals') as any)
            .select('*')
            .eq('status', 'active')
            .order('name', { ascending: true })

        return (
            <VerticalChoicePanel
                title="Elige tu area inicial"
                description="Selecciona donde quieres empezar. Tu cuenta seguira siendo una sola dentro de SAPIHUM."
                verticals={(verticals ?? []) as Vertical[]}
                mode="onboard"
            />
        )
    }

    const activeVerticalCookie = (await cookies()).get('sapihum_active_vertical')?.value
    if (availableVerticals.length > 1 && !requestedVerticalCode && !activeVerticalCookie) {
        return (
            <VerticalChoicePanel
                title="En que area quieres trabajar hoy?"
                description="Tu usuario puede tener acceso a varias areas. Elige la experiencia activa para este dashboard."
                verticals={availableVerticals}
                mode="select"
            />
        )
    }

    const viewerQueryOptions = {
        supabase,
        userId: profile.id,
        profile,
        commercialAccess: commercialAccess ?? undefined,
    }
    const userName = profile.full_name?.trim().split(/\s+/)[0] || ''
    const userRole = profile.role
    const userTimezone = (profile as any).timezone || DEFAULT_TIMEZONE
    const greeting = userName ? getGreetingForTimezone(userTimezone) : ''

    if (userRole === 'support') {
        redirect('/dashboard/admin/operations')
    }

    if (userRole === 'admin') {
        const { getAnalytics } = await import('@/lib/supabase/queries/analytics')
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

        const [
            analytics,
            totalUsersResult,
            totalPsychologistsResult,
            totalPatientsResult,
            activeEventsResult,
            recentUsersResult,
            usersThisWeekResult,
            eventsThisMonthResult,
            pendingReferralsResult,
        ] = await Promise.all([
            getAnalytics(),
            (supabase.from('profiles') as any).select('*', { count: 'exact', head: true }),
            (supabase.from('profiles') as any).select('*', { count: 'exact', head: true }).eq('role', 'psychologist'),
            (supabase.from('profiles') as any).select('*', { count: 'exact', head: true }).eq('role', 'patient'),
            (supabase.from('events') as any).select('*', { count: 'exact', head: true }).eq('status', 'upcoming'),
            (supabase.from('profiles') as any)
                .select('id, full_name, role, created_at')
                .order('created_at', { ascending: false })
                .limit(5),
            (supabase.from('profiles') as any).select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
            (supabase.from('events') as any).select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
            (supabase.from('referrals') as any).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        ])

        const recentUsersData = recentUsersResult.data || []
        const adminActivity: ActivityItem[] = recentUsersData.map((u: any) => ({
            icon: 'UserPlus',
            iconColor: 'text-brand-blue',
            title: `${u.full_name || 'Usuario'} se registro`,
            description: u.role === 'psychologist' ? 'Nuevo psicologo' : u.role === 'ponente' ? 'Nuevo ponente' : 'Nuevo usuario',
            timeAgo: timeAgo(u.created_at),
        }))

        return (
            <div className="space-y-6">
                <DashboardAccessShortcut />
                <AdminDashboard
                    totalUsers={totalUsersResult.count || 0}
                    totalPsychologists={totalPsychologistsResult.count || 0}
                    totalPatients={totalPatientsResult.count || 0}
                    activeEvents={activeEventsResult.count || 0}
                    userName={userName}
                    greeting={greeting}
                    recentUsers={recentUsersData}
                    recentActivity={adminActivity}
                    usersThisWeek={usersThisWeekResult.count || 0}
                    eventsThisMonth={eventsThisMonthResult.count || 0}
                    pendingReferrals={pendingReferralsResult.count || 0}
                    mrr={Math.round((analytics.mrr || 0) * 100) / 100}
                    eventsGmv={Math.round((analytics.eventsGmv || 0) * 100) / 100}
                />
            </div>
        )
    }

    if (activeVertical?.code === 'ciencias_forenses') {
        return <ForensicVerticalDashboard userName={userName} />
    }

    if (userRole === 'psychologist') {
        const psychologistViewer = {
            role: userRole,
            membershipLevel: effectiveMembershipLevel,
            membershipSpecializationCode: profile.membership_specialization_code ?? null,
        }
        const dashboardMembershipLevel = getPsychologistDashboardLevel(psychologistViewer)
        const hasClinicalWorkspace = canAccessClinicalWorkspace(psychologistViewer)
        const profileCompleteness = calculatePsychologistCompleteness(profile)
        const today = new Date().toISOString().split('T')[0]
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

        const emptyClinicalResults = [
            { count: 0 },
            { count: 0 },
            { data: [] as any[] },
            { count: 0 },
            { data: [] as any[] },
            { count: 0 },
            { data: [] as any[] },
            { data: [] as any[] },
        ] as const

        const [
            visibleEvents,
            visibleResources,
            eventRegistrationsResult,
            clinicalResults,
        ] = await Promise.all([
            getEventsWithRegistration({
                ...viewerQueryOptions,
                activeVerticalId: activeVertical?.id ?? null,
                statuses: ['upcoming', 'live'],
                select: DASHBOARD_EVENT_SELECT,
                includeRegistrations: false,
                includeAttendeeCounts: false,
            }),
            getVisibleResources({
                select: DASHBOARD_RESOURCE_SELECT,
            }, viewerQueryOptions),
            (supabase.from('event_registrations') as any)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id),
            hasClinicalWorkspace
                ? Promise.all([
                    (supabase.from('patient_psychologist_relationships') as any)
                        .select('*', { count: 'exact', head: true })
                        .eq('psychologist_id', profile.id)
                        .eq('status', 'active'),
                    (supabase.from('appointments') as any)
                        .select('*', { count: 'exact', head: true })
                        .eq('psychologist_id', profile.id)
                        .eq('status', 'confirmed')
                        .gte('start_time', `${today}T00:00:00`)
                        .lt('start_time', `${today}T23:59:59`),
                    (supabase.from('appointments') as any)
                        .select('start_time, end_time')
                        .eq('psychologist_id', profile.id)
                        .eq('status', 'completed')
                        .gte('start_time', startOfMonth),
                    (supabase.from('appointments') as any)
                        .select('*', { count: 'exact', head: true })
                        .eq('psychologist_id', profile.id)
                        .eq('status', 'completed'),
                    (supabase.from('appointments') as any)
                        .select(`
                            id,
                            start_time,
                            patient:profiles!appointments_patient_id_fkey(full_name)
                        `)
                        .eq('psychologist_id', profile.id)
                        .gte('start_time', new Date().toISOString())
                        .order('start_time', { ascending: true })
                        .limit(5),
                    (supabase.from('referrals') as any)
                        .select('*', { count: 'exact', head: true })
                        .eq('referring_psychologist_id', profile.id),
                    (supabase.from('appointments') as any)
                        .select('start_time, patient:profiles!appointments_patient_id_fkey(full_name)')
                        .eq('psychologist_id', profile.id)
                        .eq('status', 'completed')
                        .order('start_time', { ascending: false })
                        .limit(3),
                    (supabase.from('tasks') as any)
                        .select('title, created_at')
                        .eq('psychologist_id', profile.id)
                        .order('created_at', { ascending: false })
                        .limit(2),
                ])
                : Promise.resolve(emptyClinicalResults),
        ])

        const [
            patientCountResult,
            appointmentsTodayResult,
            monthAppointmentsResult,
            completedSessionsResult,
            upcomingAppointmentsResult,
            pendingReferralsResult,
            recentAppointmentsResult,
            recentTasksResult,
        ] = clinicalResults

        const upcomingVisibleEvents = visibleEvents
            .filter((event) => event.status === 'upcoming')
            .slice(0, 4)
        const recentVisibleResources = visibleResources.slice(0, 3)
        const monthAppointments = monthAppointmentsResult.data || []
        const hoursThisMonth = monthAppointments.reduce((acc: number, curr: any) => {
            const start = new Date(curr.start_time).getTime()
            const end = new Date(curr.end_time).getTime()
            return acc + (end - start) / (1000 * 60 * 60)
        }, 0)

        const recentActivity: ActivityItem[] = []
        for (const apt of recentAppointmentsResult.data || []) {
            recentActivity.push({
                icon: 'Calendar',
                iconColor: 'text-brand-blue-hover',
                title: `Sesion con ${apt.patient?.full_name || 'Paciente'}`,
                description: 'Sesion completada',
                timeAgo: timeAgo(apt.start_time),
            })
        }

        for (const task of recentTasksResult.data || []) {
            recentActivity.push({
                icon: 'CheckSquare',
                iconColor: 'text-brand-blue',
                title: `Tarea asignada: ${task.title}`,
                timeAgo: timeAgo(task.created_at),
            })
        }

        const contentItems: ContentItem[] = []
        for (const evt of upcomingVisibleEvents) {
            contentItems.push({
                id: evt.id,
                type: 'event',
                title: evt.title,
                subtitle: new Date(evt.start_time).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
                href: `/dashboard/events/${evt.id}`,
                imageUrl: evt.image_url,
            })
        }

        for (const res of recentVisibleResources) {
            contentItems.push({
                id: res.id,
                type: 'resource',
                title: res.title,
                href: `/dashboard/resources/${res.id}`,
                imageUrl: res.thumbnail_url,
            })
        }

        return (
            <div className="space-y-6">
                <DashboardAccessShortcut />
                <PsychologistDashboard
                    membershipLevel={dashboardMembershipLevel}
                    patientCount={patientCountResult.count || 0}
                    appointmentsToday={appointmentsTodayResult.count || 0}
                    hoursMonth={Math.round(hoursThisMonth * 10) / 10}
                    userName={userName}
                    greeting={greeting}
                    upcomingAppointments={upcomingAppointmentsResult.data || []}
                    activeEvents={upcomingVisibleEvents.length}
                    availableResources={visibleResources.length}
                    profileCompleteness={profileCompleteness}
                    eventsAttended={eventRegistrationsResult.count || 0}
                    completedSessions={completedSessionsResult.count || 0}
                    recentActivity={recentActivity}
                    contentItems={contentItems}
                    pendingReferrals={pendingReferralsResult.count || 0}
                />
            </div>
        )
    }

    if (userRole === 'patient') {
        const nowIso = new Date().toISOString()
        const [
            assignedPsychologist,
            visibleEvents,
            appointmentCountResult,
            resourceCountResult,
            sessionsCountResult,
            allTasksResult,
            nextAppointmentResult,
        ] = await Promise.all([
            getAssignedPsychologistForPatient(profile.id, { supabase }),
            getEventsWithRegistration({
                ...viewerQueryOptions,
                activeVerticalId: activeVertical?.id ?? null,
                statuses: ['upcoming', 'live'],
                limit: 8,
                select: DASHBOARD_EVENT_SELECT,
                includeRegistrations: false,
                includeAttendeeCounts: false,
            }),
            (supabase.from('appointments') as any)
                .select('*', { count: 'exact', head: true })
                .eq('patient_id', profile.id)
                .gte('start_time', nowIso),
            (supabase.from('patient_resources') as any)
                .select('*', { count: 'exact', head: true })
                .eq('patient_id', profile.id),
            (supabase.from('appointments') as any)
                .select('*', { count: 'exact', head: true })
                .eq('patient_id', profile.id)
                .eq('status', 'completed'),
            (supabase.from('tasks') as any)
                .select('id, title, type, status, due_date')
                .eq('patient_id', profile.id)
                .order('due_date', { ascending: true }),
            (supabase.from('appointments') as any)
                .select('start_time')
                .eq('patient_id', profile.id)
                .gte('start_time', nowIso)
                .order('start_time', { ascending: true })
                .limit(1),
        ])

        const psychologistName = assignedPsychologist?.full_name || null
        const allTasks = allTasksResult.data || []
        const completedTaskCount = allTasks.filter((task: any) => task.status === 'completed' || task.status === 'reviewed').length
        const pendingTasks = allTasks.filter((task: any) => task.status === 'pending' || task.status === 'in_progress')
        const nextAppointmentData = nextAppointmentResult.data || []
        const nextAppointment = nextAppointmentData.length > 0
            ? {
                start_time: nextAppointmentData[0].start_time,
                psychologist_name: psychologistName || 'Tu psicologo',
            }
            : null

        const contentItems: ContentItem[] = []
        for (const evt of visibleEvents.filter((event) => event.status === 'upcoming').slice(0, 3)) {
            contentItems.push({
                id: evt.id,
                type: 'event',
                title: evt.title,
                subtitle: new Date(evt.start_time).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
                href: `/dashboard/events/${evt.id}`,
                imageUrl: evt.image_url,
            })
        }

        return (
            <div className="space-y-6">
                <DashboardAccessShortcut />
                <PatientDashboard
                    psychologistName={psychologistName}
                    upcomingAppointments={appointmentCountResult.count || 0}
                    resourcesAvailable={resourceCountResult.count || 0}
                    userName={userName}
                    greeting={greeting}
                    completedSessions={sessionsCountResult.count || 0}
                    completedTasks={completedTaskCount}
                    totalTasks={allTasks.length}
                    pendingTasks={pendingTasks.slice(0, 3)}
                    nextAppointment={nextAppointment}
                    contentItems={contentItems}
                />
            </div>
        )
    }

    if (userRole === 'ponente') {
        const [speakerResult, createdEventsResult, assignedLinksResult] = await Promise.all([
            (supabase.from('speakers') as any).select('*').eq('id', profile.id).single(),
            (supabase.from('events') as any)
                .select('id, title, status, start_time')
                .eq('created_by', profile.id)
                .order('start_time', { ascending: false }),
            (supabase.from('event_speakers') as any)
                .select('event_id')
                .eq('speaker_id', profile.id),
        ])

        const speaker = speakerResult.data
        const createdEvents = createdEventsResult.data || []
        const assignedLinks = assignedLinksResult.data || []
        const profileCompleteness = calculateSpeakerCompleteness(speaker)
        const createdEventIds = new Set(createdEvents.map((event: any) => event.id))
        const assignedEventIds = Array.from(new Set(
            assignedLinks
                .map((link: any) => link.event_id)
                .filter((eventId: string | null): eventId is string => typeof eventId === 'string' && !createdEventIds.has(eventId))
        ))

        const [assignedEventsResult, earningsResult] = await Promise.all([
            assignedEventIds.length > 0
                ? (supabase.from('events') as any)
                    .select('id, title, status, start_time')
                    .in('id', assignedEventIds)
                    .order('start_time', { ascending: false })
                : Promise.resolve({ data: [] as any[] }),
            (supabase.from('speaker_earnings') as any)
                .select('net_amount, status, month_key')
                .eq('speaker_id', profile.id),
        ])

        const allEvents = [...createdEvents, ...(assignedEventsResult.data || [])]
            .sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

        const attendeeCounts = await getUniqueEventAccessCounts(
            supabase,
            allEvents.map((evt: any) => evt.id)
        )

        let totalAttendees = 0
        const eventsWithAttendees = allEvents.map((evt: any) => {
            const attendeeCount = attendeeCounts[evt.id] || 0
            totalAttendees += attendeeCount
            return {
                ...evt,
                attendee_count: attendeeCount,
            }
        })

        const allEarnings = earningsResult.data || []
        const currentMonth = new Date().toISOString().slice(0, 7)
        const totalAccumulated = allEarnings
            .filter((earning: any) => earning.status !== 'voided')
            .reduce((sum: number, earning: any) => sum + Number(earning.net_amount), 0)
        const availableForPayment = allEarnings
            .filter((earning: any) => earning.status === 'released')
            .reduce((sum: number, earning: any) => sum + Number(earning.net_amount), 0)
        const pendingAmount = allEarnings
            .filter((earning: any) => earning.status === 'pending')
            .reduce((sum: number, earning: any) => sum + Number(earning.net_amount), 0)
        const currentMonthEarnings = allEarnings
            .filter((earning: any) => earning.month_key === currentMonth && earning.status !== 'voided')
            .reduce((sum: number, earning: any) => sum + Number(earning.net_amount), 0)
        const nextPaymentDate = new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0
        ).toISOString().split('T')[0]

        return (
            <div className="space-y-6">
                <DashboardAccessShortcut />
                <PonenteDashboard
                    userName={userName}
                    greeting={greeting}
                    totalEvents={allEvents.length}
                    upcomingEvents={allEvents.filter((event: any) => event.status === 'upcoming' || event.status === 'live').length}
                    totalAttendees={totalAttendees}
                    profileCompleteness={profileCompleteness}
                    events={eventsWithAttendees}
                    totalAccumulated={Math.round(totalAccumulated * 100) / 100}
                    availableForPayment={Math.round(availableForPayment * 100) / 100}
                    pendingAmount={Math.round(pendingAmount * 100) / 100}
                    currentMonthEarnings={Math.round(currentMonthEarnings * 100) / 100}
                    nextPaymentDate={nextPaymentDate}
                />
            </div>
        )
    }

    return (
        <div className="py-12 text-center">
            <h1 className="text-2xl font-bold">Bienvenido</h1>
            <p className="text-muted-foreground">Tu rol no tiene un dashboard asignado.</p>
        </div>
    )
}

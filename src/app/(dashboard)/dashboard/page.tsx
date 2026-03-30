import { createClient, getUserProfile } from '@/lib/supabase/server'
import { PsychologistDashboard, PatientDashboard, AdminDashboard, PonenteDashboard } from '@/components/dashboard'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ActivityItem } from '@/components/dashboard/ui/ActivityFeed'
import type { ContentItem } from '@/components/dashboard/ui/ContentCarousel'
import { getAssignedPsychologistForPatient } from '@/lib/supabase/queries/relationships'
import { getCommercialAccessContext } from '@/lib/access/commercial'
import { canAccessClinicalWorkspace, getPsychologistDashboardLevel } from '@/lib/access/internal-modules'
import { getEventsWithRegistration } from '@/lib/supabase/queries/events'
import { getVisibleResources } from '@/lib/supabase/queries/resources'
import { ArrowRight, Library } from 'lucide-react'

// Helper to calculate profile completeness for psychologists
function calculatePsychologistCompleteness(profile: any): number {
    const fields = [
        'full_name', 'avatar_url', 'phone', 'cedula_profesional',
        'specialty', 'bio', 'education', 'therapeutic_approaches',
        'populations_served', 'hourly_rate'
    ]
    let filled = 0
    for (const field of fields) {
        const val = profile[field]
        if (val && (!Array.isArray(val) || val.length > 0)) filled++
    }
    return Math.round((filled / fields.length) * 100)
}

// Helper to calculate speaker profile completeness
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

// Helper: relative time
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

export default async function DashboardPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    const userName = profile.full_name?.split(' ')[0] || 'Usuario'
    const userRole = profile.role
    const commercialAccess = await getCommercialAccessContext({
        supabase,
        userId: profile.id,
        profile,
    })
    const effectiveMembershipLevel = commercialAccess?.membershipLevel ?? 0

    if (userRole === 'support') {
        redirect('/dashboard/admin/operations')
    }

    // ===== ADMIN DASHBOARD =====
    if (userRole === 'admin') {
        const { getAnalytics } = await import('@/lib/supabase/queries/analytics')
        const analytics = await getAnalytics()

        const { count: totalUsers } = await (supabase
            .from('profiles') as any)
            .select('*', { count: 'exact', head: true })

        const { count: totalPsychologists } = await (supabase
            .from('profiles') as any)
            .select('*', { count: 'exact', head: true })
            .eq('role', 'psychologist')

        const { count: totalPatients } = await (supabase
            .from('profiles') as any)
            .select('*', { count: 'exact', head: true })
            .eq('role', 'patient')

        const { count: activeEvents } = await (supabase
            .from('events') as any)
            .select('*', { count: 'exact', head: true })
            .eq('status', 'upcoming')

        // Recent users (last 5 registered)
        const { data: recentUsersData } = await (supabase
            .from('profiles') as any)
            .select('id, full_name, role, created_at')
            .order('created_at', { ascending: false })
            .limit(5)

        // Users this week
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { count: usersThisWeek } = await (supabase
            .from('profiles') as any)
            .select('*', { count: 'exact', head: true })
            .gte('created_at', weekAgo)

        // Events this month
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        const { count: eventsThisMonth } = await (supabase
            .from('events') as any)
            .select('*', { count: 'exact', head: true })
            .gte('created_at', monthStart)

        // Pending referrals
        const { count: pendingReferrals } = await (supabase
            .from('referrals') as any)
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')

        // Build activity feed from recent data
        const adminActivity: ActivityItem[] = (recentUsersData || []).map((u: any) => ({
            icon: 'UserPlus',
            iconColor: 'text-blue-500',
            title: `${u.full_name || 'Usuario'} se registró`,
            description: u.role === 'psychologist' ? 'Nuevo psicólogo' : u.role === 'ponente' ? 'Nuevo ponente' : 'Nuevo usuario',
            timeAgo: timeAgo(u.created_at),
        }))

        return (
            <div className="space-y-6">
                <DashboardAccessShortcut />
                <AdminDashboard
                    totalUsers={totalUsers || 0}
                    totalPsychologists={totalPsychologists || 0}
                    totalPatients={totalPatients || 0}
                    activeEvents={activeEvents || 0}
                    userName={userName}
                    recentUsers={recentUsersData || []}
                    recentActivity={adminActivity}
                    usersThisWeek={usersThisWeek || 0}
                    eventsThisMonth={eventsThisMonth || 0}
                    pendingReferrals={pendingReferrals || 0}
                    mrr={Math.round((analytics.mrr || 0) * 100) / 100}
                    eventsGmv={Math.round((analytics.eventsGmv || 0) * 100) / 100}
                />
            </div>
        )
    }

    // ===== PSYCHOLOGIST DASHBOARD =====
    if (userRole === 'psychologist') {
        const psychologistViewer = {
            role: userRole,
            membershipLevel: effectiveMembershipLevel,
            membershipSpecializationCode: (profile as any)?.membership_specialization_code ?? null,
        }
        const dashboardMembershipLevel = getPsychologistDashboardLevel(psychologistViewer)
        const hasClinicalWorkspace = canAccessClinicalWorkspace(psychologistViewer)
        const profileCompleteness = calculatePsychologistCompleteness(profile)
        const visibleEvents = await getEventsWithRegistration()
        const visibleResources = await getVisibleResources()
        const upcomingVisibleEvents = visibleEvents
            .filter((event) => event.status === 'upcoming')
            .slice(0, 4)
        const recentVisibleResources = visibleResources.slice(0, 3)

        let patientCount = 0
        let appointmentsToday = 0
        let hoursThisMonth = 0
        let upcomingAppointments: any[] = []
        const activeEvents = upcomingVisibleEvents.length
        const availableResources = visibleResources.length
        let eventsAttended = 0
        let completedSessions = 0
        let pendingReferrals = 0

        // Events attended (registrations)
        const { count: regCount } = await (supabase
            .from('event_registrations') as any)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
        eventsAttended = regCount || 0

        // Clinical suite data
        if (hasClinicalWorkspace) {
            const { count: pCount } = await (supabase
                .from('patient_psychologist_relationships') as any)
                .select('*', { count: 'exact', head: true })
                .eq('psychologist_id', profile.id)
                .eq('status', 'active')
            patientCount = pCount || 0

            const today = new Date().toISOString().split('T')[0]
            const { count: aToday } = await (supabase
                .from('appointments') as any)
                .select('*', { count: 'exact', head: true })
                .eq('psychologist_id', profile.id)
                .eq('status', 'confirmed')
                .gte('start_time', `${today}T00:00:00`)
                .lt('start_time', `${today}T23:59:59`)
            appointmentsToday = aToday || 0

            // Hours this month
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
            const { data: monthAppointments } = await (supabase
                .from('appointments') as any)
                .select('start_time, end_time')
                .eq('psychologist_id', profile.id)
                .eq('status', 'completed')
                .gte('start_time', startOfMonth)

            hoursThisMonth = (monthAppointments || []).reduce((acc: number, curr: any) => {
                const start = new Date(curr.start_time).getTime()
                const end = new Date(curr.end_time).getTime()
                return acc + (end - start) / (1000 * 60 * 60)
            }, 0)

            // Completed sessions total
            const { count: sessCount } = await (supabase
                .from('appointments') as any)
                .select('*', { count: 'exact', head: true })
                .eq('psychologist_id', profile.id)
                .eq('status', 'completed')
            completedSessions = sessCount || 0

            // Upcoming appointments
            const { data: uAppointments } = await (supabase
                .from('appointments') as any)
                .select(`
                    id,
                    start_time,
                    patient:profiles!appointments_patient_id_fkey(full_name)
                `)
                .eq('psychologist_id', profile.id)
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(5)
            upcomingAppointments = uAppointments || []

            // Pending referrals
            const { count: refCount } = await (supabase
                .from('referrals') as any)
                .select('*', { count: 'exact', head: true })
                .eq('referring_psychologist_id', profile.id)
            pendingReferrals = refCount || 0
        }

        // Build activity feed
        const recentActivity: ActivityItem[] = []

        if (hasClinicalWorkspace) {
            // Recent completed appointments
            const { data: recentApts } = await (supabase
                .from('appointments') as any)
                .select('start_time, patient:profiles!appointments_patient_id_fkey(full_name)')
                .eq('psychologist_id', profile.id)
                .eq('status', 'completed')
                .order('start_time', { ascending: false })
                .limit(3)

            for (const apt of recentApts || []) {
                recentActivity.push({
                    icon: 'Calendar',
                    iconColor: 'text-emerald-500',
                    title: `Sesión con ${apt.patient?.full_name || 'Paciente'}`,
                    description: 'Sesión completada',
                    timeAgo: timeAgo(apt.start_time),
                })
            }

            // Recent tasks
            const { data: recentTasks } = await (supabase
                .from('tasks') as any)
                .select('title, created_at')
                .eq('psychologist_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(2)

            for (const task of recentTasks || []) {
                recentActivity.push({
                    icon: 'CheckSquare',
                    iconColor: 'text-blue-500',
                    title: `Tarea asignada: ${task.title}`,
                    timeAgo: timeAgo(task.created_at),
                })
            }
        }

        // Build content items
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
                    patientCount={patientCount}
                    appointmentsToday={appointmentsToday}
                    hoursMonth={Math.round(hoursThisMonth * 10) / 10}
                    userName={userName}
                    upcomingAppointments={upcomingAppointments}
                    activeEvents={activeEvents}
                    availableResources={availableResources}
                    profileCompleteness={profileCompleteness}
                    eventsAttended={eventsAttended}
                    completedSessions={completedSessions}
                    recentActivity={recentActivity}
                    contentItems={contentItems}
                    pendingReferrals={pendingReferrals}
                />
            </div>
        )
    }

    // ===== PATIENT DASHBOARD =====
    if (userRole === 'patient') {
        const assignedPsychologist = await getAssignedPsychologistForPatient(profile.id)
        const psychologistName = assignedPsychologist?.full_name || null
        const visibleEvents = await getEventsWithRegistration()

        // Upcoming appointments count
        const { count: appointmentCount } = await (supabase
            .from('appointments') as any)
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', profile.id)
            .gte('start_time', new Date().toISOString())

        // Patient resources count
        const { count: resourceCount } = await (supabase
            .from('patient_resources') as any)
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', profile.id)

        // Completed sessions
        const { count: sessionsCount } = await (supabase
            .from('appointments') as any)
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', profile.id)
            .eq('status', 'completed')

        // Tasks data
        const { data: allTasks } = await (supabase
            .from('tasks') as any)
            .select('id, title, type, status, due_date')
            .eq('patient_id', profile.id)
            .order('due_date', { ascending: true })

        const completedTaskCount = (allTasks || []).filter((t: any) => t.status === 'completed' || t.status === 'reviewed').length
        const pendingTasks = (allTasks || []).filter((t: any) => t.status === 'pending' || t.status === 'in_progress')

        // Next appointment
        let nextAppointment = null
        const { data: nextApt } = await (supabase
            .from('appointments') as any)
            .select('start_time')
            .eq('patient_id', profile.id)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(1)

        if (nextApt && nextApt.length > 0) {
            nextAppointment = {
                start_time: nextApt[0].start_time,
                psychologist_name: psychologistName || 'Tu psicólogo',
            }
        }

        // Content items for patient
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
                    upcomingAppointments={appointmentCount || 0}
                    resourcesAvailable={resourceCount || 0}
                    userName={userName}
                    completedSessions={sessionsCount || 0}
                    completedTasks={completedTaskCount}
                    totalTasks={(allTasks || []).length}
                    pendingTasks={pendingTasks.slice(0, 3)}
                    nextAppointment={nextAppointment}
                    contentItems={contentItems}
                />
            </div>
        )
    }

    // ===== PONENTE DASHBOARD =====
    if (userRole === 'ponente') {
        // Speaker profile
        const { data: speaker } = await (supabase
            .from('speakers') as any)
            .select('*')
            .eq('id', profile.id)
            .single()

        const profileCompleteness = calculateSpeakerCompleteness(speaker)

        // Events created by ponente
        const { data: ponenteEvents } = await (supabase
            .from('events') as any)
            .select('id, title, status, start_time')
            .eq('created_by', profile.id)
            .order('start_time', { ascending: false })
            .limit(10)

        const allEvents = ponenteEvents || []
        const totalEvents = allEvents.length
        const upcomingEvents = allEvents.filter((e: any) => e.status === 'upcoming' || e.status === 'live').length

        // Get attendee counts per event
        let totalAttendees = 0
        const eventsWithAttendees: any[] = []

        for (const evt of allEvents) {
            const { count: attendeeCount } = await (supabase
                .from('event_registrations') as any)
                .select('*', { count: 'exact', head: true })
                .eq('event_id', evt.id)
            const cnt = attendeeCount || 0
            totalAttendees += cnt
            eventsWithAttendees.push({ ...evt, attendee_count: cnt })
        }

        // Fetch financial data for ponente
        const { data: earningsData } = await (supabase
            .from('speaker_earnings') as any)
            .select('net_amount, status, month_key')
            .eq('speaker_id', profile.id)

        const allEarnings = earningsData || []
        const currentMonth = new Date().toISOString().slice(0, 7)

        const totalAccumulated = allEarnings
            .filter((e: any) => e.status !== 'voided')
            .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

        const availableForPayment = allEarnings
            .filter((e: any) => e.status === 'released')
            .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

        const pendingAmount = allEarnings
            .filter((e: any) => e.status === 'pending')
            .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

        const currentMonthEarnings = allEarnings
            .filter((e: any) => e.month_key === currentMonth && e.status !== 'voided')
            .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

        const nextPaymentDate = new Date(
            new Date().getFullYear(), new Date().getMonth() + 1, 0
        ).toISOString().split('T')[0]

        return (
            <div className="space-y-6">
                <DashboardAccessShortcut />
                <PonenteDashboard
                    userName={userName}
                    totalEvents={totalEvents}
                    upcomingEvents={upcomingEvents}
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

    // Fallback
    return (
        <div className="text-center py-12">
            <h1 className="text-2xl font-bold">Bienvenido</h1>
            <p className="text-muted-foreground">Tu rol no tiene un dashboard asignado.</p>
        </div>
    )
}

import { getCurrentInternalAccessContext } from '@/lib/access/internal-server'
import { canAccessCalendarModule } from '@/lib/access/internal-modules'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NewAppointmentButton, AppointmentActions } from './calendar-forms'
import {
    Calendar,
    Clock,
    Video,
    MapPin,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Timer
} from 'lucide-react'

// Type for appointments with patient/psychologist info
interface AppointmentWithDetails {
    id: string
    start_time: string
    end_time: string
    status: string
    type: string
    notes: string | null
    meeting_link: string | null
    patient: { full_name: string } | null
    psychologist: { full_name: string } | null
}

export default async function CalendarPage() {
    const { supabase, profile, viewer } = await getCurrentInternalAccessContext()

    if (!profile || !viewer) {
        redirect('/auth/login')
    }

    const userRole = profile.role
    const today = new Date()

    if (!canAccessCalendarModule(viewer)) {
        if (userRole === 'psychologist') {
            redirect('/dashboard/subscription')
        }

        redirect('/dashboard')
    }

    // Fetch appointments based on role
    let appointments: AppointmentWithDetails[] = []
    let patients: { id: string; full_name: string | null }[] = []

    if (userRole === 'psychologist') {
        // Get psychologist's patients for the form
        const { data: relationships } = await (supabase
            .from('patient_psychologist_relationships') as any)
            .select('patient_id')
            .eq('psychologist_id', profile.id)
            .eq('status', 'active')

        if (relationships && relationships.length > 0) {
            const patientIds = relationships.map((r: any) => r.patient_id)
            const { data: patientProfiles } = await (supabase
                .from('profiles') as any)
                .select('id, full_name')
                .in('id', patientIds)
            patients = patientProfiles || []
        }

        const { data } = await (supabase
            .from('appointments') as any)
            .select(`
                id, start_time, end_time, status, type, notes, meeting_link,
                patient:patient_id(full_name)
            `)
            .eq('psychologist_id', profile.id)
            .gte('start_time', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
            .neq('status', 'cancelled')
            .order('start_time', { ascending: true })
            .limit(50)

        appointments = (data || []).map((apt: any) => ({
            ...apt,
            patient: apt.patient,
            psychologist: null
        }))
    } else if (userRole === 'patient') {
        const { data } = await (supabase
            .from('appointments') as any)
            .select(`
                id, start_time, end_time, status, type, notes, meeting_link,
                psychologist:psychologist_id(full_name)
            `)
            .eq('patient_id', profile.id)
            .gte('start_time', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
            .neq('status', 'cancelled')
            .order('start_time', { ascending: true })
            .limit(50)

        appointments = (data || []).map((apt: any) => ({
            ...apt,
            patient: null,
            psychologist: apt.psychologist
        }))
    } else if (userRole === 'admin') {
        const { data } = await (supabase
            .from('appointments') as any)
            .select(`
                id, start_time, end_time, status, type, notes, meeting_link,
                patient:patient_id(full_name),
                psychologist:psychologist_id(full_name)
            `)
            .gte('start_time', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
            .order('start_time', { ascending: true })
            .limit(50)

        appointments = data || []
    }

    // Group appointments by day
    const groupedByDay = appointments.reduce((acc, apt) => {
        const dayKey = new Date(apt.start_time).toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
        if (!acc[dayKey]) acc[dayKey] = []
        acc[dayKey].push(apt)
        return acc
    }, {} as Record<string, AppointmentWithDetails[]>)

    // Format time
    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    // Status config
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Pendiente',
                    color: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow',
                    icon: <Timer className="h-3 w-3" />,
                    dot: 'bg-brand-yellow'
                }
            case 'confirmed':
                return {
                    label: 'Confirmada',
                    color: 'bg-brand-brown text-brand-brown dark:bg-brand-brown/30 dark:text-brand-brown',
                    icon: <CheckCircle2 className="h-3 w-3" />,
                    dot: 'bg-brand-brown'
                }
            case 'completed':
                return {
                    label: 'Completada',
                    color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
                    icon: <CheckCircle2 className="h-3 w-3" />,
                    dot: 'bg-neutral-400'
                }
            case 'cancelled':
                return {
                    label: 'Cancelada',
                    color: 'surface-alert-error dark:bg-red-900/30 dark:text-red-300',
                    icon: <XCircle className="h-3 w-3" />,
                    dot: 'bg-red-500'
                }
            default:
                return {
                    label: status,
                    color: 'bg-gray-100 text-gray-800',
                    icon: null,
                    dot: 'bg-gray-400'
                }
        }
    }

    // Calculate stats
    const totalAppointments = appointments.length
    const confirmedCount = appointments.filter(a => a.status === 'confirmed').length
    const pendingCount = appointments.filter(a => a.status === 'pending').length

    // Get today's appointments
    const todayStr = today.toDateString()
    const todayAppointments = appointments.filter(a => new Date(a.start_time).toDateString() === todayStr)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <CalendarDays className="h-7 w-7 text-primary" />
                        {userRole === 'psychologist' && 'Mi Agenda'}
                        {userRole === 'patient' && 'Mis Citas'}
                        {userRole === 'admin' && 'Todas las Citas'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {userRole === 'psychologist' && 'Gestiona tus citas y sesiones con pacientes'}
                        {userRole === 'patient' && 'Revisa tus próximas citas programadas'}
                        {userRole === 'admin' && 'Vista general de todas las citas del sistema'}
                    </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    {userRole === 'patient' && (
                        <Button asChild>
                            <Link href="/dashboard/booking">
                                <Calendar className="mr-2 h-4 w-4" />
                                Agendar Cita
                            </Link>
                        </Button>
                    )}
                    {userRole === 'psychologist' && (
                        <NewAppointmentButton patients={patients} />
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <CalendarDays className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{todayAppointments.length}</p>
                                <p className="text-xs text-muted-foreground">Hoy</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-brand-brown dark:bg-brand-brown/30">
                                <CheckCircle2 className="h-5 w-5 text-brand-brown" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{confirmedCount}</p>
                                <p className="text-xs text-muted-foreground">Confirmadas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-brand-yellow dark:bg-brand-yellow/30">
                                <Timer className="h-5 w-5 text-brand-yellow" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingCount}</p>
                                <p className="text-xs text-muted-foreground">Pendientes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-brand-yellow dark:bg-brand-yellow/30">
                                <Calendar className="h-5 w-5 text-brand-yellow" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalAppointments}</p>
                                <p className="text-xs text-muted-foreground">Total próximas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Appointments List */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Próximas Citas</CardTitle>
                    <CardDescription>
                        {totalAppointments === 0
                            ? 'No hay citas programadas'
                            : `${totalAppointments} cita${totalAppointments > 1 ? 's' : ''} en tu agenda`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {appointments.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-lg mb-1">Sin citas programadas</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                {userRole === 'psychologist'
                                    ? 'Usa el botón "Nueva Cita" para agendar una sesión con un paciente.'
                                    : 'Agenda una cita con tu psicólogo para comenzar.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedByDay).map(([dayLabel, dayAppointments]) => {
                                const isToday = new Date(dayAppointments[0].start_time).toDateString() === todayStr
                                return (
                                    <div key={dayLabel}>
                                        {/* Day Header */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`h-2 w-2 rounded-full ${isToday ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                                            <h3 className={`text-sm font-semibold capitalize ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {isToday ? '📅 Hoy — ' : ''}{dayLabel}
                                            </h3>
                                        </div>

                                        {/* Day Appointments */}
                                        <div className="space-y-2 ml-3 border-l-2 border-muted pl-4">
                                            {dayAppointments.map((apt) => {
                                                const statusConfig = getStatusConfig(apt.status)
                                                return (
                                                    <div
                                                        key={apt.id}
                                                        className="group relative p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                    >
                                                        {/* Status dot */}
                                                        <div className={`absolute left-[-1.35rem] top-5 w-2.5 h-2.5 rounded-full border-2 border-background ${statusConfig.dot}`} />

                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                {/* Name & Status */}
                                                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                                    <span className="font-medium truncate">
                                                                        {userRole === 'psychologist' && (apt.patient?.full_name || 'Paciente')}
                                                                        {userRole === 'patient' && (apt.psychologist?.full_name || 'Psicólogo')}
                                                                        {userRole === 'admin' && `${apt.patient?.full_name || '?'} → ${apt.psychologist?.full_name || '?'}`}
                                                                    </span>
                                                                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.color}`}>
                                                                        {statusConfig.icon}
                                                                        {statusConfig.label}
                                                                    </span>
                                                                </div>

                                                                {/* Time & Type */}
                                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Clock className="h-3.5 w-3.5" />
                                                                        {formatTime(apt.start_time)} — {formatTime(apt.end_time)}
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1">
                                                                        {apt.type === 'video' ? (
                                                                            <><Video className="h-3.5 w-3.5" /> Online</>
                                                                        ) : (
                                                                            <><MapPin className="h-3.5 w-3.5" /> Presencial</>
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                {/* Notes */}
                                                                {apt.notes && (
                                                                    <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">
                                                                        {apt.notes}
                                                                    </p>
                                                                )}

                                                                {/* Actions */}
                                                                <AppointmentActions appointment={apt} userRole={userRole} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


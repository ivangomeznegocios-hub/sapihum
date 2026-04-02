import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, CalendarCheck2, CalendarDays, Plus, RefreshCcw, ShieldCheck } from 'lucide-react'
import { getCurrentInternalAccessContext } from '@/lib/access/internal-server'
import { canAccessCalendarModule } from '@/lib/access/internal-modules'
import { getGoogleCalendarEventsForUser, getGoogleIntegrationForUser, isGoogleCalendarSyncAvailable } from '@/lib/calendar-sync'
import { ScheduleCalendar, type ScheduleCalendarItem } from '@/components/calendar/schedule-calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NewAppointmentButton } from './calendar-forms'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function readSingleParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value
}

function getCalendarNoticeMessage(notice: string | undefined) {
    switch (notice) {
        case 'google_connected':
            return {
                tone: 'success',
                text: 'Google Calendar quedo conectado. A partir de ahora, esta agenda puede mostrar tus bloques externos y evitar cruces.',
            }
        case 'google_denied':
            return {
                tone: 'error',
                text: 'Cancelaste la conexion con Google Calendar antes de completarla.',
            }
        case 'google_state_error':
            return {
                tone: 'error',
                text: 'No pudimos validar la conexion con Google Calendar. Intenta de nuevo.',
            }
        case 'google_error':
            return {
                tone: 'error',
                text: 'No fue posible completar la conexion con Google Calendar. Intenta de nuevo.',
            }
        case 'google_unavailable':
            return {
                tone: 'error',
                text: 'La sincronizacion de Google Calendar todavia no esta habilitada.',
            }
        default:
            return null
    }
}

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

function getAppointmentStatusLabel(status: string) {
    switch (status) {
        case 'pending':
            return 'Pendiente'
        case 'confirmed':
            return 'Confirmada'
        case 'completed':
            return 'Completada'
        case 'cancelled':
            return 'Cancelada'
        default:
            return status
    }
}

function getEventStatusLabel(status: string) {
    switch (status) {
        case 'draft':
            return 'Borrador'
        case 'upcoming':
            return 'Programado'
        case 'live':
            return 'En vivo'
        case 'completed':
            return 'Finalizado'
        case 'cancelled':
            return 'Cancelado'
        default:
            return status
    }
}

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
    const { supabase, profile, viewer } = await getCurrentInternalAccessContext()
    const params = await searchParams

    if (!profile || !viewer) {
        redirect('/auth/login')
    }

    if (!canAccessCalendarModule(viewer)) {
        if (profile.role === 'psychologist') {
            redirect('/dashboard/subscription')
        }

        redirect('/dashboard')
    }

    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    const scheduleWindowEnd = new Date(today.getFullYear(), today.getMonth() + 4, 1).toISOString()
    const userRole = profile.role
    const supportsGoogleSync = userRole === 'psychologist' || userRole === 'ponente'
    const googleSyncAvailable = supportsGoogleSync ? await isGoogleCalendarSyncAvailable() : false
    const googleIntegration = googleSyncAvailable
        ? await getGoogleIntegrationForUser(profile.id)
        : null
    const googleConnectHref = `/api/calendar/google/connect?next=${encodeURIComponent('/dashboard/calendar#google-sync')}`
    const calendarNotice = getCalendarNoticeMessage(readSingleParam(params.calendar_notice))

    let patients: { id: string; full_name: string | null }[] = []
    let scheduleItems: ScheduleCalendarItem[] = []
    let externalItems: ScheduleCalendarItem[] = []

    if (userRole === 'psychologist') {
        const { data: relationships } = await (supabase
            .from('patient_psychologist_relationships') as any)
            .select('patient_id')
            .eq('psychologist_id', profile.id)
            .eq('status', 'active')

        if (relationships && relationships.length > 0) {
            const patientIds = relationships.map((relationship: any) => relationship.patient_id)
            const { data: patientProfiles } = await (supabase
                .from('profiles') as any)
                .select('id, full_name')
                .in('id', patientIds)

            patients = patientProfiles || []
        }

        const { data: appointmentsData } = await (supabase
            .from('appointments') as any)
            .select(`
                id, start_time, end_time, status, type, notes, meeting_link,
                patient:patient_id(full_name)
            `)
            .eq('psychologist_id', profile.id)
            .gte('end_time', monthStart)
            .neq('status', 'cancelled')
            .order('start_time', { ascending: true })
            .limit(200)

        const appointments: AppointmentWithDetails[] = (appointmentsData || []).map((appointment: any) => ({
            ...appointment,
            patient: appointment.patient,
            psychologist: null,
        }))

        scheduleItems = appointments.map((appointment) => ({
            id: appointment.id,
            kind: 'appointment',
            title: appointment.patient?.full_name || 'Paciente',
            subtitle: appointment.type === 'video' ? 'Sesion online' : 'Sesion presencial',
            startTime: appointment.start_time,
            endTime: appointment.end_time,
            status: appointment.status,
            statusLabel: getAppointmentStatusLabel(appointment.status),
            modality: appointment.type === 'video' ? 'online' : 'presencial',
            location: appointment.type === 'video' ? null : 'Consulta presencial',
        }))
    } else if (userRole === 'patient') {
        const { data: appointmentsData } = await (supabase
            .from('appointments') as any)
            .select(`
                id, start_time, end_time, status, type, notes, meeting_link,
                psychologist:psychologist_id(full_name)
            `)
            .eq('patient_id', profile.id)
            .gte('end_time', monthStart)
            .neq('status', 'cancelled')
            .order('start_time', { ascending: true })
            .limit(200)

        const appointments: AppointmentWithDetails[] = (appointmentsData || []).map((appointment: any) => ({
            ...appointment,
            patient: null,
            psychologist: appointment.psychologist,
        }))

        scheduleItems = appointments.map((appointment) => ({
            id: appointment.id,
            kind: 'appointment',
            title: appointment.psychologist?.full_name || 'Psicologo',
            subtitle: appointment.type === 'video' ? 'Sesion online' : 'Sesion presencial',
            startTime: appointment.start_time,
            endTime: appointment.end_time,
            status: appointment.status,
            statusLabel: getAppointmentStatusLabel(appointment.status),
            modality: appointment.type === 'video' ? 'online' : 'presencial',
            location: appointment.type === 'video' ? null : 'Consulta presencial',
        }))
    } else if (userRole === 'admin') {
        const { data: appointmentsData } = await (supabase
            .from('appointments') as any)
            .select(`
                id, start_time, end_time, status, type, notes, meeting_link,
                patient:patient_id(full_name),
                psychologist:psychologist_id(full_name)
            `)
            .gte('end_time', monthStart)
            .order('start_time', { ascending: true })
            .limit(200)

        const appointments: AppointmentWithDetails[] = appointmentsData || []

        scheduleItems = appointments.map((appointment) => ({
            id: appointment.id,
            kind: 'appointment',
            title: `${appointment.patient?.full_name || 'Paciente'} -> ${appointment.psychologist?.full_name || 'Psicologo'}`,
            subtitle: appointment.type === 'video' ? 'Sesion online' : 'Sesion presencial',
            startTime: appointment.start_time,
            endTime: appointment.end_time,
            status: appointment.status,
            statusLabel: getAppointmentStatusLabel(appointment.status),
            modality: appointment.type === 'video' ? 'online' : 'presencial',
            location: appointment.type === 'video' ? null : 'Consulta presencial',
        }))
    } else if (userRole === 'ponente') {
        const { data: createdEvents } = await (supabase
            .from('events') as any)
            .select('id, title, start_time, end_time, status, event_type, location')
            .eq('created_by', profile.id)
            .gte('end_time', monthStart)
            .neq('status', 'cancelled')
            .order('start_time', { ascending: true })
            .limit(200)

        const { data: speakerLinks } = await (supabase
            .from('event_speakers') as any)
            .select('event_id')
            .eq('speaker_id', profile.id)

        const relatedEventIds = Array.from(new Set(
            (speakerLinks || []).map((link: any) => link.event_id).filter(Boolean)
        ))

        let assignedEvents: any[] = []

        if (relatedEventIds.length > 0) {
            const { data } = await (supabase
                .from('events') as any)
                .select('id, title, start_time, end_time, status, event_type, location')
                .in('id', relatedEventIds)
                .gte('end_time', monthStart)
                .neq('status', 'cancelled')
                .order('start_time', { ascending: true })
                .limit(200)

            assignedEvents = data || []
        }

        const mergedEvents = new Map<string, any>()

        for (const event of createdEvents || []) {
            mergedEvents.set(event.id, {
                ...event,
                subtitle: 'Curso o evento creado por ti',
            })
        }

        for (const event of assignedEvents) {
            const existingEvent = mergedEvents.get(event.id)

            if (existingEvent) {
                mergedEvents.set(event.id, {
                    ...existingEvent,
                    subtitle: 'Curso a tu cargo dentro de la plataforma',
                })
                continue
            }

            mergedEvents.set(event.id, {
                ...event,
                subtitle: 'Participas como ponente en este evento',
            })
        }

        scheduleItems = Array.from(mergedEvents.values())
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .map((event) => ({
                id: event.id,
                kind: 'event',
                title: event.title || 'Evento',
                subtitle: event.subtitle,
                startTime: event.start_time,
                endTime: event.end_time,
                status: event.status,
                statusLabel: getEventStatusLabel(event.status),
                modality: event.event_type === 'presencial' ? 'presencial' : 'online',
                location: event.event_type === 'presencial' ? (event.location || 'Presencial') : null,
                href: `/dashboard/events/${event.id}`,
            }))
    }

    if (googleSyncAvailable) {
        const externalEvents = await getGoogleCalendarEventsForUser(profile.id, monthStart, scheduleWindowEnd)

        externalItems = externalEvents.map((event) => ({
            id: event.id,
            kind: 'external',
            title: event.title,
            subtitle: event.calendarSummary,
            startTime: event.startTime,
            endTime: event.endTime,
            status: 'busy',
            statusLabel: 'Ocupado',
            modality: event.location ? 'presencial' : null,
            location: event.location,
            isAllDay: event.isAllDay,
            sourceLabel: 'Google Calendar',
        }))
    }

    if (externalItems.length > 0) {
        scheduleItems = [...scheduleItems, ...externalItems].sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
    }

    const totalItems = scheduleItems.length
    const externalItemCount = externalItems.length
    const todayItems = scheduleItems.filter((item) => {
        const itemDate = new Date(item.startTime)
        return itemDate.toDateString() === today.toDateString()
    }).length
    const upcomingItems = scheduleItems.filter((item) => new Date(item.startTime) >= today).length

    return (
        <div className="space-y-6">
            {calendarNotice && (
                <Card className={calendarNotice.tone === 'success'
                    ? 'border-green-200 bg-green-50/70 dark:border-green-900/50 dark:bg-green-950/20'
                    : 'border-red-200 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/20'}>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium">
                            {calendarNotice.text}
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <CalendarDays className="h-7 w-7 text-primary" />
                        {userRole === 'psychologist' && 'Mi Agenda'}
                        {userRole === 'patient' && 'Mis Citas'}
                        {userRole === 'admin' && 'Todas las Citas'}
                        {userRole === 'ponente' && 'Mi Calendario'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {userRole === 'psychologist' && 'Gestiona tus sesiones y revisa que dias ya estan ocupados.'}
                        {userRole === 'patient' && 'Consulta tus citas y visualiza facilmente tu disponibilidad.'}
                        {userRole === 'admin' && 'Vista operativa de las citas registradas dentro de la plataforma.'}
                        {userRole === 'ponente' && 'Revisa tus cursos, eventos y bloqueos externos para evitar dobles reservas.'}
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

                    {userRole === 'ponente' && (
                        <>
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/events">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Ver Eventos
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/dashboard/events/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear Evento
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-2xl font-semibold">{todayItems}</p>
                        <p className="text-sm text-muted-foreground">Bloques de hoy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-2xl font-semibold">{upcomingItems}</p>
                        <p className="text-sm text-muted-foreground">Proximos elementos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-2xl font-semibold">{totalItems}</p>
                        <p className="text-sm text-muted-foreground">
                            {externalItemCount > 0 ? `Total cargado en agenda (${externalItemCount} externos)` : 'Total cargado en agenda'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Disponibilidad protegida
                    </CardTitle>
                    <CardDescription>
                        Las citas y eventos creados aqui bloquean ese horario dentro de la plataforma para ayudar a evitar cruces.
                        {externalItemCount > 0 ? ` Google Calendar tambien suma ${externalItemCount} bloque${externalItemCount === 1 ? '' : 's'} externo${externalItemCount === 1 ? '' : 's'} a esta vista.` : ''}
                    </CardDescription>
                </CardHeader>
            </Card>

            {googleSyncAvailable && (
                <Card id="google-sync" className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Sincronizar con Google Calendar</CardTitle>
                        <CardDescription>
                            {googleIntegration
                                ? 'Tu cuenta ya esta conectada. La plataforma lee tu disponibilidad externa y la refleja en esta agenda para evitar dobles reservas.'
                                : 'Conecta tu cuenta de Google aqui mismo, como en Calendly: inicias sesion una vez y la plataforma empieza a respetar tu agenda externa.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            {googleIntegration?.provider_account_label && (
                                <p className="text-sm font-medium text-foreground">
                                    Cuenta vinculada: {googleIntegration.provider_account_label}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                {googleIntegration
                                    ? 'Si bloqueas una hora en Google, la plataforma la toma en cuenta aqui tambien.'
                                    : 'Despues de conectar, los horarios ocupados de Google apareceran aqui y se usaran para bloquear cruces automaticamente.'}
                            </p>
                        </div>

                        {googleIntegration ? (
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button asChild variant="outline">
                                    <a href={googleConnectHref}>
                                        <RefreshCcw className="mr-2 h-4 w-4" />
                                        Reconectar Google
                                    </a>
                                </Button>
                                <Button asChild>
                                    <Link href="/dashboard/settings?section=calendar#calendar-sync">
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Elegir calendarios
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <Button asChild>
                                <a href={googleConnectHref}>
                                    <CalendarCheck2 className="mr-2 h-4 w-4" />
                                    Conectar Google Calendar
                                </a>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            <ScheduleCalendar
                items={scheduleItems}
                title={userRole === 'ponente' ? 'Calendario de eventos' : 'Calendario de citas'}
                description={userRole === 'ponente'
                    ? 'Tus dias ocupados se marcan para que puedas detectar huecos libres rapidamente, incluyendo bloqueos externos de Google si esta conectado.'
                    : 'Tus citas confirmadas, pendientes y los bloqueos externos de Google se muestran directamente sobre el calendario.'}
            />
        </div>
    )
}

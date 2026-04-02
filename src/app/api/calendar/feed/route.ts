import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildIcsCalendar, type CalendarFeedScope, type IcsCalendarEvent } from '@/lib/calendar-feed'
import { getAppUrl } from '@/lib/config/app-url'

export const dynamic = 'force-dynamic'

const LOOKBACK_DAYS = 30
const LOOKAHEAD_DAYS = 365

function badRequest(message: string, status = 400) {
    return new Response(message, {
        status,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store, max-age=0',
            'X-Robots-Tag': 'noindex, nofollow',
        },
    })
}

function isFeedScope(value: string | null): value is CalendarFeedScope {
    return value === 'appointments' || value === 'speaker-events'
}

function getWindowStart() {
    return new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

function getWindowEnd() {
    return new Date(Date.now() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

function formatAppointmentStatus(status: string) {
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

function formatAppointmentType(type: string) {
    return type === 'in_person' ? 'Presencial' : 'Videollamada'
}

function formatEventType(type: string) {
    switch (type) {
        case 'course':
            return 'Curso'
        case 'on_demand':
            return 'Grabacion'
        case 'presencial':
            return 'Evento presencial'
        case 'live':
        default:
            return 'Evento en vivo'
    }
}

function formatEventStatus(status: string) {
    switch (status) {
        case 'upcoming':
            return 'Proximo'
        case 'live':
            return 'En vivo'
        case 'completed':
            return 'Finalizado'
        case 'draft':
            return 'Borrador'
        case 'cancelled':
            return 'Cancelado'
        default:
            return status
    }
}

function joinDescription(parts: Array<string | null | undefined>) {
    return parts.filter((part): part is string => Boolean(part && part.trim())).join('\n\n')
}

async function getAppointmentEvents(admin: ReturnType<typeof createServiceClient>, profile: { id: string; role: string }) {
    if (!['psychologist', 'patient', 'admin'].includes(profile.role)) {
        return {
            name: 'Agenda clinica',
            description: 'Feed privado de citas clinicas.',
            events: [] as IcsCalendarEvent[],
        }
    }

    let query = (admin
        .from('appointments') as any)
        .select(`
            id,
            patient_id,
            psychologist_id,
            start_time,
            end_time,
            status,
            type,
            notes,
            meeting_link,
            patient:profiles!appointments_patient_id_fkey(full_name),
            psychologist:profiles!appointments_psychologist_id_fkey(full_name, office_address)
        `)
        .neq('status', 'cancelled')
        .gte('start_time', getWindowStart())
        .lte('start_time', getWindowEnd())
        .order('start_time', { ascending: true })

    if (profile.role === 'psychologist') {
        query = query.eq('psychologist_id', profile.id)
    } else if (profile.role === 'patient') {
        query = query.eq('patient_id', profile.id)
    } else {
        query = query.or(`patient_id.eq.${profile.id},psychologist_id.eq.${profile.id}`)
    }

    const { data, error } = await query

    if (error) {
        console.error('[CalendarFeed] Failed to load appointments:', error)
        throw new Error('No fue posible cargar las citas')
    }

    const events = (data ?? []).map((appointment: any) => {
        const patientName = appointment.patient?.full_name || 'Paciente'
        const psychologistName = appointment.psychologist?.full_name || 'Psicologo'
        const counterpartLabel = profile.role === 'patient'
            ? `Cita con ${psychologistName}`
            : profile.role === 'psychologist'
                ? `Cita con ${patientName}`
                : `Cita ${patientName} / ${psychologistName}`
        const description = joinDescription([
            `Estado: ${formatAppointmentStatus(appointment.status)}`,
            `Modalidad: ${formatAppointmentType(appointment.type)}`,
            `Paciente: ${patientName}`,
            `Psicologo: ${psychologistName}`,
            appointment.notes ? `Notas: ${appointment.notes}` : null,
            appointment.meeting_link ? `Enlace de videollamada: ${appointment.meeting_link}` : null,
        ])
        const location = appointment.type === 'in_person'
            ? appointment.psychologist?.office_address || 'Consulta presencial'
            : appointment.meeting_link || 'Online'

        return {
            uid: `appointment-${appointment.id}@comunidadpsicologia.app`,
            title: counterpartLabel,
            start: appointment.start_time,
            end: appointment.end_time,
            description,
            location,
            url: appointment.meeting_link || undefined,
        } satisfies IcsCalendarEvent
    })

    return {
        name: 'Agenda clinica',
        description: 'Citas clinicas sincronizadas desde la plataforma.',
        events,
    }
}

async function getSpeakerEvents(admin: ReturnType<typeof createServiceClient>, profile: { id: string }) {
    const windowStart = getWindowStart()
    const windowEnd = getWindowEnd()

    const [createdResult, linkedResult] = await Promise.all([
        (admin
            .from('events') as any)
            .select('id, title, subtitle, description, start_time, end_time, status, event_type, location, meeting_link, slug')
            .eq('created_by', profile.id)
            .neq('status', 'cancelled')
            .neq('status', 'draft')
            .gte('start_time', windowStart)
            .lte('start_time', windowEnd)
            .order('start_time', { ascending: true }),
        (admin
            .from('event_speakers') as any)
            .select('event_id')
            .eq('speaker_id', profile.id),
    ])

    if (createdResult.error) {
        console.error('[CalendarFeed] Failed to load created events:', createdResult.error)
        throw new Error('No fue posible cargar los eventos creados')
    }

    if (linkedResult.error) {
        console.error('[CalendarFeed] Failed to load speaker links:', linkedResult.error)
        throw new Error('No fue posible cargar los cursos del ponente')
    }

    const linkedIds = Array.from(
        new Set((linkedResult.data ?? []).map((row: any) => row.event_id).filter((value: unknown): value is string => typeof value === 'string' && value.length > 0))
    )

    let linkedEvents: any[] = []

    if (linkedIds.length > 0) {
        const { data, error } = await (admin
            .from('events') as any)
            .select('id, title, subtitle, description, start_time, end_time, status, event_type, location, meeting_link, slug')
            .in('id', linkedIds)
            .neq('status', 'cancelled')
            .neq('status', 'draft')
            .gte('start_time', windowStart)
            .lte('start_time', windowEnd)
            .order('start_time', { ascending: true })

        if (error) {
            console.error('[CalendarFeed] Failed to load linked events:', error)
            throw new Error('No fue posible cargar los eventos asignados')
        }

        linkedEvents = data ?? []
    }

    const dedupedEvents = Array.from(
        new Map(
            [...(createdResult.data ?? []), ...linkedEvents].map((event: any) => [event.id, event])
        ).values()
    )

    const appUrl = getAppUrl()
    const events = dedupedEvents.map((event: any) => ({
        uid: `speaker-event-${event.id}@comunidadpsicologia.app`,
        title: event.title,
        start: event.start_time,
        end: event.end_time || new Date(new Date(event.start_time).getTime() + 60 * 60 * 1000).toISOString(),
        description: joinDescription([
            event.subtitle,
            `Tipo: ${formatEventType(event.event_type)}`,
            `Estado: ${formatEventStatus(event.status)}`,
            event.description,
            event.meeting_link ? `Enlace de acceso: ${event.meeting_link}` : null,
        ]),
        location: event.location || event.meeting_link || 'Online',
        url: event.slug ? `${appUrl}/dashboard/events/${event.id}` : undefined,
    } satisfies IcsCalendarEvent))

    return {
        name: 'Cursos y eventos',
        description: 'Calendario del ponente con cursos y eventos en vivo.',
        events,
    }
}

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token')?.trim() || null
    const scopeParam = request.nextUrl.searchParams.get('scope')

    if (!token) {
        return badRequest('Falta el token del calendario.')
    }

    if (!isFeedScope(scopeParam)) {
        return badRequest('Scope de calendario invalido.')
    }

    const admin = createServiceClient()
    const { data: profile, error } = await (admin
        .from('profiles') as any)
        .select('id, role, full_name')
        .eq('calendar_feed_token', token)
        .maybeSingle()

    if (error) {
        console.error('[CalendarFeed] Failed to load profile by token:', error)
        return badRequest('No fue posible validar este calendario.', 500)
    }

    if (!profile) {
        return badRequest('Este enlace de calendario no existe o ya no es valido.', 404)
    }

    try {
        const calendar = scopeParam === 'appointments'
            ? await getAppointmentEvents(admin, profile)
            : await getSpeakerEvents(admin, profile)

        const calendarName = profile.full_name
            ? `${profile.full_name} - ${calendar.name}`
            : calendar.name
        const ics = buildIcsCalendar({
            name: calendarName,
            description: calendar.description,
            events: calendar.events,
        })

        return new Response(ics, {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': `inline; filename="${scopeParam}.ics"`,
                'Cache-Control': 'no-store, max-age=0',
                'X-Robots-Tag': 'noindex, nofollow',
            },
        })
    } catch (feedError) {
        console.error('[CalendarFeed] Failed to build feed:', feedError)
        return badRequest('No fue posible generar el calendario en este momento.', 500)
    }
}

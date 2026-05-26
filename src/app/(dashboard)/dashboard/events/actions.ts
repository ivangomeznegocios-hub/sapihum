'use server'

import { createClient, getViewerContext } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
import { revalidatePath } from 'next/cache'
import {
    getEffectiveEventPriceForProfile,
    normalizeMemberAccessType,
} from '@/lib/events/pricing'
import { getUniqueEventAccessCount } from '@/lib/events/attendance'
import { grantEventEntitlements } from '@/lib/events/entitlements'
import { getMembershipEntitlementEndsAt } from '@/lib/events/access'
import { slugifyCatalogText } from '@/lib/events/public'
import {
    canCreateEvent,
    canDeleteEvent,
    canManageEventAdvancedSettings,
    canManageOwnedEvent,
    canPublishEvent,
    getEventEditorAccessForUser,
} from '@/lib/events/permissions'
import { getEventSessionOccurrences } from '@/lib/events/sessions'
import { getProgramChildEventIds, syncProgramBundleEntitlementsForIdentity } from '@/lib/events/programs'
import { getCommercialAccessContext } from '@/lib/access/commercial'
import { canViewerReachEventOffer } from '@/lib/access/catalog'
import { sendEmail } from '@/lib/email/index'
import { buildEventRegistrationEmail } from '@/lib/email/templates'
import { DEFAULT_TIMEZONE, formatDateInTimezone, getTimezoneShortLabel, zonedDateTimeToUtcIso } from '@/lib/timezone'
import { findExternalCalendarConflictForUsers } from '@/lib/calendar-sync'
import { createUserNotification } from '@/lib/notifications'
import {
    DEFAULT_SPEAKER_COMPENSATION_TYPE,
    DEFAULT_SPEAKER_PERCENTAGE_RATE,
    normalizeSpeakerCompensationType,
    normalizeSpeakerCompensationValue,
    type SpeakerCompensationType,
} from '@/lib/earnings/compensation'
import { sanitizeMaterialLinks } from '@/lib/material-links'
import {
    contentBelongsToActiveVertical,
    getRelatedVerticalIds,
    replaceContentVerticals,
    resolveVerticalVisibilityInput,
} from '@/lib/supabase/vertical-content'
async function resolveUniqueEventSlug(supabase: any, baseValue: string, eventId?: string) {
    const fallbackBase = slugifyCatalogText(baseValue) || `evento-${crypto.randomUUID().slice(0, 8)}`
    let candidate = fallbackBase
    let suffix = 2

    while (true) {
        let query = (supabase
            .from('events') as any)
            .select('id')
            .eq('slug', candidate)
            .limit(1)

        if (eventId) {
            query = query.neq('id', eventId)
        }

        const { data: existing } = await query.maybeSingle()
        if (!existing) {
            return candidate
        }

        candidate = `${fallbackBase}-${suffix}`
        suffix += 1
    }
}

function readTrimmedString(value: FormDataEntryValue | null) {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function buildDuplicateEventTitle(value: string) {
    const normalized = value.trim()

    if (/\(Copia(?: \d+)?\)$/i.test(normalized)) {
        return normalized
    }

    return `${normalized} (Copia)`
}

function parseIntegerField(value: FormDataEntryValue | null) {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    if (!trimmed) return null

    const parsed = Number.parseInt(trimmed, 10)
    return Number.isFinite(parsed) ? parsed : null
}

function parseFloatField(value: FormDataEntryValue | null) {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    if (!trimmed) return null

    const parsed = Number.parseFloat(trimmed)
    return Number.isFinite(parsed) ? parsed : null
}

function validateMemberDiscountRule(params: {
    price: number
    memberAccessType: string
    memberPrice: number
    canUseAdvancedSettings: boolean
}) {
    if (params.memberAccessType !== 'discounted' || params.price <= 0) {
        return null
    }

    if (params.memberPrice <= 0) {
        return 'Ingresa un precio preferencial para miembros o cambia el tipo de acceso'
    }

    if (!params.canUseAdvancedSettings && params.price >= 200 && params.price - params.memberPrice < 200) {
        return 'El precio miembro debe tener al menos $200 MXN de descuento frente al precio publico'
    }

    return null
}

function parseJsonValue<T>(value: FormDataEntryValue | null, fallback: T): T {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback
    }

    try {
        return JSON.parse(value) as T
    } catch {
        return fallback
    }
}

function normalizeStringList(value: unknown) {
    if (Array.isArray(value)) {
        const items = value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean)

        return items.length > 0 ? items : null
    }

    if (typeof value === 'string') {
        const items = value
            .split(';')
            .map((item) => item.trim())
            .filter(Boolean)

        return items.length > 0 ? items : null
    }

    return null
}

function parseListField(formData: FormData, fieldName: string) {
    if (!formData.has(fieldName)) {
        return undefined
    }

    const rawValue = formData.get(fieldName)
    if (typeof rawValue !== 'string') {
        return null
    }

    const trimmed = rawValue.trim()
    if (!trimmed) {
        return null
    }

    try {
        return normalizeStringList(JSON.parse(trimmed))
    } catch {
        return normalizeStringList(trimmed)
    }
}

function parseMaterialLinksField(formData: FormData, fieldName: string) {
    if (!formData.has(fieldName)) {
        return undefined
    }

    return sanitizeMaterialLinks(parseJsonValue<unknown[]>(formData.get(fieldName), []))
}

function parseRegistrationFields(formData: FormData) {
    const fields = parseJsonValue<Array<{ label?: string; required?: boolean }>>(
        formData.get('registrationFields'),
        []
    )

    return fields
        .map((field) => ({
            label: typeof field?.label === 'string' ? field.label.trim() : '',
            required: Boolean(field?.required),
        }))
        .filter((field) => field.label.length > 0)
}

function parseSpeakerIds(formData: FormData) {
    const speakerIds = parseJsonValue<unknown[]>(formData.get('speakerIds'), [])

    return speakerIds.filter((speakerId): speakerId is string => typeof speakerId === 'string' && speakerId.length > 0)
}

type SpeakerAssignmentInput = {
    speakerId: string
    compensationType: SpeakerCompensationType
    compensationValue: number | null
}

function validateSpeakerAssignments(assignments: SpeakerAssignmentInput[]) {
    const invalidAssignment = assignments.find((assignment) =>
        assignment.compensationType !== 'variable'
        && (!assignment.compensationValue || assignment.compensationValue <= 0)
    )

    if (!invalidAssignment) {
        return null
    }

    return 'Cada ponente con esquema fijo o porcentual necesita un valor mayor a 0.'
}

function parseProgramChildEventIds(formData: FormData) {
    const eventIds = parseJsonValue<unknown[]>(formData.get('programChildEventIds'), [])
    return Array.from(new Set(
        eventIds.filter((eventId): eventId is string => typeof eventId === 'string' && eventId.length > 0)
    ))
}

async function replaceProgramChildEvents(supabase: any, parentEventId: string, childEventIds: string[]) {
    await (supabase.from('event_program_items') as any)
        .delete()
        .eq('parent_event_id', parentEventId)

    const rows = childEventIds
        .filter((childEventId) => childEventId !== parentEventId)
        .map((childEventId, index) => ({
            parent_event_id: parentEventId,
            child_event_id: childEventId,
            display_order: index,
        }))

    if (rows.length === 0) return

    const { error } = await (supabase.from('event_program_items') as any).insert(rows)
    if (error) {
        throw new Error(error.message)
    }
}

function validatePaidMultiSpeakerPublication(params: {
    price: number
    speakerAssignments: SpeakerAssignmentInput[]
    requestedStatus?: string | null
    canUseAdvancedSettings: boolean
}) {
    const isPublishing = params.requestedStatus === 'upcoming' || params.requestedStatus === 'live'
    if (
        params.price > 0
        && params.speakerAssignments.length > 1
        && isPublishing
        && !params.canUseAdvancedSettings
    ) {
        return 'Los eventos pagados con varios ponentes requieren que admin configure el reparto antes de publicar.'
    }

    return null
}

const PUBLIC_EVENT_STATUSES = new Set(['upcoming', 'live', 'completed'])

function isPublicEventStatus(status?: string | null) {
    return Boolean(status && PUBLIC_EVENT_STATUSES.has(status))
}

function normalizeRelationProfile(profile: any) {
    return Array.isArray(profile) ? profile[0] : profile
}

async function validatePublicEventReadiness({
    supabase,
    status,
    title,
    description,
    imageUrl,
    eventType,
    meetingLink,
    location,
    recordingUrl,
    programMode,
    programName,
    programChildEventIds,
    speakerIds,
}: {
    supabase: any
    status?: string | null
    title?: string | null
    description?: string | null
    imageUrl?: string | null
    eventType?: string | null
    meetingLink?: string | null
    location?: string | null
    recordingUrl?: string | null
    programMode?: string | null
    programName?: string | null
    programChildEventIds?: string[]
    speakerIds: string[]
}) {
    if (!isPublicEventStatus(status)) {
        return null
    }

    const missing: string[] = []
    if (!title) missing.push('titulo')
    if (!description) missing.push('descripcion')
    if (!imageUrl) missing.push('imagen')
    if (programMode === 'program') {
        if (!programName) missing.push('nombre de la programacion')
        if ((programChildEventIds ?? []).length === 0) missing.push('eventos incluidos')
    }

    if (eventType === 'presencial') {
        if (!location) missing.push('ubicacion')
    } else if (status === 'completed') {
        if (!recordingUrl && !meetingLink) missing.push('enlace de grabacion')
    } else if (!meetingLink) {
        missing.push('enlace de acceso')
    }

    const uniqueSpeakerIds = Array.from(new Set(speakerIds.filter(Boolean)))
    if (uniqueSpeakerIds.length === 0) {
        missing.push('ponente')
    } else {
        const { data: speakers, error } = await (supabase
            .from('speakers') as any)
            .select(`
                id,
                photo_url,
                profile:profiles!speakers_id_fkey (
                    full_name,
                    avatar_url
                )
            `)
            .in('id', uniqueSpeakerIds)

        if (error) {
            return 'No fue posible validar los ponentes antes de publicar.'
        }

        const speakerMap = new Map<string, any>((speakers ?? []).map((speaker: any) => [speaker.id, speaker]))
        const incompleteSpeaker = uniqueSpeakerIds.some((speakerId) => {
            const speaker = speakerMap.get(speakerId)
            const profile = normalizeRelationProfile(speaker?.profile)
            return !speaker || !profile?.full_name || !(speaker.photo_url || profile.avatar_url)
        })

        if (incompleteSpeaker) {
            missing.push('nombre y foto de cada ponente')
        }
    }

    if (missing.length === 0) {
        return null
    }

    return `Para publicar este evento falta: ${missing.join(', ')}. Puedes guardarlo como borrador mientras lo completas.`
}

function parseSpeakerAssignments(formData: FormData): SpeakerAssignmentInput[] {
    const assignments = parseJsonValue<unknown[]>(formData.get('speakerAssignments'), [])

    const parsedAssignments = assignments
        .map((assignment) => {
            if (!assignment || typeof assignment !== 'object') return null

            const speakerId = typeof (assignment as any).speakerId === 'string'
                ? (assignment as any).speakerId.trim()
                : ''

            if (!speakerId) return null

            const compensationType = normalizeSpeakerCompensationType((assignment as any).compensationType)
            const compensationValue = normalizeSpeakerCompensationValue(
                compensationType,
                (assignment as any).compensationValue
            )

            return {
                speakerId,
                compensationType,
                compensationValue,
            }
        })
        .filter((assignment): assignment is SpeakerAssignmentInput => Boolean(assignment))

    if (parsedAssignments.length > 0) {
        return parsedAssignments
    }

    return parseSpeakerIds(formData).map((speakerId) => ({
        speakerId,
        compensationType: DEFAULT_SPEAKER_COMPENSATION_TYPE,
        compensationValue: DEFAULT_SPEAKER_PERCENTAGE_RATE,
    }))
}

function parseSessionConfig(formData: FormData, eventType: string, location: string | null) {
    const parsedConfig = parseJsonValue<Record<string, unknown> | null>(formData.get('sessionConfig'), null)
    const parsedTotalSessions = Number(parsedConfig?.total_sessions || 1)
    const parsedSessionDuration = Number(parsedConfig?.session_duration_minutes || 60)
    const totalSessions = Number.isFinite(parsedTotalSessions) ? Math.max(1, parsedTotalSessions) : 1
    const sessionDurationMinutes = Number.isFinite(parsedSessionDuration)
        ? Math.max(30, parsedSessionDuration)
        : 60
    const recurrence =
        typeof parsedConfig?.recurrence === 'string' && parsedConfig.recurrence.trim()
            ? parsedConfig.recurrence.trim()
            : undefined

    let modality: 'online' | 'presencial' | 'hibrido' = 'online'
    if (parsedConfig?.modality === 'presencial' || eventType === 'presencial') {
        modality = 'presencial'
    } else if (parsedConfig?.modality === 'hibrido') {
        modality = 'hibrido'
    }

    const openAgenda = parsedConfig?.open_agenda === true

    return {
        total_sessions: totalSessions,
        session_duration_minutes: sessionDurationMinutes,
        recurrence,
        modality,
        ...(openAgenda ? { open_agenda: true } : {}),
        ...(location ? { location } : {}),
    }
}

function canBypassEventScheduleConflicts(formData: FormData, canUseAdvancedSettings: boolean) {
    return canUseAdvancedSettings && (
        formData.get('openAgendaMode') === 'on' ||
        formData.get('openAgendaMode') === 'true'
    )
}

async function getDefaultPrimaryVerticalId(supabase: any) {
    const { data } = await (supabase
        .from('verticals') as any)
        .select('id')
        .eq('code', 'psicologia')
        .maybeSingle()

    return data?.id ?? null
}

type ParsedSessionSchedule = {
    sessionConfig: ReturnType<typeof parseSessionConfig> & {
        sessions: { start_time: string; end_time: string }[]
    }
    firstSession: { startTimeIso: string; endTimeIso: string; safeDuration: number }
    sessions: { startTimeIso: string; endTimeIso: string }[]
}

function buildEventDateRange(dateValue: string, timeValue: string, durationMinutes: number) {
    const startTimeIso = zonedDateTimeToUtcIso(dateValue, timeValue, DEFAULT_TIMEZONE)
    if (!startTimeIso) return null

    const startTime = new Date(startTimeIso)
    if (Number.isNaN(startTime.getTime())) return null

    const safeDuration = Math.max(30, durationMinutes || 60)
    const endTime = new Date(startTime.getTime() + safeDuration * 60000)

    return {
        startTimeIso: startTime.toISOString(),
        endTimeIso: endTime.toISOString(),
        safeDuration,
    }
}

function buildWeeklySessionSchedule(
    firstSession: { startTimeIso: string; endTimeIso: string; safeDuration: number },
    totalSessions: number
) {
    return Array.from({ length: totalSessions }, (_, index) => {
        const startTime = new Date(new Date(firstSession.startTimeIso).getTime() + index * 7 * 24 * 60 * 60 * 1000)
        const endTime = new Date(startTime.getTime() + firstSession.safeDuration * 60000)

        return {
            startTimeIso: startTime.toISOString(),
            endTimeIso: endTime.toISOString(),
        }
    })
}

function parseSessionSchedule(
    formData: FormData,
    eventType: string,
    location: string | null,
    date: string | null,
    time: string | null,
    duration: number
): ParsedSessionSchedule | { error: string } {
    const sessionConfig = parseSessionConfig(formData, eventType, location)

    if (!date || !time) {
        return { error: 'Faltan campos requeridos' }
    }

    const firstSession = buildEventDateRange(date, time, duration)
    if (!firstSession) {
        return { error: 'La fecha u hora del evento no son validas' }
    }

    const rawSchedule = parseJsonValue<unknown[]>(formData.get('sessionSchedule'), [])
    const parsedSchedule = rawSchedule
        .map((session) => {
            if (!session || typeof session !== 'object') return null

            const sessionDate = typeof (session as any).date === 'string' ? (session as any).date.trim() : ''
            const sessionTime = typeof (session as any).time === 'string' ? (session as any).time.trim() : ''
            const range = buildEventDateRange(sessionDate, sessionTime, sessionConfig.session_duration_minutes)

            return range
                ? {
                    startTimeIso: range.startTimeIso,
                    endTimeIso: range.endTimeIso,
                }
                : null
        })
        .filter((session): session is { startTimeIso: string; endTimeIso: string } => Boolean(session))

    let sessions = parsedSchedule
    if (sessions.length === 0) {
        sessions = sessionConfig.total_sessions > 1 && sessionConfig.recurrence
            ? buildWeeklySessionSchedule(firstSession, sessionConfig.total_sessions)
            : [{ startTimeIso: firstSession.startTimeIso, endTimeIso: firstSession.endTimeIso }]
    }

    if (sessions.length !== sessionConfig.total_sessions) {
        return { error: `Completa las ${sessionConfig.total_sessions} fechas de sesiones antes de guardar.` }
    }

    const orderedSessions = [...sessions].sort(
        (a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime()
    )

    return {
        sessionConfig: {
            ...sessionConfig,
            sessions: orderedSessions.map((session) => ({
                start_time: session.startTimeIso,
                end_time: session.endTimeIso,
            })),
        },
        firstSession: {
            startTimeIso: orderedSessions[0].startTimeIso,
            endTimeIso: orderedSessions[0].endTimeIso,
            safeDuration: sessionConfig.session_duration_minutes,
        },
        sessions: orderedSessions,
    }
}

function formatConflictDateLabel(dateValue: string) {
    return `${formatDateInTimezone(dateValue, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }, DEFAULT_TIMEZONE)} CDMX`
}

type EventScheduleConflict = {
    id: string
    title: string | null
    start_time: string
    source: 'creator' | 'speaker'
}

function addExpandedScheduleConflicts({
    conflicts,
    events,
    startTimeIso,
    endTimeIso,
    source,
}: {
    conflicts: Map<string, EventScheduleConflict>
    events: any[] | null | undefined
    startTimeIso: string
    endTimeIso: string
    source: EventScheduleConflict['source']
}) {
    const requestedStart = new Date(startTimeIso).getTime()
    const requestedEnd = new Date(endTimeIso).getTime()

    for (const event of events || []) {
        if (conflicts.has(event.id)) continue

        const overlappingSession = getEventSessionOccurrences(event).find((session) => {
            const sessionStart = new Date(session.start_time).getTime()
            const sessionEnd = new Date(session.end_time).getTime()
            return sessionStart < requestedEnd && sessionEnd > requestedStart
        })

        if (overlappingSession) {
            conflicts.set(event.id, {
                id: event.id,
                title: event.title || null,
                start_time: overlappingSession.start_time,
                source,
            })
        }
    }
}

async function findEventScheduleConflict({
    supabase,
    ownerId,
    speakerIds,
    startTimeIso,
    endTimeIso,
    excludeEventId,
}: {
    supabase: any
    ownerId?: string | null
    speakerIds?: string[]
    startTimeIso: string
    endTimeIso: string
    excludeEventId?: string
}): Promise<EventScheduleConflict | null> {
    const conflicts = new Map<string, EventScheduleConflict>()

    if (ownerId) {
        let creatorQuery = (supabase
            .from('events') as any)
            .select('id, title, start_time, end_time, session_config')
            .eq('created_by', ownerId)
            .neq('status', 'cancelled')
            .limit(500)

        if (excludeEventId) {
            creatorQuery = creatorQuery.neq('id', excludeEventId)
        }

        const { data: creatorConflicts } = await creatorQuery

        addExpandedScheduleConflicts({
            conflicts,
            events: creatorConflicts,
            startTimeIso,
            endTimeIso,
            source: 'creator',
        })
    }

    const normalizedSpeakerIds = Array.from(new Set((speakerIds || []).filter(Boolean)))
    if (normalizedSpeakerIds.length > 0) {
        const { data: speakerLinks } = await (supabase
            .from('event_speakers') as any)
            .select('event_id')
            .in('speaker_id', normalizedSpeakerIds)

        const relatedEventIds = Array.from(new Set(
            (speakerLinks || [])
                .map((speakerLink: any) => speakerLink.event_id)
                .filter((eventId: string) => eventId && eventId !== excludeEventId)
        ))

        if (relatedEventIds.length > 0) {
            const { data: speakerConflicts } = await (supabase
                .from('events') as any)
                .select('id, title, start_time, end_time, session_config')
                .in('id', relatedEventIds)
                .neq('status', 'cancelled')
                .limit(500)

            addExpandedScheduleConflicts({
                conflicts,
                events: speakerConflicts,
                startTimeIso,
                endTimeIso,
                source: 'speaker',
            })
        }
    }

    const orderedConflicts = Array.from(conflicts.values()).sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

    return orderedConflicts[0] || null
}

async function findEventScheduleConflictForSessions({
    supabase,
    ownerId,
    speakerIds,
    sessions,
    excludeEventId,
}: {
    supabase: any
    ownerId?: string | null
    speakerIds?: string[]
    sessions: { startTimeIso: string; endTimeIso: string }[]
    excludeEventId?: string
}) {
    for (const session of sessions) {
        const conflict = await findEventScheduleConflict({
            supabase,
            ownerId,
            speakerIds,
            startTimeIso: session.startTimeIso,
            endTimeIso: session.endTimeIso,
            excludeEventId,
        })

        if (conflict) {
            return conflict
        }
    }

    return null
}

function buildEventScheduleConflictMessage(conflict: EventScheduleConflict) {
    const dateLabel = formatConflictDateLabel(conflict.start_time)
    const eventLabel = conflict.title ? `"${conflict.title}"` : 'otro evento'

    if (conflict.source === 'speaker') {
        return `Uno de los ponentes ya esta ocupado con ${eventLabel} (${dateLabel}). Cambia el horario para evitar doble reserva.`
    }

    return `Ese horario se cruza con ${eventLabel} (${dateLabel}). Cambia la fecha u hora para evitar doble reserva.`
}

function buildExternalEventConflictMessage(
    conflict: { providerAccountLabel: string | null; busyStart: string },
    kind: 'owner' | 'speaker' = 'owner'
) {
    const dateLabel = formatConflictDateLabel(conflict.busyStart)
    const accountLabel = conflict.providerAccountLabel ? ` (${conflict.providerAccountLabel})` : ''

    if (kind === 'speaker') {
        return `Uno de los ponentes ya aparece ocupado en Google Calendar${accountLabel} (${dateLabel}). Cambia el horario para evitar doble reserva.`
    }

    return `Ese horario ya aparece ocupado en Google Calendar${accountLabel} (${dateLabel}). Cambia la fecha u hora para evitar doble reserva.`
}

async function getEventSpeakerIds(supabase: any, eventId: string): Promise<string[]> {
    const { data } = await (supabase
        .from('event_speakers') as any)
        .select('speaker_id')
        .eq('event_id', eventId)

    return Array.from(new Set(
        (data || [])
            .map((assignment: any) => assignment.speaker_id)
            .filter((speakerId: string | null): speakerId is string => typeof speakerId === 'string')
    ))
}

export async function registerForEvent(eventId: string, registrationData: Record<string, string> = {}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Get event to check audience requirements and pricing
    const { data: event } = await (supabase
        .from('events') as any)
        .select('id, title, slug, start_time, target_audience, required_subscription, max_attendees, price, member_access_type, member_price, specialization_code, event_type, recording_expires_at, primary_vertical_id, content_scope')
        .eq('id', eventId)
        .single()

    if (!event) {
        return { error: 'Evento no encontrado' }
    }

    const viewer = await getViewerContext()
    const canUseActiveVertical = await contentBelongsToActiveVertical(
        supabase,
        { table: 'event_verticals', contentIdColumn: 'event_id' },
        event as any,
        viewer.activeVertical?.id
    )
    if (!canUseActiveVertical) {
        return { error: 'Este evento no pertenece a la vertical activa' }
    }

    // Get user profile
    const { data: profile } = await (supabase
        .from('profiles') as any)
            .select('full_name, role, membership_level, subscription_status, membership_specialization_code, email, timezone')
        .eq('id', user.id)
        .single()

    const profileData = profile ? (profile as any) : null
    const commercialAccess = profileData
        ? await getCommercialAccessContext({
            supabase,
            userId: user.id,
            profile: profileData,
        })
        : null
    const hasAccess = commercialAccess
        ? canViewerReachEventOffer(event as any, commercialAccess.viewer)
        : Array.isArray((event as any).target_audience) && (event as any).target_audience.includes('public')

    if (!hasAccess) {
        return { error: 'No tienes acceso a este evento' }
    }

    const eventData = event as any
    let currentPrice = eventData.price || 0
    let needsToPay = false

    if (profileData) {
        currentPrice = getEffectiveEventPriceForProfile(
            {
                price: eventData.price,
                member_price: eventData.member_price,
                member_access_type: normalizeMemberAccessType(eventData.member_access_type),
                specialization_code: eventData.specialization_code,
            },
            {
                role: profileData.role,
                membershipLevel: commercialAccess?.membershipLevel ?? profileData.membership_level ?? 0,
                hasActiveMembership: commercialAccess?.hasActiveMembership ?? false,
                membershipSpecializationCode: commercialAccess?.membershipSpecializationCode ?? null,
            }
        )

        if (profileData.role !== 'admin' && currentPrice > 0) {
            needsToPay = true
        }
    } else if (currentPrice > 0) {
        needsToPay = true
    }

    if (needsToPay) {
        return { error: 'Este evento requiere pago. Utiliza el botón de compra para inscribirte.' }
    }

    // Check if already registered
    const { data: existing } = await (supabase
        .from('event_registrations') as any)
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

    if (existing) {
        return { error: 'Ya estás registrado en este evento' }
    }

    // Check max attendees
    if (eventData.max_attendees) {
        const attendeeCount = await getUniqueEventAccessCount(supabase, eventId)

        if (attendeeCount >= eventData.max_attendees) {
            return { error: 'El evento está lleno' }
        }
    }

    const { error } = await (supabase as any)
        .from('event_registrations' as any)
        .insert({
            event_id: eventId,
            user_id: user.id,
            status: 'registered',
            registration_data: registrationData
        })

    if (error) {
        return { error: error.message }
    }

    if (profileData?.email) {
        const sourceType = currentPrice === 0 && Number(eventData.price || 0) > 0 ? 'membership' : 'registration'

        await grantEventEntitlements({
            event: {
                id: eventId,
                event_type: eventData.event_type || 'live',
                recording_expires_at: eventData.recording_expires_at || null,
            } as any,
            email: profileData.email,
            userId: user.id,
            sourceType,
            endsAt: sourceType === 'membership'
                ? getMembershipEntitlementEndsAt(commercialAccess)
                : undefined,
            metadata: {
                registration_data: registrationData,
            },
        })

        await syncProgramBundleEntitlementsForIdentity({
            supabase,
            userId: user.id,
            email: profileData.email,
            commercialAccess,
        })
    }

    await recordAnalyticsServerEvent({
        eventName: 'event_registered',
        eventSource: 'server',
        userId: user.id,
        touch: {
            funnel: 'event',
        },
        properties: {
            eventId,
            registrationType: 'free',
        },
    })

    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${eventId}`)

    // Send registration confirmation email (non-blocking)
    try {
        if (profileData?.email) {
            const { getAppUrl } = await import('@/lib/config/app-url')
            const appUrl = getAppUrl()
            const userTimezone = profileData.timezone || DEFAULT_TIMEZONE
            const eventDate = eventData.start_time
                ? `${formatDateInTimezone(eventData.start_time, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }, userTimezone)} ${getTimezoneShortLabel(userTimezone)}`
                : 'Por confirmar'

            const emailContent = buildEventRegistrationEmail({
                userName: profileData.full_name || profileData.email.split('@')[0],
                eventTitle: eventData.title,
                eventDate,
                eventUrl: `${appUrl}/dashboard/events/${eventId}`,
            })

            await sendEmail({
                to: profileData.email,
                subject: emailContent.subject,
                html: emailContent.html,
            })
        }
    } catch (emailError) {
        console.error('[Events] Failed to send registration email:', emailError)
    }

    try {
        await createUserNotification({
            userId: user.id,
            category: 'events',
            level: 'success',
            kind: 'event_registered',
            title: 'Registro confirmado',
            body: eventData.title
                ? `Ya quedaste registrado en "${eventData.title}".`
                : 'Tu registro al evento fue confirmado.',
            actionUrl: `/dashboard/events/${eventId}`,
            metadata: {
                eventId,
                pricePaid: currentPrice,
                registrationType: currentPrice === 0 ? 'free' : 'membership',
            },
        })
    } catch (notificationError) {
        console.error('[Events] Failed to create internal registration notification:', notificationError)
    }

    return { success: true }
}

export async function cancelEventRegistration(eventId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const { error } = await (supabase
        .from('event_registrations') as any)
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    if (error) {
        return { error: error.message }
    }

    await (supabase
        .from('event_entitlements') as any)
        .update({ status: 'revoked' })
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('source_type', 'registration')

    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
}

export async function createEvent(formData: FormData) {
    const supabase = await createClient()
    const viewer = await getViewerContext()
    const primaryVerticalId = viewer.activeVertical?.id ?? await getDefaultPrimaryVerticalId(supabase)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !canCreateEvent(profile.role)) {
        return { error: 'No tienes permisos para crear eventos' }
    }

    const canPublish = canPublishEvent(profile.role)
    const canUseAdvancedSettings = canManageEventAdvancedSettings(profile.role)
    const bypassScheduleConflicts = canBypassEventScheduleConflicts(formData, canUseAdvancedSettings)
    const title = readTrimmedString(formData.get('title'))
    const subtitle = readTrimmedString(formData.get('subtitle'))
    const description = readTrimmedString(formData.get('description'))
    const date = readTrimmedString(formData.get('date'))
    const time = readTrimmedString(formData.get('time'))
    const eventType = readTrimmedString(formData.get('eventType')) || 'live'
    const duration = parseIntegerField(formData.get('duration')) || 60
    const imageUrl = readTrimmedString(formData.get('imageUrl'))
    const price = Math.max(0, parseFloatField(formData.get('price')) || 0)
    const recordingDays = Math.min(30, Math.max(7, parseIntegerField(formData.get('recordingDays')) || 15))
    const location = readTrimmedString(formData.get('location'))
    const recordingUrl = readTrimmedString(formData.get('recordingUrl'))
    const maxAttendees = parseIntegerField(formData.get('maxAttendees'))
    const customSlug = canUseAdvancedSettings ? readTrimmedString(formData.get('slug')) : null
    const requestedStatus = canPublish
        ? readTrimmedString(formData.get('status')) || 'draft'
        : 'draft'
    const programMode = canUseAdvancedSettings && readTrimmedString(formData.get('programMode')) === 'program'
        ? 'program'
        : 'individual'
    const programName = programMode === 'program' ? readTrimmedString(formData.get('programName')) : null
    const programTypeLabel = programMode === 'program' ? readTrimmedString(formData.get('programTypeLabel')) : null
    const programChildEventIds = programMode === 'program' ? parseProgramChildEventIds(formData) : []
    const targetAudience = (formData.getAll('audience') as string[]).filter(Boolean)
    const normalizedAudience = targetAudience.length > 0 ? targetAudience : ['public']
    const registrationFields = parseRegistrationFields(formData)
    const memberAccessType =
        price > 0
            ? (readTrimmedString(formData.get('memberAccessType')) || 'free')
            : 'free'
    const memberPrice =
        memberAccessType === 'discounted'
            ? Math.max(0, parseFloatField(formData.get('memberPrice')) || 0)
            : 0

    if (!title || !date || !time) {
        return { error: 'Faltan campos requeridos' }
    }

    if (eventType === 'presencial' && !location) {
        return { error: 'La ubicacion es obligatoria para eventos presenciales' }
    }

    const memberDiscountError = validateMemberDiscountRule({
        price,
        memberAccessType,
        memberPrice,
        canUseAdvancedSettings,
    })
    if (memberDiscountError) {
        return { error: memberDiscountError }
    }

    const speakerAssignments = parseSpeakerAssignments(formData)
    const speakerAssignmentError = validateSpeakerAssignments(speakerAssignments)
    if (speakerAssignmentError) {
        return { error: speakerAssignmentError }
    }
    const multiSpeakerPublicationError = validatePaidMultiSpeakerPublication({
        price,
        speakerAssignments,
        requestedStatus,
        canUseAdvancedSettings,
    })
    if (multiSpeakerPublicationError) {
        return { error: multiSpeakerPublicationError }
    }

    const sessionSchedule = parseSessionSchedule(formData, eventType, location, date, time, duration)
    if ('error' in sessionSchedule) {
        return sessionSchedule
    }

    if (!bypassScheduleConflicts) {
        const scheduleConflict = await findEventScheduleConflictForSessions({
            supabase,
            ownerId: profile.role === 'ponente' ? user.id : null,
            speakerIds: speakerAssignments.map((assignment) => assignment.speakerId),
            sessions: sessionSchedule.sessions,
        })

        if (scheduleConflict) {
            return { error: buildEventScheduleConflictMessage(scheduleConflict) }
        }

        try {
            const externalConflictUserIds = Array.from(new Set([
                ...(profile.role === 'ponente' ? [user.id] : []),
                ...speakerAssignments.map((assignment) => assignment.speakerId),
            ]))
            let externalConflict: Awaited<ReturnType<typeof findExternalCalendarConflictForUsers>> = null
            for (const session of sessionSchedule.sessions) {
                externalConflict = await findExternalCalendarConflictForUsers(
                    externalConflictUserIds,
                    session.startTimeIso,
                    session.endTimeIso
                )

                if (externalConflict) break
            }

            if (externalConflict) {
                const conflictKind = externalConflict.userId === user.id ? 'owner' : 'speaker'
                return { error: buildExternalEventConflictMessage(externalConflict, conflictKind) }
            }
        } catch (externalError) {
            console.error('[CreateEvent] Error al validar Google Calendar:', externalError)
            return {
                error: 'No pudimos verificar la disponibilidad externa de los participantes. Pideles reconectar Google Calendar e intenta de nuevo.',
            }
        }
    }

    const sessionConfig = sessionSchedule.sessionConfig
    const idealFor = parseListField(formData, 'idealFor') ?? null
    const learningOutcomes = parseListField(formData, 'learningOutcomes') ?? null
    const includedResources = parseListField(formData, 'includedResources') ?? null
    const materialLinks = parseMaterialLinksField(formData, 'materialLinks') ?? []
    const certificateType = readTrimmedString(formData.get('certificateType')) || 'none'
    const specializationCode = canUseAdvancedSettings
        ? readTrimmedString(formData.get('specializationCode'))
        : null
    const formationTrack = readTrimmedString(formData.get('formationTrack'))
    const slug = await resolveUniqueEventSlug(supabase, customSlug || title)
    const meetingLink = eventType === 'presencial' ? null : readTrimmedString(formData.get('meetingLink'))
    const publicReadinessError = await validatePublicEventReadiness({
        supabase,
        status: requestedStatus,
        title,
        description,
        imageUrl,
        eventType,
        meetingLink,
        location,
        recordingUrl,
        programMode,
        programName,
        programChildEventIds,
        speakerIds: speakerAssignments.map((assignment) => assignment.speakerId),
    })
    if (publicReadinessError) {
        return { error: publicReadinessError }
    }
    const advancedValues = canUseAdvancedSettings
        ? {
            is_embeddable: formData.has('isEmbeddable') ? formData.get('isEmbeddable') === 'on' : true,
            og_description: formData.has('ogDescription') ? readTrimmedString(formData.get('ogDescription')) : null,
            seo_title: formData.has('seoTitle') ? readTrimmedString(formData.get('seoTitle')) : null,
            seo_description: formData.has('seoDescription') ? readTrimmedString(formData.get('seoDescription')) : null,
            hero_badge: formData.has('heroBadge') ? readTrimmedString(formData.get('heroBadge')) : null,
            public_cta_label: formData.has('publicCtaLabel') ? readTrimmedString(formData.get('publicCtaLabel')) : null,
        }
        : {
            is_embeddable: true,
            og_description: null,
            seo_title: null,
            seo_description: null,
            hero_badge: null,
            public_cta_label: null,
        }

    const verticalVisibility = resolveVerticalVisibilityInput({
        requestedScope: formData.get('contentScope'),
        requestedPrimaryVerticalId: formData.get('primaryVerticalId'),
        requestedRelatedVerticalIds: formData.getAll('relatedVerticalIds'),
        fallbackPrimaryVerticalId: primaryVerticalId,
        isAdmin: canUseAdvancedSettings,
    })

    if ('error' in verticalVisibility) {
        return { error: verticalVisibility.error }
    }

    const { data: newEvent, error } = await (supabase
        .from('events') as any)
        .insert({
            slug,
            title,
            subtitle,
            description,
            image_url: imageUrl,
            start_time: sessionSchedule.firstSession.startTimeIso,
            end_time: sessionSchedule.firstSession.endTimeIso,
            event_type: eventType,
            status: requestedStatus,
            meeting_link: meetingLink,
            max_attendees: maxAttendees,
            price,
            member_price: memberPrice,
            member_access_type: memberAccessType,
            ...advancedValues,
            target_audience: normalizedAudience,
            registration_fields: registrationFields,
            recording_available_days: recordingDays,
            is_members_only: normalizedAudience.includes('members'),
            created_by: user.id,
            category: readTrimmedString(formData.get('category')) || 'general',
            subcategory: readTrimmedString(formData.get('subcategory')),
            session_config: sessionConfig,
            location,
            ideal_for: idealFor,
            learning_outcomes: learningOutcomes,
            included_resources: includedResources,
            material_links: materialLinks,
            certificate_type: certificateType,
            specialization_code: specializationCode,
            formation_track: formationTrack,
            recording_url: recordingUrl,
            primary_vertical_id: verticalVisibility.primaryVerticalId,
            content_scope: verticalVisibility.contentScope,
            program_mode: programMode,
            program_name: programName,
            program_type_label: programTypeLabel,
        })
        .select('id')
        .single()

    if (error) {
        return { error: error.message }
    }

    if (newEvent) {
        try {
            await replaceContentVerticals(
                supabase,
                { table: 'event_verticals', contentIdColumn: 'event_id' },
                newEvent.id,
                verticalVisibility.contentScope,
                verticalVisibility.relatedVerticalIds
            )
        } catch (verticalError: any) {
            await (supabase.from('events') as any).delete().eq('id', newEvent.id)
            return { error: verticalError.message || 'No fue posible guardar las verticales del evento' }
        }
    }

    if (speakerAssignments.length > 0 && newEvent) {
        for (let i = 0; i < speakerAssignments.length; i++) {
            await (supabase.from('event_speakers') as any)
                .insert({
                    event_id: newEvent.id,
                    speaker_id: speakerAssignments[i].speakerId,
                    display_order: i,
                    compensation_type: speakerAssignments[i].compensationType,
                    compensation_value: speakerAssignments[i].compensationValue,
                })
        }
    }

    if (canUseAdvancedSettings && newEvent) {
        try {
            await replaceProgramChildEvents(supabase, newEvent.id, programChildEventIds)
        } catch (programError: any) {
            return { error: programError.message || 'No fue posible guardar la programacion' }
        }
    }

    revalidatePath('/dashboard/events')
    return { success: true }
}

export async function updateEvent(eventId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const [{ data: event }, { data: profile }] = await Promise.all([
        (supabase
            .from('events') as any)
        .select('id, created_by, status, formation_id, title, description, image_url, event_type, meeting_link, location, recording_url, start_time, end_time, primary_vertical_id, content_scope, program_mode, program_name, program_type_label')
            .eq('id', eventId)
            .single(),
        (supabase
            .from('profiles') as any)
            .select('role')
            .eq('id', user.id)
            .single(),
    ])

    const { canEditEvent } = event
        ? await getEventEditorAccessForUser({
            supabase,
            eventId,
            userId: user.id,
            role: profile?.role,
            createdBy: event.created_by,
        })
        : { canEditEvent: false }

    if (!event || !canEditEvent) {
        return { error: 'No tienes permisos para editar este evento' }
    }

    const viewer = await getViewerContext()
    const canUseActiveVertical = await contentBelongsToActiveVertical(
        supabase,
        { table: 'event_verticals', contentIdColumn: 'event_id' },
        event,
        viewer.activeVertical?.id
    )
    if (!canUseActiveVertical) {
        return { error: 'Este evento no pertenece a la vertical activa' }
    }

    const canPublish = canPublishEvent(profile?.role)
    const canUseAdvancedSettings = canManageEventAdvancedSettings(profile?.role)
    const bypassScheduleConflicts = canBypassEventScheduleConflicts(formData, canUseAdvancedSettings)
    const title = readTrimmedString(formData.get('title'))
    const subtitle = readTrimmedString(formData.get('subtitle'))
    const description = formData.has('description')
        ? readTrimmedString(formData.get('description'))
        : undefined
    const date = readTrimmedString(formData.get('date'))
    const time = readTrimmedString(formData.get('time'))
    const duration = parseIntegerField(formData.get('duration')) || 60
    const eventType = readTrimmedString(formData.get('eventType'))
    const maxAttendees = parseIntegerField(formData.get('maxAttendees'))
    const imageUrl = formData.has('imageUrl')
        ? readTrimmedString(formData.get('imageUrl'))
        : undefined
    const price = Math.max(0, parseFloatField(formData.get('price')) || 0)
    const recordingDays = Math.min(30, Math.max(7, parseIntegerField(formData.get('recordingDays')) || 15))
    const recordingUrl = formData.has('recordingUrl')
        ? readTrimmedString(formData.get('recordingUrl'))
        : undefined
    const location = formData.has('location')
        ? readTrimmedString(formData.get('location'))
        : undefined
    const audienceRaw = (formData.getAll('audience') as string[]).filter(Boolean)
    const targetAudience = audienceRaw.length > 0 ? audienceRaw : undefined
    const registrationFields = formData.has('registrationFields')
        ? parseRegistrationFields(formData)
        : undefined
    const memberAccessType =
        price > 0
            ? (readTrimmedString(formData.get('memberAccessType')) || 'free')
            : 'free'
    const memberPrice =
        memberAccessType === 'discounted'
            ? Math.max(0, parseFloatField(formData.get('memberPrice')) || 0)
            : 0
    const status = readTrimmedString(formData.get('status'))
    const requestedStatus = canPublish ? (status || event.status) : 'draft'
    const programMode = canUseAdvancedSettings && formData.has('programMode')
        ? readTrimmedString(formData.get('programMode')) === 'program' ? 'program' : 'individual'
        : event.program_mode ?? 'individual'
    const programName = canUseAdvancedSettings && formData.has('programName')
        ? programMode === 'program' ? readTrimmedString(formData.get('programName')) : null
        : event.program_name ?? null
    const programTypeLabel = canUseAdvancedSettings && formData.has('programTypeLabel')
        ? programMode === 'program' ? readTrimmedString(formData.get('programTypeLabel')) : null
        : event.program_type_label ?? null
    const category = readTrimmedString(formData.get('category'))
    const subcategory = formData.has('subcategory')
        ? readTrimmedString(formData.get('subcategory'))
        : undefined
    const idealFor = parseListField(formData, 'idealFor')
    const learningOutcomes = parseListField(formData, 'learningOutcomes')
    const includedResources = parseListField(formData, 'includedResources')
    const materialLinks = parseMaterialLinksField(formData, 'materialLinks')
    const certificateType = formData.has('certificateType')
        ? (readTrimmedString(formData.get('certificateType')) || 'none')
        : undefined
    const specializationCode = formData.has('specializationCode')
        ? canUseAdvancedSettings ? readTrimmedString(formData.get('specializationCode')) : undefined
        : undefined
    const formationTrack = formData.has('formationTrack')
        ? readTrimmedString(formData.get('formationTrack'))
        : undefined
    const customSlug = canUseAdvancedSettings ? readTrimmedString(formData.get('slug')) : null

    if (eventType === 'presencial' && !location) {
        return { error: 'La ubicacion es obligatoria para eventos presenciales' }
    }

    const memberDiscountError = validateMemberDiscountRule({
        price,
        memberAccessType,
        memberPrice,
        canUseAdvancedSettings,
    })
    if (memberDiscountError) {
        return { error: memberDiscountError }
    }

    const speakerAssignments: SpeakerAssignmentInput[] = formData.has('speakerIds') || formData.has('speakerAssignments')
        ? parseSpeakerAssignments(formData)
        : (await getEventSpeakerIds(supabase, eventId)).map((speakerId) => ({
            speakerId,
            compensationType: DEFAULT_SPEAKER_COMPENSATION_TYPE as SpeakerCompensationType,
            compensationValue: DEFAULT_SPEAKER_PERCENTAGE_RATE,
        }))
    const programChildEventIds = canUseAdvancedSettings && formData.has('programChildEventIds')
        ? programMode === 'program' ? parseProgramChildEventIds(formData).filter((childId) => childId !== eventId) : []
        : programMode === 'program'
            ? await getProgramChildEventIds(supabase, eventId)
            : []
    const speakerAssignmentError = validateSpeakerAssignments(speakerAssignments)
    if (speakerAssignmentError) {
        return { error: speakerAssignmentError }
    }
    const multiSpeakerPublicationError = validatePaidMultiSpeakerPublication({
        price,
        speakerAssignments,
        requestedStatus,
        canUseAdvancedSettings,
    })
    if (multiSpeakerPublicationError) {
        return { error: multiSpeakerPublicationError }
    }

    const nextEventType = eventType || event.event_type || 'live'
    const nextMeetingLink = nextEventType === 'presencial'
        ? null
        : formData.has('meetingLink')
            ? readTrimmedString(formData.get('meetingLink'))
            : event.meeting_link
    const nextLocation = nextEventType === 'presencial'
        ? location === undefined ? event.location : location
        : null
    const publicReadinessError = await validatePublicEventReadiness({
        supabase,
        status: requestedStatus,
        title: title || event.title,
        description: description === undefined ? event.description : description,
        imageUrl: imageUrl === undefined ? event.image_url : imageUrl,
        eventType: nextEventType,
        meetingLink: nextMeetingLink,
        location: nextLocation,
        recordingUrl: recordingUrl === undefined ? event.recording_url : recordingUrl,
        programMode,
        programName,
        programChildEventIds,
        speakerIds: speakerAssignments.map((assignment) => assignment.speakerId),
    })
    if (publicReadinessError) {
        return { error: publicReadinessError }
    }

    let nextStartTimeIso = event.start_time
    let nextEndTimeIso = event.end_time
    let sessionSchedule: ParsedSessionSchedule | null = null

    const updates: Record<string, any> = {}

    if (title) updates.title = title
    if (description !== undefined) updates.description = description || null
    if (imageUrl !== undefined) updates.image_url = imageUrl || null

    if (date && time) {
        const nextEventType = eventType || 'live'
        const nextLocation = location === undefined ? null : location
        const parsedSchedule = parseSessionSchedule(formData, nextEventType, nextLocation, date, time, duration)
        if ('error' in parsedSchedule) {
            return parsedSchedule
        }

        sessionSchedule = parsedSchedule
        nextStartTimeIso = parsedSchedule.firstSession.startTimeIso
        nextEndTimeIso = parsedSchedule.firstSession.endTimeIso
        updates.start_time = nextStartTimeIso
        updates.end_time = nextEndTimeIso
    }

    if (!bypassScheduleConflicts) {
        const scheduleConflict = await findEventScheduleConflictForSessions({
            supabase,
            ownerId: profile?.role === 'ponente' ? user.id : null,
            speakerIds: speakerAssignments.map((assignment) => assignment.speakerId),
            sessions: sessionSchedule?.sessions ?? [{ startTimeIso: nextStartTimeIso, endTimeIso: nextEndTimeIso }],
            excludeEventId: eventId,
        })

        if (scheduleConflict) {
            return { error: buildEventScheduleConflictMessage(scheduleConflict) }
        }

        try {
            const externalConflictUserIds = Array.from(new Set([
                ...(profile?.role === 'ponente' ? [user.id] : []),
                ...speakerAssignments.map((assignment) => assignment.speakerId),
            ]))
            let externalConflict: Awaited<ReturnType<typeof findExternalCalendarConflictForUsers>> = null
            for (const session of sessionSchedule?.sessions ?? [{ startTimeIso: nextStartTimeIso, endTimeIso: nextEndTimeIso }]) {
                externalConflict = await findExternalCalendarConflictForUsers(
                    externalConflictUserIds,
                    session.startTimeIso,
                    session.endTimeIso
                )

                if (externalConflict) break
            }

            if (externalConflict) {
                const conflictKind = externalConflict.userId === user.id ? 'owner' : 'speaker'
                return { error: buildExternalEventConflictMessage(externalConflict, conflictKind) }
            }
        } catch (externalError) {
            console.error('[UpdateEvent] Error al validar Google Calendar:', externalError)
            return {
                error: 'No pudimos verificar la disponibilidad externa de los participantes. Pideles reconectar Google Calendar e intenta de nuevo.',
            }
        }
    }

    if (eventType) updates.event_type = eventType
    if (canPublish) {
        updates.status = requestedStatus
    } else {
        updates.status = 'draft'
    }
    if (eventType === 'presencial') {
        updates.meeting_link = null
        updates.location = location || null
    } else {
        if (formData.has('meetingLink')) {
            updates.meeting_link = readTrimmedString(formData.get('meetingLink')) || null
        }
        updates.location = null
    }
    if (formData.has('maxAttendees')) updates.max_attendees = maxAttendees || null
    if (formData.has('price')) updates.price = price
    if (targetAudience) updates.target_audience = targetAudience
    if (registrationFields !== undefined) updates.registration_fields = registrationFields
    if (formData.has('recordingDays')) updates.recording_available_days = recordingDays
    if (recordingUrl !== undefined) updates.recording_url = recordingUrl || null
    if (eventType) {
        updates.session_config = sessionSchedule?.sessionConfig ?? parseSessionConfig(formData, eventType, updates.location)
    }

    if (targetAudience) {
        updates.is_members_only = targetAudience.includes('members')
    }

    if (category) updates.category = category
    if (subcategory !== undefined) updates.subcategory = subcategory || null

    if (formData.has('memberPrice') || formData.has('memberAccessType') || formData.has('price')) {
        updates.member_price = memberPrice
        updates.member_access_type = memberAccessType
    }
    if (subtitle !== undefined) updates.subtitle = subtitle || null
    if (idealFor !== undefined) updates.ideal_for = idealFor
    if (learningOutcomes !== undefined) updates.learning_outcomes = learningOutcomes
    if (includedResources !== undefined) updates.included_resources = includedResources
    if (materialLinks !== undefined) updates.material_links = materialLinks
    if (certificateType !== undefined) updates.certificate_type = certificateType || 'none'
    if (specializationCode !== undefined) updates.specialization_code = specializationCode || null
    if (formationTrack !== undefined) updates.formation_track = formationTrack || null
    if (canUseAdvancedSettings && formData.has('programMode')) {
        updates.program_mode = programMode
        updates.program_name = programName
        updates.program_type_label = programTypeLabel
    }

    if (canUseAdvancedSettings) {
        if (formData.has('isEmbeddable')) updates.is_embeddable = formData.get('isEmbeddable') === 'on'
        if (formData.has('ogDescription')) updates.og_description = readTrimmedString(formData.get('ogDescription')) || null
        if (formData.has('seoTitle')) updates.seo_title = readTrimmedString(formData.get('seoTitle')) || null
        if (formData.has('seoDescription')) updates.seo_description = readTrimmedString(formData.get('seoDescription')) || null
        if (formData.has('heroBadge')) updates.hero_badge = readTrimmedString(formData.get('heroBadge')) || null
        if (formData.has('publicCtaLabel')) updates.public_cta_label = readTrimmedString(formData.get('publicCtaLabel')) || null
    }

    const shouldUpdateVerticalVisibility = canUseAdvancedSettings && formData.has('contentScope')
    let verticalVisibility: ReturnType<typeof resolveVerticalVisibilityInput> | null = null
    if (shouldUpdateVerticalVisibility) {
        verticalVisibility = resolveVerticalVisibilityInput({
            requestedScope: formData.get('contentScope'),
            requestedPrimaryVerticalId: formData.get('primaryVerticalId'),
            requestedRelatedVerticalIds: formData.getAll('relatedVerticalIds'),
            fallbackPrimaryVerticalId: event.primary_vertical_id ?? viewer.activeVertical?.id ?? await getDefaultPrimaryVerticalId(supabase),
            isAdmin: canUseAdvancedSettings,
        })

        if ('error' in verticalVisibility) {
            return { error: verticalVisibility.error }
        }

        updates.primary_vertical_id = verticalVisibility.primaryVerticalId
        updates.content_scope = verticalVisibility.contentScope
    }

    if (canUseAdvancedSettings && customSlug !== null) {
        const normalizedSlug = slugifyCatalogText(customSlug)
        if (normalizedSlug) {
            updates.slug = await resolveUniqueEventSlug(supabase, normalizedSlug, eventId)
        }
    }

    const { error } = await (supabase
        .from('events') as any)
        .update(updates)
        .eq('id', eventId)

    if (error) {
        return { error: error.message }
    }

    if (verticalVisibility && !('error' in verticalVisibility)) {
        try {
            await replaceContentVerticals(
                supabase,
                { table: 'event_verticals', contentIdColumn: 'event_id' },
                eventId,
                verticalVisibility.contentScope,
                verticalVisibility.relatedVerticalIds
            )
        } catch (verticalError: any) {
            return { error: verticalError.message || 'No fue posible guardar las verticales del evento' }
        }
    }

    // Handle speaker assignments on update
    if (formData.has('speakerIds') || formData.has('speakerAssignments')) {
        await (supabase.from('event_speakers') as any)
            .delete()
            .eq('event_id', eventId)

        for (let i = 0; i < speakerAssignments.length; i++) {
            await (supabase.from('event_speakers') as any)
                .insert({
                    event_id: eventId,
                    speaker_id: speakerAssignments[i].speakerId,
                    display_order: i,
                    compensation_type: speakerAssignments[i].compensationType,
                    compensation_value: speakerAssignments[i].compensationValue,
                })
        }
    }

    if (canUseAdvancedSettings && formData.has('programChildEventIds')) {
        try {
            await replaceProgramChildEvents(supabase, eventId, programChildEventIds)
        } catch (programError: any) {
            return { error: programError.message || 'No fue posible guardar la programacion' }
        }
    }

    // Post-update: check if event transitioned to completed
    if (updates.status === 'completed' && event.status !== 'completed' && event.formation_id) {
        const { data: registrations } = await (supabase
            .from('event_registrations') as any)
            .select('user_id, status, attended_at, registration_data, user:profiles(email)')
            .eq('event_id', eventId)

        if (registrations) {
            // Advance only attendees that were explicitly marked as attended.
            const attendedRegs = registrations.filter((r: any) => 
                r.status === 'attended' || Boolean(r.attended_at)
            )

            for (const reg of attendedRegs) {
                const userEmail = reg.user?.email || reg.registration_data?.email
                if (userEmail) {
                    await (supabase
                        .from('formation_progress') as any)
                        .upsert({
                            formation_id: event.formation_id,
                            event_id: eventId,
                            email: userEmail,
                            user_id: reg.user_id || null,
                            completed_at: new Date().toISOString(),
                            certificate_issued: true,
                            certificate_issued_at: new Date().toISOString(),
                        }, { onConflict: 'formation_id,email,event_id' })
                }
            }
        }
    }

    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
}

export async function deleteEvent(eventId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const { data: event } = await (supabase
        .from('events') as any)
        .select('created_by')
        .eq('id', eventId)
        .single()

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (!event || !canDeleteEvent(profile?.role)) {
        return { error: 'No tienes permisos para eliminar este evento' }
    }

    const { error } = await (supabase
        .from('events') as any)
        .delete()
        .eq('id', eventId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/events')
    return { success: true }
}

export async function duplicateEvent(eventId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const [{ data: event }, { data: profile }] = await Promise.all([
        (supabase
            .from('events') as any)
            .select('*')
            .eq('id', eventId)
            .single(),
        (supabase
            .from('profiles') as any)
            .select('role')
            .eq('id', user.id)
            .single(),
    ])

    if (!event || !canManageOwnedEvent({ userId: user.id, role: profile?.role, createdBy: event.created_by })) {
        return { error: 'No tienes permisos para duplicar este evento' }
    }

    const viewer = await getViewerContext()
    const canUseActiveVertical = await contentBelongsToActiveVertical(
        supabase,
        { table: 'event_verticals', contentIdColumn: 'event_id' },
        event,
        viewer.activeVertical?.id
    )
    if (!canUseActiveVertical) {
        return { error: 'Este evento no pertenece a la vertical activa' }
    }

    const duplicateTitle = buildDuplicateEventTitle(event.title || 'Evento')
    const slug = await resolveUniqueEventSlug(supabase, duplicateTitle)

    const { data: duplicatedEvent, error: duplicateError } = await (supabase
        .from('events') as any)
        .insert({
            slug,
            title: duplicateTitle,
            subtitle: event.subtitle,
            description: event.description,
            image_url: event.image_url,
            start_time: event.start_time,
            end_time: event.end_time,
            status: 'draft',
            event_type: event.event_type,
            location: event.location,
            meeting_link: event.meeting_link,
            recording_url: null,
            max_attendees: event.max_attendees,
            price: event.price,
            is_members_only: event.is_members_only,
            target_audience: event.target_audience,
            required_subscription: event.required_subscription,
            recording_available_days: event.recording_available_days,
            prerequisite_event_id: null,
            created_by: event.created_by || user.id,
            registration_fields: event.registration_fields,
            category: event.category,
            subcategory: event.subcategory,
            member_price: event.member_price,
            member_access_type: event.member_access_type,
            is_embeddable: event.is_embeddable,
            og_description: event.og_description,
            seo_title: event.seo_title,
            seo_description: event.seo_description,
            hero_badge: event.hero_badge,
            public_cta_label: event.public_cta_label,
            session_config: event.session_config,
            ideal_for: event.ideal_for,
            learning_outcomes: event.learning_outcomes,
            included_resources: event.included_resources,
            material_links: event.material_links,
            certificate_type: event.certificate_type,
            specialization_code: event.specialization_code,
            formation_track: event.formation_track,
            formation_id: null,
            primary_vertical_id: event.primary_vertical_id ?? viewer.activeVertical?.id ?? await getDefaultPrimaryVerticalId(supabase),
            content_scope: event.content_scope ?? 'vertical',
        })
        .select('id')
        .single()

    if (duplicateError || !duplicatedEvent) {
        return { error: duplicateError?.message || 'No fue posible duplicar el evento' }
    }

    const relatedVerticalIds = event.content_scope === 'global'
        ? []
        : await getRelatedVerticalIds(
            supabase,
            { table: 'event_verticals', contentIdColumn: 'event_id' },
            eventId
        )

    try {
        await replaceContentVerticals(
            supabase,
            { table: 'event_verticals', contentIdColumn: 'event_id' },
            duplicatedEvent.id,
            event.content_scope ?? 'vertical',
            relatedVerticalIds.length > 0
                ? relatedVerticalIds
                : [event.primary_vertical_id].filter((id: string | null): id is string => Boolean(id))
        )
    } catch (verticalError: any) {
        await (supabase.from('events') as any).delete().eq('id', duplicatedEvent.id)
        return { error: verticalError.message || 'No fue posible duplicar las verticales del evento' }
    }

    const [{ data: speakerAssignments }, { data: resourceLinks }] = await Promise.all([
        (supabase
            .from('event_speakers') as any)
            .select('speaker_id, role, display_order, compensation_type, compensation_value')
            .eq('event_id', eventId)
            .order('display_order', { ascending: true }),
        (supabase
            .from('event_resources') as any)
            .select('resource_id, is_locked, unlock_at, display_order')
            .eq('event_id', eventId)
            .order('display_order', { ascending: true }),
    ])

    if (speakerAssignments && speakerAssignments.length > 0) {
        const { error: speakersError } = await (supabase
            .from('event_speakers') as any)
            .insert(
                speakerAssignments.map((assignment: any) => ({
                    event_id: duplicatedEvent.id,
                    speaker_id: assignment.speaker_id,
                    role: assignment.role,
                    display_order: assignment.display_order,
                    compensation_type: assignment.compensation_type,
                    compensation_value: assignment.compensation_value,
                }))
            )

        if (speakersError) {
            return { error: speakersError.message }
        }
    }

    if (resourceLinks && resourceLinks.length > 0) {
        const { error: resourcesError } = await (supabase
            .from('event_resources') as any)
            .insert(
                resourceLinks.map((resourceLink: any) => ({
                    event_id: duplicatedEvent.id,
                    resource_id: resourceLink.resource_id,
                    is_locked: resourceLink.is_locked,
                    unlock_at: resourceLink.unlock_at,
                    display_order: resourceLink.display_order,
                }))
            )

        if (resourcesError) {
            return { error: resourcesError.message }
        }
    }

    revalidatePath('/dashboard/events')
    revalidatePath(`/dashboard/events/${duplicatedEvent.id}`)

    return { success: true, eventId: duplicatedEvent.id }
}

export async function addSpeakerToEvent(eventId: string, speakerId: string, role: string = 'speaker') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const [{ data: event }, { data: profile }] = await Promise.all([
        (supabase.from('events') as any).select('created_by, start_time, end_time, session_config').eq('id', eventId).single(),
        (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    ])

    if (!event || !canManageOwnedEvent({ userId: user.id, role: profile?.role, createdBy: event.created_by })) {
        return { error: 'No tienes permisos para modificar este evento' }
    }

    if (event.start_time && !event.session_config?.open_agenda) {
        const eventSessions = getEventSessionOccurrences(event)
            .map((session) => ({
                startTimeIso: session.start_time,
                endTimeIso: session.end_time,
            }))

        const scheduleConflict = await findEventScheduleConflictForSessions({
            supabase,
            speakerIds: [speakerId],
            sessions: eventSessions,
            excludeEventId: eventId,
        })

        if (scheduleConflict) {
            return { error: buildEventScheduleConflictMessage(scheduleConflict) }
        }

        try {
            let externalConflict: Awaited<ReturnType<typeof findExternalCalendarConflictForUsers>> = null
            for (const session of eventSessions) {
                externalConflict = await findExternalCalendarConflictForUsers(
                    [speakerId],
                    session.startTimeIso,
                    session.endTimeIso
                )

                if (externalConflict) break
            }

            if (externalConflict) {
                return { error: buildExternalEventConflictMessage(externalConflict, 'speaker') }
            }
        } catch (externalError) {
            console.error('[AddSpeakerToEvent] Error al validar Google Calendar:', externalError)
            return {
                error: 'No pudimos verificar la disponibilidad externa del ponente. Pidele reconectar Google Calendar e intenta de nuevo.',
            }
        }
    }

    const { error } = await (supabase.from('event_speakers') as any)
        .insert({
            event_id: eventId,
            speaker_id: speakerId,
            role,
            compensation_type: DEFAULT_SPEAKER_COMPENSATION_TYPE,
            compensation_value: DEFAULT_SPEAKER_PERCENTAGE_RATE,
        })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
}

export async function removeSpeakerFromEvent(eventId: string, speakerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const [{ data: event }, { data: profile }] = await Promise.all([
        (supabase.from('events') as any).select('created_by').eq('id', eventId).single(),
        (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    ])

    if (!event || !canManageOwnedEvent({ userId: user.id, role: profile?.role, createdBy: event.created_by })) {
        return { error: 'No tienes permisos para modificar este evento' }
    }

    const { error } = await (supabase.from('event_speakers') as any)
        .delete()
        .eq('event_id', eventId)
        .eq('speaker_id', speakerId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
}

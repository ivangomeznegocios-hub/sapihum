'use server'

import { createClient } from '@/lib/supabase/server'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
import { revalidatePath } from 'next/cache'
import type { TargetAudience } from '@/types/database'
import {
    getEffectiveEventPriceForProfile,
    normalizeMemberAccessType,
} from '@/lib/events/pricing'
import { getUniqueEventAccessCount } from '@/lib/events/attendance'
import { grantEventEntitlements } from '@/lib/events/entitlements'
import { slugifyCatalogText } from '@/lib/events/public'
import { audienceAllowsAccess, getCommercialAccessContext } from '@/lib/access/commercial'
import { sendEmail } from '@/lib/email/index'
import { buildEventRegistrationEmail } from '@/lib/email/templates'
import { DEFAULT_TIMEZONE, zonedDateTimeToUtcIso } from '@/lib/timezone'
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

    return {
        total_sessions: totalSessions,
        session_duration_minutes: sessionDurationMinutes,
        recurrence,
        modality,
        ...(location ? { location } : {}),
    }
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

function formatConflictDateLabel(dateValue: string) {
    return new Date(dateValue).toLocaleString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

type EventScheduleConflict = {
    id: string
    title: string | null
    start_time: string
    source: 'creator' | 'speaker'
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
            .select('id, title, start_time')
            .eq('created_by', ownerId)
            .neq('status', 'cancelled')
            .lt('start_time', endTimeIso)
            .gt('end_time', startTimeIso)
            .limit(5)

        if (excludeEventId) {
            creatorQuery = creatorQuery.neq('id', excludeEventId)
        }

        const { data: creatorConflicts } = await creatorQuery

        for (const conflict of creatorConflicts || []) {
            conflicts.set(conflict.id, {
                id: conflict.id,
                title: conflict.title || null,
                start_time: conflict.start_time,
                source: 'creator',
            })
        }
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
                .select('id, title, start_time')
                .in('id', relatedEventIds)
                .neq('status', 'cancelled')
                .lt('start_time', endTimeIso)
                .gt('end_time', startTimeIso)
                .limit(5)

            for (const conflict of speakerConflicts || []) {
                if (!conflicts.has(conflict.id)) {
                    conflicts.set(conflict.id, {
                        id: conflict.id,
                        title: conflict.title || null,
                        start_time: conflict.start_time,
                        source: 'speaker',
                    })
                }
            }
        }
    }

    const orderedConflicts = Array.from(conflicts.values()).sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

    return orderedConflicts[0] || null
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
        .select('title, slug, start_time, target_audience, required_subscription, max_attendees, price, member_access_type, member_price, specialization_code, event_type, recording_expires_at')
        .eq('id', eventId)
        .single()

    if (!event) {
        return { error: 'Evento no encontrado' }
    }

    // Get user profile
    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('full_name, role, membership_level, subscription_status, membership_specialization_code, email')
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
    const audience = (event as any).target_audience as TargetAudience[] || ['public']
    const hasAccess = commercialAccess
        ? audienceAllowsAccess(audience, commercialAccess)
        : audience.includes('public')

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
        await grantEventEntitlements({
            event: {
                id: eventId,
                event_type: eventData.event_type || 'live',
                recording_expires_at: eventData.recording_expires_at || null,
            } as any,
            email: profileData.email,
            userId: user.id,
            sourceType: currentPrice === 0 && Number(eventData.price || 0) > 0 ? 'membership' : 'registration',
            metadata: {
                registration_data: registrationData,
            },
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
            const eventDate = eventData.start_time
                ? new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(eventData.start_time))
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

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify user is admin or ponente
    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'ponente'].includes(profile.role)) {
        return { error: 'No tienes permisos para crear eventos' }
    }

    const isAdmin = profile.role === 'admin'
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
    const customSlug = isAdmin ? readTrimmedString(formData.get('slug')) : null
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

    if (memberAccessType === 'discounted' && price > 0 && memberPrice <= 0) {
        return { error: 'Ingresa un precio preferencial para miembros o cambia el tipo de acceso' }
    }

    const dateRange = buildEventDateRange(date, time, duration)
    if (!dateRange) {
        return { error: 'La fecha u hora del evento no son validas' }
    }

    const speakerAssignments = parseSpeakerAssignments(formData)
    const speakerAssignmentError = validateSpeakerAssignments(speakerAssignments)
    if (speakerAssignmentError) {
        return { error: speakerAssignmentError }
    }

    const scheduleConflict = await findEventScheduleConflict({
        supabase,
        ownerId: profile.role === 'ponente' ? user.id : null,
        speakerIds: speakerAssignments.map((assignment) => assignment.speakerId),
        startTimeIso: dateRange.startTimeIso,
        endTimeIso: dateRange.endTimeIso,
    })

    if (scheduleConflict) {
        return { error: buildEventScheduleConflictMessage(scheduleConflict) }
    }

    try {
        const externalConflictUserIds = Array.from(new Set([
            ...(profile.role === 'ponente' ? [user.id] : []),
            ...speakerAssignments.map((assignment) => assignment.speakerId),
        ]))
        const externalConflict = await findExternalCalendarConflictForUsers(
            externalConflictUserIds,
            dateRange.startTimeIso,
            dateRange.endTimeIso
        )

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

    const sessionConfig = parseSessionConfig(formData, eventType, location)
    const idealFor = parseListField(formData, 'idealFor') ?? null
    const learningOutcomes = parseListField(formData, 'learningOutcomes') ?? null
    const includedResources = parseListField(formData, 'includedResources') ?? null
    const materialLinks = parseMaterialLinksField(formData, 'materialLinks') ?? []
    const certificateType = readTrimmedString(formData.get('certificateType')) || 'none'
    const specializationCode = readTrimmedString(formData.get('specializationCode'))
    const formationTrack = readTrimmedString(formData.get('formationTrack'))
    const slug = await resolveUniqueEventSlug(supabase, customSlug || title)
    const meetingLink = eventType === 'presencial' ? null : readTrimmedString(formData.get('meetingLink'))
    const advancedValues = isAdmin
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

    const { data: newEvent, error } = await (supabase
        .from('events') as any)
        .insert({
            slug,
            title,
            subtitle,
            description,
            image_url: imageUrl,
            start_time: dateRange.startTimeIso,
            end_time: dateRange.endTimeIso,
            event_type: eventType,
            status: profile.role === 'admin' ? 'upcoming' : 'draft',
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
        })
        .select('id')
        .single()

    if (error) {
        return { error: error.message }
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

    revalidatePath('/dashboard/events')
    return { success: true }
}

export async function updateEvent(eventId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify user is admin or event creator
    const { data: event } = await (supabase
        .from('events') as any)
        .select('created_by, status, formation_id, start_time, end_time')
        .eq('id', eventId)
        .single()

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (!event || (event.created_by !== user.id && profile?.role !== 'admin')) {
        return { error: 'No tienes permisos para editar este evento' }
    }

    const isAdmin = profile?.role === 'admin'
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
        ? readTrimmedString(formData.get('specializationCode'))
        : undefined
    const formationTrack = formData.has('formationTrack')
        ? readTrimmedString(formData.get('formationTrack'))
        : undefined
    const customSlug = isAdmin ? readTrimmedString(formData.get('slug')) : null

    if (eventType === 'presencial' && !location) {
        return { error: 'La ubicacion es obligatoria para eventos presenciales' }
    }

    if (memberAccessType === 'discounted' && price > 0 && memberPrice <= 0) {
        return { error: 'Ingresa un precio preferencial para miembros o cambia el tipo de acceso' }
    }

    const speakerAssignments: SpeakerAssignmentInput[] = formData.has('speakerIds') || formData.has('speakerAssignments')
        ? parseSpeakerAssignments(formData)
        : (await getEventSpeakerIds(supabase, eventId)).map((speakerId) => ({
            speakerId,
            compensationType: DEFAULT_SPEAKER_COMPENSATION_TYPE as SpeakerCompensationType,
            compensationValue: DEFAULT_SPEAKER_PERCENTAGE_RATE,
        }))
    const speakerAssignmentError = validateSpeakerAssignments(speakerAssignments)
    if (speakerAssignmentError) {
        return { error: speakerAssignmentError }
    }

    let nextStartTimeIso = event.start_time
    let nextEndTimeIso = event.end_time

    const updates: Record<string, any> = {}

    if (title) updates.title = title
    if (description !== undefined) updates.description = description || null
    if (imageUrl !== undefined) updates.image_url = imageUrl || null

    if (date && time) {
        const dateRange = buildEventDateRange(date, time, duration)
        if (!dateRange) {
            return { error: 'La fecha u hora del evento no son validas' }
        }

        nextStartTimeIso = dateRange.startTimeIso
        nextEndTimeIso = dateRange.endTimeIso
        updates.start_time = nextStartTimeIso
        updates.end_time = nextEndTimeIso
    }

    const scheduleConflict = await findEventScheduleConflict({
        supabase,
        ownerId: profile?.role === 'ponente' ? user.id : null,
        speakerIds: speakerAssignments.map((assignment) => assignment.speakerId),
        startTimeIso: nextStartTimeIso,
        endTimeIso: nextEndTimeIso,
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
        const externalConflict = await findExternalCalendarConflictForUsers(
            externalConflictUserIds,
            nextStartTimeIso,
            nextEndTimeIso
        )

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

    if (eventType) updates.event_type = eventType
    if (isAdmin) {
        if (status) updates.status = status
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
        updates.session_config = parseSessionConfig(formData, eventType, updates.location)
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

    if (isAdmin) {
        if (formData.has('isEmbeddable')) updates.is_embeddable = formData.get('isEmbeddable') === 'on'
        if (formData.has('ogDescription')) updates.og_description = readTrimmedString(formData.get('ogDescription')) || null
        if (formData.has('seoTitle')) updates.seo_title = readTrimmedString(formData.get('seoTitle')) || null
        if (formData.has('seoDescription')) updates.seo_description = readTrimmedString(formData.get('seoDescription')) || null
        if (formData.has('heroBadge')) updates.hero_badge = readTrimmedString(formData.get('heroBadge')) || null
        if (formData.has('publicCtaLabel')) updates.public_cta_label = readTrimmedString(formData.get('publicCtaLabel')) || null
    }

    if (isAdmin && customSlug !== null) {
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

    // Verify user is admin or event creator
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

    if (!event || (event.created_by !== user.id && profile?.role !== 'admin')) {
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

    if (!event || (event.created_by !== user.id && profile?.role !== 'admin')) {
        return { error: 'No tienes permisos para duplicar este evento' }
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
        })
        .select('id')
        .single()

    if (duplicateError || !duplicatedEvent) {
        return { error: duplicateError?.message || 'No fue posible duplicar el evento' }
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
        (supabase.from('events') as any).select('created_by, start_time, end_time').eq('id', eventId).single(),
        (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    ])

    if (!event || (event.created_by !== user.id && profile?.role !== 'admin')) {
        return { error: 'No tienes permisos para modificar este evento' }
    }

    if (event.start_time && event.end_time) {
        const scheduleConflict = await findEventScheduleConflict({
            supabase,
            speakerIds: [speakerId],
            startTimeIso: event.start_time,
            endTimeIso: event.end_time,
            excludeEventId: eventId,
        })

        if (scheduleConflict) {
            return { error: buildEventScheduleConflictMessage(scheduleConflict) }
        }

        try {
            const externalConflict = await findExternalCalendarConflictForUsers(
                [speakerId],
                event.start_time,
                event.end_time
            )

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

    if (!event || (event.created_by !== user.id && profile?.role !== 'admin')) {
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

import type { Event } from '@/types/database'

export type EventSessionOccurrence = {
    index: number
    start_time: string
    end_time: string
}

type EventScheduleSource = Pick<Event, 'id' | 'start_time' | 'end_time' | 'session_config'>

const WEEKLY_RECURRENCES = new Set([
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
    'domingo',
])

function getFallbackDurationMinutes(event: EventScheduleSource) {
    const configuredDuration = Number(event.session_config?.session_duration_minutes)
    if (Number.isFinite(configuredDuration) && configuredDuration > 0) {
        return configuredDuration
    }

    if (event.end_time) {
        const start = new Date(event.start_time).getTime()
        const end = new Date(event.end_time).getTime()
        const diff = Math.round((end - start) / 60000)
        if (Number.isFinite(diff) && diff > 0) {
            return diff
        }
    }

    return 60
}

function normalizeSessionDate(value: unknown) {
    if (typeof value !== 'string') return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null

    return date.toISOString()
}

function buildEndTime(startTime: string, durationMinutes: number) {
    return new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString()
}

export function getEventSessionOccurrences(event: EventScheduleSource): EventSessionOccurrence[] {
    const durationMinutes = getFallbackDurationMinutes(event)
    const configuredSessions = Array.isArray(event.session_config?.sessions)
        ? event.session_config?.sessions ?? []
        : []

    const explicitSessions = configuredSessions
        .map((session, index) => {
            const startTime = normalizeSessionDate(session?.start_time)
            if (!startTime) return null

            const endTime = normalizeSessionDate(session?.end_time) ?? buildEndTime(startTime, durationMinutes)
            return {
                index: index + 1,
                start_time: startTime,
                end_time: endTime,
            }
        })
        .filter((session): session is EventSessionOccurrence => Boolean(session))

    if (explicitSessions.length > 0) {
        return explicitSessions
    }

    const startTime = normalizeSessionDate(event.start_time)
    if (!startTime) return []

    const totalSessions = Math.max(1, Number(event.session_config?.total_sessions) || 1)
    const recurrence = event.session_config?.recurrence
    const shouldBuildWeekly = totalSessions > 1 && typeof recurrence === 'string' && WEEKLY_RECURRENCES.has(recurrence)

    if (!shouldBuildWeekly) {
        return [{
            index: 1,
            start_time: startTime,
            end_time: normalizeSessionDate(event.end_time) ?? buildEndTime(startTime, durationMinutes),
        }]
    }

    const firstStart = new Date(startTime)
    return Array.from({ length: totalSessions }, (_, index) => {
        const sessionStart = new Date(firstStart.getTime() + index * 7 * 24 * 60 * 60 * 1000)
        const sessionStartIso = sessionStart.toISOString()

        return {
            index: index + 1,
            start_time: sessionStartIso,
            end_time: buildEndTime(sessionStartIso, durationMinutes),
        }
    })
}

export function getNextEventSessionOccurrence(event: EventScheduleSource, now = new Date()) {
    const nowTime = now.getTime()

    return getEventSessionOccurrences(event).find((session) => (
        new Date(session.end_time).getTime() >= nowTime
    )) ?? null
}

export function isEventSessionSeriesPast(event: EventScheduleSource, now = new Date()) {
    const sessions = getEventSessionOccurrences(event)
    if (sessions.length === 0) {
        return true
    }

    const nowTime = now.getTime()
    return sessions.every((session) => new Date(session.end_time).getTime() < nowTime)
}

export function getSessionCountLabel(event: EventScheduleSource) {
    const sessionCount = getEventSessionOccurrences(event).length
    return sessionCount > 1 ? `${sessionCount} sesiones` : null
}

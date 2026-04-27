// Timezone helpers for consistent date/time display across the platform

// Common timezones for Latin America + key international ones
export const TIMEZONE_OPTIONS = [
    { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
    { value: 'America/Monterrey', label: 'Monterrey (UTC-6)' },
    { value: 'America/Cancun', label: 'Cancún (UTC-5)' },
    { value: 'America/Tijuana', label: 'Tijuana (UTC-8)' },
    { value: 'America/Hermosillo', label: 'Hermosillo (UTC-7)' },
    { value: 'America/Chihuahua', label: 'Chihuahua (UTC-6)' },
    { value: 'America/Mazatlan', label: 'Mazatlán (UTC-7)' },
    { value: 'America/Bogota', label: 'Bogotá (UTC-5)' },
    { value: 'America/Lima', label: 'Lima (UTC-5)' },
    { value: 'America/Santiago', label: 'Santiago (UTC-3)' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (UTC-3)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
    { value: 'America/New_York', label: 'Nueva York (UTC-5)' },
    { value: 'America/Chicago', label: 'Chicago (UTC-6)' },
    { value: 'America/Los_Angeles', label: 'Los Ángeles (UTC-8)' },
    { value: 'America/Denver', label: 'Denver (UTC-7)' },
    { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
    { value: 'Europe/London', label: 'Londres (UTC+0)' },
]

export const DEFAULT_TIMEZONE = 'America/Mexico_City'

export function formatDateInTimezone(
    dateStr: string | Date,
    options: Intl.DateTimeFormatOptions,
    timezone: string = DEFAULT_TIMEZONE,
    locale: string = 'es-MX'
): string {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr

    if (Number.isNaN(date.getTime())) return ''

    return new Intl.DateTimeFormat(locale, {
        ...options,
        timeZone: timezone || DEFAULT_TIMEZONE,
    }).format(date)
}

export function getCurrentHourInTimezone(timezone: string = DEFAULT_TIMEZONE, now = new Date()) {
    try {
        const formattedHour = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hourCycle: 'h23',
            timeZone: timezone || DEFAULT_TIMEZONE,
        }).format(now)

        return Number(formattedHour)
    } catch {
        return now.getHours()
    }
}

export function getGreetingForTimezone(timezone: string = DEFAULT_TIMEZONE, now = new Date()) {
    const hour = getCurrentHourInTimezone(timezone, now)

    if (hour < 12) return 'Buenos dias'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}

/**
 * Format an event date string in the user's timezone
 */
export function formatEventDate(dateStr: string, timezone?: string): string {
    return formatDateInTimezone(dateStr, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }, timezone)
}

/**
 * Format an event time string in the user's timezone
 */
export function formatEventTime(dateStr: string, timezone?: string): string {
    return formatDateInTimezone(dateStr, {
        hour: '2-digit',
        minute: '2-digit',
    }, timezone)
}

/**
 * Format date and time together
 */
export function formatEventDateTime(dateStr: string, timezone?: string): string {
    return formatDateInTimezone(dateStr, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
    }, timezone)
}

export function getTimezoneShortLabel(timezone: string = DEFAULT_TIMEZONE): string {
    if (!timezone || timezone === DEFAULT_TIMEZONE) return 'CDMX'

    return getTimezoneLabel(timezone).replace(/\s*\(UTC[+-]\d+\)\s*$/, '')
}

export function formatEventDateTimeWithZone(dateStr: string, timezone?: string): string {
    const tz = timezone || DEFAULT_TIMEZONE
    return `${formatEventDateTime(dateStr, tz)} ${getTimezoneShortLabel(tz)}`
}

function getTimeZoneDateParts(date: Date, timezone: string) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    })

    const parts = formatter.formatToParts(date)
    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]))

    return {
        year: Number(lookup.year),
        month: Number(lookup.month),
        day: Number(lookup.day),
        hour: Number(lookup.hour),
        minute: Number(lookup.minute),
        second: Number(lookup.second),
    }
}

function pad(value: number) {
    return String(value).padStart(2, '0')
}

function getTimeZoneOffsetMs(date: Date, timezone: string) {
    const parts = getTimeZoneDateParts(date, timezone)
    const zonedUtcTime = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
    )

    return zonedUtcTime - date.getTime()
}

export function zonedDateTimeToUtcIso(
    dateValue: string,
    timeValue: string,
    timezone: string = DEFAULT_TIMEZONE
) {
    if (!dateValue || !timeValue) return null

    const [year, month, day] = dateValue.split('-').map((part) => Number(part))
    const [hour, minute] = timeValue.split(':').map((part) => Number(part))

    if ([year, month, day, hour, minute].some((part) => !Number.isFinite(part))) {
        return null
    }

    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
    const initialOffset = getTimeZoneOffsetMs(utcGuess, timezone)
    const adjustedDate = new Date(utcGuess.getTime() - initialOffset)
    const adjustedOffset = getTimeZoneOffsetMs(adjustedDate, timezone)
    const finalDate =
        adjustedOffset === initialOffset
            ? adjustedDate
            : new Date(utcGuess.getTime() - adjustedOffset)

    return Number.isNaN(finalDate.getTime()) ? null : finalDate.toISOString()
}

export function getEventInputDateValue(dateStr?: string | null, timezone: string = DEFAULT_TIMEZONE) {
    if (!dateStr) return ''

    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return ''

    const parts = getTimeZoneDateParts(date, timezone)
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

export function getEventInputTimeValue(dateStr?: string | null, timezone: string = DEFAULT_TIMEZONE) {
    if (!dateStr) return ''

    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return ''

    const parts = getTimeZoneDateParts(date, timezone)
    return `${pad(parts.hour)}:${pad(parts.minute)}`
}

/**
 * Get a user-friendly timezone label
 */
export function getTimezoneLabel(timezone: string): string {
    const found = TIMEZONE_OPTIONS.find(tz => tz.value === timezone)
    if (found) return found.label

    // Fallback: format the IANA name nicely
    return timezone.replace(/_/g, ' ').split('/').pop() || timezone
}

/**
 * Check if an event date is in the past relative to now
 */
export function isEventPast(dateStr: string): boolean {
    return new Date(dateStr) < new Date()
}

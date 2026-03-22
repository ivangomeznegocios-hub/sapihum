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

/**
 * Format an event date string in the user's timezone
 */
export function formatEventDate(dateStr: string, timezone?: string): string {
    const tz = timezone || DEFAULT_TIMEZONE
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: tz,
    }).format(date)
}

/**
 * Format an event time string in the user's timezone
 */
export function formatEventTime(dateStr: string, timezone?: string): string {
    const tz = timezone || DEFAULT_TIMEZONE
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz,
    }).format(date)
}

/**
 * Format date and time together
 */
export function formatEventDateTime(dateStr: string, timezone?: string): string {
    const tz = timezone || DEFAULT_TIMEZONE
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz,
    }).format(date)
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

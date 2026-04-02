export type CalendarFeedScope = 'appointments' | 'speaker-events'

export interface IcsCalendarEvent {
    uid: string
    title: string
    start: string | Date
    end: string | Date
    description?: string | null
    location?: string | null
    url?: string | null
    status?: 'CONFIRMED' | 'CANCELLED' | 'TENTATIVE'
}

interface BuildIcsCalendarInput {
    name: string
    description?: string | null
    prodId?: string
    events: IcsCalendarEvent[]
}

function normalizeDate(value: string | Date): Date {
    return value instanceof Date ? value : new Date(value)
}

function formatIcsDate(value: string | Date): string {
    return normalizeDate(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeIcsText(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n/g, '\\n')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
}

function foldIcsLine(line: string): string {
    const limit = 75

    if (line.length <= limit) {
        return line
    }

    const chunks: string[] = []

    for (let index = 0; index < line.length; index += limit) {
        const chunk = line.slice(index, index + limit)
        chunks.push(index === 0 ? chunk : ` ${chunk}`)
    }

    return chunks.join('\r\n')
}

function buildTextLine(key: string, value?: string | null): string | null {
    if (!value) {
        return null
    }

    return foldIcsLine(`${key}:${escapeIcsText(value)}`)
}

function buildRawLine(key: string, value?: string | null): string | null {
    if (!value) {
        return null
    }

    return foldIcsLine(`${key}:${value}`)
}

export function buildIcsCalendar({ name, description, prodId = '-//Comunidad de Psicologia//Calendar Feed//ES', events }: BuildIcsCalendarInput): string {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        foldIcsLine(`PRODID:${prodId}`),
        foldIcsLine(`X-WR-CALNAME:${escapeIcsText(name)}`),
    ]

    const descriptionLine = buildTextLine('X-WR-CALDESC', description ?? null)
    if (descriptionLine) {
        lines.push(descriptionLine)
    }

    for (const event of events) {
        lines.push('BEGIN:VEVENT')
        lines.push(foldIcsLine(`UID:${event.uid}`))
        lines.push(foldIcsLine(`DTSTAMP:${formatIcsDate(new Date())}`))
        lines.push(foldIcsLine(`DTSTART:${formatIcsDate(event.start)}`))
        lines.push(foldIcsLine(`DTEND:${formatIcsDate(event.end)}`))
        lines.push(foldIcsLine(`SUMMARY:${escapeIcsText(event.title)}`))

        const status = buildRawLine('STATUS', event.status ?? 'CONFIRMED')
        if (status) {
            lines.push(status)
        }

        const descriptionText = buildTextLine('DESCRIPTION', event.description ?? null)
        if (descriptionText) {
            lines.push(descriptionText)
        }

        const locationText = buildTextLine('LOCATION', event.location ?? null)
        if (locationText) {
            lines.push(locationText)
        }

        const urlText = buildRawLine('URL', event.url ?? null)
        if (urlText) {
            lines.push(urlText)
        }

        lines.push('END:VEVENT')
    }

    lines.push('END:VCALENDAR')

    return `${lines.join('\r\n')}\r\n`
}

export function buildCalendarFeedUrl(appUrl: string, token: string, scope: CalendarFeedScope): string {
    const baseUrl = appUrl.replace(/\/+$/, '')
    const params = new URLSearchParams({
        token,
        scope,
    })

    return `${baseUrl}/api/calendar/feed?${params.toString()}`
}

export function toWebcalUrl(url: string): string {
    if (url.startsWith('https://')) {
        return `webcal://${url.slice('https://'.length)}`
    }

    if (url.startsWith('http://')) {
        return `webcal://${url.slice('http://'.length)}`
    }

    return url
}

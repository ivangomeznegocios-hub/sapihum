import { getAppUrl } from '@/lib/config/app-url'
import { createServiceClient } from '@/lib/supabase/service'

export const GOOGLE_CALENDAR_PROVIDER = 'google'
export const GOOGLE_CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
export const GOOGLE_CALENDAR_FEATURE_KEY = 'enable_google_calendar_sync'

type CalendarIntegrationProvider = typeof GOOGLE_CALENDAR_PROVIDER
type CalendarIntegrationStatus = 'connected' | 'error' | 'disconnected'

export interface CalendarIntegrationRecord {
    id: string
    user_id: string
    provider: CalendarIntegrationProvider
    status: CalendarIntegrationStatus
    access_token: string | null
    refresh_token: string | null
    expires_at: string | null
    scopes: string[] | null
    selected_calendar_ids: string[] | null
    provider_account_email: string | null
    provider_account_label: string | null
    last_sync_at: string | null
    last_error: string | null
    created_at: string
    updated_at: string
}

export interface GoogleCalendarListEntry {
    id: string
    summary: string
    description: string | null
    primary: boolean
    selected: boolean
    accessRole: string | null
    backgroundColor: string | null
}

export interface ExternalCalendarConflict {
    userId: string
    provider: CalendarIntegrationProvider
    providerAccountLabel: string | null
    busyStart: string
    busyEnd: string
}

export interface ExternalCalendarEvent {
    id: string
    provider: CalendarIntegrationProvider
    title: string
    calendarId: string
    calendarSummary: string
    startTime: string
    endTime: string
    location: string | null
    htmlLink: string | null
    isAllDay: boolean
}

type GoogleTokenResponse = {
    access_token: string
    expires_in?: number
    refresh_token?: string
    scope?: string
    token_type?: string
}

type GoogleFreeBusyResponse = {
    calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>
}

type GoogleEventTime = {
    dateTime?: string
    date?: string
}

type GoogleCalendarEventsResponse = {
    items?: Array<{
        id: string
        summary?: string
        status?: string
        location?: string
        htmlLink?: string
        start?: GoogleEventTime
        end?: GoogleEventTime
    }>
}

function getGoogleCalendarClientId() {
    return process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() || ''
}

function getGoogleCalendarClientSecret() {
    return process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() || ''
}

export function isGoogleCalendarConfigured() {
    return Boolean(getGoogleCalendarClientId() && getGoogleCalendarClientSecret())
}

function readBooleanSetting(value: unknown) {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'string') {
        return value.trim().toLowerCase() === 'true'
    }

    return false
}

export async function isGoogleCalendarFeatureEnabled(supabase?: any) {
    const db = supabase ?? createServiceClient()
    const { data } = await ((db.from('platform_settings' as any) as any)
        .select('value')
        .eq('key', GOOGLE_CALENDAR_FEATURE_KEY)
        .maybeSingle())

    return readBooleanSetting(data?.value)
}

export async function isGoogleCalendarSyncAvailable(supabase?: any) {
    if (!isGoogleCalendarConfigured()) {
        return false
    }

    return await isGoogleCalendarFeatureEnabled(supabase)
}

export function getGoogleCalendarRedirectUri() {
    const configuredRedirect = process.env.GOOGLE_CALENDAR_REDIRECT_URI?.trim()

    if (configuredRedirect) {
        return configuredRedirect
    }

    return `${getAppUrl()}/api/calendar/google/callback`
}

export function buildGoogleCalendarAuthUrl(state: string) {
    if (!isGoogleCalendarConfigured()) {
        throw new Error('Google Calendar OAuth no está configurado')
    }

    const params = new URLSearchParams({
        client_id: getGoogleCalendarClientId(),
        redirect_uri: getGoogleCalendarRedirectUri(),
        response_type: 'code',
        access_type: 'offline',
        include_granted_scopes: 'true',
        prompt: 'consent',
        scope: GOOGLE_CALENDAR_SCOPES.join(' '),
        state,
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

async function readJsonResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
        return await response.json() as T
    }

    const text = await response.text()
    throw new Error(text || 'Respuesta inválida del proveedor')
}

export async function exchangeGoogleCodeForTokens(code: string) {
    if (!isGoogleCalendarConfigured()) {
        throw new Error('Google Calendar OAuth no está configurado')
    }

    const body = new URLSearchParams({
        code,
        client_id: getGoogleCalendarClientId(),
        client_secret: getGoogleCalendarClientSecret(),
        redirect_uri: getGoogleCalendarRedirectUri(),
        grant_type: 'authorization_code',
    })

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        cache: 'no-store',
    })

    if (!response.ok) {
        const error = await readJsonResponse<{ error?: string; error_description?: string }>(response)
        throw new Error(error.error_description || error.error || 'No fue posible intercambiar el código con Google')
    }

    return await readJsonResponse<GoogleTokenResponse>(response)
}

export async function revokeGoogleToken(token: string) {
    if (!token) return

    try {
        await fetch('https://oauth2.googleapis.com/revoke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ token }).toString(),
            cache: 'no-store',
        })
    } catch (error) {
        console.error('[CalendarSync] No se pudo revocar el token de Google:', error)
    }
}

async function refreshGoogleAccessToken(refreshToken: string) {
    if (!isGoogleCalendarConfigured()) {
        throw new Error('Google Calendar OAuth no está configurado')
    }

    const body = new URLSearchParams({
        client_id: getGoogleCalendarClientId(),
        client_secret: getGoogleCalendarClientSecret(),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    })

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        cache: 'no-store',
    })

    if (!response.ok) {
        const error = await readJsonResponse<{ error?: string; error_description?: string }>(response)
        throw new Error(error.error_description || error.error || 'No fue posible refrescar el token de Google')
    }

    return await readJsonResponse<GoogleTokenResponse>(response)
}

export async function getGoogleIntegrationForUser(userId: string, supabase?: any) {
    const db = supabase ?? createServiceClient()
    const { data } = await ((db.from('calendar_integrations' as any) as any)
        .select('*')
        .eq('user_id', userId)
        .eq('provider', GOOGLE_CALENDAR_PROVIDER)
        .maybeSingle())

    return (data as CalendarIntegrationRecord | null) || null
}

async function saveGoogleIntegrationTokenState(
    integrationId: string,
    values: Partial<CalendarIntegrationRecord>,
    supabase?: any
) {
    const db = supabase ?? createServiceClient()

    await ((db.from('calendar_integrations' as any) as any)
        .update({
            ...values,
            updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId))
}

export async function ensureGoogleAccessToken(
    integration: CalendarIntegrationRecord,
    supabase?: any
) {
    const expiresAt = integration.expires_at ? new Date(integration.expires_at).getTime() : 0
    const now = Date.now()

    if (integration.access_token && expiresAt > now + 60_000) {
        return integration.access_token
    }

    if (!integration.refresh_token) {
        throw new Error('La conexión con Google Calendar necesita reconectarse')
    }

    const refreshed = await refreshGoogleAccessToken(integration.refresh_token)
    const nextExpiresAt = refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        : integration.expires_at

    await saveGoogleIntegrationTokenState(integration.id, {
        access_token: refreshed.access_token,
        expires_at: nextExpiresAt || null,
        status: 'connected',
        last_error: null,
        last_sync_at: new Date().toISOString(),
    }, supabase)

    return refreshed.access_token
}

export async function fetchGoogleCalendarList(accessToken: string, selectedCalendarIds: string[] = ['primary']) {
    const url = new URL('https://www.googleapis.com/calendar/v3/users/me/calendarList')
    url.searchParams.set('minAccessRole', 'freeBusyReader')
    url.searchParams.set('showHidden', 'false')
    url.searchParams.set('maxResults', '250')

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
    })

    if (!response.ok) {
        const error = await readJsonResponse<{ error?: { message?: string } }>(response)
        throw new Error(error.error?.message || 'No fue posible obtener los calendarios de Google')
    }

    const data = await readJsonResponse<{
        items?: Array<{
            id: string
            summary?: string
            description?: string
            primary?: boolean
            accessRole?: string
            backgroundColor?: string
            selected?: boolean
        }>
    }>(response)

    return (data.items || []).map((item) => ({
        id: item.id,
        summary: item.summary || item.id,
        description: item.description || null,
        primary: Boolean(item.primary),
        selected: selectedCalendarIds.includes(item.id) || (selectedCalendarIds.length === 0 && Boolean(item.selected)),
        accessRole: item.accessRole || null,
        backgroundColor: item.backgroundColor || null,
    })) satisfies GoogleCalendarListEntry[]
}

function normalizeGoogleEventDateTime(value?: GoogleEventTime) {
    if (value?.dateTime) {
        return {
            value: value.dateTime,
            isAllDay: false,
        }
    }

    if (value?.date) {
        return {
            value: `${value.date}T00:00:00`,
            isAllDay: true,
        }
    }

    return null
}

export async function fetchGoogleCalendarEvents(
    accessToken: string,
    calendars: Array<Pick<GoogleCalendarListEntry, 'id' | 'summary'>>,
    startTimeIso: string,
    endTimeIso: string
) {
    const selectedCalendars = calendars.length > 0
        ? calendars
        : [{ id: 'primary', summary: 'Principal' }]

    const calendarEvents = await Promise.all(selectedCalendars.map(async (calendar) => {
        const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`)
        url.searchParams.set('timeMin', startTimeIso)
        url.searchParams.set('timeMax', endTimeIso)
        url.searchParams.set('singleEvents', 'true')
        url.searchParams.set('orderBy', 'startTime')
        url.searchParams.set('maxResults', '100')

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            const error = await readJsonResponse<{ error?: { message?: string } }>(response)
            throw new Error(error.error?.message || `No fue posible obtener eventos de Google Calendar (${calendar.summary})`)
        }

        const data = await readJsonResponse<GoogleCalendarEventsResponse>(response)

        return (data.items || [])
            .filter((item) => item.status !== 'cancelled')
            .map((item) => {
                const start = normalizeGoogleEventDateTime(item.start)
                const end = normalizeGoogleEventDateTime(item.end)

                if (!start || !end) {
                    return null
                }

                return {
                    id: `${calendar.id}:${item.id}`,
                    provider: GOOGLE_CALENDAR_PROVIDER,
                    title: item.summary?.trim() || 'Bloque ocupado',
                    calendarId: calendar.id,
                    calendarSummary: calendar.summary,
                    startTime: start.value,
                    endTime: end.value,
                    location: item.location || null,
                    htmlLink: item.htmlLink || null,
                    isAllDay: start.isAllDay,
                } satisfies ExternalCalendarEvent
            })
            .filter((event): event is ExternalCalendarEvent => Boolean(event))
    }))

    return calendarEvents
        .flat()
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

export async function queryGoogleFreeBusy(
    accessToken: string,
    calendarIds: string[],
    startTimeIso: string,
    endTimeIso: string
) {
    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            timeMin: startTimeIso,
            timeMax: endTimeIso,
            items: (calendarIds.length > 0 ? calendarIds : ['primary']).map((id) => ({ id })),
        }),
        cache: 'no-store',
    })

    if (!response.ok) {
        const error = await readJsonResponse<{ error?: { message?: string } }>(response)
        throw new Error(error.error?.message || 'No fue posible consultar la disponibilidad en Google Calendar')
    }

    const data = await readJsonResponse<GoogleFreeBusyResponse>(response)
    const busyIntervals: Array<{ start: string; end: string }> = []

    Object.values(data.calendars || {}).forEach((calendarData) => {
        for (const interval of calendarData.busy || []) {
            busyIntervals.push(interval)
        }
    })

    return busyIntervals.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

export async function getGoogleCalendarConnectionState(userId: string) {
    if (!(await isGoogleCalendarSyncAvailable())) {
        return {
            googleConfigured: false,
            integration: null as CalendarIntegrationRecord | null,
            calendars: [] as GoogleCalendarListEntry[],
        }
    }

    const integration = await getGoogleIntegrationForUser(userId)
    if (!integration || integration.status === 'disconnected') {
        return {
            googleConfigured: true,
            integration,
            calendars: [] as GoogleCalendarListEntry[],
        }
    }

    try {
        const accessToken = await ensureGoogleAccessToken(integration)
        const calendars = await fetchGoogleCalendarList(accessToken, integration.selected_calendar_ids || ['primary'])

        return {
            googleConfigured: true,
            integration,
            calendars,
        }
    } catch (error) {
        console.error('[CalendarSync] Error al cargar el estado de Google Calendar:', error)
        return {
            googleConfigured: true,
            integration: {
                ...integration,
                status: 'error',
                last_error: error instanceof Error ? error.message : 'No fue posible conectar con Google Calendar',
            },
            calendars: [] as GoogleCalendarListEntry[],
        }
    }
}

export async function getGoogleCalendarEventsForUser(
    userId: string,
    startTimeIso: string,
    endTimeIso: string
) {
    if (!(await isGoogleCalendarSyncAvailable())) {
        return [] as ExternalCalendarEvent[]
    }

    const db = createServiceClient()
    const integration = await getGoogleIntegrationForUser(userId, db)

    if (!integration || integration.status === 'disconnected') {
        return [] as ExternalCalendarEvent[]
    }

    try {
        const accessToken = await ensureGoogleAccessToken(integration, db)
        const calendars = await fetchGoogleCalendarList(accessToken, integration.selected_calendar_ids || ['primary'])
        const selectedCalendars = calendars.filter((calendar) => calendar.selected)
        const events = await fetchGoogleCalendarEvents(
            accessToken,
            selectedCalendars,
            startTimeIso,
            endTimeIso
        )

        await saveGoogleIntegrationTokenState(integration.id, {
            status: 'connected',
            last_error: null,
            last_sync_at: new Date().toISOString(),
        }, db)

        return events
    } catch (error) {
        console.error('[CalendarSync] Error al obtener eventos externos:', error)

        await saveGoogleIntegrationTokenState(integration.id, {
            status: 'error',
            last_error: error instanceof Error ? error.message : 'No fue posible cargar Google Calendar',
        }, db)

        return [] as ExternalCalendarEvent[]
    }
}

export async function findExternalCalendarConflictForUsers(
    userIds: string[],
    startTimeIso: string,
    endTimeIso: string
) {
    if (!(await isGoogleCalendarSyncAvailable())) {
        return null
    }

    const db = createServiceClient()
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))

    for (const userId of uniqueUserIds) {
        const integration = await getGoogleIntegrationForUser(userId, db)
        if (!integration || integration.status === 'disconnected') {
            continue
        }

        try {
            const accessToken = await ensureGoogleAccessToken(integration, db)
            const busyIntervals = await queryGoogleFreeBusy(
                accessToken,
                integration.selected_calendar_ids || ['primary'],
                startTimeIso,
                endTimeIso
            )

            if (busyIntervals.length > 0) {
                return {
                    userId,
                    provider: GOOGLE_CALENDAR_PROVIDER,
                    providerAccountLabel: integration.provider_account_label || integration.provider_account_email,
                    busyStart: busyIntervals[0].start,
                    busyEnd: busyIntervals[0].end,
                } satisfies ExternalCalendarConflict
            }

            await saveGoogleIntegrationTokenState(integration.id, {
                status: 'connected',
                last_error: null,
                last_sync_at: new Date().toISOString(),
            }, db)
        } catch (error) {
            console.error('[CalendarSync] Error al consultar disponibilidad externa:', error)

            await saveGoogleIntegrationTokenState(integration.id, {
                status: 'error',
                last_error: error instanceof Error ? error.message : 'No fue posible consultar Google Calendar',
            }, db)

            throw error
        }
    }

    return null
}

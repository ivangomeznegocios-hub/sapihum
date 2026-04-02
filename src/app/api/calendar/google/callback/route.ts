import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeGoogleCodeForTokens, fetchGoogleCalendarList, getGoogleIntegrationForUser, isGoogleCalendarSyncAvailable } from '@/lib/calendar-sync'

const GOOGLE_STATE_COOKIE = 'calendar_google_state'
const GOOGLE_NEXT_COOKIE = 'calendar_google_next'

function sanitizeNext(value: string | null | undefined) {
    if (value?.startsWith('/')) {
        return value
    }

    return '/dashboard/settings?section=calendar#calendar-sync'
}

function appendNotice(next: string, key: string, value: string) {
    const url = new URL(next, 'http://localhost')
    url.searchParams.set(key, value)
    return `${url.pathname}${url.search}${url.hash}`
}

function clearOAuthCookies(response: NextResponse) {
    response.cookies.delete(GOOGLE_STATE_COOKIE)
    response.cookies.delete(GOOGLE_NEXT_COOKIE)
    return response
}

export async function GET(request: NextRequest) {
    const cookieStore = await cookies()
    const next = sanitizeNext(cookieStore.get(GOOGLE_NEXT_COOKIE)?.value)
    const stateCookie = cookieStore.get(GOOGLE_STATE_COOKIE)?.value
    const redirectUrl = new URL(next, request.nextUrl.origin)

    if (!(await isGoogleCalendarSyncAvailable())) {
        redirectUrl.searchParams.set('calendar_notice', 'google_unavailable')
        return clearOAuthCookies(NextResponse.redirect(redirectUrl))
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        const loginUrl = new URL('/auth/login', request.nextUrl.origin)
        loginUrl.searchParams.set('next', '/dashboard/settings?section=calendar#calendar-sync')
        return clearOAuthCookies(NextResponse.redirect(loginUrl))
    }

    const error = request.nextUrl.searchParams.get('error')
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')

    if (error) {
        redirectUrl.searchParams.set('calendar_notice', 'google_denied')
        return clearOAuthCookies(NextResponse.redirect(redirectUrl))
    }

    if (!code || !state || !stateCookie || state !== stateCookie) {
        redirectUrl.searchParams.set('calendar_notice', 'google_state_error')
        return clearOAuthCookies(NextResponse.redirect(redirectUrl))
    }

    try {
        const existingIntegration = await getGoogleIntegrationForUser(user.id, supabase)
        const tokens = await exchangeGoogleCodeForTokens(code)
        const calendars = await fetchGoogleCalendarList(
            tokens.access_token,
            existingIntegration?.selected_calendar_ids || ['primary']
        )

        const selectedCalendarIds = calendars.length > 0
            ? calendars.filter((calendar) => calendar.selected).map((calendar) => calendar.id)
            : ['primary']

        const primaryCalendar = calendars.find((calendar) => calendar.primary) || calendars[0]
        const scopes = typeof tokens.scope === 'string'
            ? tokens.scope.split(' ').filter(Boolean)
            : (existingIntegration?.scopes || [])

        const nextExpiresAt = tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : existingIntegration?.expires_at || null

        const refreshToken = tokens.refresh_token || existingIntegration?.refresh_token || null

        const upsertPayload = {
            user_id: user.id,
            provider: 'google',
            status: 'connected',
            access_token: tokens.access_token,
            refresh_token: refreshToken,
            expires_at: nextExpiresAt,
            scopes,
            selected_calendar_ids: selectedCalendarIds.length > 0 ? selectedCalendarIds : ['primary'],
            provider_account_email: primaryCalendar?.primary ? primaryCalendar.summary : existingIntegration?.provider_account_email || null,
            provider_account_label: primaryCalendar?.summary || existingIntegration?.provider_account_label || 'Google Calendar',
            last_sync_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
        }

        const { error: upsertError } = await ((supabase.from('calendar_integrations' as any) as any)
            .upsert(upsertPayload, { onConflict: 'user_id,provider' }))

        if (upsertError) {
            throw new Error(upsertError.message)
        }

        return clearOAuthCookies(NextResponse.redirect(new URL(
            appendNotice(next, 'calendar_notice', 'google_connected'),
            request.nextUrl.origin
        )))
    } catch (callbackError) {
        console.error('[CalendarSync] Error al completar callback de Google Calendar:', callbackError)
        redirectUrl.searchParams.set('calendar_notice', 'google_error')
        return clearOAuthCookies(NextResponse.redirect(redirectUrl))
    }
}

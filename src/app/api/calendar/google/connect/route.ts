import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildGoogleCalendarAuthUrl, isGoogleCalendarSyncAvailable } from '@/lib/calendar-sync'

const GOOGLE_STATE_COOKIE = 'calendar_google_state'
const GOOGLE_NEXT_COOKIE = 'calendar_google_next'

function resolveSafeNext(value: string | null) {
    if (value?.startsWith('/')) {
        return value
    }

    return '/dashboard/settings?section=calendar#calendar-sync'
}

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/auth/login'
        loginUrl.searchParams.set('next', '/dashboard/settings?section=calendar#calendar-sync')
        return NextResponse.redirect(loginUrl)
    }

    const next = resolveSafeNext(request.nextUrl.searchParams.get('next'))
    const redirectUrl = new URL(next, request.nextUrl.origin)

    if (!(await isGoogleCalendarSyncAvailable())) {
        redirectUrl.searchParams.set('calendar_notice', 'google_unavailable')
        return NextResponse.redirect(redirectUrl)
    }

    const state = crypto.randomBytes(32).toString('hex')
    const response = NextResponse.redirect(buildGoogleCalendarAuthUrl(state))

    response.cookies.set(GOOGLE_STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 10,
    })

    response.cookies.set(GOOGLE_NEXT_COOKIE, next, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 10,
    })

    return response
}

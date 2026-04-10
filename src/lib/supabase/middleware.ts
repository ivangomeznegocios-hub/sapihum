import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_CALLBACK_QUERY_KEYS = new Set([
    'code',
    'token_hash',
    'type',
    'next',
    'access_token',
    'refresh_token',
    'expires_at',
    'expires_in',
])

function hasAuthCallbackPayload(request: NextRequest) {
    const search = request.nextUrl.searchParams
    return search.has('code') || (search.has('token_hash') && search.has('type'))
}

function getAuthCallbackNext(request: NextRequest) {
    const explicitNext = request.nextUrl.searchParams.get('next')
    if (explicitNext?.startsWith('/')) {
        return explicitNext
    }

    const fallbackPath =
        request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/auth')
            ? '/mi-acceso'
            : request.nextUrl.pathname

    const passthroughParams = new URLSearchParams()
    request.nextUrl.searchParams.forEach((value, key) => {
        if (!AUTH_CALLBACK_QUERY_KEYS.has(key)) {
            passthroughParams.append(key, value)
        }
    })

    const passthroughQuery = passthroughParams.toString()
    return passthroughQuery ? `${fallbackPath}?${passthroughQuery}` : fallbackPath
}

export async function updateSession(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    if (pathname !== '/auth/callback' && hasAuthCallbackPayload(request)) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/callback'

        if (!url.searchParams.get('next')) {
            url.searchParams.set('next', getAuthCallbackNext(request))
        }

        return NextResponse.redirect(url)
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()
    const needsProfileGuard = pathname.startsWith('/dashboard') || pathname.startsWith('/auth')
    const { data: profile } =
        user && needsProfileGuard
            ? await (supabase
                .from('profiles') as any)
                .select('id')
                .eq('id', user.id)
                .maybeSingle()
            : { data: null }

    // Protected routes - redirect to login if no user
    if (
        !user &&
        pathname.startsWith('/dashboard')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('next', pathname)
        return NextResponse.redirect(url)
    }

    if (
        user &&
        !profile &&
        pathname.startsWith('/dashboard')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('next', pathname)
        url.searchParams.set('error', 'profile_not_found')
        return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages
    if (
        user &&
        profile &&
        pathname.startsWith('/auth') &&
        pathname !== '/auth/callback' &&
        pathname !== '/auth/update-password'
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Note: Public routes like /lp/, /blog, etc. fall through here and never redirect.
    return supabaseResponse
}

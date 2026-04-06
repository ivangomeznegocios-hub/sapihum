const LOCAL_DEV_APP_URL = 'http://localhost:3000'

function normalizeAppUrl(value: string): string {
    return value.replace(/\/+$/, '')
}

function ensureLeadingSlash(pathname: string): string {
    return pathname.startsWith('/') ? pathname : `/${pathname}`
}

export function getAppUrl(): string {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

    if (configuredUrl) {
        return normalizeAppUrl(configuredUrl)
    }

    if (process.env.NODE_ENV === 'development') {
        return LOCAL_DEV_APP_URL
    }

    throw new Error('NEXT_PUBLIC_APP_URL must be configured outside local development')
}

export function buildAuthCallbackUrl(options: { nextPath?: string; type?: string | null } = {}): string {
    const callbackUrl = new URL('/auth/callback', getAppUrl())
    const nextPath = options.nextPath?.trim()
    callbackUrl.searchParams.set('next', ensureLeadingSlash(nextPath && nextPath.length > 0 ? nextPath : '/dashboard'))

    if (options.type) {
        callbackUrl.searchParams.set('type', options.type)
    }

    return callbackUrl.toString()
}

const LOCAL_DEV_APP_URL = 'http://localhost:3000'

function normalizeAppUrl(value: string): string {
    return value.replace(/\/+$/, '')
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

const PII_KEY_PATTERN = /(email|mail|phone|telefono|mobile|nombre|name|full.?name|patient|password|token|secret|document|address|notes?|clinical|meeting|whatsapp_url)/i

function truncateString(value: string, limit = 160) {
    return value.length > limit ? value.slice(0, limit) : value
}

function sanitizeUrlValue(value: string) {
    if (value.startsWith('tel:')) return 'tel:'
    if (value.startsWith('mailto:')) return 'mailto:'
    if (value.includes('wa.me') || value.includes('api.whatsapp.com')) return 'whatsapp'

    try {
        const parsed = new URL(value)
        return parsed.pathname || '/'
    } catch {
        if (value.startsWith('/')) {
            return value.split('?')[0].split('#')[0] || '/'
        }

        return truncateString(value)
    }
}

function sanitizeObject(value: Record<string, unknown>, depth: number): Record<string, unknown> | null {
    if (depth > 2) return null

    const entries = Object.entries(value)
        .filter(([key]) => !PII_KEY_PATTERN.test(key))
        .map(([key, nestedValue]) => [key, sanitizeValue(key, nestedValue, depth + 1)] as const)
        .filter(([, nestedValue]) => nestedValue !== null && nestedValue !== undefined)

    if (entries.length === 0) {
        return null
    }

    return Object.fromEntries(entries)
}

function sanitizeValue(key: string, value: unknown, depth = 0): unknown {
    if (value === null || value === undefined) return null
    if (typeof value === 'number' || typeof value === 'boolean') return value
    if (typeof value === 'string') {
        if (key.toLowerCase().includes('url') || key.toLowerCase().includes('href') || value.startsWith('/') || value.startsWith('http')) {
            return sanitizeUrlValue(value)
        }

        return truncateString(value)
    }

    if (Array.isArray(value)) {
        return value
            .map((entry) => sanitizeValue(key, entry, depth + 1))
            .filter((entry) => entry !== null)
            .slice(0, 12)
    }

    if (typeof value === 'object') {
        return sanitizeObject(value as Record<string, unknown>, depth)
    }

    return null
}

export function sanitizeTrackingProperties(properties: Record<string, unknown> | null | undefined) {
    if (!properties) return {}

    const sanitizedEntries = Object.entries(properties)
        .filter(([key]) => !PII_KEY_PATTERN.test(key))
        .map(([key, value]) => [key, sanitizeValue(key, value)] as const)
        .filter(([, value]) => value !== null && value !== undefined)

    return Object.fromEntries(sanitizedEntries)
}

export type TrackingZone = 'public_safe' | 'public_restricted' | 'private_app' | 'sensitive' | 'unknown'

export type TrackingPageType =
    | 'home'
    | 'marketing_index'
    | 'pricing'
    | 'blog_index'
    | 'blog_article'
    | 'event_index'
    | 'event_detail'
    | 'formation_index'
    | 'formation_detail'
    | 'course_index'
    | 'course_detail'
    | 'specialization_index'
    | 'specialization_detail'
    | 'recording_index'
    | 'recording_detail'
    | 'speaker_index'
    | 'speaker_detail'
    | 'content_hub'
    | 'access_library'
    | 'auth_login'
    | 'auth_register'
    | 'auth_recovery'
    | 'auth_update_password'
    | 'auth_callback'
    | 'purchase_success'
    | 'purchase_cancelled'
    | 'purchase_recovery'
    | 'embed'
    | 'dashboard'
    | 'dashboard_sensitive'
    | 'unknown'

export type TrackingContentType =
    | 'none'
    | 'blog_post'
    | 'event'
    | 'formation'
    | 'course'
    | 'specialization'
    | 'recording'
    | 'speaker'
    | 'purchase'

export type TrackingDestination =
    | 'first_party_analytics'
    | 'gtm'
    | 'ga4'
    | 'google_ads'
    | 'meta_pixel'
    | 'meta_capi'
    | 'tiktok_pixel'
    | 'tiktok_events_api'
    | 'linkedin_insight'
    | 'clarity'
    | 'onesignal'

export interface TrackingDestinationMatrix {
    firstPartyAnalytics: boolean
    gtm: boolean
    ga4: boolean
    googleAds: boolean
    metaPixel: boolean
    metaCapi: boolean
    tiktokPixel: boolean
    tiktokEventsApi: boolean
    linkedinInsight: boolean
    clarity: boolean
    oneSignal: boolean
}

export interface TrackingRouteContext {
    pathname: string
    zone: TrackingZone
    pageType: TrackingPageType
    contentType: TrackingContentType
    destinations: TrackingDestinationMatrix
    allowAutoPageView: boolean
    allowAutoViewContent: boolean
    allowAutoClickTracking: boolean
    allowAutoFormTracking: boolean
}

const SENSITIVE_PREFIXES = [
    '/dashboard/patients',
    '/dashboard/session',
    '/dashboard/booking',
    '/dashboard/calendar',
    '/dashboard/messages',
    '/dashboard/documents',
    '/dashboard/tools',
    '/dashboard/tasks',
    '/api/clinical-records',
] as const

const PUBLIC_RESTRICTED_PREFIXES = ['/auth', '/compras', '/hub'] as const

const PUBLIC_SAFE_PREFIXES = [
    '/',
    '/academia',
    '/blog',
    '/comunidad',
    '/cursos',
    '/especialidades',
    '/eventos',
    '/formaciones',
    '/grabaciones',
    '/investigacion',
    '/manifiesto',
    '/nosotros',
    '/precios',
    '/recursos',
    '/speakers',
    '/membresia',
] as const

function isRootPath(pathname: string) {
    return pathname === '/'
}

function matchesPrefix(pathname: string, prefix: string) {
    return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function hasEmbedSegment(pathname: string) {
    return pathname === '/embed' || pathname.endsWith('/embed') || pathname.includes('/embed/')
}

function isAcquisitionUtilityPageType(pageType: TrackingPageType) {
    return (
        pageType === 'auth_login'
        || pageType === 'auth_register'
        || pageType === 'auth_recovery'
        || pageType === 'auth_update_password'
        || pageType === 'purchase_success'
        || pageType === 'purchase_cancelled'
        || pageType === 'purchase_recovery'
    )
}

function isDetailPage(pathname: string, prefix: string) {
    if (!matchesPrefix(pathname, prefix)) return false
    const remainder = pathname.slice(prefix.length).split('/').filter(Boolean)
    return remainder.length >= 1
}

function normalizePathnameInput(pathname: string | null | undefined) {
    const raw = pathname?.trim() || '/'
    const withoutHash = raw.split('#')[0] || '/'
    const withoutQuery = withoutHash.split('?')[0] || '/'
    if (withoutQuery === '/') return '/'
    return withoutQuery.replace(/\/+$/, '')
}

export function normalizeTrackingPathname(pathname: string | null | undefined) {
    return normalizePathnameInput(pathname)
}

export function classifyTrackingZone(pathname: string | null | undefined): TrackingZone {
    const normalizedPath = normalizeTrackingPathname(pathname)

    if (SENSITIVE_PREFIXES.some((prefix) => matchesPrefix(normalizedPath, prefix))) {
        return 'sensitive'
    }

    if (matchesPrefix(normalizedPath, '/dashboard')) {
        return 'private_app'
    }

    if (
        normalizedPath === '/mi-acceso'
        || normalizedPath === '/gracias'
        || hasEmbedSegment(normalizedPath)
        || PUBLIC_RESTRICTED_PREFIXES.some((prefix) => matchesPrefix(normalizedPath, prefix))
        || matchesPrefix(normalizedPath, '/events')
    ) {
        return 'public_restricted'
    }

    if (PUBLIC_SAFE_PREFIXES.some((prefix) => isRootPath(prefix) ? normalizedPath === '/' : matchesPrefix(normalizedPath, prefix))) {
        return 'public_safe'
    }

    return 'unknown'
}

export function inferTrackingPageType(pathname: string | null | undefined): TrackingPageType {
    const normalizedPath = normalizeTrackingPathname(pathname)

    if (normalizedPath === '/') return 'home'
    if (normalizedPath === '/precios' || normalizedPath === '/membresia') return 'pricing'
    if (normalizedPath === '/blog') return 'blog_index'
    if (isDetailPage(normalizedPath, '/blog')) return 'blog_article'
    if (normalizedPath === '/eventos') return 'event_index'
    if (isDetailPage(normalizedPath, '/eventos')) return hasEmbedSegment(normalizedPath) ? 'embed' : 'event_detail'
    if (normalizedPath === '/formaciones') return 'formation_index'
    if (isDetailPage(normalizedPath, '/formaciones')) return 'formation_detail'
    if (normalizedPath === '/cursos') return 'course_index'
    if (isDetailPage(normalizedPath, '/cursos')) return hasEmbedSegment(normalizedPath) ? 'embed' : 'course_detail'
    if (normalizedPath === '/especialidades') return 'specialization_index'
    if (isDetailPage(normalizedPath, '/especialidades')) return 'specialization_detail'
    if (normalizedPath === '/grabaciones') return 'recording_index'
    if (isDetailPage(normalizedPath, '/grabaciones')) return hasEmbedSegment(normalizedPath) ? 'embed' : 'recording_detail'
    if (normalizedPath === '/speakers') return 'speaker_index'
    if (isDetailPage(normalizedPath, '/speakers')) return 'speaker_detail'
    if (normalizedPath === '/mi-acceso') return 'access_library'
    if (matchesPrefix(normalizedPath, '/hub')) return 'content_hub'
    if (normalizedPath === '/auth/login') return 'auth_login'
    if (normalizedPath === '/auth/register') return 'auth_register'
    if (normalizedPath === '/auth/forgot-password') return 'auth_recovery'
    if (normalizedPath === '/auth/update-password') return 'auth_update_password'
    if (normalizedPath === '/auth/callback') return 'auth_callback'
    if (normalizedPath === '/gracias') return 'purchase_success'
    if (normalizedPath === '/compras/exito' || normalizedPath === '/dashboard/payment-success') return 'purchase_success'
    if (normalizedPath === '/compras/cancelada' || normalizedPath === '/dashboard/payment-cancelled') return 'purchase_cancelled'
    if (normalizedPath === '/compras/recuperar') return 'purchase_recovery'
    if (hasEmbedSegment(normalizedPath)) return 'embed'
    if (matchesPrefix(normalizedPath, '/dashboard')) {
        return classifyTrackingZone(normalizedPath) === 'sensitive' ? 'dashboard_sensitive' : 'dashboard'
    }
    if (classifyTrackingZone(normalizedPath) === 'public_safe') return 'marketing_index'

    return 'unknown'
}

export function inferTrackingContentType(pathname: string | null | undefined): TrackingContentType {
    const normalizedPath = normalizeTrackingPathname(pathname)
    const pageType = inferTrackingPageType(normalizedPath)

    if (pageType === 'blog_article') return 'blog_post'
    if (pageType === 'event_detail') return 'event'
    if (pageType === 'formation_detail') return 'formation'
    if (pageType === 'course_detail') return 'course'
    if (pageType === 'specialization_detail') return 'specialization'
    if (pageType === 'recording_detail') return 'recording'
    if (pageType === 'speaker_detail') return 'speaker'
    if (pageType === 'purchase_success' || pageType === 'purchase_cancelled') return 'purchase'

    return 'none'
}

function buildDestinationMatrix(zone: TrackingZone, pageType: TrackingPageType): TrackingDestinationMatrix {
    const allowExternalAcquisitionTracking = zone === 'public_safe' || isAcquisitionUtilityPageType(pageType)

    return {
        firstPartyAnalytics: zone !== 'unknown',
        gtm: allowExternalAcquisitionTracking,
        ga4: allowExternalAcquisitionTracking,
        googleAds: allowExternalAcquisitionTracking,
        metaPixel: allowExternalAcquisitionTracking,
        metaCapi: allowExternalAcquisitionTracking,
        tiktokPixel: allowExternalAcquisitionTracking,
        tiktokEventsApi: allowExternalAcquisitionTracking,
        linkedinInsight: allowExternalAcquisitionTracking,
        clarity: allowExternalAcquisitionTracking,
        oneSignal: zone === 'public_safe',
    }
}

function allowRestrictedPageView(pathname: string) {
    return (
        matchesPrefix(pathname, '/auth/login')
        || matchesPrefix(pathname, '/auth/register')
        || matchesPrefix(pathname, '/auth/forgot-password')
        || matchesPrefix(pathname, '/auth/update-password')
        || matchesPrefix(pathname, '/compras/exito')
        || matchesPrefix(pathname, '/compras/cancelada')
        || matchesPrefix(pathname, '/compras/recuperar')
        || pathname === '/gracias'
    )
}

function allowRestrictedFormTracking(pathname: string) {
    return (
        matchesPrefix(pathname, '/auth/login')
        || matchesPrefix(pathname, '/auth/register')
        || matchesPrefix(pathname, '/auth/forgot-password')
        || matchesPrefix(pathname, '/compras/recuperar')
    )
}

export function resolveTrackingRouteContext(pathname: string | null | undefined): TrackingRouteContext {
    const normalizedPath = normalizeTrackingPathname(pathname)
    const zone = classifyTrackingZone(normalizedPath)
    const pageType = inferTrackingPageType(normalizedPath)
    const contentType = inferTrackingContentType(normalizedPath)
    const destinations = buildDestinationMatrix(zone, pageType)
    const allowUtilityPageView =
        pageType === 'purchase_success'
        || pageType === 'purchase_cancelled'
        || pageType === 'purchase_recovery'
        || pageType === 'auth_login'
        || pageType === 'auth_register'
        || pageType === 'auth_recovery'
        || pageType === 'auth_update_password'
    const allowAutoPageView =
        zone === 'public_safe'
        || allowUtilityPageView
        || (zone === 'public_restricted' && allowRestrictedPageView(normalizedPath))
    const allowAutoViewContent = zone === 'public_safe' && contentType !== 'none'
    const allowAutoClickTracking = zone === 'public_safe' || (zone === 'public_restricted' && isAcquisitionUtilityPageType(pageType))
    const allowAutoFormTracking = zone === 'public_safe' || (zone === 'public_restricted' && allowRestrictedFormTracking(normalizedPath))

    return {
        pathname: normalizedPath,
        zone,
        pageType,
        contentType,
        destinations,
        allowAutoPageView,
        allowAutoViewContent,
        allowAutoClickTracking,
        allowAutoFormTracking,
    }
}

export function shouldDisplayCookieControls(pathname: string | null | undefined) {
    return classifyTrackingZone(pathname) === 'public_safe'
}

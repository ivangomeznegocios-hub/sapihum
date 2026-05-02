import type { StoredConsentState } from '@/lib/consent'
import type { TrackingDestination, TrackingZone } from './policy'

export type TrackingConsentCategory = 'analytics' | 'marketing'
export type TrackingDestinationKind = 'first-party' | 'tag-manager' | 'client-pixel' | 'server-api'

export interface TrackingDestinationDefinition {
    id: TrackingDestination
    kind: TrackingDestinationKind
    consentCategories: TrackingConsentCategory[]
    allowedZones: TrackingZone[]
    envFlag?: string
}

const PUBLIC_SAFE_ONLY: TrackingZone[] = ['public_safe']
const NON_SENSITIVE_ZONES: TrackingZone[] = ['public_safe', 'public_restricted', 'private_app', 'unknown']
const ALL_ZONES: TrackingZone[] = ['public_safe', 'public_restricted', 'private_app', 'sensitive', 'unknown']

export const TRACKING_DESTINATION_REGISTRY: Record<TrackingDestination, TrackingDestinationDefinition> = {
    first_party_analytics: {
        id: 'first_party_analytics',
        kind: 'first-party',
        consentCategories: ['analytics', 'marketing'],
        allowedZones: ALL_ZONES,
    },
    gtm: {
        id: 'gtm',
        kind: 'tag-manager',
        consentCategories: ['analytics', 'marketing'],
        allowedZones: PUBLIC_SAFE_ONLY,
        envFlag: 'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID',
    },
    ga4: {
        id: 'ga4',
        kind: 'client-pixel',
        consentCategories: ['analytics'],
        allowedZones: PUBLIC_SAFE_ONLY,
        envFlag: 'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID',
    },
    google_ads: {
        id: 'google_ads',
        kind: 'client-pixel',
        consentCategories: ['marketing'],
        allowedZones: PUBLIC_SAFE_ONLY,
        envFlag: 'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID',
    },
    meta_pixel: {
        id: 'meta_pixel',
        kind: 'client-pixel',
        consentCategories: ['marketing'],
        allowedZones: PUBLIC_SAFE_ONLY,
        envFlag: 'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID',
    },
    meta_capi: {
        id: 'meta_capi',
        kind: 'server-api',
        consentCategories: ['marketing'],
        allowedZones: NON_SENSITIVE_ZONES,
        envFlag: 'ENABLE_META_SERVER_TRACKING',
    },
    tiktok_pixel: {
        id: 'tiktok_pixel',
        kind: 'client-pixel',
        consentCategories: ['marketing'],
        allowedZones: PUBLIC_SAFE_ONLY,
        envFlag: 'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID',
    },
    tiktok_events_api: {
        id: 'tiktok_events_api',
        kind: 'server-api',
        consentCategories: ['marketing'],
        allowedZones: NON_SENSITIVE_ZONES,
        envFlag: 'ENABLE_TIKTOK_SERVER_TRACKING',
    },
    linkedin_insight: {
        id: 'linkedin_insight',
        kind: 'client-pixel',
        consentCategories: ['marketing'],
        allowedZones: PUBLIC_SAFE_ONLY,
        envFlag: 'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID',
    },
    clarity: {
        id: 'clarity',
        kind: 'client-pixel',
        consentCategories: ['analytics'],
        allowedZones: PUBLIC_SAFE_ONLY,
        envFlag: 'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID',
    },
    onesignal: {
        id: 'onesignal',
        kind: 'client-pixel',
        consentCategories: ['marketing'],
        allowedZones: PUBLIC_SAFE_ONLY,
        envFlag: 'NEXT_PUBLIC_ONESIGNAL_APP_ID',
    },
}

export function getTrackingDestinationDefinition(destination: TrackingDestination) {
    return TRACKING_DESTINATION_REGISTRY[destination]
}

export function isTrackingDestinationAllowedByConsent(
    destination: TrackingDestination,
    consent: StoredConsentState | null | undefined
) {
    if (!consent) return false

    const definition = getTrackingDestinationDefinition(destination)
    return definition.consentCategories.some((category) => {
        if (category === 'analytics') return consent.analytics
        if (category === 'marketing') return consent.marketing
        return false
    })
}

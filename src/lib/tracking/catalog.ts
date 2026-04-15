import type { AnalyticsEventName } from '@/lib/analytics/types'
import type { TrackingDestination, TrackingRouteContext, TrackingZone } from './policy'

export type CanonicalTrackingEventName =
    | 'page_view'
    | 'view_content'
    | 'click_whatsapp'
    | 'click_phone'
    | 'form_start'
    | 'form_submit'
    | 'generate_lead'
    | 'book_appointment'
    | 'begin_checkout'
    | 'purchase'
    | 'sign_up'
    | 'cta_clicked'

export interface TrackingEventDefinition {
    internalName: AnalyticsEventName
    canonicalName: CanonicalTrackingEventName
    allowedDestinations: TrackingDestination[]
    allowOnZones?: TrackingZone[]
    description: string
}

const ALL_ZONES: TrackingZone[] = ['public_safe', 'public_restricted', 'private_app', 'sensitive', 'unknown']
const NON_SENSITIVE_ZONES: TrackingZone[] = ['public_safe', 'public_restricted', 'private_app', 'unknown']

export const TRACKING_EVENT_DEFINITIONS: Record<AnalyticsEventName, TrackingEventDefinition> = {
    page_view: {
        internalName: 'page_view',
        canonicalName: 'page_view',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4', 'clarity'],
        allowOnZones: ALL_ZONES,
        description: 'Page impression for approved routes.',
    },
    view_content: {
        internalName: 'view_content',
        canonicalName: 'view_content',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4', 'meta_pixel', 'tiktok_pixel', 'linkedin_insight'],
        allowOnZones: ['public_safe'],
        description: 'Content detail view on a public marketing page.',
    },
    click_whatsapp: {
        internalName: 'click_whatsapp',
        canonicalName: 'click_whatsapp',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4'],
        allowOnZones: NON_SENSITIVE_ZONES,
        description: 'Click on a WhatsApp CTA.',
    },
    click_phone: {
        internalName: 'click_phone',
        canonicalName: 'click_phone',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4'],
        allowOnZones: NON_SENSITIVE_ZONES,
        description: 'Click on a phone CTA.',
    },
    form_start: {
        internalName: 'form_start',
        canonicalName: 'form_start',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4'],
        allowOnZones: NON_SENSITIVE_ZONES,
        description: 'First interaction on a tracked form.',
    },
    form_submit: {
        internalName: 'form_submit',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4'],
        allowOnZones: NON_SENSITIVE_ZONES,
        description: 'Submit attempt on a tracked form.',
    },
    generate_lead: {
        internalName: 'generate_lead',
        canonicalName: 'generate_lead',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4', 'meta_pixel', 'meta_capi', 'tiktok_pixel', 'tiktok_events_api'],
        allowOnZones: ['public_safe'],
        description: 'Canonical lead-generation event.',
    },
    book_appointment: {
        internalName: 'book_appointment',
        canonicalName: 'book_appointment',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['sensitive'],
        description: 'Confirmed appointment booking in the clinical workspace.',
    },
    begin_checkout: {
        internalName: 'begin_checkout',
        canonicalName: 'begin_checkout',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4', 'google_ads', 'meta_pixel', 'tiktok_pixel'],
        allowOnZones: ['public_safe'],
        description: 'Canonical checkout-start event.',
    },
    purchase: {
        internalName: 'purchase',
        canonicalName: 'purchase',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4', 'meta_capi'],
        allowOnZones: ['public_safe'],
        description: 'Canonical purchase confirmation event.',
    },
    sign_up: {
        internalName: 'sign_up',
        canonicalName: 'sign_up',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4'],
        allowOnZones: ['public_safe', 'public_restricted'],
        description: 'Canonical sign-up event.',
    },
    cta_clicked: {
        internalName: 'cta_clicked',
        canonicalName: 'cta_clicked',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4'],
        allowOnZones: ['public_safe'],
        description: 'Generic CTA click on a public marketing page.',
    },
    registration_started: {
        internalName: 'registration_started',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['public_restricted'],
        description: 'Registration submit started.',
    },
    registration_completed: {
        internalName: 'registration_completed',
        canonicalName: 'sign_up',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['public_restricted'],
        description: 'Account sign-up succeeded.',
    },
    registration_verified: {
        internalName: 'registration_verified',
        canonicalName: 'sign_up',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['public_restricted'],
        description: 'Email verification completed for a sign-up.',
    },
    waitlist_joined: {
        internalName: 'waitlist_joined',
        canonicalName: 'generate_lead',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4', 'meta_pixel', 'meta_capi', 'tiktok_pixel', 'tiktok_events_api'],
        allowOnZones: ['public_safe'],
        description: 'Waitlist join for a future specialization.',
    },
    invite_applied: {
        internalName: 'invite_applied',
        canonicalName: 'cta_clicked',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['public_restricted'],
        description: 'Invite code was applied.',
    },
    invite_activated: {
        internalName: 'invite_activated',
        canonicalName: 'sign_up',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['public_restricted'],
        description: 'Invite activation completed.',
    },
    checkout_started: {
        internalName: 'checkout_started',
        canonicalName: 'begin_checkout',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4', 'google_ads', 'meta_pixel', 'tiktok_pixel'],
        allowOnZones: ['public_safe', 'private_app'],
        description: 'Checkout flow started.',
    },
    payment_completed: {
        internalName: 'payment_completed',
        canonicalName: 'purchase',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4', 'meta_capi'],
        allowOnZones: ['public_safe', 'public_restricted', 'private_app'],
        description: 'Payment completed and reconciled.',
    },
    payment_failed: {
        internalName: 'payment_failed',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['public_safe', 'public_restricted', 'private_app'],
        description: 'Payment failed.',
    },
    payment_refunded: {
        internalName: 'payment_refunded',
        canonicalName: 'purchase',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['public_safe', 'public_restricted', 'private_app'],
        description: 'Payment refunded.',
    },
    subscription_created: {
        internalName: 'subscription_created',
        canonicalName: 'purchase',
        allowedDestinations: ['first_party_analytics', 'ga4', 'meta_capi'],
        allowOnZones: ['public_safe', 'private_app'],
        description: 'Subscription activated.',
    },
    subscription_renewed: {
        internalName: 'subscription_renewed',
        canonicalName: 'purchase',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Subscription renewal completed.',
    },
    subscription_cancelled: {
        internalName: 'subscription_cancelled',
        canonicalName: 'purchase',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Subscription cancelled.',
    },
    subscription_past_due: {
        internalName: 'subscription_past_due',
        canonicalName: 'purchase',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Subscription went past due.',
    },
    event_registered: {
        internalName: 'event_registered',
        canonicalName: 'generate_lead',
        allowedDestinations: ['first_party_analytics', 'gtm', 'ga4'],
        allowOnZones: ['public_safe', 'private_app'],
        description: 'User registered for a free event.',
    },
    event_purchased: {
        internalName: 'event_purchased',
        canonicalName: 'purchase',
        allowedDestinations: ['first_party_analytics', 'ga4', 'meta_capi'],
        allowOnZones: ['public_safe', 'private_app'],
        description: 'Paid event purchase confirmed.',
    },
    formation_purchased: {
        internalName: 'formation_purchased',
        canonicalName: 'purchase',
        allowedDestinations: ['first_party_analytics', 'ga4', 'meta_capi'],
        allowOnZones: ['public_safe', 'private_app'],
        description: 'Paid formation purchase confirmed.',
    },
    ai_credits_purchased: {
        internalName: 'ai_credits_purchased',
        canonicalName: 'purchase',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'AI credits purchase confirmed.',
    },
    marketing_service_updated: {
        internalName: 'marketing_service_updated',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Admin marketing service update.',
    },
    marketing_brief_updated: {
        internalName: 'marketing_brief_updated',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Marketing brief updated.',
    },
    marketing_services_initialized: {
        internalName: 'marketing_services_initialized',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Marketing services initialized.',
    },
    home_featured_speakers_updated: {
        internalName: 'home_featured_speakers_updated',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Featured speakers settings updated.',
    },
    growth_campaign_created: {
        internalName: 'growth_campaign_created',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Growth campaign created.',
    },
    growth_campaign_updated: {
        internalName: 'growth_campaign_updated',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Growth campaign updated.',
    },
    growth_campaign_toggled: {
        internalName: 'growth_campaign_toggled',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Growth campaign toggled.',
    },
    growth_campaign_deleted: {
        internalName: 'growth_campaign_deleted',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Growth campaign deleted.',
    },
    manual_deal_created: {
        internalName: 'manual_deal_created',
        canonicalName: 'generate_lead',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Manual deal entered by admin.',
    },
    marketing_cost_recorded: {
        internalName: 'marketing_cost_recorded',
        canonicalName: 'form_submit',
        allowedDestinations: ['first_party_analytics'],
        allowOnZones: ['private_app'],
        description: 'Marketing spend entry recorded.',
    },
}

export function getTrackingEventDefinition(eventName: AnalyticsEventName) {
    return TRACKING_EVENT_DEFINITIONS[eventName]
}

function isDestinationEnabledForRoute(destination: TrackingDestination, routeContext: TrackingRouteContext) {
    switch (destination) {
        case 'first_party_analytics':
            return routeContext.destinations.firstPartyAnalytics
        case 'gtm':
            return routeContext.destinations.gtm
        case 'ga4':
            return routeContext.destinations.ga4
        case 'google_ads':
            return routeContext.destinations.googleAds
        case 'meta_pixel':
            return routeContext.destinations.metaPixel
        case 'meta_capi':
            return routeContext.destinations.metaCapi
        case 'tiktok_pixel':
            return routeContext.destinations.tiktokPixel
        case 'tiktok_events_api':
            return routeContext.destinations.tiktokEventsApi
        case 'linkedin_insight':
            return routeContext.destinations.linkedinInsight
        case 'clarity':
            return routeContext.destinations.clarity
        case 'onesignal':
            return routeContext.destinations.oneSignal
        default:
            return false
    }
}

export function getCanonicalTrackingEventName(eventName: AnalyticsEventName): CanonicalTrackingEventName {
    return getTrackingEventDefinition(eventName).canonicalName
}

export function getAllowedTrackingDestinations(eventName: AnalyticsEventName, routeContext: TrackingRouteContext) {
    const definition = getTrackingEventDefinition(eventName)

    if (definition.allowOnZones && !definition.allowOnZones.includes(routeContext.zone)) {
        return [] as TrackingDestination[]
    }

    return definition.allowedDestinations.filter((destination) => isDestinationEnabledForRoute(destination, routeContext))
}

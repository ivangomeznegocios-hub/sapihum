export type AttributionModel = 'last_non_direct' | 'first_touch' | 'last_touch'

export interface AnalyticsConsentSnapshot {
    necessary: true
    analytics: boolean
    marketing: boolean
    version?: string
    source?: string
}

export type AnalyticsChannel =
    | 'direct'
    | 'organic_search'
    | 'paid_search'
    | 'organic_social'
    | 'paid_social'
    | 'email'
    | 'referral'
    | 'invite'
    | 'internal'
    | 'unknown'

export type AnalyticsFunnel =
    | 'landing'
    | 'waitlist'
    | 'registration'
    | 'invite'
    | 'checkout'
    | 'subscription'
    | 'event'
    | 'ai_credits'
    | 'manual_deal'
    | 'admin_marketing'
    | 'admin_growth'
    | 'dashboard'

export type AnalyticsEventName =
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
    | 'registration_started'
    | 'registration_completed'
    | 'registration_verified'
    | 'waitlist_joined'
    | 'invite_applied'
    | 'invite_activated'
    | 'checkout_started'
    | 'payment_completed'
    | 'payment_failed'
    | 'payment_refunded'
    | 'subscription_created'
    | 'subscription_renewed'
    | 'subscription_cancelled'
    | 'subscription_past_due'
    | 'event_registered'
    | 'event_purchased'
    | 'formation_purchased'
    | 'ai_credits_purchased'
    | 'marketing_service_updated'
    | 'marketing_brief_updated'
    | 'marketing_services_initialized'
    | 'home_featured_speakers_updated'
    | 'growth_campaign_created'
    | 'growth_campaign_updated'
    | 'growth_campaign_toggled'
    | 'growth_campaign_deleted'
    | 'manual_deal_created'
    | 'marketing_cost_recorded'

export interface AttributionTouch {
    occurredAt: string
    source: string | null
    medium: string | null
    campaign: string | null
    term?: string | null
    content?: string | null
    ref?: string | null
    gclid?: string | null
    fbclid?: string | null
    ttclid?: string | null
    liFatId?: string | null
    referrer?: string | null
    landingPath?: string | null
    targetPlan?: string | null
    targetSpecialization?: string | null
    funnel?: AnalyticsFunnel | null
    channel: AnalyticsChannel
    isDirect: boolean
    eventName?: AnalyticsEventName | null
    metadata?: Record<string, unknown>
}

export interface AttributionSnapshot {
    firstTouch: AttributionTouch | null
    lastTouch: AttributionTouch | null
    lastNonDirectTouch: AttributionTouch | null
    resolvedAt: string
}

export interface MarketingCostEntry {
    id?: string
    periodStart: string
    periodEnd: string
    channel: string
    campaign?: string | null
    costType: string
    owner?: string | null
    amount: number
    notes?: string | null
    metadata?: Record<string, unknown>
}

export interface ManualDeal {
    id?: string
    leadName?: string | null
    clientName?: string | null
    email?: string | null
    userId?: string | null
    productName: string
    productType: string
    amount: number
    closedAt: string
    stage?: string
    channel: string
    campaign?: string | null
    owner?: string | null
    notes?: string | null
    attributionSnapshot?: AttributionSnapshot | null
    metadata?: Record<string, unknown>
}

export interface AnalyticsContext {
    visitorId?: string | null
    sessionId?: string | null
    consent?: AnalyticsConsentSnapshot | null
    touch?: Partial<AttributionTouch> | null
}

export interface AnalyticsCollectRequest extends AnalyticsContext {
    eventName: AnalyticsEventName
    eventId?: string | null
    eventSource?: 'client' | 'server' | 'webhook'
    consent?: AnalyticsConsentSnapshot | null
    properties?: Record<string, unknown>
}

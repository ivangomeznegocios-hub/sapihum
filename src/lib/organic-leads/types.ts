import type { AnalyticsContext, AttributionSnapshot } from '@/lib/analytics/types'

export type OrganicLeadIntent =
    | 'learn'
    | 'download_resource'
    | 'attend_event'
    | 'explore_formation'
    | 'join_community'
    | 'evaluate_membership'
    | 'commercial_interest'
    | 'purchase_intent'

export type OrganicLifecycleStage =
    | 'captured'
    | 'engaged'
    | 'qualified'
    | 'opportunity'
    | 'converted'
    | 'discarded'

export type OrganicSourceType =
    | 'guide'
    | 'resource'
    | 'resource_format'
    | 'resource_scale'
    | 'author'
    | 'book'
    | 'approach'
    | 'tool'
    | 'psychologist'
    | 'event'
    | 'formation'
    | 'specialty'
    | 'community'
    | 'academy'

export type OrganicContentType = OrganicSourceType

export type OrganicLeadActionType =
    | 'guide_view'
    | 'resource_download'
    | 'event_registration'
    | 'formation_interest'
    | 'commercial_cta'
    | 'checkout_or_purchase_intent'

export interface OrganicLeadCapturePayload {
    name: string
    email: string
    whatsapp?: string | null
    country?: string | null
    city?: string | null
    role?: string | null
    specialty?: string | null
    yearsExperience?: number | null
    interestTags?: string[]
    professionalGoal?: string | null
    intent: OrganicLeadIntent
    sourcePage: string
    sourceTopic?: string | null
    sourceAsset?: string | null
    sourceType: OrganicSourceType
    actionType: OrganicLeadActionType
    utms?: Record<string, string | null | undefined> | null
    referrer?: string | null
    analyticsContext?: AnalyticsContext | null
    metadata?: Record<string, unknown> | null
}

export interface OrganicLeadCaptureResult {
    success: true
    leadId: string
    lifecycleStage: OrganicLifecycleStage
    nextStepUrl: string
    downloadUrl?: string
    created: boolean
}

export interface OrganicLeadUpsertInput {
    payload: OrganicLeadCapturePayload
    userId?: string | null
    attributionSnapshot: AttributionSnapshot
}

export interface OrganicRelatedAsset {
    label: string
    href: string
    type: OrganicSourceType
    description?: string
}

export interface OrganicContentSection {
    heading: string
    paragraphs: string[]
    bullets?: string[]
}

export interface OrganicGatedResource {
    assetKey: string
    title: string
    description: string
    benefits: string[]
    downloadUrl: string
}

export interface OrganicContentAsset {
    slug: string
    contentType: OrganicContentType
    sourceType: OrganicSourceType
    title: string
    description: string
    aiSummary: string
    topic: string
    specialty?: string
    authorName?: string
    publishedAt?: string
    updatedAt?: string
    heroEyebrow?: string
    ctaLabel: string
    intent: OrganicLeadIntent
    actionType: OrganicLeadActionType
    interestTags: string[]
    sections: OrganicContentSection[]
    faqs?: Array<{ question: string; answer: string }>
    gatedResource?: OrganicGatedResource
    relatedAssets: OrganicRelatedAsset[]
    schemaTypes: Array<
        | 'Article'
        | 'BreadcrumbList'
        | 'Person'
        | 'Book'
        | 'ItemList'
        | 'FAQPage'
        | 'Course'
        | 'Event'
        | 'SoftwareApplication'
    >
}

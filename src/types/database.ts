// ============================================
// DATABASE TYPES - Auto-generated from Supabase schema
// ============================================

export type UserRole = 'admin' | 'support' | 'psychologist' | 'patient' | 'ponente'

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'inactive'

export type RelationshipStatus = 'active' | 'inactive' | 'pending'

export type RecordType = 'nota' | 'historia_clinica'

export type AppointmentStatus = 'scheduled' | 'pending' | 'confirmed' | 'cancelled' | 'completed'

export type ReferralStatus = 'pending' | 'assigned' | 'accepted' | 'rejected' | 'handoff_completed' | 'completed' | 'cancelled'

export type ReferralUrgency = 'normal' | 'alta' | 'urgente'

export type ReferralDomain = 'clinical_referral'

export type CommissionStatus = 'pending' | 'paid' | 'cancelled'

export type EarningType = 'membership_proration' | 'premium_commission'

export type EarningStatus = 'pending' | 'released' | 'voided'

export type AttendanceSource = 'manual' | 'embedded_page' | 'api' | 'jitsi' | 'youtube'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'reviewed'

export type TaskType = 'journal' | 'reading' | 'exercise' | 'form' | 'general'

export type SpecializationStatus = 'active' | 'coming_soon' | 'hidden'

export type SpecializationCode =
    | 'clinica'
    | 'forense'
    | 'educacion'
    | 'organizacional'
    | 'infanto_juvenil'
    | 'neuropsicologia'
    | 'deportiva'
    | 'sexologia_clinica'
    | 'psicogerontologia'

export type WaitlistSource = 'landing' | 'app'

// ============================================
// TABLE: profiles
// ============================================
export interface Profile {
    id: string
    role: UserRole
    full_name: string | null
    avatar_url: string | null
    email: string | null
    subscription_status: SubscriptionStatus | null
    membership_level: number
    ai_minutes_available: number
    email_notifications: boolean
    session_reminders: boolean
    // Extended professional fields
    phone?: string | null
    cedula_profesional?: string | null
    populations_served?: string[]
    therapeutic_approaches?: string[]
    languages?: string[]
    years_experience?: number | null
    education?: string | null
    accepts_referral_terms?: boolean
    referral_terms_accepted_at?: string | null
    // Existing extended fields (from 013)
    specialty?: string | null
    membership_specialization_code?: SpecializationCode | null
    bio?: string | null
    hourly_rate?: number | null
    office_address?: string | null
    services?: any[]
    availability?: any
    payment_methods?: any
    stripe_customer_id?: string | null
    preferred_payment_method?: string
    created_at: string
    updated_at: string
}

export interface ProfileInsert {
    id: string
    role?: UserRole
    full_name?: string | null
    avatar_url?: string | null
    email?: string | null
    subscription_status?: SubscriptionStatus | null
    membership_level?: number
    ai_minutes_available?: number
    email_notifications?: boolean
    session_reminders?: boolean
    membership_specialization_code?: SpecializationCode | null
}

export interface ProfileUpdate {
    role?: UserRole
    full_name?: string | null
    avatar_url?: string | null
    email?: string | null
    subscription_status?: SubscriptionStatus | null
    membership_level?: number
    phone?: string | null
    cedula_profesional?: string | null
    populations_served?: string[]
    therapeutic_approaches?: string[]
    languages?: string[]
    years_experience?: number | null
    education?: string | null
    accepts_referral_terms?: boolean
    referral_terms_accepted_at?: string | null
    specialty?: string | null
    membership_specialization_code?: SpecializationCode | null
    bio?: string | null
    hourly_rate?: number | null
    office_address?: string | null
    services?: any[]
    availability?: any
    payment_methods?: any
    ai_minutes_available?: number
    email_notifications?: boolean
    session_reminders?: boolean
    stripe_customer_id?: string | null
    preferred_payment_method?: string
}

// ============================================
// TABLE: patient_psychologist_relationships
// ============================================
export interface PatientPsychologistRelationship {
    id: string
    patient_id: string
    psychologist_id: string
    status: RelationshipStatus
    created_at: string
    updated_at: string
}

export interface PatientPsychologistRelationshipInsert {
    patient_id: string
    psychologist_id: string
    status?: RelationshipStatus
}

export interface PatientPsychologistRelationshipUpdate {
    status?: RelationshipStatus
}

// ============================================
// TABLE: clinical_records (SOAP Notes)
// ============================================
export interface SOAPContent {
    subjective?: string
    objective?: string
    assessment?: string
    plan?: string
    action_plan?: string[]
}

export interface ClinicalRecord {
    id: string
    patient_id: string
    psychologist_id: string
    content: SOAPContent
    type: RecordType
    tags: string[]
    appointment_id: string | null
    is_pinned: boolean
    session_number: number | null
    created_at: string
    updated_at: string
}

export interface ClinicalRecordInsert {
    patient_id: string
    psychologist_id: string
    content: SOAPContent
    type?: RecordType
    tags?: string[]
    appointment_id?: string | null
    is_pinned?: boolean
    session_number?: number | null
}

export interface ClinicalRecordUpdate {
    content?: SOAPContent
    type?: RecordType
    tags?: string[]
    is_pinned?: boolean
}

// ============================================
// TABLE: appointments
// ============================================
export interface Appointment {
    id: string
    patient_id: string
    psychologist_id: string
    start_time: string
    end_time: string
    status: AppointmentStatus
    meeting_link: string | null
    price: number | null
    notes: string | null
    created_at: string
    updated_at: string
}

export interface AppointmentInsert {
    patient_id: string
    psychologist_id: string
    start_time: string
    end_time: string
    status?: AppointmentStatus
    meeting_link?: string | null
    price?: number | null
    notes?: string | null
}

export interface AppointmentUpdate {
    start_time?: string
    end_time?: string
    status?: AppointmentStatus
    meeting_link?: string | null
    price?: number | null
    notes?: string | null
}

// ============================================
// TABLE: clinical_documents
// ============================================
export type DocumentCategory = 'test_result' | 'referral' | 'consent' | 'report' | 'intake_form' | 'other'

export interface ClinicalDocument {
    id: string
    patient_id: string
    psychologist_id: string
    file_name: string
    file_path: string
    file_type: string
    file_size: number
    category: DocumentCategory
    notes: string | null
    created_at: string
    updated_at: string
}

export interface ClinicalDocumentInsert {
    patient_id: string
    psychologist_id: string
    file_name: string
    file_path: string
    file_type: string
    file_size: number
    category?: DocumentCategory
    notes?: string | null
}

export interface ClinicalDocumentUpdate {
    file_name?: string
    category?: DocumentCategory
    notes?: string | null
}

// ============================================
// TABLE: session_summaries
// ============================================
export interface SessionSummary {
    id: string
    appointment_id: string | null
    psychologist_id: string
    patient_id: string
    summary: string
    mood_rating: number | null
    progress_rating: number | null
    key_topics: string[]
    homework: string | null
    next_session_focus: string | null
    created_at: string
    updated_at: string
}

export interface SessionSummaryInsert {
    appointment_id?: string | null
    psychologist_id: string
    patient_id: string
    summary: string
    mood_rating?: number | null
    progress_rating?: number | null
    key_topics?: string[]
    homework?: string | null
    next_session_focus?: string | null
}

export interface SessionSummaryUpdate {
    summary?: string
    mood_rating?: number | null
    progress_rating?: number | null
    key_topics?: string[]
    homework?: string | null
    next_session_focus?: string | null
}

// ============================================
// TABLE: clinical_audit_log
// ============================================
export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export'

export interface ClinicalAuditLog {
    id: string
    psychologist_id: string
    patient_id: string | null
    action: AuditAction
    record_type: string
    record_id: string | null
    details: Record<string, any>
    created_at: string
}

export interface ClinicalAuditLogInsert {
    psychologist_id: string
    patient_id?: string | null
    action: AuditAction
    record_type: string
    record_id?: string | null
    details?: Record<string, any>
}


// ============================================
// HELPER TYPES
// ============================================

// Profile with relationships for psychologists
export interface PsychologistProfile extends Profile {
    patients?: Profile[]
}

// Profile with relationships for patients
export interface PatientProfile extends Profile {
    psychologist?: Profile
}

// Combined user data (auth + profile)
export interface UserWithProfile {
    id: string
    email: string | null
    profile: Profile | null
}

// Patient with clinical records count
export interface PatientWithStats extends Profile {
    records_count?: number
    last_appointment?: string | null
}

// Clinical record with patient info
export interface ClinicalRecordWithPatient extends ClinicalRecord {
    patient?: Profile
}

// Appointment with patient info
export interface AppointmentWithPatient extends Appointment {
    patient?: Profile
}

// ============================================
// TABLE: referrals
// ============================================
export interface Referral {
    id: string
    referring_psychologist_id: string
    receiving_psychologist_id: string | null
    referral_domain: ReferralDomain
    patient_name: string
    patient_age: number | null
    patient_contact: string | null
    reason: string
    specialty_needed: string | null
    population_type: string | null
    urgency: ReferralUrgency
    notes: string | null
    status: ReferralStatus
    admin_notes: string | null
    assigned_by: string | null
    assigned_at: string | null
    accepted_at: string | null
    first_session_at: string | null
    handoff_completed_at: string | null
    completed_at: string | null
    created_at: string
    updated_at: string
}

export interface ReferralInsert {
    referring_psychologist_id: string
    receiving_psychologist_id?: string | null
    referral_domain?: ReferralDomain
    patient_name: string
    patient_age?: number | null
    patient_contact?: string | null
    reason: string
    specialty_needed?: string | null
    population_type?: string | null
    urgency?: ReferralUrgency
    notes?: string | null
}

export interface ReferralUpdate {
    receiving_psychologist_id?: string | null
    status?: ReferralStatus
    admin_notes?: string | null
    assigned_by?: string | null
    assigned_at?: string | null
    accepted_at?: string | null
    first_session_at?: string | null
    handoff_completed_at?: string | null
    completed_at?: string | null
}

export interface ReferralWithProfiles extends Referral {
    referring_psychologist?: Profile
    receiving_psychologist?: Profile
}

// ============================================
// TABLE: referral_commissions
// ============================================
export interface ReferralCommission {
    id: string
    referral_id: string
    beneficiary_id: string
    session_price: number
    commission_rate: number
    commission_amount: number
    status: CommissionStatus
    paid_at: string | null
    notes: string | null
    created_at: string
}

export interface ReferralCommissionInsert {
    referral_id: string
    beneficiary_id: string
    session_price: number
    commission_rate?: number
    notes?: string | null
}

export interface ReferralCommissionWithDetails extends ReferralCommission {
    referral?: Referral
    beneficiary?: Profile
}

export interface ReferralCommissionUpdate {
    status?: CommissionStatus
    paid_at?: string | null
    notes?: string | null
}

// ============================================
// TABLE: platform_settings
// ============================================
export interface PlatformSetting {
    key: string
    value: any
    description: string | null
    updated_by: string | null
    updated_at: string
}

// ============================================
// RESOURCE TYPES
// ============================================
export type ResourceType = 'pdf' | 'video' | 'audio' | 'link' | 'document' | 'tool'

export type VisibilityType = 'public' | 'private' | 'members_only'

export type ResourceCategory = 'guia' | 'estudio' | 'herramienta' | 'plantilla' | 'curso_material' | 'general'

export interface Resource {
    id: string
    title: string
    description: string | null
    url: string
    type: ResourceType
    visibility: VisibilityType
    thumbnail_url: string | null
    created_by: string | null
    // New fields from 030 migration
    expires_at: string | null
    category: ResourceCategory
    tags: string[]
    download_count: number
    is_featured: boolean
    sort_order: number
    // From 018 migration
    target_audience: string[]
    min_membership_level: number
    // From 031 migration (interactive tools)
    html_content: string | null
    tool_config: { width?: string; height?: string; allow_fullscreen?: boolean } | null
    created_at: string
    updated_at: string
}

export interface ResourceInsert {
    title: string
    description?: string | null
    url: string
    type?: ResourceType
    visibility?: VisibilityType
    thumbnail_url?: string | null
    created_by?: string
    expires_at?: string | null
    category?: ResourceCategory
    tags?: string[]
    is_featured?: boolean
    sort_order?: number
    target_audience?: string[]
    min_membership_level?: number
    html_content?: string | null
    tool_config?: { width?: string; height?: string; allow_fullscreen?: boolean } | null
}

export interface ResourceUpdate {
    title?: string
    description?: string | null
    url?: string
    type?: ResourceType
    visibility?: VisibilityType
    thumbnail_url?: string | null
    expires_at?: string | null
    category?: ResourceCategory
    tags?: string[]
    is_featured?: boolean
    sort_order?: number
    target_audience?: string[]
    min_membership_level?: number
    html_content?: string | null
    tool_config?: { width?: string; height?: string; allow_fullscreen?: boolean } | null
}

export interface PatientResource {
    id: string
    resource_id: string
    patient_id: string
    assigned_by: string
    notes: string | null
    assigned_at: string
    viewed_at: string | null
}

export interface PatientResourceInsert {
    resource_id: string
    patient_id: string
    assigned_by: string
    notes?: string | null
}

// Resource with assignment info
export interface ResourceWithAssignment extends Resource {
    assignment?: PatientResource
}

// ============================================
// TABLE: event_resources (linking)
// ============================================
export interface EventResource {
    id: string
    event_id: string
    resource_id: string
    is_locked: boolean
    unlock_at: string | null
    display_order: number
    created_at: string
}

export interface EventResourceInsert {
    event_id: string
    resource_id: string
    is_locked?: boolean
    unlock_at?: string | null
    display_order?: number
}

// Resource with event linking info
export interface ResourceWithEvent extends Resource {
    event_resource?: EventResource
    event?: Event
}

// ============================================
// EVENT TYPES
// ============================================
export type EventStatus = 'draft' | 'upcoming' | 'live' | 'completed' | 'cancelled'
export type EventType = 'live' | 'on_demand' | 'course' | 'presencial'
export type TargetAudience = 'public' | 'members' | 'psychologists' | 'patients' | 'active_patients' | 'ponentes' | 'students' | 'certified'

export type EventModality = 'online' | 'presencial' | 'hibrido'

export interface SessionConfig {
    total_sessions: number
    session_duration_minutes: number
    recurrence?: string
    modality: EventModality
    location?: string
}
export type EventCategory = 'general' | 'networking' | 'clinical' | 'business'
export type EventSubcategory = 'curso' | 'diplomado' | 'clase' | 'taller' | 'conferencia' | 'seminario' | 'congreso' | 'meetup' | 'otro'
export type MemberAccessType = 'free' | 'discounted' | 'full_price'
export type EventSpeakerRole = 'speaker' | 'moderator' | 'host'

export interface Event {
    id: string
    slug: string
    title: string
    subtitle: string | null
    description: string | null
    image_url: string | null
    start_time: string
    end_time: string | null
    status: EventStatus
    event_type: EventType
    location: string | null
    meeting_link: string | null
    recording_url: string | null
    max_attendees: number | null
    price: number
    is_members_only: boolean
    target_audience: TargetAudience[]
    required_subscription: string[] | null
    recording_available_days: number
    recording_expires_at: string | null
    prerequisite_event_id: string | null
    created_by: string | null
    created_at: string
    updated_at: string
    views: number
    registration_fields: any[] // JSONB
    category: EventCategory
    subcategory: EventSubcategory | null
    // Dual pricing fields
    member_price: number
    member_access_type: MemberAccessType
    // Embed & sharing
    is_embeddable: boolean
    og_description: string | null
    seo_title: string | null
    seo_description: string | null
    hero_badge: string | null
    public_cta_label: string | null
    // Session configuration
    session_config: SessionConfig | null
}

export interface EventInsert {
    slug?: string
    title: string
    subtitle?: string | null
    description?: string | null
    image_url?: string | null
    start_time: string
    end_time?: string | null
    status?: EventStatus
    event_type?: EventType
    location?: string | null
    meeting_link?: string | null
    recording_url?: string | null
    max_attendees?: number | null
    price?: number
    is_members_only?: boolean
    target_audience?: TargetAudience[]
    required_subscription?: string[] | null
    recording_available_days?: number
    prerequisite_event_id?: string | null
    created_by?: string
    registration_fields?: any[]
    category?: EventCategory
    subcategory?: EventSubcategory | null
    member_price?: number
    member_access_type?: MemberAccessType
    is_embeddable?: boolean
    og_description?: string | null
    seo_title?: string | null
    seo_description?: string | null
    hero_badge?: string | null
    public_cta_label?: string | null
    session_config?: SessionConfig | null
}

export interface EventUpdate {
    slug?: string
    title?: string
    subtitle?: string | null
    description?: string | null
    image_url?: string | null
    start_time?: string
    end_time?: string | null
    status?: EventStatus
    event_type?: EventType
    location?: string | null
    meeting_link?: string | null
    recording_url?: string | null
    max_attendees?: number | null
    price?: number
    is_members_only?: boolean
    target_audience?: TargetAudience[]
    required_subscription?: string[] | null
    recording_available_days?: number
    category?: EventCategory
    subcategory?: EventSubcategory | null
    member_price?: number
    member_access_type?: MemberAccessType
    is_embeddable?: boolean
    og_description?: string | null
    seo_title?: string | null
    seo_description?: string | null
    hero_badge?: string | null
    public_cta_label?: string | null
    session_config?: SessionConfig | null
}

export interface EventRegistration {
    id: string
    event_id: string
    user_id: string
    status: 'registered' | 'attended' | 'cancelled'
    registered_at: string
    attended_at: string | null
    registration_data: any // JSONB
}

export interface EventRegistrationInsert {
    event_id: string
    user_id: string
    status?: 'registered' | 'attended' | 'cancelled'
    registration_data?: any
}

// Event with registration info
export interface EventWithRegistration extends Event {
    registration?: EventRegistration
    attendee_count?: number
}

// Event with speakers and registration
export interface EventWithSpeakers extends EventWithRegistration {
    speakers?: (EventSpeaker & { speaker: Speaker })[]
}

// ============================================
// TABLE: speakers
// ============================================
export interface Speaker {
    id: string
    headline: string | null
    bio: string | null
    photo_url: string | null
    credentials: string[]
    formations: string[]
    specialties: string[]
    social_links: Record<string, string>
    social_links_enabled: boolean
    is_public: boolean
    created_at: string
    updated_at: string
}

export interface SpeakerInsert {
    id: string
    headline?: string | null
    bio?: string | null
    photo_url?: string | null
    credentials?: string[]
    formations?: string[]
    specialties?: string[]
    social_links?: Record<string, string>
    social_links_enabled?: boolean
    is_public?: boolean
}

export interface SpeakerUpdate {
    headline?: string | null
    bio?: string | null
    photo_url?: string | null
    credentials?: string[]
    formations?: string[]
    specialties?: string[]
    social_links?: Record<string, string>
    social_links_enabled?: boolean
    is_public?: boolean
}

export interface SpeakerWithProfile extends Speaker {
    profile?: Profile
}

// ============================================
// TABLE: event_speakers
// ============================================
export interface EventSpeaker {
    id: string
    event_id: string
    speaker_id: string
    role: EventSpeakerRole
    display_order: number
}

export interface EventSpeakerInsert {
    event_id: string
    speaker_id: string
    role?: EventSpeakerRole
    display_order?: number
}

// ============================================
// TABLE: event_purchases
// ============================================
export type EventPurchaseStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded'

export interface EventPurchase {
    id: string
    event_id: string
    user_id: string | null
    email: string
    full_name: string | null
    amount_paid: number
    currency: string
    payment_method: string | null
    payment_reference: string | null
    provider_session_id: string | null
    provider_payment_id: string | null
    metadata: Record<string, any>
    access_token: string
    status: EventPurchaseStatus
    purchased_at: string
    confirmed_at: string | null
    analytics_visitor_id?: string | null
    analytics_session_id?: string | null
    attribution_snapshot?: Record<string, any>
}

export interface EventPurchaseInsert {
    event_id: string
    user_id?: string | null
    email: string
    full_name?: string | null
    amount_paid: number
    currency?: string
    payment_method?: string | null
    payment_reference?: string | null
    provider_session_id?: string | null
    provider_payment_id?: string | null
    metadata?: Record<string, any>
}

export interface EventPurchaseUpdate {
    status?: EventPurchaseStatus
    payment_reference?: string | null
    provider_session_id?: string | null
    provider_payment_id?: string | null
    metadata?: Record<string, any>
    confirmed_at?: string | null
}

// ============================================
// TABLE: event_entitlements
// ============================================
export type EventEntitlementAccessKind =
    | 'live_access'
    | 'replay_access'
    | 'course_access'
    | 'membership_benefit'
    | 'bundle_child_access'
    | 'certificate_eligibility'
    | 'manual_support_grant'

export type EventEntitlementSourceType =
    | 'registration'
    | 'purchase'
    | 'membership'
    | 'manual'
    | 'support'
    | 'gift'
    | 'alliance'
    | 'migration'

export type EventEntitlementStatus = 'active' | 'expired' | 'revoked'

export interface EventEntitlement {
    id: string
    event_id: string
    user_id: string | null
    email: string
    identity_key: string
    access_kind: EventEntitlementAccessKind
    source_type: EventEntitlementSourceType
    source_reference: string | null
    status: EventEntitlementStatus
    starts_at: string
    ends_at: string | null
    revoked_at?: string | null
    metadata: Record<string, any>
    created_at: string
    updated_at: string
}

export interface EventEntitlementInsert {
    event_id: string
    user_id?: string | null
    email: string
    access_kind: EventEntitlementAccessKind
    source_type: EventEntitlementSourceType
    source_reference?: string | null
    status?: EventEntitlementStatus
    starts_at?: string
    ends_at?: string | null
    metadata?: Record<string, any>
}

export interface EventEntitlementUpdate {
    user_id?: string | null
    status?: EventEntitlementStatus
    starts_at?: string
    ends_at?: string | null
    revoked_at?: string | null
    metadata?: Record<string, any>
}

// ============================================
// TABLE: newsletters
// ============================================
export interface Newsletter {
    id: string
    title: string
    summary: string | null
    content_html: string
    cover_image_url: string | null
    month: number
    year: number
    is_active: boolean
    published_at: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface NewsletterInsert {
    title: string
    summary?: string | null
    content_html: string
    cover_image_url?: string | null
    month: number
    year: number
    is_active?: boolean
    published_at?: string | null
    created_by?: string
}

export interface NewsletterUpdate {
    title?: string
    summary?: string | null
    content_html?: string
    cover_image_url?: string | null
    month?: number
    year?: number
    is_active?: boolean
    published_at?: string | null
}

// ============================================
// TABLE: exclusive_agreements
// ============================================
export type AgreementCategory = 'salud' | 'educacion' | 'tecnologia' | 'bienestar' | 'servicios' | 'otro'

export interface ExclusiveAgreement {
    id: string
    company_name: string
    company_logo_url: string | null
    description: string
    benefits: string[]
    discount_code: string | null
    discount_percentage: number | null
    website_url: string | null
    contact_email: string | null
    category: string
    is_active: boolean
    start_date: string | null
    end_date: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface ExclusiveAgreementInsert {
    company_name: string
    company_logo_url?: string | null
    description: string
    benefits?: string[]
    discount_code?: string | null
    discount_percentage?: number | null
    website_url?: string | null
    contact_email?: string | null
    category?: string
    is_active?: boolean
    start_date?: string | null
    end_date?: string | null
    created_by?: string
}

export interface ExclusiveAgreementUpdate {
    company_name?: string
    company_logo_url?: string | null
    description?: string
    benefits?: string[]
    discount_code?: string | null
    discount_percentage?: number | null
    website_url?: string | null
    contact_email?: string | null
    category?: string
    is_active?: boolean
    start_date?: string | null
    end_date?: string | null
}

// ============================================
// INTERACTIVE TOOLS ENGINE
// ============================================
export type ToolCategory = 'test' | 'questionnaire' | 'task' | 'exercise' | 'scale'

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'expired'

export type QuestionType = 'likert' | 'multiple_choice' | 'text' | 'number' | 'slider' | 'yes_no' | 'rating'

// Tool Schema Types (JSON structure)
export interface ToolOption {
    value: number
    label: string
}

export interface ToolQuestion {
    id: string
    text: string
    type: QuestionType
    required: boolean
    options?: ToolOption[]
    min?: number
    max?: number
    step?: number
    placeholder?: string
}

export interface ToolSection {
    id: string
    title: string
    description?: string
    questions: ToolQuestion[]
}

export interface ToolScoringRange {
    min: number
    max: number
    label: string
    color: string
    description: string
}

export interface ToolScoring {
    method: 'sum' | 'average' | 'weighted' | 'custom'
    max_score: number
    reverse_items: string[]
    reverse_max: number
    ranges: ToolScoringRange[]
}

export interface ToolMetadata {
    name: string
    author: string
    reference?: string
    estimated_minutes: number
    instructions: string
}

export interface ToolSchema {
    version: string
    metadata: ToolMetadata
    sections: ToolSection[]
    scoring: ToolScoring
}

// ============================================
// TABLE: therapeutic_tools
// ============================================
export interface TherapeuticTool {
    id: string
    title: string
    description: string | null
    category: ToolCategory
    schema: ToolSchema
    estimated_minutes: number
    is_template: boolean
    created_by: string | null
    tags: string[]
    created_at: string
    updated_at: string
}

export interface TherapeuticToolInsert {
    title: string
    description?: string | null
    category?: ToolCategory
    schema: ToolSchema
    estimated_minutes?: number
    is_template?: boolean
    created_by?: string
    tags?: string[]
}

export interface TherapeuticToolUpdate {
    title?: string
    description?: string | null
    category?: ToolCategory
    schema?: ToolSchema
    estimated_minutes?: number
    tags?: string[]
}

// ============================================
// TABLE: tool_assignments
// ============================================
export interface ToolAssignment {
    id: string
    tool_id: string
    patient_id: string
    psychologist_id: string
    status: AssignmentStatus
    instructions: string | null
    due_date: string | null
    results_visible: boolean
    assigned_at: string
    completed_at: string | null
    updated_at: string
}

export interface ToolAssignmentInsert {
    tool_id: string
    patient_id: string
    psychologist_id: string
    status?: AssignmentStatus
    instructions?: string | null
    due_date?: string | null
    results_visible?: boolean
}

export interface ToolAssignmentUpdate {
    status?: AssignmentStatus
    instructions?: string | null
    due_date?: string | null
    results_visible?: boolean
    completed_at?: string | null
}

// ============================================
// TABLE: tool_responses
// ============================================
export interface ToolResponse {
    id: string
    assignment_id: string
    responses: Record<string, any>
    scores: Record<string, any>
    progress: number
    started_at: string
    completed_at: string | null
    created_at: string
    updated_at: string
}

export interface ToolResponseInsert {
    assignment_id: string
    responses?: Record<string, any>
    scores?: Record<string, any>
    progress?: number
}

export interface ToolResponseUpdate {
    responses?: Record<string, any>
    scores?: Record<string, any>
    progress?: number
    completed_at?: string | null
}

// Helper types for tools
export interface ToolAssignmentWithTool extends ToolAssignment {
    tool?: TherapeuticTool
}

export interface ToolAssignmentWithDetails extends ToolAssignment {
    tool?: TherapeuticTool
    response?: ToolResponse
    patient?: Profile
}

// ============================================
// TABLE: tasks
// ============================================
export interface Task {
    id: string
    patient_id: string
    psychologist_id: string
    title: string
    description: string | null
    type: TaskType
    status: TaskStatus
    due_date: string | null
    content: Record<string, any>
    response: Record<string, any>
    completion_notes: string | null
    created_at: string
    updated_at: string
}

export interface TaskInsert {
    patient_id: string
    psychologist_id: string
    title: string
    description?: string | null
    type?: TaskType
    status?: TaskStatus
    due_date?: string | null
    content?: Record<string, any>
    response?: Record<string, any>
    completion_notes?: string | null
}

export interface TaskUpdate {
    title?: string
    description?: string | null
    type?: TaskType
    status?: TaskStatus
    due_date?: string | null
    content?: Record<string, any>
    response?: Record<string, any>
    completion_notes?: string | null
}

// ============================================
// TABLE: messages
// ============================================
export interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    is_read: boolean
    created_at: string
}

export interface MessageInsert {
    sender_id: string
    receiver_id: string
    content: string
    is_read?: boolean
}

// ============================================
// DATABASE TYPE (for Supabase client typing)
// ============================================
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: ProfileInsert
                Update: ProfileUpdate
            }
            patient_psychologist_relationships: {
                Row: PatientPsychologistRelationship
                Insert: PatientPsychologistRelationshipInsert
                Update: PatientPsychologistRelationshipUpdate
            }
            clinical_records: {
                Row: ClinicalRecord
                Insert: ClinicalRecordInsert
                Update: ClinicalRecordUpdate
            }
            appointments: {
                Row: Appointment
                Insert: AppointmentInsert
                Update: AppointmentUpdate
            }
            patient_documents: {
                Row: ClinicalDocument
                Insert: ClinicalDocumentInsert
                Update: ClinicalDocumentUpdate
            }
            session_summaries: {
                Row: SessionSummary
                Insert: SessionSummaryInsert
                Update: SessionSummaryUpdate
            }
            clinical_audit_log: {
                Row: ClinicalAuditLog
                Insert: ClinicalAuditLogInsert
                Update: never
            }
            referrals: {
                Row: Referral
                Insert: ReferralInsert
                Update: ReferralUpdate
            }
            referral_commissions: {
                Row: ReferralCommission
                Insert: ReferralCommissionInsert
                Update: ReferralCommissionUpdate
            }
            resources: {
                Row: Resource
                Insert: ResourceInsert
                Update: ResourceUpdate
            }
            events: {
                Row: Event
                Insert: EventInsert
                Update: EventUpdate
            }
            therapeutic_tools: {
                Row: TherapeuticTool
                Insert: TherapeuticToolInsert
                Update: TherapeuticToolUpdate
            }
            tool_assignments: {
                Row: ToolAssignment
                Insert: ToolAssignmentInsert
                Update: ToolAssignmentUpdate
            }
            tool_responses: {
                Row: ToolResponse
                Insert: ToolResponseInsert
                Update: ToolResponseUpdate
            }
            tasks: {
                Row: Task
                Insert: TaskInsert
                Update: TaskUpdate
            }
            messages: {
                Row: Message
                Insert: MessageInsert
                Update: never
            }
            newsletters: {
                Row: Newsletter
                Insert: NewsletterInsert
                Update: NewsletterUpdate
            }
            event_purchases: {
                Row: EventPurchase
                Insert: EventPurchaseInsert
                Update: EventPurchaseUpdate
            }
            event_entitlements: {
                Row: EventEntitlement
                Insert: EventEntitlementInsert
                Update: EventEntitlementUpdate
            }
            exclusive_agreements: {
                Row: ExclusiveAgreement
                Insert: ExclusiveAgreementInsert
                Update: ExclusiveAgreementUpdate
            }
            subscriptions: {
                Row: Subscription
                Insert: SubscriptionInsert
                Update: SubscriptionUpdate
            }
            payment_transactions: {
                Row: PaymentTransaction
                Insert: PaymentTransactionInsert
                Update: never
            }
            invite_codes: {
                Row: InviteCode
                Insert: InviteCodeInsert
                Update: InviteCodeUpdate
            }
            invite_attributions: {
                Row: InviteAttribution
                Insert: InviteAttributionInsert
                Update: InviteAttributionUpdate
            }
            invite_reward_events: {
                Row: InviteRewardEvent
                Insert: InviteRewardEventInsert
                Update: InviteRewardEventUpdate
            }
            specialization_waitlist: {
                Row: SpecializationWaitlist
                Insert: SpecializationWaitlistInsert
                Update: SpecializationWaitlistUpdate
            }
            speaker_earnings: {
                Row: SpeakerEarning
                Insert: SpeakerEarningInsert
                Update: SpeakerEarningUpdate
            }
            speaker_attendance_log: {
                Row: SpeakerAttendanceLog
                Insert: SpeakerAttendanceLogInsert
                Update: SpeakerAttendanceLogUpdate
            }
            speaker_month_close: {
                Row: SpeakerMonthClose
                Insert: SpeakerMonthCloseInsert
                Update: never
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: {
            user_role: UserRole
            subscription_status: SubscriptionStatus
            relationship_status: RelationshipStatus
            record_type: RecordType
            appointment_status: AppointmentStatus
            referral_status: ReferralStatus
            referral_urgency: ReferralUrgency
            commission_status: CommissionStatus
            task_status: TaskStatus
            task_type: TaskType
            transaction_type: TransactionType
            earning_type: EarningType
            earning_status: EarningStatus
        }
    }
}

// ============================================
// TABLE: ai_credit_transactions
// ============================================
export type TransactionType = 'monthly_grant' | 'purchase' | 'usage' | 'admin_adjustment'

export interface AiCreditTransaction {
    id: string
    profile_id: string
    amount: number
    transaction_type: TransactionType
    description: string | null
    created_at: string
}

export interface AiCreditTransactionInsert {
    profile_id: string
    amount: number
    transaction_type: TransactionType
    description?: string | null
}

// ============================================
// TABLE: subscriptions
// ============================================
export type PaymentSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'paused' | 'incomplete'

export interface Subscription {
    id: string
    user_id: string
    profile_id: string
    membership_level: number
    specialization_code: SpecializationCode | null
    payment_provider: string
    provider_subscription_id: string | null
    provider_customer_id: string | null
    provider_price_id: string | null
    status: PaymentSubscriptionStatus
    current_period_start: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    cancelled_at: string | null
    trial_start: string | null
    trial_end: string | null
    created_at: string
    updated_at: string
}

export interface SubscriptionInsert {
    user_id: string
    profile_id: string
    membership_level: number
    specialization_code?: SpecializationCode | null
    payment_provider?: string
    provider_subscription_id?: string | null
    provider_customer_id?: string | null
    provider_price_id?: string | null
    status?: PaymentSubscriptionStatus
    current_period_start?: string | null
    current_period_end?: string | null
    trial_start?: string | null
    trial_end?: string | null
}

export interface SubscriptionUpdate {
    specialization_code?: SpecializationCode | null
    status?: PaymentSubscriptionStatus
    current_period_start?: string | null
    current_period_end?: string | null
    cancel_at_period_end?: boolean
    cancelled_at?: string | null
}

// ============================================
// TABLE: payment_transactions
// ============================================
export type PaymentTransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type PurchaseType = 'subscription_payment' | 'ai_credits' | 'event_purchase'

export interface PaymentTransaction {
    id: string
    user_id: string | null
    profile_id: string | null
    subscription_id: string | null
    email: string
    purchase_type: PurchaseType
    purchase_reference_id: string | null
    amount: number
    currency: string
    payment_provider: string
    provider_session_id: string | null
    provider_payment_id: string | null
    provider_invoice_id: string | null
    status: PaymentTransactionStatus
    metadata: Record<string, any>
    created_at: string
    completed_at: string | null
}

export interface PaymentTransactionInsert {
    user_id?: string | null
    profile_id?: string | null
    subscription_id?: string | null
    email: string
    purchase_type: PurchaseType
    purchase_reference_id?: string | null
    amount: number
    currency?: string
    payment_provider?: string
    provider_session_id?: string | null
    provider_payment_id?: string | null
    provider_invoice_id?: string | null
    status?: PaymentTransactionStatus
    metadata?: Record<string, any>
}

// ============================================
// INVITE REFERRAL SYSTEM (Growth/Invite codes)
// ============================================
export type InviteAttributionStatus = 'pending' | 'completed' | 'rewarded'

export type InviteRewardType =
    | 'credit'
    | 'discount'
    | 'unlock'
    | 'commission'
    | 'cash_bonus'
    | 'membership_benefit'
    | 'custom'

// ============================================
// TABLE: invite_codes
// ============================================
export interface InviteCode {
    id: string
    owner_id: string
    code: string
    is_active: boolean
    max_uses: number | null
    use_count: number
    metadata: Record<string, any>
    created_at: string
    expires_at: string | null
}

export interface InviteCodeInsert {
    owner_id: string
    code?: string // Auto-generated by DB if not provided
    is_active?: boolean
    max_uses?: number | null
    metadata?: Record<string, any>
    expires_at?: string | null
}

export interface InviteCodeUpdate {
    is_active?: boolean
    max_uses?: number | null
    metadata?: Record<string, any>
    expires_at?: string | null
}

// ============================================
// TABLE: invite_attributions
// ============================================
export interface InviteAttribution {
    id: string
    invite_code_id: string
    referrer_id: string
    referred_id: string
    program_type: 'professional_invite'
    status: InviteAttributionStatus
    attributed_at: string
    completed_at: string | null
}

export interface InviteAttributionInsert {
    invite_code_id: string
    referrer_id: string
    referred_id: string
    program_type?: 'professional_invite'
    status?: InviteAttributionStatus
}

export interface InviteAttributionUpdate {
    program_type?: 'professional_invite'
    status?: InviteAttributionStatus
    completed_at?: string | null
}

export interface InviteAttributionWithProfiles extends InviteAttribution {
    referrer?: Profile
    referred?: Profile
}

// ============================================
// TABLE: invite_reward_events
// ============================================
export interface InviteRewardEvent {
    id: string
    attribution_id: string
    beneficiary_id: string
    program_type: 'professional_invite'
    reward_type: InviteRewardType
    reward_value: Record<string, any>
    trigger_event: string
    processed: boolean
    processed_at: string | null
    notes: string | null
    created_at: string
}

export interface InviteRewardEventInsert {
    attribution_id: string
    beneficiary_id: string
    program_type?: 'professional_invite'
    reward_type: InviteRewardType
    reward_value: Record<string, any>
    trigger_event: string
    notes?: string | null
}

export interface InviteRewardEventUpdate {
    program_type?: 'professional_invite'
    processed?: boolean
    processed_at?: string | null
    notes?: string | null
}

// ============================================
// TABLE: specialization_waitlist
// ============================================
export interface SpecializationWaitlist {
    id: string
    specialization_code: SpecializationCode
    user_id: string | null
    email: string | null
    source: WaitlistSource
    metadata: Record<string, any>
    contact_key: string
    created_at: string
    updated_at: string
}

export interface SpecializationWaitlistInsert {
    specialization_code: SpecializationCode
    user_id?: string | null
    email?: string | null
    source?: WaitlistSource
    metadata?: Record<string, any>
}

export interface SpecializationWaitlistUpdate {
    source?: WaitlistSource
    metadata?: Record<string, any>
}

// ============================================
// GROWTH CAMPAIGNS SYSTEM
// ============================================
export type GrowthCampaignType = 'referral_boost' | 'milestone' | 'promo' | 'challenge' | 'custom'

export interface GrowthCampaign {
    id: string
    title: string
    description: string | null
    campaign_type: GrowthCampaignType
    program_type: 'professional_invite'
    reward_config: Record<string, any>
    target_roles: string[]
    eligible_referrer_roles: string[]
    eligible_referred_roles: string[]
    allowed_trigger_events: string[]
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
    image_url: string | null
    sort_order: number
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface GrowthCampaignInsert {
    title: string
    description?: string | null
    campaign_type: GrowthCampaignType
    program_type?: 'professional_invite'
    reward_config?: Record<string, any>
    target_roles?: string[]
    eligible_referrer_roles?: string[]
    eligible_referred_roles?: string[]
    allowed_trigger_events?: string[]
    is_active?: boolean
    starts_at?: string | null
    ends_at?: string | null
    image_url?: string | null
    sort_order?: number
    created_by?: string | null
}

export interface GrowthCampaignUpdate {
    title?: string
    description?: string | null
    campaign_type?: GrowthCampaignType
    program_type?: 'professional_invite'
    reward_config?: Record<string, any>
    target_roles?: string[]
    eligible_referrer_roles?: string[]
    eligible_referred_roles?: string[]
    allowed_trigger_events?: string[]
    is_active?: boolean
    starts_at?: string | null
    ends_at?: string | null
    image_url?: string | null
    sort_order?: number
}

// ============================================
// SPEAKER MONETIZATION SYSTEM
// ============================================

// ============================================
// TABLE: speaker_attendance_log
// ============================================
export interface SpeakerAttendanceLog {
    id: string
    event_id: string
    student_id: string
    join_time: string
    leave_time: string
    duration_minutes: number
    session_duration_minutes: number
    attendance_percentage: number
    qualifies: boolean
    source: AttendanceSource
    created_at: string
}

export interface SpeakerAttendanceLogInsert {
    event_id: string
    student_id: string
    join_time: string
    leave_time: string
    duration_minutes: number
    session_duration_minutes: number
    attendance_percentage?: number
    qualifies?: boolean
    source?: AttendanceSource
}

export interface SpeakerAttendanceLogUpdate {
    join_time?: string
    leave_time?: string
    duration_minutes?: number
    attendance_percentage?: number
    qualifies?: boolean
}

// ============================================
// TABLE: speaker_earnings
// ============================================
export interface SpeakerEarning {
    id: string
    speaker_id: string
    event_id: string
    student_id: string
    earning_type: EarningType
    gross_amount: number
    commission_rate: number
    net_amount: number
    status: EarningStatus
    attendance_date: string
    release_date: string
    released_at: string | null
    voided_at: string | null
    void_reason: string | null
    source_transaction_id: string | null
    attendance_log_id: string | null
    month_key: string
    is_frozen: boolean
    frozen_at: string | null
    created_at: string
    updated_at: string
}

export interface SpeakerEarningInsert {
    speaker_id: string
    event_id: string
    student_id: string
    earning_type?: EarningType
    gross_amount: number
    commission_rate?: number
    net_amount: number
    status?: EarningStatus
    attendance_date?: string
    release_date?: string
    source_transaction_id?: string | null
    attendance_log_id?: string | null
    month_key?: string
}

export interface SpeakerEarningUpdate {
    status?: EarningStatus
    released_at?: string | null
    voided_at?: string | null
    void_reason?: string | null
    is_frozen?: boolean
    frozen_at?: string | null
}

export interface SpeakerEarningWithDetails extends SpeakerEarning {
    student?: Profile
    event?: Event
    speaker?: Profile
}

// ============================================
// TABLE: speaker_month_close
// ============================================
export interface SpeakerMonthClose {
    id: string
    month_key: string
    closed_by: string | null
    closed_at: string
    total_released: number
    total_voided: number
    total_pending: number
    notes: string | null
    created_at: string
}

export interface SpeakerMonthCloseInsert {
    month_key: string
    closed_by?: string | null
    total_released?: number
    total_voided?: number
    total_pending?: number
    notes?: string | null
}

// ============================================
// FINANCIAL SUMMARY HELPER TYPES
// ============================================
export interface SpeakerFinancialSummary {
    totalAccumulated: number
    availableForPayment: number
    pendingAmount: number
    voidedAmount: number
    nextPaymentDate: string | null
    currentMonthEarnings: number
    totalStudents: number
    totalEvents: number
}

// ============================================
// OPERATIONS / BACKOFFICE
// ============================================
export interface AdminOperationLog {
    id: string
    actor_user_id: string | null
    action_type: string
    entity_type: string
    entity_id: string | null
    target_user_id: string | null
    target_email: string | null
    reason: string | null
    details: Record<string, any>
    created_at: string
}

export interface AdminOperationNote {
    id: string
    entity_type: string
    entity_id: string | null
    target_user_id: string | null
    target_email: string | null
    note: string
    created_by: string | null
    updated_by: string | null
    created_at: string
    updated_at: string
}

export type MembershipRuleScopeType = 'event_audience' | 'event_category' | 'event' | 'discount'
export type MembershipRuleBenefitType = 'access' | 'discount'

export interface MembershipEntitlementRule {
    id: string
    membership_level: number
    specialization_code: SpecializationCode | null
    scope_type: MembershipRuleScopeType
    benefit_type: MembershipRuleBenefitType
    event_id: string | null
    event_category: string | null
    required_audience: string | null
    discount_percent: number | null
    is_active: boolean
    metadata: Record<string, any>
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface CertificateRule {
    id: string
    event_id: string
    is_active: boolean
    requires_purchase: boolean
    requires_attendance: boolean
    min_attendance_percent: number | null
    requires_progress: boolean
    min_progress_percent: number | null
    requires_evaluation: boolean
    min_evaluation_score: number | null
    requires_active_membership: boolean
    metadata: Record<string, any>
    created_by: string | null
    created_at: string
    updated_at: string
}

export type CertificateEligibilityStatus = 'pending' | 'eligible' | 'ineligible' | 'issued' | 'revoked'

export interface CertificateEligibilitySnapshot {
    id: string
    event_id: string
    user_id: string | null
    email: string
    identity_key: string
    status: CertificateEligibilityStatus
    evaluated_at: string
    reasons: any[]
    source_snapshot: Record<string, any>
    created_at: string
    updated_at: string
}

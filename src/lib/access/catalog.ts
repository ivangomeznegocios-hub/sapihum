import { addDays } from 'date-fns'
import { isPurchasableRecordingEvent } from '@/lib/events/pricing'
import type { Event, Profile, Resource, Subscription, TargetAudience } from '@/types/database'

const MEMBERSHIP_ACCESS_STATUSES = new Set(['trial', 'trialing', 'active', 'past_due'])
const MEMBERSHIP_PAST_DUE_GRACE_DAYS = 3

type ViewerProfileSnapshot = Pick<
    Profile,
    'id' | 'email' | 'role' | 'membership_level' | 'subscription_status'
> & {
    membership_specialization_code?: Profile['membership_specialization_code']
}

type ViewerSubscriptionSnapshot = Pick<
    Subscription,
    'id' | 'membership_level' | 'status' | 'current_period_end' | 'cancel_at_period_end'
> & {
    specialization_code?: Subscription['specialization_code']
}

export interface ViewerAccessContext {
    profile: ViewerProfileSnapshot
    subscription: ViewerSubscriptionSnapshot | null
    membershipActive: boolean
    membershipLevel: number
    membershipSpecializationCode: Profile['membership_specialization_code']
    hasActivePatientRelationship: boolean
}

function toDateOrNull(value: string | null | undefined) {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

export function getMembershipAccessEnd(subscription: Pick<Subscription, 'status' | 'current_period_end'> | null) {
    if (!subscription) return null

    const currentPeriodEnd = toDateOrNull(subscription.current_period_end)
    if (!currentPeriodEnd) return null

    if (subscription.status === 'past_due') {
        return addDays(currentPeriodEnd, MEMBERSHIP_PAST_DUE_GRACE_DAYS)
    }

    return currentPeriodEnd
}

function subscriptionGrantsMembershipAccess(subscription: ViewerSubscriptionSnapshot | null, now = new Date()) {
    if (!subscription) return false
    if (!MEMBERSHIP_ACCESS_STATUSES.has(subscription.status)) return false

    const accessEnd = getMembershipAccessEnd(subscription)
    if (!accessEnd) return true

    return accessEnd > now
}

function profileFallbackGrantsMembership(profile: ViewerProfileSnapshot) {
    const membershipLevel = Number(profile.membership_level ?? 0)
    if (membershipLevel <= 0) return false

    return MEMBERSHIP_ACCESS_STATUSES.has(String(profile.subscription_status ?? 'inactive'))
}

export async function resolveViewerAccessContext(params: {
    supabase: any
    userId?: string | null
    profile?: ViewerProfileSnapshot | null
    includeActiveRelationship?: boolean
}): Promise<ViewerAccessContext | null> {
    const userId = params.userId ?? params.profile?.id ?? null
    if (!userId) return null

    let profile = params.profile ?? null
    const needsProfileHydration =
        !profile || !Object.prototype.hasOwnProperty.call(profile, 'membership_specialization_code')

    if (needsProfileHydration) {
        const { data } = await (params.supabase
            .from('profiles') as any)
            .select('id, email, role, membership_level, subscription_status, membership_specialization_code')
            .eq('id', userId)
            .maybeSingle()

        profile = (data as ViewerProfileSnapshot | null) ?? null
    }

    if (!profile) return null

    const { data: subscriptionData } = await (params.supabase
        .from('subscriptions') as any)
        .select('id, membership_level, specialization_code, status, current_period_end, cancel_at_period_end')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const subscription = (subscriptionData as ViewerSubscriptionSnapshot | null) ?? null
    const membershipActive = subscription
        ? subscriptionGrantsMembershipAccess(subscription)
        : profileFallbackGrantsMembership(profile)

    const membershipLevel = membershipActive
        ? Number(subscription?.membership_level ?? profile.membership_level ?? 0)
        : 0
    const membershipSpecializationCode = membershipActive
        ? (subscription?.specialization_code ?? profile.membership_specialization_code ?? null)
        : null

    let hasActivePatientRelationship = false
    if (params.includeActiveRelationship && profile.role === 'patient') {
        const { count } = await (params.supabase
            .from('patient_psychologist_relationships') as any)
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', userId)
            .eq('status', 'active')

        hasActivePatientRelationship = (count ?? 0) > 0
    }

    return {
        profile,
        subscription,
        membershipActive,
        membershipLevel,
        membershipSpecializationCode,
        hasActivePatientRelationship,
    }
}

export function viewerMatchesAudience(audience: TargetAudience[] | string[] | null | undefined, viewer: ViewerAccessContext | null) {
    const normalizedAudience = Array.isArray(audience) && audience.length > 0 ? audience : ['public']

    if (normalizedAudience.includes('public')) return true
    if (!viewer) return false
    if (viewer.profile.role === 'admin') return true
    if (normalizedAudience.includes('members') && viewer.membershipActive) return true
    if (normalizedAudience.includes('psychologists') && viewer.profile.role === 'psychologist') return true
    if (normalizedAudience.includes('patients') && viewer.profile.role === 'patient') return true
    if (normalizedAudience.includes('active_patients') && viewer.hasActivePatientRelationship) return true

    return false
}

export function canGuestReachEventOffer(event: Pick<Event, 'target_audience' | 'status' | 'recording_url' | 'recording_expires_at' | 'event_type'>) {
    return viewerMatchesAudience(event.target_audience, null) || isPurchasableRecordingEvent(event)
}

export function canViewerReachEventOffer(
    event: Pick<Event, 'target_audience' | 'status' | 'recording_url' | 'recording_expires_at' | 'event_type' | 'created_by'>,
    viewer: ViewerAccessContext | null
) {
    if (!viewer) return canGuestReachEventOffer(event)
    if (viewer.profile.role === 'admin') return true
    if (event.created_by && event.created_by === viewer.profile.id) return true
    if (isPurchasableRecordingEvent(event)) return true
    return viewerMatchesAudience(event.target_audience, viewer)
}

export function canViewerSeeCatalogEvent(
    event: Pick<Event, 'status' | 'target_audience' | 'created_by'>,
    viewer: ViewerAccessContext | null
) {
    if (viewer?.profile.role === 'admin') return true
    if (event.created_by && viewer?.profile.id === event.created_by) return true
    if (event.status === 'draft' || event.status === 'cancelled') return false
    return viewerMatchesAudience(event.target_audience, viewer)
}

export function canViewerSeeListedResource(
    resource: Pick<Resource, 'visibility' | 'target_audience' | 'min_membership_level' | 'created_by' | 'expires_at'>,
    viewer: ViewerAccessContext | null,
    showExpired = false
) {
    const now = new Date().toISOString()

    if (!showExpired && resource.expires_at && resource.expires_at <= now) {
        return false
    }

    if (viewer?.profile.role === 'admin') return true
    if (resource.created_by && viewer?.profile.id === resource.created_by) return true
    if (resource.visibility === 'private') return false
    if (!viewerMatchesAudience(resource.target_audience, viewer)) return false

    const minMembershipLevel = Number(resource.min_membership_level ?? 0)
    if (minMembershipLevel > 0 && (viewer?.membershipLevel ?? 0) < minMembershipLevel) {
        return false
    }

    return true
}

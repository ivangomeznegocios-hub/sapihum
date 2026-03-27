import type { Event, Profile, Resource, TargetAudience } from '@/types/database'
import { canViewerSeeListedResource, resolveViewerAccessContext, viewerMatchesAudience, type ViewerAccessContext } from '@/lib/access/catalog'
import { getEffectiveEventPriceForMembership } from '@/lib/events/pricing'

export type CommercialAccessContext = ViewerAccessContext

export interface CommercialAccessSnapshot extends ViewerAccessContext {
    userId: string
    role: Profile['role']
    email: string | null
    membershipLevel: number
    hasActiveMembership: boolean
    membershipSource: 'subscription' | 'profile_legacy' | null
    viewer: ViewerAccessContext
}

export async function getViewerCommercialAccessContext(supabase: any, userId: string) {
    return resolveViewerAccessContext({
        supabase,
        userId,
        includeActiveRelationship: true,
    })
}

export async function getCommercialAccessContext(params: {
    supabase: any
    userId: string
    profile?: Pick<Profile, 'role' | 'email' | 'membership_level' | 'subscription_status'> | null
}): Promise<CommercialAccessSnapshot | null> {
    const viewer = await resolveViewerAccessContext({
        supabase: params.supabase,
        userId: params.userId,
        profile: params.profile
            ? {
                id: params.userId,
                role: params.profile.role,
                email: params.profile.email ?? null,
                membership_level: params.profile.membership_level ?? 0,
                subscription_status: params.profile.subscription_status ?? null,
            }
            : null,
        includeActiveRelationship: true,
    })

    if (!viewer) return null

    return {
        ...viewer,
        userId: viewer.profile.id,
        role: viewer.profile.role,
        email: viewer.profile.email ?? null,
        membershipLevel: viewer.membershipLevel,
        hasActiveMembership: viewer.membershipActive,
        membershipSource: viewer.subscription ? 'subscription' : viewer.membershipActive ? 'profile_legacy' : null,
        viewer,
    }
}

export function canAccessTargetAudience(
    audience: TargetAudience[] | string[] | null | undefined,
    context: CommercialAccessContext
) {
    return viewerMatchesAudience(audience, context)
}

export function audienceAllowsAccess(
    audience: TargetAudience[] | string[] | null | undefined,
    context: CommercialAccessSnapshot | null,
    options?: {
        creatorId?: string | null
    }
) {
    if (!context) return false
    if (context.role === 'admin') return true
    if (options?.creatorId && options.creatorId === context.userId) return true
    return viewerMatchesAudience(audience, context.viewer)
}

export function resolveEventCommercialState(
    event: Pick<Event, 'price' | 'member_price' | 'member_access_type' | 'target_audience'>,
    context: CommercialAccessSnapshot
) {
    const effectivePrice = getEffectiveEventPriceForMembership(event, context.hasActiveMembership)
    const publicPrice = Number(event.price || 0)

    return {
        canAccessAudience: audienceAllowsAccess(event.target_audience, context),
        effectivePrice,
        needsPayment: effectivePrice > 0,
        isActiveMember: context.hasActiveMembership,
        effectiveMembershipLevel: context.membershipLevel,
        complimentaryByMembership: context.hasActiveMembership && publicPrice > 0 && effectivePrice === 0,
        discountedByMembership: context.hasActiveMembership && effectivePrice > 0 && effectivePrice < publicPrice,
    }
}

export function canAccessResourceForViewer(
    resource: Pick<Resource, 'target_audience' | 'min_membership_level'>,
    context: CommercialAccessSnapshot
) {
    if (!viewerMatchesAudience(resource.target_audience, context.viewer)) {
        return false
    }

    const minMembershipLevel = Number(resource.min_membership_level ?? 0)
    if (minMembershipLevel <= 0) {
        return true
    }

    return context.membershipLevel >= minMembershipLevel
}

export function isCommunityReadOnlyViewer(context: CommercialAccessSnapshot | null) {
    void context
    // The new commerce model should not downgrade the whole community catalog
    // to "read-only" based only on a legacy membership level check.
    return false
}

export { canViewerSeeListedResource }

import {
    isProfessionalInviteReferredRole,
    isProfessionalInviteReferrerRole,
} from '@/lib/growth/programs'

export type GrowthDashboardQueryOptions = {
    includeHistory?: boolean
}

const qaEmailMarkers = ['phase11', 'smoke', '@example.com']
const inactiveAttributionStatuses = new Set(['rejected', 'inactive'])
const inactiveConversionStatuses = new Set(['cancelled', 'refunded', 'fraud_flagged'])
const inactiveRewardStatuses = new Set(['revoked', 'expired'])

function normalizeEmail(email: unknown): string {
    return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export function isGrowthQaEmail(email: unknown): boolean {
    const normalized = normalizeEmail(email)
    return Boolean(normalized && qaEmailMarkers.some((marker) => normalized.includes(marker)))
}

export function isBlockedGrowthProfile(profile: any): boolean {
    if (!profile) return false

    return (
        profile.status === 'blocked' ||
        profile.growth_status === 'blocked' ||
        profile.growth_profile?.status === 'blocked' ||
        profile.growthProfile?.status === 'blocked'
    )
}

export function isHiddenGrowthProfile(profile: any): boolean {
    return isBlockedGrowthProfile(profile) || isGrowthQaEmail(profile?.email)
}

export function shouldShowGrowthAttribution(row: any, options: GrowthDashboardQueryOptions = {}): boolean {
    if (!isProfessionalInviteReferrerRole(row?.referrer?.role)) {
        return false
    }

    if (!isProfessionalInviteReferredRole(row?.referred?.role)) {
        return false
    }

    if (options.includeHistory) return true

    if (inactiveAttributionStatuses.has(String(row?.status || '').toLowerCase())) {
        return false
    }

    return ![row?.referrer, row?.referred].some(isHiddenGrowthProfile)
}

export function shouldShowGrowthConversion(row: any, options: GrowthDashboardQueryOptions = {}): boolean {
    if (options.includeHistory) return true

    if (inactiveConversionStatuses.has(String(row?.status || '').toLowerCase())) {
        return false
    }

    return ![
        row?.profile,
        row?.user,
        row?.customer,
        row?.referrer,
        row?.referred,
    ].some(isHiddenGrowthProfile) && !isGrowthQaEmail(row?.email)
}

export function shouldShowGrowthReward(row: any, options: GrowthDashboardQueryOptions = {}): boolean {
    if (options.includeHistory) return true

    if (inactiveRewardStatuses.has(String(row?.status || '').toLowerCase())) {
        return false
    }

    if (isHiddenGrowthProfile(row?.beneficiary)) {
        return false
    }

    return shouldShowGrowthAttribution(row?.attribution, options)
}

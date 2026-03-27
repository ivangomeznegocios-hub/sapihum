import { addDays } from 'date-fns'
import type { Event, EventCategory, EventEntitlement, MembershipEntitlementRule, Profile, Subscription } from '@/types/database'
import { createServiceClient } from '@/lib/supabase/service'
import { grantEventEntitlements } from '@/lib/events/entitlements'

const ACCESS_GRANTING_STATUSES = new Set(['active', 'trialing', 'past_due'])
const MEMBERSHIP_PAST_DUE_GRACE_DAYS = 3

type MembershipProfile = Pick<Profile, 'id' | 'email' | 'membership_level'> & {
    membership_specialization_code?: string | null
}

type MembershipSubscription = Pick<
    Subscription,
    'id' | 'membership_level' | 'specialization_code' | 'status' | 'current_period_end' | 'cancel_at_period_end'
>

type EligibleEvent = Pick<Event, 'id' | 'event_type' | 'recording_expires_at' | 'target_audience' | 'category' | 'status'>

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

function toDateOrNull(value: string | null | undefined) {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

function getMembershipGraceEnd(subscription: MembershipSubscription | null) {
    if (!subscription) return null

    const currentPeriodEnd = toDateOrNull(subscription.current_period_end)
    if (!currentPeriodEnd) return null

    if (subscription.status === 'past_due') {
        return addDays(currentPeriodEnd, MEMBERSHIP_PAST_DUE_GRACE_DAYS)
    }

    return currentPeriodEnd
}

function subscriptionGrantsAccess(subscription: MembershipSubscription | null, now = new Date()) {
    if (!subscription) return false
    if (!ACCESS_GRANTING_STATUSES.has(subscription.status)) return false

    const graceEnd = getMembershipGraceEnd(subscription)
    if (!graceEnd) return true

    return graceEnd > now
}

function matchesRuleSpecialization(rule: MembershipEntitlementRule, subscription: MembershipSubscription) {
    if (!rule.specialization_code) return true
    return rule.specialization_code === subscription.specialization_code
}

function resolveEventEntitlementEndAt(event: EligibleEvent, subscription: MembershipSubscription | null) {
    const subscriptionEndsAt = getMembershipGraceEnd(subscription)
    const eventEndsAt = toDateOrNull(event.recording_expires_at)

    if (!subscriptionEndsAt && !eventEndsAt) return null
    if (!subscriptionEndsAt) return eventEndsAt?.toISOString() ?? null
    if (!eventEndsAt) return subscriptionEndsAt.toISOString()

    return new Date(Math.min(subscriptionEndsAt.getTime(), eventEndsAt.getTime())).toISOString()
}

async function getActiveMembershipSubscription(
    admin: ReturnType<typeof createServiceClient>,
    userId: string
): Promise<MembershipSubscription | null> {
    const { data } = await (admin
        .from('subscriptions') as any)
        .select('id, membership_level, specialization_code, status, current_period_end, cancel_at_period_end')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    return (data as MembershipSubscription | null) ?? null
}

async function getMembershipRules(
    admin: ReturnType<typeof createServiceClient>,
    subscription: MembershipSubscription
): Promise<MembershipEntitlementRule[]> {
    const { data } = await (admin
        .from('membership_entitlement_rules') as any)
        .select('*')
        .eq('is_active', true)
        .lte('membership_level', subscription.membership_level)
        .order('membership_level', { ascending: true })

    return ((data ?? []) as MembershipEntitlementRule[]).filter((rule) => matchesRuleSpecialization(rule, subscription))
}

async function fetchEventsByAudience(admin: ReturnType<typeof createServiceClient>, audiences: string[]) {
    const rows: EligibleEvent[] = []

    for (const audience of audiences) {
        const { data } = await (admin
            .from('events') as any)
            .select('id, event_type, recording_expires_at, target_audience, category, status')
            .contains('target_audience', [audience])
            .not('status', 'in', '(draft,cancelled)')

        rows.push(...((data ?? []) as EligibleEvent[]))
    }

    return rows
}

async function fetchEventsByCategories(admin: ReturnType<typeof createServiceClient>, categories: EventCategory[]) {
    if (categories.length === 0) return []

    const { data } = await (admin
        .from('events') as any)
        .select('id, event_type, recording_expires_at, target_audience, category, status')
        .in('category', categories)
        .not('status', 'in', '(draft,cancelled)')

    return (data ?? []) as EligibleEvent[]
}

async function fetchEventsByIds(admin: ReturnType<typeof createServiceClient>, eventIds: string[]) {
    if (eventIds.length === 0) return []

    const { data } = await (admin
        .from('events') as any)
        .select('id, event_type, recording_expires_at, target_audience, category, status')
        .in('id', eventIds)
        .not('status', 'in', '(draft,cancelled)')

    return (data ?? []) as EligibleEvent[]
}

async function resolveEligibleEvents(
    admin: ReturnType<typeof createServiceClient>,
    subscription: MembershipSubscription
) {
    const rules = await getMembershipRules(admin, subscription)
    const accessRules = rules.filter((rule) => rule.benefit_type === 'access')

    const audiences = Array.from(
        new Set(
            accessRules
                .filter((rule) => rule.scope_type === 'event_audience' && rule.required_audience)
                .map((rule) => String(rule.required_audience))
        )
    )

    const categories = Array.from(
        new Set(
            accessRules
                .filter((rule) => rule.scope_type === 'event_category' && rule.event_category)
                .map((rule) => rule.event_category as EventCategory)
        )
    )

    const eventIds = Array.from(
        new Set(
            accessRules
                .filter((rule) => rule.scope_type === 'event' && rule.event_id)
                .map((rule) => String(rule.event_id))
        )
    )

    const rows = [
        ...(await fetchEventsByAudience(admin, audiences)),
        ...(await fetchEventsByCategories(admin, categories)),
        ...(await fetchEventsByIds(admin, eventIds)),
    ]

    const deduped = new Map<string, EligibleEvent>()
    rows.forEach((row) => deduped.set(row.id, row))

    return {
        rules,
        events: Array.from(deduped.values()),
    }
}

async function revokeMembershipEntitlements(params: {
    admin: ReturnType<typeof createServiceClient>
    userId: string
    email: string
    keepEventIds?: Set<string>
}) {
    const filters = [`user_id.eq.${params.userId}`, `identity_key.eq.${normalizeEmail(params.email)}`]

    const { data: existing } = await (params.admin
        .from('event_entitlements') as any)
        .select('id, event_id, metadata')
        .eq('source_type', 'membership')
        .eq('status', 'active')
        .or(filters.join(','))

    const revokeIds = ((existing ?? []) as Pick<EventEntitlement, 'id' | 'event_id' | 'metadata'>[])
        .filter((row) => !params.keepEventIds || !params.keepEventIds.has(row.event_id))
        .map((row) => row.id)

    if (revokeIds.length === 0) return 0

    const { error } = await (params.admin
        .from('event_entitlements') as any)
        .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .in('id', revokeIds)

    if (error) {
        throw new Error(`Failed to revoke membership entitlements: ${error.message}`)
    }

    return revokeIds.length
}

export async function syncMembershipEntitlementsForUser(userId: string) {
    const admin = createServiceClient()

    const { data: profileData } = await (admin
        .from('profiles') as any)
        .select('id, email, membership_level, membership_specialization_code')
        .eq('id', userId)
        .maybeSingle()

    const profile = (profileData as MembershipProfile | null) ?? null
    if (!profile?.email) {
        return {
            granted: 0,
            revoked: 0,
            rules: [] as MembershipEntitlementRule[],
            accessActive: false,
        }
    }

    const subscription = await getActiveMembershipSubscription(admin, userId)
    const accessActive = subscriptionGrantsAccess(subscription)

    if (!subscription || !accessActive) {
        const revoked = await revokeMembershipEntitlements({
            admin,
            userId,
            email: profile.email,
        })

        return {
            granted: 0,
            revoked,
            rules: [] as MembershipEntitlementRule[],
            accessActive: false,
        }
    }

    const { rules, events } = await resolveEligibleEvents(admin, subscription)
    const keepEventIds = new Set(events.map((event) => event.id))

    let granted = 0

    for (const event of events) {
        await grantEventEntitlements({
            event,
            email: profile.email,
            userId: profile.id,
            sourceType: 'membership',
            sourceReference: subscription.id,
            endsAt: resolveEventEntitlementEndAt(event, subscription),
            metadata: {
                subscription_id: subscription.id,
                membership_level: subscription.membership_level,
                specialization_code: subscription.specialization_code ?? profile.membership_specialization_code ?? null,
                rule_ids: rules.map((rule) => rule.id),
            },
        })
        granted += 1
    }

    const revoked = await revokeMembershipEntitlements({
        admin,
        userId,
        email: profile.email,
        keepEventIds,
    })

    return {
        granted,
        revoked,
        rules,
        accessActive: true,
    }
}

export async function getMembershipOperationsSnapshot(userId: string) {
    const admin = createServiceClient()

    const { data: profile } = await (admin
        .from('profiles') as any)
        .select('id, email, membership_level, membership_specialization_code, subscription_status')
        .eq('id', userId)
        .maybeSingle()

    const subscription = await getActiveMembershipSubscription(admin, userId)
    const rules = subscription ? await getMembershipRules(admin, subscription) : []

    const email = (profile as any)?.email ? normalizeEmail((profile as any).email) : null
    const filters = [
        `user_id.eq.${userId}`,
        email ? `identity_key.eq.${email}` : null,
    ].filter(Boolean) as string[]

    const { data: derivedEntitlements } = filters.length > 0
        ? await (admin
            .from('event_entitlements') as any)
            .select('id, event_id, access_kind, status, starts_at, ends_at, metadata, event:events(id, title, slug, category, status)')
            .eq('source_type', 'membership')
            .or(filters.join(','))
            .order('created_at', { ascending: false })
        : { data: [] }

    const issues: string[] = []
    const accessActive = subscriptionGrantsAccess(subscription)
    const activeDerived = ((derivedEntitlements ?? []) as any[]).filter((row) => row.status === 'active')

    if (accessActive && rules.some((rule) => rule.benefit_type === 'access') && activeDerived.length === 0) {
        issues.push('La membresia esta activa, pero no hay entitlements derivados activos.')
    }

    if (!accessActive && activeDerived.length > 0) {
        issues.push('Hay entitlements derivados activos sin una membresia vigente.')
    }

    return {
        profile,
        subscription,
        rules,
        derivedEntitlements: (derivedEntitlements ?? []) as any[],
        issues,
        accessActive,
    }
}

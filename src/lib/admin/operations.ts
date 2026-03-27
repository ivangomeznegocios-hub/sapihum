import { createServiceClient } from '@/lib/supabase/service'
import type {
    AdminOperationLog,
    AdminOperationNote,
    EventEntitlement,
    EventPurchase,
    MembershipEntitlementRule,
    PaymentTransaction,
    Profile,
    Subscription,
} from '@/types/database'

function normalizeEmail(email: string | null | undefined) {
    const value = email?.trim().toLowerCase()
    return value || null
}

function parseAttributionSnapshot(value: unknown) {
    if (!value || typeof value !== 'object') {
        return null
    }

    const snapshot = value as Record<string, any>
    const touch = snapshot.lastNonDirectTouch ?? snapshot.lastTouch ?? snapshot.firstTouch ?? null

    if (!touch || typeof touch !== 'object') {
        return null
    }

    return {
        source: touch.source ?? null,
        medium: touch.medium ?? null,
        campaign: touch.campaign ?? null,
        referrer: touch.referrer ?? null,
        landingPath: touch.landingPath ?? null,
        ref: touch.ref ?? null,
        channel: touch.channel ?? null,
    }
}

export async function logAdminOperation(input: {
    actorUserId: string
    actionType: string
    entityType: string
    entityId?: string | null
    targetUserId?: string | null
    targetEmail?: string | null
    reason?: string | null
    details?: Record<string, unknown>
}) {
    const admin = createServiceClient()

    const { error } = await (admin
        .from('admin_operation_logs') as any)
        .insert({
            actor_user_id: input.actorUserId,
            action_type: input.actionType,
            entity_type: input.entityType,
            entity_id: input.entityId ?? null,
            target_user_id: input.targetUserId ?? null,
            target_email: normalizeEmail(input.targetEmail),
            reason: input.reason ?? null,
            details: input.details ?? {},
        })

    if (error) {
        throw new Error(`No fue posible guardar la auditoria: ${error.message}`)
    }
}

export async function searchBackoffice(query: string) {
    const admin = createServiceClient()
    const term = query.trim()
    if (!term) {
        return {
            profiles: [] as any[],
            purchases: [] as any[],
        }
    }

    const email = normalizeEmail(term)
    const likeTerm = `%${term}%`
    const profileFilters = [
        `id.eq.${term}`,
        `full_name.ilike.${likeTerm}`,
        email ? `email.eq.${email}` : null,
    ].filter(Boolean)

    const purchaseFilters = [
        `id.eq.${term}`,
        `email.eq.${email ?? term}`,
        `full_name.ilike.${likeTerm}`,
        `payment_reference.ilike.${likeTerm}`,
        `provider_session_id.ilike.${likeTerm}`,
        `provider_payment_id.ilike.${likeTerm}`,
    ].filter(Boolean)

    const [{ data: profiles }, { data: purchases }] = await Promise.all([
        (admin
            .from('profiles') as any)
            .select('id, full_name, email, role, membership_level, subscription_status, created_at')
            .or(profileFilters.join(','))
            .order('created_at', { ascending: false })
            .limit(15),
        (admin
            .from('event_purchases') as any)
            .select('id, event_id, user_id, email, full_name, amount_paid, currency, payment_reference, provider_session_id, provider_payment_id, status, purchased_at, event:events(id, title, slug, event_type)')
            .or(purchaseFilters.join(','))
            .order('purchased_at', { ascending: false })
            .limit(15),
    ])

    return {
        profiles: (profiles ?? []) as any[],
        purchases: (purchases ?? []) as any[],
    }
}

export async function getProfileOperationsView(userId: string) {
    const admin = createServiceClient()

    const { data: profileData } = await (admin
        .from('profiles') as any)
        .select('*')
        .eq('id', userId)
        .maybeSingle()

    const profile = (profileData as Profile | null) ?? null
    if (!profile) return null

    const normalizedEmail = normalizeEmail(profile.email)
    const entitlementFilters = [
        `user_id.eq.${userId}`,
        normalizedEmail ? `identity_key.eq.${normalizedEmail}` : null,
    ].filter(Boolean) as string[]

    const purchaseFilters = [
        `user_id.eq.${userId}`,
        normalizedEmail ? `email.eq.${normalizedEmail}` : null,
    ].filter(Boolean) as string[]

    const [subscriptionResult, entitlementsResult, purchasesResult, transactionResult, logsResult, notesResult, duplicateProfilesResult, orphanCountsResult, membershipRulesResult] = await Promise.all([
        (admin
            .from('subscriptions') as any)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5),
        entitlementFilters.length > 0
            ? (admin
                .from('event_entitlements') as any)
                .select('*, event:events(id, title, slug, category, event_type, status)')
                .or(entitlementFilters.join(','))
                .order('created_at', { ascending: false })
                .limit(100)
            : Promise.resolve({ data: [] }),
        purchaseFilters.length > 0
            ? (admin
                .from('event_purchases') as any)
                .select('*, event:events(id, title, slug, event_type, category)')
                .or(purchaseFilters.join(','))
                .order('purchased_at', { ascending: false })
                .limit(50)
            : Promise.resolve({ data: [] }),
        purchaseFilters.length > 0
            ? (admin
                .from('payment_transactions') as any)
                .select('*')
                .or([
                    `user_id.eq.${userId}`,
                    `profile_id.eq.${userId}`,
                    normalizedEmail ? `email.eq.${normalizedEmail}` : null,
                ].filter(Boolean).join(','))
                .order('created_at', { ascending: false })
                .limit(50)
            : Promise.resolve({ data: [] }),
        (admin
            .from('admin_operation_logs') as any)
            .select('*')
            .or([
                `target_user_id.eq.${userId}`,
                normalizedEmail ? `target_email.eq.${normalizedEmail}` : null,
            ].filter(Boolean).join(','))
            .order('created_at', { ascending: false })
            .limit(50),
        (admin
            .from('admin_operation_notes') as any)
            .select('*')
            .or([
                `target_user_id.eq.${userId}`,
                normalizedEmail ? `target_email.eq.${normalizedEmail}` : null,
            ].filter(Boolean).join(','))
            .order('created_at', { ascending: false })
            .limit(50),
        normalizedEmail
            ? (admin
                .from('profiles') as any)
                .select('id, full_name, email, role, created_at')
                .eq('email', normalizedEmail)
                .neq('id', userId)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [] }),
        normalizedEmail
            ? Promise.all([
                (admin
                    .from('event_entitlements') as any)
                    .select('*', { count: 'exact', head: true })
                    .is('user_id', null)
                    .eq('identity_key', normalizedEmail),
                (admin
                    .from('event_purchases') as any)
                    .select('*', { count: 'exact', head: true })
                    .is('user_id', null)
                    .eq('email', normalizedEmail),
            ])
            : Promise.resolve([{ count: 0 }, { count: 0 }]),
        (admin
            .from('membership_entitlement_rules') as any)
            .select('*')
            .eq('is_active', true)
            .order('membership_level', { ascending: true }),
    ])

    const subscription = ((subscriptionResult.data ?? []) as Subscription[])[0] ?? null
    const orphanCounts = Array.isArray(orphanCountsResult)
        ? {
            entitlements: orphanCountsResult[0].count ?? 0,
            purchases: orphanCountsResult[1].count ?? 0,
        }
        : { entitlements: 0, purchases: 0 }

    return {
        profile,
        subscriptions: (subscriptionResult.data ?? []) as Subscription[],
        currentSubscription: subscription,
        entitlements: (entitlementsResult.data ?? []) as (EventEntitlement & { event?: any })[],
        purchases: ((purchasesResult.data ?? []) as (EventPurchase & { event?: any })[]).map((purchase) => ({
            ...purchase,
            attributionSummary: parseAttributionSnapshot((purchase as any).attribution_snapshot ?? purchase.metadata?.attribution_snapshot ?? null),
        })),
        transactions: ((transactionResult.data ?? []) as PaymentTransaction[]).map((transaction: any) => ({
            ...transaction,
            attributionSummary: parseAttributionSnapshot(transaction.attribution_snapshot ?? null),
        })),
        auditLogs: (logsResult.data ?? []) as AdminOperationLog[],
        notes: (notesResult.data ?? []) as AdminOperationNote[],
        duplicateProfiles: (duplicateProfilesResult.data ?? []) as Partial<Profile>[],
        orphanCounts,
        membershipRules: (membershipRulesResult.data ?? []) as MembershipEntitlementRule[],
    }
}

export async function getPurchaseOperationsView(purchaseId: string) {
    const admin = createServiceClient()

    const { data: purchaseData } = await (admin
        .from('event_purchases') as any)
        .select('*, event:events(id, title, slug, event_type, category)')
        .eq('id', purchaseId)
        .maybeSingle()

    const purchase = (purchaseData as (EventPurchase & { event?: any }) | null) ?? null
    if (!purchase) return null

    const normalizedEmail = normalizeEmail(purchase.email)

    const [profileCandidatesResult, entitlementsResult, transactionResult, logsResult, notesResult] = await Promise.all([
        normalizedEmail
            ? (admin
                .from('profiles') as any)
                .select('id, full_name, email, role, membership_level, subscription_status')
                .eq('email', normalizedEmail)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [] }),
        (admin
            .from('event_entitlements') as any)
            .select('*, event:events(id, title, slug)')
            .or([
                `source_reference.eq.${purchaseId}`,
                normalizedEmail ? `identity_key.eq.${normalizedEmail}` : null,
                purchase.user_id ? `user_id.eq.${purchase.user_id}` : null,
            ].filter(Boolean).join(','))
            .order('created_at', { ascending: false }),
        (admin
            .from('payment_transactions') as any)
            .select('*')
            .or([
                purchase.provider_payment_id ? `provider_payment_id.eq.${purchase.provider_payment_id}` : null,
                purchase.provider_session_id ? `provider_session_id.eq.${purchase.provider_session_id}` : null,
                `purchase_reference_id.eq.${purchase.event_id}`,
                normalizedEmail ? `email.eq.${normalizedEmail}` : null,
            ].filter(Boolean).join(','))
            .order('created_at', { ascending: false })
            .limit(20),
        (admin
            .from('admin_operation_logs') as any)
            .select('*')
            .or([
                `entity_id.eq.${purchaseId}`,
                normalizedEmail ? `target_email.eq.${normalizedEmail}` : null,
                purchase.user_id ? `target_user_id.eq.${purchase.user_id}` : null,
            ].filter(Boolean).join(','))
            .order('created_at', { ascending: false })
            .limit(50),
        (admin
            .from('admin_operation_notes') as any)
            .select('*')
            .or([
                `entity_id.eq.${purchaseId}`,
                normalizedEmail ? `target_email.eq.${normalizedEmail}` : null,
                purchase.user_id ? `target_user_id.eq.${purchase.user_id}` : null,
            ].filter(Boolean).join(','))
            .order('created_at', { ascending: false })
            .limit(50),
    ])

    const entitlements = (entitlementsResult.data ?? []) as (EventEntitlement & { event?: any })[]
    const activeEntitlements = entitlements.filter((row) => row.status === 'active')
    const fulfillmentStatus =
        purchase.status === 'pending'
            ? 'pending'
            : activeEntitlements.length > 0
                ? 'fulfilled'
                : purchase.status === 'confirmed'
                    ? 'confirmed_without_access'
                    : purchase.status

    return {
        purchase: {
            ...purchase,
            attributionSummary: parseAttributionSnapshot((purchase as any).attribution_snapshot ?? purchase.metadata?.attribution_snapshot ?? null),
        },
        profileCandidates: (profileCandidatesResult.data ?? []) as Partial<Profile>[],
        entitlements,
        transactions: ((transactionResult.data ?? []) as PaymentTransaction[]).map((transaction: any) => ({
            ...transaction,
            attributionSummary: parseAttributionSnapshot(transaction.attribution_snapshot ?? null),
        })),
        fulfillmentStatus,
        auditLogs: (logsResult.data ?? []) as AdminOperationLog[],
        notes: (notesResult.data ?? []) as AdminOperationNote[],
    }
}

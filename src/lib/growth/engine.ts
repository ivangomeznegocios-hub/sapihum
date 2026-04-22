import { addDays, isAfter } from 'date-fns'
import { createServiceClient } from '@/lib/supabase/service'
import type { RefundWebhookData, SubscriptionWebhookData } from '@/lib/payments/types'

type AdminClient = any

export type GrowthProgramType = 'member' | 'host' | 'ambassador' | 'partner' | 'group_leader' | 'admin' | 'organization'
export type GrowthSourceType = 'organization' | 'host' | 'ambassador' | 'member' | 'organic' | 'admin'
export type GrowthAttributionStatus = 'captured' | 'registered' | 'paid' | 'qualified' | 'inactive' | 'rejected'
export type GrowthConversionStatus = 'pending' | 'confirmed' | 'qualified' | 'cancelled' | 'refunded' | 'fraud_flagged'
export type GrowthRewardStatus = 'pending_review' | 'approved' | 'granted' | 'revoked' | 'expired'
export type GrowthRewardType =
    | 'extra_days'
    | 'level2_free_month'
    | 'upgrade_temp'
    | 'exclusive_session'
    | 'badge'
    | 'manual_bonus'
    | 'commission'
    | 'revenue_share'
    | 'custom'

type GrowthRewardRule = {
    threshold: number
    reward_type: GrowthRewardType
    reward_value: Record<string, any>
    automatic?: boolean
    requires_manual_review?: boolean
    reason_type?: string
}

type GrowthProgramConfig = {
    attribution_window_days: number
    consolidation_days: number
    owner_priority: GrowthSourceType[]
    automatic_reward_types: GrowthRewardType[]
    manual_reward_types: GrowthRewardType[]
    reward_rules: GrowthRewardRule[]
}

const DEFAULT_MEMBER_REFERRAL_CONFIG: GrowthProgramConfig = {
    attribution_window_days: 30,
    consolidation_days: 30,
    owner_priority: ['organization', 'host', 'ambassador', 'member', 'organic'],
    automatic_reward_types: ['extra_days', 'badge'],
    manual_reward_types: ['level2_free_month', 'upgrade_temp', 'commission', 'revenue_share', 'manual_bonus'],
    reward_rules: [
        {
            threshold: 1,
            reward_type: 'extra_days',
            reward_value: { days: 15, label: '15 dias extra' },
            automatic: true,
            requires_manual_review: false,
            reason_type: 'referral_active_1',
        },
        {
            threshold: 2,
            reward_type: 'extra_days',
            reward_value: { days: 15, label: '15 dias extra' },
            automatic: true,
            requires_manual_review: false,
            reason_type: 'referral_active_2',
        },
        {
            threshold: 4,
            reward_type: 'level2_free_month',
            reward_value: { months: 1, membership_level: 2, label: '1 mes de Nivel 2' },
            automatic: false,
            requires_manual_review: true,
            reason_type: 'referral_active_4',
        },
    ],
}

function getAdminClient(admin?: AdminClient) {
    return admin ?? createServiceClient()
}

function normalizeReferralCode(code: string | null | undefined) {
    return (code || '').trim().toUpperCase()
}

function sourceTypeForProgram(programType: GrowthProgramType): GrowthSourceType {
    if (programType === 'organization' || programType === 'partner') return 'organization'
    if (programType === 'host') return 'host'
    if (programType === 'ambassador') return 'ambassador'
    if (programType === 'admin') return 'admin'
    return 'member'
}

function sourcePriority(sourceType: string | null | undefined, priority: GrowthSourceType[]) {
    const index = priority.indexOf((sourceType || 'organic') as GrowthSourceType)
    return index === -1 ? priority.length : index
}

function parsePositiveInt(value: unknown, fallback: number) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback
    return Math.trunc(parsed)
}

function normalizeConfig(row: any | null): GrowthProgramConfig {
    const raw = row?.config_json && typeof row.config_json === 'object' ? row.config_json : {}
    const rewardRules = Array.isArray(raw.reward_rules) ? raw.reward_rules : DEFAULT_MEMBER_REFERRAL_CONFIG.reward_rules

    return {
        attribution_window_days: parsePositiveInt(raw.attribution_window_days, DEFAULT_MEMBER_REFERRAL_CONFIG.attribution_window_days),
        consolidation_days: parsePositiveInt(raw.consolidation_days, DEFAULT_MEMBER_REFERRAL_CONFIG.consolidation_days),
        owner_priority: Array.isArray(raw.owner_priority) && raw.owner_priority.length > 0
            ? raw.owner_priority
            : DEFAULT_MEMBER_REFERRAL_CONFIG.owner_priority,
        automatic_reward_types: Array.isArray(raw.automatic_reward_types)
            ? raw.automatic_reward_types
            : DEFAULT_MEMBER_REFERRAL_CONFIG.automatic_reward_types,
        manual_reward_types: Array.isArray(raw.manual_reward_types)
            ? raw.manual_reward_types
            : DEFAULT_MEMBER_REFERRAL_CONFIG.manual_reward_types,
        reward_rules: rewardRules
            .map((rule: any) => ({
                threshold: parsePositiveInt(rule.threshold, 0),
                reward_type: rule.reward_type,
                reward_value: rule.reward_value && typeof rule.reward_value === 'object' ? rule.reward_value : {},
                automatic: Boolean(rule.automatic),
                requires_manual_review: rule.requires_manual_review !== false,
                reason_type: typeof rule.reason_type === 'string' ? rule.reason_type : `referral_active_${rule.threshold}`,
            }))
            .filter((rule: GrowthRewardRule) => rule.threshold > 0 && Boolean(rule.reward_type)),
    }
}

export async function getMemberReferralConfig(admin?: AdminClient): Promise<GrowthProgramConfig> {
    const client = getAdminClient(admin)
    const { data } = await (client
        .from('growth_program_configs') as any)
        .select('config_json')
        .eq('program_key', 'member_referral')
        .eq('is_active', true)
        .maybeSingle()

    return normalizeConfig(data)
}

export async function ensureGrowthProfileForUser(params: {
    userId: string
    programType?: GrowthProgramType
    referralCode?: string | null
    inviteCodeId?: string | null
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const programType = params.programType ?? 'member'

    const { data: existing } = await (admin
        .from('growth_profiles') as any)
        .select('*')
        .eq('user_id', params.userId)
        .eq('program_type', programType)
        .maybeSingle()

    if (existing) {
        return existing
    }

    let referralCode = normalizeReferralCode(params.referralCode)
    let inviteCodeId = params.inviteCodeId ?? null

    if (!referralCode && programType === 'member') {
        const { data: inviteCode } = await (admin
            .from('invite_codes') as any)
            .select('id, code')
            .eq('owner_id', params.userId)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()

        referralCode = normalizeReferralCode(inviteCode?.code)
        inviteCodeId = inviteCode?.id ?? null
    }

    const insertPayload: Record<string, any> = {
        user_id: params.userId,
        program_type: programType,
        status: 'active',
        metadata: { created_by: 'growth_engine' },
    }

    if (referralCode) {
        insertPayload.referral_code = referralCode
        insertPayload.referral_link_slug = referralCode.toLowerCase()
    }

    if (inviteCodeId) {
        insertPayload.created_from_invite_code_id = inviteCodeId
    }

    const { data, error } = await (admin
        .from('growth_profiles') as any)
        .insert(insertPayload)
        .select('*')
        .single()

    if (!error && data) {
        return data
    }

    const { data: racedProfile } = await (admin
        .from('growth_profiles') as any)
        .select('*')
        .eq('user_id', params.userId)
        .eq('program_type', programType)
        .maybeSingle()

    if (racedProfile) {
        return racedProfile
    }

    throw error ?? new Error('No fue posible crear el perfil de growth')
}

export async function resolveGrowthProfileByCode(code: string, admin?: AdminClient) {
    const client = getAdminClient(admin)
    const normalized = normalizeReferralCode(code)

    if (!normalized) return null

    const { data: growthProfile } = await (client
        .from('growth_profiles') as any)
        .select('*')
        .or(`referral_code.eq.${normalized},referral_link_slug.eq.${normalized.toLowerCase()}`)
        .eq('status', 'active')
        .maybeSingle()

    if (growthProfile) {
        return growthProfile
    }

    const { data: inviteCode } = await (client
        .from('invite_codes') as any)
        .select('id, owner_id, code, is_active')
        .eq('code', normalized)
        .maybeSingle()

    if (!inviteCode?.is_active || !inviteCode.owner_id) {
        return null
    }

    return ensureGrowthProfileForUser({
        userId: inviteCode.owner_id,
        programType: 'member',
        referralCode: inviteCode.code,
        inviteCodeId: inviteCode.id,
        admin: client,
    })
}

async function createGrowthFraudFlag(params: {
    admin: AdminClient
    userId?: string | null
    relatedUserId?: string | null
    attributionId?: string | null
    conversionId?: string | null
    flagType: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    notes?: string
    metadata?: Record<string, any>
}) {
    await (params.admin
        .from('growth_fraud_flags') as any)
        .insert({
            user_id: params.userId ?? null,
            related_user_id: params.relatedUserId ?? null,
            growth_attribution_id: params.attributionId ?? null,
            growth_conversion_id: params.conversionId ?? null,
            flag_type: params.flagType,
            severity: params.severity ?? 'medium',
            notes: params.notes ?? null,
            metadata: params.metadata ?? {},
        })
}

export async function applyGrowthAttributionForRegisteredUser(params: {
    inviteeUserId: string
    code: string
    sourceChannel?: string
    captureMethod?: 'url_param' | 'cookie' | 'local_storage' | 'manual_code' | 'admin' | 'backfill'
    campaignCode?: string | null
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const config = await getMemberReferralConfig(admin)
    const ownerProfile = await resolveGrowthProfileByCode(params.code, admin)

    if (!ownerProfile) {
        return { success: false, error: 'Codigo de growth invalido' }
    }

    const ownerUserId = ownerProfile.user_id as string | null
    if (ownerUserId && ownerUserId === params.inviteeUserId) {
        await createGrowthFraudFlag({
            admin,
            userId: params.inviteeUserId,
            relatedUserId: ownerUserId,
            flagType: 'self_referral',
            severity: 'high',
            notes: 'Intento de autorreferido bloqueado',
            metadata: { code: normalizeReferralCode(params.code) },
        })
        return { success: false, error: 'No puedes usar tu propio codigo de invitacion' }
    }

    const { data: invitee } = await (admin
        .from('profiles') as any)
        .select('id, email, full_name')
        .eq('id', params.inviteeUserId)
        .maybeSingle()

    const { data: existing } = await (admin
        .from('growth_attributions') as any)
        .select('*')
        .eq('invitee_user_id', params.inviteeUserId)
        .maybeSingle()

    const now = new Date()
    const sourceType = sourceTypeForProgram(ownerProfile.program_type)

    if (existing) {
        const currentPriority = sourcePriority(existing.source_type, config.owner_priority)
        const nextPriority = sourcePriority(sourceType, config.owner_priority)
        const canReassign =
            nextPriority < currentPriority &&
            ['captured', 'registered'].includes(existing.status) &&
            isAfter(new Date(existing.attribution_expires_at), now)

        const updates: Record<string, any> = {
            registered_at: existing.registered_at ?? now.toISOString(),
            updated_at: now.toISOString(),
        }

        if (existing.status === 'captured') {
            updates.status = 'registered'
        }

        if (canReassign) {
            updates.owner_profile_id = ownerProfile.id
            updates.owner_user_id = ownerUserId
            updates.organization_id = ownerProfile.organization_id ?? null
            updates.referral_code_used = normalizeReferralCode(params.code)
            updates.source_type = sourceType
            updates.source_channel = params.sourceChannel ?? 'unknown'
            updates.capture_method = params.captureMethod ?? 'manual_code'
            updates.campaign_code = params.campaignCode ?? existing.campaign_code
            updates.metadata = {
                ...(existing.metadata ?? {}),
                reassigned_at: now.toISOString(),
                reassigned_from_owner_profile_id: existing.owner_profile_id,
            }
        }

        await (admin
            .from('growth_attributions') as any)
            .update(updates)
            .eq('id', existing.id)

        return { success: true, attributionId: existing.id, reassigned: canReassign }
    }

    const capturedAt = now
    const attributionExpiresAt = addDays(capturedAt, config.attribution_window_days)

    const { data, error } = await (admin
        .from('growth_attributions') as any)
        .insert({
            owner_profile_id: ownerProfile.id,
            owner_user_id: ownerUserId,
            organization_id: ownerProfile.organization_id ?? null,
            invitee_user_id: params.inviteeUserId,
            invitee_email: invitee?.email ?? null,
            invitee_name: invitee?.full_name ?? null,
            referral_code_used: normalizeReferralCode(params.code),
            source_type: sourceType,
            source_channel: params.sourceChannel ?? 'unknown',
            capture_method: params.captureMethod ?? 'manual_code',
            campaign_code: params.campaignCode ?? null,
            status: 'registered',
            captured_at: capturedAt.toISOString(),
            attribution_expires_at: attributionExpiresAt.toISOString(),
            registered_at: now.toISOString(),
            metadata: { created_by: 'growth_engine' },
        })
        .select('id')
        .single()

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, attributionId: data?.id }
}

export async function markGrowthAttributionRegistered(inviteeUserId: string, admin?: AdminClient) {
    const client = getAdminClient(admin)
    await (client
        .from('growth_attributions') as any)
        .update({
            status: 'registered',
            registered_at: new Date().toISOString(),
        })
        .eq('invitee_user_id', inviteeUserId)
        .eq('status', 'captured')
}

export async function recordGrowthSubscriptionActivation(params: {
    data: SubscriptionWebhookData
    userId: string
    subscriptionId?: string | null
    paymentTransactionId?: string | null
    providerEventId?: string | null
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const config = await getMemberReferralConfig(admin)
    const activatedAt = new Date()

    const { data: attribution } = await (admin
        .from('growth_attributions') as any)
        .select('*')
        .eq('invitee_user_id', params.userId)
        .not('status', 'in', '(rejected,inactive)')
        .maybeSingle()

    if (!attribution) {
        return { success: true, skipped: 'no_attribution' }
    }

    if (attribution.owner_user_id === params.userId) {
        await (admin
            .from('growth_attributions') as any)
            .update({
                status: 'rejected',
                rejected_at: activatedAt.toISOString(),
                rejection_reason: 'self_referral',
            })
            .eq('id', attribution.id)

        await createGrowthFraudFlag({
            admin,
            userId: params.userId,
            relatedUserId: attribution.owner_user_id,
            attributionId: attribution.id,
            flagType: 'self_referral',
            severity: 'high',
            notes: 'Autorreferido detectado durante conversion',
        })

        return { success: false, error: 'self_referral' }
    }

    if (isAfter(activatedAt, new Date(attribution.attribution_expires_at))) {
        await (admin
            .from('growth_attributions') as any)
            .update({
                status: 'rejected',
                rejected_at: activatedAt.toISOString(),
                rejection_reason: 'attribution_window_expired',
            })
            .eq('id', attribution.id)

        return { success: true, skipped: 'attribution_window_expired' }
    }

    const idempotencyKey = `subscription:${params.data.providerSubscriptionId}`
    const qualificationDueAt = addDays(activatedAt, config.consolidation_days)

    const payload = {
        attribution_id: attribution.id,
        owner_profile_id: attribution.owner_profile_id,
        owner_user_id: attribution.owner_user_id,
        invitee_user_id: params.userId,
        membership_id: params.subscriptionId ?? null,
        payment_transaction_id: params.paymentTransactionId ?? null,
        conversion_type: 'membership_activation',
        payment_provider: 'stripe',
        provider_event_id: params.providerEventId ?? null,
        provider_subscription_id: params.data.providerSubscriptionId,
        provider_payment_id: params.data.paymentIntentId ?? null,
        provider_session_id: params.data.sessionId ?? null,
        provider_invoice_id: params.data.invoiceId ?? null,
        membership_level_at_activation: params.data.membershipLevel ?? null,
        amount: params.data.amount ?? null,
        currency: params.data.currency ?? 'MXN',
        status: 'confirmed',
        activated_at: activatedAt.toISOString(),
        qualification_due_at: qualificationDueAt.toISOString(),
        idempotency_key: idempotencyKey,
        metadata: {
            provider_customer_id: params.data.providerCustomerId,
            price_id: params.data.priceId ?? null,
            specialization_code: params.data.specializationCode ?? null,
        },
    }

    const { data: existingConversion } = await (admin
        .from('growth_conversions') as any)
        .select('id, status')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

    if (existingConversion && ['qualified', 'cancelled', 'refunded', 'fraud_flagged'].includes(existingConversion.status)) {
        return { success: true, conversionId: existingConversion.id, skipped: 'terminal_conversion_exists' }
    }

    const mutation = existingConversion
        ? (admin.from('growth_conversions') as any).update(payload).eq('id', existingConversion.id)
        : (admin.from('growth_conversions') as any).insert(payload)

    const { data: conversion, error } = await mutation
        .select('id, status')
        .single()

    if (error) {
        throw error
    }

    if (!['qualified', 'cancelled', 'refunded', 'fraud_flagged'].includes(conversion?.status)) {
        await (admin
            .from('growth_attributions') as any)
            .update({
                status: 'paid',
                paid_at: activatedAt.toISOString(),
            })
            .eq('id', attribution.id)
            .in('status', ['captured', 'registered', 'paid'])
    }

    await consolidateEligibleGrowthConversions({ admin })
    return { success: true, conversionId: conversion?.id }
}

export async function attachGrowthConversionPaymentReference(params: {
    providerSubscriptionId: string
    paymentTransactionId?: string | null
    providerPaymentId?: string | null
    providerInvoiceId?: string | null
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
    }

    if (params.paymentTransactionId) updates.payment_transaction_id = params.paymentTransactionId
    if (params.providerPaymentId) updates.provider_payment_id = params.providerPaymentId
    if (params.providerInvoiceId) updates.provider_invoice_id = params.providerInvoiceId

    if (Object.keys(updates).length === 1) return

    const { error } = await (admin
        .from('growth_conversions') as any)
        .update(updates)
        .eq('provider_subscription_id', params.providerSubscriptionId)
        .in('status', ['pending', 'confirmed'])

    if (error) throw error
}

export async function cancelGrowthConversionsForSubscription(params: {
    providerSubscriptionId: string
    reason: string
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const cancelledAt = new Date().toISOString()

    const { data: conversions } = await (admin
        .from('growth_conversions') as any)
        .select('id, attribution_id, status')
        .eq('provider_subscription_id', params.providerSubscriptionId)
        .in('status', ['pending', 'confirmed'])

    for (const conversion of conversions ?? []) {
        await (admin
            .from('growth_conversions') as any)
            .update({
                status: 'cancelled',
                cancelled_at: cancelledAt,
                fraud_reason: params.reason,
            })
            .eq('id', conversion.id)

        if (conversion.attribution_id) {
            await (admin
                .from('growth_attributions') as any)
                .update({
                    status: 'inactive',
                    inactive_at: cancelledAt,
                    metadata: { cancellation_reason: params.reason },
                })
                .eq('id', conversion.attribution_id)
                .in('status', ['paid', 'registered', 'captured'])
        }
    }
}

export async function refundGrowthConversionsForPayment(data: RefundWebhookData, admin?: AdminClient) {
    const client = getAdminClient(admin)
    const filters = [
        data.paymentIntentId ? `provider_payment_id.eq.${data.paymentIntentId}` : null,
        data.sessionId ? `provider_session_id.eq.${data.sessionId}` : null,
    ].filter(Boolean) as string[]

    if (filters.length === 0) return

    const { data: conversions } = await (client
        .from('growth_conversions') as any)
        .select('id, attribution_id, status')
        .or(filters.join(','))
        .in('status', ['pending', 'confirmed', 'qualified'])

    for (const conversion of conversions ?? []) {
        const refundedAt = new Date().toISOString()
        await (client
            .from('growth_conversions') as any)
            .update({
                status: 'refunded',
                refunded_at: refundedAt,
                metadata: {
                    refund_id: data.refundId,
                    refund_reason: data.refundReason ?? null,
                    refunded_amount: data.amountRefunded,
                },
            })
            .eq('id', conversion.id)

        if (conversion.attribution_id) {
            await (client
                .from('growth_attributions') as any)
                .update({
                    status: 'inactive',
                    inactive_at: refundedAt,
                })
                .eq('id', conversion.attribution_id)
        }

        await (client
            .from('growth_rewards') as any)
            .update({
                status: 'revoked',
                revoked_at: refundedAt,
                notes: 'Revocado por reembolso de pago',
            })
            .eq('conversion_id', conversion.id)
            .in('status', ['pending_review', 'approved'])
    }
}

export async function consolidateEligibleGrowthConversions(params?: {
    admin?: AdminClient
    now?: Date
    limit?: number
}) {
    const admin = getAdminClient(params?.admin)
    const now = params?.now ?? new Date()
    const { data: conversions } = await (admin
        .from('growth_conversions') as any)
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .lte('qualification_due_at', now.toISOString())
        .order('qualification_due_at', { ascending: true })
        .limit(params?.limit ?? 50)

    let qualified = 0
    let blocked = 0

    for (const conversion of conversions ?? []) {
        const blockedReason = await getConversionBlockReason(admin, conversion)
        if (blockedReason) {
            blocked += 1
            await (admin
                .from('growth_conversions') as any)
                .update({
                    status: blockedReason === 'refunded' ? 'refunded' : 'cancelled',
                    cancelled_at: blockedReason === 'refunded' ? null : now.toISOString(),
                    refunded_at: blockedReason === 'refunded' ? now.toISOString() : null,
                    fraud_reason: blockedReason,
                })
                .eq('id', conversion.id)

            if (conversion.attribution_id) {
                await (admin
                    .from('growth_attributions') as any)
                    .update({
                        status: 'inactive',
                        inactive_at: now.toISOString(),
                    })
                    .eq('id', conversion.attribution_id)
                    .in('status', ['captured', 'registered', 'paid'])
            }
            continue
        }

        await (admin
            .from('growth_conversions') as any)
            .update({
                status: 'qualified',
                qualified_at: now.toISOString(),
            })
            .eq('id', conversion.id)

        if (conversion.attribution_id) {
            await (admin
                .from('growth_attributions') as any)
                .update({
                    status: 'qualified',
                    qualified_at: now.toISOString(),
                })
                .eq('id', conversion.attribution_id)
        }

        await createRewardsForQualifiedConversion(admin, conversion.id)
        qualified += 1
    }

    return { qualified, blocked }
}

async function getConversionBlockReason(admin: AdminClient, conversion: any) {
    if (conversion.payment_transaction_id) {
        const { data: transaction } = await (admin
            .from('payment_transactions') as any)
            .select('status')
            .eq('id', conversion.payment_transaction_id)
            .maybeSingle()

        if (transaction?.status === 'refunded') {
            return 'refunded'
        }
    }

    if (conversion.provider_subscription_id) {
        const { data: subscription } = await (admin
            .from('subscriptions') as any)
            .select('status, cancelled_at')
            .eq('provider_subscription_id', conversion.provider_subscription_id)
            .maybeSingle()

        if (!subscription) return 'subscription_missing'
        if (['cancelled', 'expired', 'paused', 'incomplete', 'past_due'].includes(subscription.status)) {
            return `subscription_${subscription.status}`
        }
    }

    return null
}

async function createRewardsForQualifiedConversion(admin: AdminClient, conversionId: string) {
    const { data: conversion } = await (admin
        .from('growth_conversions') as any)
        .select('*')
        .eq('id', conversionId)
        .maybeSingle()

    if (!conversion?.owner_profile_id || !conversion.owner_user_id) return

    const config = await getMemberReferralConfig(admin)
    const { count } = await (admin
        .from('growth_conversions') as any)
        .select('*', { count: 'exact', head: true })
        .eq('owner_profile_id', conversion.owner_profile_id)
        .eq('status', 'qualified')

    const qualifiedCount = count ?? 0
    const eligibleRules = config.reward_rules.filter((rule) => rule.threshold === qualifiedCount)

    for (const rule of eligibleRules) {
        const automatic = Boolean(rule.automatic) && config.automatic_reward_types.includes(rule.reward_type)
        const requiresManualReview = rule.requires_manual_review !== false || config.manual_reward_types.includes(rule.reward_type)
        const status: GrowthRewardStatus = automatic && !requiresManualReview ? 'approved' : 'pending_review'
        const idempotencyKey = `member_referral:${conversion.owner_profile_id}:threshold:${rule.threshold}`

        const { data: existingReward } = await (admin
            .from('growth_rewards') as any)
            .select('id, status')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle()

        if (existingReward) {
            if (automatic && !requiresManualReview && existingReward.status === 'approved') {
                await grantGrowthReward({
                    rewardId: existingReward.id,
                    admin,
                    grantedBy: null,
                    notes: 'Reward automatico otorgado por motor de growth',
                })
            }
            continue
        }

        const { data: reward, error } = await (admin
            .from('growth_rewards') as any)
            .insert({
                attribution_id: conversion.attribution_id,
                conversion_id: conversion.id,
                beneficiary_user_id: conversion.owner_user_id,
                growth_profile_id: conversion.owner_profile_id,
                reward_type: rule.reward_type,
                reward_value: rule.reward_value,
                reason_type: rule.reason_type ?? `referral_active_${rule.threshold}`,
                reason_reference_id: conversion.id,
                status,
                automatic,
                requires_manual_review: requiresManualReview,
                idempotency_key: idempotencyKey,
                metadata: {
                    qualified_referral_count: qualifiedCount,
                    threshold: rule.threshold,
                },
            })
            .select('id, status, reward_type')
            .single()

        if (error || !reward) continue

        if (automatic && !requiresManualReview) {
            await grantGrowthReward({
                rewardId: reward.id,
                admin,
                grantedBy: null,
                notes: 'Reward automatico otorgado por motor de growth',
            })
        }
    }
}

export async function approveGrowthReward(params: {
    rewardId: string
    approvedBy: string
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const { error } = await (admin
        .from('growth_rewards') as any)
        .update({
            status: 'approved',
            approved_by: params.approvedBy,
            approved_at: new Date().toISOString(),
        })
        .eq('id', params.rewardId)
        .eq('status', 'pending_review')

    if (error) throw error
}

export async function revokeGrowthReward(params: {
    rewardId: string
    revokedBy?: string | null
    reason?: string
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const now = new Date().toISOString()

    await (admin
        .from('growth_membership_benefits') as any)
        .update({
            status: 'revoked',
            updated_at: now,
        })
        .eq('reward_id', params.rewardId)
        .eq('status', 'active')

    const { error } = await (admin
        .from('growth_rewards') as any)
        .update({
            status: 'revoked',
            revoked_at: now,
            notes: params.reason ?? 'Reward revocado manualmente',
            metadata: {
                revoked_by: params.revokedBy ?? null,
            },
        })
        .eq('id', params.rewardId)

    if (error) throw error
}

export async function grantGrowthReward(params: {
    rewardId: string
    grantedBy?: string | null
    notes?: string
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const { data: reward, error: fetchError } = await (admin
        .from('growth_rewards') as any)
        .select('*')
        .eq('id', params.rewardId)
        .maybeSingle()

    if (fetchError) throw fetchError
    if (!reward || reward.status === 'granted') return
    if (['revoked', 'expired'].includes(reward.status)) return

    if (['extra_days', 'level2_free_month', 'upgrade_temp'].includes(reward.reward_type)) {
        await createMembershipBenefitForReward(admin, reward)
    }

    const now = new Date().toISOString()
    const { error } = await (admin
        .from('growth_rewards') as any)
        .update({
            status: 'granted',
            approved_by: reward.approved_by ?? params.grantedBy ?? null,
            approved_at: reward.approved_at ?? now,
            granted_at: now,
            notes: params.notes ?? reward.notes,
        })
        .eq('id', params.rewardId)

    if (error) throw error
}

async function createMembershipBenefitForReward(admin: AdminClient, reward: any) {
    const rewardValue = reward.reward_value ?? {}
    const now = new Date()
    const { data: subscription } = await (admin
        .from('subscriptions') as any)
        .select('membership_level, specialization_code, status, current_period_end')
        .eq('user_id', reward.beneficiary_user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const isUpgrade = reward.reward_type === 'level2_free_month' || reward.reward_type === 'upgrade_temp'
    const days = isUpgrade
        ? parsePositiveInt(rewardValue.days, parsePositiveInt(rewardValue.months, 1) * 30)
        : parsePositiveInt(rewardValue.days, 15)
    const currentPeriodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null
    const startsAt = !isUpgrade && currentPeriodEnd && isAfter(currentPeriodEnd, now) ? currentPeriodEnd : now
    const endsAt = addDays(startsAt, days)
    const currentLevel = Number(subscription?.membership_level ?? 1)
    const membershipLevel = isUpgrade
        ? parsePositiveInt(rewardValue.membership_level, 2)
        : Math.max(1, currentLevel)

    const { error } = await (admin
        .from('growth_membership_benefits') as any)
        .upsert(
            {
                reward_id: reward.id,
                user_id: reward.beneficiary_user_id,
                benefit_type: isUpgrade ? 'temporary_upgrade' : 'extra_days',
                membership_level: membershipLevel,
                specialization_code: rewardValue.specialization_code ?? subscription?.specialization_code ?? null,
                starts_at: startsAt.toISOString(),
                ends_at: endsAt.toISOString(),
                status: 'active',
                metadata: {
                    reward_type: reward.reward_type,
                    reward_value: rewardValue,
                },
            },
            { onConflict: 'reward_id' }
        )

    if (error) throw error
}

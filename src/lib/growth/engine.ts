import { addDays, addMonths, isAfter } from 'date-fns'
import { createServiceClient } from '@/lib/supabase/service'
import type { RefundWebhookData, SubscriptionWebhookData } from '@/lib/payments/types'

type AdminClient = any

export type GrowthProgramType = 'member' | 'host' | 'ambassador' | 'partner' | 'group_leader' | 'admin' | 'organization'
export type GrowthSourceType = 'organization' | 'host' | 'ambassador' | 'member' | 'organic' | 'admin'
export type GrowthAttributionStatus = 'captured' | 'registered' | 'paid' | 'qualified' | 'inactive' | 'rejected'
export type GrowthConversionStatus = 'pending' | 'confirmed' | 'qualified' | 'cancelled' | 'refunded' | 'fraud_flagged'
export type GrowthRewardStatus = 'pending_review' | 'approved' | 'granted' | 'revoked' | 'expired'
export type GrowthConsolidationRule = 'first_renewal_paid' | 'billing_cycle_end' | 'fixed_days'
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
    consolidation_rule: GrowthConsolidationRule
    fallback_consolidation_rule: Extract<GrowthConsolidationRule, 'billing_cycle_end' | 'fixed_days'>
    owner_priority: GrowthSourceType[]
    automatic_reward_types: GrowthRewardType[]
    manual_reward_types: GrowthRewardType[]
    reward_rules: GrowthRewardRule[]
}

type GrowthConsolidationMetadata = {
    primary_rule: GrowthConsolidationRule
    fallback_rule: Extract<GrowthConsolidationRule, 'billing_cycle_end' | 'fixed_days'>
    fixed_days: number
    billing_cycle_end_at: string | null
    qualification_due_at: string
    qualified_by_rule?: GrowthConsolidationRule | null
    renewal_paid_at?: string | null
    renewal_transaction_id?: string | null
    renewal_payment_id?: string | null
    renewal_invoice_id?: string | null
    renewal_session_id?: string | null
}

const DEFAULT_MEMBER_REFERRAL_CONFIG: GrowthProgramConfig = {
    attribution_window_days: 30,
    consolidation_days: 30,
    consolidation_rule: 'first_renewal_paid',
    fallback_consolidation_rule: 'billing_cycle_end',
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

function toDateOrNull(value: string | Date | null | undefined) {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

function parsePositiveInt(value: unknown, fallback: number) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback
    return Math.trunc(parsed)
}

function normalizeConsolidationRule(value: unknown, fallback: GrowthConsolidationRule): GrowthConsolidationRule {
    if (value === 'first_renewal_paid' || value === 'billing_cycle_end' || value === 'fixed_days') {
        return value
    }

    return fallback
}

function normalizeFallbackConsolidationRule(
    value: unknown,
    fallback: Extract<GrowthConsolidationRule, 'billing_cycle_end' | 'fixed_days'>
): Extract<GrowthConsolidationRule, 'billing_cycle_end' | 'fixed_days'> {
    const normalized = normalizeConsolidationRule(value, fallback)
    return normalized === 'first_renewal_paid' ? fallback : normalized
}

function resolveConsolidationDueAt(params: {
    activatedAt: Date
    billingCycleEndAt: Date | null
    primaryRule: GrowthConsolidationRule
    fallbackRule: Extract<GrowthConsolidationRule, 'billing_cycle_end' | 'fixed_days'>
    fixedDays: number
}) {
    const fixedDaysDueAt = addDays(params.activatedAt, params.fixedDays)

    if (params.primaryRule === 'fixed_days') return fixedDaysDueAt
    if (params.primaryRule === 'billing_cycle_end') return params.billingCycleEndAt ?? fixedDaysDueAt

    if (params.fallbackRule === 'billing_cycle_end' && params.billingCycleEndAt) {
        return params.billingCycleEndAt
    }

    return fixedDaysDueAt
}

function buildConsolidationMetadata(params: {
    activatedAt: Date
    billingCycleEndAt: Date | null
    config: GrowthProgramConfig
    existing?: Partial<GrowthConsolidationMetadata> | null
}) {
    const existing = params.existing ?? {}
    const primaryRule = existing.primary_rule
        ? normalizeConsolidationRule(existing.primary_rule, params.config.consolidation_rule)
        : params.config.consolidation_rule
    const fallbackRule = normalizeFallbackConsolidationRule(
        existing.fallback_rule ?? params.config.fallback_consolidation_rule,
        params.config.fallback_consolidation_rule
    )
    const fixedDays = parsePositiveInt(existing.fixed_days, params.config.consolidation_days)
    const billingCycleEndAt = toDateOrNull(existing.billing_cycle_end_at) ?? params.billingCycleEndAt
    const qualificationDueAt = resolveConsolidationDueAt({
        activatedAt: params.activatedAt,
        billingCycleEndAt,
        primaryRule,
        fallbackRule,
        fixedDays,
    })

    return {
        primary_rule: primaryRule,
        fallback_rule: fallbackRule,
        fixed_days: fixedDays,
        billing_cycle_end_at: billingCycleEndAt?.toISOString() ?? null,
        qualification_due_at: qualificationDueAt.toISOString(),
        qualified_by_rule: existing.qualified_by_rule ?? null,
        renewal_paid_at: existing.renewal_paid_at ?? null,
        renewal_transaction_id: existing.renewal_transaction_id ?? null,
        renewal_payment_id: existing.renewal_payment_id ?? null,
        renewal_invoice_id: existing.renewal_invoice_id ?? null,
        renewal_session_id: existing.renewal_session_id ?? null,
    } satisfies GrowthConsolidationMetadata
}

function getConsolidationMetadata(conversion: any, config: GrowthProgramConfig) {
    const rawConsolidation =
        conversion?.metadata?.consolidation && typeof conversion.metadata.consolidation === 'object'
            ? conversion.metadata.consolidation
            : null
    const activatedAt = toDateOrNull(conversion?.activated_at) ?? new Date()

    return buildConsolidationMetadata({
        activatedAt,
        billingCycleEndAt: toDateOrNull(rawConsolidation?.billing_cycle_end_at),
        config,
        existing: rawConsolidation,
    })
}

function normalizeConfig(row: any | null): GrowthProgramConfig {
    const raw = row?.config_json && typeof row.config_json === 'object' ? row.config_json : {}
    const rewardRules = Array.isArray(raw.reward_rules) ? raw.reward_rules : DEFAULT_MEMBER_REFERRAL_CONFIG.reward_rules

    return {
        attribution_window_days: parsePositiveInt(raw.attribution_window_days, DEFAULT_MEMBER_REFERRAL_CONFIG.attribution_window_days),
        consolidation_days: parsePositiveInt(raw.consolidation_days, DEFAULT_MEMBER_REFERRAL_CONFIG.consolidation_days),
        consolidation_rule: normalizeConsolidationRule(
            raw.consolidation_rule,
            DEFAULT_MEMBER_REFERRAL_CONFIG.consolidation_rule
        ),
        fallback_consolidation_rule: normalizeFallbackConsolidationRule(
            raw.fallback_consolidation_rule,
            DEFAULT_MEMBER_REFERRAL_CONFIG.fallback_consolidation_rule
        ),
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
    const { data: subscription } = params.subscriptionId
        ? await (admin
            .from('subscriptions') as any)
            .select('id, current_period_start, current_period_end, status')
            .eq('id', params.subscriptionId)
            .maybeSingle()
        : await (admin
            .from('subscriptions') as any)
            .select('id, current_period_start, current_period_end, status')
            .eq('provider_subscription_id', params.data.providerSubscriptionId)
            .maybeSingle()

    const { data: existingConversion } = await (admin
        .from('growth_conversions') as any)
        .select('id, status, metadata, payment_transaction_id, provider_payment_id, provider_session_id, provider_invoice_id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

    const consolidation = buildConsolidationMetadata({
        activatedAt,
        billingCycleEndAt: toDateOrNull(subscription?.current_period_end),
        config,
        existing:
            existingConversion?.metadata?.consolidation && typeof existingConversion.metadata.consolidation === 'object'
                ? existingConversion.metadata.consolidation
                : null,
    })

    const payload = {
        attribution_id: attribution.id,
        owner_profile_id: attribution.owner_profile_id,
        owner_user_id: attribution.owner_user_id,
        invitee_user_id: params.userId,
        membership_id: params.subscriptionId ?? subscription?.id ?? null,
        payment_transaction_id: params.paymentTransactionId ?? existingConversion?.payment_transaction_id ?? null,
        conversion_type: 'membership_activation',
        payment_provider: 'stripe',
        provider_event_id: params.providerEventId ?? null,
        provider_subscription_id: params.data.providerSubscriptionId,
        provider_payment_id: existingConversion?.provider_payment_id ?? params.data.paymentIntentId ?? null,
        provider_session_id: existingConversion?.provider_session_id ?? params.data.sessionId ?? null,
        provider_invoice_id: existingConversion?.provider_invoice_id ?? params.data.invoiceId ?? null,
        membership_level_at_activation: params.data.membershipLevel ?? null,
        amount: params.data.amount ?? null,
        currency: params.data.currency ?? 'MXN',
        status: 'confirmed',
        activated_at: activatedAt.toISOString(),
        qualification_due_at: consolidation.qualification_due_at,
        idempotency_key: idempotencyKey,
        metadata: {
            ...(existingConversion?.metadata ?? {}),
            provider_customer_id: params.data.providerCustomerId,
            price_id: params.data.priceId ?? null,
            specialization_code: params.data.specializationCode ?? null,
            consolidation,
        },
    }

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
    providerSessionId?: string | null
    providerInvoiceId?: string | null
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const now = new Date().toISOString()
    const config = await getMemberReferralConfig(admin)
    const { data: conversions, error: fetchError } = await (admin
        .from('growth_conversions') as any)
        .select('id, metadata, payment_transaction_id, provider_payment_id, provider_session_id, provider_invoice_id, activated_at')
        .eq('provider_subscription_id', params.providerSubscriptionId)
        .in('status', ['pending', 'confirmed'])

    if (fetchError) throw fetchError
    if (!conversions || conversions.length === 0) return

    for (const conversion of conversions) {
        const consolidation = getConsolidationMetadata(conversion, config)
        const metadata = {
            ...(conversion.metadata ?? {}),
            consolidation: {
                ...consolidation,
                renewal_paid_at: now,
                renewal_transaction_id: params.paymentTransactionId ?? consolidation.renewal_transaction_id ?? null,
                renewal_payment_id: params.providerPaymentId ?? consolidation.renewal_payment_id ?? null,
                renewal_invoice_id: params.providerInvoiceId ?? consolidation.renewal_invoice_id ?? null,
                renewal_session_id: params.providerSessionId ?? consolidation.renewal_session_id ?? null,
            },
        }

        const { error } = await (admin
            .from('growth_conversions') as any)
            .update({
                payment_transaction_id: params.paymentTransactionId ?? conversion.payment_transaction_id ?? null,
                provider_payment_id: conversion.provider_payment_id ?? params.providerPaymentId ?? null,
                provider_session_id: conversion.provider_session_id ?? params.providerSessionId ?? null,
                provider_invoice_id: conversion.provider_invoice_id ?? params.providerInvoiceId ?? null,
                metadata,
                updated_at: now,
            })
            .eq('id', conversion.id)

        if (error) throw error
    }
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
    const conversions = await collectGrowthConversionsForRefund(client, data)
    if (conversions.length === 0) return

    for (const conversion of conversions) {
        const refundedAt = new Date().toISOString()
        await (client
            .from('growth_conversions') as any)
            .update({
                status: 'refunded',
                refunded_at: refundedAt,
                metadata: {
                    ...(conversion.metadata ?? {}),
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

        await revokeGrowthRewardsForConversion(client, conversion.id, 'Revocado por reembolso de pago')
    }
}

async function ensureGrowthFraudFlag(params: {
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
    let query = (params.admin
        .from('growth_fraud_flags') as any)
        .select('id')
        .eq('flag_type', params.flagType)
        .eq('status', 'open')

    if (params.attributionId) {
        query = query.eq('growth_attribution_id', params.attributionId)
    }

    if (params.conversionId) {
        query = query.eq('growth_conversion_id', params.conversionId)
    }

    const { data: existing } = await query.maybeSingle()

    if (existing?.id) return existing.id

    await createGrowthFraudFlag(params)
    return null
}

export async function markGrowthAttributionFraud(params: {
    attributionId: string
    admin?: AdminClient
    reviewedBy?: string | null
    notes?: string
}) {
    const admin = getAdminClient(params.admin)
    const now = new Date().toISOString()
    const { data: attribution } = await (admin
        .from('growth_attributions') as any)
        .select('*')
        .eq('id', params.attributionId)
        .maybeSingle()

    if (!attribution) return

    await (admin
        .from('growth_attributions') as any)
        .update({
            status: 'rejected',
            rejected_at: now,
            rejection_reason: 'fraud_flagged',
            metadata: {
                ...(attribution.metadata ?? {}),
                fraud_reviewed_by: params.reviewedBy ?? null,
                fraud_notes: params.notes ?? 'Marcado como fraude desde admin',
            },
        })
        .eq('id', attribution.id)

    const { data: conversions } = await (admin
        .from('growth_conversions') as any)
        .select('id, status')
        .eq('attribution_id', attribution.id)

    for (const conversion of conversions ?? []) {
        await (admin
            .from('growth_conversions') as any)
            .update({
                status: 'fraud_flagged',
                fraud_reason: params.notes ?? 'Marcado como fraude desde admin',
            })
            .eq('id', conversion.id)

        await revokeGrowthRewardsForConversion(
            admin,
            conversion.id,
            params.notes ?? 'Reward revocado por caso marcado como fraude',
            params.reviewedBy ?? null
        )
    }

    await ensureGrowthFraudFlag({
        admin,
        userId: attribution.invitee_user_id ?? null,
        relatedUserId: attribution.owner_user_id ?? null,
        attributionId: attribution.id,
        flagType: 'admin_marked_fraud',
        severity: 'high',
        notes: params.notes ?? 'Caso marcado manualmente como fraude',
        metadata: { reviewed_by: params.reviewedBy ?? null },
    })
}

export async function markGrowthConversionFraud(params: {
    conversionId: string
    admin?: AdminClient
    reviewedBy?: string | null
    notes?: string
}) {
    const admin = getAdminClient(params.admin)
    const { data: conversion } = await (admin
        .from('growth_conversions') as any)
        .select('*')
        .eq('id', params.conversionId)
        .maybeSingle()

    if (!conversion) return

    await (admin
        .from('growth_conversions') as any)
        .update({
            status: 'fraud_flagged',
            fraud_reason: params.notes ?? 'Marcado como fraude desde admin',
        })
        .eq('id', conversion.id)

    if (conversion.attribution_id) {
        await (admin
            .from('growth_attributions') as any)
            .update({
                status: 'rejected',
                rejected_at: new Date().toISOString(),
                rejection_reason: 'fraud_flagged',
            })
            .eq('id', conversion.attribution_id)
    }

    await revokeGrowthRewardsForConversion(
        admin,
        conversion.id,
        params.notes ?? 'Reward revocado por conversion marcada como fraude',
        params.reviewedBy ?? null
    )

    await ensureGrowthFraudFlag({
        admin,
        userId: conversion.invitee_user_id ?? null,
        relatedUserId: conversion.owner_user_id ?? null,
        attributionId: conversion.attribution_id ?? null,
        conversionId: conversion.id,
        flagType: 'admin_marked_fraud',
        severity: 'high',
        notes: params.notes ?? 'Conversion marcada manualmente como fraude',
        metadata: { reviewed_by: params.reviewedBy ?? null },
    })
}

export async function updateGrowthFraudFlagStatus(params: {
    flagId: string
    status: 'reviewed' | 'dismissed' | 'confirmed'
    reviewedBy?: string | null
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const { data: flag } = await (admin
        .from('growth_fraud_flags') as any)
        .select('*')
        .eq('id', params.flagId)
        .maybeSingle()

    if (!flag) return

    if (params.status === 'confirmed') {
        if (flag.growth_conversion_id) {
            await markGrowthConversionFraud({
                conversionId: flag.growth_conversion_id,
                reviewedBy: params.reviewedBy ?? null,
                notes: flag.notes ?? 'Flag confirmado como fraude',
                admin,
            })
        } else if (flag.growth_attribution_id) {
            await markGrowthAttributionFraud({
                attributionId: flag.growth_attribution_id,
                reviewedBy: params.reviewedBy ?? null,
                notes: flag.notes ?? 'Flag confirmado como fraude',
                admin,
            })
        }
    }

    await (admin
        .from('growth_fraud_flags') as any)
        .update({
            status: params.status,
            metadata: {
                ...(flag.metadata ?? {}),
                reviewed_by: params.reviewedBy ?? null,
                reviewed_at: new Date().toISOString(),
            },
        })
        .eq('id', params.flagId)
}

export async function consolidateEligibleGrowthConversions(params?: {
    admin?: AdminClient
    now?: Date
    limit?: number
}) {
    const admin = getAdminClient(params?.admin)
    const now = params?.now ?? new Date()
    const config = await getMemberReferralConfig(admin)
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
        const decision = await getGrowthQualificationDecision(admin, conversion, now, config)
        if (!decision) continue

        if (decision.action === 'blocked') {
            blocked += 1
            await (admin
                .from('growth_conversions') as any)
                .update({
                    status: decision.reason === 'refunded' ? 'refunded' : 'cancelled',
                    cancelled_at: decision.reason === 'refunded' ? null : now.toISOString(),
                    refunded_at: decision.reason === 'refunded' ? now.toISOString() : null,
                    fraud_reason: decision.reason,
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

        await qualifyGrowthConversion({
            admin,
            conversion,
            qualifiedAt: decision.qualifiedAt,
            rule: decision.rule,
            renewalTransaction: decision.renewalTransaction ?? null,
        })
        qualified += 1
    }

    return { qualified, blocked }
}

async function collectGrowthConversionsForRefund(client: AdminClient, data: RefundWebhookData) {
    const filters = [
        data.paymentIntentId ? `provider_payment_id.eq.${data.paymentIntentId}` : null,
        data.sessionId ? `provider_session_id.eq.${data.sessionId}` : null,
    ].filter(Boolean) as string[]

    if (filters.length === 0) return []

    const map = new Map<string, any>()
    const addRows = (rows: any[] | null | undefined) => {
        for (const row of rows ?? []) {
            if (row?.id) map.set(row.id, row)
        }
    }

    const { data: directMatches } = await (client
        .from('growth_conversions') as any)
        .select('id, attribution_id, status, metadata')
        .or(filters.join(','))
        .in('status', ['pending', 'confirmed', 'qualified'])

    addRows(directMatches)

    const { data: transactions } = await (client
        .from('payment_transactions') as any)
        .select('id, subscription_id')
        .or(filters.join(','))
        .in('status', ['completed', 'refunded'])

    for (const transaction of transactions ?? []) {
        let query = (client.from('growth_conversions') as any)
            .select('id, attribution_id, status, metadata')
            .in('status', ['pending', 'confirmed', 'qualified'])

        if (transaction.subscription_id) {
            query = query.or(`payment_transaction_id.eq.${transaction.id},membership_id.eq.${transaction.subscription_id}`)
        } else {
            query = query.eq('payment_transaction_id', transaction.id)
        }

        const { data: relatedMatches } = await query
        addRows(relatedMatches)
    }

    return Array.from(map.values())
}

async function revokeGrowthRewardsForConversion(
    admin: AdminClient,
    conversionId: string,
    reason: string,
    revokedBy?: string | null
) {
    const { data: rewards } = await (admin
        .from('growth_rewards') as any)
        .select('id')
        .eq('conversion_id', conversionId)
        .in('status', ['pending_review', 'approved', 'granted'])

    for (const reward of rewards ?? []) {
        await revokeGrowthReward({
            rewardId: reward.id,
            revokedBy: revokedBy ?? null,
            reason,
            admin,
        })
    }
}

async function findFirstRenewalTransaction(admin: AdminClient, conversion: any) {
    let subscriptionId = conversion.membership_id ?? null

    if (!subscriptionId && conversion.provider_subscription_id) {
        const { data: subscription } = await (admin
            .from('subscriptions') as any)
            .select('id')
            .eq('provider_subscription_id', conversion.provider_subscription_id)
            .maybeSingle()
        subscriptionId = subscription?.id ?? null
    }

    if (!subscriptionId) return null

    const { data: transaction } = await (admin
        .from('payment_transactions') as any)
        .select('id, provider_payment_id, provider_invoice_id, provider_session_id, completed_at, created_at')
        .eq('subscription_id', subscriptionId)
        .eq('purchase_type', 'subscription_payment')
        .eq('status', 'completed')
        .gt('created_at', conversion.activated_at)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

    return transaction ?? null
}

async function getGrowthQualificationDecision(
    admin: AdminClient,
    conversion: any,
    now: Date,
    config: GrowthProgramConfig
): Promise<
    | { action: 'blocked'; reason: string }
    | { action: 'qualify'; rule: GrowthConsolidationRule; qualifiedAt: string; renewalTransaction?: any | null }
    | null
> {
    const blockedReason = await getConversionBlockReason(admin, conversion)
    if (blockedReason) {
        return { action: 'blocked', reason: blockedReason }
    }

    const consolidation = getConsolidationMetadata(conversion, config)
    const activatedAt = toDateOrNull(conversion.activated_at) ?? now
    const billingCycleEndAt = toDateOrNull(consolidation.billing_cycle_end_at)
    const fixedDaysDueAt = addDays(activatedAt, consolidation.fixed_days)
    const orderedRules: GrowthConsolidationRule[] = []

    if (consolidation.primary_rule === 'first_renewal_paid') {
        const renewalTransaction = await findFirstRenewalTransaction(admin, conversion)
        if (renewalTransaction) {
            return {
                action: 'qualify',
                rule: 'first_renewal_paid',
                qualifiedAt: renewalTransaction.completed_at ?? renewalTransaction.created_at ?? now.toISOString(),
                renewalTransaction,
            }
        }

        orderedRules.push(consolidation.fallback_rule)
    } else {
        orderedRules.push(consolidation.primary_rule)
    }

    if (!orderedRules.includes('fixed_days')) {
        orderedRules.push('fixed_days')
    }

    for (const rule of orderedRules) {
        if (rule === 'billing_cycle_end') {
            if (billingCycleEndAt && !isAfter(billingCycleEndAt, now)) {
                return {
                    action: 'qualify',
                    rule,
                    qualifiedAt: billingCycleEndAt.toISOString(),
                }
            }
            continue
        }

        if (!isAfter(fixedDaysDueAt, now)) {
            return {
                action: 'qualify',
                rule,
                qualifiedAt: fixedDaysDueAt.toISOString(),
            }
        }
    }

    return null
}

async function qualifyGrowthConversion(params: {
    admin: AdminClient
    conversion: any
    rule: GrowthConsolidationRule
    qualifiedAt: string
    renewalTransaction?: any | null
}) {
    const config = await getMemberReferralConfig(params.admin)
    const consolidation = getConsolidationMetadata(params.conversion, config)
    const qualifiedAt = toDateOrNull(params.qualifiedAt)?.toISOString() ?? new Date().toISOString()

    await (params.admin
        .from('growth_conversions') as any)
        .update({
            status: 'qualified',
            qualified_at: qualifiedAt,
            payment_transaction_id: params.renewalTransaction?.id ?? params.conversion.payment_transaction_id ?? null,
            metadata: {
                ...(params.conversion.metadata ?? {}),
                consolidation: {
                    ...consolidation,
                    qualified_by_rule: params.rule,
                    renewal_paid_at: params.renewalTransaction
                        ? (params.renewalTransaction.completed_at ?? params.renewalTransaction.created_at ?? qualifiedAt)
                        : consolidation.renewal_paid_at ?? null,
                    renewal_transaction_id: params.renewalTransaction?.id ?? consolidation.renewal_transaction_id ?? null,
                    renewal_payment_id: params.renewalTransaction?.provider_payment_id ?? consolidation.renewal_payment_id ?? null,
                    renewal_invoice_id: params.renewalTransaction?.provider_invoice_id ?? consolidation.renewal_invoice_id ?? null,
                    renewal_session_id: params.renewalTransaction?.provider_session_id ?? consolidation.renewal_session_id ?? null,
                },
            },
        })
        .eq('id', params.conversion.id)

    if (params.conversion.attribution_id) {
        await (params.admin
            .from('growth_attributions') as any)
            .update({
                status: 'qualified',
                qualified_at: qualifiedAt,
            })
            .eq('id', params.conversion.attribution_id)
    }

    await createRewardsForQualifiedConversion(params.admin, params.conversion.id)
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
    const { data: existingBenefit } = await (admin
        .from('growth_membership_benefits') as any)
        .select('id, benefit_type, ends_at')
        .eq('user_id', reward.beneficiary_user_id)
        .eq('status', 'active')
        .in('benefit_type', ['extra_days', 'temporary_upgrade'])
        .gte('ends_at', now.toISOString())
        .order('ends_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const isUpgrade = reward.reward_type === 'level2_free_month' || reward.reward_type === 'upgrade_temp'
    const currentPeriodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null
    const existingBenefitEnd = existingBenefit?.ends_at ? new Date(existingBenefit.ends_at) : null
    const preferredStart = isUpgrade
        ? (existingBenefitEnd && isAfter(existingBenefitEnd, now) ? existingBenefitEnd : now)
        : currentPeriodEnd && isAfter(currentPeriodEnd, now)
            ? currentPeriodEnd
            : now
    const startsAt = existingBenefitEnd && isAfter(existingBenefitEnd, preferredStart) ? existingBenefitEnd : preferredStart
    const months = parsePositiveInt(rewardValue.months, 0)
    const days = parsePositiveInt(rewardValue.days, isUpgrade ? 30 : 15)
    const usesRealMonths = isUpgrade && months > 0 && rewardValue.days === undefined
    const endsAt = usesRealMonths ? addMonths(startsAt, months) : addDays(startsAt, days)
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
                    duration_unit: usesRealMonths ? 'months' : 'days',
                    duration_value: usesRealMonths ? months : days,
                    applied_mode: isUpgrade ? 'temporary_upgrade' : 'extend_membership',
                },
            },
            { onConflict: 'reward_id' }
        )

    if (error) throw error
}

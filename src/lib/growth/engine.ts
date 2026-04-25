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
    monthly_goal?: number
    tiers?: Array<{
        tier: 'base' | 'pro' | 'elite'
        monthly_qualified_goal: number
        label?: string
    }>
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

const DEFAULT_HOST_PROGRAM_CONFIG: GrowthProgramConfig = {
    ...DEFAULT_MEMBER_REFERRAL_CONFIG,
    monthly_goal: 5,
    tiers: [
        { tier: 'base', monthly_qualified_goal: 5, label: 'Base' },
        { tier: 'pro', monthly_qualified_goal: 10, label: 'Pro' },
        { tier: 'elite', monthly_qualified_goal: 20, label: 'Elite' },
    ],
    automatic_reward_types: ['badge'],
    manual_reward_types: ['commission', 'revenue_share', 'manual_bonus', 'level2_free_month', 'upgrade_temp'],
    reward_rules: [
        {
            threshold: 5,
            reward_type: 'commission',
            reward_value: { label: 'Comision host base', amount: 0, currency: 'MXN' },
            automatic: false,
            requires_manual_review: true,
            reason_type: 'host_goal_monthly',
        },
        {
            threshold: 10,
            reward_type: 'commission',
            reward_value: { label: 'Comision host pro', amount: 0, currency: 'MXN' },
            automatic: false,
            requires_manual_review: true,
            reason_type: 'host_goal_monthly',
        },
    ],
}

const DEFAULT_AMBASSADOR_PROGRAM_CONFIG: GrowthProgramConfig = {
    ...DEFAULT_MEMBER_REFERRAL_CONFIG,
    monthly_goal: 3,
    tiers: [
        { tier: 'base', monthly_qualified_goal: 3, label: 'Base' },
        { tier: 'pro', monthly_qualified_goal: 6, label: 'Pro' },
        { tier: 'elite', monthly_qualified_goal: 12, label: 'Elite' },
    ],
    automatic_reward_types: ['extra_days', 'badge'],
    manual_reward_types: ['level2_free_month', 'upgrade_temp', 'manual_bonus'],
    reward_rules: [
        {
            threshold: 3,
            reward_type: 'badge',
            reward_value: { badge: 'ambassador_base', label: 'Badge embajador base' },
            automatic: true,
            requires_manual_review: false,
            reason_type: 'ambassador_goal_monthly',
        },
        {
            threshold: 6,
            reward_type: 'level2_free_month',
            reward_value: { months: 1, membership_level: 2, label: '1 mes Nivel 2 para embajador' },
            automatic: false,
            requires_manual_review: true,
            reason_type: 'ambassador_goal_monthly',
        },
    ],
}

const DEFAULT_ORGANIZATION_PROGRAM_CONFIG: GrowthProgramConfig = {
    ...DEFAULT_MEMBER_REFERRAL_CONFIG,
    automatic_reward_types: [],
    manual_reward_types: ['revenue_share', 'manual_bonus'],
    reward_rules: [
        {
            threshold: 1,
            reward_type: 'revenue_share',
            reward_value: { percentage: 0, label: 'Revenue share institucional pendiente' },
            automatic: false,
            requires_manual_review: true,
            reason_type: 'organization_revenue_share',
        },
    ],
}

const DEFAULT_GROUP_PACK_PROGRAM_CONFIG: GrowthProgramConfig = {
    ...DEFAULT_MEMBER_REFERRAL_CONFIG,
    automatic_reward_types: [],
    manual_reward_types: ['manual_bonus', 'level2_free_month', 'custom'],
    reward_rules: [
        {
            threshold: 1,
            reward_type: 'manual_bonus',
            reward_value: { label: 'Beneficio grupal desbloqueado' },
            automatic: false,
            requires_manual_review: true,
            reason_type: 'group_pack_completed',
        },
    ],
}

function programKeyForProgramType(programType: GrowthProgramType | string | null | undefined) {
    if (programType === 'host') return 'host_program'
    if (programType === 'ambassador') return 'ambassador_program'
    if (programType === 'organization' || programType === 'partner') return 'organization_program'
    if (programType === 'group_pack' || programType === 'group_leader') return 'group_pack_program'
    return 'member_referral'
}

function defaultConfigForProgramKey(programKey: string) {
    if (programKey === 'host_program') return DEFAULT_HOST_PROGRAM_CONFIG
    if (programKey === 'ambassador_program') return DEFAULT_AMBASSADOR_PROGRAM_CONFIG
    if (programKey === 'organization_program') return DEFAULT_ORGANIZATION_PROGRAM_CONFIG
    if (programKey === 'group_pack_program') return DEFAULT_GROUP_PACK_PROGRAM_CONFIG
    return DEFAULT_MEMBER_REFERRAL_CONFIG
}

function getAdminClient(admin?: AdminClient) {
    return admin ?? createServiceClient()
}

function normalizeReferralCode(code: string | null | undefined) {
    return (code || '').trim().toUpperCase()
}

function normalizeSlug(value: string | null | undefined) {
    return (value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

function requiredMembersForPack(packType: string, fallback?: number | null) {
    if (packType === 'pack_3') return 3
    if (packType === 'pack_5') return 5
    if (packType === 'pack_10') return 10
    const parsed = Number(fallback)
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 3
}

function sourceTypeForProgram(programType: GrowthProgramType): GrowthSourceType {
    if (programType === 'organization' || programType === 'partner') return 'organization'
    if (programType === 'host') return 'host'
    if (programType === 'ambassador') return 'ambassador'
    if (programType === 'admin') return 'admin'
    return 'member'
}

function programTypeForSourceType(sourceType: string | null | undefined): GrowthProgramType {
    if (sourceType === 'host') return 'host'
    if (sourceType === 'ambassador') return 'ambassador'
    if (sourceType === 'organization') return 'organization'
    if (sourceType === 'admin') return 'admin'
    return 'member'
}

function usesMonthlyRewardScope(programType: GrowthProgramType | string | null | undefined) {
    return programType === 'host' || programType === 'ambassador'
}

function getUtcMonthWindow(date: Date) {
    const startsAt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    const endsAt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
    const periodMonth = `${startsAt.getUTCFullYear()}-${String(startsAt.getUTCMonth() + 1).padStart(2, '0')}`

    return {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        periodMonth,
    }
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

function normalizeConfig(row: any | null, defaults: GrowthProgramConfig = DEFAULT_MEMBER_REFERRAL_CONFIG): GrowthProgramConfig {
    const raw = row?.config_json && typeof row.config_json === 'object' ? row.config_json : {}
    const rewardRules = Array.isArray(raw.reward_rules) ? raw.reward_rules : defaults.reward_rules

    return {
        attribution_window_days: parsePositiveInt(raw.attribution_window_days, defaults.attribution_window_days),
        consolidation_days: parsePositiveInt(raw.consolidation_days, defaults.consolidation_days),
        consolidation_rule: normalizeConsolidationRule(
            raw.consolidation_rule,
            defaults.consolidation_rule
        ),
        fallback_consolidation_rule: normalizeFallbackConsolidationRule(
            raw.fallback_consolidation_rule,
            defaults.fallback_consolidation_rule
        ),
        owner_priority: Array.isArray(raw.owner_priority) && raw.owner_priority.length > 0
            ? raw.owner_priority
            : defaults.owner_priority,
        automatic_reward_types: Array.isArray(raw.automatic_reward_types)
            ? raw.automatic_reward_types
            : defaults.automatic_reward_types,
        manual_reward_types: Array.isArray(raw.manual_reward_types)
            ? raw.manual_reward_types
            : defaults.manual_reward_types,
        monthly_goal: parsePositiveInt(raw.monthly_goal, defaults.monthly_goal ?? 0) || undefined,
        tiers: Array.isArray(raw.tiers) ? raw.tiers : defaults.tiers,
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

export async function getGrowthProgramConfig(
    programType: GrowthProgramType | string = 'member',
    admin?: AdminClient
): Promise<GrowthProgramConfig> {
    const client = getAdminClient(admin)
    const programKey = programKeyForProgramType(programType)
    const defaults = defaultConfigForProgramKey(programKey)
    const { data } = await (client
        .from('growth_program_configs') as any)
        .select('config_json, is_active')
        .eq('program_key', programKey)
        .maybeSingle()

    if (!data) {
        await (client
            .from('growth_program_configs') as any)
            .upsert(
                {
                    program_key: programKey,
                    config_json: defaults,
                    is_active: true,
                },
                { onConflict: 'program_key' }
            )

        return defaults
    }

    return normalizeConfig(data, defaults)
}

export async function getMemberReferralConfig(admin?: AdminClient): Promise<GrowthProgramConfig> {
    return getGrowthProgramConfig('member', admin)
}

async function getGrowthProgramConfigForConversion(admin: AdminClient, conversion: any) {
    const metadataProgramType = conversion?.metadata?.program_type
    if (metadataProgramType) {
        return getGrowthProgramConfig(metadataProgramType, admin)
    }

    if (conversion?.owner_profile_id) {
        const { data: profile } = await (admin
            .from('growth_profiles') as any)
            .select('program_type')
            .eq('id', conversion.owner_profile_id)
            .maybeSingle()

        return getGrowthProgramConfig(profile?.program_type ?? 'member', admin)
    }

    return getGrowthProgramConfig('member', admin)
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

export async function ensureGrowthProfileForOrganization(params: {
    organizationId: string
    referralCode?: string | null
    landingSlug?: string | null
    status?: 'active' | 'paused' | 'blocked'
    metadata?: Record<string, any>
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const { data: existing } = await (admin
        .from('growth_profiles') as any)
        .select('*')
        .eq('organization_id', params.organizationId)
        .eq('program_type', 'organization')
        .maybeSingle()

    const updates: Record<string, any> = {
        status: params.status ?? existing?.status ?? 'active',
        updated_at: new Date().toISOString(),
    }

    if (params.referralCode) updates.referral_code = normalizeReferralCode(params.referralCode)
    if (params.landingSlug) updates.referral_link_slug = normalizeSlug(params.landingSlug)
    if (params.metadata || existing?.metadata) {
        updates.metadata = {
            ...(existing?.metadata ?? {}),
            ...(params.metadata ?? {}),
        }
    }

    if (existing) {
        const { data, error } = await (admin
            .from('growth_profiles') as any)
            .update(updates)
            .eq('id', existing.id)
            .select('*')
            .single()

        if (error) throw error
        return data
    }

    const payload: Record<string, any> = {
        organization_id: params.organizationId,
        program_type: 'organization',
        status: params.status ?? 'active',
        metadata: params.metadata ?? {},
    }

    if (params.referralCode) payload.referral_code = normalizeReferralCode(params.referralCode)
    if (params.landingSlug) payload.referral_link_slug = normalizeSlug(params.landingSlug)

    const { data, error } = await (admin
        .from('growth_profiles') as any)
        .insert(payload)
        .select('*')
        .single()

    if (error) throw error
    return data
}

export async function upsertGrowthProgramEnrollment(params: {
    userId: string
    programType: 'host' | 'ambassador'
    status: 'applied' | 'approved' | 'rejected' | 'paused' | 'active' | 'terminated'
    tier?: 'base' | 'pro' | 'elite' | null
    approvalNotes?: string | null
    approvedBy?: string | null
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    await getGrowthProgramConfig(params.programType, admin)

    const shouldActivateProfile = params.status === 'active' || params.status === 'approved'
    const now = new Date().toISOString()
    let growthProfile: any = null

    if (shouldActivateProfile) {
        growthProfile = await ensureGrowthProfileForUser({
            userId: params.userId,
            programType: params.programType,
            admin,
        })

        if (growthProfile.status !== 'active') {
            const { data, error } = await (admin
                .from('growth_profiles') as any)
                .update({
                    status: 'active',
                    updated_at: now,
                    metadata: {
                        ...(growthProfile.metadata ?? {}),
                        activated_by_enrollment: true,
                        activated_at: now,
                    },
                })
                .eq('id', growthProfile.id)
                .select('*')
                .single()

            if (error) throw error
            growthProfile = data
        }
    }

    const { data: existing } = await (admin
        .from('growth_program_enrollments') as any)
        .select('*')
        .eq('user_id', params.userId)
        .eq('program_type', params.programType)
        .maybeSingle()

    const payload = {
        user_id: params.userId,
        growth_profile_id: growthProfile?.id ?? existing?.growth_profile_id ?? null,
        program_type: params.programType,
        status: params.status,
        tier: params.tier ?? existing?.tier ?? 'base',
        approval_notes: params.approvalNotes ?? existing?.approval_notes ?? null,
        approved_by: shouldActivateProfile ? (params.approvedBy ?? existing?.approved_by ?? null) : existing?.approved_by ?? null,
        approved_at: shouldActivateProfile ? (existing?.approved_at ?? now) : existing?.approved_at ?? null,
        updated_at: now,
        metadata: {
            ...(existing?.metadata ?? {}),
            managed_from: 'admin_growth_programs',
        },
    }

    const mutation = existing
        ? (admin.from('growth_program_enrollments') as any).update(payload).eq('id', existing.id)
        : (admin.from('growth_program_enrollments') as any).insert(payload)

    const { data: enrollment, error } = await mutation
        .select('*')
        .single()

    if (error) throw error

    if (!shouldActivateProfile && enrollment.growth_profile_id) {
        const profileStatus = params.status === 'paused' ? 'paused' : 'blocked'
        await (admin
            .from('growth_profiles') as any)
            .update({
                status: profileStatus,
                updated_at: now,
            })
            .eq('id', enrollment.growth_profile_id)
            .in('program_type', ['host', 'ambassador'])
    }

    return enrollment
}

export async function upsertGrowthOrganization(params: {
    organizationId?: string | null
    name: string
    organizationType: 'university' | 'association' | 'college' | 'community' | 'other'
    status: 'lead' | 'prospect' | 'active_partner' | 'inactive_partner'
    partnerCode?: string | null
    landingSlug?: string | null
    contactName?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    benefitModel: 'discount' | 'revenue_share' | 'bulk_access' | 'custom'
    benefitConfig?: Record<string, any>
    createdBy?: string | null
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    await getGrowthProgramConfig('organization', admin)

    const partnerCode = normalizeReferralCode(params.partnerCode) || normalizeReferralCode(params.name).replace(/[^A-Z0-9]/g, '').slice(0, 8) || undefined
    const landingSlug = normalizeSlug(params.landingSlug) || normalizeSlug(params.name) || undefined
    const payload = {
        name: params.name.trim(),
        organization_type: params.organizationType,
        status: params.status,
        ...(partnerCode ? { partner_code: partnerCode } : {}),
        landing_slug: landingSlug ?? null,
        contact_name: params.contactName || null,
        contact_email: params.contactEmail || null,
        contact_phone: params.contactPhone || null,
        benefit_model: params.benefitModel,
        benefit_config: params.benefitConfig ?? {},
        created_by: params.createdBy ?? null,
        updated_at: new Date().toISOString(),
    }

    const mutation = params.organizationId
        ? (admin.from('organizations') as any).update(payload).eq('id', params.organizationId)
        : (admin.from('organizations') as any).insert(payload)

    const { data: organization, error } = await mutation
        .select('*')
        .single()

    if (error) throw error

    const profileStatus = organization.status === 'active_partner' ? 'active' : organization.status === 'inactive_partner' ? 'paused' : 'paused'
    const growthProfile = await ensureGrowthProfileForOrganization({
        organizationId: organization.id,
        referralCode: organization.partner_code,
        landingSlug: organization.landing_slug,
        status: profileStatus,
        metadata: { managed_from: 'admin_growth_organizations' },
        admin,
    })

    return { organization, growthProfile }
}

export async function createGroupPack(params: {
    leaderUserId: string
    packType: 'pack_3' | 'pack_5' | 'pack_10' | 'custom'
    requiredMembers?: number | null
    benefitConfig?: Record<string, any>
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    await getGrowthProgramConfig('group_pack', admin)

    const requiredMembers = requiredMembersForPack(params.packType, params.requiredMembers)
    const { data, error } = await (admin
        .from('group_packs') as any)
        .insert({
            leader_user_id: params.leaderUserId,
            pack_type: params.packType,
            status: 'inviting',
            required_members: requiredMembers,
            active_members_count: 0,
            benefit_config: params.benefitConfig ?? {
                label: `Beneficio grupal Pack ${requiredMembers}`,
            },
            metadata: {
                created_from: 'growth_dashboard',
            },
        })
        .select('*')
        .single()

    if (error) throw error
    return data
}

export async function inviteGroupPackMember(params: {
    groupPackId: string
    leaderUserId: string
    invitedEmail?: string | null
    invitedPhone?: string | null
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const { data: pack } = await (admin
        .from('group_packs') as any)
        .select('id, leader_user_id, status')
        .eq('id', params.groupPackId)
        .eq('leader_user_id', params.leaderUserId)
        .maybeSingle()

    if (!pack || pack.status === 'cancelled') {
        throw new Error('Pack no disponible')
    }

    const invitedEmail = (params.invitedEmail || '').trim().toLowerCase()
    const invitedPhone = (params.invitedPhone || '').trim()
    if (!invitedEmail && !invitedPhone) {
        throw new Error('Indica email o telefono')
    }

    const { data: existing } = invitedEmail
        ? await (admin
            .from('group_pack_members') as any)
            .select('*')
            .eq('group_pack_id', params.groupPackId)
            .ilike('invited_email', invitedEmail)
            .maybeSingle()
        : { data: null }

    const payload = {
        group_pack_id: params.groupPackId,
        invited_email: invitedEmail || null,
        invited_phone: invitedPhone || null,
        status: existing?.status ?? 'invited',
        updated_at: new Date().toISOString(),
    }

    const mutation = existing
        ? (admin.from('group_pack_members') as any).update(payload).eq('id', existing.id)
        : (admin.from('group_pack_members') as any).insert(payload)

    const { data, error } = await mutation
        .select('*')
        .single()

    if (error) throw error
    return data
}

export async function applyGroupPackRegistration(params: {
    packCode: string
    userId: string
    email?: string | null
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const code = normalizeReferralCode(params.packCode)
    if (!code) return { success: false, error: 'Pack invalido' }

    const { data: pack } = await (admin
        .from('group_packs') as any)
        .select('*')
        .eq('pack_code', code)
        .neq('status', 'cancelled')
        .maybeSingle()

    if (!pack) return { success: false, error: 'Pack no encontrado' }
    if (pack.leader_user_id === params.userId) {
        return { success: false, error: 'El lider no puede sumarse como miembro del pack' }
    }

    const email = (params.email || '').trim().toLowerCase()
    const { data: existingByUser } = await (admin
        .from('group_pack_members') as any)
        .select('*')
        .eq('group_pack_id', pack.id)
        .eq('user_id', params.userId)
        .maybeSingle()

    const { data: existingByEmail } = !existingByUser && email
        ? await (admin
            .from('group_pack_members') as any)
            .select('*')
            .eq('group_pack_id', pack.id)
            .ilike('invited_email', email)
            .maybeSingle()
        : { data: null }

    const existing = existingByUser ?? existingByEmail
    const payload = {
        group_pack_id: pack.id,
        invited_email: (existing?.invited_email ?? email) || null,
        user_id: params.userId,
        status: ['activated', 'active'].includes(existing?.status) ? existing.status : 'registered',
        metadata: {
            ...(existing?.metadata ?? {}),
            registered_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
    }

    const mutation = existing
        ? (admin.from('group_pack_members') as any).update(payload).eq('id', existing.id)
        : (admin.from('group_pack_members') as any).insert(payload)

    const { data, error } = await mutation
        .select('*')
        .single()

    if (error) throw error
    await refreshGroupPackStatus({ groupPackId: pack.id, admin })
    return { success: true, groupPackId: pack.id, memberId: data?.id }
}

export async function markGroupPackMemberActive(params: {
    userId: string
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const { data: memberships } = await (admin
        .from('group_pack_members') as any)
        .select('id, group_pack_id, status, metadata')
        .eq('user_id', params.userId)
        .in('status', ['registered', 'activated'])

    for (const member of memberships ?? []) {
        await (admin
            .from('group_pack_members') as any)
            .update({
                status: 'active',
                metadata: {
                    ...(member.metadata ?? {}),
                    activated_at: new Date().toISOString(),
                },
                updated_at: new Date().toISOString(),
            })
            .eq('id', member.id)

        await refreshGroupPackStatus({ groupPackId: member.group_pack_id, admin })
    }
}

export async function refreshGroupPackStatus(params: {
    groupPackId: string
    admin?: AdminClient
}) {
    const admin = getAdminClient(params.admin)
    const { data: pack } = await (admin
        .from('group_packs') as any)
        .select('*')
        .eq('id', params.groupPackId)
        .maybeSingle()

    if (!pack || pack.status === 'cancelled') return null

    const { data: members } = await (admin
        .from('group_pack_members') as any)
        .select('*')
        .eq('group_pack_id', pack.id)

    const activeMembersCount = (members ?? []).filter((member: any) => member.status === 'active').length
    const hasRegisteredMembers = (members ?? []).some((member: any) => ['registered', 'activated', 'active'].includes(member.status))
    const completed = activeMembersCount >= Number(pack.required_members ?? 0)
    const now = new Date().toISOString()
    const nextStatus = completed ? 'completed' : hasRegisteredMembers ? 'partially_active' : 'inviting'
    let unlockedRewardId = pack.unlocked_reward_id ?? null

    if (completed && !unlockedRewardId && pack.leader_user_id) {
        const config = await getGrowthProgramConfig('group_pack', admin)
        const rule = config.reward_rules[0] ?? DEFAULT_GROUP_PACK_PROGRAM_CONFIG.reward_rules[0]
        const idempotencyKey = `group_pack:${pack.id}:completed`
        const { data: existingReward } = await (admin
            .from('growth_rewards') as any)
            .select('id')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle()

        if (existingReward?.id) {
            unlockedRewardId = existingReward.id
        } else {
            const { data: reward } = await (admin
                .from('growth_rewards') as any)
                .insert({
                    beneficiary_user_id: pack.leader_user_id,
                    group_pack_id: pack.id,
                    reward_type: rule.reward_type,
                    reward_value: {
                        ...(rule.reward_value ?? {}),
                        ...(pack.benefit_config ?? {}),
                    },
                    reason_type: rule.reason_type ?? 'group_pack_completed',
                    status: 'pending_review',
                    automatic: false,
                    requires_manual_review: true,
                    idempotency_key: idempotencyKey,
                    metadata: {
                        program_type: 'group_pack',
                        program_key: 'group_pack_program',
                        pack_type: pack.pack_type,
                        required_members: pack.required_members,
                        active_members_count: activeMembersCount,
                    },
                })
                .select('id')
                .single()
            unlockedRewardId = reward?.id ?? null
        }
    }

    const { data: updatedPack } = await (admin
        .from('group_packs') as any)
        .update({
            active_members_count: activeMembersCount,
            status: nextStatus,
            benefit_unlocked_at: completed ? (pack.benefit_unlocked_at ?? now) : pack.benefit_unlocked_at,
            completed_at: completed ? (pack.completed_at ?? now) : null,
            unlocked_reward_id: unlockedRewardId,
            updated_at: now,
        })
        .eq('id', pack.id)
        .select('*')
        .single()

    return updatedPack ?? null
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
    const ownerProfile = await resolveGrowthProfileByCode(params.code, admin)

    if (!ownerProfile) {
        return { success: false, error: 'Codigo de growth invalido' }
    }

    const config = await getGrowthProgramConfig(ownerProfile.program_type, admin)
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

        return { success: true, attributionId: existing.id, reassigned: canReassign, sourceType }
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

    return { success: true, attributionId: data?.id, sourceType }
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

    const programType = programTypeForSourceType(attribution.source_type)
    const programKey = programKeyForProgramType(programType)
    const config = await getGrowthProgramConfig(programType, admin)
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
            program_type: programType,
            program_key: programKey,
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

    await markGroupPackMemberActive({ userId: params.userId, admin })
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
    const { data: conversions, error: fetchError } = await (admin
        .from('growth_conversions') as any)
        .select('id, metadata, owner_profile_id, payment_transaction_id, provider_payment_id, provider_session_id, provider_invoice_id, activated_at')
        .eq('provider_subscription_id', params.providerSubscriptionId)
        .in('status', ['pending', 'confirmed'])

    if (fetchError) throw fetchError
    if (!conversions || conversions.length === 0) return

    for (const conversion of conversions) {
        const config = await getGrowthProgramConfigForConversion(admin, conversion)
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
    if (conversions.length === 0) return 0

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

    return conversions.length
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
        const config = await getGrowthProgramConfigForConversion(admin, conversion)
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
        data.invoiceId ? `provider_invoice_id.eq.${data.invoiceId}` : null,
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
    const config = await getGrowthProgramConfigForConversion(params.admin, params.conversion)
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

    if (!conversion?.owner_profile_id) return

    const { data: ownerProfile } = await (admin
        .from('growth_profiles') as any)
        .select('program_type, organization_id')
        .eq('id', conversion.owner_profile_id)
        .maybeSingle()
    const programType = conversion.metadata?.program_type ?? ownerProfile?.program_type ?? 'member'
    const programKey = programKeyForProgramType(programType)
    const config = await getGrowthProgramConfig(programType, admin)

    if (programType === 'organization') {
        const rule = config.reward_rules[0] ?? DEFAULT_ORGANIZATION_PROGRAM_CONFIG.reward_rules[0]
        const idempotencyKey = `${programKey}:${conversion.owner_profile_id}:conversion:${conversion.id}`
        const { data: existingReward } = await (admin
            .from('growth_rewards') as any)
            .select('id')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle()

        if (!existingReward) {
            await (admin
                .from('growth_rewards') as any)
                .insert({
                    attribution_id: conversion.attribution_id,
                    conversion_id: conversion.id,
                    beneficiary_user_id: null,
                    organization_id: ownerProfile?.organization_id ?? conversion.metadata?.organization_id ?? null,
                    growth_profile_id: conversion.owner_profile_id,
                    reward_type: rule.reward_type,
                    reward_value: rule.reward_value,
                    reason_type: rule.reason_type ?? 'organization_revenue_share',
                    reason_reference_id: conversion.id,
                    status: 'pending_review',
                    automatic: false,
                    requires_manual_review: true,
                    idempotency_key: idempotencyKey,
                    metadata: {
                        program_type: programType,
                        program_key: programKey,
                        reward_scope: 'per_conversion',
                        conversion_amount: conversion.amount ?? null,
                        conversion_currency: conversion.currency ?? 'MXN',
                    },
                })
        }

        return
    }

    if (!conversion.owner_user_id) return

    const monthlyRewardScope = usesMonthlyRewardScope(programType)
    const rewardWindow = monthlyRewardScope
        ? getUtcMonthWindow(toDateOrNull(conversion.qualified_at) ?? new Date())
        : null
    let qualifiedCountQuery = (admin
        .from('growth_conversions') as any)
        .select('*', { count: 'exact', head: true })
        .eq('owner_profile_id', conversion.owner_profile_id)
        .eq('status', 'qualified')

    if (rewardWindow) {
        qualifiedCountQuery = qualifiedCountQuery
            .gte('qualified_at', rewardWindow.startsAt)
            .lt('qualified_at', rewardWindow.endsAt)
    }

    const { count } = await qualifiedCountQuery
    const qualifiedCount = count ?? 0
    const eligibleRules = config.reward_rules.filter((rule) => rule.threshold === qualifiedCount)

    for (const rule of eligibleRules) {
        const automatic = Boolean(rule.automatic) && config.automatic_reward_types.includes(rule.reward_type)
        const requiresManualReview = rule.requires_manual_review !== false || config.manual_reward_types.includes(rule.reward_type)
        const status: GrowthRewardStatus = automatic && !requiresManualReview ? 'approved' : 'pending_review'
        const idempotencyKey = rewardWindow
            ? `${programKey}:${conversion.owner_profile_id}:period:${rewardWindow.periodMonth}:threshold:${rule.threshold}`
            : `${programKey}:${conversion.owner_profile_id}:threshold:${rule.threshold}`

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
                    program_type: programType,
                    program_key: programKey,
                    reward_scope: rewardWindow ? 'monthly' : 'lifetime',
                    period_month: rewardWindow?.periodMonth ?? null,
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

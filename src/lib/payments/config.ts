import {
    LEVEL_2_DEFAULT_SPECIALIZATION,
    getActiveSpecializations,
    getSpecializationByCode,
    isSpecializationActive,
    type SpecializationCode,
} from '@/lib/specializations'

export type BillingInterval = 'monthly' | 'annual'

export interface SubscriptionPlanConfig {
    name: string
    membershipLevel: number
    specializationCode?: SpecializationCode | null
    trialDays: number
    monthly: {
        stripePriceId: string
        amount: number // MXN per month
    }
    annual: {
        stripePriceId: string
        amount: number // MXN per year
        monthlyEquivalent: number // MXN per month equivalent
        savingsPercent: number // % saved vs monthly
    }
}

function resolveLevel2StripePriceId(code: SpecializationCode, interval: BillingInterval): string {
    const uppercaseCode = code.toUpperCase()
    const scopedEnvKey = interval === 'annual'
        ? `STRIPE_PRICE_LEVEL_2_${uppercaseCode}_ANNUAL`
        : `STRIPE_PRICE_LEVEL_2_${uppercaseCode}_MONTHLY`

    const fromScopedEnv = process.env[scopedEnvKey]
    if (fromScopedEnv) return fromScopedEnv

    if (code === LEVEL_2_DEFAULT_SPECIALIZATION) {
        const legacyFallback = interval === 'annual'
            ? process.env.STRIPE_PRICE_LEVEL_2_ANNUAL
            : process.env.STRIPE_PRICE_LEVEL_2_MONTHLY

        if (legacyFallback) return legacyFallback
    }

    return `price_level2_${code}_${interval}_placeholder`
}

function buildLevel2Plan(code: SpecializationCode): SubscriptionPlanConfig | null {
    const specialization = getSpecializationByCode(code)
    if (!specialization) return null
    if (specialization.status !== 'active') return null
    if (!specialization.level2PriceMonthly) return null

    const monthlyAmount = specialization.level2PriceMonthly
    const annualAmount = monthlyAmount * 10 // 2 months included
    const monthlyEquivalent = Math.round(annualAmount / 12)
    const savingsPercent = Math.max(
        0,
        Math.round((1 - (annualAmount / (monthlyAmount * 12))) * 100)
    )

    return {
        name: `Especializacion ${specialization.name}`,
        membershipLevel: 2,
        specializationCode: specialization.code,
        trialDays: 0,
        monthly: {
            stripePriceId: resolveLevel2StripePriceId(specialization.code, 'monthly'),
            amount: monthlyAmount,
        },
        annual: {
            stripePriceId: resolveLevel2StripePriceId(specialization.code, 'annual'),
            amount: annualAmount,
            monthlyEquivalent,
            savingsPercent,
        },
    }
}

const LEVEL_1_PLAN: SubscriptionPlanConfig = {
    name: 'Membresia Nivel 1 - Comunidad',
    membershipLevel: 1,
    trialDays: 0,
    monthly: {
        stripePriceId: process.env.STRIPE_PRICE_LEVEL_1_MONTHLY || 'price_level1_monthly_placeholder',
        amount: 190,
    },
    annual: {
        stripePriceId: process.env.STRIPE_PRICE_LEVEL_1_ANNUAL || 'price_level1_annual_placeholder',
        amount: 1900,
        monthlyEquivalent: 158,
        savingsPercent: 17,
    },
}

const LEVEL_3_PLAN: SubscriptionPlanConfig = {
    name: 'Membresia Nivel 3 - Avanzado',
    membershipLevel: 3,
    trialDays: 0,
    monthly: {
        stripePriceId: process.env.STRIPE_PRICE_LEVEL_3_MONTHLY || 'price_level3_monthly_placeholder',
        amount: 3800,
    },
    annual: {
        stripePriceId: process.env.STRIPE_PRICE_LEVEL_3_ANNUAL || 'price_level3_annual_placeholder',
        amount: 38000,
        monthlyEquivalent: 3167,
        savingsPercent: 17,
    },
}

const level2PlansBySpecialization = getActiveSpecializations().reduce(
    (acc, specialization) => {
        const plan = buildLevel2Plan(specialization.code)
        if (plan) {
            acc[specialization.code] = plan
        }
        return acc
    },
    {} as Partial<Record<SpecializationCode, SubscriptionPlanConfig>>
)

const DEFAULT_LEVEL_2_PLAN =
    level2PlansBySpecialization[LEVEL_2_DEFAULT_SPECIALIZATION] ??
    ({
        name: 'Membresia Nivel 2 - Especializacion',
        membershipLevel: 2,
        specializationCode: LEVEL_2_DEFAULT_SPECIALIZATION,
        trialDays: 0,
        monthly: {
            stripePriceId: resolveLevel2StripePriceId(LEVEL_2_DEFAULT_SPECIALIZATION, 'monthly'),
            amount: 680,
        },
        annual: {
            stripePriceId: resolveLevel2StripePriceId(LEVEL_2_DEFAULT_SPECIALIZATION, 'annual'),
            amount: 6800,
            monthlyEquivalent: 567,
            savingsPercent: 17,
        },
    } satisfies SubscriptionPlanConfig)

/**
 * Backward-compatible map for screens that still expect one plan per level.
 * Level 2 points to the default active specialization (Clinica).
 */
export const SUBSCRIPTION_PLANS: Record<number, SubscriptionPlanConfig> = {
    1: LEVEL_1_PLAN,
    2: DEFAULT_LEVEL_2_PLAN,
    3: LEVEL_3_PLAN,
}

export function getActiveLevel2SubscriptionPlans(): SubscriptionPlanConfig[] {
    return Object.values(level2PlansBySpecialization)
}

export function getSubscriptionPlan(
    level: number,
    specializationCode?: string | null
): SubscriptionPlanConfig | null {
    if (level === 1) return LEVEL_1_PLAN
    if (level === 3) return LEVEL_3_PLAN

    if (level === 2) {
        const resolvedSpecialization = isSpecializationActive(specializationCode)
            ? specializationCode
            : LEVEL_2_DEFAULT_SPECIALIZATION
        return level2PlansBySpecialization[resolvedSpecialization] || null
    }

    return null
}

export function getStripePriceId(
    level: number,
    interval: BillingInterval,
    specializationCode?: string | null
): string | null {
    const plan = getSubscriptionPlan(level, specializationCode)
    if (!plan) return null
    return interval === 'annual' ? plan.annual.stripePriceId : plan.monthly.stripePriceId
}

export function getPlanByPriceId(priceId: string): (SubscriptionPlanConfig & { interval: BillingInterval }) | null {
    const staticPlans = [LEVEL_1_PLAN, LEVEL_3_PLAN]
    for (const plan of staticPlans) {
        if (plan.monthly.stripePriceId === priceId) return { ...plan, interval: 'monthly' }
        if (plan.annual.stripePriceId === priceId) return { ...plan, interval: 'annual' }
    }

    for (const plan of Object.values(level2PlansBySpecialization)) {
        if (plan.monthly.stripePriceId === priceId) return { ...plan, interval: 'monthly' }
        if (plan.annual.stripePriceId === priceId) return { ...plan, interval: 'annual' }
    }

    return null
}

/**
 * AI credit packages (one-time purchases)
 */
export const AI_CREDIT_PACKAGES = {
    '10h': {
        minutes: 600,
        priceMXN: 250,
        label: 'Paquete 10 Horas',
    },
    '20h': {
        minutes: 1200,
        priceMXN: 400,
        label: 'Paquete 20 Horas',
    },
} as const

export type AICreditPackageKey = keyof typeof AI_CREDIT_PACKAGES


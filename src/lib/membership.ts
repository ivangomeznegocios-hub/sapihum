import {
    LEVEL_1_FEATURE_IDS,
    LEVEL_2_EXCLUSIVE_FEATURE_IDS,
    LEVEL_3_EXCLUSIVE_FEATURE_IDS,
    getPricingFeatureTitles,
} from '@/lib/pricing-catalog'

// ============================================
// MEMBERSHIP LEVELS - Single Source of Truth
// ============================================

export interface MembershipTierConfig {
    level: number
    label: string
    description: string
    price: number // MXN per month
    priceLabel: string
    trialDays: number
    tagline: string
    features: string[]
}

/**
 * Nivel 0 = Registro gratuito
 * Nivel 1 = Comunidad y Educacion
 * Nivel 2 = Membresia de Especializacion (hoy: Clinica)
 * Nivel 3 = Nivel Avanzado (visible tras Nivel 2)
 */
export const MEMBERSHIP_TIERS: Record<number, MembershipTierConfig> = {
    0: {
        level: 0,
        label: 'Registro Gratuito',
        description: 'Psicologo registrado sin plan de pago activo.',
        price: 0,
        priceLabel: 'Gratis',
        trialDays: 0,
        tagline: 'Sin membresia',
        features: [
            'Perfil basico en la plataforma',
            'Acceso a recursos publicos',
        ],
    },
    1: {
        level: 1,
        label: 'Nivel 1 - Comunidad y Crecimiento',
        description: 'Conexion con colegas, aprendizaje continuo y acceso a recursos base para la practica.',
        price: 290,
        priceLabel: '$290/mes',
        trialDays: 0,
        tagline: 'Educacion y comunidad',
        features: getPricingFeatureTitles(LEVEL_1_FEATURE_IDS),
    },
    2: {
        level: 2,
        label: 'Nivel 2 - Consultorio Digital',
        description: 'Digitalizacion completa, automatizacion de procesos y optimizacion de la gestion clinica.',
        price: 680,
        priceLabel: '$680/mes',
        trialDays: 0,
        tagline: 'Psicologia clinica',
        features: getPricingFeatureTitles(LEVEL_2_EXCLUSIVE_FEATURE_IDS),
    },
    3: {
        level: 3,
        label: 'Nivel 3 - Gestion y Marketing Premium',
        description: 'Crecimiento acelerado, delegacion de tareas y posicionamiento de marca de alto impacto.',
        price: 3800,
        priceLabel: '$3,800/mes',
        trialDays: 0,
        tagline: 'Escala y delegacion',
        features: getPricingFeatureTitles(LEVEL_3_EXCLUSIVE_FEATURE_IDS),
    },
}

export const MAX_MEMBERSHIP_LEVEL = Math.max(
    ...Object.keys(MEMBERSHIP_TIERS).map(Number)
)

export function hasMinimumLevel(userLevel: number, requiredLevel: number): boolean {
    return userLevel >= requiredLevel
}

export function getMembershipLabel(level: number): string {
    return MEMBERSHIP_TIERS[level]?.label ?? `Nivel ${level}`
}

export function getMembershipDescription(level: number): string {
    return MEMBERSHIP_TIERS[level]?.description ?? `Nivel de membresia ${level}`
}

export function getMembershipPrice(level: number): number {
    return MEMBERSHIP_TIERS[level]?.price ?? 0
}

export function getMembershipPriceLabel(level: number): string {
    return MEMBERSHIP_TIERS[level]?.priceLabel ?? 'Gratis'
}

export function getMembershipTier(level: number): MembershipTierConfig {
    return MEMBERSHIP_TIERS[level] ?? MEMBERSHIP_TIERS[0]
}

export function getAllFeaturesUpToLevel(level: number): string[] {
    const features: string[] = []
    for (let i = 0; i <= level; i++) {
        const tier = MEMBERSHIP_TIERS[i]
        if (tier) {
            features.push(...tier.features)
        }
    }
    return [...new Set(features)]
}

export function getAllTierLevels(): number[] {
    return Object.keys(MEMBERSHIP_TIERS).map(Number).sort((a, b) => a - b)
}

export function hasTrial(level: number): boolean {
    return (MEMBERSHIP_TIERS[level]?.trialDays ?? 0) > 0
}

export function getTrialDays(level: number): number {
    return MEMBERSHIP_TIERS[level]?.trialDays ?? 0
}

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
        label: 'Nivel 1 - Comunidad',
        description: 'Acceso base a comunidad, cursos y educacion continua.',
        price: 190,
        priceLabel: '$190/mes',
        trialDays: 0,
        tagline: 'Comunidad y Educacion',
        features: [
            'Acceso a la comunidad',
            'Educacion continua',
            'Materiales psicoterapeuticos',
            'Sesiones en vivo y grabadas',
            'Eventos de negocio para psicologos',
            'Newsletter mensual',
            'Convenios exclusivos en eventos',
            'Certificaciones curriculares',
        ],
    },
    2: {
        level: 2,
        label: 'Nivel 2 - Especializacion',
        description: 'Upgrade por especializacion. Hoy disponible: Clinica.',
        price: 680,
        priceLabel: '$680/mes',
        trialDays: 0,
        tagline: 'Especializacion',
        features: [
            'Supervision clinica grupal',
            'Red de derivacion clinica',
            'Agenda online 24/7',
            'Plataforma de interaccion con pacientes',
            'Integracion con WhatsApp y redes sociales',
            'Transcripcion de sesiones con IA',
        ],
    },
    3: {
        level: 3,
        label: 'Nivel 3 - Avanzado',
        description: 'Nivel premium desbloqueado despues del Nivel 2 segun especializacion.',
        price: 3800,
        priceLabel: '$3,800/mes',
        trialDays: 0,
        tagline: 'Escala y delegacion',
        features: [
            'Community Manager personal',
            'Creacion y edicion de contenido',
            'Campanas en Ads (FB/IG)',
            'Presupuesto para publicidad incluido',
            'Auditoria mensual de rendimiento',
            'Asistente personal',
            'Optimizacion de Google My Business',
            'SEO y posicionamiento local',
        ],
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


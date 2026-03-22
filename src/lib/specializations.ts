export type SpecializationStatus = 'active' | 'coming_soon' | 'hidden'

export type SpecializationCode =
    | 'clinica'
    | 'forense'
    | 'educacion'
    | 'organizacional'
    | 'infanto_juvenil'
    | 'neuropsicologia'
    | 'deportiva'
    | 'sexologia_clinica'
    | 'psicogerontologia'

export interface SpecializationConfig {
    code: SpecializationCode
    name: string
    slug: string
    status: SpecializationStatus
    level2PriceMonthly: number | null
    includesSoftware: boolean
    includesEvents: boolean
    level3Available: boolean
    benefits: string[]
}

/**
 * Single source of truth for specialization catalog.
 * Keep only Clinica active for now. Others are visible as coming soon.
 */
export const SPECIALIZATION_CATALOG: Record<SpecializationCode, SpecializationConfig> = {
    clinica: {
        code: 'clinica',
        name: 'Clinica',
        slug: 'psicologia-clinica',
        status: 'active',
        level2PriceMonthly: 680,
        includesSoftware: true,
        includesEvents: true,
        level3Available: true,
        benefits: [
            'Supervision clinica grupal',
            'Red de derivacion clinica',
            'Agenda online 24/7',
            'Plataforma de interaccion con pacientes',
            'Integracion con WhatsApp y redes sociales',
            'Transcripcion de sesiones con IA',
        ],
    },
    forense: {
        code: 'forense',
        name: 'Forense',
        slug: 'psicologia-forense',
        status: 'coming_soon',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: false,
        level3Available: false,
        benefits: ['En diseno', 'Precio por definir'],
    },
    educacion: {
        code: 'educacion',
        name: 'Educacion / Escolar',
        slug: 'psicologia-educativa',
        status: 'coming_soon',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: false,
        level3Available: false,
        benefits: ['En diseno', 'Precio por definir'],
    },
    organizacional: {
        code: 'organizacional',
        name: 'Organizacional / Laboral',
        slug: 'psicologia-organizacional',
        status: 'coming_soon',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: false,
        level3Available: false,
        benefits: ['En diseno', 'Precio por definir'],
    },
    infanto_juvenil: {
        code: 'infanto_juvenil',
        name: 'Infanto-Juvenil',
        slug: 'psicologia-infantil',
        status: 'coming_soon',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: false,
        level3Available: false,
        benefits: ['En diseno', 'Precio por definir'],
    },
    neuropsicologia: {
        code: 'neuropsicologia',
        name: 'Neuropsicologia',
        slug: 'neuropsicologia',
        status: 'coming_soon',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: false,
        level3Available: false,
        benefits: ['En diseno', 'Precio por definir'],
    },
    deportiva: {
        code: 'deportiva',
        name: 'Deportiva',
        slug: 'psicologia-deportiva',
        status: 'coming_soon',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: false,
        level3Available: false,
        benefits: ['En diseno', 'Precio por definir'],
    },
    sexologia_clinica: {
        code: 'sexologia_clinica',
        name: 'Sexologia Clinica',
        slug: 'sexologia-clinica',
        status: 'coming_soon',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: false,
        level3Available: false,
        benefits: ['En diseno', 'Precio por definir'],
    },
    psicogerontologia: {
        code: 'psicogerontologia',
        name: 'Psicogerontologia',
        slug: 'psicogerontologia',
        status: 'coming_soon',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: false,
        level3Available: false,
        benefits: ['En diseno', 'Precio por definir'],
    },
}

export const LEVEL_2_DEFAULT_SPECIALIZATION: SpecializationCode = 'clinica'

export function getSpecializationByCode(code: string | null | undefined): SpecializationConfig | null {
    if (!code) return null
    return SPECIALIZATION_CATALOG[code as SpecializationCode] ?? null
}

export function getVisibleSpecializations(): SpecializationConfig[] {
    return Object.values(SPECIALIZATION_CATALOG).filter((item) => item.status !== 'hidden')
}

export function getActiveSpecializations(): SpecializationConfig[] {
    return Object.values(SPECIALIZATION_CATALOG).filter((item) => item.status === 'active')
}

export function getComingSoonSpecializations(): SpecializationConfig[] {
    return Object.values(SPECIALIZATION_CATALOG).filter((item) => item.status === 'coming_soon')
}

export function isSpecializationActive(code: string | null | undefined): code is SpecializationCode {
    const specialization = getSpecializationByCode(code)
    return !!specialization && specialization.status === 'active'
}

export function canUserSeeLevel3Offer(options: {
    membershipLevel: number
    specializationCode?: string | null
    isAdmin?: boolean
}): boolean {
    if (options.isAdmin) return true
    if (options.membershipLevel >= 3) return true
    if ((options.membershipLevel ?? 0) < 2) return false

    const specialization = getSpecializationByCode(options.specializationCode ?? null)
    return !!specialization && specialization.level3Available
}


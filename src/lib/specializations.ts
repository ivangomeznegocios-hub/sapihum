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
    | 'emergencias'
    | 'comunitaria'
    | 'salud'

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
    tagline: string
    description: string
    icon: string
    tools: string[]
}

/**
 * SAPIHUM — Catálogo completo de 12 especialidades.
 * Todas las especialidades nacen con contenido robusto.
 * Los precios se definen conforme se activan comercialmente.
 */
export const SPECIALIZATION_CATALOG: Record<SpecializationCode, SpecializationConfig> = {
    clinica: {
        code: 'clinica',
        name: 'Psicología Clínica',
        slug: 'psicologia-clinica',
        status: 'active',
        level2PriceMonthly: 680,
        includesSoftware: true,
        includesEvents: true,
        level3Available: true,
        tagline: 'Ciencia aplicada al cuidado de la salud mental',
        description: 'Evaluación, diagnóstico y tratamiento de trastornos psicológicos. Enfoque basado en evidencia para la práctica privada e institucional.',
        icon: '🧠',
        tools: [
            'Software de expedientes clínicos',
            'Supervisión grupal',
            'Agenda inteligente',
            'Transcripción IA',
            'Red de derivación',
        ],
        benefits: [
            'Expedientes NOM-004 con firma electrónica',
            'Protocolos de evaluación estandarizados (BDI-II, GAD-7, PHQ-9)',
            'Supervisión clínica grupal quincenal',
            'Red de derivación clínica verificada',
            'Agenda online 24/7 con recordatorios automáticos',
            'Transcripción de sesiones con IA',
            'Seguimiento de evolución clínica con gráficas',
            'Integración con WhatsApp y redes sociales',
        ],
    },
    neuropsicologia: {
        code: 'neuropsicologia',
        name: 'Neuropsicología',
        slug: 'neuropsicologia',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: true,
        includesEvents: true,
        level3Available: false,
        tagline: 'Donde la neurociencia y la clínica convergen',
        description: 'Evaluación de funciones cognitivas, planificación de rehabilitación neuropsicológica y generación de informes especializados.',
        icon: '🔬',
        tools: [
            'Plantillas de evaluación neuropsicológica',
            'Banco de pruebas',
            'Protocolos de rehabilitación',
            'Informes automatizados',
        ],
        benefits: [
            'Perfiles cognitivos digitales completos',
            'Comparación normativa integrada por población',
            'Seguimiento longitudinal de rehabilitación',
            'Reportes para equipos interdisciplinarios',
            'Banco de baterías neuropsicológicas',
            'Protocolos de estimulación cognitiva',
        ],
    },
    forense: {
        code: 'forense',
        name: 'Psicología Forense',
        slug: 'psicologia-forense',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: true,
        level3Available: false,
        tagline: 'Rigor científico al servicio de la justicia',
        description: 'Peritajes psicológicos, evaluación de credibilidad testimonial, análisis de custodia y valoración de riesgo.',
        icon: '⚖️',
        tools: [
            'Plantillas periciales',
            'Protocolos de entrevista forense',
            'Formatos legales',
            'Cadena de custodia documental',
        ],
        benefits: [
            'Dictámenes con estructura jurídica válida',
            'Protocolos SATAC/NICHD integrados',
            'Banco de instrumentos forenses',
            'Trazabilidad documental completa',
            'Formación en técnicas de entrevista forense',
            'Red de peritos verificados',
        ],
    },
    organizacional: {
        code: 'organizacional',
        name: 'Psicología Organizacional',
        slug: 'psicologia-organizacional',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: true,
        level3Available: false,
        tagline: 'Potencia el capital humano con ciencia del comportamiento',
        description: 'Diagnóstico organizacional, gestión del talento, clima laboral, NOM-035 y desarrollo de liderazgo.',
        icon: '🏢',
        tools: [
            'Diagnóstico NOM-035',
            'Evaluaciones de clima',
            'Assessment center',
            'Programas de bienestar laboral',
        ],
        benefits: [
            'Cumplimiento NOM-035-STPS automatizado',
            'Dashboards de clima organizacional',
            'Evaluación 360° digital',
            'Diseño de programas de salud ocupacional',
            'Consultoría en desarrollo de liderazgo',
            'Indicadores de bienestar laboral',
        ],
    },
    infanto_juvenil: {
        code: 'infanto_juvenil',
        name: 'Psicología Infantojuvenil',
        slug: 'psicologia-infantojuvenil',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: true,
        includesEvents: true,
        level3Available: false,
        tagline: 'Desarrollo saludable desde la primera infancia',
        description: 'Evaluación del desarrollo, intervención en problemas conductuales, emocionales y de aprendizaje en niños y adolescentes.',
        icon: '👶',
        tools: [
            'Protocolos de evaluación por edad',
            'Juego terapéutico',
            'Escuela para padres',
            'Colaboración con escuelas',
        ],
        benefits: [
            'Historias clínicas pediátricas especializadas',
            'Escalas de desarrollo (Bayley, WISC, Conners)',
            'Fichas de seguimiento escolar',
            'Material psicoeducativo para familias',
            'Protocolos de intervención por edad',
            'Red de derivación pediátrica',
        ],
    },
    educacion: {
        code: 'educacion',
        name: 'Psicología Educativa',
        slug: 'psicologia-educativa',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: true,
        level3Available: false,
        tagline: 'Transformando contextos de aprendizaje',
        description: 'Orientación educativa, detección de NEE, diseño de programas de inclusión y asesoría a instituciones.',
        icon: '📖',
        tools: [
            'Evaluación psicopedagógica',
            'Diseño de adecuaciones curriculares',
            'Programas de inclusión',
            'Asesoría institucional',
        ],
        benefits: [
            'Informes psicopedagógicos estructurados',
            'Protocolos de detección temprana de NEE',
            'Planes de intervención personalizados',
            'Métricas de seguimiento escolar',
            'Capacitación a docentes',
            'Programas de inclusión educativa',
        ],
    },
    psicogerontologia: {
        code: 'psicogerontologia',
        name: 'Psicogerontología',
        slug: 'psicogerontologia',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: true,
        includesEvents: true,
        level3Available: false,
        tagline: 'Dignificando el envejecimiento desde la ciencia',
        description: 'Evaluación cognitiva del adulto mayor, detección de deterioro, intervención en demencias y programas de estimulación cognitiva.',
        icon: '🧓',
        tools: [
            'Evaluación geriátrica integral',
            'Protocolos de estimulación cognitiva',
            'Psicoeducación a cuidadores',
            'Planificación del cuidado',
        ],
        benefits: [
            'Tamizaje con MoCA/MMSE digitalizado',
            'Programas de activación cognitiva estructurados',
            'Apoyo al cuidador primario',
            'Trabajo interdisciplinario con geriatras',
            'Protocolos de intervención en demencias',
            'Seguimiento longitudinal de deterioro cognitivo',
        ],
    },
    deportiva: {
        code: 'deportiva',
        name: 'Psicología Deportiva',
        slug: 'psicologia-deportiva',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: true,
        level3Available: false,
        tagline: 'Rendimiento mental para atletas de alto impacto',
        description: 'Entrenamiento mental, manejo de ansiedad competitiva, resiliencia deportiva y rehabilitación psicológica post-lesión.',
        icon: '🏅',
        tools: [
            'Planes de entrenamiento mental',
            'Evaluación psicodeportiva',
            'Visualización y mindfulness deportivo',
            'Cohesión de equipo',
        ],
        benefits: [
            'Perfiles psicodeportivos individuales',
            'Protocolos de mentalización pre-competencia',
            'Programas de regreso post-lesión',
            'Evaluación de burnout deportivo',
            'Técnicas de visualización guiada',
            'Consultoría para equipos y federaciones',
        ],
    },
    sexologia_clinica: {
        code: 'sexologia_clinica',
        name: 'Sexología Clínica',
        slug: 'sexologia-clinica',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: true,
        level3Available: false,
        tagline: 'Salud sexual integral con enfoque científico',
        description: 'Evaluación y tratamiento de disfunciones sexuales, educación sexual, abordaje de diversidad sexual y terapia de pareja con enfoque sexológico.',
        icon: '💜',
        tools: [
            'Protocolos de evaluación sexológica',
            'Técnicas terapéuticas especializadas',
            'Material psicoeducativo',
            'Formación continua',
        ],
        benefits: [
            'Historias sexológicas estructuradas',
            'Escalas de función sexual (IIEF, FSFI)',
            'Guías de psicoeducación por temática',
            'Enfoque de género e inclusión',
            'Intervención en disfunciones sexuales',
            'Terapia de pareja sexológica',
        ],
    },
    emergencias: {
        code: 'emergencias',
        name: 'Emergencias y Desastres',
        slug: 'psicologia-emergencias',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: true,
        level3Available: false,
        tagline: 'Primera respuesta psicológica en tiempos de crisis',
        description: 'Primeros auxilios psicológicos, intervención en crisis, debriefing, TEPT y programas de resiliencia comunitaria.',
        icon: '🚨',
        tools: [
            'Protocolos PAP (Primeros Auxilios Psicológicos)',
            'Guías de intervención en crisis',
            'Evaluación de TEPT',
            'Programas de resiliencia',
        ],
        benefits: [
            'Manual de actuación en campo',
            'Protocolos OMS/IASC integrados',
            'Kits de intervención rápida',
            'Redes de respuesta coordinada',
            'Formación en debriefing psicológico',
            'Certificación en PAP',
        ],
    },
    comunitaria: {
        code: 'comunitaria',
        name: 'Psicología Comunitaria',
        slug: 'psicologia-comunitaria',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: false,
        includesEvents: true,
        level3Available: false,
        tagline: 'Impacto colectivo, transformación social',
        description: 'Diagnóstico participativo, desarrollo comunitario, prevención de violencia, programas de promoción de salud mental a nivel poblacional.',
        icon: '🤝',
        tools: [
            'Metodologías de investigación-acción',
            'Diagnóstico comunitario',
            'Diseño de programas preventivos',
            'Evaluación de impacto social',
        ],
        benefits: [
            'Herramientas de mapeo social',
            'Marcos de evaluación participativa',
            'Indicadores de impacto comunitario',
            'Diseño de política pública en salud mental',
            'Programas de prevención de violencia',
            'Redes de agentes comunitarios',
        ],
    },
    salud: {
        code: 'salud',
        name: 'Psicología de la Salud',
        slug: 'psicologia-salud',
        status: 'active',
        level2PriceMonthly: null,
        includesSoftware: true,
        includesEvents: true,
        level3Available: false,
        tagline: 'El vínculo entre mente, cuerpo y bienestar',
        description: 'Psicooncología, manejo del dolor crónico, adherencia terapéutica, intervención en enfermedades crónico-degenerativas y cuidados paliativos.',
        icon: '🏥',
        tools: [
            'Protocolos de evaluación psicológica hospitalaria',
            'Técnicas de manejo del dolor',
            'Programas de adherencia',
            'Intervención en cuidados paliativos',
        ],
        benefits: [
            'Coordinación con equipos médicos',
            'Escalas de calidad de vida (SF-36, WHOQOL)',
            'Programas de modificación de conductas de salud',
            'Protocolos de atención integral',
            'Intervención en psicooncología',
            'Manejo del dolor crónico basado en evidencia',
        ],
    },
}

export const LEVEL_2_DEFAULT_SPECIALIZATION: SpecializationCode = 'clinica'

export const MARKETING_SPECIALIZATION_CODES = [
    'clinica',
    'neuropsicologia',
    'forense',
    'organizacional',
    'educacion',
    'psicogerontologia',
    'deportiva',
    'sexologia_clinica',
] as const

export const MEMBERSHIP_SPECIALIZATION_CODES = [
    'clinica',
    'forense',
    'educacion',
    'organizacional',
    'infanto_juvenil',
    'neuropsicologia',
    'deportiva',
    'sexologia_clinica',
    'psicogerontologia',
] as const

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

export function getMembershipSpecializations(): SpecializationConfig[] {
    return MEMBERSHIP_SPECIALIZATION_CODES
        .map((code) => SPECIALIZATION_CATALOG[code])
        .filter(Boolean)
}

export function getMarketingSpecializations(): SpecializationConfig[] {
    return MARKETING_SPECIALIZATION_CODES
        .map((code) => SPECIALIZATION_CATALOG[code])
        .filter(Boolean)
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

const SPECIALIZATION_SLUG_ALIASES: Record<string, SpecializationCode> = {
    'psicologia-infantil': 'infanto_juvenil',
    'adulto-mayor': 'psicogerontologia',
}

export function getCanonicalSpecializationSlug(slug: string): string {
    const specialization =
        Object.values(SPECIALIZATION_CATALOG).find((spec) => spec.slug === slug) ??
        getSpecializationByCode(SPECIALIZATION_SLUG_ALIASES[slug])

    return specialization?.slug ?? slug
}

export function getSpecializationBySlug(slug: string): SpecializationConfig | null {
    const canonicalSlug = getCanonicalSpecializationSlug(slug)
    return Object.values(SPECIALIZATION_CATALOG).find(spec => spec.slug === canonicalSlug) ?? null
}

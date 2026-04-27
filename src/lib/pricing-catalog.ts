export type PricingPlanKey = 'level1' | 'level2' | 'level3'

export interface PricingFeatureDefinition {
    id: string
    title: string
    description: string
    details: string
    group: PricingPlanKey
    availability: Record<PricingPlanKey, boolean>
    showInComparison?: boolean
}

export const PRICING_GROUP_LABELS: Record<PricingPlanKey, string> = {
    level1: 'Membresía',
    level2: 'Consultorio Digital',
    level3: 'Gestión y Marketing Premium',
}

export const PRICING_PLAN_COPY = {
    level1: {
        levelLabel: 'Membresía Base',
        eyebrow: 'Educación y comunidad',
        title: 'Membresía',
        description:
            'Enfocado en la conexión con colegas, el aprendizaje continuo y el acceso a recursos básicos para la práctica.',
        badge: null,
        cta: {
            guest: 'Unirse a la comunidad',
            member: 'Gestionar en mi cuenta',
        },
        note: 'Ideal para mantenerte cerca de la comunidad, la formación y los recursos base.',
    },
    level2: {
        levelLabel: 'Expansión · Consultorio',
        eyebrow: 'Psicología clínica',
        title: 'Consultorio Digital',
        description:
            'Enfocado en la digitalización completa, automatización de procesos y optimización de la gestión clínica.',
        badge: 'Software incluido',
        cta: {
            guest: 'Activar Consultorio Digital',
            member: 'Subir desde mi cuenta',
        },
        note: 'Incluye toda la Membresía más software, automatización y soporte para operar tu consulta.',
    },
    level3: {
        levelLabel: 'Expansión · Marketing',
        eyebrow: 'Escala y delegación',
        title: 'Gestión y Marketing Premium',
        description:
            'Enfocado en el crecimiento acelerado, delegación de tareas y posicionamiento de marca de alto impacto.',
        badge: null,
        cta: {
            guest: 'Explorar el plan',
            member: 'Activar Expansión',
        },
        note: 'Incluye todo Consultorio Digital y suma acompañamiento operativo, marketing y posicionamiento.',
    },
} as const

export const PRICING_FEATURES: PricingFeatureDefinition[] = [
    {
        id: 'acceso-comunidad',
        title: 'Acceso a la Comunidad',
        description: 'Networking y apoyo mutuo.',
        details:
            'Es un espacio de networking donde puedes interactuar con otros psicólogos, compartir experiencias clínicas o profesionales y participar en sesiones grupales de apoyo mutuo.',
        group: 'level1',
        availability: { level1: true, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'educacion-continua',
        title: 'Educación Continua',
        description: 'Formación constante.',
        details:
            'Acceso a una escuela de formación constante. Incluye talleres y actualizaciones sobre temas clínicos vigentes para que tu práctica siempre esté a la vanguardia académica.',
        group: 'level1',
        availability: { level1: true, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'materiales-psicoterapeuticos',
        title: 'Materiales Psicoterapéuticos',
        description: 'Biblioteca de herramientas clínicas.',
        details:
            'Una biblioteca completa de herramientas clínicas, incluyendo templates, cuestionarios, evaluaciones y protocolos. Estos recursos son interactivos y digitales, diseñados para ser usados tanto por el profesional como por el paciente.',
        group: 'level1',
        availability: { level1: true, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'red-profesionales',
        title: 'Red de Profesionales',
        description: 'Networking especializado.',
        details:
            'Un espacio de networking de alto valor especializado para realizar seguimientos de casos y consultas profesionales entre pares.',
        group: 'level1',
        availability: { level1: true, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'sesiones-vivo',
        title: 'Sesiones en Vivo y Grabadas',
        description: 'Clases y talleres en tiempo real.',
        details:
            'Participación en clases y talleres en tiempo real. Si no puedes asistir, las grabaciones quedan disponibles por 15 días para que puedas verlas a tu ritmo.',
        group: 'level1',
        availability: { level1: true, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'eventos-negocio',
        title: 'Eventos de Negocio para Psicólogos',
        description: 'Gestión y rentabilidad.',
        details:
            'Encuentros diseñados específicamente para enseñarte a gestionar tu consultorio como un negocio, con el objetivo de mejorar tu rentabilidad e ingresos.',
        group: 'level1',
        availability: { level1: true, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'newsletter',
        title: 'Newsletter Mensual',
        description: 'Boletín informativo.',
        details:
            'Un boletín informativo que llega a tu correo con artículos técnicos, consejos prácticos, oportunidades laborales y noticias relevantes del sector.',
        group: 'level1',
        availability: { level1: true, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'convenios-eventos',
        title: 'Convenios Exclusivos en Eventos',
        description: 'Descuentos especiales.',
        details:
            'Acceso a descuentos especiales en congresos, ferias y talleres de la industria de la salud mental, facilitando tu asistencia a eventos presenciales.',
        group: 'level1',
        availability: { level1: true, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'certificaciones',
        title: 'Certificaciones Curriculares',
        description: 'Robustece tu currículum.',
        details:
            'Algunos eventos y talleres incluyen certificados de participación o certificaciones oficiales. En algunos casos pueden tener un costo adicional, pero fortalecen tu currículum profesional.',
        group: 'level1',
        availability: { level1: true, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'todo-nivel-1',
        title: 'Todo de la Membresía',
        description: 'Incluye todos los beneficios de la membresía.',
        details:
            'Acceso a comunidad, educación continua, materiales, red de profesionales, sesiones en vivo, eventos de negocio, newsletter, convenios y certificaciones.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: false,
    },
    {
        id: 'supervision-clinica',
        title: 'Supervisión Clínica Grupal',
        description: 'Feedback de expertos.',
        details:
            'Sesiones mensuales dirigidas por supervisores expertos. Es un espacio seguro para discutir casos difíciles, recibir feedback y asegurar la calidad ética y profesional de tu atención.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'red-derivacion',
        title: 'Red de Derivación Clínica',
        description: 'Networking ético para referencias.',
        details:
            'Acceso a un directorio exclusivo para referir pacientes que están fuera de tu área de expertise a colegas de confianza, y viceversa. Esto fomenta el crecimiento a través del networking ético.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'pagina-web',
        title: 'Página Web Profesional',
        description: 'Presencia digital integrada.',
        details:
            'Incluye el diseño profesional, el hosting y el subdominio. Es el centro de tu presencia digital donde se integran todos los sistemas de gestión.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'agenda-online',
        title: 'Agenda Online 24/7',
        description: 'Sistema automatizado de citas.',
        details:
            'Sistema automatizado donde los pacientes pueden ver tu disponibilidad y agendar citas en cualquier momento. Incluye recordatorios automáticos para reducir el ausentismo y gestión de cancelaciones.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'plataforma-interaccion',
        title: 'Plataforma de Interacción con Pacientes',
        description: 'Gestión clínica segura.',
        details:
            'Un software de gestión clínica donde puedes llevar el historial de sesiones, enviar tareas, tests o documentos de forma segura, manteniendo una comunicación fluida entre sesiones.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'kit-legal',
        title: 'Kit Legal Completo',
        description: 'Cumplimiento normativo.',
        details:
            'Documentación lista para usar que cumple con la normativa legal, incluyendo aviso de privacidad, términos de servicio, política de datos y consentimiento informado.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'multiples-pagos',
        title: 'Múltiples Formas de Pago',
        description: 'Transacciones automáticas.',
        details:
            'Integración para aceptar tarjetas de crédito, débito, transferencias y billeteras digitales, con reportes automáticos de tus transacciones.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'dashboard-financiero',
        title: 'Dashboard Financiero Básico',
        description: 'Control de finanzas en tiempo real.',
        details:
            'Una herramienta para el control de tus finanzas en tiempo real. Permite ver ingresos, gastos, número de clientes activos y proyecciones mensuales de forma automática.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'soporte-cliente',
        title: 'Soporte de Servicio al Cliente',
        description: 'Atención técnica personalizada.',
        details:
            'Atención técnica personalizada vía chat, WhatsApp, email o web de lunes a viernes para resolver cualquier inconveniente con la plataforma.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'integracion-redes',
        title: 'Integración con WhatsApp y Redes Sociales',
        description: 'Contacto a un solo clic.',
        details:
            'Conecta tu sitio web directamente con tus botones de WhatsApp, Facebook e Instagram para que los pacientes te contacten con un solo clic.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'transcripcion-ia',
        title: 'Transcripción de Sesiones y Resúmenes con IA',
        description: 'Notas automatizadas con IA.',
        details:
            'Una función avanzada, tanto para sesiones online como presenciales, que transcribe el audio y genera automáticamente notas, resúmenes de la sesión y recordatorios de pendientes.',
        group: 'level2',
        availability: { level1: false, level2: true, level3: true },
        showInComparison: true,
    },
    {
        id: 'todo-nivel-2',
        title: 'Todo de Consultorio Digital',
        description: 'Incluye todos los beneficios de Consultorio Digital.',
        details:
            'Todo lo de la Membresía más supervisión, red de derivación, página web, agenda, plataforma clínica, kit legal, pagos, dashboard financiero, soporte, integración con redes y transcripción con IA.',
        group: 'level3',
        availability: { level1: false, level2: false, level3: true },
        showInComparison: false,
    },
    {
        id: 'community-manager',
        title: 'Community Manager Personal',
        description: 'Gestión exclusiva de marca.',
        details:
            'Tendrás a un profesional dedicado exclusivamente a gestionar tu presencia online, cuidando tu marca y respondiendo a tu comunidad.',
        group: 'level3',
        availability: { level1: false, level2: false, level3: true },
        showInComparison: true,
    },
    {
        id: 'creacion-contenido',
        title: 'Creación y Edición de Contenido',
        description: 'Publicaciones semanales por expertos.',
        details:
            'Producción de cuatro publicaciones semanales diseñadas por expertos. La estrategia es personalizada según tu especialidad para atraer al público objetivo correcto.',
        group: 'level3',
        availability: { level1: false, level2: false, level3: true },
        showInComparison: true,
    },
    {
        id: 'montaje-campanas',
        title: 'Montaje de Campañas en Ads (FB/IG)',
        description: 'Atracción constante de pacientes.',
        details:
            'Configuración profesional de publicidad pagada en Facebook e Instagram para atraer un flujo constante de nuevos pacientes.',
        group: 'level3',
        availability: { level1: false, level2: false, level3: true },
        showInComparison: true,
    },
    {
        id: 'presupuesto-publicidad',
        title: 'Presupuesto para Publicidad Incluido',
        description: 'Inversión directa en anuncios.',
        details:
            'El plan incluye 500 dólares mensuales de inversión directa en anuncios, gestionados profesionalmente para maximizar el retorno de inversión.',
        group: 'level3',
        availability: { level1: false, level2: false, level3: true },
        showInComparison: true,
    },
    {
        id: 'auditoria-rendimiento',
        title: 'Auditoría Mensual de Rendimiento',
        description: 'Optimización y reportes.',
        details:
            'Revisión detallada mes a mes de tus campañas de publicidad para optimizar gastos, mejorar resultados y presentarte reportes de impacto.',
        group: 'level3',
        availability: { level1: false, level2: false, level3: true },
        showInComparison: true,
    },
    {
        id: 'asistente-personal',
        title: 'Asistente Personal (Perfil Psicólogo)',
        description: 'Apoyo con criterio profesional.',
        details:
            'Un apoyo único: una persona con formación en psicología que te ayuda a contestar mensajes, analizar casos, planificar tu agenda y tareas administrativas con el criterio profesional necesario para tratar con pacientes.',
        group: 'level3',
        availability: { level1: false, level2: false, level3: true },
        showInComparison: true,
    },
    {
        id: 'optimizacion-google',
        title: 'Optimización de Google My Business',
        description: 'Posicionamiento en zona local.',
        details:
            'Configuración de tu ficha en Google Maps con fotos profesionales, descripción optimizada para SEO y gestión estratégica de reseñas para que aparezcas primero en tu zona.',
        group: 'level3',
        availability: { level1: false, level2: false, level3: true },
        showInComparison: true,
    },
    {
        id: 'seo-posicionamiento',
        title: 'SEO y Posicionamiento Local',
        description: 'Búsqueda de primeros resultados.',
        details:
            'Estrategia avanzada para que, cuando alguien busque un psicólogo de tu especialidad en tu ciudad o zona geográfica, tu perfil aparezca en los primeros resultados de búsqueda.',
        group: 'level3',
        availability: { level1: false, level2: false, level3: true },
        showInComparison: true,
    },
] satisfies PricingFeatureDefinition[]

export const PRICING_FEATURES_BY_ID = PRICING_FEATURES.reduce<Record<string, PricingFeatureDefinition>>(
    (acc, feature) => {
        acc[feature.id] = feature
        return acc
    },
    {}
)

export const LEVEL_1_FEATURE_IDS = [
    'acceso-comunidad',
    'educacion-continua',
    'materiales-psicoterapeuticos',
    'red-profesionales',
    'sesiones-vivo',
    'eventos-negocio',
    'newsletter',
    'convenios-eventos',
    'certificaciones',
] as const

export const LEVEL_2_EXCLUSIVE_FEATURE_IDS = [
    'supervision-clinica',
    'red-derivacion',
    'pagina-web',
    'agenda-online',
    'plataforma-interaccion',
    'kit-legal',
    'multiples-pagos',
    'dashboard-financiero',
    'soporte-cliente',
    'integracion-redes',
    'transcripcion-ia',
] as const

export const LEVEL_2_CARD_FEATURE_IDS = ['todo-nivel-1', ...LEVEL_2_EXCLUSIVE_FEATURE_IDS] as const

export const LEVEL_3_EXCLUSIVE_FEATURE_IDS = [
    'community-manager',
    'creacion-contenido',
    'montaje-campanas',
    'presupuesto-publicidad',
    'auditoria-rendimiento',
    'asistente-personal',
    'optimizacion-google',
    'seo-posicionamiento',
] as const

export const LEVEL_3_CARD_FEATURE_IDS = ['todo-nivel-2', ...LEVEL_3_EXCLUSIVE_FEATURE_IDS] as const

export const PRICING_COMPARISON_FEATURES = PRICING_FEATURES.filter(
    (feature) => feature.showInComparison !== false
)

export function getPricingFeature(id: string) {
    return PRICING_FEATURES_BY_ID[id] ?? null
}

export function getPricingFeatureTitles(ids: readonly string[]) {
    return ids
        .map((id) => PRICING_FEATURES_BY_ID[id])
        .filter(Boolean)
        .map((feature) => feature.title)
}

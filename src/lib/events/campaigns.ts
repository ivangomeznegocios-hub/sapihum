import { slugifyCatalogText } from '@/lib/events/public'

export type EventCampaignKey = 'forense' | 'memoria'

type CampaignEventCopy = {
    slug: string
    title: string
    subtitle: string
    heroBadge: string
    problemStatement: string
    idealFor: string[]
    learningOutcomes: string[]
    publicCtaLabel?: string
}

export type EventCampaignConfig = {
    key: EventCampaignKey
    title: string
    promise: string
    summary: string
    formationTrack: string
    leadTag: string
    primaryEventSlug: string
    sourceCampaign: string
    specializationSlugs: string[]
    temario: {
        fileName: string
        title: string
        subtitle: string
        objective: string
        idealFor: string[]
        topics: string[]
        closingLine: string
    }
    events: CampaignEventCopy[]
}

const CAMPAIGNS: Record<EventCampaignKey, EventCampaignConfig> = {
    forense: {
        key: 'forense',
        title: 'Formacion en Psicologia Criminal y Forense',
        promise:
            'Convierte interes en criterio aplicado para leer conducta delictiva, estructurar evaluaciones y comunicar hallazgos con claridad.',
        summary:
            'Tres eventos conectados para psicologos, peritos y profesionales que necesitan herramientas utiles para analisis conductual, justicia y perfilacion criminal.',
        formationTrack: 'Psicologia Criminal y Forense',
        leadTag: 'lead_forense',
        primaryEventSlug: 'psicologia-criminal-y-analisis-de-la-conducta-delictiva',
        sourceCampaign: 'psicologia-criminal-y-forense',
        specializationSlugs: ['psicologia-forense'],
        temario: {
            fileName: 'temario-psicologia-criminal-y-forense',
            title: 'Temario del bloque de Psicologia Criminal y Forense',
            subtitle:
                'Una ruta breve para entender conducta delictiva, psicologia forense y perfilacion con enfoque aplicado.',
            objective:
                'Ayudarte a diferenciar cada area, ver como se conectan y detectar en que evento te conviene entrar primero segun tu practica.',
            idealFor: [
                'Psicologos que quieren incursionar en analisis criminal o peritaje.',
                'Profesionales que ya colaboran con sistema de justicia y necesitan mayor estructura tecnica.',
                'Colegas que buscan una ruta formativa clara antes de invertir en una especializacion mas profunda.',
            ],
            topics: [
                'Bases para analizar conducta delictiva con criterio psicologico.',
                'Aplicacion de la psicologia forense dentro del sistema de justicia.',
                'Principios de perfilacion criminal y limites de interpretacion.',
                'Errores frecuentes al evaluar riesgo, credibilidad o conducta.',
                'Proximo paso recomendado dentro de la agenda activa de SAPIHUM.',
            ],
            closingLine:
                'Al final del bloque tendras una vista mas clara para intervenir, evaluar y comunicar hallazgos en contextos criminales y forenses.',
        },
        events: [
            {
                slug: 'psicologia-criminal-y-analisis-de-la-conducta-delictiva',
                title: 'Psicologia Criminal y Analisis de la Conducta Delictiva',
                subtitle:
                    'Aprende a leer patrones de conducta delictiva y convertirlos en hipotesis utiles para prevencion, evaluacion y toma de decisiones.',
                heroBadge: 'Ruta criminal y forense',
                problemStatement:
                    'Cuando un caso involucra violencia, riesgo o reincidencia, improvisar la lectura conductual cuesta precision. Este evento te da un marco mas claro para interpretar sin caer en intuiciones superficiales.',
                idealFor: [
                    'Psicologos clinicos o juridicos que quieren entender mejor la conducta delictiva.',
                    'Profesionales que trabajan con valoracion de riesgo, violencia o prevencion.',
                    'Estudiantes avanzados y peritos que buscan una entrada mas aplicada a esta rama.',
                ],
                learningOutcomes: [
                    'Diferenciar factores personales, situacionales y contextuales en la conducta delictiva.',
                    'Construir una lectura inicial de patrones conductuales con base psicologica.',
                    'Reconocer que preguntas orientan mejor una evaluacion criminal temprana.',
                ],
                publicCtaLabel: 'Inscribirme ahora',
            },
            {
                slug: 'psicologia-forense-aplicada-al-sistema-de-justicia',
                title: 'Psicologia Forense Aplicada al Sistema de Justicia',
                subtitle:
                    'Aterriza la psicologia forense al sistema de justicia con criterios que te ayuden a evaluar, argumentar y presentar hallazgos con mayor solidez.',
                heroBadge: 'Aplicacion al sistema de justicia',
                problemStatement:
                    'Saber psicologia no basta cuando el caso entra a un proceso juridico. Necesitas traducir hallazgos a un lenguaje util, defendible y alineado con el contexto legal.',
                idealFor: [
                    'Psicologos que elaboran o revisan dictamenes y peritajes.',
                    'Profesionales que colaboran con abogados, juzgados o fiscalias.',
                    'Colegas que quieren reducir errores al presentar evaluaciones en escenarios juridicos.',
                ],
                learningOutcomes: [
                    'Entender mejor el lugar de la psicologia forense dentro del sistema de justicia.',
                    'Identificar criterios para una evaluacion mas clara, util y defendible.',
                    'Detectar errores frecuentes al comunicar hallazgos en procesos legales.',
                ],
                publicCtaLabel: 'Inscribirme ahora',
            },
            {
                slug: 'perfilacion-criminal-y-analisis-de-la-conducta-del-delincuente',
                title: 'Perfilacion Criminal y Analisis de la Conducta del Delincuente',
                subtitle:
                    'Descubre como estructurar perfiles conductuales con bases psicologicas y evitar conclusiones rapidas en casos complejos.',
                heroBadge: 'Perfilacion con criterio',
                problemStatement:
                    'La perfilacion suele malinterpretarse como intuicion o especulacion. Este evento la baja a un terreno mas util: patrones, limites y decisiones mejor argumentadas.',
                idealFor: [
                    'Psicologos interesados en perfilacion y analisis de conducta del delincuente.',
                    'Profesionales de justicia, criminologia o seguridad con enfoque conductual.',
                    'Colegas que quieren conectar teoria criminal con observacion psicologica aplicada.',
                ],
                learningOutcomes: [
                    'Ubicar que puede y que no puede resolver una perfilacion criminal.',
                    'Ordenar variables conductuales para una lectura mas rigurosa del caso.',
                    'Traducir observaciones complejas en hipotesis de trabajo mas accionables.',
                ],
                publicCtaLabel: 'Inscribirme ahora',
            },
        ],
    },
    memoria: {
        key: 'memoria',
        title: 'Formacion en Memoria, Envejecimiento y Deterioro Cognitivo',
        promise:
            'Distingue cambios esperables del envejecimiento de señales de alerta y aprende a acompanar con mas criterio clinico y humano.',
        summary:
            'Dos eventos practicos para profesionales, cuidadores y equipos que atienden a adultos mayores y quieren actuar con mas claridad ante cambios de memoria y deterioro cognitivo.',
        formationTrack: 'Memoria, Envejecimiento y Deterioro Cognitivo',
        leadTag: 'lead_neuro',
        primaryEventSlug: 'cambios-de-memoria-en-la-vejez-senales-normales-y-senales-de-alerta',
        sourceCampaign: 'memoria-envejecimiento-deterioro-cognitivo',
        specializationSlugs: ['psicogerontologia'],
        temario: {
            fileName: 'temario-memoria-envejecimiento-y-deterioro-cognitivo',
            title: 'Temario del bloque de Memoria y Deterioro Cognitivo',
            subtitle:
                'Una guia breve para diferenciar cambios esperables de senales de alerta y acompanar mejor a adultos mayores y familias.',
            objective:
                'Orientarte sobre cuando un cambio de memoria puede observarse con calma y cuando conviene actuar con mayor rapidez o derivacion.',
            idealFor: [
                'Psicologos, neuropsicologos y profesionales de salud que acompanen a adultos mayores.',
                'Cuidadores, coordinadores y equipos interdisciplinarios que necesitan lenguaje claro para actuar.',
                'Colegas que buscan una puerta de entrada practica a la psicogerontologia.',
            ],
            topics: [
                'Cambios de memoria esperables durante el envejecimiento.',
                'Senales de alerta que ameritan observacion mas cercana o derivacion.',
                'Primeros pasos de acompanamiento ante deterioro cognitivo sospechado.',
                'Estrategias de orientacion para familias y cuidadores.',
                'Proximo evento recomendado para profundizar en la ruta activa.',
            ],
            closingLine:
                'Al terminar el bloque tendras un mapa mas claro para detectar, explicar y acompanar procesos cognitivos en la vejez.',
        },
        events: [
            {
                slug: 'cambios-de-memoria-en-la-vejez-senales-normales-y-senales-de-alerta',
                title: 'Cambios de Memoria en la Vejez: Senales Normales y Senales de Alerta',
                subtitle:
                    'Aprende a distinguir entre olvidos esperables y signos que ameritan una observacion mas cuidadosa en adultos mayores.',
                heroBadge: 'Memoria y envejecimiento',
                problemStatement:
                    'No todo olvido en la vejez significa deterioro, pero tampoco todo debe normalizarse. Este evento te ayuda a discriminar mejor para actuar con menos ansiedad y mas criterio.',
                idealFor: [
                    'Psicologos y profesionales que valoran memoria y envejecimiento.',
                    'Equipos que acompanian adultos mayores en consulta, centros o comunidad.',
                    'Cuidadores y orientadores que necesitan criterios mas claros de alerta.',
                ],
                learningOutcomes: [
                    'Distinguir cambios de memoria esperables de senales de riesgo clinico.',
                    'Reconocer indicadores que justifican observacion, seguimiento o derivacion.',
                    'Explicar a familias y cuidadores que observar sin generar alarma innecesaria.',
                ],
                publicCtaLabel: 'Inscribirme ahora',
            },
            {
                slug: 'deterioro-cognitivo-en-la-vejez-guia-practica-para-actuar-y-acompanar',
                title: 'Deterioro Cognitivo en la Vejez: Guia Practica para Actuar y Acompanhar',
                subtitle:
                    'Construye una respuesta mas clara ante sospecha de deterioro cognitivo con pasos utiles para actuar, orientar y acompanar.',
                heroBadge: 'Guia practica de actuacion',
                problemStatement:
                    'Detectar cambios es solo el inicio. Lo dificil suele ser decidir que hacer despues, como orientar a la familia y que acciones priorizar para no dejar pasar tiempo valioso.',
                idealFor: [
                    'Psicologos, neuropsicologos y gerontologos que acompanian procesos cognitivos.',
                    'Profesionales que orientan familias despues de detectar senales de deterioro.',
                    'Equipos que quieren una guia mas practica de accion y acompanamiento.',
                ],
                learningOutcomes: [
                    'Ordenar los primeros pasos despues de detectar posibles senales de deterioro cognitivo.',
                    'Identificar prioridades de acompanamiento para paciente, familia y cuidadores.',
                    'Traducir observaciones clinicas en recomendaciones iniciales mas utiles y humanas.',
                ],
                publicCtaLabel: 'Inscribirme ahora',
            },
        ],
    },
}

type CampaignEventIndex = {
    campaign: EventCampaignConfig
    event: CampaignEventCopy
}

const EVENT_INDEX = Object.values(CAMPAIGNS).reduce<Record<string, CampaignEventIndex>>((acc, campaign) => {
    campaign.events.forEach((event) => {
        acc[event.slug] = { campaign, event }
    })
    return acc
}, {})

function dedupeStrings(values: Array<string | null | undefined>) {
    const seen = new Set<string>()
    const output: string[] = []

    values
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .forEach((value) => {
            const normalized = typeof value === 'string' ? value.trim() : ''
            if (!normalized) return
            if (seen.has(normalized)) return
            seen.add(normalized)
            output.push(normalized)
        })

    return output
}

export function getAllEventCampaigns() {
    return Object.values(CAMPAIGNS)
}

export function getEventCampaignByKey(key: string | null | undefined) {
    if (!key) return null
    return CAMPAIGNS[key as EventCampaignKey] ?? null
}

export function getEventCampaignBySlug(slug: string | null | undefined) {
    if (!slug) return null
    return EVENT_INDEX[slug]?.campaign ?? null
}

export function getEventCampaignEventBySlug(slug: string | null | undefined) {
    if (!slug) return null
    return EVENT_INDEX[slug]?.event ?? null
}

export function getEventCampaignForEvent(event: { slug?: string | null; formation_track?: string | null } | null | undefined) {
    if (!event) return null

    const bySlug = getEventCampaignBySlug(event.slug ?? null)
    if (bySlug) return bySlug

    return (
        getAllEventCampaigns().find((campaign) => campaign.formationTrack === event.formation_track) ??
        null
    )
}

export function applyEventCampaignCopy<T extends Record<string, any>>(event: T): T {
    const indexed = EVENT_INDEX[event?.slug ?? '']
    if (!indexed) return event

    const { campaign, event: campaignEvent } = indexed

    return {
        ...event,
        subtitle: campaignEvent.subtitle,
        hero_badge: campaignEvent.heroBadge,
        formation_track: campaign.formationTrack,
        ideal_for: dedupeStrings([...(campaignEvent.idealFor ?? []), ...((event.ideal_for as string[] | null | undefined) ?? [])]),
        learning_outcomes: dedupeStrings([
            ...(campaignEvent.learningOutcomes ?? []),
            ...((event.learning_outcomes as string[] | null | undefined) ?? []),
        ]),
        public_cta_label: campaignEvent.publicCtaLabel ?? event.public_cta_label ?? null,
        campaign_key: campaign.key,
        campaign_title: campaign.title,
        campaign_promise: campaign.promise,
        campaign_summary: campaign.summary,
        campaign_problem: campaignEvent.problemStatement,
        campaign_lead_tag: campaign.leadTag,
        campaign_temario_asset_key: campaign.key,
    } as T
}

export function getCampaignEventsFromCatalog(events: Array<Record<string, any>>, campaign: EventCampaignConfig) {
    const order = new Map(campaign.events.map((event, index) => [event.slug, index]))

    return events
        .filter((event) => order.has(event.slug))
        .map((event) => applyEventCampaignCopy(event))
        .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99))
}

export function sortCampaignEventsFirst<T extends Record<string, any>>(events: T[]) {
    const priority = new Map(
        getAllEventCampaigns()
            .flatMap((campaign) => campaign.events)
            .map((event, index) => [event.slug, index])
    )

    return [...events].sort((a, b) => {
        const aPriority = priority.has(a.slug) ? priority.get(a.slug)! : Number.POSITIVE_INFINITY
        const bPriority = priority.has(b.slug) ? priority.get(b.slug)! : Number.POSITIVE_INFINITY

        if (aPriority !== bPriority) return aPriority - bPriority
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })
}

export function getCampaignForSpecializationSlug(slug: string | null | undefined) {
    if (!slug) return null
    return getAllEventCampaigns().find((campaign) => campaign.specializationSlugs.includes(slug)) ?? null
}

export function buildCampaignTemarioPath(campaignKey: EventCampaignKey) {
    return `/api/temarios/${campaignKey}`
}

export function getCampaignTrackingName(input: {
    campaign?: EventCampaignConfig | null
    eventSlug?: string | null
    formationTrack?: string | null
}) {
    if (input.campaign?.sourceCampaign) return input.campaign.sourceCampaign
    if (input.formationTrack) return slugifyCatalogText(input.formationTrack)
    return slugifyCatalogText(input.eventSlug || 'evento')
}

export function getCampaignPrimaryEvent(campaign: EventCampaignConfig) {
    return campaign.events.find((event) => event.slug === campaign.primaryEventSlug) ?? campaign.events[0]
}

export function getCampaignPrimaryEventPath(campaign: EventCampaignConfig) {
    const primaryEvent = getCampaignPrimaryEvent(campaign)
    return `/eventos/${primaryEvent.slug}`
}

export function getCampaignEventSlugs() {
    return getAllEventCampaigns().flatMap((campaign) => campaign.events.map((event) => event.slug))
}

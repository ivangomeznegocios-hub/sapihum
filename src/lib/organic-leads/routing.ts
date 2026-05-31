import type { Metadata } from 'next'
import { brandFullName, brandName } from '@/lib/brand'
import { getAppUrl } from '@/lib/config/app-url'
import type { OrganicContentAsset, OrganicSourceType } from './types'

export type OrganicRouteKind =
    | 'guides'
    | 'resources'
    | 'resourceFormats'
    | 'resourceScales'
    | 'authors'
    | 'books'
    | 'approaches'
    | 'tools'
    | 'psychologists'

export interface OrganicRouteConfig {
    kind: OrganicRouteKind
    label: string
    pathPrefix: string
    sourceType: OrganicSourceType
}

export const ORGANIC_ROUTE_CONFIG: Record<OrganicRouteKind, OrganicRouteConfig> = {
    guides: { kind: 'guides', label: 'Guias', pathPrefix: '/guias', sourceType: 'guide' },
    resources: { kind: 'resources', label: 'Recursos', pathPrefix: '/recursos', sourceType: 'resource' },
    resourceFormats: { kind: 'resourceFormats', label: 'Formatos', pathPrefix: '/recursos/formatos', sourceType: 'resource_format' },
    resourceScales: { kind: 'resourceScales', label: 'Escalas', pathPrefix: '/recursos/escalas', sourceType: 'resource_scale' },
    authors: { kind: 'authors', label: 'Autores', pathPrefix: '/autores', sourceType: 'author' },
    books: { kind: 'books', label: 'Libros', pathPrefix: '/libros', sourceType: 'book' },
    approaches: { kind: 'approaches', label: 'Enfoques', pathPrefix: '/enfoques', sourceType: 'approach' },
    tools: { kind: 'tools', label: 'Herramientas', pathPrefix: '/herramientas', sourceType: 'tool' },
    psychologists: { kind: 'psychologists', label: 'Psicologos', pathPrefix: '/psicologos', sourceType: 'psychologist' },
}

const ORGANIC_CONTENT: OrganicContentAsset[] = [
    {
        slug: 'formulacion-de-caso-clinico',
        contentType: 'guide',
        sourceType: 'guide',
        title: 'Formulacion de caso clinico para psicologos',
        description:
            'Una guia base para ordenar hipotesis, factores mantenedores, objetivos y plan de intervencion sin perder criterio clinico.',
        aiSummary:
            'Guia introductoria sobre formulacion de caso clinico para psicologos. Explica como organizar motivo de consulta, factores relevantes, hipotesis y objetivos terapeuticos con un formato descargable.',
        topic: 'formulacion de caso',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Guia clinica',
        ctaLabel: 'Descargar formato de formulacion',
        intent: 'download_resource',
        actionType: 'resource_download',
        interestTags: ['evaluacion_clinica', 'formulacion_caso', 'practica_clinica'],
        publishedAt: '2026-05-29',
        updatedAt: '2026-05-29',
        sections: [
            {
                heading: 'Que debe resolver una formulacion',
                paragraphs: [
                    'Una formulacion util traduce informacion clinica dispersa en una explicacion de trabajo. No sustituye el diagnostico, pero ayuda a decidir por donde intervenir primero.',
                    'El objetivo es integrar antecedentes, disparadores, mantenedores, recursos y riesgos en una hipotesis clara que pueda revisarse conforme avanza el proceso.',
                ],
                bullets: [
                    'Motivo de consulta expresado en lenguaje observable.',
                    'Factores predisponentes, precipitantes y mantenedores.',
                    'Objetivos terapeuticos priorizados.',
                ],
            },
            {
                heading: 'Uso profesional del formato',
                paragraphs: [
                    'El formato descargable esta pensado como punto de partida para psicologos que quieren documentar mejor sus decisiones clinicas.',
                    'Debe adaptarse al modelo terapeutico, al marco legal aplicable y al nivel de riesgo de cada caso.',
                ],
            },
        ],
        faqs: [
            {
                question: 'La formulacion reemplaza el diagnostico?',
                answer: 'No. La formulacion complementa el diagnostico porque organiza hipotesis y decisiones de intervencion.',
            },
            {
                question: 'Puedo usarla con cualquier enfoque?',
                answer: 'Si, como estructura base. Cada enfoque puede ajustar variables, lenguaje y prioridades.',
            },
        ],
        gatedResource: {
            assetKey: 'formulacion-caso-clinico',
            title: 'Formato descargable de formulacion de caso',
            description: 'Plantilla breve para ordenar hipotesis, objetivos y plan inicial.',
            benefits: [
                'Estructura editable para primera formulacion.',
                'Campos para hipotesis, mantenedores y objetivos.',
                'Uso inmediato en supervision o practica privada.',
            ],
            downloadUrl: '/api/organic-resources/formulacion-caso-clinico',
        },
        relatedAssets: [
            { label: 'Especialidad en Evaluacion Clinica', href: '/especialidades/evaluacion-clinica', type: 'specialty' },
            { label: 'Explorar formaciones', href: '/formaciones', type: 'formation' },
            { label: 'Comunidad SAPIHUM', href: '/comunidad', type: 'community' },
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'FAQPage', 'ItemList'],
    },
    {
        slug: 'historia-clinica-psicologica',
        contentType: 'resource_format',
        sourceType: 'resource_format',
        title: 'Formato de historia clinica psicologica',
        description:
            'Preview indexable de un formato para organizar datos iniciales, motivo de consulta, antecedentes y plan de atencion psicologica.',
        aiSummary:
            'Recurso para psicologos sobre historia clinica psicologica. Resume los apartados minimos para documentar una primera entrevista y ofrece una descarga posterior al registro.',
        topic: 'historia clinica',
        specialty: 'evaluacion_clinica',
        heroEyebrow: 'Formato profesional',
        ctaLabel: 'Desbloquear formato',
        intent: 'download_resource',
        actionType: 'resource_download',
        interestTags: ['historia_clinica', 'evaluacion_clinica', 'documentacion_clinica'],
        publishedAt: '2026-05-29',
        updatedAt: '2026-05-29',
        sections: [
            {
                heading: 'Apartados base',
                paragraphs: [
                    'Una historia clinica ordenada permite entender el contexto inicial del consultante sin convertir la entrevista en un interrogatorio rigido.',
                    'El formato separa datos administrativos, motivo de consulta, antecedentes, observaciones clinicas y acuerdos iniciales.',
                ],
                bullets: [
                    'Datos de identificacion y contacto.',
                    'Motivo de consulta y objetivos iniciales.',
                    'Antecedentes relevantes y factores de riesgo.',
                ],
            },
            {
                heading: 'Uso responsable',
                paragraphs: [
                    'El recurso es una base de trabajo. Cada profesional debe adecuarlo a su jurisdiccion, politica de privacidad y tipo de servicio.',
                ],
            },
        ],
        gatedResource: {
            assetKey: 'historia-clinica-psicologica',
            title: 'Formato descargable de historia clinica',
            description: 'Plantilla para entrevista inicial y documentacion basica.',
            benefits: [
                'Preview publico e indexable.',
                'Campos listos para adaptar.',
                'Conecta con rutas de evaluacion clinica y formacion.',
            ],
            downloadUrl: '/api/organic-resources/historia-clinica-psicologica',
        },
        relatedAssets: [
            { label: 'Guia de formulacion de caso', href: '/guias/formulacion-de-caso-clinico', type: 'guide' },
            { label: 'Recursos SAPIHUM', href: '/recursos', type: 'resource' },
            { label: 'Eventos profesionales', href: '/eventos', type: 'event' },
        ],
        schemaTypes: ['Article', 'BreadcrumbList', 'ItemList'],
    },
]

export function getOrganicRouteConfig(kind: OrganicRouteKind) {
    return ORGANIC_ROUTE_CONFIG[kind]
}

export function getOrganicContentByRoute(kind: OrganicRouteKind, slug: string) {
    const config = getOrganicRouteConfig(kind)
    return ORGANIC_CONTENT.find((item) => item.sourceType === config.sourceType && item.slug === slug) ?? null
}

export function getOrganicContentByAssetKey(assetKey: string) {
    return ORGANIC_CONTENT.find((item) => item.gatedResource?.assetKey === assetKey) ?? null
}

export function getOrganicContentForSitemap() {
    return ORGANIC_CONTENT.map((item) => {
        const route = Object.values(ORGANIC_ROUTE_CONFIG).find((config) => config.sourceType === item.sourceType)
        return route ? { content: item, path: `${route.pathPrefix}/${item.slug}` } : null
    }).filter((item): item is { content: OrganicContentAsset; path: string } => Boolean(item))
}

export function getOrganicStaticParams(kind: OrganicRouteKind) {
    const config = getOrganicRouteConfig(kind)
    return ORGANIC_CONTENT
        .filter((item) => item.sourceType === config.sourceType)
        .map((item) => ({ slug: item.slug }))
}

export function buildOrganicPath(kind: OrganicRouteKind, slug: string) {
    const config = getOrganicRouteConfig(kind)
    return `${config.pathPrefix}/${slug}`
}

export function getOrganicNextStepUrl(input: {
    intent?: string | null
    sourceType?: OrganicSourceType | null
    specialty?: string | null
}) {
    if (input.intent === 'attend_event') return '/eventos'
    if (input.intent === 'explore_formation') return '/formaciones'
    if (input.intent === 'evaluate_membership' || input.intent === 'commercial_interest') return '/membresia'
    if (input.specialty) return `/especialidades/${input.specialty.replaceAll('_', '-')}`
    if (input.sourceType === 'resource_format' || input.sourceType === 'resource_scale') return '/recursos'
    return '/comunidad'
}

export function buildOrganicMetadata(kind: OrganicRouteKind, slug: string): Metadata {
    const content = getOrganicContentByRoute(kind, slug)
    if (!content) {
        return {
            title: `Contenido no encontrado | ${brandName}`,
            robots: { index: false, follow: false },
        }
    }

    const canonical = buildOrganicPath(kind, content.slug)

    return {
        title: `${content.title} | ${brandName}`,
        description: content.description,
        alternates: { canonical },
        openGraph: {
            title: content.title,
            description: content.description,
            url: canonical,
            type: 'article',
            siteName: brandFullName,
        },
        twitter: {
            card: 'summary_large_image',
            title: content.title,
            description: content.description,
        },
        robots: {
            index: true,
            follow: true,
        },
    }
}

export function getOrganicAbsoluteUrl(pathname: string) {
    return `${getAppUrl()}${pathname}`
}

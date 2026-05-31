import { getMarketingSpecializations, getMembershipSpecializations } from '@/lib/specializations'
import type { OrganicLeadIntent, OrganicLifecycleStage, OrganicSourceType } from './types'

export const ORGANIC_LEAD_INTENTS = [
    'learn',
    'download_resource',
    'attend_event',
    'explore_formation',
    'join_community',
    'evaluate_membership',
    'commercial_interest',
    'purchase_intent',
] as const satisfies readonly OrganicLeadIntent[]

export const ORGANIC_LIFECYCLE_STAGES = [
    'captured',
    'engaged',
    'qualified',
    'opportunity',
    'converted',
    'discarded',
] as const satisfies readonly OrganicLifecycleStage[]

export const ORGANIC_SOURCE_TYPES = [
    'guide',
    'resource',
    'resource_format',
    'resource_scale',
    'author',
    'book',
    'approach',
    'tool',
    'psychologist',
    'event',
    'formation',
    'specialty',
    'community',
    'academy',
] as const satisfies readonly OrganicSourceType[]

export const ORGANIC_ENTITIES = [
    'eventos',
    'formaciones',
    'recursos',
    'especialidades',
    'autores',
    'libros',
    'comunidad',
    'academia',
] as const

export const ORGANIC_HUBS = [
    { label: 'Guias', href: '/guias', sourceType: 'guide' },
    { label: 'Recursos', href: '/recursos', sourceType: 'resource' },
    { label: 'Formatos', href: '/recursos/formatos', sourceType: 'resource_format' },
    { label: 'Escalas', href: '/recursos/escalas', sourceType: 'resource_scale' },
    { label: 'Autores', href: '/autores', sourceType: 'author' },
    { label: 'Libros', href: '/libros', sourceType: 'book' },
    { label: 'Enfoques', href: '/enfoques', sourceType: 'approach' },
    { label: 'Herramientas', href: '/herramientas', sourceType: 'tool' },
    { label: 'Psicologos', href: '/psicologos', sourceType: 'psychologist' },
] as const

export function getOrganicSpecialtyOptions() {
    const byCode = new Map<string, { code: string; name: string; slug: string }>()

    for (const item of [...getMarketingSpecializations(), ...getMembershipSpecializations()]) {
        byCode.set(item.code, {
            code: item.code,
            name: item.name,
            slug: item.slug,
        })
    }

    return Array.from(byCode.values())
}

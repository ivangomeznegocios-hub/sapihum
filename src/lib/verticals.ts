import type { ContentScope, UserRole, Vertical, VerticalCode, VerticalRole, VerticalSlug } from '@/types/database'

export const DEFAULT_VERTICAL_CODE: VerticalCode = 'psicologia'

export const SAPIHUM_VERTICALS: Record<VerticalCode, Pick<Vertical, 'code' | 'slug' | 'name' | 'status'>> = {
    psicologia: {
        code: 'psicologia',
        slug: 'psicologia',
        name: 'Psicologia',
        status: 'active',
    },
    ciencias_forenses: {
        code: 'ciencias_forenses',
        slug: 'ciencias-forenses',
        name: 'Ciencias Forenses',
        status: 'active',
    },
}

export const SAPIHUM_VERTICAL_CODES = Object.keys(SAPIHUM_VERTICALS) as VerticalCode[]

export function isVerticalCode(value: string | null | undefined): value is VerticalCode {
    return Boolean(value && SAPIHUM_VERTICAL_CODES.includes(value as VerticalCode))
}

export function isVerticalSlug(value: string | null | undefined): value is VerticalSlug {
    if (!value) return false
    return SAPIHUM_VERTICAL_CODES.some((code) => SAPIHUM_VERTICALS[code].slug === value)
}

export function getVerticalCodeFromSlug(slug: string | null | undefined): VerticalCode | null {
    if (!isVerticalSlug(slug)) return null
    return SAPIHUM_VERTICAL_CODES.find((code) => SAPIHUM_VERTICALS[code].slug === slug) ?? null
}

export function normalizeVerticalCode(value: string | null | undefined): VerticalCode | null {
    if (!value) return null
    const normalized = value.trim().toLowerCase().replace(/-/g, '_')
    return isVerticalCode(normalized) ? normalized : null
}

export function getVerticalLabel(code: VerticalCode | null | undefined) {
    return code ? SAPIHUM_VERTICALS[code]?.name ?? code : SAPIHUM_VERTICALS[DEFAULT_VERTICAL_CODE].name
}

export function getDefaultVerticalRole(role: UserRole | null | undefined): VerticalRole {
    if (role === 'admin') return 'admin'
    if (role === 'support') return 'support'
    if (role === 'ponente') return 'instructor'
    return 'member'
}

export function contentBelongsToVertical(
    content: {
        content_scope?: ContentScope | null
        primary_vertical_id?: string | null
    },
    activeVerticalId: string | null | undefined
) {
    const scope = content.content_scope ?? 'vertical'

    if (scope === 'global') return true
    if (!activeVerticalId) return true

    return content.primary_vertical_id === activeVerticalId
}

import type { ContentScope } from '@/types/database'

export type VerticalContentBridge =
    | { table: 'event_verticals'; contentIdColumn: 'event_id' }
    | { table: 'formation_verticals'; contentIdColumn: 'formation_id' }

type VerticalContentRecord = {
    id?: string | null
    content_scope?: ContentScope | null
    primary_vertical_id?: string | null
}

const CONTENT_SCOPES: ContentScope[] = ['global', 'vertical', 'cross_vertical']

function uniqueIds(ids: Array<string | null | undefined>) {
    return Array.from(new Set(ids.filter((id): id is string => Boolean(id))))
}

export function normalizeContentScope(value: unknown): ContentScope {
    return CONTENT_SCOPES.includes(value as ContentScope) ? value as ContentScope : 'vertical'
}

export function resolveVerticalVisibilityInput(params: {
    requestedScope: unknown
    requestedPrimaryVerticalId: unknown
    requestedRelatedVerticalIds: unknown[]
    fallbackPrimaryVerticalId: string | null
    isAdmin: boolean
}) {
    const scope = params.isAdmin ? normalizeContentScope(params.requestedScope) : 'vertical'

    if (scope === 'global') {
        return {
            contentScope: 'global' as ContentScope,
            primaryVerticalId: null,
            relatedVerticalIds: [] as string[],
        }
    }

    const requestedPrimary = typeof params.requestedPrimaryVerticalId === 'string'
        ? params.requestedPrimaryVerticalId
        : null
    const primaryVerticalId = requestedPrimary || params.fallbackPrimaryVerticalId

    if (!primaryVerticalId) {
        return {
            error: 'Selecciona una vertical principal para este contenido.',
        }
    }

    const requestedRelated = params.isAdmin
        ? params.requestedRelatedVerticalIds
            .map((value) => typeof value === 'string' ? value : null)
        : []
    const relatedVerticalIds = uniqueIds([primaryVerticalId, ...requestedRelated])

    return {
        contentScope: scope,
        primaryVerticalId,
        relatedVerticalIds: scope === 'cross_vertical' ? relatedVerticalIds : [primaryVerticalId],
    }
}

export async function getRelatedVerticalIds(
    supabase: any,
    bridge: VerticalContentBridge,
    contentId: string
) {
    const { data, error } = await (supabase
        .from(bridge.table) as any)
        .select('vertical_id')
        .eq(bridge.contentIdColumn, contentId)

    if (error) {
        console.error(`Error fetching ${bridge.table}:`, error.message || error)
        return []
    }

    return uniqueIds((data ?? []).map((row: any) => row.vertical_id))
}

export async function getContentIdsForVertical(
    supabase: any,
    bridge: VerticalContentBridge,
    activeVerticalId: string | null | undefined
) {
    if (!activeVerticalId) return []

    const { data, error } = await (supabase
        .from(bridge.table) as any)
        .select(bridge.contentIdColumn)
        .eq('vertical_id', activeVerticalId)

    if (error) {
        console.error(`Error filtering ${bridge.table}:`, error.message || error)
        return []
    }

    return uniqueIds((data ?? []).map((row: any) => row[bridge.contentIdColumn]))
}

export async function applyVerticalContentFilter(
    supabase: any,
    query: any,
    bridge: VerticalContentBridge,
    activeVerticalId: string | null | undefined
) {
    if (!activeVerticalId) return query

    const relatedContentIds = await getContentIdsForVertical(supabase, bridge, activeVerticalId)
    const filters = [
        'content_scope.eq.global',
        `primary_vertical_id.eq.${activeVerticalId}`,
    ]

    if (relatedContentIds.length > 0) {
        filters.push(`id.in.(${relatedContentIds.join(',')})`)
    }

    return query.or(filters.join(','))
}

export async function contentBelongsToActiveVertical(
    supabase: any,
    bridge: VerticalContentBridge,
    content: VerticalContentRecord,
    activeVerticalId: string | null | undefined
) {
    const scope = content.content_scope ?? 'vertical'

    if (scope === 'global') return true
    if (!activeVerticalId) return true
    if (content.primary_vertical_id === activeVerticalId) return true
    if (!content.id || scope !== 'cross_vertical') return false

    const relatedVerticalIds = await getRelatedVerticalIds(supabase, bridge, content.id)
    return relatedVerticalIds.includes(activeVerticalId)
}

export async function replaceContentVerticals(
    supabase: any,
    bridge: VerticalContentBridge,
    contentId: string,
    contentScope: ContentScope,
    verticalIds: string[]
) {
    const { error: deleteError } = await (supabase
        .from(bridge.table) as any)
        .delete()
        .eq(bridge.contentIdColumn, contentId)

    if (deleteError) {
        throw new Error(`Error al limpiar verticales compartidas: ${deleteError.message}`)
    }

    if (contentScope === 'global') return

    const rows = uniqueIds(verticalIds).map((verticalId) => ({
        [bridge.contentIdColumn]: contentId,
        vertical_id: verticalId,
    }))

    if (rows.length === 0) return

    const { error: insertError } = await (supabase
        .from(bridge.table) as any)
        .insert(rows)

    if (insertError) {
        throw new Error(`Error al guardar verticales compartidas: ${insertError.message}`)
    }
}

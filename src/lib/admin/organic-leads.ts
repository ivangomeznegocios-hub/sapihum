import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, OrganicLead } from '@/types/database'

export type OrganicLeadSort = 'created_at_desc' | 'lead_score_desc' | 'last_engagement_at_desc'

export interface OrganicLeadFilters {
    q: string
    specialty: string
    intent: string
    lifecycle_stage: string
    source_page: string
    source_asset: string
    country: string
    date_from: string
    date_to: string
    min_score: string
    sort: OrganicLeadSort
}

export interface OrganicLeadMetrics {
    total: number
    last7Days: number
    last30Days: number
    averageScore: number
    topSourcePage: string | null
    topSourceAsset: string | null
    topSpecialty: string | null
    topIntent: string | null
}

export interface OrganicLeadOptions {
    specialties: string[]
    intents: string[]
    lifecycleStages: string[]
    sourcePages: string[]
    sourceAssets: string[]
    countries: string[]
}

const DEFAULT_FILTERS: OrganicLeadFilters = {
    q: '',
    specialty: '',
    intent: '',
    lifecycle_stage: '',
    source_page: '',
    source_asset: '',
    country: '',
    date_from: '',
    date_to: '',
    min_score: '',
    sort: 'created_at_desc',
}

const SORT_COLUMNS: Record<OrganicLeadSort, keyof OrganicLead> = {
    created_at_desc: 'created_at',
    lead_score_desc: 'score',
    last_engagement_at_desc: 'last_engagement_at',
}

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function cleanParam(value: string | string[] | undefined, maxLength = 240) {
    return firstParam(value).trim().slice(0, maxLength)
}

export function parseOrganicLeadFilters(params: Record<string, string | string[] | undefined>): OrganicLeadFilters {
    const sort = cleanParam(params.sort) as OrganicLeadSort

    return {
        q: cleanParam(params.q, 120),
        specialty: cleanParam(params.specialty, 120),
        intent: cleanParam(params.intent, 80),
        lifecycle_stage: cleanParam(params.lifecycle_stage, 80),
        source_page: cleanParam(params.source_page, 300),
        source_asset: cleanParam(params.source_asset, 160),
        country: cleanParam(params.country, 80),
        date_from: cleanParam(params.date_from, 20),
        date_to: cleanParam(params.date_to, 20),
        min_score: cleanParam(params.min_score, 8),
        sort: sort in SORT_COLUMNS ? sort : DEFAULT_FILTERS.sort,
    }
}

function ilikePattern(value: string) {
    return `%${value.replace(/[%,]/g, ' ').replace(/\s+/g, ' ').trim()}%`
}

function applyFilters(query: any, filters: OrganicLeadFilters) {
    let nextQuery = query

    if (filters.q) {
        const pattern = ilikePattern(filters.q)
        nextQuery = nextQuery.or(`name.ilike.${pattern},email.ilike.${pattern},whatsapp.ilike.${pattern}`)
    }

    if (filters.specialty) nextQuery = nextQuery.eq('specialty', filters.specialty)
    if (filters.intent) nextQuery = nextQuery.eq('intent', filters.intent)
    if (filters.lifecycle_stage) nextQuery = nextQuery.eq('lifecycle_stage', filters.lifecycle_stage)
    if (filters.source_page) nextQuery = nextQuery.eq('source_page', filters.source_page)
    if (filters.source_asset) nextQuery = nextQuery.eq('source_asset', filters.source_asset)
    if (filters.country) nextQuery = nextQuery.eq('country', filters.country)
    if (filters.date_from) nextQuery = nextQuery.gte('created_at', `${filters.date_from}T00:00:00.000Z`)
    if (filters.date_to) nextQuery = nextQuery.lte('created_at', `${filters.date_to}T23:59:59.999Z`)

    const minScore = Number(filters.min_score)
    if (Number.isFinite(minScore) && minScore > 0) {
        nextQuery = nextQuery.gte('score', minScore)
    }

    return nextQuery
}

function uniqueSorted(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
        .sort((a, b) => a.localeCompare(b, 'es'))
}

function topValue(values: Array<string | null | undefined>) {
    const counts = new Map<string, number>()

    values.forEach((value) => {
        if (!value) return
        counts.set(value, (counts.get(value) ?? 0) + 1)
    })

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

function buildMetrics(leads: OrganicLead[], total: number): OrganicLeadMetrics {
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const scores = leads.map((lead) => Number(lead.score ?? 0)).filter(Number.isFinite)
    const averageScore = scores.length
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0

    return {
        total,
        last7Days: leads.filter((lead) => new Date(lead.created_at).getTime() >= sevenDaysAgo).length,
        last30Days: leads.filter((lead) => new Date(lead.created_at).getTime() >= thirtyDaysAgo).length,
        averageScore,
        topSourcePage: topValue(leads.map((lead) => lead.source_page)),
        topSourceAsset: topValue(leads.map((lead) => lead.source_asset)),
        topSpecialty: topValue(leads.map((lead) => lead.specialty)),
        topIntent: topValue(leads.map((lead) => lead.intent)),
    }
}

function buildOptions(leads: OrganicLead[]): OrganicLeadOptions {
    return {
        specialties: uniqueSorted(leads.map((lead) => lead.specialty)),
        intents: uniqueSorted(leads.map((lead) => lead.intent)),
        lifecycleStages: uniqueSorted(leads.map((lead) => lead.lifecycle_stage)),
        sourcePages: uniqueSorted(leads.map((lead) => lead.source_page)),
        sourceAssets: uniqueSorted(leads.map((lead) => lead.source_asset)),
        countries: uniqueSorted(leads.map((lead) => lead.country)),
    }
}

export async function getOrganicLeadsAdminDashboard(params: {
    supabase: SupabaseClient<Database>
    filters: OrganicLeadFilters
}) {
    const sortColumn = SORT_COLUMNS[params.filters.sort]
    const [allResult, countResult, rowsResult] = await Promise.all([
        (params.supabase.from('organic_leads') as any)
            .select('id, created_at, score, source_page, source_asset, specialty, intent, lifecycle_stage, country')
            .order('created_at', { ascending: false })
            .limit(5000),
        (params.supabase.from('organic_leads') as any)
            .select('id', { count: 'exact', head: true }),
        applyFilters(
            (params.supabase.from('organic_leads') as any)
                .select('*', { count: 'exact' }),
            params.filters
        )
            .order(sortColumn, { ascending: false })
            .range(0, 199),
    ])

    if (allResult.error) throw allResult.error
    if (countResult.error) throw countResult.error
    if (rowsResult.error) throw rowsResult.error

    const allLeads = (allResult.data ?? []) as OrganicLead[]

    return {
        leads: (rowsResult.data ?? []) as OrganicLead[],
        filteredCount: rowsResult.count ?? 0,
        metrics: buildMetrics(allLeads, countResult.count ?? allLeads.length),
        options: buildOptions(allLeads),
    }
}

export async function getOrganicLeadsForCsv(params: {
    supabase: SupabaseClient<Database>
    filters: OrganicLeadFilters
}) {
    const sortColumn = SORT_COLUMNS[params.filters.sort]
    const { data, error } = await applyFilters(
        (params.supabase.from('organic_leads') as any).select('*'),
        params.filters
    )
        .order(sortColumn, { ascending: false })
        .limit(5000)

    if (error) throw error

    return (data ?? []) as OrganicLead[]
}

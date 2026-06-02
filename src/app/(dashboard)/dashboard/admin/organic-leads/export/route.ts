import { NextRequest, NextResponse } from 'next/server'
import { loadCurrentViewer } from '@/lib/access/role-guard'
import { getOrganicLeadsForCsv, parseOrganicLeadFilters } from '@/lib/admin/organic-leads'
import { createClient } from '@/lib/supabase/server'
import type { OrganicLead } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CSV_COLUMNS: Array<{ key: string; label: string; value: (lead: OrganicLead) => unknown }> = [
    { key: 'id', label: 'id', value: (lead) => lead.id },
    { key: 'name', label: 'nombre', value: (lead) => lead.name },
    { key: 'email', label: 'email', value: (lead) => lead.email },
    { key: 'whatsapp', label: 'whatsapp', value: (lead) => lead.whatsapp },
    { key: 'country', label: 'pais', value: (lead) => lead.country },
    { key: 'city', label: 'ciudad', value: (lead) => lead.city },
    { key: 'role', label: 'rol', value: (lead) => lead.role },
    { key: 'specialty', label: 'especialidad', value: (lead) => lead.specialty },
    { key: 'years_experience', label: 'anos_experiencia', value: (lead) => lead.years_experience },
    { key: 'interest_tags', label: 'tags_interes', value: (lead) => lead.interest_tags.join('|') },
    { key: 'intent', label: 'intencion', value: (lead) => lead.intent },
    { key: 'source_page', label: 'pagina_fuente', value: (lead) => lead.source_page },
    { key: 'source_topic', label: 'tema_fuente', value: (lead) => lead.source_topic },
    { key: 'source_asset', label: 'asset_fuente', value: (lead) => lead.source_asset },
    { key: 'source_type', label: 'tipo_fuente', value: (lead) => lead.source_type },
    { key: 'utms', label: 'utms', value: (lead) => lead.utms },
    { key: 'referrer', label: 'referrer', value: (lead) => lead.referrer },
    { key: 'score', label: 'lead_score', value: (lead) => lead.score },
    { key: 'lifecycle_stage', label: 'lifecycle_stage', value: (lead) => lead.lifecycle_stage },
    { key: 'created_at', label: 'fecha_creacion', value: (lead) => lead.created_at },
    { key: 'last_engagement_at', label: 'ultima_interaccion', value: (lead) => lead.last_engagement_at },
]

function csvValue(value: unknown) {
    if (value === null || value === undefined) return ''
    const raw = typeof value === 'object' ? JSON.stringify(value) : String(value)
    return `"${raw.replace(/"/g, '""')}"`
}

function toCsv(leads: OrganicLead[]) {
    const header = CSV_COLUMNS.map((column) => csvValue(column.label)).join(',')
    const rows = leads.map((lead) => (
        CSV_COLUMNS.map((column) => csvValue(column.value(lead))).join(',')
    ))

    return [header, ...rows].join('\n')
}

export async function GET(request: NextRequest) {
    const { user, profile } = await loadCurrentViewer()

    if (!user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (profile?.role !== 'admin') {
        return new NextResponse('Acceso denegado', { status: 403 })
    }

    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const filters = parseOrganicLeadFilters(params)
    const supabase = await createClient()
    const leads = await getOrganicLeadsForCsv({ supabase, filters })
    const csv = toCsv(leads)

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="organic-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
    })
}

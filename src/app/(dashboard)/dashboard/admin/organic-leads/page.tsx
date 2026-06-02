import Link from 'next/link'
import { BarChart3, Download, Filter, Search, Target, Users } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/guard'
import { getOrganicLeadsAdminDashboard, parseOrganicLeadFilters, type OrganicLeadFilters } from '@/lib/admin/organic-leads'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import type { OrganicLead } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

const SORT_LABELS: Record<OrganicLeadFilters['sort'], string> = {
    created_at_desc: 'created_at desc',
    lead_score_desc: 'lead_score desc',
    last_engagement_at_desc: 'last_engagement_at desc',
}

function formatDate(value: string | null | undefined) {
    if (!value) return '-'

    return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}

function formatNumber(value: number) {
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(value)
}

function display(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === '') return '-'
    return String(value)
}

function buildExportHref(filters: OrganicLeadFilters) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
    })

    return `/dashboard/admin/organic-leads/export?${params.toString()}`
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-2 truncate text-2xl font-bold">{value}</p>
                {detail ? <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p> : null}
            </CardContent>
        </Card>
    )
}

function SelectFilter({
    name,
    label,
    value,
    options,
}: {
    name: keyof OrganicLeadFilters
    label: string
    value: string
    options: string[]
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={name}>{label}</Label>
            <select
                id={name}
                name={name}
                defaultValue={value}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <option value="">Todos</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    )
}

function JsonInline({ value }: { value: Record<string, any> | null | undefined }) {
    if (!value || Object.keys(value).length === 0) return <span className="text-muted-foreground">-</span>

    return (
        <code className="block max-w-[260px] truncate rounded bg-muted px-2 py-1 text-xs">
            {JSON.stringify(value)}
        </code>
    )
}

function LeadRow({ lead }: { lead: OrganicLead }) {
    return (
        <TableRow>
            <TableCell className="min-w-[220px]">
                <Link href={`/dashboard/admin/organic-leads/${lead.id}`} className="font-medium hover:underline">
                    {lead.name}
                </Link>
                <p className="text-xs text-muted-foreground">{lead.email}</p>
            </TableCell>
            <TableCell>{display(lead.whatsapp)}</TableCell>
            <TableCell>{display(lead.country)}</TableCell>
            <TableCell>{display(lead.city)}</TableCell>
            <TableCell>{display(lead.role)}</TableCell>
            <TableCell>{display(lead.specialty)}</TableCell>
            <TableCell>{display(lead.years_experience)}</TableCell>
            <TableCell className="min-w-[180px]">
                <div className="flex flex-wrap gap-1">
                    {lead.interest_tags.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                    ) : (
                        lead.interest_tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                                {tag}
                            </Badge>
                        ))
                    )}
                </div>
            </TableCell>
            <TableCell>{lead.intent}</TableCell>
            <TableCell className="max-w-[260px] truncate">{lead.source_page}</TableCell>
            <TableCell>{display(lead.source_topic)}</TableCell>
            <TableCell>{display(lead.source_asset)}</TableCell>
            <TableCell>{lead.source_type}</TableCell>
            <TableCell><JsonInline value={lead.utms} /></TableCell>
            <TableCell className="max-w-[240px] truncate">{display(lead.referrer)}</TableCell>
            <TableCell className="font-mono font-semibold">{lead.score}</TableCell>
            <TableCell><Badge variant="outline">{lead.lifecycle_stage}</Badge></TableCell>
            <TableCell className="min-w-[170px]">{formatDate(lead.created_at)}</TableCell>
            <TableCell className="min-w-[170px]">{formatDate(lead.last_engagement_at)}</TableCell>
        </TableRow>
    )
}

export default async function AdminOrganicLeadsPage({ searchParams }: PageProps) {
    await requireAdminPage()

    const filters = parseOrganicLeadFilters(await searchParams)
    const supabase = await createClient()
    const dashboard = await getOrganicLeadsAdminDashboard({ supabase, filters })

    return (
        <div className="w-full max-w-7xl space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary p-2.5 text-primary-foreground">
                        <Target className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Leads organicos</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Capturas del Organic Lead Engine con atribucion, scoring y etapa comercial.
                        </p>
                    </div>
                </div>
                <Button asChild variant="outline">
                    <a href={buildExportHref(filters)}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </a>
                </Button>
            </div>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total de leads" value={dashboard.metrics.total} />
                <MetricCard label="Ultimos 7 dias" value={dashboard.metrics.last7Days} />
                <MetricCard label="Ultimos 30 dias" value={dashboard.metrics.last30Days} />
                <MetricCard label="Promedio lead_score" value={formatNumber(dashboard.metrics.averageScore)} />
                <MetricCard label="Top source_page" value={dashboard.metrics.topSourcePage ?? '-'} />
                <MetricCard label="Top source_asset" value={dashboard.metrics.topSourceAsset ?? '-'} />
                <MetricCard label="Top specialty" value={dashboard.metrics.topSpecialty ?? '-'} />
                <MetricCard label="Top intent" value={dashboard.metrics.topIntent ?? '-'} />
            </section>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4 lg:grid-cols-4" method="get">
                        <div className="space-y-1.5 lg:col-span-2">
                            <Label htmlFor="q">Buscar</Label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="q"
                                    name="q"
                                    defaultValue={filters.q}
                                    placeholder="Nombre, email o WhatsApp"
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <SelectFilter name="specialty" label="Specialty" value={filters.specialty} options={dashboard.options.specialties} />
                        <SelectFilter name="intent" label="Intent" value={filters.intent} options={dashboard.options.intents} />
                        <SelectFilter name="lifecycle_stage" label="Lifecycle stage" value={filters.lifecycle_stage} options={dashboard.options.lifecycleStages} />
                        <SelectFilter name="source_page" label="Source page" value={filters.source_page} options={dashboard.options.sourcePages} />
                        <SelectFilter name="source_asset" label="Source asset" value={filters.source_asset} options={dashboard.options.sourceAssets} />
                        <SelectFilter name="country" label="Pais" value={filters.country} options={dashboard.options.countries} />
                        <div className="space-y-1.5">
                            <Label htmlFor="date_from">Desde</Label>
                            <Input id="date_from" name="date_from" type="date" defaultValue={filters.date_from} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="date_to">Hasta</Label>
                            <Input id="date_to" name="date_to" type="date" defaultValue={filters.date_to} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="min_score">Score minimo</Label>
                            <Input id="min_score" name="min_score" type="number" min="0" defaultValue={filters.min_score} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sort">Orden</Label>
                            <select
                                id="sort"
                                name="sort"
                                defaultValue={filters.sort}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {Object.entries(SORT_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end gap-2 lg:col-span-4">
                            <Button type="submit">Aplicar filtros</Button>
                            <Button asChild type="button" variant="outline">
                                <Link href="/dashboard/admin/organic-leads">Limpiar</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Resultados ({dashboard.filteredCount})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {dashboard.leads.length === 0 ? (
                        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                            No hay leads organicos con estos filtros.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre / email</TableHead>
                                    <TableHead>WhatsApp</TableHead>
                                    <TableHead>Pais</TableHead>
                                    <TableHead>Ciudad</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Especialidad</TableHead>
                                    <TableHead>Anos exp.</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Intencion</TableHead>
                                    <TableHead>Pagina fuente</TableHead>
                                    <TableHead>Tema fuente</TableHead>
                                    <TableHead>Asset fuente</TableHead>
                                    <TableHead>Tipo fuente</TableHead>
                                    <TableHead>UTMs</TableHead>
                                    <TableHead>Referrer</TableHead>
                                    <TableHead>lead_score</TableHead>
                                    <TableHead>lifecycle_stage</TableHead>
                                    <TableHead>Creado</TableHead>
                                    <TableHead>Ultima interaccion</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboard.leads.map((lead) => (
                                    <LeadRow key={lead.id} lead={lead} />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {dashboard.filteredCount > dashboard.leads.length ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                            Mostrando los primeros {dashboard.leads.length} resultados. Usa filtros o CSV para acotar la consulta.
                        </p>
                    ) : null}
                </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Las metricas superiores se calculan server-side y el acceso esta limitado a usuarios admin.
            </div>
        </div>
    )
}

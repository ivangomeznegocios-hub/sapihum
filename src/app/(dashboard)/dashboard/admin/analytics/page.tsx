import { redirect } from 'next/navigation'
import { BarChart3, Briefcase, DollarSign, Funnel, Radar, ReceiptText, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAdminAnalyticsDashboard } from '@/lib/supabase/queries/admin-analytics'
import { AdminAnalyticsForms } from './admin-analytics-forms'

function percent(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) return '—'
    return `${value.toFixed(1)}%`
}

function currency(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) return '—'
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0,
    }).format(value)
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminAnalyticsPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as any)?.role !== 'admin') redirect('/dashboard')

    const dashboard = await getAdminAnalyticsDashboard('last_non_direct')

    return (
        <div className="w-full max-w-7xl space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-gradient-to-br from-brand-brown to-brand-yellow p-2.5 text-white shadow-lg shadow-brand-brown/20">
                        <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Analytics</h1>
                        <p className="text-sm text-muted-foreground">
                            Growth, revenue y unit economics con Supabase como reporte canónico y atribución por defecto en <strong>last non-direct</strong>.
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card px-4 py-3 text-sm">
                    <p className="font-medium">Ventana operativa</p>
                    <p className="text-muted-foreground">Funnel y adquisición en últimos 30 días. Revenue consolidado y MRR en tiempo real.</p>
                </div>
            </div>

            <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Resumen ejecutivo
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['Visitas', dashboard.executive.visits],
                        ['Leads', dashboard.executive.leads],
                        ['Registros', dashboard.executive.registrations],
                        ['Activaciones', dashboard.executive.activations],
                        ['Checkouts', dashboard.executive.checkouts],
                        ['Ventas', dashboard.executive.sales],
                        ['Revenue 30d', dashboard.executive.revenue30dFormatted],
                        ['MRR', dashboard.executive.mrrFormatted],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border bg-card p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                            <p className="mt-2 text-2xl font-bold">{String(value)}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Funnel className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Funnel explorer</h2>
                    </div>
                    <div className="space-y-3">
                        {dashboard.funnel.map((step) => (
                            <div key={step.label} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                                <div>
                                    <p className="font-medium">{step.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {step.conversionRate === null ? 'Base del funnel' : `Conversión desde paso previo: ${percent(step.conversionRate)}`}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold">{step.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Radar className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Unit economics</h2>
                    </div>
                    <div className="space-y-3 text-sm">
                        {[
                            ['CAC blended', currency(dashboard.unitEconomics.cacBlended)],
                            ['ROAS', dashboard.unitEconomics.roas ? `${dashboard.unitEconomics.roas.toFixed(2)}x` : '—'],
                            ['Payback', dashboard.unitEconomics.paybackMonths ? `${dashboard.unitEconomics.paybackMonths.toFixed(1)} meses` : '—'],
                            ['ARPU', dashboard.executive.arpuFormatted],
                            ['Churn', percent(dashboard.executive.churnRate)],
                            ['LTV realizado', currency(dashboard.unitEconomics.realizedLtv)],
                            ['LTV estimado', currency(dashboard.unitEconomics.estimatedLtv)],
                            ['LTV:CAC', dashboard.unitEconomics.ltvCacRatio ? `${dashboard.unitEconomics.ltvCacRatio.toFixed(2)}x` : '—'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-semibold">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Revenue consolidado</h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {dashboard.revenue.breakdown30d.map((row) => (
                            <div key={row.source} className="rounded-xl border bg-muted/20 p-4">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.source}</p>
                                <p className="mt-2 text-xl font-bold">{currency(row.amount)}</p>
                                <p className="text-xs text-muted-foreground">{row.count} ventas en 30d</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total 30d</span>
                            <strong>{currency(dashboard.revenue.total30d)}</strong>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-muted-foreground">Total histórico</span>
                            <strong>{currency(dashboard.revenue.totalAllTime)}</strong>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Salud del tracking</h2>
                    </div>
                    <div className="space-y-3 text-sm">
                        {[
                            ['Visitantes trackeados', dashboard.trackingHealth.visitors],
                            ['Sesiones 30d', dashboard.trackingHealth.sessions30d],
                            ['Eventos 30d', dashboard.trackingHealth.events30d],
                            ['Revenue sin atribución', dashboard.trackingHealth.unattributedRevenue],
                            ['Costos manuales', dashboard.trackingHealth.manualCosts],
                            ['Deals manuales', dashboard.trackingHealth.manualDeals],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-semibold">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Salud operativa</h2>
                    </div>
                    <div className="space-y-3 text-sm">
                        {[
                            ['Webhooks procesados 24h', dashboard.operationalHealth.webhooksProcessed24h],
                            ['Webhooks fallidos 24h', dashboard.operationalHealth.webhooksFailed24h],
                            ['Webhooks en proceso', dashboard.operationalHealth.webhooksProcessing],
                            ['Compras evento pendientes', dashboard.operationalHealth.pendingEventPurchases],
                            ['Compras formacion pendientes', dashboard.operationalHealth.pendingFormationPurchases],
                            ['Refunds 30d', dashboard.operationalHealth.refundedTransactions30d],
                            ['Emails fallidos 30d', dashboard.operationalHealth.commerceEmailFailures30d],
                            ['Magic links fallidos 30d', dashboard.operationalHealth.magicLinkFailures30d],
                            ['Refund manual review 30d', dashboard.operationalHealth.refundManualReviewOpen30d],
                            ['Refunds conciliados 30d', dashboard.operationalHealth.successfulRefunds30d],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-semibold">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Adquisición por canal/campaña</h2>
                </div>
                <div className="overflow-x-auto rounded-2xl border">
                    <table className="min-w-[980px] w-full text-sm">
                        <thead className="text-left text-muted-foreground">
                            <tr className="border-b">
                                <th className="py-2 pr-4">Canal</th>
                                <th className="py-2 pr-4">Campaña</th>
                                <th className="py-2 pr-4">Visitas</th>
                                <th className="py-2 pr-4">Leads</th>
                                <th className="py-2 pr-4">Registros</th>
                                <th className="py-2 pr-4">Checkouts</th>
                                <th className="py-2 pr-4">Ventas</th>
                                <th className="py-2 pr-4">Revenue</th>
                                <th className="py-2 pr-4">Costo</th>
                                <th className="py-2 pr-4">ROAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboard.acquisition.slice(0, 12).map((row) => (
                                <tr key={`${row.channel}-${row.campaign}`} className="border-b last:border-0">
                                    <td className="py-3 pr-4 font-medium">{row.channel}</td>
                                    <td className="py-3 pr-4 text-muted-foreground">{row.campaign}</td>
                                    <td className="py-3 pr-4">{row.visits}</td>
                                    <td className="py-3 pr-4">{row.leads}</td>
                                    <td className="py-3 pr-4">{row.registrations}</td>
                                    <td className="py-3 pr-4">{row.checkouts}</td>
                                    <td className="py-3 pr-4">{row.sales}</td>
                                    <td className="py-3 pr-4">{currency(row.revenue)}</td>
                                    <td className="py-3 pr-4">{currency(row.cost)}</td>
                                    <td className="py-3 pr-4">{row.roas ? `${row.roas.toFixed(2)}x` : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Campanas por bloque</h2>
                    </div>
                    <div className="space-y-3">
                        {dashboard.eventCampaigns.byTrack.slice(0, 6).map((row) => (
                            <div key={row.label} className="rounded-xl border bg-muted/20 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium">{row.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {row.leads} leads · {row.registrations} registros · {row.sales} ventas
                                        </p>
                                    </div>
                                    <strong>{currency(row.revenue)}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Campanas por evento</h2>
                    </div>
                    <div className="space-y-3">
                        {dashboard.eventCampaigns.byEvent.slice(0, 8).map((row) => (
                            <div key={row.eventSlug || row.label} className="rounded-xl border bg-muted/20 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium">{row.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {row.track || 'Sin ruta'} · {row.leads} leads · {row.registrations} registros
                                        </p>
                                    </div>
                                    <strong>{currency(row.revenue)}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Leads por fuente</h2>
                    </div>
                    <div className="space-y-3">
                        {dashboard.eventCampaigns.bySource.slice(0, 8).map((row) => (
                            <div key={row.label} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3 text-sm">
                                <span className="text-muted-foreground">{row.label}</span>
                                <strong>{row.leads}</strong>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Leads por ponente</h2>
                    </div>
                    <div className="space-y-3">
                        {dashboard.eventCampaigns.bySpeaker.slice(0, 8).map((row) => (
                            <div key={row.label} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3 text-sm">
                                <span className="text-muted-foreground">{row.label}</span>
                                <strong>{row.leads}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <ReceiptText className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Comparación de atribución</h2>
                    </div>
                    <div className="space-y-4">
                        {dashboard.comparisonByModel.map((item) => (
                            <div key={item.model} className="rounded-xl border bg-muted/20 p-4">
                                <p className="font-medium capitalize">{item.model.replaceAll('_', ' ')}</p>
                                <div className="mt-3 space-y-2">
                                    {item.channels.map((channel) => (
                                        <div key={channel.channel} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{channel.channel}</span>
                                            <strong>{currency(channel.amount)}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <AdminAnalyticsForms />
                </div>
            </section>
        </div>
    )
}

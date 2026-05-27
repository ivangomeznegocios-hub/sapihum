import Link from 'next/link'
import { Activity, AlertTriangle, CheckCircle2, Inbox, ReceiptText, Users } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/guard'
import { getAdminInboxDashboard, type InboxItem, type InboxSeverity } from '@/lib/admin/inbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatDate(value: string) {
    return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}

function formatMoney(value: number) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0,
    }).format(value)
}

function severityVariant(severity: InboxSeverity) {
    if (severity === 'error') return 'destructive' as const
    if (severity === 'success') return 'default' as const
    return 'secondary' as const
}

function StatusBadge({ item }: { item: InboxItem }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant={severityVariant(item.severity)}>{item.kind}</Badge>
            {item.status ? <Badge variant="outline">{item.status}</Badge> : null}
        </div>
    )
}

function InboxList({ items, emptyText }: { items: InboxItem[]; emptyText: string }) {
    if (items.length === 0) {
        return (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {emptyText}
            </div>
        )
    }

    return (
        <div className="divide-y rounded-md border">
            {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-2">
                        <StatusBadge item={item} />
                        <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(item.occurredAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {item.email ? (
                            <span className="max-w-[220px] truncate text-xs text-muted-foreground">{item.email}</span>
                        ) : null}
                        {item.href ? (
                            <Button asChild size="sm" variant="outline">
                                <Link href={item.href}>Abrir</Link>
                            </Button>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default async function AdminInboxPage() {
    await requireAdminPage()
    const dashboard = await getAdminInboxDashboard()

    return (
        <div className="w-full max-w-7xl space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary p-2.5 text-primary-foreground">
                        <Inbox className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Actividad operativa</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Formularios, compras y alertas de salud en un solo panel admin.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/admin/operations">Resolver accesos</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/admin/analytics">Ver analytics</Link>
                    </Button>
                </div>
            </div>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardContent className="flex items-start gap-3 p-4">
                        <Users className="mt-1 h-5 w-5 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{dashboard.summary.formItems}</p>
                            <p className="text-xs text-muted-foreground">Formularios recientes</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-start gap-3 p-4">
                        <ReceiptText className="mt-1 h-5 w-5 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{dashboard.summary.purchaseItems}</p>
                            <p className="text-xs text-muted-foreground">Compras y transacciones</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-start gap-3 p-4">
                        <AlertTriangle className="mt-1 h-5 w-5 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{dashboard.summary.healthIssues}</p>
                            <p className="text-xs text-muted-foreground">Asuntos por revisar</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-start gap-3 p-4">
                        <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{formatMoney(dashboard.summary.revenueVisible)}</p>
                            <p className="text-xs text-muted-foreground">Revenue visible en lista</p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Formularios
                        </CardTitle>
                        <CardDescription>Leads, listas de espera, fundadores y solicitudes de ponente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InboxList items={dashboard.forms} emptyText="No hay formularios recientes." />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ReceiptText className="h-5 w-5" />
                            Compras
                        </CardTitle>
                        <CardDescription>Compras de eventos, formaciones y transacciones recientes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InboxList items={dashboard.purchases} emptyText="No hay compras recientes." />
                    </CardContent>
                </Card>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Salud operativa
                    </CardTitle>
                    <CardDescription>
                        Webhooks atorados, correos fallidos, compras pendientes y refunds que requieren revision.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <InboxList items={dashboard.health} emptyText="Sin alertas operativas activas." />
                </CardContent>
            </Card>
        </div>
    )
}

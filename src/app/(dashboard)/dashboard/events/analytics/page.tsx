import { createClient, getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Users, Eye, DollarSign } from 'lucide-react'
import { DEFAULT_TIMEZONE, formatDateInTimezone } from '@/lib/timezone'

export default async function EventAnalyticsPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    // 1. Security Check: Only Admins
    if (!profile || profile.role !== 'admin') {
        redirect('/dashboard/events')
    }

    // 2. Fetch All Events with Views
    const { data: events, error } = await (supabase
        .from('events') as any)
        .select('id, title, status, start_time, price, views, max_attendees')
        .order('start_time', { ascending: false })

    if (error || !events) {
        return <div>Error loading analytics</div>
    }

    // 3. Fetch Registrations Count for each event
    // We need a way to count registrations per event efficiently.
    // For now, we'll fetch all active registrations and aggregate them in memory.
    // In production with thousands of records, we'd use a SQL View or RPC.
    const { data: registrations } = await (supabase
        .from('event_registrations') as any)
        .select('event_id, status')
        .eq('status', 'registered')

    const regCounts: Record<string, number> = {}
    registrations?.forEach((r: any) => {
        regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1
    })

    // 4. Calculate Stats
    const stats = events.map((event: any) => {
        const viewCount = event.views || 0
        const regCount = regCounts[event.id] || 0
        const conversionRate = viewCount > 0 ? ((regCount / viewCount) * 100).toFixed(1) : '0.0'
        const revenue = regCount * (event.price || 0)

        return {
            ...event,
            regCount,
            conversionRate,
            revenue
        }
    })

    // Global Totals
    const totalViews = stats.reduce((acc: number, curr: any) => acc + (curr.views || 0), 0)
    const totalRegistrations = stats.reduce((acc: number, curr: any) => acc + curr.regCount, 0)
    const totalRevenue = stats.reduce((acc: number, curr: any) => acc + curr.revenue, 0)
    const avgConversion = stats.length > 0 ? (stats.reduce((acc: number, curr: any) => acc + parseFloat(curr.conversionRate), 0) / stats.length).toFixed(1) : '0.0'

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics de Eventos</h1>
                    <p className="text-muted-foreground mt-1">
                        Visión global del rendimiento de los eventos (Solo Admin)
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/events">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Link>
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vistas Totales</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalViews}</div>
                        <p className="text-xs text-muted-foreground">En todos los eventos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Registros Totales</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRegistrations}</div>
                        <p className="text-xs text-muted-foreground">Asistentes inscritos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversión Promedio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgConversion}%</div>
                        <p className="text-xs text-muted-foreground">De vista a registro</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Estimados</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Valor total de tickets</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Rendimiento por Evento</CardTitle>
                    <CardDescription>
                        Desglose detallado de métricas por cada evento activo o pasado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-left">
                                    <th className="p-4 font-medium">Evento</th>
                                    <th className="p-4 font-medium">Estado</th>
                                    <th className="p-4 font-medium">Precio</th>
                                    <th className="p-4 font-medium text-right">Vistas</th>
                                    <th className="p-4 font-medium text-right">Registros</th>
                                    <th className="p-4 font-medium text-right">Conversión</th>
                                    <th className="p-4 font-medium text-right">Ingresos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((event: any) => (
                                    <tr key={event.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium">{event.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDateInTimezone(event.start_time, {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                }, DEFAULT_TIMEZONE)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${event.status === 'upcoming' ? 'bg-brand-yellow text-brand-yellow' :
                                                    event.status === 'live' ? 'surface-alert-success' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {event.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {event.price > 0 ? `$${event.price}` : 'Gratis'}
                                        </td>
                                        <td className="p-4 text-right">{event.views || 0}</td>
                                        <td className="p-4 text-right">
                                            {event.regCount}
                                            {event.max_attendees && <span className="text-muted-foreground"> / {event.max_attendees}</span>}
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            <span className={parseFloat(event.conversionRate) > 10 ? 'text-green-600' : ''}>
                                                {event.conversionRate}%
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            ${event.revenue.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


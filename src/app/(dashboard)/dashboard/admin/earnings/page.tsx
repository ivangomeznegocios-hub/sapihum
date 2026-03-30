import { getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { adminGetAllSpeakerEarnings, adminReleaseEarnings, adminCloseMonth, adminGetAllSpeakers } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Users, Clock, CheckCircle2, TrendingUp, Ban, Shield } from 'lucide-react'
import { AdminEarningsActions } from './admin-earnings-client'

function formatMXN(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

export default async function AdminEarningsPage() {
    const profile = await getUserProfile()

    if (!profile) redirect('/auth/login')
    if (profile.role !== 'admin') redirect('/dashboard')

    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data, error } = await adminGetAllSpeakerEarnings(currentMonth)
    const { data: speakerList } = await adminGetAllSpeakers()

    if (error || !data) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Error al cargar datos: {error}</p>
            </div>
        )
    }

    return (
        <div className="w-full space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Shield className="h-6 w-6 text-primary" />
                        Panel de Ganancias — Admin
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Vista global de montos por ponente · Mes: {data.month}
                    </p>
                </div>
                <AdminEarningsActions currentMonth={currentMonth} speakers={speakerList || []} />
            </div>

            {/* Global Totals */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border-brand-yellow dark:border-brand-yellow/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total General</CardTitle>
                        <TrendingUp className="h-4 w-4 text-brand-yellow" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMXN(data.totals.total)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{data.speakers.length} ponentes</p>
                    </CardContent>
                </Card>
                <Card className="border-brand-brown dark:border-brand-brown/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Liberado</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-brand-brown" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-brown dark:text-brand-brown">
                            {formatMXN(data.totals.released)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Listo para dispersión</p>
                    </CardContent>
                </Card>
                <Card className="border-brand-yellow dark:border-brand-yellow/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente</CardTitle>
                        <Clock className="h-4 w-4 text-brand-yellow" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-brand-yellow dark:text-brand-yellow">
                            {formatMXN(data.totals.pending)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">En periodo de 30 días</p>
                    </CardContent>
                </Card>
                <Card className="border-red-200 dark:border-red-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Anulado</CardTitle>
                        <Ban className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {formatMXN(data.totals.voided)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Reembolsos/cancelaciones</p>
                    </CardContent>
                </Card>
            </div>

            {/* Per-Speaker Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Desglose por Ponente
                    </CardTitle>
                    <CardDescription>
                        Montos individuales para autorizar dispersión
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.speakers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>No hay ganancias registradas para este mes</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.speakers.map((entry: any) => (
                                <div key={entry.speaker?.id} className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{entry.speaker?.full_name || 'Sin nombre'}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {entry.earningsCount} transacc.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-start gap-4 sm:flex-shrink-0 sm:items-center">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Liberado</p>
                                            <p className="text-sm font-semibold text-brand-brown dark:text-brand-brown">
                                                {formatMXN(entry.totalReleased)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Pendiente</p>
                                            <p className="text-sm font-semibold text-brand-yellow dark:text-brand-yellow">
                                                {formatMXN(entry.totalPending)}
                                            </p>
                                        </div>
                                        {entry.totalVoided > 0 && (
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Anulado</p>
                                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                                    {formatMXN(entry.totalVoided)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

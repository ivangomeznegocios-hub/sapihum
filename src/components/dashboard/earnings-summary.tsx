'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Clock, CheckCircle2, TrendingUp, Calendar, Ban } from 'lucide-react'
import type { SpeakerFinancialSummary } from '@/types/database'

interface EarningsSummaryProps {
    summary: SpeakerFinancialSummary
}

function formatMXN(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

export function EarningsSummary({ summary }: EarningsSummaryProps) {
    const cards = [
        {
            title: 'Balance Total Acumulado',
            value: formatMXN(summary.totalAccumulated),
            subtitle: `${summary.totalEvents} eventos · ${summary.totalStudents} alumnos`,
            icon: TrendingUp,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            border: 'border-blue-200 dark:border-blue-800/50',
        },
        {
            title: 'Disponible para Pago',
            value: formatMXN(summary.availableForPayment),
            subtitle: 'Ya superó los 30 días',
            icon: CheckCircle2,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            border: 'border-emerald-200 dark:border-emerald-800/50',
        },
        {
            title: 'En Periodo de Garantía',
            value: formatMXN(summary.pendingAmount),
            subtitle: 'Pendiente de liberación (30 días)',
            icon: Clock,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            border: 'border-amber-200 dark:border-amber-800/50',
        },
        {
            title: 'Próximo Corte',
            value: summary.nextPaymentDate
                ? new Date(summary.nextPaymentDate + 'T00:00:00').toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long'
                })
                : 'N/A',
            subtitle: `Mes actual: ${formatMXN(summary.currentMonthEarnings)}`,
            icon: Calendar,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-950/30',
            border: 'border-purple-200 dark:border-purple-800/50',
        },
    ]

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title} className={`${card.border} overflow-hidden`}>
                    <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                        <CardTitle className="min-w-0 break-words text-xs font-medium leading-tight text-muted-foreground sm:text-sm">
                            {card.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg ${card.bg}`}>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="min-w-0 break-words text-xl font-bold tracking-tight leading-tight sm:text-2xl">{card.value}</div>
                        <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{card.subtitle}</p>
                    </CardContent>
                </Card>
            ))}

            {summary.voidedAmount > 0 && (
                <Card className="border-red-200 dark:border-red-800/50 sm:col-span-2 lg:col-span-4">
                    <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                            <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Monto Anulado: {formatMXN(summary.voidedAmount)}</p>
                            <p className="text-xs text-muted-foreground">Por reembolsos o cancelaciones</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowDownToLine, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface EarningRow {
    id: string
    earning_type: string
    gross_amount: number
    commission_rate: number
    net_amount: number
    status: string
    attendance_date: string
    release_date: string
    released_at: string | null
    voided_at: string | null
    void_reason: string | null
    month_key: string
    student?: { id: string; full_name: string; avatar_url: string | null }
    event?: { id: string; title: string; start_time: string }
}

interface EarningsTableProps {
    earnings: EarningRow[]
    csvData?: any[]
    showStudentPaymentStatus?: boolean
}

function formatMXN(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pendiente', variant: 'secondary' },
    released: { label: 'Liberado', variant: 'default' },
    voided: { label: 'Anulado', variant: 'destructive' },
}

const typeLabels: Record<string, string> = {
    membership_proration: 'Membresía',
    premium_commission: 'Programa Premium',
}

export function EarningsTable({ earnings, csvData, showStudentPaymentStatus = true }: EarningsTableProps) {
    const [downloading, setDownloading] = useState(false)

    const handleDownloadCSV = () => {
        if (!csvData || csvData.length === 0) return
        setDownloading(true)

        try {
            const headers = Object.keys(csvData[0])
            const csvContent = [
                headers.join(','),
                ...csvData.map(row =>
                    headers.map(h => {
                        const val = String(row[h] ?? '')
                        return val.includes(',') ? `"${val}"` : val
                    }).join(',')
                )
            ].join('\n')

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `reporte_ganancias_${new Date().toISOString().slice(0, 7)}.csv`
            link.click()
            URL.revokeObjectURL(link.href)
        } finally {
            setDownloading(false)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                        Historial de Ganancias
                    </CardTitle>
                    <CardDescription>
                        Desglose detallado por alumno y evento
                    </CardDescription>
                </div>
                {csvData && csvData.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadCSV}
                        disabled={downloading}
                        className="w-full sm:w-auto"
                    >
                        <ArrowDownToLine className="mr-2 h-3 w-3" />
                        {downloading ? 'Descargando...' : 'Descargar CSV'}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {earnings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No hay ganancias registradas para este periodo</p>
                    </div>
                ) : (
                    <>
                    <div className="space-y-3 md:hidden">
                        {earnings.map((earning) => {
                            const status = statusConfig[earning.status] || statusConfig.pending

                            return (
                                <div key={earning.id} className="rounded-xl border bg-muted/30 p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{earning.student?.full_name || 'N/A'}</p>
                                            <p className="truncate text-xs text-muted-foreground">{earning.event?.title || 'N/A'}</p>
                                        </div>
                                        <Badge variant={status.variant}>{status.label}</Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tipo</p>
                                            <p className="truncate">{typeLabels[earning.earning_type] || earning.earning_type}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Neto</p>
                                            <p className="font-semibold">{formatMXN(earning.net_amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Bruto</p>
                                            <p>{formatMXN(earning.gross_amount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Comision</p>
                                            <p>{(earning.commission_rate * 100).toFixed(0)}%</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            Asistencia {new Date(earning.attendance_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <span>
                                            Liberacion {new Date(earning.release_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Alumno</TableHead>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Monto Bruto</TableHead>
                                    <TableHead className="text-right">Comisión</TableHead>
                                    <TableHead className="text-right">Monto Neto</TableHead>
                                    {showStudentPaymentStatus && (
                                        <TableHead>Estado de Pago</TableHead>
                                    )}
                                    <TableHead>Fecha Asistencia</TableHead>
                                    <TableHead>Fecha Liberación</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {earnings.map((earning) => {
                                    const status = statusConfig[earning.status] || statusConfig.pending
                                    return (
                                        <TableRow key={earning.id}>
                                            <TableCell className="font-medium">
                                                {earning.student?.full_name || 'N/A'}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {earning.event?.title || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">
                                                    {typeLabels[earning.earning_type] || earning.earning_type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatMXN(earning.gross_amount)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {(earning.commission_rate * 100).toFixed(0)}%
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatMXN(earning.net_amount)}
                                            </TableCell>
                                            {showStudentPaymentStatus && (
                                                <TableCell>
                                                    <Badge variant={status.variant}>
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(earning.attendance_date + 'T00:00:00').toLocaleDateString('es-MX', {
                                                    day: 'numeric', month: 'short'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(earning.release_date + 'T00:00:00').toLocaleDateString('es-MX', {
                                                    day: 'numeric', month: 'short'
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

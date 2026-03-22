'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface StudentRow {
    id: string
    event_id: string
    status: string
    registered_at: string
    student: {
        id: string
        full_name: string
        avatar_url: string | null
    }
    event_title: string
    event_start: string
    attendance_percentage: number | null
    attendance_qualifies: boolean
    duration_minutes: number | null
    earning_status: string | null
    earning_amount: number | null
    earning_release_date: string | null
}

interface StudentTableProps {
    students: StudentRow[]
    showPaymentStatus?: boolean
}

function formatMXN(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

const attendanceIcon = (qualifies: boolean, hasData: boolean) => {
    if (!hasData) return <Clock className="h-4 w-4 text-muted-foreground" />
    if (qualifies) return <CheckCircle className="h-4 w-4 text-emerald-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
}

const paymentStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
    pending: { label: 'Periodo de Garantia', variant: 'secondary', icon: Clock },
    released: { label: 'Liberado', variant: 'default', icon: CheckCircle },
    voided: { label: 'Anulado', variant: 'destructive', icon: XCircle },
}

export function StudentTable({ students, showPaymentStatus = true }: StudentTableProps) {
    const qualifiedCount = students.filter((s) => s.attendance_qualifies).length
    const totalCount = students.length

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Alumnos Inscritos
                        </CardTitle>
                        <CardDescription className="text-sm">
                            {totalCount} alumno{totalCount !== 1 ? 's' : ''} | {qualifiedCount} con asistencia valida
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-emerald-500" /> &gt;= 90%
                        </span>
                        <span className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" /> &lt; 90%
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {students.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No hay alumnos inscritos</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 md:hidden">
                            {students.map((student) => {
                                const hasAttendance = student.attendance_percentage !== null
                                const paymentConfig = student.earning_status
                                    ? paymentStatusConfig[student.earning_status] || paymentStatusConfig.pending
                                    : null

                                return (
                                    <div key={student.id} className="rounded-xl border bg-muted/30 p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-[10px]">
                                                        {getInitials(student.student?.full_name || 'U')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{student.student?.full_name || 'Sin nombre'}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{student.event_title}</p>
                                                </div>
                                            </div>
                                            {paymentConfig ? (
                                                <Badge variant={paymentConfig.variant} className="shrink-0">
                                                    {paymentConfig.label}
                                                </Badge>
                                            ) : (
                                                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Sin generar
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Inscripcion</p>
                                                <p>
                                                    {new Date(student.registered_at).toLocaleDateString('es-MX', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Asistencia</p>
                                                <p className="flex items-center justify-end gap-1">
                                                    {attendanceIcon(student.attendance_qualifies, hasAttendance)}
                                                    {hasAttendance ? `${student.attendance_percentage?.toFixed(0)}%` : 'Sin registro'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tiempo</p>
                                                <p>{student.duration_minutes ? `${student.duration_minutes} min` : '—'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Monto</p>
                                                <p className="font-semibold">{student.earning_amount ? formatMXN(student.earning_amount) : '—'}</p>
                                            </div>
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
                                        <TableHead>Fecha Inscripcion</TableHead>
                                        <TableHead>Asistencia</TableHead>
                                        <TableHead>Tiempo</TableHead>
                                        {showPaymentStatus && (
                                            <>
                                                <TableHead>Estado de Pago</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                            </>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => {
                                        const hasAttendance = student.attendance_percentage !== null
                                        const paymentConfig = student.earning_status
                                            ? paymentStatusConfig[student.earning_status] || paymentStatusConfig.pending
                                            : null

                                        return (
                                            <TableRow key={student.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarFallback className="text-[10px]">
                                                                {getInitials(student.student?.full_name || 'U')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium text-sm">
                                                            {student.student?.full_name || 'Sin nombre'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[180px] truncate text-sm">
                                                    {student.event_title}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(student.registered_at).toLocaleDateString('es-MX', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {attendanceIcon(student.attendance_qualifies, hasAttendance)}
                                                        <span className="text-sm">
                                                            {hasAttendance
                                                                ? `${student.attendance_percentage?.toFixed(0)}%`
                                                                : 'Sin registro'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {student.duration_minutes ? `${student.duration_minutes} min` : '—'}
                                                </TableCell>
                                                {showPaymentStatus && (
                                                    <>
                                                        <TableCell>
                                                            {paymentConfig ? (
                                                                <Badge variant={paymentConfig.variant}>
                                                                    {paymentConfig.label}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    Sin generar
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {student.earning_amount ? formatMXN(student.earning_amount) : '—'}
                                                        </TableCell>
                                                    </>
                                                )}
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

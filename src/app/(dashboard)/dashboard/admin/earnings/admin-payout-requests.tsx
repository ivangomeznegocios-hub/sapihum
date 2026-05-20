'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CreditCard, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    adminApprovePayoutRequest,
    adminMarkPayoutPaid,
    adminRejectPayoutRequest,
} from './actions'

interface AdminPayoutRequest {
    id: string
    status: string
    amount: number
    requested_at: string
    payment_method?: string | null
    payment_reference?: string | null
    speaker?: { full_name?: string | null; email?: string | null }
}

interface AdminPayoutRequestsProps {
    requests: AdminPayoutRequest[]
}

function formatMXN(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
}

const statusLabels: Record<string, string> = {
    requested: 'Solicitada',
    approved: 'Aprobada',
    paid: 'Pagada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
}

export function AdminPayoutRequests({ requests }: AdminPayoutRequestsProps) {
    const router = useRouter()
    const [busyId, setBusyId] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const runAction = async (requestId: string, action: () => Promise<{ error?: string; success?: boolean }>) => {
        setBusyId(requestId)
        setMessage(null)
        try {
            const result = await action()
            if (result.error) {
                setMessage(result.error)
            } else {
                router.refresh()
            }
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="space-y-3">
            {message && <p className="text-sm text-red-600">{message}</p>}
            {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay solicitudes de retiro.</p>
            ) : (
                requests.map((request) => (
                    <div key={request.id} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <p className="font-medium">{request.speaker?.full_name || 'Ponente sin nombre'}</p>
                            <p className="text-xs text-muted-foreground">
                                {request.speaker?.email || 'Sin correo'} · {new Date(request.requested_at).toLocaleDateString('es-MX')}
                            </p>
                            {request.payment_reference && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Ref. {request.payment_reference}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{formatMXN(Number(request.amount ?? 0))}</p>
                            <Badge variant={request.status === 'paid' ? 'default' : 'secondary'}>
                                {statusLabels[request.status] ?? request.status}
                            </Badge>
                            {request.status === 'requested' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busyId === request.id}
                                    onClick={() => runAction(request.id, () => adminApprovePayoutRequest(request.id))}
                                >
                                    <CheckCircle2 className="mr-2 h-3 w-3" />
                                    Aprobar
                                </Button>
                            )}
                            {(request.status === 'requested' || request.status === 'approved') && (
                                <>
                                    <Button
                                        size="sm"
                                        disabled={busyId === request.id}
                                        onClick={() => {
                                            const reference = window.prompt('Referencia del pago manual')
                                            if (!reference) return
                                            const method = window.prompt('Metodo de pago', 'transferencia') || 'transferencia'
                                            void runAction(request.id, () => adminMarkPayoutPaid(request.id, method, reference))
                                        }}
                                    >
                                        <CreditCard className="mr-2 h-3 w-3" />
                                        Marcar pagado
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={busyId === request.id}
                                        onClick={() => {
                                            const notes = window.prompt('Motivo de rechazo') || undefined
                                            void runAction(request.id, () => adminRejectPayoutRequest(request.id, notes))
                                        }}
                                    >
                                        <XCircle className="mr-2 h-3 w-3" />
                                        Rechazar
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}

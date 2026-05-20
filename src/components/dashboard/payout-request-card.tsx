'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { requestSpeakerPayout } from '@/app/(dashboard)/dashboard/earnings/actions'

interface PayoutRequest {
    id: string
    status: string
    amount: number
    requested_at: string
    paid_at?: string | null
    payment_method?: string | null
    payment_reference?: string | null
}

interface PayoutRequestCardProps {
    availableAmount: number
    requests: PayoutRequest[]
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

export function PayoutRequestCard({ availableAmount, requests }: PayoutRequestCardProps) {
    const [isPending, startTransition] = useTransition()

    const handleRequest = () => {
        startTransition(async () => {
            const result = await requestSpeakerPayout()
            if ('error' in result && result.error) {
                toast.error(result.error)
                return
            }

            toast.success('Solicitud de retiro creada')
        })
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <WalletCards className="h-4 w-4 text-primary" />
                        Retiros
                    </CardTitle>
                    <CardDescription>Solicitud de pago manual registrada por admin</CardDescription>
                </div>
                <Button
                    onClick={handleRequest}
                    disabled={isPending || availableAmount <= 0}
                    className="w-full sm:w-auto"
                >
                    {isPending ? 'Solicitando...' : `Solicitar ${formatMXN(availableAmount)}`}
                </Button>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aun no tienes solicitudes de retiro.</p>
                ) : (
                    <div className="space-y-2">
                        {requests.slice(0, 5).map((request) => (
                            <div key={request.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-medium">{formatMXN(Number(request.amount ?? 0))}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(request.requested_at).toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {request.payment_reference && (
                                        <span className="text-xs text-muted-foreground">{request.payment_reference}</span>
                                    )}
                                    <Badge variant={request.status === 'paid' ? 'default' : 'secondary'}>
                                        {statusLabels[request.status] ?? request.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

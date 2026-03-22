'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    CreditCard,
    Calendar,
    AlertTriangle,
    ExternalLink,
    Loader2,
    Shield,
    XCircle,
} from 'lucide-react'
import type { Subscription } from '@/types/database'

interface SubscriptionStatusProps {
    subscription: Subscription | null
    hasStripeCustomer: boolean
}

export function SubscriptionStatus({ subscription, hasStripeCustomer }: SubscriptionStatusProps) {
    const [isLoadingPortal, setIsLoadingPortal] = useState(false)
    const [isLoadingCancel, setIsLoadingCancel] = useState(false)
    const [cancelConfirm, setCancelConfirm] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    if (!subscription) return null

    const isActive = subscription.status === 'active' || subscription.status === 'trialing'
    const isPastDue = subscription.status === 'past_due'
    const isCancelled = subscription.status === 'cancelled' || subscription.status === 'expired'

    const handlePortal = async () => {
        setIsLoadingPortal(true)
        try {
            const response = await fetch('/api/payments/portal', { method: 'POST' })
            const data = await response.json()

            if (!response.ok) {
                setMessage(data.error || 'Error')
                return
            }

            window.location.href = data.portalUrl
        } catch {
            setMessage('Error al abrir el portal')
        } finally {
            setIsLoadingPortal(false)
        }
    }

    const handleCancel = async () => {
        if (!cancelConfirm) {
            setCancelConfirm(true)
            return
        }

        setIsLoadingCancel(true)
        try {
            const response = await fetch('/api/payments/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ immediately: false }),
            })
            const data = await response.json()

            if (response.ok) {
                setMessage(data.message)
                setCancelConfirm(false)
                // Refresh after a short delay
                setTimeout(() => window.location.reload(), 2000)
            } else {
                setMessage(data.error || 'Error al cancelar')
            }
        } catch {
            setMessage('Error inesperado')
        } finally {
            setIsLoadingCancel(false)
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    return (
        <Card className={`${isPastDue ? 'border-yellow-500' : isCancelled ? 'border-red-500/50' : 'border-green-500/50'}`}>
            <CardContent className="pt-6 space-y-4">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isActive && <Shield className="h-5 w-5 text-green-600" />}
                        {isPastDue && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        {isCancelled && <XCircle className="h-5 w-5 text-red-500" />}
                        <span className="font-medium">
                            {subscription.status === 'trialing' && 'Período de prueba'}
                            {subscription.status === 'active' && 'Suscripción activa'}
                            {subscription.status === 'past_due' && 'Pago pendiente'}
                            {subscription.status === 'cancelled' && 'Cancelada'}
                            {subscription.status === 'expired' && 'Expirada'}
                        </span>
                    </div>
                    {subscription.cancel_at_period_end && isActive && (
                        <span className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                            Se cancela al final del período
                        </span>
                    )}
                </div>

                {/* Period info */}
                {subscription.current_period_end && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {subscription.cancel_at_period_end
                                ? `Acceso hasta: ${formatDate(subscription.current_period_end)}`
                                : `Próximo cobro: ${formatDate(subscription.current_period_end)}`
                            }
                        </span>
                    </div>
                )}

                {subscription.status === 'trialing' && subscription.trial_end && (
                    <div className="text-sm text-blue-600">
                        Tu prueba gratuita termina el {formatDate(subscription.trial_end)}
                    </div>
                )}

                {isPastDue && (
                    <div className="text-sm text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                        Tu último pago no se pudo procesar. Por favor actualiza tu método de pago para mantener tu suscripción.
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                    {hasStripeCustomer && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePortal}
                            disabled={isLoadingPortal}
                        >
                            {isLoadingPortal ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CreditCard className="mr-2 h-4 w-4" />
                            )}
                            Gestionar pagos
                            <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                    )}

                    {isActive && !subscription.cancel_at_period_end && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isLoadingCancel}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            {isLoadingCancel ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : cancelConfirm ? (
                                '¿Confirmar cancelación?'
                            ) : (
                                'Cancelar suscripción'
                            )}
                        </Button>
                    )}
                </div>

                {message && (
                    <p className="text-sm text-center text-muted-foreground">{message}</p>
                )}
            </CardContent>
        </Card>
    )
}

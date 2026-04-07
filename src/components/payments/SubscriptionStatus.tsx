'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { canCancelBillingSubscription } from '@/lib/payments/subscription-management'
import {
    AlertTriangle,
    Calendar,
    CreditCard,
    ExternalLink,
    Loader2,
    Receipt,
    Shield,
    XCircle,
} from 'lucide-react'
import type { Subscription } from '@/types/database'

interface SubscriptionStatusProps {
    subscription: Subscription | null
    hasPortalAccess: boolean
    hasPaidMembership: boolean
}

const STATUS_LABELS: Record<Subscription['status'], string> = {
    trialing: 'Periodo de prueba',
    active: 'Suscripcion activa',
    past_due: 'Pago pendiente',
    cancelled: 'Cancelada',
    expired: 'Expirada',
    paused: 'Pausada',
    incomplete: 'Pago incompleto',
}

export function SubscriptionStatus({
    subscription,
    hasPortalAccess,
    hasPaidMembership,
}: SubscriptionStatusProps) {
    const router = useRouter()
    const [isLoadingPortal, setIsLoadingPortal] = useState(false)
    const [isLoadingCancel, setIsLoadingCancel] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const isPastDue = subscription?.status === 'past_due'
    const isCancelled = subscription?.status === 'cancelled' || subscription?.status === 'expired'
    const canCancel = canCancelBillingSubscription(subscription)

    const handlePortal = async () => {
        setIsLoadingPortal(true)
        setMessage(null)

        try {
            const response = await fetch('/api/payments/portal', { method: 'POST' })
            const data = await response.json()

            if (!response.ok) {
                setMessage(data.error || 'No fue posible abrir el portal de Stripe')
                return
            }

            window.location.href = data.portalUrl
        } catch {
            setMessage('Error al abrir el portal de Stripe')
        } finally {
            setIsLoadingPortal(false)
        }
    }

    const handleCancel = async () => {
        const confirmed = window.confirm(
            'Tu suscripcion se cancelara al final del periodo actual. Mantendras el acceso hasta esa fecha. Deseas continuar?'
        )

        if (!confirmed) {
            return
        }

        setIsLoadingCancel(true)
        setMessage(null)

        try {
            const response = await fetch('/api/payments/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ immediately: false }),
            })
            const data = await response.json()

            if (!response.ok) {
                setMessage(data.error || 'Error al cancelar la suscripcion')
                return
            }

            setMessage(data.message || 'Cancelacion programada correctamente')
            setTimeout(() => router.refresh(), 900)
        } catch {
            setMessage('Error inesperado al cancelar la suscripcion')
        } finally {
            setIsLoadingCancel(false)
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Pendiente'

        return new Date(dateStr).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    const borderClass = isPastDue
        ? 'border-yellow-500/50'
        : isCancelled
            ? 'border-red-500/50'
            : 'border-brand-brown/40'

    return (
        <Card className={borderClass}>
            <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-brand-brown" />
                            Gestionar suscripcion y facturacion
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Abre Stripe para ver facturas, cambiar tu metodo de pago y administrar tu renovacion.
                        </CardDescription>
                    </div>

                    {subscription?.cancel_at_period_end && (
                        <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                            Cancelacion programada
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {subscription ? (
                    <>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border bg-background/70 p-4">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado</p>
                                <div className="mt-2 flex items-center gap-2">
                                    {!isPastDue && !isCancelled && <Shield className="h-4 w-4 text-green-600" />}
                                    {isPastDue && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                                    {isCancelled && <XCircle className="h-4 w-4 text-red-500" />}
                                    <span className="font-medium">
                                        {STATUS_LABELS[subscription.status] ?? subscription.status}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-background/70 p-4">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                    {subscription.cancel_at_period_end ? 'Acceso activo hasta' : 'Proximo cobro'}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                        {formatDate(subscription.current_period_end)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {subscription.status === 'trialing' && subscription.trial_end && (
                            <div className="rounded-lg border border-brand-yellow/40 bg-brand-yellow/10 p-3 text-sm">
                                Tu prueba termina el {formatDate(subscription.trial_end)}.
                            </div>
                        )}

                        {subscription.cancel_at_period_end && (
                            <div className="rounded-lg border border-yellow-500/30 bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                                Ya no se renovara automaticamente. Conservas el acceso hasta el final del periodo actual y despues tu estado pasara a cancelado.
                            </div>
                        )}

                        {isPastDue && (
                            <div className="rounded-lg border border-yellow-500/30 bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                                Tu ultimo pago no se pudo procesar. En el portal puedes actualizar tu metodo de pago o cancelar la suscripcion.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                        {hasPaidMembership
                            ? 'Tu acceso esta activo, pero aun no vemos el detalle de suscripcion en esta vista. Si necesitas revisar cobros o cancelar, usa el portal de Stripe.'
                            : 'Aun no tienes una suscripcion activa. Cuando contrates una membresia, aqui veras tu facturacion y opciones de gestion.'}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {hasPortalAccess && (
                        <Button
                            variant="outline"
                            onClick={handlePortal}
                            disabled={isLoadingPortal}
                        >
                            {isLoadingPortal ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CreditCard className="mr-2 h-4 w-4" />
                            )}
                            Abrir portal de Stripe
                            <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                    )}

                    {canCancel && (
                        <Button
                            variant="ghost"
                            onClick={handleCancel}
                            disabled={isLoadingCancel}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            {isLoadingCancel ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Cancelar suscripcion
                        </Button>
                    )}
                </div>

                {message && (
                    <p className="text-sm text-muted-foreground">{message}</p>
                )}
            </CardContent>
        </Card>
    )
}

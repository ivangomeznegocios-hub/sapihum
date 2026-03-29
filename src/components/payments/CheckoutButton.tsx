'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2, ExternalLink } from 'lucide-react'
import type { AICreditPackageKey } from '@/lib/payments/config'
import { collectAnalyticsEvent, getClientAnalyticsContext } from '@/lib/analytics/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface CheckoutButtonProps {
    purchaseType: 'ai_credits' | 'event_purchase' | 'formation_purchase'
    packageKey?: AICreditPackageKey
    eventId?: string
    formationId?: string
    title?: string
    label?: string
    variant?: 'default' | 'outline'
    className?: string
}

export function CheckoutButton({
    purchaseType,
    packageKey,
    eventId,
    formationId,
    title,
    label = 'Pagar',
    variant = 'default',
    className = '',
}: CheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')

    const handleCheckout = async (withGuestDetails = false) => {
        setIsLoading(true)
        setError(null)

        try {
            const funnelType = purchaseType === 'event_purchase' || purchaseType === 'formation_purchase' ? 'event' : 'ai_credits'
            
            const analyticsContext = getClientAnalyticsContext({
                funnel: funnelType,
            })

            await collectAnalyticsEvent('checkout_started', {
                properties: {
                    purchaseType,
                    packageKey: packageKey ?? null,
                    eventId: eventId ?? null,
                    formationId: formationId ?? null,
                },
                touch: {
                    funnel: funnelType,
                },
            })

            const response = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purchaseType,
                    packageKey,
                    eventId,
                    formationId,
                    analyticsContext,
                    ...(withGuestDetails ? { email, fullName } : {}),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 401 || data.requiresGuestDetails) {
                    setDialogOpen(true)
                    return
                }
                setError(data.error || 'Error al procesar')
                return
            }

            setDialogOpen(false)
            window.location.href = data.checkoutUrl
        } catch (err) {
            console.error('Checkout error:', err)
            setError('Error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGuestSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        await handleCheckout(true)
    }

    return (
        <>
            <div className="space-y-2 w-full">
                <Button
                    className={`w-full ${className}`}
                    variant={variant}
                    onClick={() => handleCheckout(false)}
                    disabled={isLoading}
                    data-analytics-cta
                    data-analytics-label={label}
                    data-analytics-funnel={purchaseType === 'event_purchase' || purchaseType === 'formation_purchase' ? 'event' : 'ai_credits'}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirigiendo a pago...
                        </>
                    ) : (
                        <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {label}
                            <ExternalLink className="ml-2 h-3 w-3" />
                        </>
                    )}
                </Button>
                {error && (
                    <p className="text-xs text-destructive text-center font-medium">{error}</p>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Compra rápida</DialogTitle>
                        <DialogDescription>
                            Usa tu correo para continuar al pago{title ? ` de ${title}` : ''}.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleGuestSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="checkout-full-name">Nombre</Label>
                            <Input
                                id="checkout-full-name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Tu nombre completo"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="checkout-email">Correo</Label>
                            <Input
                                id="checkout-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Continuar al pago
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

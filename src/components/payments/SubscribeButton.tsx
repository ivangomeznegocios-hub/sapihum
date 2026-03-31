'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2, ExternalLink } from 'lucide-react'
import type { BillingInterval } from '@/lib/payments/config'
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

interface SubscribeButtonProps {
    membershipLevel: number
    specializationCode?: string
    billingInterval?: BillingInterval
    label?: string
    title?: string
    successPath?: string
    variant?: 'default' | 'outline'
    className?: string
}

export function SubscribeButton({
    membershipLevel,
    specializationCode,
    billingInterval = 'monthly',
    label = 'Suscribirse',
    title,
    successPath = '/dashboard/subscription',
    variant = 'default',
    className = '',
}: SubscribeButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')

    const handleSubscribe = async (withGuestDetails = false) => {
        setIsLoading(true)
        setError(null)

        try {
            const analyticsContext = getClientAnalyticsContext({
                funnel: 'checkout',
                targetPlan: `level_${membershipLevel}`,
                targetSpecialization: specializationCode,
            })

            await collectAnalyticsEvent('checkout_started', {
                properties: {
                    purchaseType: 'subscription_payment',
                    membershipLevel,
                    billingInterval,
                    specializationCode: specializationCode ?? null,
                },
                touch: {
                    funnel: 'checkout',
                    targetPlan: `level_${membershipLevel}`,
                    targetSpecialization: specializationCode,
                },
            })

            const response = await fetch('/api/payments/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    membershipLevel,
                    billingInterval,
                    specializationCode,
                    analyticsContext,
                    successPath,
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
            console.error('Subscribe error:', err)
            setError('Error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGuestSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        await handleSubscribe(true)
    }

    return (
        <>
            <div className="w-full space-y-2">
                <Button
                    className={`w-full ${className}`}
                    variant={variant}
                    onClick={() => handleSubscribe(false)}
                    disabled={isLoading}
                    data-analytics-cta
                    data-analytics-label={label}
                    data-analytics-funnel="checkout"
                    data-analytics-plan={`level_${membershipLevel}`}
                    data-analytics-specialization={specializationCode ?? ''}
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
                    <p className="text-center text-xs font-medium text-destructive">{error}</p>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Continua al pago</DialogTitle>
                        <DialogDescription>
                            Usa tu correo para comprar{title ? ` ${title}` : ' tu membresia'} y activaremos tu acceso despues del cobro.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleGuestSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="subscribe-full-name">Nombre</Label>
                            <Input
                                id="subscribe-full-name"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                placeholder="Tu nombre completo"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subscribe-email">Correo</Label>
                            <Input
                                id="subscribe-email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
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
                                        Ir al checkout
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

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2, ExternalLink } from 'lucide-react'
import type { AICreditPackageKey } from '@/lib/payments/config'
import { collectAnalyticsEvent, getClientAnalyticsContext } from '@/lib/analytics/client'

interface CheckoutButtonProps {
    purchaseType: 'ai_credits' | 'event_purchase' | 'formation_purchase'
    packageKey?: AICreditPackageKey
    eventId?: string
    formationId?: string
    label?: string
    variant?: 'default' | 'outline'
    className?: string
}

export function CheckoutButton({
    purchaseType,
    packageKey,
    eventId,
    formationId,
    label = 'Pagar',
    variant = 'default',
    className = '',
}: CheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCheckout = async () => {
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
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Error al procesar')
                return
            }

            window.location.href = data.checkoutUrl
        } catch (err) {
            console.error('Checkout error:', err)
            setError('Error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-2 w-full">
            <Button
                className={`w-full ${className}`}
                variant={variant}
                onClick={handleCheckout}
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
    )
}

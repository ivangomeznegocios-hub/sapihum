'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2, ExternalLink } from 'lucide-react'
import type { BillingInterval } from '@/lib/payments/config'
import { collectAnalyticsEvent, getClientAnalyticsContext } from '@/lib/analytics/client'

interface SubscribeButtonProps {
    membershipLevel: number
    specializationCode?: string
    billingInterval?: BillingInterval
    label?: string
    variant?: 'default' | 'outline'
    className?: string
}

export function SubscribeButton({
    membershipLevel,
    specializationCode,
    billingInterval = 'monthly',
    label = 'Suscribirse',
    variant = 'default',
    className = '',
}: SubscribeButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubscribe = async () => {
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
                body: JSON.stringify({ membershipLevel, billingInterval, specializationCode, analyticsContext }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Error al procesar')
                return
            }

            // Redirect to Stripe Checkout
            window.location.href = data.checkoutUrl
        } catch (err) {
            console.error('Subscribe error:', err)
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
                onClick={handleSubscribe}
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
                <p className="text-xs text-destructive text-center font-medium">{error}</p>
            )}
        </div>
    )
}

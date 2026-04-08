'use client'

import { CheckoutButton } from '@/components/payments/CheckoutButton'
import type { AICreditPackageKey } from '@/lib/payments/config'

interface PurchaseAIButtonProps {
    minutes: number
    priceMXN: number
    label?: string
    packageKey?: AICreditPackageKey
}

export function PurchaseAIButton({
    minutes,
    label = 'Comprar Paquete',
    packageKey,
}: PurchaseAIButtonProps) {
    // Determine which package this corresponds to
    const key = packageKey || (minutes === 600 ? '10h' : minutes === 1200 ? '20h' : '10h')

    return (
        <CheckoutButton
            purchaseType="ai_credits"
            packageKey={key as AICreditPackageKey}
            label={label}
        />
    )
}

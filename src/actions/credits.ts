'use server'

/**
 * Legacy direct credit grant intentionally disabled.
 * Real purchases must go through Stripe checkout and webhook fulfillment.
 */
export async function purchaseAICredits(amountMinutes: number, priceMXN: number) {
    void amountMinutes
    void priceMXN

    return {
        success: false,
        error: 'La compra directa de creditos esta deshabilitada. Usa el checkout verificado.',
    }
}

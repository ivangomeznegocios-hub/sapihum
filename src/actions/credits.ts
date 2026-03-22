'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * LEGACY: Direct credit grant without payment verification.
 * Only use for admin adjustments. Real purchases go through
 * Stripe checkout → webhook → fulfillAICredits().
 */
export async function purchaseAICredits(amountMinutes: number, priceMXN: number) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' }
        }

        // 1. Obtener perfil actual
        const { data: profile, error: profileError } = await (supabase as any)
            .from('profiles')
            .select('ai_minutes_available')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return { success: false, error: 'Perfil no encontrado' }
        }

        const currentMinutes = (profile as any).ai_minutes_available || 0
        const newMinutes = currentMinutes + amountMinutes

        // 2. Actualizar minutos en el perfil
        const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update({ ai_minutes_available: newMinutes })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error actualizando créditos:', updateError)
            return { success: false, error: 'Error al actualizar el saldo' }
        }

        // 3. Registrar transacción
        const { error: txError } = await (supabase as any)
            .from('ai_credit_transactions')
            .insert({
                profile_id: user.id,
                amount: amountMinutes,
                transaction_type: 'purchase',
                description: `Compra de paquete de ${amountMinutes / 60} horas (Total: $${priceMXN} MXN)`
            })

        if (txError) {
            console.error('Error registrando transacción:', txError)
            // No bloqueamos el éxito porque los créditos ya se otorgaron
        }

        // 4. Revalidar rutas para reflejar cambios en la UI
        revalidatePath('/dashboard/subscription')
        revalidatePath('/dashboard/session')
        revalidatePath('/dashboard/patients')

        return { success: true }
    } catch (err) {
        console.error('Error inesperado procesando compra:', err)
        return { success: false, error: 'Error inesperado al procesar la compra' }
    }
}

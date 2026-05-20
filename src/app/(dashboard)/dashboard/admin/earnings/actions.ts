'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { supabase, user: null, error: 'No autenticado' as const }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { supabase, user, error: 'Acceso denegado' as const }
    }

    return { supabase, user, error: null }
}

// ============================================
// 1. ADMIN: GET ALL SPEAKER EARNINGS OVERVIEW
// ============================================
export async function adminGetAllSpeakerEarnings(month?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { data: null, error: 'Acceso denegado' }
    }

    const currentMonth = month || new Date().toISOString().slice(0, 7)

    // Get all earnings grouped by speaker
    const { data: earnings, error } = await (supabase
        .from('speaker_earnings') as any)
        .select(`
            id, speaker_id, earning_type, gross_amount, net_amount, amount_paid, sapihum_amount,
            status, financial_status, sale_origin, price_type, attendance_date, release_date, month_key,
            speaker:profiles!speaker_earnings_speaker_id_fkey(id, full_name, avatar_url),
            student:profiles!speaker_earnings_student_id_fkey(id, full_name),
            event:events!speaker_earnings_event_id_fkey(id, title)
        `)
        .eq('month_key', currentMonth)
        .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }

    // Group by speaker
    const speakerMap = new Map<string, any>()

    for (const earning of earnings || []) {
        const speakerId = earning.speaker_id
        if (!speakerMap.has(speakerId)) {
            speakerMap.set(speakerId, {
                speaker: earning.speaker,
                totalPending: 0,
                totalReleased: 0,
                totalVoided: 0,
                earningsCount: 0,
                earnings: [],
            })
        }

        const entry = speakerMap.get(speakerId)!
        entry.earningsCount++
        entry.earnings.push(earning)

        const financialStatus = earning.financial_status ?? (earning.status === 'released' ? 'available' : earning.status === 'voided' ? 'cancelled' : earning.status)
        switch (financialStatus) {
            case 'pending':
                entry.totalPending += Number(earning.net_amount)
                break
            case 'available':
            case 'requested':
            case 'paid':
                entry.totalReleased += Number(earning.net_amount)
                break
            case 'cancelled':
                entry.totalVoided += Number(earning.net_amount)
                break
        }
    }

    const speakers = Array.from(speakerMap.values()).map(s => ({
        ...s,
        totalPending: Math.round(s.totalPending * 100) / 100,
        totalReleased: Math.round(s.totalReleased * 100) / 100,
        totalVoided: Math.round(s.totalVoided * 100) / 100,
    }))

    // Global totals
    const globalPending = speakers.reduce((sum, s) => sum + s.totalPending, 0)
    const globalReleased = speakers.reduce((sum, s) => sum + s.totalReleased, 0)
    const globalVoided = speakers.reduce((sum, s) => sum + s.totalVoided, 0)

    return {
        data: {
            month: currentMonth,
            speakers,
            totals: {
                pending: Math.round(globalPending * 100) / 100,
                released: Math.round(globalReleased * 100) / 100,
                voided: Math.round(globalVoided * 100) / 100,
                total: Math.round((globalPending + globalReleased) * 100) / 100,
            },
        },
        error: null,
    }
}

// ============================================
// 2. ADMIN: RELEASE MATURE EARNINGS (auto or manual)
// ============================================
export async function adminReleaseEarnings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Acceso denegado' }
    }

    // Release all earnings past 30 days
    const today = new Date().toISOString().split('T')[0]

    const { data: released, error } = await (supabase
        .from('speaker_earnings') as any)
        .update({
            status: 'released',
            released_at: new Date().toISOString(),
            financial_status: 'available',
            updated_at: new Date().toISOString(),
        })
        .eq('status', 'pending')
        .eq('financial_status', 'pending')
        .is('payout_request_id', null)
        .is('paid_at', null)
        .lte('release_date', today)
        .select('id')

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin/earnings')
    revalidatePath('/dashboard/earnings')

    return { success: true, releasedCount: released?.length || 0 }
}

// ============================================
// 3. ADMIN: VOID A SPECIFIC EARNING
// ============================================
export async function adminVoidEarning(earningId: string, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Acceso denegado' }
    }

    const { error } = await (supabase.from('speaker_earnings') as any)
        .update({
            status: 'voided',
            voided_at: new Date().toISOString(),
            void_reason: reason,
            financial_status: 'cancelled',
            updated_at: new Date().toISOString(),
        })
        .eq('id', earningId)
        .in('financial_status', ['pending', 'available'])
        .is('payout_request_id', null)
        .is('paid_at', null)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin/earnings')
    revalidatePath('/dashboard/earnings')

    return { success: true }
}

// ============================================
// 4. ADMIN: EXECUTE MONTH-END CLOSE
// ============================================
export async function adminCloseMonth(month: string, notes?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Acceso denegado' }
    }

    // Check if already closed
    const { data: existing } = await (supabase.from('speaker_month_close') as any)
        .select('id')
        .eq('month_key', month)
        .single()

    if (existing) {
        return { error: `El mes ${month} ya fue cerrado` }
    }

    // First, release all mature earnings for this month
    const today = new Date().toISOString().split('T')[0]

    await (supabase.from('speaker_earnings') as any)
        .update({
            status: 'released',
            released_at: new Date().toISOString(),
            financial_status: 'available',
            updated_at: new Date().toISOString(),
        })
        .eq('status', 'pending')
        .eq('financial_status', 'pending')
        .is('payout_request_id', null)
        .is('paid_at', null)
        .eq('month_key', month)
        .lte('release_date', today)

    // Get totals
    const { data: monthEarnings } = await (supabase
        .from('speaker_earnings') as any)
        .select('status, financial_status, net_amount')
        .eq('month_key', month)

    const totals = (monthEarnings || []).reduce((acc: any, e: any) => {
        const financialStatus = e.financial_status ?? (e.status === 'released' ? 'available' : e.status === 'voided' ? 'cancelled' : e.status)
        switch (financialStatus) {
            case 'available':
            case 'requested':
            case 'paid':
                acc.released += Number(e.net_amount)
                break
            case 'pending':
                acc.pending += Number(e.net_amount)
                break
            case 'cancelled':
                acc.voided += Number(e.net_amount)
                break
        }
        return acc
    }, { released: 0, pending: 0, voided: 0 })

    // Freeze all earnings in this month
    await (supabase.from('speaker_earnings') as any)
        .update({
            is_frozen: true,
            frozen_at: new Date().toISOString(),
        })
        .eq('month_key', month)

    // Create close record
    const { error } = await (supabase.from('speaker_month_close') as any)
        .insert({
            month_key: month,
            closed_by: user.id,
            total_released: Math.round(totals.released * 100) / 100,
            total_voided: Math.round(totals.voided * 100) / 100,
            total_pending: Math.round(totals.pending * 100) / 100,
            notes: notes || null,
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin/earnings')

    return {
        success: true,
        totals: {
            released: Math.round(totals.released * 100) / 100,
            pending: Math.round(totals.pending * 100) / 100,
            voided: Math.round(totals.voided * 100) / 100,
        },
    }
}

// ============================================
// 5. ADMIN: VOID EARNING ON REFUND (called from webhook)
// ============================================
export async function voidEarningByTransaction(transactionId: string) {
    const supabase = await createClient()

    const { data: earnings, error } = await (supabase
        .from('speaker_earnings') as any)
        .update({
            status: 'voided',
            voided_at: new Date().toISOString(),
            void_reason: 'Reembolso automático detectado',
        })
        .eq('source_transaction_id', transactionId)
        .eq('status', 'pending')
        .select('id')

    if (error) return { error: error.message }

    return { success: true, voidedCount: earnings?.length || 0 }
}

// ============================================
// 6. ADMIN: ADD MANUAL EARNING / BONUS
// ============================================
export async function adminAddManualEarning(
    speakerId: string,
    amount: number,
    notes: string,
    monthKey: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Acceso denegado' }
    }

    if (!speakerId || !amount || amount <= 0) {
        return { error: 'Datos de ingreso inválidos' }
    }

    const { error } = await (supabase.from('speaker_earnings') as any)
        .insert({
            speaker_id: speakerId,
            earning_type: 'manual_bonus',
            gross_amount: amount,
            amount_paid: amount,
            sapihum_amount: 0,
            commission_rate: 1,
            compensation_type: 'fixed',
            compensation_value: amount,
            net_amount: amount,
            status: 'pending',
            financial_status: 'pending',
            sale_origin: 'manual_adjustment',
            price_type: 'manual',
            source_purchase_type: 'manual',
            locked_at: new Date().toISOString(),
            month_key: monthKey,
            description: notes || 'Bono manual admin',
            attendance_date: new Date().toISOString().split('T')[0],
            release_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })

    if (error) {
        console.error("Error adding manual earning:", error);
        return { error: `Error DB: ${error.message}` }
    }

    revalidatePath('/dashboard/admin/earnings')
    revalidatePath('/dashboard/earnings')

    return { success: true }
}

// ============================================
// 7. ADMIN: GET ALL SPEAKERS (for dropdown)
// ============================================
export async function adminGetAllSpeakers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { data: null, error: 'Acceso denegado' }
    }

    const { data, error } = await (supabase.from('profiles') as any)
        .select('id, full_name, avatar_url')
        .eq('role', 'ponente')
        .order('full_name')

    if (error) return { data: null, error: error.message }

    return { data, error: null }
}

export async function adminGetPayoutRequests() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { data: null, error: 'Acceso denegado' }
    }

    const { data, error } = await (supabase
        .from('speaker_payout_requests') as any)
        .select(`
            id, speaker_id, status, amount, requested_at, approved_at, paid_at,
            payment_method, payment_reference, admin_notes,
            speaker:profiles!speaker_payout_requests_speaker_id_fkey(id, full_name, email, avatar_url)
        `)
        .order('requested_at', { ascending: false })
        .limit(100)

    if (error) return { data: null, error: error.message }

    return { data: data ?? [], error: null }
}

export async function adminApprovePayoutRequest(requestId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Acceso denegado' }
    }

    const { error } = await (supabase
        .from('speaker_payout_requests') as any)
        .update({
            status: 'approved',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'requested')

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin/earnings')
    revalidatePath('/dashboard/earnings')
    return { success: true }
}

export async function adminRejectPayoutRequest(requestId: string, notes?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Acceso denegado' }
    }

    const { data: request } = await (supabase
        .from('speaker_payout_requests') as any)
        .select('id')
        .eq('id', requestId)
        .in('status', ['requested', 'approved'])
        .maybeSingle()

    if (!request?.id) {
        return { error: 'Solicitud no encontrada o ya cerrada' }
    }

    const { data: items } = await (supabase
        .from('speaker_payout_request_items') as any)
        .select('speaker_earning_id')
        .eq('payout_request_id', requestId)

    const earningIds = (items ?? []).map((item: any) => item.speaker_earning_id).filter(Boolean)

    if (earningIds.length > 0) {
        const { error: earningsError } = await (supabase
            .from('speaker_earnings') as any)
            .update({
                financial_status: 'available',
                requested_at: null,
                payout_request_id: null,
                updated_at: new Date().toISOString(),
            })
            .in('id', earningIds)
            .eq('financial_status', 'requested')

        if (earningsError) return { error: earningsError.message }
    }

    const { error } = await (supabase
        .from('speaker_payout_requests') as any)
        .update({
            status: 'rejected',
            admin_notes: notes ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin/earnings')
    revalidatePath('/dashboard/earnings')
    return { success: true }
}

export async function adminMarkPayoutPaid(
    requestId: string,
    paymentMethod: string,
    paymentReference: string,
    notes?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Acceso denegado' }
    }

    const { data: request } = await (supabase
        .from('speaker_payout_requests') as any)
        .select('id, status')
        .eq('id', requestId)
        .in('status', ['requested', 'approved'])
        .maybeSingle()

    if (!request?.id) {
        return { error: 'Solicitud no encontrada o ya pagada' }
    }

    const paidAt = new Date().toISOString()
    const requestUpdate: Record<string, unknown> = {
        status: 'paid',
        paid_by: user.id,
        paid_at: paidAt,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        admin_notes: notes ?? null,
        updated_at: paidAt,
    }
    if (request.status === 'requested') {
        requestUpdate.approved_by = user.id
        requestUpdate.approved_at = paidAt
    }

    const { error: requestError } = await (supabase
        .from('speaker_payout_requests') as any)
        .update(requestUpdate)
        .eq('id', requestId)

    if (requestError) return { error: requestError.message }

    const { data: items } = await (supabase
        .from('speaker_payout_request_items') as any)
        .select('speaker_earning_id')
        .eq('payout_request_id', requestId)

    const earningIds = (items ?? []).map((item: any) => item.speaker_earning_id).filter(Boolean)

    if (earningIds.length > 0) {
        const { error: earningsError } = await (supabase
            .from('speaker_earnings') as any)
            .update({
                status: 'released',
                financial_status: 'paid',
                paid_at: paidAt,
                updated_at: paidAt,
            })
            .in('id', earningIds)
            .eq('financial_status', 'requested')

        if (earningsError) return { error: earningsError.message }
    }

    revalidatePath('/dashboard/admin/earnings')
    revalidatePath('/dashboard/earnings')
    return { success: true }
}

export async function adminGetCommissionRules() {
    const { supabase, error } = await requireAdmin()
    if (error) return { data: null, error }

    const { data, error: queryError } = await (supabase
        .from('sales_commission_rules') as any)
        .select(`
            id, scope, event_id, speaker_id, sale_origin, speaker_percentage, sapihum_percentage,
            is_active, created_at, updated_at,
            event:events!sales_commission_rules_event_id_fkey(id, title),
            speaker:profiles!sales_commission_rules_speaker_id_fkey(id, full_name, email)
        `)
        .order('scope', { ascending: true })
        .order('updated_at', { ascending: false })

    if (queryError) return { data: null, error: queryError.message }

    return { data: data ?? [], error: null }
}

export async function adminUpsertCommissionRule(params: {
    scope: 'global' | 'event' | 'speaker_event'
    saleOrigin: 'speaker_direct' | 'sapihum_channel' | 'manual_adjustment'
    speakerPercentage: number
    eventId?: string | null
    speakerId?: string | null
}) {
    const { supabase, user, error } = await requireAdmin()
    if (error || !user) return { error }

    const speakerPercentage = Number(params.speakerPercentage)
    if (!Number.isFinite(speakerPercentage) || speakerPercentage < 0 || speakerPercentage > 1) {
        return { error: 'Porcentaje invalido. Usa decimal: 0.8 = 80%' }
    }

    if (params.scope === 'event' && !params.eventId) {
        return { error: 'Selecciona evento para una regla por evento' }
    }

    if (params.scope === 'speaker_event' && (!params.eventId || !params.speakerId)) {
        return { error: 'Selecciona evento y ponente para una regla personalizada' }
    }

    let deactivateQuery = (supabase
        .from('sales_commission_rules') as any)
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq('scope', params.scope)
        .eq('sale_origin', params.saleOrigin)
        .eq('is_active', true)

    if (params.scope === 'global') {
        deactivateQuery = deactivateQuery.is('event_id', null).is('speaker_id', null)
    } else if (params.scope === 'event') {
        deactivateQuery = deactivateQuery.eq('event_id', params.eventId).is('speaker_id', null)
    } else {
        deactivateQuery = deactivateQuery.eq('event_id', params.eventId).eq('speaker_id', params.speakerId)
    }

    const { error: deactivateError } = await deactivateQuery

    if (deactivateError) return { error: deactivateError.message }

    const { error: insertError } = await (supabase
        .from('sales_commission_rules') as any)
        .insert({
            scope: params.scope,
            event_id: params.scope === 'global' ? null : params.eventId ?? null,
            speaker_id: params.scope === 'speaker_event' ? params.speakerId ?? null : null,
            sale_origin: params.saleOrigin,
            speaker_percentage: speakerPercentage,
            sapihum_percentage: Math.round((1 - speakerPercentage) * 1_000_000) / 1_000_000,
            created_by: user.id,
        })

    if (insertError) return { error: insertError.message }

    revalidatePath('/dashboard/admin/earnings')
    return { success: true }
}

export async function adminDeactivateCommissionRule(ruleId: string) {
    const { supabase, error } = await requireAdmin()
    if (error) return { error }

    const { error: updateError } = await (supabase
        .from('sales_commission_rules') as any)
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId)

    if (updateError) return { error: updateError.message }

    revalidatePath('/dashboard/admin/earnings')
    return { success: true }
}

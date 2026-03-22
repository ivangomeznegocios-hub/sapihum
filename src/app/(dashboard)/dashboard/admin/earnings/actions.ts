'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
            id, speaker_id, earning_type, gross_amount, net_amount,
            status, attendance_date, release_date, month_key,
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

        switch (earning.status) {
            case 'pending':
                entry.totalPending += Number(earning.net_amount)
                break
            case 'released':
                entry.totalReleased += Number(earning.net_amount)
                break
            case 'voided':
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
        })
        .eq('status', 'pending')
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
        })
        .eq('id', earningId)
        .eq('status', 'pending') // Can only void pending earnings

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
        })
        .eq('status', 'pending')
        .eq('month_key', month)
        .lte('release_date', today)

    // Get totals
    const { data: monthEarnings } = await (supabase
        .from('speaker_earnings') as any)
        .select('status, net_amount')
        .eq('month_key', month)

    const totals = (monthEarnings || []).reduce((acc: any, e: any) => {
        switch (e.status) {
            case 'released':
                acc.released += Number(e.net_amount)
                break
            case 'pending':
                acc.pending += Number(e.net_amount)
                break
            case 'voided':
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

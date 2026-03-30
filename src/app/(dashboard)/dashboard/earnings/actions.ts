'use server'

import { createClient } from '@/lib/supabase/server'
import {
    formatSpeakerCompensationLabel,
    upsertAutomaticEventSpeakerEarnings,
} from '@/lib/earnings/compensation'
import type { SpeakerFinancialSummary } from '@/types/database'

// ============================================
// POOL & CONSTANTS
// ============================================
const POOL_PER_USER = 110.00 // MXN monthly pool per user
const RELEASE_DAYS = 30
const ATTENDANCE_THRESHOLD = 0.90 // 90% permanence required

// ============================================
// 1. GET SPEAKER FINANCIAL SUMMARY
// ============================================
export async function getSpeakerFinancialSummary(): Promise<{ data: SpeakerFinancialSummary | null; error: string | null }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    // Verify ponente or admin role
    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['ponente', 'admin'].includes(profile.role)) {
        return { data: null, error: 'Sin permisos' }
    }

    // Get all earnings for this speaker
    const { data: earnings, error } = await (supabase
        .from('speaker_earnings') as any)
        .select('gross_amount, net_amount, status, month_key')
        .eq('speaker_id', user.id)

    if (error) return { data: null, error: error.message }

    const allEarnings = earnings || []

    const totalAccumulated = allEarnings
        .filter((e: any) => e.status !== 'voided')
        .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

    const availableForPayment = allEarnings
        .filter((e: any) => e.status === 'released')
        .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

    const pendingAmount = allEarnings
        .filter((e: any) => e.status === 'pending')
        .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

    const voidedAmount = allEarnings
        .filter((e: any) => e.status === 'voided')
        .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

    // Current month earnings
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const currentMonthEarnings = allEarnings
        .filter((e: any) => e.month_key === currentMonth && e.status !== 'voided')
        .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

    // Unique students and events
    const { data: studentCount } = await (supabase
        .from('speaker_earnings') as any)
        .select('student_id')
        .eq('speaker_id', user.id)

    const uniqueStudents = new Set((studentCount || []).map((e: any) => e.student_id).filter(Boolean)).size

    const { data: eventCount } = await (supabase
        .from('speaker_earnings') as any)
        .select('event_id')
        .eq('speaker_id', user.id)

    const uniqueEvents = new Set((eventCount || []).map((e: any) => e.event_id).filter(Boolean)).size

    // Next payment date: last day of current month
    const now = new Date()
    const nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    return {
        data: {
            totalAccumulated: Math.round(totalAccumulated * 100) / 100,
            availableForPayment: Math.round(availableForPayment * 100) / 100,
            pendingAmount: Math.round(pendingAmount * 100) / 100,
            voidedAmount: Math.round(voidedAmount * 100) / 100,
            nextPaymentDate,
            currentMonthEarnings: Math.round(currentMonthEarnings * 100) / 100,
            totalStudents: uniqueStudents,
            totalEvents: uniqueEvents,
        },
        error: null,
    }
}

// ============================================
// 2. GET EARNINGS HISTORY (paginated by month)
// ============================================
export async function getSpeakerEarningsHistory(month?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    let query = (supabase
        .from('speaker_earnings') as any)
        .select(`
            id, earning_type, gross_amount, commission_rate, compensation_type, compensation_value, net_amount,
            status, attendance_date, release_date, released_at, voided_at,
            void_reason, month_key, created_at,
            student:profiles!speaker_earnings_student_id_fkey(id, full_name, avatar_url),
            event:events!speaker_earnings_event_id_fkey(id, title, start_time)
        `)
        .eq('speaker_id', user.id)
        .order('attendance_date', { ascending: false })

    if (month) {
        query = query.eq('month_key', month)
    }

    const { data, error } = await query.limit(100)

    if (error) return { data: null, error: error.message }

    return { data: data || [], error: null }
}

// ============================================
// 3. GET SPEAKER COURSES (events with links)
// ============================================
export async function getSpeakerCourses() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    const { data: events, error } = await (supabase
        .from('events') as any)
        .select(`
            id, title, description, start_time, end_time, status,
            meeting_link, recording_url, recording_available_days,
            price, member_price, image_url, event_type, category, subcategory
        `)
        .eq('created_by', user.id)
        .order('start_time', { ascending: false })

    if (error) return { data: null, error: error.message }

    // Check recording expiry (20 days from event end)
    const eventsWithExpiry = (events || []).map((event: any) => {
        let recording_expired = false
        if (event.recording_url && event.end_time) {
            const endDate = new Date(event.end_time)
            const expiryDate = new Date(endDate.getTime() + (event.recording_available_days || 20) * 24 * 60 * 60 * 1000)
            recording_expired = new Date() > expiryDate
        }
        return { ...event, recording_expired }
    })

    // Get attendee counts
    const eventsWithCounts = []
    for (const event of eventsWithExpiry) {
        const { count } = await (supabase
            .from('event_registrations') as any)
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'registered')

        eventsWithCounts.push({ ...event, attendee_count: count || 0 })
    }

    return { data: eventsWithCounts, error: null }
}

// ============================================
// 4. GET SPEAKER STUDENTS (enrolled + attendance + payment status)
// ============================================
export async function getSpeakerStudents(eventId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    // Get events created by this speaker
    let eventsQuery = (supabase.from('events') as any)
        .select('id')
        .eq('created_by', user.id)

    if (eventId) {
        eventsQuery = eventsQuery.eq('id', eventId)
    }

    const { data: speakerEvents } = await eventsQuery
    if (!speakerEvents || speakerEvents.length === 0) {
        return { data: [], error: null }
    }

    const eventIds = speakerEvents.map((e: any) => e.id)

    // Get registrations with student profiles
    const { data: registrations, error } = await (supabase
        .from('event_registrations') as any)
        .select(`
            id, event_id, status, registered_at, attended_at,
            student:profiles!event_registrations_user_id_fkey(id, full_name, avatar_url, email)
        `)
        .in('event_id', eventIds)
        .order('registered_at', { ascending: false })

    if (error) return { data: null, error: error.message }

    // Enrich with attendance and earning data
    const enrichedStudents = []
    for (const reg of registrations || []) {
        // Get attendance log
        const { data: attendance } = await (supabase
            .from('speaker_attendance_log') as any)
            .select('attendance_percentage, qualifies, duration_minutes')
            .eq('event_id', reg.event_id)
            .eq('student_id', reg.student?.id)
            .single()

        // Get earning status
        const { data: earning } = await (supabase
            .from('speaker_earnings') as any)
            .select('status, net_amount, release_date')
            .eq('event_id', reg.event_id)
            .eq('student_id', reg.student?.id)
            .eq('speaker_id', user.id)
            .single()

        // Get event title
        const { data: eventData } = await (supabase
            .from('events') as any)
            .select('title, start_time')
            .eq('id', reg.event_id)
            .single()

        enrichedStudents.push({
            ...reg,
            event_title: eventData?.title || '',
            event_start: eventData?.start_time || '',
            attendance_percentage: attendance?.attendance_percentage || null,
            attendance_qualifies: attendance?.qualifies || false,
            duration_minutes: attendance?.duration_minutes || null,
            earning_status: earning?.status || null,
            earning_amount: earning?.net_amount || null,
            earning_release_date: earning?.release_date || null,
        })
    }

    return { data: enrichedStudents, error: null }
}

// ============================================
// 5. RECORD ATTENDANCE (validates 90% rule)
// ============================================
export async function recordAttendance(
    eventId: string,
    studentId: string,
    joinTime: string,
    leaveTime: string,
    source: string = 'manual'
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    // Verify permission (admin or event creator)
    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    const { data: event } = await (supabase.from('events') as any)
        .select('id, created_by, start_time, end_time')
        .eq('id', eventId)
        .single()

    if (!event) return { error: 'Evento no encontrado' }

    if (event.created_by !== user.id && profile?.role !== 'admin') {
        return { error: 'Sin permisos para registrar asistencia' }
    }

    // Calculate durations
    const joinDate = new Date(joinTime)
    const leaveDate = new Date(leaveTime)
    const durationMinutes = Math.round((leaveDate.getTime() - joinDate.getTime()) / (1000 * 60))

    const sessionStart = new Date(event.start_time)
    const sessionEnd = event.end_time ? new Date(event.end_time) : new Date(sessionStart.getTime() + 60 * 60 * 1000) // default 1h
    const sessionDurationMinutes = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60))

    const attendancePercentage = sessionDurationMinutes > 0
        ? Math.round((durationMinutes / sessionDurationMinutes) * 10000) / 100
        : 0

    const qualifies = attendancePercentage >= (ATTENDANCE_THRESHOLD * 100)

    // Upsert attendance log
    const { data: attendanceLog, error: attError } = await (supabase
        .from('speaker_attendance_log') as any)
        .upsert({
            event_id: eventId,
            student_id: studentId,
            join_time: joinTime,
            leave_time: leaveTime,
            duration_minutes: durationMinutes,
            session_duration_minutes: sessionDurationMinutes,
            attendance_percentage: attendancePercentage,
            qualifies,
            source,
        }, { onConflict: 'event_id,student_id' })
        .select('id')
        .single()

    if (attError) return { error: attError.message }

    // If qualifies, create/update earning record
    if (qualifies) {
        // Calculate the prorated earning
        // Count total events this student attended this month
        const currentMonth = new Date().toISOString().slice(0, 7)
        const { count: totalStudentEvents } = await (supabase
            .from('speaker_attendance_log') as any)
            .select('*', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('qualifies', true)

        const totalEvents = totalStudentEvents || 1
        const grossAmount = Math.round((POOL_PER_USER / totalEvents) * 100) / 100

        const today = new Date()
        const attendanceDate = today.toISOString().split('T')[0]
        const releaseDate = new Date(today.getTime() + RELEASE_DAYS * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0]

        try {
            await upsertAutomaticEventSpeakerEarnings({
                supabase,
                eventId,
                studentId,
                grossAmount,
                earningType: 'membership_proration',
                attendanceDate,
                releaseDate,
                monthKey: currentMonth,
                attendanceLogId: attendanceLog.id,
            })
        } catch (earningError: any) {
            return { error: earningError?.message || 'No se pudo registrar la ganancia del ponente' }
        }
    }

    return {
        success: true,
        qualifies,
        attendancePercentage,
        durationMinutes,
    }
}

// ============================================
// 6. RECORD PREMIUM COMMISSION (direct sale)
// ============================================
export async function recordPremiumCommission(
    eventId: string,
    studentId: string,
    coursePrice: number,
    transactionId?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    // Verify admin
    const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Solo admins pueden registrar comisiones premium' }
    }

    // Get event and speaker info
    const { data: event } = await (supabase.from('events') as any)
        .select('id, created_by')
        .eq('id', eventId)
        .single()

    if (!event) return { error: 'Evento no encontrado' }

    const today = new Date()
    const attendanceDate = today.toISOString().split('T')[0]
    const releaseDate = new Date(today.getTime() + RELEASE_DAYS * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

    try {
        const result = await upsertAutomaticEventSpeakerEarnings({
            supabase,
            eventId,
            studentId,
            grossAmount: coursePrice,
            earningType: 'premium_commission',
            attendanceDate,
            releaseDate,
            monthKey: today.toISOString().slice(0, 7),
            sourceTransactionId: transactionId || null,
        })

        return {
            success: true,
            appliedCount: result.applied.length,
            skippedManualCount: result.skippedManual.length,
        }
    } catch (error: any) {
        return { error: error?.message || 'No se pudo registrar la comision premium' }
    }
}

// ============================================
// 7. DOWNLOAD EARNINGS REPORT (CSV data)
// ============================================
export async function getEarningsReportData(month: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    const { data: earnings, error } = await (supabase
        .from('speaker_earnings') as any)
        .select(`
            id, earning_type, gross_amount, commission_rate, compensation_type, compensation_value, net_amount,
            status, attendance_date, release_date, month_key,
            student:profiles!speaker_earnings_student_id_fkey(full_name),
            event:events!speaker_earnings_event_id_fkey(title)
        `)
        .eq('speaker_id', user.id)
        .eq('month_key', month)
        .order('attendance_date', { ascending: true })

    if (error) return { data: null, error: error.message }

    // Transform to CSV-ready format
    const csvRows = (earnings || []).map((e: any) => ({
        alumno: e.student?.full_name || 'N/A',
        evento: e.event?.title || 'N/A',
        tipo: e.earning_type === 'membership_proration' ? 'Membresía (Prorrateo)' : e.earning_type === 'premium_commission' ? 'Programa Premium' : 'Manual / Bono',
        monto_bruto: e.gross_amount,
        esquema_pago: formatSpeakerCompensationLabel(
            e.compensation_type,
            e.compensation_value,
            e.commission_rate
        ),
        monto_neto: e.net_amount,
        estado: e.status === 'pending' ? 'Pendiente' : e.status === 'released' ? 'Liberado' : 'Anulado',
        fecha_asistencia: e.attendance_date,
        fecha_liberacion: e.release_date,
    }))

    return { data: csvRows, error: null }
}

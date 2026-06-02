'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
    formatSpeakerCompensationLabel,
    upsertAutomaticEventSpeakerEarnings,
} from '@/lib/earnings/compensation'
import { isSpeakerCommerceEngineEnabled, isSpeakerPayoutRequestsEnabled } from '@/lib/earnings/speaker-commerce'
import { getSubscriptionPlan } from '@/lib/payments/config'
import type { SpeakerFinancialSummary } from '@/types/database'
import { revalidatePath } from 'next/cache'

// ============================================
// POOL & CONSTANTS
// ============================================
const MEMBERSHIP_SPEAKER_POOL_RATE = 0.50
const RELEASE_DAYS = 30
const ATTENDANCE_THRESHOLD = 0.90 // 90% permanence required

function roundCurrency(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

function getMonthRange(monthKey: string) {
    const [year, month] = monthKey.split('-').map(Number)
    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 1))

    return {
        start: start.toISOString(),
        end: end.toISOString(),
    }
}

async function getActiveMembershipForProration(supabase: any, studentId: string) {
    const { data: subscription } = await (supabase
        .from('subscriptions') as any)
        .select('id, membership_level, specialization_code, status, current_period_end')
        .eq('profile_id', studentId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (subscription?.id) {
        return subscription
    }

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('id, membership_level, membership_specialization_code, subscription_status')
        .eq('id', studentId)
        .maybeSingle()

    if (!profile || Number(profile.membership_level ?? 0) <= 0) {
        return null
    }

    if (profile.subscription_status && !['active', 'trialing'].includes(profile.subscription_status)) {
        return null
    }

    return {
        id: null,
        membership_level: Number(profile.membership_level ?? 0),
        specialization_code: profile.membership_specialization_code ?? null,
        status: profile.subscription_status ?? 'profile_legacy',
        current_period_end: null,
    }
}

async function hasMembershipEventAccess(params: {
    supabase: any
    eventId: string
    studentId: string
}) {
    const { data } = await (params.supabase
        .from('event_entitlements') as any)
        .select('id')
        .eq('event_id', params.eventId)
        .eq('user_id', params.studentId)
        .eq('source_type', 'membership')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()

    return Boolean(data?.id)
}

async function countQualifiedMembershipEventsForStudent(params: {
    supabase: any
    studentId: string
    monthKey: string
}) {
    const { start, end } = getMonthRange(params.monthKey)
    const { data: attendanceRows } = await (params.supabase
        .from('speaker_attendance_log') as any)
        .select('event_id')
        .eq('student_id', params.studentId)
        .eq('qualifies', true)
        .gte('created_at', start)
        .lt('created_at', end)

    const eventIds = Array.from(new Set((attendanceRows ?? [])
        .map((row: any) => row.event_id)
        .filter(Boolean)))

    if (eventIds.length === 0) {
        return 1
    }

    const { data: entitlementRows } = await (params.supabase
        .from('event_entitlements') as any)
        .select('event_id')
        .eq('user_id', params.studentId)
        .eq('source_type', 'membership')
        .eq('status', 'active')
        .in('event_id', eventIds)

    const membershipEventIds = new Set((entitlementRows ?? []).map((row: any) => row.event_id))
    return Math.max(membershipEventIds.size, 1)
}

async function getSpeakerIdsForMembershipEvent(params: {
    supabase: any
    eventId: string
}) {
    const { data: linkedSpeakers } = await (params.supabase
        .from('event_speakers') as any)
        .select('speaker_id, display_order')
        .eq('event_id', params.eventId)
        .order('display_order', { ascending: true })

    const speakerIds = (linkedSpeakers ?? [])
        .map((row: any) => row.speaker_id)
        .filter((speakerId: unknown): speakerId is string => typeof speakerId === 'string' && speakerId.length > 0)

    if (speakerIds.length > 0) {
        return Array.from(new Set(speakerIds))
    }

    const { data: event } = await (params.supabase
        .from('events') as any)
        .select('created_by')
        .eq('id', params.eventId)
        .maybeSingle()

    if (!event?.created_by) {
        return []
    }

    const { data: speaker } = await (params.supabase
        .from('speakers') as any)
        .select('id')
        .eq('id', event.created_by)
        .maybeSingle()

    return speaker?.id ? [speaker.id] : []
}

async function upsertMembershipProrationEarnings(params: {
    supabase: any
    eventId: string
    studentId: string
    attendanceDate: string
    releaseDate: string
    monthKey: string
    attendanceLogId: string
}) {
    const hasMembershipAccess = await hasMembershipEventAccess({
        supabase: params.supabase,
        eventId: params.eventId,
        studentId: params.studentId,
    })

    if (!hasMembershipAccess) {
        return { applied: [], skippedReason: 'not_membership_access' as const }
    }

    const membership = await getActiveMembershipForProration(params.supabase, params.studentId)
    if (!membership) {
        return { applied: [], skippedReason: 'inactive_membership' as const }
    }

    const plan = getSubscriptionPlan(
        Number(membership.membership_level ?? 0),
        membership.specialization_code ?? null
    )

    if (!plan || plan.monthly.amount <= 0) {
        return { applied: [], skippedReason: 'missing_plan' as const }
    }

    const totalMembershipEvents = await countQualifiedMembershipEventsForStudent({
        supabase: params.supabase,
        studentId: params.studentId,
        monthKey: params.monthKey,
    })
    const speakerIds = await getSpeakerIdsForMembershipEvent({
        supabase: params.supabase,
        eventId: params.eventId,
    })

    if (speakerIds.length === 0) {
        return { applied: [], skippedReason: 'missing_speaker' as const }
    }

    const monthlyMembershipAmount = Number(plan.monthly.amount)
    const allocatedEventRevenue = roundCurrency(monthlyMembershipAmount / totalMembershipEvents)
    const speakerPoolForEvent = roundCurrency(allocatedEventRevenue * MEMBERSHIP_SPEAKER_POOL_RATE)
    const speakerNetAmount = roundCurrency(speakerPoolForEvent / speakerIds.length)
    const speakerCommissionRate = allocatedEventRevenue > 0
        ? roundCurrency(speakerNetAmount / allocatedEventRevenue)
        : 0
    const now = new Date().toISOString()

    for (const speakerId of speakerIds) {
        await (params.supabase.from('speaker_earnings') as any)
            .upsert({
                speaker_id: speakerId,
                event_id: params.eventId,
                student_id: params.studentId,
                earning_type: 'membership_proration',
                gross_amount: allocatedEventRevenue,
                amount_paid: 0,
                sapihum_amount: roundCurrency(allocatedEventRevenue - speakerNetAmount),
                commission_rate: speakerCommissionRate,
                compensation_type: 'percentage',
                compensation_value: speakerCommissionRate,
                net_amount: speakerNetAmount,
                status: 'pending',
                financial_status: 'pending',
                sale_origin: 'sapihum_channel',
                price_type: 'member',
                attributed_speaker_id: speakerId,
                attendance_date: params.attendanceDate,
                release_date: params.releaseDate,
                attendance_log_id: params.attendanceLogId,
                month_key: params.monthKey,
                description: 'Prorrateo por contenido incluido en membresia',
                locked_at: now,
                commission_snapshot: {
                    model: 'membership_proration',
                    membershipLevel: membership.membership_level,
                    specializationCode: membership.specialization_code ?? null,
                    planMonthlyAmount: monthlyMembershipAmount,
                    speakerPoolRate: MEMBERSHIP_SPEAKER_POOL_RATE,
                    qualifiedMembershipEventsInMonth: totalMembershipEvents,
                    allocatedEventRevenue,
                    speakerPoolForEvent,
                    speakerCount: speakerIds.length,
                    speakerNetAmount,
                    calculatedAt: now,
                },
            }, { onConflict: 'speaker_id,event_id,student_id' })
    }

    return {
        applied: speakerIds.map((speakerId) => ({ speakerId, netAmount: speakerNetAmount })),
        skippedReason: null,
    }
}

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
        .select('gross_amount, net_amount, status, financial_status, month_key')
        .eq('speaker_id', user.id)

    if (error) return { data: null, error: error.message }

    const allEarnings = earnings || []

    const totalAccumulated = allEarnings
        .filter((e: any) => e.status !== 'voided' && e.financial_status !== 'cancelled')
        .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

    const availableForPayment = allEarnings
        .filter((e: any) => e.financial_status === 'available' || (e.financial_status == null && e.status === 'released'))
        .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

    const pendingAmount = allEarnings
        .filter((e: any) => e.financial_status === 'pending' || (e.financial_status == null && e.status === 'pending'))
        .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

    const voidedAmount = allEarnings
        .filter((e: any) => e.status === 'voided' || e.financial_status === 'cancelled')
        .reduce((sum: number, e: any) => sum + Number(e.net_amount), 0)

    // Current month earnings
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const currentMonthEarnings = allEarnings
        .filter((e: any) => e.month_key === currentMonth && e.status !== 'voided' && e.financial_status !== 'cancelled')
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
            void_reason, month_key, created_at, sale_origin, price_type, amount_paid, sapihum_amount,
            financial_status, requested_at, paid_at,
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

    const { data: ownedEvents, error: ownedError } = await (supabase
        .from('events') as any)
        .select(`
            id, slug, title, description, start_time, end_time, status,
            meeting_link, recording_url, recording_available_days,
            price, member_price, member_access_type, image_url, event_type, category, subcategory
        `)
        .eq('created_by', user.id)
        .order('start_time', { ascending: false })

    if (ownedError) return { data: null, error: ownedError.message }

    const { data: assignedRows } = await (supabase
        .from('event_speakers') as any)
        .select(`
            event:events!event_speakers_event_id_fkey(
                id, slug, title, description, start_time, end_time, status,
                meeting_link, recording_url, recording_available_days,
                price, member_price, member_access_type, image_url, event_type, category, subcategory
            )
        `)
        .eq('speaker_id', user.id)

    const eventsById = new Map<string, any>()
    for (const event of ownedEvents ?? []) {
        eventsById.set(event.id, event)
    }
    for (const row of assignedRows ?? []) {
        if (row.event?.id) {
            eventsById.set(row.event.id, row.event)
        }
    }
    const events = Array.from(eventsById.values())
        .sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

    // Check recording expiry (20 days from event end)
    const eventsWithExpiry = events.map((event: any) => {
        let recording_expired = false
        if (event.recording_url && event.end_time) {
            const endDate = new Date(event.end_time)
            const expiryDate = new Date(endDate.getTime() + (event.recording_available_days || 20) * 24 * 60 * 60 * 1000)
            recording_expired = new Date() > expiryDate
        }
        return { ...event, recording_expired }
    })

    const db = createServiceClient()
    const eventIds = eventsWithExpiry.map((event: any) => event.id)
    const { data: existingLinks } = eventIds.length > 0
        ? await (db.from('event_speaker_sales_links') as any)
            .select('id, event_id, code, is_active')
            .eq('speaker_id', user.id)
            .in('event_id', eventIds)
        : { data: [] }

    const linkByEvent = new Map<string, any>((existingLinks ?? []).map((link: any) => [link.event_id, link]))

    if (isSpeakerCommerceEngineEnabled()) {
        for (const event of eventsWithExpiry) {
            if (linkByEvent.has(event.id)) continue

            const { data: insertedLink } = await (db.from('event_speaker_sales_links') as any)
                .insert({
                    event_id: event.id,
                    speaker_id: user.id,
                })
                .select('id, event_id, code, is_active')
                .single()

            if (insertedLink?.event_id) {
                linkByEvent.set(insertedLink.event_id, insertedLink)
            }
        }
    }

    // Get attendee counts
    const eventsWithCounts = []
    for (const event of eventsWithExpiry) {
        const { count } = await (supabase
            .from('event_registrations') as any)
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'registered')

        const salesLink = linkByEvent.get(event.id)
        eventsWithCounts.push({
            ...event,
            attendee_count: count || 0,
            sales_link_code: salesLink?.code ?? null,
            sales_link_active: salesLink?.is_active ?? false,
            direct_commission_rate: 0.8,
            sapihum_commission_rate: 0.5,
        })
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

    let eventsQuery = (supabase.from('events') as any)
        .select('id')
        .eq('created_by', user.id)

    if (eventId) {
        eventsQuery = eventsQuery.eq('id', eventId)
    }

    const { data: speakerEvents } = await eventsQuery
    const { data: assignedRows } = await (supabase
        .from('event_speakers') as any)
        .select('event_id')
        .eq('speaker_id', user.id)

    const eventIds = Array.from(new Set([
        ...(speakerEvents ?? []).map((event: any) => event.id),
        ...(assignedRows ?? []).map((row: any) => row.event_id),
    ].filter(Boolean)))

    if (eventId && !eventIds.includes(eventId)) {
        return { data: [], error: null }
    }

    if (eventIds.length === 0) {
        return { data: [], error: null }
    }

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
            .select('status, financial_status, net_amount, release_date, sale_origin, amount_paid')
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
            earning_financial_status: earning?.financial_status || null,
            earning_sale_origin: earning?.sale_origin || null,
            earning_amount_paid: earning?.amount_paid || null,
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
        const currentMonth = new Date().toISOString().slice(0, 7)
        const today = new Date()
        const attendanceDate = today.toISOString().split('T')[0]
        const releaseDate = new Date(today.getTime() + RELEASE_DAYS * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0]

        try {
            await upsertMembershipProrationEarnings({
                supabase: createServiceClient(),
                eventId,
                studentId,
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
            status, financial_status, sale_origin, price_type, amount_paid, sapihum_amount,
            attendance_date, release_date, month_key,
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
        monto_pagado: e.amount_paid ?? e.gross_amount,
        origen_venta: e.sale_origin === 'speaker_direct' ? 'Link ponente' : e.sale_origin === 'manual_adjustment' ? 'Ajuste manual' : 'Canal SAPIHUM',
        tipo_precio: e.price_type === 'member' ? 'Miembro' : e.price_type === 'manual' ? 'Manual' : 'Publico',
        esquema_pago: formatSpeakerCompensationLabel(
            e.compensation_type,
            e.compensation_value,
            e.commission_rate
        ),
        monto_neto: e.net_amount,
        sapihum: e.sapihum_amount ?? Math.max(Number(e.gross_amount ?? 0) - Number(e.net_amount ?? 0), 0),
        estado: e.financial_status === 'available' || e.status === 'released'
            ? 'Disponible'
            : e.financial_status === 'requested'
                ? 'Solicitada'
                : e.financial_status === 'paid'
                    ? 'Pagada'
                    : e.financial_status === 'cancelled' || e.status === 'voided'
                        ? 'Cancelada'
                        : 'Pendiente',
        fecha_asistencia: e.attendance_date,
        fecha_liberacion: e.release_date,
    }))

    return { data: csvRows, error: null }
}

export async function getSpeakerPayoutRequests() {
    if (!isSpeakerPayoutRequestsEnabled()) {
        return { data: [], error: null }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: 'No autenticado' }

    const { data, error } = await (supabase
        .from('speaker_payout_requests') as any)
        .select('id, status, amount, requested_at, approved_at, paid_at, payment_method, payment_reference, admin_notes')
        .eq('speaker_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(20)

    if (error) return { data: null, error: error.message }

    return { data: data ?? [], error: null }
}

export async function requestSpeakerPayout() {
    if (!isSpeakerPayoutRequestsEnabled()) {
        return { error: 'Las solicitudes de retiro aun no estan habilitadas' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const db = createServiceClient()
    const { data: availableEarnings, error: earningsError } = await (db
        .from('speaker_earnings') as any)
        .select('id, net_amount')
        .eq('speaker_id', user.id)
        .eq('financial_status', 'available')
        .gt('net_amount', 0)
        .is('payout_request_id', null)
        .is('paid_at', null)

    if (earningsError) return { error: earningsError.message }

    const items = availableEarnings ?? []
    const amount = Math.round(items.reduce((sum: number, item: any) => sum + Number(item.net_amount ?? 0), 0) * 100) / 100

    if (items.length === 0 || amount <= 0) {
        return { error: 'No hay saldo disponible para solicitar retiro' }
    }

    const { data: request, error: requestError } = await (db
        .from('speaker_payout_requests') as any)
        .insert({
            speaker_id: user.id,
            amount,
            status: 'requested',
        })
        .select('id')
        .single()

    if (requestError) return { error: requestError.message }

    const payoutItems = items.map((item: any) => ({
        payout_request_id: request.id,
        speaker_earning_id: item.id,
        amount: Number(item.net_amount ?? 0),
    }))

    const { error: itemError } = await (db
        .from('speaker_payout_request_items') as any)
        .insert(payoutItems)

    if (itemError) return { error: itemError.message }

    const { error: updateError } = await (db
        .from('speaker_earnings') as any)
        .update({
            financial_status: 'requested',
            requested_at: new Date().toISOString(),
            payout_request_id: request.id,
            updated_at: new Date().toISOString(),
        })
        .in('id', items.map((item: any) => item.id))

    if (updateError) return { error: updateError.message }

    revalidatePath('/dashboard/earnings')
    return { success: true, payoutRequestId: request.id, amount }
}

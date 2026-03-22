import { createClient } from '@/lib/supabase/server'
import { getPlanByPriceId } from '@/lib/payments/config'

export async function getAnalytics() {
    const supabase = await createClient()

    // 0. Get Admin Settings
    const { data: adminSettings } = await (supabase
        .from('admin_settings') as any)
        .select('*')
        .eq('id', 'default')
        .single()
        
    const cacAmount = adminSettings?.cac_amount || 0
    const grossMarginPercent = adminSettings?.gross_margin_percent || 85.00

    // 0.5 Get Test Users
    const { data: testUsersData } = await (supabase
        .from('profiles') as any)
        .select('id')
        .eq('is_test', true)
        
    const testUserIds = (testUsersData || []).map((u: any) => u.id)
    
    const applyTestFilter = (query: any, column: string = 'user_id') => {
        if (testUserIds.length > 0) {
            return query.not(column, 'in', `(${testUserIds.join(',')})`)
        }
        return query
    }

    // 1. Total Appointments
    const { count: totalAppointments } = await applyTestFilter(
        (supabase.from('appointments') as any).select('*', { count: 'exact', head: true }),
        'patient_id'
    )

    // 2. Completed Appointments
    const { count: completedAppointments } = await applyTestFilter(
        (supabase.from('appointments') as any).select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        'patient_id'
    )

    // 3. Total Users
    const { count: totalUsers } = await (supabase
        .from('profiles') as any)
        .select('*', { count: 'exact', head: true })
        .eq('is_test', false)

    // 4. Total Events
    const { count: totalEvents } = await (supabase
        .from('events') as any)
        .select('*', { count: 'exact', head: true })

    // 5. MRR Calculation & Advanced Economics
    const { data: activeSubscriptions } = await applyTestFilter(
        (supabase.from('subscriptions') as any).select('user_id, provider_price_id').eq('status', 'active'),
        'user_id'
    )

    const { data: allProfiles } = await (supabase.from('profiles') as any).select('id, role, created_at')
    const userRoleMap = (allProfiles || []).reduce((acc: any, u: any) => {
        acc[u.id] = u.role
        return acc
    }, {})

    let mrr = 0
    let mrrPsychologist = 0
    let mrrPatient = 0
    let activePsychologistsCount = 0
    let activePatientsCount = 0

    if (activeSubscriptions) {
        // Count active users by role based on having an active sub
        const trackedUsers = new Set()

        activeSubscriptions.forEach((sub: any) => {
            if (sub.provider_price_id) {
                const plan = getPlanByPriceId(sub.provider_price_id)
                if (plan) {
                    const monthlyAmount = plan.interval === 'annual' ? plan.annual.monthlyEquivalent : plan.monthly.amount
                    mrr += monthlyAmount
                    
                    const role = userRoleMap[sub.user_id]
                    if (role === 'psychologist') mrrPsychologist += monthlyAmount
                    if (role === 'patient') mrrPatient += monthlyAmount

                    if (!trackedUsers.has(sub.user_id)) {
                        trackedUsers.add(sub.user_id)
                        if (role === 'psychologist') activePsychologistsCount++
                        if (role === 'patient') activePatientsCount++
                    }
                }
            }
        })
    }

    // ARPU By Segment
    const arpuPsychologist = activePsychologistsCount > 0 ? (mrrPsychologist / activePsychologistsCount) : 0
    const arpuPatient = activePatientsCount > 0 ? (mrrPatient / activePatientsCount) : 0

    // 6. Event GMV (Current Month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const startOfLastMonth = new Date(startOfMonth)
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1)

    const { data: eventTransactions } = await applyTestFilter(
        (supabase.from('payment_transactions') as any)
        .select('amount')
        .eq('purchase_type', 'event_purchase')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString()),
        'user_id'
    )

    const eventsGmv = (eventTransactions || []).reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0)

    // 7. Churn Rate & NDR Calculation
    // We need sub status from last month to now
    const { data: cancelledSubsLast30Days } = await applyTestFilter(
        (supabase.from('subscriptions') as any)
        .select('provider_price_id')
        .eq('status', 'cancelled')
        .gte('cancelled_at', startOfMonth.toISOString()),
        'user_id'
    )

    let churnedMRR = 0
    let churnedUsers = 0
    if (cancelledSubsLast30Days) {
        churnedUsers = cancelledSubsLast30Days.length
        cancelledSubsLast30Days.forEach((sub: any) => {
            if (sub.provider_price_id) {
                const plan = getPlanByPriceId(sub.provider_price_id)
                if (plan) {
                    churnedMRR += plan.interval === 'annual' ? plan.annual.monthlyEquivalent : plan.monthly.amount
                }
            }
        })
    }

    const { count: activeUsersStartOfMonth } = await applyTestFilter(
        (supabase.from('subscriptions') as any)
        .select('*', { count: 'exact', head: true })
        .lte('created_at', startOfMonth.toISOString())
        .or(`status.eq.active,and(status.eq.cancelled,cancelled_at.gte.${startOfMonth.toISOString()})`),
        'user_id'
    )

    // Churn Rate = Cancelados en el mes / Activos al inicio del mes
    const logoChurnRate = activeUsersStartOfMonth && activeUsersStartOfMonth > 0
        ? (churnedUsers / activeUsersStartOfMonth) * 100
        : 0

    // Gross Retention = (MRR Inicial - MRR Cancelado) / MRR Inicial
    // Assuming MRR didn't change wildly, MRR inicial = mrr + churnedMRR
    const startingMRR = mrr + churnedMRR
    const ndr = startingMRR > 0
        ? ((startingMRR - churnedMRR) / startingMRR) * 100
        : 100 // If no starting MRR, 100% retention by default

    // 8. Unit Economics (LTV & CAC)
    // LTV = ARPU * Gross Margin (from settings) / Churn Rate
    const arpu = activeSubscriptions && activeSubscriptions.length > 0
        ? mrr / activeSubscriptions.length
        : 0
    const assumedGrossMargin = grossMarginPercent / 100
    // Avoid division by zero, min churn 0.5%
    const effectiveChurn = Math.max(logoChurnRate / 100, 0.005)
    const ltv = (arpu * assumedGrossMargin) / effectiveChurn

    // CAC Calculation (From Settings)
    const cac = cacAmount
    const ltvCacRatio = cac > 0 ? ltv / cac : 0

    // 9. Engagement (DAU / MAU)
    // Supabase auth.users has last_sign_in_at
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    // Using profiles updated_at as a proxy for active since last_sign_in_at is secure
    const { count: dau } = await (supabase
        .from('profiles') as any)
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', yesterday)
        .eq('is_test', false)
        
    const { count: mau } = await (supabase
        .from('profiles') as any)
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', lastMonth)
        .eq('is_test', false)
        
    const dauMauRatio = mau && mau > 0 ? ((dau || 0) / mau) * 100 : 0

    // 10. Marketplace (Event Fill Rate)
    const { data: recentEventsData } = await (supabase
        .from('events') as any)
        .select('id, max_attendees')
        .gte('created_at', startOfMonth.toISOString())
        .not('max_attendees', 'is', null)

    let totalCapacity = 0
    let totalAttendees = 0
    
    if (recentEventsData && recentEventsData.length > 0) {
        for (const evt of recentEventsData) {
            totalCapacity += evt.max_attendees || 0
            const { count: attendees } = await applyTestFilter(
                (supabase.from('event_registrations') as any)
                .select('*', { count: 'exact', head: true })
                .eq('event_id', evt.id),
                'user_id'
            )
            totalAttendees += attendees || 0
        }
    }
    const fillRate = totalCapacity > 0 ? (totalAttendees / totalCapacity) * 100 : 0

    // 11. Clinical PMF Metrics (Health & Retention)
    // A) Tasa de Asistencia (Attendance Rate)
    const { count: scheduledAppointments } = await applyTestFilter(
        (supabase.from('appointments') as any)
        .select('*', { count: 'exact', head: true })
        .in('status', ['completed', 'cancelled', 'no_show']),
        'patient_id'
    )
    
    // completedAppointments is already calculated above (Step 2)
    const attendanceRate = scheduledAppointments && scheduledAppointments > 0 
        ? ((completedAppointments || 0) / scheduledAppointments) * 100 
        : 0

    // B) Health Score de Terapia (Average Mood Rating)
    const { data: sessionSummaries } = await applyTestFilter(
        (supabase.from('session_summaries') as any)
        .select('mood_rating')
        .not('mood_rating', 'is', null),
        'patient_id'
    )
    
    let totalMood = 0
    let moodCount = 0
    if (sessionSummaries && sessionSummaries.length > 0) {
        sessionSummaries.forEach((s: any) => {
            if (s.mood_rating) {
                totalMood += s.mood_rating
                moodCount++
            }
        })
    }
    const healthScore = moodCount > 0 ? (totalMood / moodCount) : 0 // Scale 1-10

    // C) Drop-off Rate (Pacientes que abandonan antes de la 3ra sesión)
    const { data: allSummaries } = await applyTestFilter(
        (supabase.from('session_summaries') as any)
        .select('patient_id, created_at'),
        'patient_id'
    )
    
    let dropOffRate = 0
    if (allSummaries && allSummaries.length > 0) {
        const sessionsPerPatient: Record<string, { count: number, latest: Date }> = {}
        allSummaries.forEach((s: any) => {
            if (!s.patient_id) return
            if (!sessionsPerPatient[s.patient_id]) {
                sessionsPerPatient[s.patient_id] = { count: 0, latest: new Date(0) }
            }
            sessionsPerPatient[s.patient_id].count++
            const sDate = new Date(s.created_at)
            if (sDate > sessionsPerPatient[s.patient_id].latest) {
                sessionsPerPatient[s.patient_id].latest = sDate
            }
        })

        let totalPatientsWithSessions = 0
        let patientsDroppedOff = 0
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        Object.values(sessionsPerPatient).forEach((patientInfo) => {
            totalPatientsWithSessions++
            // Consider "dropped off" if they had < 3 sessions AND their last session was over 30 days ago
            if (patientInfo.count < 3 && patientInfo.latest < thirtyDaysAgo) {
                patientsDroppedOff++
            }
        })

        dropOffRate = totalPatientsWithSessions > 0 
            ? (patientsDroppedOff / totalPatientsWithSessions) * 100 
            : 0
    }

    // 12. Appointments by Month (for chart)
    // We fetch all appointments and group them in JS because Supabase doesn't have easy group by in client
    const { data: appointments } = await applyTestFilter(
        (supabase.from('appointments') as any)
        .select('start_time')
        .order('start_time', { ascending: true }),
        'patient_id'
    )

    const appointmentsByMonth = (appointments || []).reduce((acc: any, curr: any) => {
        const month = new Date(curr.start_time).toLocaleString('es-ES', { month: 'short' })
        acc[month] = (acc[month] || 0) + 1
        return acc
    }, {})

    const chartData = Object.entries(appointmentsByMonth).map(([name, total]) => ({
        name: (name as string).charAt(0).toUpperCase() + (name as string).slice(1),
        total: Number(total)
    }))

    // 8. Recent Activity
    // Fetch recent appointments
    const { data: recentAppointments } = await (supabase
        .from('appointments') as any)
        .select(`
            id,
            created_at,
            patient:profiles!appointments_patient_id_fkey(full_name),
            psychologist:profiles!appointments_psychologist_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch recent users
    const { data: recentUsers } = await (supabase
        .from('profiles') as any)
        .select('id, full_name, created_at, role')
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch recent events
    const { data: recentEvents } = await (supabase
        .from('events') as any)
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

    // Merge and sort
    const activity = [
        ...(recentAppointments || []).map((a: any) => ({
            type: 'appointment',
            description: `Nueva cita: ${a.patient?.full_name || 'Paciente'} con ${a.psychologist?.full_name || 'Psicólogo'}`,
            time: a.created_at
        })),
        ...(recentUsers || []).map((u: any) => ({
            type: 'user',
            description: `Nuevo usuario: ${u.full_name || 'Usuario'} (${u.role})`,
            time: u.created_at
        })),
        ...(recentEvents || []).map((e: any) => ({
            type: 'event',
            description: `Nuevo evento: ${e.title}`,
            time: e.created_at
        }))
    ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10)

    // 9. Organic Growth (Viralidad)
    const { data: attributions } = await applyTestFilter(
        (supabase.from('invite_attributions') as any).select('status'),
        'referrer_id'
    )

    let completedAttributions = 0
    let totalAttributions = 0

    if (attributions && attributions.length > 0) {
        totalAttributions = attributions.length
        completedAttributions = attributions.filter((a: any) => a.status === 'completed' || a.status === 'rewarded').length
    }

    const kFactor = totalUsers > 0 ? (completedAttributions / totalUsers) : 0
    const referralConversionRate = totalAttributions > 0 ? (completedAttributions / totalAttributions) * 100 : 0

    // 10. Time-to-Value (Velocidad de Monetización)
    // Find earliest subscription or payment for each user
    const { data: allSubsDates } = await (supabase.from('subscriptions') as any).select('user_id, created_at').order('created_at', { ascending: true })
    const { data: allPaymentsDates } = await (supabase.from('payment_transactions') as any).select('user_id, created_at').eq('status', 'completed').order('created_at', { ascending: true })

    const firstPurchaseMap: Record<string, Date> = {}

    const evaluateFirstDate = (list: any[]) => {
        if (!list) return
        list.forEach((item) => {
            const date = new Date(item.created_at)
            if (!firstPurchaseMap[item.user_id] || date < firstPurchaseMap[item.user_id]) {
                firstPurchaseMap[item.user_id] = date
            }
        })
    }
    evaluateFirstDate(allSubsDates)
    evaluateFirstDate(allPaymentsDates)

    let totalTimeToValueHours = 0
    let usersWithPurchases = 0

    if (allProfiles && allProfiles.length > 0) {
        allProfiles.forEach((profile: any) => {
            if (firstPurchaseMap[profile.id]) {
                const profileCreated = new Date(profile.created_at)
                const purchaseCreated = firstPurchaseMap[profile.id]
                const diffMs = purchaseCreated.getTime() - profileCreated.getTime()
                
                // Only consider valid positive diffs (sometimes data imports have weird stamps)
                if (diffMs >= 0) {
                    totalTimeToValueHours += (diffMs / (1000 * 60 * 60))
                    usersWithPurchases++
                }
            }
        })
    }

    const timeToValueHours = usersWithPurchases > 0 ? (totalTimeToValueHours / usersWithPurchases) : 0

    return {
        totalAppointments: totalAppointments || 0,
        completedAppointments: completedAppointments || 0,
        totalUsers: totalUsers || 0,
        totalEvents: totalEvents || 0,
        mrr,
        eventsGmv,
        churnRate: logoChurnRate,
        ndr,
        ltv,
        cac,
        margin: grossMarginPercent,
        ltvCacRatio,
        dau: dau || 0,
        mau: mau || 0,
        dauMauRatio,
        fillRate,
        attendanceRate,
        healthScore,
        dropOffRate,
        kFactor,
        referralConversionRate,
        arpuPsychologist,
        arpuPatient,
        timeToValueHours,
        chartData,
        activity
    }
}

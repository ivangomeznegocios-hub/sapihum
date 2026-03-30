import { createAdminClient } from '@/lib/supabase/server'
import { getPlanByPriceId } from '@/lib/payments/config'
import { getTouchByModel } from '@/lib/analytics/attribution'
import type { AttributionModel, AttributionSnapshot } from '@/lib/analytics/types'

type RevenueRow = {
    source: 'subscription' | 'event' | 'formation' | 'ai_credits' | 'manual_deal'
    amount: number
    occurredAt: string
    userId: string | null
    attributionSnapshot: AttributionSnapshot | null
    providerSessionId: string | null
    providerPaymentId: string | null
}

type ChannelPerformanceRow = {
    channel: string
    campaign: string
    visits: number
    leads: number
    registrations: number
    activations: number
    checkouts: number
    sales: number
    revenue: number
    cost: number
    cac: number
    roas: number | null
}

function startOfDay(date: Date) {
    const next = new Date(date)
    next.setHours(0, 0, 0, 0)
    return next
}

function daysAgo(days: number) {
    const now = new Date()
    now.setDate(now.getDate() - days)
    return startOfDay(now)
}

function overlapWithWindow(start: string, end: string, windowStart: Date, windowEnd: Date) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return startDate <= windowEnd && endDate >= windowStart
}

function buildKey(channel: string | null | undefined, campaign: string | null | undefined) {
    return `${channel || 'direct'}::${campaign || 'Sin campaña'}`
}

function getTouchMeta(snapshot: AttributionSnapshot | null, model: AttributionModel) {
    const touch = getTouchByModel(snapshot, model)
    return {
        channel: touch?.channel || 'direct',
        campaign: touch?.campaign || 'Sin campaña',
    }
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0,
    }).format(value)
}

function normalizeAttributionSnapshot(value: unknown): AttributionSnapshot | null {
    if (!value) return null
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as AttributionSnapshot
        } catch {
            return null
        }
    }
    return value as AttributionSnapshot
}

function isCoveredByTransaction(
    row: { provider_session_id?: string | null; provider_payment_id?: string | null },
    refs: { sessionIds: Set<string>; paymentIds: Set<string> }
) {
    return Boolean(
        (row.provider_session_id && refs.sessionIds.has(row.provider_session_id)) ||
        (row.provider_payment_id && refs.paymentIds.has(row.provider_payment_id))
    )
}

export async function getAdminAnalyticsDashboard(model: AttributionModel = 'last_non_direct') {
    const admin = await createAdminClient()
    const windowStart = daysAgo(30)
    const windowEnd = new Date()
    const monthStart = startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

    const [
        profilesResult,
        visitorsResult,
        sessionsResult,
        eventsResult,
        transactionsResult,
        subscriptionsResult,
        costsResult,
        manualDealsResult,
        waitlistResult,
        eventPurchasesResult,
        formationPurchasesResult,
    ] = await Promise.all([
        (admin.from('profiles') as any).select('id, is_test'),
        (admin.from('analytics_visitors') as any).select('id, user_id, first_seen_at'),
        (admin.from('analytics_sessions') as any).select('id, visitor_id, user_id, started_at, attribution_snapshot'),
        (admin.from('analytics_events') as any).select('id, user_id, event_name, occurred_at, attribution_snapshot, properties'),
        (admin.from('payment_transactions') as any).select('id, user_id, profile_id, purchase_type, amount, status, completed_at, created_at, attribution_snapshot, provider_session_id, provider_payment_id'),
        (admin.from('subscriptions') as any).select('id, user_id, membership_level, specialization_code, provider_price_id, status, created_at, cancelled_at, attribution_snapshot'),
        (admin.from('marketing_cost_entries') as any).select('*').order('period_start', { ascending: false }),
        (admin.from('manual_deals') as any).select('*').order('closed_at', { ascending: false }),
        (admin.from('specialization_waitlist') as any).select('id, user_id, created_at, metadata'),
        (admin.from('event_purchases') as any).select('id, user_id, amount_paid, status, purchased_at, confirmed_at, attribution_snapshot, provider_session_id, provider_payment_id'),
        (admin.from('formation_purchases') as any).select('id, user_id, amount_paid, status, purchased_at, confirmed_at, metadata, provider_session_id, provider_payment_id'),
    ])

    const testUserIds = new Set(
        ((profilesResult.data || []) as Array<{ id: string; is_test: boolean | null }>)
            .filter((profile) => profile.is_test)
            .map((profile) => profile.id)
    )

    const sessions = ((sessionsResult.data || []) as any[]).filter((row) => !row.user_id || !testUserIds.has(row.user_id))
    const events = ((eventsResult.data || []) as any[]).filter((row) => !row.user_id || !testUserIds.has(row.user_id))
    const waitlist = ((waitlistResult.data || []) as any[]).filter((row) => !row.user_id || !testUserIds.has(row.user_id))
    const costs = (costsResult.data || []) as any[]
    const manualDeals = ((manualDealsResult.data || []) as any[]).filter((row) => !row.user_id || !testUserIds.has(row.user_id))

    const transactions = ((transactionsResult.data || []) as any[]).filter(
        (row) =>
            row.status === 'completed' &&
            (!row.user_id || !testUserIds.has(row.user_id)) &&
            (!row.profile_id || !testUserIds.has(row.profile_id))
    )

    const subscriptions = ((subscriptionsResult.data || []) as any[]).filter((row) => !row.user_id || !testUserIds.has(row.user_id))
    const eventPurchases = ((eventPurchasesResult.data || []) as any[]).filter(
        (row) => row.status === 'confirmed' && (!row.user_id || !testUserIds.has(row.user_id))
    )
    const formationPurchases = ((formationPurchasesResult.data || []) as any[]).filter(
        (row) => row.status === 'confirmed' && (!row.user_id || !testUserIds.has(row.user_id))
    )
    const transactionRefs = {
        sessionIds: new Set(
            transactions
                .map((row) => row.provider_session_id)
                .filter((value): value is string => typeof value === 'string' && value.length > 0)
        ),
        paymentIds: new Set(
            transactions
                .map((row) => row.provider_payment_id)
                .filter((value): value is string => typeof value === 'string' && value.length > 0)
        ),
    }

    const sessions30d = sessions.filter((row) => new Date(row.started_at) >= windowStart)
    const events30d = events.filter((row) => new Date(row.occurred_at) >= windowStart)
    const waitlist30d = waitlist.filter((row) => new Date(row.created_at) >= windowStart)

    const activeSubscriptions = subscriptions.filter((row) => row.status === 'active' || row.status === 'trialing')
    const mrr = activeSubscriptions.reduce((sum, row) => {
        const plan = row.provider_price_id ? getPlanByPriceId(row.provider_price_id) : null
        if (!plan) return sum
        return sum + (plan.interval === 'annual' ? plan.annual.monthlyEquivalent : plan.monthly.amount)
    }, 0)

    const churnedThisWindow = subscriptions.filter(
        (row) => row.status === 'cancelled' && row.cancelled_at && new Date(row.cancelled_at) >= windowStart
    )
    const activeAtWindowStart = subscriptions.filter((row) => {
        const createdAt = new Date(row.created_at)
        if (createdAt > windowStart) return false
        if (row.status === 'cancelled' && row.cancelled_at) {
            return new Date(row.cancelled_at) >= windowStart
        }
        return row.status === 'active' || row.status === 'trialing' || row.status === 'past_due'
    })
    const churnRate = activeAtWindowStart.length > 0 ? (churnedThisWindow.length / activeAtWindowStart.length) * 100 : 0

    const revenueRows: RevenueRow[] = [
        ...transactions.map((row) => ({
            source:
                row.purchase_type === 'event_purchase'
                    ? ('event' as const)
                    : row.purchase_type === 'formation_purchase'
                        ? ('formation' as const)
                    : row.purchase_type === 'ai_credits'
                        ? ('ai_credits' as const)
                        : ('subscription' as const),
            amount: Number(row.amount || 0),
            occurredAt: row.completed_at || row.created_at,
            userId: row.user_id || row.profile_id || null,
            attributionSnapshot: (row.attribution_snapshot || null) as AttributionSnapshot | null,
            providerSessionId: row.provider_session_id || null,
            providerPaymentId: row.provider_payment_id || null,
        })),
        ...manualDeals
            .filter((row) => row.stage === 'won')
            .map((row) => ({
                source: 'manual_deal' as const,
                amount: Number(row.amount || 0),
                occurredAt: row.closed_at,
                userId: row.user_id || null,
                attributionSnapshot: (row.attribution_snapshot || null) as AttributionSnapshot | null,
                providerSessionId: null,
                providerPaymentId: null,
            })),
        ...eventPurchases
            .filter((row) => !isCoveredByTransaction(row, transactionRefs))
            .map((row) => ({
            source: 'event' as const,
            amount: Number(row.amount_paid || 0),
            occurredAt: row.confirmed_at || row.purchased_at,
            userId: row.user_id || null,
            attributionSnapshot: (row.attribution_snapshot || null) as AttributionSnapshot | null,
            providerSessionId: row.provider_session_id || null,
            providerPaymentId: row.provider_payment_id || null,
        })),
        ...formationPurchases
            .filter((row) => !isCoveredByTransaction(row, transactionRefs))
            .map((row) => ({
            source: 'formation' as const,
            amount: Number(row.amount_paid || 0),
            occurredAt: row.confirmed_at || row.purchased_at,
            userId: row.user_id || null,
            attributionSnapshot: normalizeAttributionSnapshot(row.metadata?.attribution_snapshot),
            providerSessionId: row.provider_session_id || null,
            providerPaymentId: row.provider_payment_id || null,
        })),
    ]

    const revenue30d = revenueRows.filter((row) => new Date(row.occurredAt) >= windowStart)
    const totalRevenue30d = revenue30d.reduce((sum, row) => sum + row.amount, 0)
    const totalRevenueAllTime = revenueRows.reduce((sum, row) => sum + row.amount, 0)
    const sales30d = revenue30d.length
    const uniquePayingUsers = new Set(revenueRows.map((row) => row.userId).filter(Boolean)).size

    const cost30d = costs
        .filter((row) => overlapWithWindow(row.period_start, row.period_end, windowStart, windowEnd))
        .reduce((sum, row) => sum + Number(row.amount || 0), 0)

    const arpu = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0
    const effectiveChurn = Math.max(churnRate / 100, 0.01)
    const estimatedLtv = (arpu * 0.85) / effectiveChurn
    const realizedLtv = uniquePayingUsers > 0 ? totalRevenueAllTime / uniquePayingUsers : 0
    const cacBlended = sales30d > 0 ? cost30d / sales30d : 0
    const roas = cost30d > 0 ? totalRevenue30d / cost30d : null
    const paybackMonths = arpu > 0 ? cacBlended / arpu : null
    const ltvCacRatio = cacBlended > 0 ? estimatedLtv / cacBlended : null

    const clicks30d = events30d.filter((row) => row.event_name === 'cta_clicked').length
    const registrations30d = events30d.filter((row) => row.event_name === 'registration_completed').length
    const activations30d = events30d.filter((row) => row.event_name === 'registration_verified').length
    const checkouts30d = events30d.filter((row) => row.event_name === 'checkout_started').length
    const leads30d =
        waitlist30d.length +
        events30d.filter((row) => row.event_name === 'registration_started').length

    const funnel = [
        { label: 'Visitas', value: sessions30d.length },
        { label: 'Clicks CTA', value: clicks30d },
        { label: 'Leads', value: leads30d },
        { label: 'Registros', value: registrations30d },
        { label: 'Activaciones', value: activations30d },
        { label: 'Checkouts', value: checkouts30d },
        { label: 'Ventas', value: sales30d },
    ].map((step, index, array) => {
        const previous = index === 0 ? null : array[index - 1].value
        return {
            ...step,
            conversionRate: previous && previous > 0 ? (step.value / previous) * 100 : null,
        }
    })

    const channelMap = new Map<string, ChannelPerformanceRow>()
    for (const session of sessions30d) {
        const meta = getTouchMeta((session.attribution_snapshot || null) as AttributionSnapshot | null, model)
        const key = buildKey(meta.channel, meta.campaign)
        const row = channelMap.get(key) || {
            channel: meta.channel,
            campaign: meta.campaign,
            visits: 0,
            leads: 0,
            registrations: 0,
            activations: 0,
            checkouts: 0,
            sales: 0,
            revenue: 0,
            cost: 0,
            cac: 0,
            roas: null,
        }
        row.visits += 1
        channelMap.set(key, row)
    }

    const eventToMetric: Record<string, keyof Pick<ChannelPerformanceRow, 'leads' | 'registrations' | 'activations' | 'checkouts'>> = {
        registration_started: 'leads',
        registration_completed: 'registrations',
        registration_verified: 'activations',
        checkout_started: 'checkouts',
    }

    for (const event of events30d) {
        const metric = eventToMetric[event.event_name]
        if (!metric) continue
        const meta = getTouchMeta((event.attribution_snapshot || null) as AttributionSnapshot | null, model)
        const key = buildKey(meta.channel, meta.campaign)
        const row = channelMap.get(key) || {
            channel: meta.channel,
            campaign: meta.campaign,
            visits: 0,
            leads: 0,
            registrations: 0,
            activations: 0,
            checkouts: 0,
            sales: 0,
            revenue: 0,
            cost: 0,
            cac: 0,
            roas: null,
        }
        row[metric] += 1
        channelMap.set(key, row)
    }

    for (const lead of waitlist30d) {
        const snapshot = (lead.metadata?.attributionSnapshot || null) as AttributionSnapshot | null
        const meta = getTouchMeta(snapshot, model)
        const key = buildKey(meta.channel, meta.campaign)
        const row = channelMap.get(key) || {
            channel: meta.channel,
            campaign: meta.campaign,
            visits: 0,
            leads: 0,
            registrations: 0,
            activations: 0,
            checkouts: 0,
            sales: 0,
            revenue: 0,
            cost: 0,
            cac: 0,
            roas: null,
        }
        row.leads += 1
        channelMap.set(key, row)
    }

    for (const revenue of revenue30d) {
        const meta = getTouchMeta(revenue.attributionSnapshot, model)
        const key = buildKey(meta.channel, meta.campaign)
        const row = channelMap.get(key) || {
            channel: meta.channel,
            campaign: meta.campaign,
            visits: 0,
            leads: 0,
            registrations: 0,
            activations: 0,
            checkouts: 0,
            sales: 0,
            revenue: 0,
            cost: 0,
            cac: 0,
            roas: null,
        }
        row.sales += 1
        row.revenue += revenue.amount
        channelMap.set(key, row)
    }

    for (const cost of costs.filter((row) => overlapWithWindow(row.period_start, row.period_end, windowStart, windowEnd))) {
        const key = buildKey(cost.channel, cost.campaign)
        const row = channelMap.get(key) || {
            channel: cost.channel || 'direct',
            campaign: cost.campaign || 'Sin campaña',
            visits: 0,
            leads: 0,
            registrations: 0,
            activations: 0,
            checkouts: 0,
            sales: 0,
            revenue: 0,
            cost: 0,
            cac: 0,
            roas: null,
        }
        row.cost += Number(cost.amount || 0)
        channelMap.set(key, row)
    }

    const acquisition = Array.from(channelMap.values())
        .map((row) => ({
            ...row,
            cac: row.sales > 0 ? row.cost / row.sales : 0,
            roas: row.cost > 0 ? row.revenue / row.cost : null,
        }))
        .sort((a, b) => b.revenue - a.revenue || b.visits - a.visits)

    const revenueByProduct = ['subscription', 'event', 'formation', 'ai_credits', 'manual_deal'].map((source) => {
        const rows = revenue30d.filter((row) => row.source === source)
        return {
            source,
            count: rows.length,
            amount: rows.reduce((sum, row) => sum + row.amount, 0),
        }
    })

    const comparisonByModel = (['first_touch', 'last_touch', 'last_non_direct'] as AttributionModel[]).map((currentModel) => {
        const totals = new Map<string, number>()
        for (const row of revenue30d) {
            const meta = getTouchMeta(row.attributionSnapshot, currentModel)
            const current = totals.get(meta.channel) || 0
            totals.set(meta.channel, current + row.amount)
        }

        return {
            model: currentModel,
            channels: Array.from(totals.entries())
                .map(([channel, amount]) => ({ channel, amount }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5),
        }
    })

    const unattributedRevenue = revenue30d.filter((row) => !getTouchByModel(row.attributionSnapshot, model)).length
    const trackingHealth = {
        visitors: (visitorsResult.data || []).length,
        sessions30d: sessions30d.length,
        events30d: events30d.length,
        unattributedRevenue,
        manualCosts: costs.length,
        manualDeals: manualDeals.length,
    }

    return {
        attributionModel: model,
        executive: {
            visits: sessions30d.length,
            clicks: clicks30d,
            leads: leads30d,
            registrations: registrations30d,
            activations: activations30d,
            checkouts: checkouts30d,
            sales: sales30d,
            revenue30d: totalRevenue30d,
            revenue30dFormatted: formatCurrency(totalRevenue30d),
            mrr,
            mrrFormatted: formatCurrency(mrr),
            churnRate,
            arpu,
            arpuFormatted: formatCurrency(arpu),
        },
        funnel,
        acquisition,
        revenue: {
            total30d: totalRevenue30d,
            totalAllTime: totalRevenueAllTime,
            breakdown30d: revenueByProduct,
            monthlyWindowLabel: 'Ultimos 30 dias',
            currentMonthRevenue: revenueRows
                .filter((row) => new Date(row.occurredAt) >= monthStart)
                .reduce((sum, row) => sum + row.amount, 0),
        },
        unitEconomics: {
            cost30d,
            cacBlended,
            roas,
            paybackMonths,
            estimatedLtv,
            realizedLtv,
            ltvCacRatio,
        },
        comparisonByModel,
        trackingHealth,
        manualInputs: {
            costs: costs.slice(0, 12),
            deals: manualDeals.slice(0, 12),
        },
    }
}

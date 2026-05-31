import { createServiceClient } from '@/lib/supabase/service'

const RECENT_LIMIT = 20
const PENDING_PURCHASE_STALE_MINUTES = 30
const WEBHOOK_STALE_MINUTES = 15

export type InboxSeverity = 'info' | 'success' | 'warning' | 'error'

export interface InboxItem {
    id: string
    kind: string
    title: string
    subtitle: string
    status?: string | null
    severity: InboxSeverity
    occurredAt: string
    email?: string | null
    amount?: number | null
    currency?: string | null
    href?: string
}

export interface AdminInboxDashboard {
    summary: {
        formItems: number
        purchaseItems: number
        healthIssues: number
        revenueVisible: number
    }
    forms: InboxItem[]
    purchases: InboxItem[]
    health: InboxItem[]
}

function formatMoney(amount: unknown, currency = 'MXN') {
    const numeric = Number(amount || 0)
    if (!Number.isFinite(numeric) || numeric <= 0) return null

    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency || 'MXN',
        maximumFractionDigits: 0,
    }).format(numeric)
}

function asDate(value: string | null | undefined) {
    const timestamp = value ? new Date(value).getTime() : NaN
    return Number.isFinite(timestamp) ? new Date(timestamp) : new Date(0)
}

function minutesSince(value: string | null | undefined) {
    return (Date.now() - asDate(value).getTime()) / 60000
}

function operationsHref(email?: string | null, purchaseId?: string | null) {
    const params = new URLSearchParams()
    if (email) params.set('q', email)
    if (purchaseId) params.set('purchase', purchaseId)
    const suffix = params.toString()
    return `/dashboard/admin/operations${suffix ? `?${suffix}` : ''}`
}

function sortItems(items: InboxItem[]) {
    return items.sort((a, b) => asDate(b.occurredAt).getTime() - asDate(a.occurredAt).getTime())
}

export async function getAdminInboxDashboard(): Promise<AdminInboxDashboard> {
    const admin = createServiceClient()
    const [
        eventLeadsResult,
        organicLeadsResult,
        waitlistResult,
        speakerApplicationsResult,
        founderLeadsResult,
        eventPurchasesResult,
        formationPurchasesResult,
        transactionsResult,
        webhookIssuesResult,
        operationIssuesResult,
    ] = await Promise.all([
        (admin.from('event_interest_leads') as any)
            .select('id, name, email, whatsapp, event_slug, formation_track, source_surface, source_action, lead_tag, status, created_at')
            .order('created_at', { ascending: false })
            .limit(RECENT_LIMIT),
        (admin.from('organic_leads') as any)
            .select('id, name, email, source_page, source_topic, source_asset, source_type, intent, lifecycle_stage, score, created_at')
            .order('created_at', { ascending: false })
            .limit(RECENT_LIMIT),
        (admin.from('specialization_waitlist') as any)
            .select('id, specialization_code, email, source, created_at, metadata')
            .order('created_at', { ascending: false })
            .limit(RECENT_LIMIT),
        (admin.from('speaker_applications') as any)
            .select('applicant_id, email, full_name, specialty, years_experience, status, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(RECENT_LIMIT),
        (admin.from('admin_operation_logs') as any)
            .select('id, action_type, entity_type, entity_id, target_email, reason, details, created_at')
            .eq('action_type', 'founder_lead_captured')
            .order('created_at', { ascending: false })
            .limit(RECENT_LIMIT),
        (admin.from('event_purchases') as any)
            .select('id, email, full_name, amount_paid, currency, status, purchased_at, confirmed_at, provider_session_id, provider_payment_id, event:events(title, slug)')
            .order('purchased_at', { ascending: false })
            .limit(RECENT_LIMIT),
        (admin.from('formation_purchases') as any)
            .select('id, email, full_name, amount_paid, currency, status, purchased_at, confirmed_at, provider_session_id, provider_payment_id, formation:formations(title, slug)')
            .order('purchased_at', { ascending: false })
            .limit(RECENT_LIMIT),
        (admin.from('payment_transactions') as any)
            .select('id, email, purchase_type, purchase_reference_id, amount, currency, status, created_at, completed_at, provider_session_id, provider_payment_id')
            .order('created_at', { ascending: false })
            .limit(RECENT_LIMIT),
        (admin.from('payment_webhook_events') as any)
            .select('id, provider, provider_event_id, status, attempts, created_at, processed_at, failed_at, error_message')
            .in('status', ['failed', 'processing'])
            .order('created_at', { ascending: false })
            .limit(RECENT_LIMIT),
        (admin.from('admin_operation_logs') as any)
            .select('id, action_type, entity_type, entity_id, target_email, reason, details, created_at')
            .in('action_type', [
                'commerce_email_failed',
                'commerce_magic_link_failed',
                'payment_refund_manual_review_required',
                'admin_alert_failed',
                'admin_alert_skipped',
            ])
            .order('created_at', { ascending: false })
            .limit(RECENT_LIMIT),
    ])

    const forms: InboxItem[] = [
        ...((eventLeadsResult.data ?? []) as any[]).map((lead) => ({
            id: `event-lead:${lead.id}`,
            kind: 'Lead evento',
            title: lead.name || lead.email || 'Lead capturado',
            subtitle: `${lead.formation_track || lead.lead_tag || 'Campana'} · ${lead.source_surface || lead.source_action || 'formulario'}`,
            status: lead.status,
            severity: 'info' as const,
            occurredAt: lead.created_at,
            email: lead.email,
            href: operationsHref(lead.email),
        })),
        ...((organicLeadsResult.data ?? []) as any[]).map((lead) => ({
            id: `organic-lead:${lead.id}`,
            kind: 'Lead organico',
            title: lead.name || lead.email || 'Lead organico',
            subtitle: `${lead.source_topic || lead.source_asset || lead.source_type || 'Contenido'} - score ${lead.score ?? 0}`,
            status: lead.lifecycle_stage,
            severity: 'info' as const,
            occurredAt: lead.created_at,
            email: lead.email,
            href: operationsHref(lead.email),
        })),
        ...((waitlistResult.data ?? []) as any[]).map((row) => ({
            id: `waitlist:${row.id}`,
            kind: 'Lista espera',
            title: row.email || 'Usuario autenticado',
            subtitle: `Especializacion ${row.specialization_code} · ${row.source}`,
            status: 'captured',
            severity: 'info' as const,
            occurredAt: row.created_at,
            email: row.email,
            href: operationsHref(row.email),
        })),
        ...((speakerApplicationsResult.data ?? []) as any[]).map((row) => ({
            id: `speaker-application:${row.applicant_id}`,
            kind: 'Solicitud ponente',
            title: row.full_name || row.email || 'Solicitud de ponente',
            subtitle: `${row.specialty || 'Sin especialidad'}${row.years_experience ? ` · ${row.years_experience} anos` : ''}`,
            status: row.status,
            severity: row.status === 'needs_review' ? 'warning' as const : 'success' as const,
            occurredAt: row.created_at,
            email: row.email,
            href: operationsHref(row.email),
        })),
        ...((founderLeadsResult.data ?? []) as any[]).map((row) => ({
            id: `founder-lead:${row.id}`,
            kind: 'Lead fundador',
            title: row.details?.fullName || row.target_email || 'Lead fundador',
            subtitle: `${row.details?.professionalProfile || 'Perfil'} · ${row.details?.interestArea || 'Interes'}`,
            status: row.reason,
            severity: 'info' as const,
            occurredAt: row.created_at,
            email: row.target_email,
            href: operationsHref(row.target_email),
        })),
    ]

    const eventPurchases = ((eventPurchasesResult.data ?? []) as any[]).map((purchase) => {
        const money = formatMoney(purchase.amount_paid, purchase.currency)
        return {
            id: `event-purchase:${purchase.id}`,
            kind: 'Compra evento',
            title: purchase.event?.title || purchase.full_name || purchase.email || 'Compra de evento',
            subtitle: `${purchase.email}${money ? ` · ${money}` : ''}`,
            status: purchase.status,
            severity: purchase.status === 'confirmed' ? 'success' as const : purchase.status === 'pending' ? 'warning' as const : 'info' as const,
            occurredAt: purchase.confirmed_at || purchase.purchased_at,
            email: purchase.email,
            amount: Number(purchase.amount_paid || 0),
            currency: purchase.currency,
            href: operationsHref(purchase.email, purchase.id),
        }
    })

    const formationPurchases = ((formationPurchasesResult.data ?? []) as any[]).map((purchase) => {
        const money = formatMoney(purchase.amount_paid, purchase.currency)
        return {
            id: `formation-purchase:${purchase.id}`,
            kind: 'Compra formacion',
            title: purchase.formation?.title || purchase.full_name || purchase.email || 'Compra de formacion',
            subtitle: `${purchase.email}${money ? ` · ${money}` : ''}`,
            status: purchase.status,
            severity: purchase.status === 'confirmed' ? 'success' as const : purchase.status === 'pending' ? 'warning' as const : 'info' as const,
            occurredAt: purchase.confirmed_at || purchase.purchased_at,
            email: purchase.email,
            amount: Number(purchase.amount_paid || 0),
            currency: purchase.currency,
            href: operationsHref(purchase.email),
        }
    })

    const transactions = ((transactionsResult.data ?? []) as any[]).map((transaction) => {
        const money = formatMoney(transaction.amount, transaction.currency)
        return {
            id: `transaction:${transaction.id}`,
            kind: 'Transaccion',
            title: transaction.purchase_type || 'Transaccion',
            subtitle: `${transaction.email}${money ? ` · ${money}` : ''}`,
            status: transaction.status,
            severity: transaction.status === 'completed' ? 'success' as const : transaction.status === 'failed' ? 'error' as const : 'warning' as const,
            occurredAt: transaction.completed_at || transaction.created_at,
            email: transaction.email,
            amount: Number(transaction.amount || 0),
            currency: transaction.currency,
            href: operationsHref(transaction.email),
        }
    })

    const purchases = sortItems([...eventPurchases, ...formationPurchases, ...transactions]).slice(0, RECENT_LIMIT)

    const staleEventPurchases = eventPurchases
        .filter((purchase) => purchase.status === 'pending' && minutesSince(purchase.occurredAt) >= PENDING_PURCHASE_STALE_MINUTES)
        .map((purchase) => ({
            ...purchase,
            id: `stale-${purchase.id}`,
            kind: 'Compra pendiente',
            title: `Pendiente: ${purchase.title}`,
            severity: 'warning' as const,
        }))

    const staleFormationPurchases = formationPurchases
        .filter((purchase) => purchase.status === 'pending' && minutesSince(purchase.occurredAt) >= PENDING_PURCHASE_STALE_MINUTES)
        .map((purchase) => ({
            ...purchase,
            id: `stale-${purchase.id}`,
            kind: 'Formacion pendiente',
            title: `Pendiente: ${purchase.title}`,
            severity: 'warning' as const,
        }))

    const webhookIssues = ((webhookIssuesResult.data ?? []) as any[])
        .filter((row) => row.status === 'failed' || minutesSince(row.created_at) >= WEBHOOK_STALE_MINUTES)
        .map((row) => ({
            id: `webhook:${row.id}`,
            kind: 'Webhook Stripe',
            title: row.status === 'failed' ? 'Webhook fallido' : 'Webhook atorado',
            subtitle: `${row.provider || 'stripe'} · ${row.provider_event_id || 'sin evento'} · intentos ${row.attempts}`,
            status: row.status,
            severity: row.status === 'failed' ? 'error' as const : 'warning' as const,
            occurredAt: row.failed_at || row.created_at,
        }))

    const operationIssues = ((operationIssuesResult.data ?? []) as any[]).map((row) => ({
        id: `operation:${row.id}`,
        kind: 'Operacion',
        title: row.action_type,
        subtitle: row.reason || row.entity_type || 'Requiere revision',
        status: row.entity_type,
        severity: row.action_type.includes('failed') || row.action_type.includes('skipped') ? 'error' as const : 'warning' as const,
        occurredAt: row.created_at,
        email: row.target_email,
        href: operationsHref(row.target_email, row.entity_type === 'event_purchase' ? row.entity_id : null),
    }))

    const health = sortItems([
        ...webhookIssues,
        ...staleEventPurchases,
        ...staleFormationPurchases,
        ...operationIssues,
    ]).slice(0, RECENT_LIMIT)

    const revenueVisible = purchases
        .filter((item) => item.status === 'confirmed' || item.status === 'completed')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return {
        summary: {
            formItems: forms.length,
            purchaseItems: purchases.length,
            healthIssues: health.length,
            revenueVisible,
        },
        forms: sortItems(forms).slice(0, RECENT_LIMIT),
        purchases,
        health,
    }
}

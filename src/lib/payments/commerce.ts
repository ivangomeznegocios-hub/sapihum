import { getAppUrl } from '@/lib/config/app-url'
import { sendEmail } from '@/lib/email/index'
import { buildEventPurchaseEmail, buildFormationPurchaseEmail } from '@/lib/email/templates'
import { createServiceClient } from '@/lib/supabase/service'

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

function resolveDisplayName(email: string, explicitName?: string | null) {
    const normalizedName = explicitName?.trim()
    if (normalizedName) return normalizedName
    return normalizeEmail(email).split('@')[0]
}

function formatEsMxDateTime(value: string | null | undefined, fallback = 'Por confirmar') {
    if (!value) return fallback

    return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value))
}

function buildRecoveryUrl(email: string, nextPath: string) {
    const appUrl = getAppUrl()
    const safeNextPath = nextPath.startsWith('/') ? nextPath : '/mi-acceso'
    return `${appUrl}/compras/recuperar?email=${encodeURIComponent(normalizeEmail(email))}&next=${encodeURIComponent(safeNextPath)}`
}

export async function logCommerceOperationalEvent(input: {
    actionType: string
    entityType: string
    entityId?: string | null
    targetUserId?: string | null
    targetEmail?: string | null
    reason?: string | null
    details?: Record<string, unknown>
}) {
    try {
        const admin = createServiceClient()
        await (admin
            .from('admin_operation_logs') as any)
            .insert({
                actor_user_id: null,
                action_type: input.actionType,
                entity_type: input.entityType,
                entity_id: input.entityId ?? null,
                target_user_id: input.targetUserId ?? null,
                target_email: input.targetEmail ? normalizeEmail(input.targetEmail) : null,
                reason: input.reason ?? null,
                details: input.details ?? {},
            })
    } catch (error) {
        console.error('[CommerceOps] Failed to log operational event:', error)
    }
}

export async function sendEventPurchaseConfirmation(params: {
    email: string
    eventTitle: string
    eventSlug?: string | null
    eventStartTime?: string | null
    amount: number
    isGuest: boolean
    purchaseId?: string | null
    userId?: string | null
    userName?: string | null
}) {
    const appUrl = getAppUrl()
    const safeHubPath = params.eventSlug ? `/hub/${params.eventSlug}` : '/mi-acceso'
    const recoveryUrl = buildRecoveryUrl(params.email, safeHubPath)
    const emailContent = buildEventPurchaseEmail({
        userName: resolveDisplayName(params.email, params.userName),
        eventTitle: params.eventTitle,
        eventDate: formatEsMxDateTime(params.eventStartTime),
        amount: params.amount,
        eventUrl: params.isGuest ? recoveryUrl : `${appUrl}${safeHubPath}`,
        isGuest: params.isGuest,
        recoveryUrl,
    })

    const result = await sendEmail({
        to: normalizeEmail(params.email),
        subject: emailContent.subject,
        html: emailContent.html,
    })

    await logCommerceOperationalEvent({
        actionType: result.success ? 'commerce_email_sent' : 'commerce_email_failed',
        entityType: 'event_purchase',
        entityId: params.purchaseId ?? null,
        targetUserId: params.userId ?? null,
        targetEmail: params.email,
        reason: result.success ? null : result.error ?? 'send_failed',
        details: {
            template: 'event_purchase_confirmation',
            isGuest: params.isGuest,
            amount: params.amount,
            eventTitle: params.eventTitle,
        },
    })

    return result
}

export async function sendFormationPurchaseConfirmation(params: {
    email: string
    formationTitle: string
    amount: number
    isGuest: boolean
    purchaseId?: string | null
    userId?: string | null
    userName?: string | null
    linkedCoursesCount?: number
}) {
    const appUrl = getAppUrl()
    const accessPath = '/mi-acceso'
    const recoveryUrl = buildRecoveryUrl(params.email, accessPath)
    const emailContent = buildFormationPurchaseEmail({
        userName: resolveDisplayName(params.email, params.userName),
        formationTitle: params.formationTitle,
        amount: params.amount,
        accessUrl: params.isGuest ? recoveryUrl : `${appUrl}${accessPath}`,
        isGuest: params.isGuest,
        recoveryUrl,
        linkedCoursesCount: params.linkedCoursesCount,
    })

    const result = await sendEmail({
        to: normalizeEmail(params.email),
        subject: emailContent.subject,
        html: emailContent.html,
    })

    await logCommerceOperationalEvent({
        actionType: result.success ? 'commerce_email_sent' : 'commerce_email_failed',
        entityType: 'formation_purchase',
        entityId: params.purchaseId ?? null,
        targetUserId: params.userId ?? null,
        targetEmail: params.email,
        reason: result.success ? null : result.error ?? 'send_failed',
        details: {
            template: 'formation_purchase_confirmation',
            isGuest: params.isGuest,
            amount: params.amount,
            formationTitle: params.formationTitle,
            linkedCoursesCount: params.linkedCoursesCount ?? 0,
        },
    })

    return result
}

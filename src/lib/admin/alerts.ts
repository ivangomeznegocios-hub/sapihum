import { getAppUrl } from '@/lib/config/app-url'
import { sendEmail } from '@/lib/email/index'
import { createServiceClient } from '@/lib/supabase/service'

type AdminAlertLevel = 'info' | 'success' | 'warning' | 'error'

export interface SendAdminOperationalAlertInput {
    level?: AdminAlertLevel
    subject: string
    title: string
    summary: string
    actionPath?: string
    entityType: string
    entityId?: string | null
    targetUserId?: string | null
    targetEmail?: string | null
    details?: Record<string, unknown>
}

function normalizeEmail(email: string | null | undefined) {
    return email?.trim().toLowerCase() || null
}

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

function formatDetails(details?: Record<string, unknown>) {
    if (!details || Object.keys(details).length === 0) return ''

    const rows = Object.entries(details)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .slice(0, 8)
        .map(([key, value]) => {
            const rendered = typeof value === 'object' ? JSON.stringify(value) : String(value)
            return `
                <tr>
                    <td style="padding:6px 10px;color:#64748b;border-bottom:1px solid #e2e8f0;">${escapeHtml(key)}</td>
                    <td style="padding:6px 10px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${escapeHtml(rendered)}</td>
                </tr>
            `
        })
        .join('')

    if (!rows) return ''

    return `
        <table style="border-collapse:collapse;width:100%;margin-top:16px;font-size:13px;">
            <tbody>${rows}</tbody>
        </table>
    `
}

function buildAlertHtml(input: SendAdminOperationalAlertInput, actionUrl: string) {
    const levelColors: Record<AdminAlertLevel, string> = {
        info: '#2563eb',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
    }
    const color = levelColors[input.level ?? 'info']

    return `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
            <div style="border-left:4px solid ${color};padding-left:16px;margin-bottom:18px;">
                <p style="margin:0 0 6px;color:${color};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Actividad operativa</p>
                <h1 style="margin:0;font-size:22px;line-height:1.25;">${escapeHtml(input.title)}</h1>
            </div>
            <p style="font-size:15px;margin:0 0 16px;">${escapeHtml(input.summary)}</p>
            ${formatDetails(input.details)}
            <p style="margin:22px 0 0;">
                <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;padding:10px 14px;font-weight:700;">
                    Abrir panel operativo
                </a>
            </p>
        </div>
    `
}

async function logAdminAlertIssue(input: SendAdminOperationalAlertInput, actionType: string, reason: string) {
    try {
        const admin = createServiceClient()
        await (admin.from('admin_operation_logs') as any).insert({
            actor_user_id: null,
            action_type: actionType,
            entity_type: input.entityType,
            entity_id: input.entityId ?? null,
            target_user_id: input.targetUserId ?? null,
            target_email: normalizeEmail(input.targetEmail),
            reason,
            details: {
                alert_subject: input.subject,
                alert_title: input.title,
                ...(input.details ?? {}),
            },
        })
    } catch (error) {
        console.error('[AdminAlert] Failed to log alert issue:', error)
    }
}

export function sendAdminOperationalAlertBestEffort(input: SendAdminOperationalAlertInput) {
    void sendAdminOperationalAlert(input).catch((error) => {
        console.error('[AdminAlert] Unexpected alert failure:', error)
    })
}

export async function sendAdminOperationalAlert(input: SendAdminOperationalAlertInput) {
    const adminEmail = normalizeEmail(process.env.ADMIN_NOTIFY_EMAIL)

    if (!adminEmail) {
        await logAdminAlertIssue(input, 'admin_alert_skipped', 'ADMIN_NOTIFY_EMAIL is not configured')
        return { success: false, skipped: true, error: 'ADMIN_NOTIFY_EMAIL is not configured' }
    }

    const appUrl = getAppUrl()
    const actionPath = input.actionPath?.startsWith('/') ? input.actionPath : '/dashboard/admin/inbox'
    const actionUrl = `${appUrl}${actionPath}`
    const result = await sendEmail({
        to: adminEmail,
        subject: input.subject,
        html: buildAlertHtml(input, actionUrl),
    })

    if (!result.success) {
        await logAdminAlertIssue(input, 'admin_alert_failed', result.error ?? 'send_failed')
    }

    return result
}

import { Resend } from 'resend'
import { getResendFromEmail } from './config'

let resendInstance: Resend | null = null

function getResend(): Resend {
    if (!resendInstance) {
        const key = process.env.RESEND_API_KEY
        if (!key) {
            throw new Error('RESEND_API_KEY is not configured')
        }
        resendInstance = new Resend(key)
    }
    return resendInstance
}

export interface SendEmailParams {
    to: string
    subject: string
    html: string
    replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const resend = getResend()
        const from = getResendFromEmail()
        const { data, error } = await resend.emails.send({
            from,
            to,
            subject,
            html,
            replyTo,
        })

        if (error) {
            console.error('[Email] Failed to send:', error)
            return { success: false, error: error.message }
        }

        console.log('[Email] Sent successfully:', { to, subject, id: data?.id })
        return { success: true, id: data?.id }
    } catch (err) {
        console.error('[Email] Unexpected error:', err)
        return { success: false, error: (err as Error).message }
    }
}

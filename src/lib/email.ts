import { Resend } from 'resend'
import WelcomeEmail from '@/emails/WelcomeEmail'
import AppointmentConfirmationEmail from '@/emails/AppointmentConfirmation'
import { emailFromName } from '@/lib/brand'
import { getResendFromEmail } from '@/lib/email/config'

let resendInstance: Resend | null = null

function getResend(): Resend | null {
    const key = process.env.RESEND_API_KEY?.trim()
    if (!key) {
        return null
    }

    if (!resendInstance) {
        resendInstance = new Resend(key)
    }

    return resendInstance
}

const DEFAULT_REPLY_TO = 'soporte@comunidaddepsicologia.com'

export async function sendWelcomeEmail({
    to,
    name,
}: {
    to: string
    name: string
}) {
    const resend = getResend()
    if (!resend) {
        console.warn('RESEND_API_KEY is not set. Skipping email send.')
        return { success: false, error: 'Email service inactive' }
    }

    try {
        const from = getResendFromEmail()
        const { data, error } = await resend.emails.send({
            from,
            to,
            subject: `Bienvenido(a) a ${emailFromName}`,
            react: WelcomeEmail({ name }),
            replyTo: DEFAULT_REPLY_TO,
        })

        if (error) {
            console.error('Error sending welcome email:', error)
            return { success: false, error }
        }

        return { success: true, data }
    } catch (err) {
        console.error('Fallback error sending welcome email:', err)
        return { success: false, error: err }
    }
}

export async function sendAppointmentConfirmationEmail({
    to,
    patientName,
    psychologistName,
    date,
    time,
    meetingLink,
}: {
    to: string
    patientName: string
    psychologistName: string
    date: string
    time: string
    meetingLink?: string
}) {
    const resend = getResend()
    if (!resend) {
        console.warn('RESEND_API_KEY is not set. Skipping email send.')
        return { success: false, error: 'Email service inactive' }
    }

    try {
        const from = getResendFromEmail()
        const { data, error } = await resend.emails.send({
            from,
            to,
            subject: 'Confirmacion de Cita',
            react: AppointmentConfirmationEmail({
                patientName,
                psychologistName,
                date,
                time,
                meetingLink,
            }),
            replyTo: DEFAULT_REPLY_TO,
        })

        if (error) {
            console.error('Error sending appointment confirmation email:', error)
            return { success: false, error }
        }

        return { success: true, data }
    } catch (err) {
        console.error('Fallback error sending appointment confirmation email:', err)
        return { success: false, error: err }
    }
}

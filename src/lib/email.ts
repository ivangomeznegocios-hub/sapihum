import { Resend } from 'resend'
import WelcomeEmail from '@/emails/WelcomeEmail'
import AppointmentConfirmationEmail from '@/emails/AppointmentConfirmation'
import { emailFromName } from '@/lib/brand'

const resend = new Resend(process.env.RESEND_API_KEY)

// Set this to your verified domain in Resend
const FROM_EMAIL = `${emailFromName} <notificaciones@comunidaddepsicologia.com>`
const DEFAULT_REPLY_TO = 'soporte@comunidaddepsicologia.com'

export async function sendWelcomeEmail({
    to,
    name,
}: {
    to: string
    name: string
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping email send.')
        return { success: false, error: 'Email service inactive' }
    }

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
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
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping email send.')
        return { success: false, error: 'Email service inactive' }
    }

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
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

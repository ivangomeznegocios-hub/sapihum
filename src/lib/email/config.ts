export function getResendFromEmail(): string {
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim()

    if (!fromEmail) {
        throw new Error('RESEND_FROM_EMAIL is not configured')
    }

    return fromEmail
}

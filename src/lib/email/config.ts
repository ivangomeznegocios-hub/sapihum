export const DEFAULT_EMAIL_FROM = 'SAPIHUM Team <team@mail.sapihum.com>'
export const OPERATIONS_EMAIL = 'team@mail.sapihum.com'
export const LEGAL_EMAIL = 'privacidad@mail.sapihum.com'
export const DEFAULT_REPLY_TO = LEGAL_EMAIL

export function getResendFromEmail(): string {
    return DEFAULT_EMAIL_FROM
}

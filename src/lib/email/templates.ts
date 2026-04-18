import { getAppUrl } from '@/lib/config/app-url'

const BRAND_COLOR = '#f6ae02' // SAPIHUM yellow
const BG_COLOR = '#f5f5f5'
const CARD_BG = '#ffffff'
const TEXT_COLOR = '#2c2c2b'
const MUTED_COLOR = '#737373'

function baseLayout(content: string) {
    const appUrl = getAppUrl()
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};padding:32px 16px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                <!-- Header -->
                <tr><td style="padding:0 0 24px;">
                    <a href="${appUrl}" style="text-decoration:none;display:inline-block;">
                        <span style="display:inline-block;font-size:18px;font-weight:800;color:${BRAND_COLOR};letter-spacing:3px;text-transform:uppercase;">SAPIHUM</span>
                    </a>
                </td></tr>
                <!-- Content Card -->
                <tr><td style="background:${CARD_BG};border-radius:16px;padding:40px 32px;border:1px solid #e2e8f0;">
                    ${content}
                </td></tr>
                <!-- Footer -->
                <tr><td style="padding:24px 0 0;text-align:center;">
                    <p style="margin:0;font-size:12px;color:${MUTED_COLOR};">
                        SAPIHUM — Psicología Avanzada e Investigación Humana
                    </p>
                    <p style="margin:8px 0 0;font-size:11px;color:${MUTED_COLOR};">
                        <a href="${appUrl}/mi-acceso" style="color:${BRAND_COLOR};text-decoration:none;">Mis accesos</a>
                        &nbsp;·&nbsp;
                        <a href="${appUrl}/compras/recuperar" style="color:${BRAND_COLOR};text-decoration:none;">Recuperar acceso</a>
                        &nbsp;·&nbsp;
                        <a href="${appUrl}/eventos" style="color:${BRAND_COLOR};text-decoration:none;">Eventos</a>
                    </p>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`
}

function ctaButton(href: string, label: string) {
    return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
        <tr><td align="center">
            <a href="${href}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,${BRAND_COLOR},#7a5602);color:white;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
                ${label}
            </a>
        </td></tr>
    </table>`
}

// ─── EVENT REGISTRATION (free) ───

export function buildEventRegistrationEmail(params: {
    userName: string
    eventTitle: string
    eventDate: string
    eventUrl: string
}) {
    const subject = `✅ Registro confirmado: ${params.eventTitle}`
    const html = baseLayout(`
        <h1 style="margin:0 0 8px;font-size:24px;color:${TEXT_COLOR};">¡Registro confirmado!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:${MUTED_COLOR};line-height:1.6;">
            Hola ${params.userName}, tu lugar en <strong style="color:${TEXT_COLOR};">${params.eventTitle}</strong> está reservado.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};border-radius:12px;padding:20px;margin:0 0 8px;">
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Evento</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};text-align:right;">${params.eventTitle}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Fecha</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};text-align:right;">${params.eventDate}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Acceso</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:#7a5602;text-align:right;">Confirmado</td>
            </tr>
        </table>
        ${ctaButton(params.eventUrl, 'Ir al evento →')}
        <p style="margin:16px 0 0;font-size:12px;color:${MUTED_COLOR};text-align:center;">
            Guarda este correo. Podrás usarlo para recuperar tu acceso en cualquier momento.
        </p>
    `)
    return { subject, html }
}

// ─── EVENT PURCHASE CONFIRMATION ───

export function buildEventPurchaseEmail(params: {
    userName: string
    eventTitle: string
    eventDate: string
    amount: number
    eventUrl: string
    isGuest: boolean
    recoveryUrl: string
}) {
    const subject = `🎟️ Compra confirmada: ${params.eventTitle}`
    const html = baseLayout(`
        <h1 style="margin:0 0 8px;font-size:24px;color:${TEXT_COLOR};">¡Compra exitosa!</h1>
        <p style="margin:0 0 24px;font-size:15px;color:${MUTED_COLOR};line-height:1.6;">
            Hola ${params.userName}, tu acceso a <strong style="color:${TEXT_COLOR};">${params.eventTitle}</strong> ha sido confirmado.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};border-radius:12px;padding:20px;margin:0 0 8px;">
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Evento</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};text-align:right;">${params.eventTitle}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Fecha</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};text-align:right;">${params.eventDate}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Monto pagado</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};text-align:right;">$${params.amount.toFixed(2)} MXN</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Acceso</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:#7a5602;text-align:right;">✅ Activo</td>
            </tr>
        </table>
        ${ctaButton(params.eventUrl, 'Acceder al evento →')}
        ${params.isGuest ? `
        <div style="margin:24px 0 0;padding:16px 20px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
            <p style="margin:0;font-size:13px;color:#166534;line-height:1.5;">
                <strong>Acceso rápido:</strong> Compraste sin cuenta. Puedes recuperar tu acceso en cualquier momento desde
                <a href="${params.recoveryUrl}" style="color:${BRAND_COLOR};font-weight:600;">${params.recoveryUrl}</a>
                usando este correo electrónico.
            </p>
        </div>
        ` : ''}
        <p style="margin:16px 0 0;font-size:12px;color:${MUTED_COLOR};text-align:center;">
            Conserva este correo como comprobante de tu compra.
        </p>
    `)
    return { subject, html }
}

// ─── GUEST ACCESS (free event) ───

export function buildFormationPurchaseEmail(params: {
    userName: string
    formationTitle: string
    amount: number
    accessUrl: string
    isGuest: boolean
    recoveryUrl: string
    linkedCoursesCount?: number
}) {
    const subject = `Compra confirmada: ${params.formationTitle}`
    const linkedCoursesLabel = params.linkedCoursesCount && params.linkedCoursesCount > 0
        ? `${params.linkedCoursesCount} curso${params.linkedCoursesCount === 1 ? '' : 's'}`
        : 'Acceso incluido'
    const html = baseLayout(`
        <h1 style="margin:0 0 8px;font-size:24px;color:${TEXT_COLOR};">Compra exitosa</h1>
        <p style="margin:0 0 24px;font-size:15px;color:${MUTED_COLOR};line-height:1.6;">
            Hola ${params.userName}, tu acceso a <strong style="color:${TEXT_COLOR};">${params.formationTitle}</strong> ha sido confirmado.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};border-radius:12px;padding:20px;margin:0 0 8px;">
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Formacion</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};text-align:right;">${params.formationTitle}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Monto pagado</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};text-align:right;">$${params.amount.toFixed(2)} MXN</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Contenido</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};text-align:right;">${linkedCoursesLabel}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Acceso</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:#7a5602;text-align:right;">Activo</td>
            </tr>
        </table>
        ${ctaButton(params.accessUrl, 'Ir a mi acceso ->')}
        ${params.isGuest ? `
        <div style="margin:24px 0 0;padding:16px 20px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
            <p style="margin:0;font-size:13px;color:#166534;line-height:1.5;">
                <strong>Acceso rapido:</strong> Compraste sin cuenta. Puedes recuperar tu acceso en cualquier momento desde
                <a href="${params.recoveryUrl}" style="color:${BRAND_COLOR};font-weight:600;">${params.recoveryUrl}</a>
                usando este correo electronico.
            </p>
        </div>
        ` : ''}
        <p style="margin:16px 0 0;font-size:12px;color:${MUTED_COLOR};text-align:center;">
            Conserva este correo como comprobante de tu compra.
        </p>
    `)
    return { subject, html }
}

export function buildGuestAccessEmail(params: {
    userName: string
    eventTitle: string
    eventDate: string
    recoveryUrl: string
}) {
    const subject = `🔑 Tu acceso: ${params.eventTitle}`
    const html = baseLayout(`
        <h1 style="margin:0 0 8px;font-size:24px;color:${TEXT_COLOR};">Tu acceso está listo</h1>
        <p style="margin:0 0 24px;font-size:15px;color:${MUTED_COLOR};line-height:1.6;">
            Hola ${params.userName}, te registraste en <strong style="color:${TEXT_COLOR};">${params.eventTitle}</strong>.
            Usa el botón de abajo para acceder al hub del evento.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};border-radius:12px;padding:20px;margin:0 0 8px;">
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Evento</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};text-align:right;">${params.eventTitle}</td>
            </tr>
            <tr>
                <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">Fecha</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};text-align:right;">${params.eventDate}</td>
            </tr>
        </table>
        ${ctaButton(params.recoveryUrl, 'Acceder al evento →')}
        <p style="margin:16px 0 0;font-size:12px;color:${MUTED_COLOR};text-align:center;">
            Puedes recuperar tu acceso en cualquier momento desde <a href="${params.recoveryUrl}" style="color:${BRAND_COLOR};">compras/recuperar</a>.
        </p>
    `)
    return { subject, html }
}

export function buildCampaignLeadMagnetEmail(params: {
    userName: string
    campaignTitle: string
    temarioUrl: string
    primaryEventTitle: string
    primaryEventUrl: string
    relatedEvents: Array<{ title: string; url: string }>
}) {
    const subject = `Temario listo: ${params.campaignTitle}`
    const relatedEventsHtml = params.relatedEvents
        .slice(0, 3)
        .map((event) => (
            `<li style="margin:0 0 10px;color:${TEXT_COLOR};">` +
            `<a href="${event.url}" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">${event.title}</a>` +
            `</li>`
        ))
        .join('')

    const html = baseLayout(`
        <h1 style="margin:0 0 8px;font-size:24px;color:${TEXT_COLOR};">Tu temario ya esta listo</h1>
        <p style="margin:0 0 20px;font-size:15px;color:${MUTED_COLOR};line-height:1.6;">
            Hola ${params.userName}, aqui tienes el temario del bloque <strong style="color:${TEXT_COLOR};">${params.campaignTitle}</strong>.
        </p>
        <div style="margin:0 0 20px;padding:18px 20px;background:${BG_COLOR};border-radius:12px;border:1px solid #e2e8f0;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${TEXT_COLOR};text-transform:uppercase;letter-spacing:0.08em;">
                Recomendacion principal
            </p>
            <p style="margin:0;font-size:15px;color:${TEXT_COLOR};line-height:1.6;">
                Si quieres avanzar hoy mismo, empieza por <strong>${params.primaryEventTitle}</strong>.
            </p>
        </div>
        ${ctaButton(params.temarioUrl, 'Descargar temario ->')}
        <div style="margin:20px 0 0;text-align:center;">
            <a href="${params.primaryEventUrl}" style="color:${BRAND_COLOR};font-weight:600;text-decoration:none;">
                Ver evento recomendado
            </a>
        </div>
        ${relatedEventsHtml ? `
        <div style="margin:28px 0 0;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${TEXT_COLOR};text-transform:uppercase;letter-spacing:0.08em;">
                Eventos relacionados de esta ruta
            </p>
            <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.6;color:${MUTED_COLOR};">
                ${relatedEventsHtml}
            </ul>
        </div>
        ` : ''}
        <p style="margin:18px 0 0;font-size:12px;color:${MUTED_COLOR};line-height:1.6;text-align:center;">
            Si aun no decides comprar o registrarte, guarda este correo y vuelve cuando quieras. Tu interes ya quedo registrado.
        </p>
    `)

    return { subject, html }
}

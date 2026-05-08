import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recordAnalyticsServerEvent, resolveAttributionSnapshot } from '@/lib/analytics/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

const FounderLeadSchema = z.object({
    fullName: z.string().trim().min(2),
    email: z.string().trim().email(),
    whatsapp: z.string().trim().min(6).max(40),
    location: z.string().trim().min(2).max(120),
    professionalProfile: z.string().trim().min(2).max(80),
    interestArea: z.string().trim().min(2).max(80),
    consent: z.literal(true),
    analyticsContext: z.any().optional().nullable(),
})

export async function POST(request: NextRequest) {
    // Rate limiting: 5 req/min + 20 req/hour per IP
    const rlMinute = await checkRateLimit(request, { namespace: 'leads:founders:minute', limit: 5, window: '1 m' })
    if (!rlMinute.success) return rateLimitResponse(rlMinute)

    const rlHour = await checkRateLimit(request, { namespace: 'leads:founders:hour', limit: 20, window: '1 h' })
    if (!rlHour.success) return rateLimitResponse(rlHour)

    try {
        const payload = FounderLeadSchema.safeParse(await request.json())
        if (!payload.success) {
            return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
        }

        const data = payload.data
        const normalizedEmail = data.email.trim().toLowerCase()
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        const attributionSnapshot = await resolveAttributionSnapshot(data.analyticsContext ?? undefined)
        const admin = createServiceClient()

        const { error } = await (admin.from('admin_operation_logs') as any).insert({
            actor_user_id: null,
            action_type: 'founder_lead_captured',
            entity_type: 'founders_mx_2026',
            entity_id: null,
            target_user_id: user?.id ?? null,
            target_email: normalizedEmail,
            reason: 'calendar_request',
            details: {
                fullName: data.fullName,
                whatsapp: data.whatsapp,
                location: data.location,
                professionalProfile: data.professionalProfile,
                interestArea: data.interestArea,
                consent: data.consent,
                sourceSurface: 'fundadores-mexico',
                sourceAction: 'calendar_request',
                attributionSnapshot,
            },
        })

        if (error) {
            console.error('[FoundersLead] insert failed:', error)
            return NextResponse.json({ error: 'No fue posible guardar tus datos' }, { status: 500 })
        }

        await recordAnalyticsServerEvent({
            eventName: 'generate_lead',
            eventSource: 'server',
            visitorId: data.analyticsContext?.visitorId ?? null,
            sessionId: data.analyticsContext?.sessionId ?? null,
            userId: user?.id ?? null,
            consent: data.analyticsContext?.consent ?? null,
            touch: data.analyticsContext?.touch ?? {
                funnel: 'landing',
                landingPath: '/fundadores-mexico',
                targetPlan: 'founders_mx_2026',
            },
            properties: {
                leadType: 'founder_calendar_request',
                campaign: 'founders_mx_2026',
                professionalProfile: data.professionalProfile,
                interestArea: data.interestArea,
                sourceSurface: 'fundadores-mexico',
                sourceAction: 'calendar_request',
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Listo. Te enviaremos el calendario de mayo y los detalles del acceso fundador SAPIHUM. Revisa tu correo y WhatsApp.',
        })
    } catch (error) {
        console.error('[FoundersLead] unexpected error:', error)
        return NextResponse.json({ error: 'No fue posible procesar la solicitud' }, { status: 500 })
    }
}

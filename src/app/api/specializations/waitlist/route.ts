import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getSpecializationByCode } from '@/lib/specializations'
import { recordAnalyticsServerEvent, resolveAttributionSnapshot } from '@/lib/analytics/server'

type WaitlistSource = 'landing' | 'app'

function normalizeSource(input: unknown): WaitlistSource {
    return input === 'app' ? 'app' : 'landing'
}

function normalizeEmail(input: unknown): string {
    if (typeof input !== 'string') return ''
    return input.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const specializationCode = typeof body.specializationCode === 'string'
            ? body.specializationCode
            : ''
        const source = normalizeSource(body.source)
        const analyticsContext = body.analyticsContext || null

        const specialization = getSpecializationByCode(specializationCode)
        if (!specialization || specialization.status === 'hidden') {
            return NextResponse.json({ error: 'Especializacion no valida' }, { status: 400 })
        }

        if (specialization.status === 'active') {
            return NextResponse.json(
                { error: 'Esta especializacion ya esta activa. Puedes comprarla directamente.' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const userEmail = user?.email?.toLowerCase() || ''
        const providedEmail = normalizeEmail(body.email)
        const email = userEmail || providedEmail

        if (!email && !user?.id) {
            return NextResponse.json(
                { error: 'Necesitamos un correo para avisarte cuando se abra esta especializacion' },
                { status: 400 }
            )
        }

        const admin = await createAdminClient()
        const attributionSnapshot = await resolveAttributionSnapshot(analyticsContext || undefined)
        const { error } = await (admin as any)
            .from('specialization_waitlist')
            .upsert(
                {
                    specialization_code: specialization.code,
                    user_id: user?.id || null,
                    email: email || null,
                    source,
                    metadata: {
                        source,
                        user_agent: request.headers.get('user-agent') || null,
                        attributionSnapshot,
                    },
                },
                {
                    onConflict: 'contact_key,specialization_code',
                    ignoreDuplicates: false,
                }
            )

        if (error) {
            console.error('[Waitlist] insert error:', error)
            return NextResponse.json({ error: 'No se pudo registrar en lista de espera' }, { status: 500 })
        }

        await recordAnalyticsServerEvent({
            eventName: 'waitlist_joined',
            eventSource: 'server',
            visitorId: analyticsContext?.visitorId ?? null,
            sessionId: analyticsContext?.sessionId ?? null,
            userId: user?.id ?? null,
            touch: analyticsContext?.touch ?? {
                funnel: 'waitlist',
                targetSpecialization: specialization.code,
                landingPath: request.nextUrl.pathname,
            },
            properties: {
                specializationCode: specialization.code,
                source,
            },
        })

        return NextResponse.json({
            success: true,
            message: `Te avisaremos cuando ${specialization.name} este disponible.`,
        })
    } catch (error) {
        console.error('[Waitlist] unexpected error:', error)
        return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
    }
}

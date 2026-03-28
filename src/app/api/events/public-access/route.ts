import { NextRequest, NextResponse } from 'next/server'
import { grantEventEntitlements } from '@/lib/events/entitlements'
import { getPublicEventPath } from '@/lib/events/public'
import {
    getEffectiveEventPriceForProfile,
    normalizeMemberAccessType,
} from '@/lib/events/pricing'
import { getUniqueEventAccessCount } from '@/lib/events/attendance'
import { createClient } from '@/lib/supabase/server'
import { audienceAllowsAccess, getCommercialAccessContext } from '@/lib/access/commercial'
import { sendEmail } from '@/lib/email/index'
import { buildGuestAccessEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const body = await request.json()
        const { eventId, email, fullName } = body as {
            eventId?: string
            email?: string
            fullName?: string
        }

        if (!eventId) {
            return NextResponse.json({ error: 'Evento requerido' }, { status: 400 })
        }

        const { data: event } = await (supabase
            .from('events') as any)
            .select('id, slug, title, price, member_price, member_access_type, target_audience, status, event_type, created_by, recording_expires_at, max_attendees')
            .eq('id', eventId)
            .single()

        if (!event || ['draft', 'cancelled'].includes(event.status)) {
            return NextResponse.json({ error: 'Activo no disponible' }, { status: 404 })
        }

        if (event.max_attendees) {
            const attendeeCount = await getUniqueEventAccessCount(supabase, eventId)
            if (attendeeCount >= event.max_attendees) {
                return NextResponse.json({ error: 'Este evento ya alcanzó su cupo' }, { status: 409 })
            }
        }

        if (user) {
            const { data: profile } = await (supabase
                .from('profiles') as any)
                .select('id, email, full_name, role, membership_level, subscription_status')
                .eq('id', user.id)
                .single()

            if (!profile) {
                return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
            }

            const commercialAccess = await getCommercialAccessContext({
                supabase,
                userId: user.id,
                profile,
            })
            if (!commercialAccess) {
                return NextResponse.json({ error: 'No fue posible resolver el acceso comercial de esta cuenta' }, { status: 500 })
            }
            const hasAudienceAccess = audienceAllowsAccess(event.target_audience, commercialAccess, {
                creatorId: event.created_by,
            })
            if (!hasAudienceAccess) {
                return NextResponse.json({ error: 'No tienes acceso a este activo' }, { status: 403 })
            }

            const effectivePrice = getEffectiveEventPriceForProfile(
                {
                    price: event.price,
                    member_price: event.member_price,
                    member_access_type: normalizeMemberAccessType(event.member_access_type),
                },
                {
                    role: profile.role,
                    membershipLevel: commercialAccess.membershipLevel,
                    hasActiveMembership: commercialAccess.hasActiveMembership,
                }
            )

            if (effectivePrice > 0) {
                return NextResponse.json({ error: 'Este activo requiere pago' }, { status: 400 })
            }

            const { data: existingRegistration } = await (supabase
                .from('event_registrations') as any)
                .select('id')
                .eq('event_id', eventId)
                .eq('user_id', user.id)
                .eq('status', 'registered')
                .maybeSingle()

            if (!existingRegistration) {
                await (supabase.from('event_registrations') as any).insert({
                    event_id: eventId,
                    user_id: user.id,
                    status: 'registered',
                    registration_data: {
                        source: 'public-access',
                    },
                })
            }

            await grantEventEntitlements({
                event,
                email: profile.email || user.email || '',
                userId: user.id,
                sourceType: effectivePrice === 0 && Number(event.price || 0) > 0 ? 'membership' : 'registration',
                sourceReference: existingRegistration?.id ?? null,
                metadata: {
                    via: 'public_access_route',
                    full_name: profile.full_name || fullName || null,
                },
            })

            return NextResponse.json({
                redirectTo: `/hub/${event.slug}?granted=1`,
            })
        }

        const audience = Array.isArray(event.target_audience) ? event.target_audience : ['public']
        if (!audience.includes('public')) {
            return NextResponse.json({ error: 'Este activo requiere una cuenta autorizada' }, { status: 403 })
        }

        if (Number(event.price || 0) > 0) {
            return NextResponse.json({ error: 'Este activo requiere pago' }, { status: 400 })
        }

        if (!email || !fullName) {
            return NextResponse.json(
                {
                    error: 'Correo requerido',
                    requiresGuestDetails: true,
                },
                { status: 401 }
            )
        }

        await grantEventEntitlements({
            event,
            email,
            sourceType: 'registration',
            metadata: {
                via: 'public_guest_access',
                full_name: fullName,
            },
        })

        // Send guest access email (non-blocking)
        try {
            const { getAppUrl } = await import('@/lib/config/app-url')
            const appUrl = getAppUrl()
            const eventDate = event.start_time
                ? new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(event.start_time))
                : 'Por confirmar'

            const emailContent = buildGuestAccessEmail({
                userName: fullName,
                eventTitle: event.title,
                eventDate,
                recoveryUrl: `${appUrl}/compras/recuperar?email=${encodeURIComponent(email)}`,
            })

            await sendEmail({
                to: email,
                subject: emailContent.subject,
                html: emailContent.html,
            })
        } catch (emailError) {
            console.error('[API] Failed to send guest access email:', emailError)
        }

        return NextResponse.json({
            message: 'Tu acceso se reservo correctamente. Te llevaremos a recuperar tu acceso por correo para abrir el hub privado.',
            publicPath: getPublicEventPath(event),
            recoveryUrl: `/compras/recuperar?email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/hub/${event.slug}`)}`,
        })
    } catch (error) {
        console.error('[API] Public event access error:', error)
        return NextResponse.json({ error: 'No fue posible reservar el acceso' }, { status: 500 })
    }
}

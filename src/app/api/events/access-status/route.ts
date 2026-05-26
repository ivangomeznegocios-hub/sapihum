import { NextRequest, NextResponse } from 'next/server'
import { getCommercialAccessContext } from '@/lib/access/commercial'
import { entitlementCanGrantEventAccess, getActiveEntitlementForEvent } from '@/lib/events/access'
import { syncCongressBundleEntitlementsForIdentity } from '@/lib/events/congress'
import { syncProgramBundleEntitlementsForIdentity } from '@/lib/events/programs'
import { createClient } from '@/lib/supabase/server'
import { getPublicEventById } from '@/lib/supabase/queries/events'

const anonymousAccessState = {
    membershipLevel: 0,
    hasActiveMembership: false,
    membershipSpecializationCode: null,
    hasAccess: false,
}

export async function GET(request: NextRequest) {
    try {
        const eventId = request.nextUrl.searchParams.get('eventId')
        if (!eventId) {
            return NextResponse.json({ error: 'Evento requerido' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(anonymousAccessState)
        }

        const [{ data: profile }, event] = await Promise.all([
            (supabase
                .from('profiles') as any)
                .select('id, email, full_name, role, membership_level, subscription_status, membership_specialization_code')
                .eq('id', user.id)
                .maybeSingle(),
            getPublicEventById(eventId),
        ])

        if (!profile || !event) {
            return NextResponse.json(anonymousAccessState)
        }

        const commercialAccess = await getCommercialAccessContext({
            supabase,
            userId: user.id,
            profile,
        })

        if (user.email) {
            await Promise.all([
                syncCongressBundleEntitlementsForIdentity({
                    supabase,
                    userId: user.id,
                    email: user.email,
                    commercialAccess,
                }),
                syncProgramBundleEntitlementsForIdentity({
                    supabase,
                    userId: user.id,
                    email: user.email,
                    commercialAccess,
                }),
            ])
        }

        const entitlement = await getActiveEntitlementForEvent({
            supabase,
            eventId,
            userId: user.id,
            email: user.email,
        })

        return NextResponse.json({
            membershipLevel: commercialAccess?.membershipLevel ?? 0,
            hasActiveMembership: commercialAccess?.hasActiveMembership ?? false,
            membershipSpecializationCode: commercialAccess?.membershipSpecializationCode ?? null,
            hasAccess: entitlementCanGrantEventAccess({
                entitlement,
                event,
                commercialAccess,
            }),
        })
    } catch (error) {
        console.error('[API] Public event access status error:', error)
        return NextResponse.json(anonymousAccessState)
    }
}

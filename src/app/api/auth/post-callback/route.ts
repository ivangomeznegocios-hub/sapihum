import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyInviteCode, completeInviteAttribution } from '@/actions/invite-referrals'
import { recordRegistrationConsents } from '@/actions/consent'
import { hasRegistrationConsentMetadata } from '@/lib/consent'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
import { claimCurrentUserEventEntitlements } from '@/lib/supabase/queries/event-entitlements'
import { ensureProfileForAuthUser } from '@/lib/supabase/profile-provisioning'
import { applyGroupPackRegistration } from '@/lib/growth/engine'

export async function POST() {
    const supabase = await createClient()
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json(
            {
                ok: false,
                error: 'unauthenticated',
            },
            { status: 401 }
        )
    }

    try {
        await ensureProfileForAuthUser(user)

        const userMetadata = user.user_metadata ?? null
        const inviteRefCode = userMetadata?.invite_ref_code
        const growthPackCode = typeof userMetadata?.growth_pack_code === 'string' ? userMetadata.growth_pack_code : null
        const visitorId = typeof userMetadata?.analytics_visitor_id === 'string' ? userMetadata.analytics_visitor_id : null
        const sessionId = typeof userMetadata?.analytics_session_id === 'string' ? userMetadata.analytics_session_id : null
        const consent = userMetadata?.analytics_consent && typeof userMetadata.analytics_consent === 'object'
            ? userMetadata.analytics_consent
            : null
        const touch = userMetadata?.analytics_touch && typeof userMetadata.analytics_touch === 'object'
            ? userMetadata.analytics_touch
            : null

        if (hasRegistrationConsentMetadata(userMetadata)) {
            await recordRegistrationConsents(userMetadata)
        }

        await claimCurrentUserEventEntitlements()

        await recordAnalyticsServerEvent({
            eventName: 'registration_verified',
            eventSource: 'server',
            visitorId,
            sessionId,
            userId: user.id,
            consent: consent as any,
            touch,
            properties: {
                hasInviteCode: Boolean(inviteRefCode),
                hasGroupPack: Boolean(growthPackCode),
                selectedPlan: userMetadata?.preselected_plan ?? null,
                selectedSpecialization: userMetadata?.preselected_specialization ?? null,
            },
        })

        if (inviteRefCode) {
            const result = await applyInviteCode(user.id, inviteRefCode)
            if (result.success) {
                await completeInviteAttribution(user.id)
            }
        }

        if (growthPackCode) {
            await applyGroupPackRegistration({
                packCode: growthPackCode,
                userId: user.id,
                email: user.email,
            })
        }
    } catch (error) {
        console.error('Error processing post-auth callback tasks', {
            userId: user.id,
            message: error instanceof Error ? error.message : String(error),
        })
    }

    return NextResponse.json({ ok: true })
}

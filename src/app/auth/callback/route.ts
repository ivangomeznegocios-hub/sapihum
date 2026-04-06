import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyInviteCode, completeInviteAttribution } from '@/actions/invite-referrals'
import { recordRegistrationConsents } from '@/actions/consent'
import { hasRegistrationConsentMetadata } from '@/lib/consent'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'
import { claimCurrentUserEventEntitlements } from '@/lib/supabase/queries/event-entitlements'
import { getAppUrl } from '@/lib/config/app-url'

function resolveCallbackNext(requestedNext: string | null, type: string | null) {
    if (requestedNext?.startsWith('/')) {
        return requestedNext === '/update-password' ? '/auth/update-password' : requestedNext
    }

    if (type === 'recovery') {
        return '/auth/update-password'
    }

    if (type === 'magiclink') {
        return '/mi-acceso'
    }

    return '/dashboard'
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const requestedNext = searchParams.get('next')
    const next = resolveCallbackNext(requestedNext, type)

    if (code || (tokenHash && type)) {
        const supabase = await createClient()
        const { error } = code
            ? await supabase.auth.exchangeCodeForSession(code)
            : await (supabase.auth as any).verifyOtp({
                token_hash: tokenHash,
                type,
            })

        if (!error) {
            // Process invite referral code if present in user metadata
            try {
                const { data: { user } } = await supabase.auth.getUser()
                const userMetadata = user?.user_metadata ?? null
                const inviteRefCode = userMetadata?.invite_ref_code
                const visitorId = typeof userMetadata?.analytics_visitor_id === 'string' ? userMetadata.analytics_visitor_id : null
                const sessionId = typeof userMetadata?.analytics_session_id === 'string' ? userMetadata.analytics_session_id : null
                const touch = userMetadata?.analytics_touch && typeof userMetadata.analytics_touch === 'object'
                    ? userMetadata.analytics_touch
                    : null

                if (hasRegistrationConsentMetadata(userMetadata)) {
                    await recordRegistrationConsents(userMetadata)
                }
                await claimCurrentUserEventEntitlements()
                if (user) {
                    await recordAnalyticsServerEvent({
                        eventName: 'registration_verified',
                        eventSource: 'server',
                        visitorId,
                        sessionId,
                        userId: user.id,
                        touch,
                        properties: {
                            hasInviteCode: Boolean(inviteRefCode),
                            selectedPlan: userMetadata?.preselected_plan ?? null,
                            selectedSpecialization: userMetadata?.preselected_specialization ?? null,
                        },
                    })
                }
                if (user && inviteRefCode) {
                    // Apply the invite code (create attribution)
                    const result = await applyInviteCode(user.id, inviteRefCode)
                    if (result.success) {
                        // Mark as completed since email is now verified
                        await completeInviteAttribution(user.id)
                    }
                }
            } catch (err) {
                // Don't block login if referral processing fails
                console.error('Error processing invite referral on callback:', err)
            }

            return NextResponse.redirect(new URL(next, getAppUrl()))
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(new URL('/auth/login?error=auth_callback_error', getAppUrl()))
}

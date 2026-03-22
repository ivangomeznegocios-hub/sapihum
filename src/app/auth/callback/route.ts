import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyInviteCode, completeInviteAttribution } from '@/actions/invite-referrals'
import { recordRegistrationConsents } from '@/actions/consent'
import { hasRegistrationConsentMetadata } from '@/lib/consent'
import { recordAnalyticsServerEvent } from '@/lib/analytics/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const requestedNext = searchParams.get('next')
    const next = requestedNext?.startsWith('/')
        ? (requestedNext === '/update-password' ? '/auth/update-password' : requestedNext)
        : (type === 'recovery' ? '/auth/update-password' : '/dashboard')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
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

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}

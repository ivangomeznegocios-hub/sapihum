'use server'

import { createClient } from '@/lib/supabase/server'
import { getCommercialAccessContext } from '@/lib/access/commercial'
import { claimFormationRecordsByEmail } from '@/lib/formations/service'
import { getFormationCommercialState, getFormationMemberAccessMessage } from '@/lib/formations/pricing'
import { claimEventEntitlementsByEmail } from '@/lib/events/access'

export async function getPublicFormations() {
    const supabase = await createClient()

    const { data: formations, error } = await (supabase
        .from('formations') as any)
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching public formations:', error)
        return []
    }

    return formations || []
}

export async function getPublicFormationBySlug(slug: string) {
    const supabase = await createClient()

    const { data: formation, error } = await (supabase
        .from('formations') as any)
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single()

    if (error || !formation) {
        return null
    }

    const { data: courses } = await (supabase
        .from('formation_courses') as any)
        .select(`
            id,
            display_order,
            event_id,
            is_required,
            event:events(
                id, slug, title, subtitle, image_url, status, price, member_price, start_time, category, event_type, hero_badge
            )
        `)
        .eq('formation_id', formation.id)
        .order('display_order', { ascending: true })

    let hasPurchasedBundle = false
    let accessibleEventIds: string[] = []
    let hasActiveMembership = false

    const pricingState = {
        publicPrice: Number(formation.bundle_price || 0),
        effectivePrice: Number(formation.bundle_price || 0),
        needsPayment: Number(formation.bundle_price || 0) > 0,
        complimentaryByMembership: false,
        discountedByMembership: false,
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await (supabase
            .from('profiles') as any)
            .select('id, role, email, membership_level, subscription_status, membership_specialization_code')
            .eq('id', user.id)
            .maybeSingle()

        if (profile?.email) {
            await Promise.all([
                claimFormationRecordsByEmail({
                    userId: user.id,
                    email: profile.email,
                }),
                claimEventEntitlementsByEmail({
                    userId: user.id,
                    email: profile.email,
                }),
            ])
        }

        const commercialAccess = profile
            ? await getCommercialAccessContext({
                supabase,
                userId: user.id,
                profile,
            })
            : null

        hasActiveMembership = Boolean(commercialAccess?.hasActiveMembership)

        if (commercialAccess) {
            Object.assign(pricingState, getFormationCommercialState(formation, {
                membershipLevel: commercialAccess.membershipLevel,
                hasActiveMembership: commercialAccess.hasActiveMembership,
                membershipSpecializationCode: commercialAccess.membershipSpecializationCode,
            }))
        }

        const bundlePurchaseQuery = (supabase
            .from('formation_purchases') as any)
            .select('id')
            .eq('formation_id', formation.id)
            .eq('status', 'confirmed')
            .not('confirmed_at', 'is', null)

        const { data: bundlePurchase } = profile?.email
            ? await bundlePurchaseQuery.or(`user_id.eq.${user.id},email.eq.${profile.email}`).maybeSingle()
            : await bundlePurchaseQuery.eq('user_id', user.id).maybeSingle()

        hasPurchasedBundle = Boolean(bundlePurchase)

        if (!hasPurchasedBundle) {
            const courseEventIds = (courses ?? []).map((course: any) => course.event?.id).filter(Boolean)
            if (courseEventIds.length > 0) {
                const { data: accessData } = await (supabase
                    .from('event_entitlements') as any)
                    .select('event_id, ends_at')
                    .eq('status', 'active')
                    .eq('user_id', user.id)
                    .in('event_id', courseEventIds)
                    .order('starts_at', { ascending: false })

                accessibleEventIds = Array.from(new Set(
                    (accessData ?? [])
                        .filter((item: any) => !item.ends_at || new Date(item.ends_at) > new Date())
                        .map((item: any) => item.event_id)
                ))
            }
        }
    }

    return {
        ...formation,
        courses: courses || [],
        pricing: {
            ...pricingState,
            memberMessage: getFormationMemberAccessMessage(formation),
        },
        userState: {
            isLoggedIn: !!user,
            hasActiveMembership,
            hasPurchasedBundle,
            accessibleEventIds,
        },
    }
}

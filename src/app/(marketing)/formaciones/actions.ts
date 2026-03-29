'use server'

import { createClient } from '@/lib/supabase/server'

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

    // Fetch formation
    const { data: formation, error } = await (supabase
        .from('formations') as any)
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single()

    if (error || !formation) {
        return null
    }

    // Fetch courses included
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

    // Check user purchase history if logged in
    let hasPurchasedBundle = false
    let purchasedCourses: string[] = []

    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
        // Did they buy the bundle?
        const { data: bundlePurchases } = await (supabase
            .from('formation_purchases') as any)
            .select('id')
            .eq('formation_id', formation.id)
            .eq('user_id', user.id)
            .eq('status', 'confirmed')

        if (bundlePurchases && bundlePurchases.length > 0) {
            hasPurchasedBundle = true
        } else {
            // Check individual events access
            const courseEventIds = courses?.map((c: any) => c.event?.id).filter(Boolean) || []
            if (courseEventIds.length > 0) {
                const { data: accessData } = await supabase
                    .from('event_entitlements')
                    .select('event_id')
                    .eq('user_id', user.id)
                    .in('event_id', courseEventIds)
                    .eq('access_kind', 'course_access')
                    
                purchasedCourses = accessData?.map((a: any) => a.event_id) || []
            }
        }
    }

    return {
        ...formation,
        courses: courses || [],
        userState: {
            isLoggedIn: !!user,
            hasPurchasedBundle,
            purchasedCourses
        }
    }
}

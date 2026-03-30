import { getCommercialAccessContext } from '@/lib/access/commercial'
import { canAccessMarketingHub } from '@/lib/access/internal-modules'
import { createClient } from '@/lib/supabase/server'

// ============================================
// SERVICE KEY CONFIG
// ============================================
export const MARKETING_SERVICE_KEYS = [
    'community_manager',
    'content_creation',
    'assistant',
    'seo',
    'ads',
    'google_business',
] as const

export type MarketingServiceKey = typeof MARKETING_SERVICE_KEYS[number]

export interface MarketingService {
    id: string
    user_id: string
    service_key: MarketingServiceKey
    status: 'pending_brief' | 'in_progress' | 'active' | 'paused'
    notes: string | null
    admin_notes: string | null
    assigned_to: string | null
    contact_link: string | null
    created_at: string
    updated_at: string
}

export interface MarketingBrief {
    id: string
    user_id: string
    brand_name: string | null
    tone_of_voice: string | null
    target_audience: string | null
    colors_and_style: string | null
    social_links: string | null
    goals: string | null
    additional_notes: string | null
    status: 'submitted' | 'reviewed' | 'approved'
    created_at: string
    updated_at: string
}

export const SERVICE_LABELS: Record<MarketingServiceKey, { title: string; description: string }> = {
    community_manager: {
        title: 'Community Manager',
        description: 'Gestión y estrategia de tus redes sociales (Instagram, Facebook).',
    },
    content_creation: {
        title: 'Creación de Contenido',
        description: 'Diseños, reels y copys mensuales para tu marca personal.',
    },
    assistant: {
        title: 'Asistente Personal',
        description: 'Gestión de citas, atención a pacientes y tareas administrativas.',
    },
    seo: {
        title: 'SEO y Posicionamiento',
        description: 'Optimización para que aparezcas primero en las búsquedas de Google.',
    },
    ads: {
        title: 'Campañas de Ads',
        description: 'Publicidad pagada en Meta y Google para atraer más pacientes.',
    },
    google_business: {
        title: 'Google My Business',
        description: 'Optimización de tu ficha local para búsquedas cerca de tu consultorio.',
    },
}

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending_brief: {
        label: 'Esperando Brief',
        color: 'text-brand-yellow dark:text-brand-yellow bg-brand-yellow dark:bg-brand-yellow/30 border-brand-yellow dark:border-brand-yellow',
    },
    in_progress: {
        label: 'En Progreso',
        color: 'text-brand-yellow dark:text-brand-yellow bg-brand-yellow dark:bg-brand-yellow/30 border-brand-yellow dark:border-brand-yellow',
    },
    active: {
        label: 'Activo',
        color: 'text-brand-brown dark:text-brand-brown bg-brand-brown dark:bg-brand-brown/30 border-brand-brown dark:border-brand-brown',
    },
    paused: {
        label: 'Pausado',
        color: 'text-neutral-600 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
    },
}

// ============================================
// USER QUERIES
// ============================================

/**
 * Get all marketing services for a user.
 * Returns an empty array if no services exist yet.
 */
export async function getUserMarketingServices(userId: string): Promise<MarketingService[]> {
    const supabase = await createClient()
    const { data, error } = await (supabase as any)
        .from('marketing_services')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching marketing services:', error)
        return []
    }

    return (data ?? []) as MarketingService[]
}

/**
 * Get the user's brand brief (if submitted).
 */
export async function getUserMarketingBrief(userId: string): Promise<MarketingBrief | null> {
    const supabase = await createClient()
    const { data, error } = await (supabase as any)
        .from('marketing_briefs')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching marketing brief:', error)
    }

    return (data as MarketingBrief) ?? null
}

/**
 * Initialize all 6 marketing service records for a user if they don't exist yet.
 */
export async function initializeMarketingServices(userId: string): Promise<MarketingService[]> {
    const supabase = await createClient()

    // Check if already initialized
    const { data: existing } = await (supabase as any)
        .from('marketing_services')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

    if (existing && existing.length > 0) {
        return getUserMarketingServices(userId)
    }

    // Create all 6 service rows
    const rows = MARKETING_SERVICE_KEYS.map(key => ({
        user_id: userId,
        service_key: key,
        status: 'pending_brief',
    }))

    const { error } = await (supabase as any)
        .from('marketing_services')
        .insert(rows)

    if (error) {
        console.error('Error initializing marketing services:', error)
        return []
    }

    return getUserMarketingServices(userId)
}

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * Get all psychologists with effective access to the marketing hub
 * and include their services and brief status.
 * Admin-only.
 */
export async function getMarketingOverview(): Promise<{
    users: Array<{
        id: string
        full_name: string | null
        avatar_url: string | null
        email: string | null
        services: MarketingService[]
        brief: MarketingBrief | null
    }>
}> {
    const supabase = await createClient()

    // Start from psychologists and then resolve effective access using
    // the same commercial + internal gating logic as the user-facing hub.
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email, role, membership_level, subscription_status, membership_specialization_code')
        .eq('role', 'psychologist')
        .order('full_name', { ascending: true })

    if (profileError || !profiles) {
        console.error('Error fetching marketing candidate profiles:', profileError)
        return { users: [] }
    }

    const users = (await Promise.all(
        (profiles as any[]).map(async (profile) => {
            const commercialAccess = await getCommercialAccessContext({
                supabase,
                userId: profile.id,
                profile,
            })

            const canAccess = canAccessMarketingHub({
                role: profile.role,
                membershipLevel: commercialAccess?.membershipLevel ?? 0,
                membershipSpecializationCode: profile.membership_specialization_code ?? null,
            })

            if (!canAccess) {
                return null
            }

            const [services, brief] = await Promise.all([
                getUserMarketingServices(profile.id),
                getUserMarketingBrief(profile.id),
            ])
            return {
                id: profile.id,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                email: profile.email,
                services,
                brief,
            }
        })
    )).filter(Boolean) as Array<{
        id: string
        full_name: string | null
        avatar_url: string | null
        email: string | null
        services: MarketingService[]
        brief: MarketingBrief | null
    }>

    return { users }
}

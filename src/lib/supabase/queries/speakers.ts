import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getHomeFeaturedSpeakersSettings } from '@/lib/home/featured-speakers'
import { selectFeaturedSpeakers, selectRotatingFeaturedSpeakers, sortSpeakersByMerit } from '@/lib/speakers/ranking'
import type {
    Speaker,
    SpeakerWithProfile,
    EventSpeaker,
    EventPurchase,
} from '@/types/database'

type SpeakerProfileSummary = {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string | null
}

function normalizeText(value?: string | null) {
    const text = value?.trim()
    return text ? text : null
}

function pickMetadataText(metadata: Record<string, unknown> | undefined | null, key: string) {
    const value = metadata?.[key]
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

async function loadAuthProfileFallbacks(speakerIds: string[]) {
    const uniqueIds = Array.from(new Set(speakerIds.filter(Boolean)))
    if (uniqueIds.length === 0 || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return new Map<string, SpeakerProfileSummary>()
    }

    try {
        const supabase = await createAdminClient()
        const authProfiles: Array<SpeakerProfileSummary | null> = await Promise.all(
            uniqueIds.map(async (speakerId): Promise<SpeakerProfileSummary | null> => {
                const { data, error } = await supabase.auth.admin.getUserById(speakerId)

                if (error) {
                    console.error('Error fetching auth user fallback for speaker:', {
                        speakerId,
                        code: error.code,
                        message: error.message,
                    })
                    return null
                }

                const authUser = data.user
                if (!authUser) return null

                const fullName =
                    pickMetadataText(authUser.user_metadata, 'full_name')
                    ?? pickMetadataText(authUser.user_metadata, 'name')
                const avatarUrl =
                    pickMetadataText(authUser.user_metadata, 'avatar_url')
                    ?? pickMetadataText(authUser.user_metadata, 'picture')

                if (!fullName && !avatarUrl) {
                    return null
                }

                return {
                    id: speakerId,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    role: null,
                }
            })
        )

        return new Map(
            authProfiles
                .filter((profile): profile is SpeakerProfileSummary => profile !== null)
                .map((profile) => [profile.id, profile])
        )
    } catch (error) {
        console.error('Error loading auth user fallbacks for speakers:', error)
        return new Map<string, SpeakerProfileSummary>()
    }
}

async function createSpeakerProfileClient() {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            return await createAdminClient()
        } catch {
            // Fall back to the request-scoped client if the admin client is unavailable.
        }
    }

    return await createClient()
}

async function loadSpeakerProfiles(speakerIds: string[]) {
    const uniqueIds = Array.from(new Set(speakerIds.filter(Boolean)))
    if (uniqueIds.length === 0) return new Map<string, SpeakerProfileSummary>()

    const supabase = await createSpeakerProfileClient()
    const { data, error } = await (supabase
        .from('profiles') as any)
        .select('id, full_name, avatar_url, role')
        .in('id', uniqueIds)

    if (error) {
        console.error('Error fetching speaker profiles:', error)
        return new Map<string, SpeakerProfileSummary>()
    }

    const profileMap = new Map(
        ((data ?? []) as SpeakerProfileSummary[]).map((profile) => [
            profile.id,
            {
                ...profile,
                full_name: normalizeText(profile.full_name),
                avatar_url: normalizeText(profile.avatar_url),
                role: normalizeText(profile.role),
            },
        ])
    )

    const incompleteIds = uniqueIds.filter((speakerId) => {
        const profile = profileMap.get(speakerId)
        return !profile || !profile.full_name
    })

    if (incompleteIds.length > 0) {
        const authFallbackMap = await loadAuthProfileFallbacks(incompleteIds)

        for (const speakerId of incompleteIds) {
            const authFallback = authFallbackMap.get(speakerId)
            if (!authFallback) continue

            const currentProfile = profileMap.get(speakerId)
            profileMap.set(speakerId, {
                id: speakerId,
                full_name: currentProfile?.full_name ?? authFallback.full_name ?? null,
                avatar_url: currentProfile?.avatar_url ?? authFallback.avatar_url ?? null,
                role: currentProfile?.role ?? authFallback.role ?? null,
            })
        }
    }

    return profileMap
}

function attachProfilesToSpeakers<T extends { id: string }>(
    speakers: T[],
    profileMap: Map<string, SpeakerProfileSummary>
) {
    return speakers.map((speaker) => ({
        ...speaker,
        profile: profileMap.get(speaker.id) ?? null,
    }))
}

/**
 * Get all public speakers with their profile info
 */
export async function getPublicSpeakers(): Promise<SpeakerWithProfile[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('speakers') as any)
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching speakers:', error)
        return []
    }

    const speakers = (data ?? []) as Speaker[]
    const profileMap = await loadSpeakerProfiles(speakers.map((speaker) => speaker.id))
    return sortSpeakersByMerit(
        attachProfilesToSpeakers(speakers, profileMap) as SpeakerWithProfile[]
    )
}

export async function getFeaturedPublicSpeakers(limit = 4): Promise<SpeakerWithProfile[]> {
    const speakers = await getPublicSpeakers()
    const settings = await getHomeFeaturedSpeakersSettings()
    const effectiveLimit = Math.min(limit, settings.limit)

    if (settings.mode === 'manual' && settings.manualSpeakerIds.length > 0) {
        const manualMap = new Map(speakers.map((speaker) => [speaker.id, speaker]))
        const manualSelection = settings.manualSpeakerIds
            .map((speakerId) => manualMap.get(speakerId))
            .filter(Boolean) as SpeakerWithProfile[]

        if (manualSelection.length >= effectiveLimit) {
            return manualSelection.slice(0, effectiveLimit)
        }

        const selectedIds = new Set(manualSelection.map((speaker) => speaker.id))
        const fallback = selectFeaturedSpeakers(
            speakers.filter((speaker) => !selectedIds.has(speaker.id)),
            effectiveLimit - manualSelection.length
        )

        return [...manualSelection, ...fallback].slice(0, effectiveLimit)
    }

    if (settings.mode === 'rotating') {
        return selectRotatingFeaturedSpeakers(speakers, effectiveLimit, settings.rotationPoolSize)
    }

    return selectFeaturedSpeakers(speakers, effectiveLimit)
}

/**
 * Get specific speakers by their IDs (for featured sections).
 * Returns speakers in the same order as the input IDs array.
 */
export async function getSpeakersByIds(speakerIds: string[]): Promise<SpeakerWithProfile[]> {
    if (speakerIds.length === 0) return []

    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('speakers') as any)
        .select('*')
        .in('id', speakerIds)
        .eq('is_public', true)

    if (error) {
        console.error('Error fetching speakers by ids:', error)
        return []
    }

    const speakers = (data ?? []) as Speaker[]
    const profileMap = await loadSpeakerProfiles(speakers.map((speaker) => speaker.id))
    const speakersWithProfiles = attachProfilesToSpeakers(speakers, profileMap) as SpeakerWithProfile[]

    // Preserve the order from the input IDs array
    const speakerMap = new Map(speakersWithProfiles.map((speaker) => [speaker.id, speaker]))
    return speakerIds.map((id) => speakerMap.get(id)).filter(Boolean) as SpeakerWithProfile[]
}

/**
 * Get a single speaker by ID with profile
 */
export async function getSpeakerById(speakerId: string): Promise<SpeakerWithProfile | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('speakers') as any)
        .select('*')
        .eq('id', speakerId)
        .maybeSingle()

    if (error) {
        console.error('Error fetching speaker:', error)
        return null
    }

    if (!data) return null

    const profileMap = await loadSpeakerProfiles([speakerId])

    return {
        ...(data as Speaker),
        profile: profileMap.get(speakerId) ?? null,
    } as SpeakerWithProfile
}

/**
 * Get events for a specific speaker
 */
export async function getSpeakerEvents(speakerId: string): Promise<any[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('event_speakers') as any)
        .select(`
            *,
            event:events (*)
        `)
        .eq('speaker_id', speakerId)
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching speaker events:', error)
        return []
    }

    return (data ?? []).map((es: any) => es.event).filter(Boolean)
}

/**
 * Get speakers for a specific event
 */
export async function getEventSpeakers(eventId: string): Promise<(EventSpeaker & { speaker: SpeakerWithProfile })[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('event_speakers') as any)
        .select(`
            *,
            speaker:speakers (*)
        `)
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching event speakers:', error)
        return []
    }

    const rows = (data ?? []) as Array<EventSpeaker & { speaker: Speaker | null }>
    const profileMap = await loadSpeakerProfiles(
        rows.map((row) => row.speaker?.id).filter(Boolean) as string[]
    )

    return rows.map((row) => ({
        ...row,
        speaker: row.speaker
            ? {
                ...row.speaker,
                profile: profileMap.get(row.speaker.id) ?? null,
            }
            : row.speaker,
    })) as (EventSpeaker & { speaker: SpeakerWithProfile })[]
}

/**
 * Get all speakers (for speaker selector in event forms)
 */
export async function getAllSpeakers(): Promise<SpeakerWithProfile[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('speakers') as any)
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all speakers:', error)
        return []
    }

    const speakers = (data ?? []) as Speaker[]
    const profileMap = await loadSpeakerProfiles(speakers.map((speaker) => speaker.id))
    return attachProfilesToSpeakers(speakers, profileMap) as SpeakerWithProfile[]
}

/**
 * Update speaker profile
 */
export async function updateSpeakerProfile(speakerId: string, updates: Partial<Speaker>): Promise<Speaker | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('speakers') as any)
        .update(updates)
        .eq('id', speakerId)
        .select()
        .single()

    if (error) {
        console.error('Error updating speaker:', error)
        return null
    }

    return data as Speaker
}

/**
 * Get event purchases for admin/ponente
 */
export async function getEventPurchases(eventId: string): Promise<EventPurchase[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('event_purchases') as any)
        .select('*')
        .eq('event_id', eventId)
        .order('purchased_at', { ascending: false })

    if (error) {
        console.error('Error fetching event purchases:', error)
        return []
    }

    return (data ?? []) as EventPurchase[]
}

import { createClient } from '@/lib/supabase/server'
import type {
    Speaker,
    SpeakerWithProfile,
    EventSpeaker,
    EventPurchase,
} from '@/types/database'

/**
 * Get all public speakers with their profile info
 */
export async function getPublicSpeakers(): Promise<SpeakerWithProfile[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('speakers') as any)
        .select(`
            *,
            profile:profiles (
                id,
                full_name,
                avatar_url,
                role
            )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching speakers:', error)
        return []
    }

    return (data ?? []) as SpeakerWithProfile[]
}

/**
 * Get a single speaker by ID with profile
 */
export async function getSpeakerById(speakerId: string): Promise<SpeakerWithProfile | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('speakers') as any)
        .select(`
            *,
            profile:profiles (
                id,
                full_name,
                avatar_url,
                email,
                role
            )
        `)
        .eq('id', speakerId)
        .single()

    if (error) {
        console.error('Error fetching speaker:', error)
        return null
    }

    return data as SpeakerWithProfile
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
            speaker:speakers (
                *,
                profile:profiles (
                    id,
                    full_name,
                    avatar_url
                )
            )
        `)
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching event speakers:', error)
        return []
    }

    return (data ?? []) as (EventSpeaker & { speaker: SpeakerWithProfile })[]
}

/**
 * Get all speakers (for speaker selector in event forms)
 */
export async function getAllSpeakers(): Promise<SpeakerWithProfile[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('speakers') as any)
        .select(`
            *,
            profile:profiles (
                id,
                full_name,
                avatar_url
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all speakers:', error)
        return []
    }

    return (data ?? []) as SpeakerWithProfile[]
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

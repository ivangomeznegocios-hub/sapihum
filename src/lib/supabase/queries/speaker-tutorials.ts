import { createClient } from '@/lib/supabase/server'
import type { SpeakerTutorial } from '@/types/database'

export async function getSpeakerTutorials(options?: { includeInactive?: boolean }) {
    const supabase = await createClient()

    let query = (supabase
        .from('speaker_tutorials') as any)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

    if (!options?.includeInactive) {
        query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching speaker tutorials:', error)
        return []
    }

    return (data ?? []) as SpeakerTutorial[]
}

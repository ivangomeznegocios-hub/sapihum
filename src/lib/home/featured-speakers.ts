import { createPublicClient } from '@/lib/supabase/public'
import {
    DEFAULT_HOME_FEATURED_SPEAKERS_SETTINGS,
    HOME_FEATURED_SPEAKERS_SETTING_KEY,
    normalizeHomeFeaturedSpeakersSettings,
} from '@/lib/home/featured-speakers-config'

export {
    DEFAULT_HOME_FEATURED_SPEAKERS_SETTINGS,
    HOME_FEATURED_SPEAKERS_SETTING_KEY,
    normalizeHomeFeaturedSpeakersSettings,
} from '@/lib/home/featured-speakers-config'
export type { HomeFeaturedSpeakersMode, HomeFeaturedSpeakersSettings } from '@/lib/home/featured-speakers-config'

export async function getHomeFeaturedSpeakersSettings() {
    const supabase = createPublicClient()
    const { data, error } = await (supabase
        .from('platform_settings') as any)
        .select('value')
        .eq('key', HOME_FEATURED_SPEAKERS_SETTING_KEY)
        .maybeSingle()

    if (error) {
        console.error('Error fetching home featured speakers settings:', error)
        return DEFAULT_HOME_FEATURED_SPEAKERS_SETTINGS
    }

    return normalizeHomeFeaturedSpeakersSettings(data?.value)
}

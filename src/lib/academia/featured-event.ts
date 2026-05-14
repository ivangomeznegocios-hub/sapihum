import { createPublicClient } from '@/lib/supabase/public'
import {
    ACADEMIA_FEATURED_EVENT_SETTING_KEY,
    DEFAULT_ACADEMIA_FEATURED_EVENT_SETTINGS,
    normalizeAcademiaFeaturedEventSettings,
    type AcademiaFeaturedEventSettings,
} from '@/lib/academia/featured-event-config'

export {
    ACADEMIA_FEATURED_EVENT_SETTING_KEY,
    DEFAULT_ACADEMIA_FEATURED_EVENT_SETTINGS,
    normalizeAcademiaFeaturedEventSettings,
} from '@/lib/academia/featured-event-config'
export type { AcademiaFeaturedEventMode, AcademiaFeaturedEventSettings } from '@/lib/academia/featured-event-config'

export async function getAcademiaFeaturedEventSettings() {
    const supabase = createPublicClient()
    const { data, error } = await (supabase
        .from('platform_settings') as any)
        .select('value')
        .eq('key', ACADEMIA_FEATURED_EVENT_SETTING_KEY)
        .maybeSingle()

    if (error) {
        console.error('Error fetching academia featured event settings:', error)
        return DEFAULT_ACADEMIA_FEATURED_EVENT_SETTINGS
    }

    return normalizeAcademiaFeaturedEventSettings(data?.value)
}

function resolveAutomaticFeaturedEvent(params: {
    activeCampaign: any
    campaignBlocks: Array<{ campaign: any; events: any[] }>
    upcoming: any[]
}) {
    const { activeCampaign, campaignBlocks, upcoming } = params

    if (activeCampaign) {
        const campaignBlock = campaignBlocks.find((entry) => entry.campaign.key === activeCampaign.key)
        return campaignBlock?.events[0] ?? upcoming.find((event: any) => event.image_url) ?? upcoming[0]
    }

    return campaignBlocks[0]?.events[0] ?? upcoming.find((event: any) => event.image_url) ?? upcoming[0]
}

export function resolveAcademiaFeaturedEvent(params: {
    settings: AcademiaFeaturedEventSettings
    activeCampaign: any
    campaignBlocks: Array<{ campaign: any; events: any[] }>
    upcoming: any[]
}) {
    const automatic = resolveAutomaticFeaturedEvent(params)
    const { settings, activeCampaign, upcoming } = params

    if (activeCampaign) {
        return automatic
    }

    if (settings.mode === 'manual' && settings.manualEventId) {
        const manualEvent = upcoming.find((event: any) => event.id === settings.manualEventId)
        if (manualEvent) {
            return manualEvent
        }
    }

    return automatic
}

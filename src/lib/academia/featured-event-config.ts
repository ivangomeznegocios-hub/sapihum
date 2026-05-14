export const ACADEMIA_FEATURED_EVENT_SETTING_KEY = 'academia_featured_event'

export type AcademiaFeaturedEventMode = 'auto' | 'manual'

export interface AcademiaFeaturedEventSettings {
    mode: AcademiaFeaturedEventMode
    manualEventId: string | null
}

export const DEFAULT_ACADEMIA_FEATURED_EVENT_SETTINGS: AcademiaFeaturedEventSettings = {
    mode: 'auto',
    manualEventId: null,
}

export function normalizeAcademiaFeaturedEventSettings(value: unknown): AcademiaFeaturedEventSettings {
    if (!value || typeof value !== 'object') {
        return DEFAULT_ACADEMIA_FEATURED_EVENT_SETTINGS
    }

    const raw = value as Partial<AcademiaFeaturedEventSettings>
    const mode: AcademiaFeaturedEventMode = raw.mode === 'manual' ? 'manual' : 'auto'
    const manualEventId =
        typeof raw.manualEventId === 'string' && raw.manualEventId.trim().length > 0
            ? raw.manualEventId.trim()
            : null

    return {
        mode,
        manualEventId,
    }
}

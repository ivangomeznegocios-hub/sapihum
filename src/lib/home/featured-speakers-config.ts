export const HOME_FEATURED_SPEAKERS_SETTING_KEY = 'home_featured_speakers'

export type HomeFeaturedSpeakersMode = 'ranked' | 'manual' | 'rotating'

export interface HomeFeaturedSpeakersSettings {
    mode: HomeFeaturedSpeakersMode
    manualSpeakerIds: string[]
    rotationPoolSize: number
    limit: number
}

export const DEFAULT_HOME_FEATURED_SPEAKERS_SETTINGS: HomeFeaturedSpeakersSettings = {
    mode: 'ranked',
    manualSpeakerIds: [],
    rotationPoolSize: 8,
    limit: 4,
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
    const parsed = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(parsed)) return fallback

    return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

function normalizeSpeakerIds(value: unknown) {
    if (!Array.isArray(value)) return [] as string[]

    const uniqueIds = new Set<string>()

    for (const entry of value) {
        if (typeof entry !== 'string') continue

        const speakerId = entry.trim()
        if (!speakerId) continue

        uniqueIds.add(speakerId)
    }

    return Array.from(uniqueIds)
}

export function normalizeHomeFeaturedSpeakersSettings(value: unknown): HomeFeaturedSpeakersSettings {
    if (!value || typeof value !== 'object') {
        return DEFAULT_HOME_FEATURED_SPEAKERS_SETTINGS
    }

    const raw = value as Partial<HomeFeaturedSpeakersSettings>
    const mode: HomeFeaturedSpeakersMode =
        raw.mode === 'manual' || raw.mode === 'rotating' || raw.mode === 'ranked'
            ? raw.mode
            : DEFAULT_HOME_FEATURED_SPEAKERS_SETTINGS.mode

    return {
        mode,
        manualSpeakerIds: normalizeSpeakerIds(raw.manualSpeakerIds).slice(0, 4),
        rotationPoolSize: clampInteger(
            raw.rotationPoolSize,
            DEFAULT_HOME_FEATURED_SPEAKERS_SETTINGS.rotationPoolSize,
            4,
            24
        ),
        limit: clampInteger(raw.limit, DEFAULT_HOME_FEATURED_SPEAKERS_SETTINGS.limit, 1, 8),
    }
}

import type { SpeakerWithProfile } from '@/types/database'

type SpeakerLike = Pick<SpeakerWithProfile, 'headline' | 'photo_url' | 'profile'>

const KNOWN_IMAGE_HOSTS = new Set([
    'encrypted-tbn0.gstatic.com',
])

const KNOWN_IMAGE_HOST_SUFFIXES = [
    '.googleusercontent.com',
    '.supabase.co',
    '.wixstatic.com',
]

function normalizeText(value?: string | null) {
    const text = value?.trim()
    return text ? text : null
}

export function isLikelyDirectImageUrl(value?: string | null) {
    if (!value) return false

    try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol)) return false

        const host = url.hostname.toLowerCase()
        if (
            KNOWN_IMAGE_HOSTS.has(host) ||
            KNOWN_IMAGE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
        ) {
            return true
        }

        return /\.(avif|gif|jpe?g|png|svg|webp)(?:$|[/?#])/i.test(`${url.pathname}${url.search}`)
    } catch {
        return false
    }
}

export function getSpeakerImage(speaker?: SpeakerLike | null) {
    const candidates = [speaker?.photo_url, speaker?.profile?.avatar_url]
    return candidates.find((value) => isLikelyDirectImageUrl(value)) ?? null
}

export function getSpeakerName(speaker?: SpeakerLike | null) {
    return normalizeText(speaker?.profile?.full_name) ?? normalizeText(speaker?.headline) ?? 'Ponente'
}

export function getSpeakerHeadline(speaker?: SpeakerLike | null) {
    const headline = normalizeText(speaker?.headline)
    if (!headline) return null

    return headline === getSpeakerName(speaker) ? null : headline
}

export function getSpeakerFirstName(speaker?: SpeakerLike | null) {
    const fullName = normalizeText(speaker?.profile?.full_name)
    return fullName ? fullName.split(/\s+/)[0] : null
}

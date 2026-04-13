import { getSpeakerImage, getSpeakerName } from '@/lib/speakers/display'
import type { SpeakerWithProfile } from '@/types/database'

const ACADEMIC_SIGNAL_WEIGHTS = [
    { pattern: /\b(ph\.?d|doctorad[oa]?|doctor en|doctora en|doctoral)\b/i, points: 40 },
    { pattern: /\b(maestr[ií]a|master|m[aá]ster|mag[ií]ster|mba)\b/i, points: 18 },
    { pattern: /\b(especialidad|especialista|posgrado|postgrado)\b/i, points: 10 },
    { pattern: /\b(licenciatur[ao]?|licenciad[ao])\b/i, points: 6 },
    { pattern: /\b(diplomad[oa]|certificaci[oó]n|certificado|curso|seminario|taller)\b/i, points: 3 },
] as const

function normalizeItems(values: Array<string | null | undefined>) {
    const seen = new Set<string>()
    const items: string[] = []

    for (const value of values) {
        const item = value?.trim()
        if (!item) continue

        const key = item.toLocaleLowerCase('es-MX')
        if (seen.has(key)) continue

        seen.add(key)
        items.push(item)
    }

    return items
}

function getAcademicSignalScore(value: string) {
    for (const signal of ACADEMIC_SIGNAL_WEIGHTS) {
        if (signal.pattern.test(value)) {
            return signal.points
        }
    }

    return 0
}

export function getSpeakerMeritScore(speaker: SpeakerWithProfile) {
    const credentials = normalizeItems(speaker.credentials ?? [])
    const formations = normalizeItems(speaker.formations ?? [])
    const specialties = normalizeItems(speaker.specialties ?? [])
    const academicSignals = normalizeItems([
        speaker.headline,
        ...credentials,
        ...formations,
    ])

    const academicScore = academicSignals.reduce((total, signal) => {
        return total + getAcademicSignalScore(signal)
    }, 0)

    const profileScore =
        (getSpeakerName(speaker) !== 'Ponente' ? 12 : 0) +
        (speaker.headline?.trim() ? 10 : 0) +
        (speaker.bio?.trim() ? 12 : 0) +
        (getSpeakerImage(speaker) ? 10 : 0) +
        Math.min(credentials.length, 6) * 4 +
        Math.min(formations.length, 8) * 2 +
        Math.min(specialties.length, 6) * 3 +
        Math.min(Object.keys(speaker.social_links ?? {}).length, 4)

    return academicScore + profileScore
}

export function hasSpeakerShowcaseProfile(speaker: SpeakerWithProfile) {
    return (
        getSpeakerName(speaker) !== 'Ponente' &&
        Boolean(
            getSpeakerImage(speaker) ||
            speaker.headline?.trim() ||
            speaker.bio?.trim() ||
            normalizeItems(speaker.credentials ?? []).length ||
            normalizeItems(speaker.formations ?? []).length
        )
    )
}

export function sortSpeakersByMerit<T extends SpeakerWithProfile>(speakers: T[]) {
    return [...speakers]
        .map((speaker) => ({
            speaker,
            score: getSpeakerMeritScore(speaker),
            name: getSpeakerName(speaker),
        }))
        .sort((left, right) => {
            if (right.score !== left.score) return right.score - left.score

            return left.name.localeCompare(right.name, 'es-MX', { sensitivity: 'base' })
        })
        .map(({ speaker }) => speaker)
}

export function selectFeaturedSpeakers<T extends SpeakerWithProfile>(speakers: T[], limit: number) {
    return sortSpeakersByMerit(speakers.filter(hasSpeakerShowcaseProfile)).slice(0, limit)
}

function getMexicoCityDateKey(date = new Date()) {
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)
}

function hashSeed(input: string) {
    let hash = 0

    for (let index = 0; index < input.length; index += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(index)
        hash |= 0
    }

    return hash >>> 0
}

function createSeededRandom(seed: number) {
    let value = seed || 1

    return () => {
        value |= 0
        value = (value + 0x6d2b79f5) | 0
        let current = Math.imul(value ^ (value >>> 15), 1 | value)
        current ^= current + Math.imul(current ^ (current >>> 7), 61 | current)
        return ((current ^ (current >>> 14)) >>> 0) / 4294967296
    }
}

function shuffleWithSeed<T>(items: T[], seedInput: string) {
    const random = createSeededRandom(hashSeed(seedInput))
    const shuffled = [...items]

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(random() * (index + 1))
        ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
    }

    return shuffled
}

export function selectRotatingFeaturedSpeakers<T extends SpeakerWithProfile>(
    speakers: T[],
    limit: number,
    poolSize = 8,
    seedInput = getMexicoCityDateKey()
) {
    const rankedPool = sortSpeakersByMerit(speakers.filter(hasSpeakerShowcaseProfile))
        .slice(0, Math.max(limit, poolSize))

    if (rankedPool.length <= limit) {
        return rankedPool
    }

    return shuffleWithSeed(rankedPool, seedInput).slice(0, limit)
}

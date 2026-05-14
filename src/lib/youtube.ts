export function extractYouTubeVideoId(input: string): string | null {
    const rawUrl = input.trim()
    if (!rawUrl) return null

    try {
        const url = new URL(rawUrl)
        const hostname = url.hostname.replace(/^www\./, '').toLowerCase()

        if (hostname === 'youtu.be') {
            return normalizeYouTubeVideoId(url.pathname.split('/').filter(Boolean)[0])
        }

        if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'music.youtube.com') {
            if (url.pathname === '/watch') {
                return normalizeYouTubeVideoId(url.searchParams.get('v'))
            }

            const [prefix, videoId] = url.pathname.split('/').filter(Boolean)
            if (prefix === 'embed' || prefix === 'shorts' || prefix === 'live') {
                return normalizeYouTubeVideoId(videoId)
            }
        }
    } catch {
        return null
    }

    return null
}

function normalizeYouTubeVideoId(value?: string | null) {
    if (!value) return null
    const id = value.trim()
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
}

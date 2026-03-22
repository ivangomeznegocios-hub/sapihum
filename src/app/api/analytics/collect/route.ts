import { NextRequest, NextResponse } from 'next/server'
import { hasAnalyticsConsent, parseConsentCookieFromCookieHeader } from '@/lib/consent'
import { ingestAnalyticsEvent } from '@/lib/analytics/server'
import type { AnalyticsCollectRequest } from '@/lib/analytics/types'

export async function POST(request: NextRequest) {
    try {
        const consent = parseConsentCookieFromCookieHeader(request.headers.get('cookie'))
        if (!hasAnalyticsConsent(consent)) {
            return NextResponse.json({ skipped: true }, { status: 200 })
        }

        const payload = (await request.json()) as AnalyticsCollectRequest
        const result = await ingestAnalyticsEvent(payload)
        return NextResponse.json(result)
    } catch (error) {
        console.error('[Analytics] collect error:', error)
        return NextResponse.json({ error: 'collect_failed' }, { status: 500 })
    }
}

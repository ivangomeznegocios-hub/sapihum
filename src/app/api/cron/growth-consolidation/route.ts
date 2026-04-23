import { NextRequest, NextResponse } from 'next/server'
import { consolidateEligibleGrowthConversions } from '@/lib/growth/engine'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        throw new Error('CRON_SECRET no configurado')
    }

    const authorization = request.headers.get('authorization')
    return authorization === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
    try {
        if (!isAuthorized(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await consolidateEligibleGrowthConversions({ limit: 200 })

        return NextResponse.json({
            ok: true,
            qualified: result.qualified,
            blocked: result.blocked,
        })
    } catch (error) {
        console.error('[Growth Cron] Consolidation failed', error)
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Growth consolidation failed',
            },
            { status: 500 }
        )
    }
}

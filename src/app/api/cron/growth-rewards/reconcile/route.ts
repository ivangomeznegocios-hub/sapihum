import { NextRequest, NextResponse } from 'next/server'
import { getGrowthRewardFeatureFlags } from '@/lib/growth/feature-flags'
import { reconcileGrowthRewards } from '@/lib/growth/reward-engine'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) return false

    const authHeader = request.headers.get('authorization') || ''
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null
    const headerSecret = request.headers.get('x-cron-secret')

    return bearerToken === cronSecret || headerSecret === cronSecret
}

async function handleReconcile(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!getGrowthRewardFeatureFlags().rewardCron) {
        return NextResponse.json({
            ok: true,
            disabled: true,
            reason: 'ENABLE_GROWTH_REWARD_CRON is not enabled',
        })
    }

    const result = await reconcileGrowthRewards({ trigger: 'cron' })
    return NextResponse.json({
        ok: result.errors.length === 0,
        evaluated: result.evaluated,
        errors: result.errors,
    })
}

export async function GET(request: NextRequest) {
    return handleReconcile(request)
}

export async function POST(request: NextRequest) {
    return handleReconcile(request)
}

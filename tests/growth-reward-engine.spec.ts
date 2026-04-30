import { expect, test } from '@playwright/test'
import {
    normalizeGrowthRewardConfig,
    selectBestGrowthReward,
} from '../src/lib/growth/reward-engine'

test('normalizes structured growth reward config', () => {
    expect(normalizeGrowthRewardConfig({
        threshold_count: 3,
        qualifier: 'referred_active_membership',
        require_referrer_active_membership: true,
        benefit_kind: 'percent_discount',
        discount_percent: 50,
        target_membership_level: 'current',
        duration_policy: 'while_qualified',
        priority: 2,
    })).toMatchObject({
        threshold_count: 3,
        benefit_kind: 'percent_discount',
        discount_percent: 50,
        target_membership_level: 'current',
        priority: 2,
    })
})

test('rejects incomplete growth reward config', () => {
    expect(normalizeGrowthRewardConfig({
        threshold_count: 3,
        benefit_kind: 'percent_discount',
    })).toBeNull()
})

test('selects highest monthly value before priority', () => {
    const rewards = [
        { monthlyValue: 145, priority: 100 },
        { monthlyValue: 680, priority: 1 },
    ]

    expect(selectBestGrowthReward(rewards as any)?.monthlyValue).toBe(680)
})

test('uses priority as tie breaker', () => {
    const rewards = [
        { monthlyValue: 680, priority: 1 },
        { monthlyValue: 680, priority: 5 },
    ]

    expect(selectBestGrowthReward(rewards as any)?.priority).toBe(5)
})

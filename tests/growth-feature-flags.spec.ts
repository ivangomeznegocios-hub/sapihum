import { expect, test } from '@playwright/test'
import {
  getGrowthRewardFeatureFlags,
  isAdvancedGrowthRewardConfig,
} from '../src/lib/growth/feature-flags'
import { reconcileGrowthRewards } from '../src/lib/growth/reward-engine'

const flagNames = [
  'ENABLE_GROWTH_REWARDS',
  'ENABLE_GROWTH_STRIPE_DISCOUNTS',
  'ENABLE_GROWTH_STRIPE_UPGRADES',
  'ENABLE_GROWTH_REWARD_CRON',
  'ENABLE_GROWTH_ADVANCED_PROGRAMS',
]

test.afterEach(() => {
  for (const name of flagNames) {
    delete process.env[name]
  }
})

test('growth reward feature flags default to disabled', () => {
  expect(getGrowthRewardFeatureFlags()).toEqual({
    rewards: false,
    stripeDiscounts: false,
    stripeUpgrades: false,
    rewardCron: false,
    advancedPrograms: false,
  })
})

test('growth reward feature flags accept explicit true values', () => {
  for (const name of flagNames) {
    process.env[name] = 'true'
  }

  expect(getGrowthRewardFeatureFlags()).toEqual({
    rewards: true,
    stripeDiscounts: true,
    stripeUpgrades: true,
    rewardCron: true,
    advancedPrograms: true,
  })
})

test('detects advanced reward configs', () => {
  expect(isAdvancedGrowthRewardConfig({
    benefit_kind: 'percent_discount',
    target_membership_level: 'current',
  })).toBe(false)

  expect(isAdvancedGrowthRewardConfig({
    benefit_kind: 'free_membership_level',
    target_membership_level: 'current',
  })).toBe(true)

  expect(isAdvancedGrowthRewardConfig({
    benefit_kind: 'percent_discount',
    target_membership_level: 2,
  })).toBe(true)
})

test('reconcile no-ops when rewards flag is disabled', async () => {
  const result = await reconcileGrowthRewards({ trigger: 'manual' })

  expect(result).toMatchObject({
    evaluated: 0,
    errors: [],
    results: [],
    disabled: true,
  })
})

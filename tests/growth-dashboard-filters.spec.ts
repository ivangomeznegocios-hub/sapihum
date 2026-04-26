import { expect, test } from '@playwright/test'
import {
  shouldShowGrowthAttribution,
  shouldShowGrowthReward,
} from '../src/lib/supabase/queries/growth-dashboard-filters'

test.describe('professional growth filters', () => {
  test('excludes patient attributions from professional growth metrics', () => {
    expect(
      shouldShowGrowthAttribution({
        status: 'completed',
        referrer: { role: 'psychologist', email: 'pro@sapihum.com' },
        referred: { role: 'patient', email: 'patient@sapihum.com' },
      })
    ).toBe(false)
  })

  test('keeps psychologist attributions visible for professional growth', () => {
    expect(
      shouldShowGrowthAttribution({
        status: 'completed',
        referrer: { role: 'psychologist', email: 'pro@sapihum.com' },
        referred: { role: 'psychologist', email: 'colleague@sapihum.com' },
      })
    ).toBe(true)
  })

  test('excludes attributions from non-professional referrers', () => {
    expect(
      shouldShowGrowthAttribution({
        status: 'completed',
        referrer: { role: 'patient', email: 'patient-owner@sapihum.com' },
        referred: { role: 'psychologist', email: 'colleague@sapihum.com' },
      })
    ).toBe(false)
  })

  test('excludes rewards whose attribution belongs to a patient', () => {
    expect(
      shouldShowGrowthReward({
        status: 'pending',
        beneficiary: { role: 'psychologist', email: 'pro@sapihum.com' },
        attribution: {
          status: 'rewarded',
          referrer: { role: 'psychologist', email: 'pro@sapihum.com' },
          referred: { role: 'patient', email: 'patient@sapihum.com' },
        },
      })
    ).toBe(false)
  })
})

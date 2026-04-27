import { PricingContent } from '@/components/pricing/pricing-content'
import { getSubscriptionPlan } from '@/lib/payments/config'
import {
  LEVEL_2_DEFAULT_SPECIALIZATION,
  canUserSeeLevel3Offer,
} from '@/lib/specializations'
import { getUserProfile } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Precios - SAPIHUM',
  description:
    'Únete a la membresía de SAPIHUM: formación continua, red de profesionales y recursos clínicos. Expansiones opcionales de Consultorio Digital y Marketing.',
}

export default async function PricingPage() {
  const profile = await getUserProfile()
  const isLoggedIn = !!profile
  const currentLevel = profile?.membership_level ?? 0
  const currentSpecializationCode =
    (profile as any)?.membership_specialization_code ?? null

  const level1Plan = getSubscriptionPlan(1)
  const level2Plan = getSubscriptionPlan(2, LEVEL_2_DEFAULT_SPECIALIZATION)
  const level3Plan = getSubscriptionPlan(3)

  const level3Eligible = canUserSeeLevel3Offer({
    membershipLevel: currentLevel,
    specializationCode: currentSpecializationCode,
    isAdmin: profile?.role === 'admin',
  })

  const serializePlan = (plan: ReturnType<typeof getSubscriptionPlan>) =>
    plan
      ? {
          name: plan.name,
          membershipLevel: plan.membershipLevel,
          monthly: { amount: plan.monthly.amount },
          annual: {
            amount: plan.annual.amount,
            monthlyEquivalent: plan.annual.monthlyEquivalent,
            savingsPercent: plan.annual.savingsPercent,
          },
        }
      : null

  return (
    <PricingContent
      isLoggedIn={isLoggedIn}
      level1Plan={serializePlan(level1Plan)!}
      level2Plan={serializePlan(level2Plan)!}
      level3Plan={serializePlan(level3Plan)}
      level3Eligible={level3Eligible}
    />
  )
}

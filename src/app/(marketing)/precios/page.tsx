import { PricingContent } from '@/components/pricing/pricing-content'
import { getSubscriptionPlan } from '@/lib/payments/config'
import {
  LEVEL_2_DEFAULT_SPECIALIZATION,
} from '@/lib/specializations'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Precios - SAPIHUM',
  description:
    'Conoce el registro gratuito y la membresia de SAPIHUM: formacion continua, red de profesionales y recursos clinicos. Expansiones opcionales de Consultorio Digital y Marketing.',
}

export const revalidate = 3600

export default async function PricingPage() {
  const level1Plan = getSubscriptionPlan(1)
  const level2Plan = getSubscriptionPlan(2, LEVEL_2_DEFAULT_SPECIALIZATION)
  const level3Plan = getSubscriptionPlan(3)

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
      isLoggedIn={false}
      level1Plan={serializePlan(level1Plan)!}
      level2Plan={serializePlan(level2Plan)!}
      level3Plan={serializePlan(level3Plan)}
      level3Eligible={false}
    />
  )
}

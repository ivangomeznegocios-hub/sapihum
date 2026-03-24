import { MEMBERSHIP_TIERS } from '@/lib/membership'
import { getSubscriptionPlan } from '@/lib/payments/config'
import {
  canUserSeeLevel3Offer,
  getActiveSpecializations,
  getComingSoonSpecializations,
} from '@/lib/specializations'
import { getUserProfile } from '@/lib/supabase/server'
import { PricingContent } from '@/components/pricing/pricing-content'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Precios — SAPIHUM',
  description:
    'Precios claros para crecer por especialización. Nivel 1 para comunidad, Nivel 2 por especialización, Nivel 3 para escalar tu práctica.',
}

export default async function PricingPage() {
  const profile = await getUserProfile()
  const isLoggedIn = !!profile
  const currentLevel = profile?.membership_level ?? 0
  const currentSpecializationCode =
    (profile as any)?.membership_specialization_code ?? null

  const level1Plan = getSubscriptionPlan(1)
  const level3Plan = getSubscriptionPlan(3)
  const activeSpecs = getActiveSpecializations()
  const comingSoonSpecs = getComingSoonSpecializations()

  const level3Visible = canUserSeeLevel3Offer({
    membershipLevel: currentLevel,
    specializationCode: currentSpecializationCode,
    isAdmin: profile?.role === 'admin',
  })

  /* Serialize active specializations with their plans */
  const activeSpecsSerialized = activeSpecs
    .map((spec) => {
      const plan = getSubscriptionPlan(2, spec.code)
      return {
        code: spec.code,
        name: spec.name,
        slug: spec.slug,
        status: spec.status,
        icon: spec.icon,
        tagline: spec.tagline,
        description: spec.description,
        includesSoftware: spec.includesSoftware,
        includesEvents: spec.includesEvents,
        benefits: spec.benefits,
        tools: spec.tools,
        plan: plan
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
          : null,
      }
    })

  const comingSoonSerialized = comingSoonSpecs.map((spec) => ({
    code: spec.code,
    name: spec.name,
    slug: spec.slug,
    status: spec.status,
    icon: spec.icon,
    tagline: spec.tagline,
    description: spec.description,
    includesSoftware: spec.includesSoftware,
    includesEvents: spec.includesEvents,
    benefits: spec.benefits,
    tools: spec.tools,
  }))

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
      level3Plan={serializePlan(level3Plan)}
      level3Visible={level3Visible}
      level1Features={MEMBERSHIP_TIERS[1].features}
      level3Features={MEMBERSHIP_TIERS[3].features}
      activeSpecializations={activeSpecsSerialized}
      comingSoonSpecializations={comingSoonSerialized}
    />
  )
}

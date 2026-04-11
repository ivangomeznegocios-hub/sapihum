'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  PlusCircle,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SubscribeButton } from '@/components/payments/SubscribeButton'
import {
  LEVEL_1_FEATURE_IDS,
  LEVEL_2_CARD_FEATURE_IDS,
  LEVEL_3_CARD_FEATURE_IDS,
  PRICING_COMPARISON_FEATURES,
  PRICING_FEATURES_BY_ID,
  PRICING_GROUP_LABELS,
  PRICING_PLAN_COPY,
  type PricingPlanKey,
} from '@/lib/pricing-catalog'
import { LEVEL_2_DEFAULT_SPECIALIZATION } from '@/lib/specializations'
import { Fragment } from 'react'

interface SerializedPlan {
  name: string
  membershipLevel: number
  monthly: { amount: number }
  annual: { amount: number; monthlyEquivalent: number; savingsPercent: number }
}

interface PricingContentProps {
  isLoggedIn: boolean
  level1Plan: SerializedPlan
  level2Plan: SerializedPlan
  level3Plan: SerializedPlan | null
  level3Eligible: boolean
}

function currency(value: number) {
  return `$${value.toLocaleString('es-MX')}`
}

function BillingToggle({
  isAnnual,
  onToggle,
  savingsPercent,
}: {
  isAnnual: boolean
  onToggle: () => void
  savingsPercent: number
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
      <button
        onClick={() => !isAnnual || onToggle()}
        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
          !isAnnual
            ? 'bg-white text-black shadow-sm'
            : 'text-[#c0bfbc]/70 hover:text-white'
        }`}
      >
        Mensual
      </button>
      <button
        onClick={() => isAnnual || onToggle()}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
          isAnnual
            ? 'bg-white text-black shadow-sm'
            : 'text-[#c0bfbc]/70 hover:text-white'
        }`}
      >
        Anual
        {savingsPercent > 0 && (
          <span className="rounded-full bg-[#f6ae02]/15 px-2 py-0.5 text-[11px] font-bold text-[#f6ae02]">
            -{savingsPercent}%
          </span>
        )}
      </button>
    </div>
  )
}

function PriceDisplay({
  plan,
  isAnnual,
}: {
  plan: SerializedPlan
  isAnnual: boolean
}) {
  if (isAnnual) {
    return (
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {currency(plan.annual.monthlyEquivalent)}
          </span>
          <span className="text-sm text-[#c0bfbc]/50">/mes</span>
        </div>
        <p className="mt-2 text-xs text-[#c0bfbc]/45">
          <span className="line-through">{currency(plan.monthly.amount)}/mes</span>
          {' · '}
          {currency(plan.annual.amount)} facturado anualmente
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {currency(plan.monthly.amount)}
      </span>
      <span className="text-sm text-[#c0bfbc]/50">/mes</span>
    </div>
  )
}

function ComparisonCell({ included }: { included: boolean }) {
  return included ? (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f6ae02]/12 text-[#f6ae02]">
      <Check className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-white/20">
      <X className="h-3.5 w-3.5" />
    </span>
  )
}

export function PricingContent({
  isLoggedIn,
  level1Plan,
  level2Plan,
  level3Plan,
  level3Eligible,
}: PricingContentProps) {
  const [isAnnual, setIsAnnual] = useState(false)
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)

  const selectedFeature = selectedFeatureId ? PRICING_FEATURES_BY_ID[selectedFeatureId] : null

  const comparisonGroups = useMemo(
    () =>
      (Object.keys(PRICING_GROUP_LABELS) as PricingPlanKey[]).map((group) => ({
        group,
        label: PRICING_GROUP_LABELS[group],
        rows: PRICING_COMPARISON_FEATURES.filter((feature) => feature.group === group),
      })),
    []
  )

  const cardConfigs = [
    {
      key: 'level1' as const,
      plan: level1Plan,
      icon: Users,
      featureIds: LEVEL_1_FEATURE_IDS,
      accent: false,
      cardClassName: 'border-white/[0.08] bg-[#0a0a0a]',
    },
    {
      key: 'level2' as const,
      plan: level2Plan,
      icon: Zap,
      featureIds: LEVEL_2_CARD_FEATURE_IDS,
      accent: true,
      cardClassName:
        'border-[#f6ae02]/20 bg-gradient-to-b from-[#0d0b04] to-[#0a0a0a] shadow-[0_0_80px_rgba(246,174,2,0.06)]',
    },
    {
      key: 'level3' as const,
      plan: level3Plan,
      icon: Crown,
      featureIds: LEVEL_3_CARD_FEATURE_IDS,
      accent: false,
      cardClassName: 'border-white/[0.08] bg-[#0a0a0a]',
    },
  ]

  return (
    <>
      <div className="flex w-full flex-col bg-black text-white">
        {/* ── Hero ── */}
        <section className="relative w-full overflow-hidden border-b border-white/[0.06] bg-black">
          <div className="absolute inset-0 sapihum-grid-bg opacity-20" />
          <div className="absolute left-1/2 top-0 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[#f6ae02]/6 blur-[140px]" />

          <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <div className="sapihum-fade-up inline-flex items-center gap-2 rounded-sm border border-[#f6ae02]/20 bg-[#f6ae02]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                Membresía SAPIHUM
              </div>
              <h1 className="sapihum-fade-up mt-8 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                Planes para crecer con
                {' '}
                <span className="font-serif font-normal italic text-[#c0bfbc]">
                  más estructura y respaldo profesional
                </span>
              </h1>
              <p className="sapihum-fade-up mx-auto mt-8 max-w-2xl text-base font-light leading-relaxed text-[#c0bfbc]/65 md:text-lg">
                Comunidad, consultorio digital y acompañamiento premium.
                Elige el nivel que se adapte a tu etapa profesional.
              </p>

              <div className="sapihum-fade-up mt-10">
                <BillingToggle
                  isAnnual={isAnnual}
                  onToggle={() => setIsAnnual(!isAnnual)}
                  savingsPercent={level1Plan.annual.savingsPercent}
                />
              </div>

              <p className="mt-5 text-xs text-[#c0bfbc]/40">
                Montos en MXN · El Nivel 2 disponible hoy corresponde a Psicología Clínica
              </p>
            </div>
          </div>
        </section>

        {/* ── Pricing Cards ── */}
        <section className="w-full bg-black py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {cardConfigs.map((card) => {
                if (!card.plan) return null

                const copy = PRICING_PLAN_COPY[card.key]
                const Icon = card.icon

                return (
                  <Card
                    key={card.key}
                    className={`relative flex h-full flex-col overflow-hidden rounded-2xl ${card.cardClassName}`}
                  >
                    {/* Accent top bar for level 2 */}
                    {card.accent && (
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f6ae02]/50 to-transparent" />
                    )}

                    <CardContent className="flex h-full flex-col p-0">
                      {/* Card header */}
                      <div className="px-6 pt-6 pb-5 sm:px-7">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-[0.18em] text-[#c0bfbc]/70 hover:bg-white/[0.04]">
                            {copy.levelLabel}
                          </Badge>
                          {copy.badge && (
                            <Badge className="border border-[#f6ae02]/15 bg-[#f6ae02]/8 text-[10px] uppercase tracking-[0.18em] text-[#f6ae02] hover:bg-[#f6ae02]/8">
                              {copy.badge}
                            </Badge>
                          )}
                        </div>

                        {/* Icon + Title + Description */}
                        <div className="mt-5 flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.accent ? 'bg-[#f6ae02]/12 text-[#f6ae02]' : 'bg-white/[0.04] text-[#f6ae02]'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <h2 className="text-xl font-bold text-white sm:text-2xl">
                            {copy.title}
                          </h2>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-[#c0bfbc]/55">
                          {copy.description}
                        </p>

                        {/* Price — own row, clean and prominent */}
                        <div className="mt-5 border-t border-white/[0.06] pt-5">
                          <PriceDisplay plan={card.plan} isAnnual={isAnnual} />
                        </div>
                      </div>

                      {/* Feature list */}
                      <div className="flex flex-1 flex-col border-t border-white/[0.06] px-6 py-5 sm:px-7">
                        <p className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-[#c0bfbc]/40">
                          <span>Lo que incluye</span>
                          {card.key === 'level2' && (
                            <span className="text-[#f6ae02]/70">+ todo de Nivel 1</span>
                          )}
                          {card.key === 'level3' && (
                            <span className="text-[#f6ae02]/70">+ todo de Nivel 2</span>
                          )}
                        </p>

                        <ul className="flex-1 space-y-2.5">
                          {card.featureIds.map((featureId) => {
                            const feature = PRICING_FEATURES_BY_ID[featureId]
                            const carryover = featureId === 'todo-nivel-1' || featureId === 'todo-nivel-2'

                            return (
                              <li
                                key={featureId}
                                className="group/feat flex items-center gap-3"
                              >
                                {carryover ? (
                                  <PlusCircle className="h-4 w-4 shrink-0 text-[#f6ae02]" />
                                ) : (
                                  <Check className="h-4 w-4 shrink-0 text-[#f6ae02]/70" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedFeatureId(feature.id)}
                                  className={`text-left text-sm transition-colors hover:text-[#f6ae02] ${carryover ? 'font-medium text-white' : 'text-[#c0bfbc]/70'}`}
                                >
                                  {feature.title}
                                </button>
                              </li>
                            )
                          })}
                        </ul>

                        {/* Note */}
                        <p className="mt-5 border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-[#c0bfbc]/40">
                          {copy.note}
                        </p>

                        {/* CTA */}
                        <div className="mt-5">
                          {card.key === 'level1' && (
                            isLoggedIn ? (
                              <Link href="/dashboard/subscription" className="block">
                                <Button className="w-full gap-2" size="lg">
                                  {copy.cta.member}
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            ) : (
                              <SubscribeButton
                                membershipLevel={1}
                                billingInterval={isAnnual ? 'annual' : 'monthly'}
                                label={copy.cta.guest}
                                title="tu Nivel 1"
                                successPath="/dashboard/subscription"
                                className="w-full"
                              />
                            )
                          )}

                          {card.key === 'level2' && (
                            isLoggedIn ? (
                              <Link href="/dashboard/subscription" className="block">
                                <Button className="w-full gap-2" size="lg">
                                  {copy.cta.member}
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            ) : (
                              <SubscribeButton
                                membershipLevel={2}
                                specializationCode={LEVEL_2_DEFAULT_SPECIALIZATION}
                                billingInterval={isAnnual ? 'annual' : 'monthly'}
                                label={copy.cta.guest}
                                title={copy.title}
                                successPath="/dashboard/subscription"
                                className="w-full"
                              />
                            )
                          )}

                          {card.key === 'level3' && (
                            isLoggedIn ? (
                              <Link href="/dashboard/subscription" className="block">
                                <Button
                                  className="w-full gap-2"
                                  size="lg"
                                  variant={level3Eligible ? 'default' : 'outline'}
                                >
                                  {level3Eligible ? copy.cta.member : 'Desbloquea primero tu Nivel 2'}
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            ) : (
                              <Link href="/auth/login" className="block">
                                <Button className="w-full gap-2" size="lg" variant="outline">
                                  Inicia sesión para desbloquearlo
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            )
                          )}
                        </div>

                        {card.key === 'level3' && (
                          <p className="mt-3 text-center text-[11px] text-[#c0bfbc]/40">
                            Se habilita una vez que ya tienes activo tu Nivel 2.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Comparison toggle ── */}
        <section className="w-full border-y border-white/[0.06] bg-[#030303] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                Comparativa
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Detalle por beneficio y{' '}
                <span className="font-serif font-normal italic text-[#c0bfbc]">
                  nivel de membresía
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm font-light leading-relaxed text-[#c0bfbc]/55">
                Toca cualquier beneficio para ver la explicación completa.
              </p>
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => setComparisonOpen(!comparisonOpen)}
              >
                {comparisonOpen ? 'Ocultar comparativa' : 'Ver comparativa detallada'}
                {comparisonOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {comparisonOpen && (
              <div className="mt-10 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#070707]">
                <Table className="w-full min-w-[640px] text-white">
                  <TableHeader>
                    <TableRow className="border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.03]">
                      <TableHead className="w-[40%] text-[#c0bfbc]/60 text-xs">Beneficio</TableHead>
                      <TableHead className="w-[20%] text-center text-[#c0bfbc]/60 text-xs">
                        {PRICING_PLAN_COPY.level1.title}
                      </TableHead>
                      <TableHead className="w-[20%] text-center text-[#c0bfbc]/60 text-xs">
                        {PRICING_PLAN_COPY.level2.title}
                      </TableHead>
                      <TableHead className="w-[20%] text-center text-[#c0bfbc]/60 text-xs">
                        {PRICING_PLAN_COPY.level3.title}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonGroups.map((group) => (
                      <Fragment key={group.group}>
                        <TableRow className="border-white/[0.06] bg-[#0d0d0d] hover:bg-[#0d0d0d]">
                          <TableCell colSpan={4} className="py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                            {group.label}
                          </TableCell>
                        </TableRow>
                        {group.rows.map((feature, index) => (
                          <TableRow
                            key={feature.id}
                            className={`cursor-pointer border-white/[0.05] transition-colors hover:bg-white/[0.04] ${
                              index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                            }`}
                            onClick={() => setSelectedFeatureId(feature.id)}
                          >
                            <TableCell className="align-middle">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white">{feature.title}</p>
                                <p className="mt-0.5 text-xs text-[#c0bfbc]/45">{feature.description}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center align-middle">
                              <ComparisonCell included={feature.availability.level1} />
                            </TableCell>
                            <TableCell className="text-center align-middle">
                              <ComparisonCell included={feature.availability.level2} />
                            </TableCell>
                            <TableCell className="text-center align-middle">
                              <ComparisonCell included={feature.availability.level3} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>

        {/* ── Bottom info cards ── */}
        <section className="w-full bg-black py-16 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            {[
              {
                icon: Users,
                title: 'Cómo empieza el recorrido',
                text: 'El Nivel 1 es la base para comunidad, formación continua y recursos. Desde ahí puedes decidir tu siguiente paso.',
              },
              {
                icon: BookOpen,
                title: 'Qué cubre Consultorio Digital',
                text: 'El Nivel 2 agrega infraestructura operativa: web, agenda, pagos, plataforma clínica y soporte.',
              },
              {
                icon: Sparkles,
                title: 'Cuándo conviene Nivel 3',
                text: 'Cuando operas con Nivel 2 y quieres acelerar con ejecución de marca, contenido y posicionamiento.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-[#f6ae02]">
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#c0bfbc]/50">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Feature Detail Dialog — Minimalist ── */}
      <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeatureId(null)}>
        <DialogContent className="max-w-md border-white/[0.08] bg-[#0a0a0a] text-white sm:rounded-2xl">
          {selectedFeature && (
            <div className="space-y-4">
              <DialogHeader className="space-y-2 text-left">
                <Badge className="w-fit border border-[#f6ae02]/15 bg-[#f6ae02]/8 text-[10px] uppercase tracking-[0.18em] text-[#f6ae02] hover:bg-[#f6ae02]/8">
                  {PRICING_GROUP_LABELS[selectedFeature.group]}
                </Badge>
                <DialogTitle className="text-xl font-bold tracking-tight text-white">
                  {selectedFeature.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-[#c0bfbc]/60">
                  {selectedFeature.description}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-relaxed text-[#c0bfbc]/70">
                {selectedFeature.details}
              </div>

              {/* Simple availability row — compact */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#c0bfbc]/35">
                  Disponible en:
                </span>
                <div className="flex items-center gap-2">
                  {(['level1', 'level2', 'level3'] as PricingPlanKey[]).map((level) => {
                    const enabled = selectedFeature.availability[level]
                    return (
                      <span
                        key={level}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                          enabled
                            ? 'border border-[#f6ae02]/20 bg-[#f6ae02]/8 text-[#f6ae02]'
                            : 'border border-white/[0.06] bg-white/[0.02] text-[#c0bfbc]/30'
                        }`}
                      >
                        {enabled && <Check className="h-3 w-3" />}
                        N{level.replace('level', '')}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

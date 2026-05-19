'use client'

import dynamic from 'next/dynamic'
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

const SubscribeButton = dynamic(
  () => import('@/components/payments/SubscribeButton').then((module) => module.SubscribeButton),
  {
    ssr: false,
    loading: () => (
      <Button className="w-full" size="lg" disabled>
        Cargando...
      </Button>
    ),
  }
)

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
    <div className="inline-flex items-center rounded-full border border-brand-border bg-white p-1">
      <button
        onClick={() => !isAnnual || onToggle()}
        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
          !isAnnual
            ? 'bg-brand-text-strong text-white shadow-sm'
            : 'text-brand-text-muted hover:text-brand-text-strong'
        }`}
      >
        Mensual
      </button>
      <button
        onClick={() => isAnnual || onToggle()}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
          isAnnual
            ? 'bg-brand-text-strong text-white shadow-sm'
            : 'text-brand-text-muted hover:text-brand-text-strong'
        }`}
      >
        Anual
        {savingsPercent > 0 && (
          <span className="rounded-full bg-[#2563EB]/15 px-2 py-0.5 text-[11px] font-bold text-[#2563EB]">
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
          <span className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {currency(plan.annual.monthlyEquivalent)}
          </span>
          <span className="text-sm text-brand-text-muted">/mes</span>
        </div>
        <p className="mt-2 text-xs text-brand-text-muted">
          <span className="line-through">{currency(plan.monthly.amount)}/mes</span>
          {' · '}
          {currency(plan.annual.amount)} facturado anualmente
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {currency(plan.monthly.amount)}
      </span>
      <span className="text-sm text-brand-text-muted">/mes</span>
    </div>
  )
}

function ComparisonCell({ included }: { included: boolean }) {
  return included ? (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB]/12 text-[#2563EB]">
      <Check className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-surface-soft text-foreground/20">
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
      cardClassName: 'border-brand-border bg-background',
    },
    {
      key: 'level2' as const,
      plan: level2Plan,
      icon: Zap,
      featureIds: LEVEL_2_CARD_FEATURE_IDS,
      accent: true,
      cardClassName:
        'border-brand-blue-border bg-gradient-to-b from-card to-brand-blue-soft shadow-[0_0_80px_rgba(37,99,235,0.08)]',
    },
    {
      key: 'level3' as const,
      plan: level3Plan,
      icon: Crown,
      featureIds: LEVEL_3_CARD_FEATURE_IDS,
      accent: false,
      cardClassName: 'border-brand-border bg-background',
    },
  ]

  return (
    <>
      <div className="flex w-full flex-col bg-background text-foreground">
        {/* ── Hero ── */}
        <section className="relative w-full overflow-hidden border-b border-border/[0.06] bg-background">
          <div className="absolute inset-0 sapihum-grid-bg opacity-20" />
          <div className="absolute left-1/2 top-0 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[#2563EB]/6 blur-[140px]" />

            <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <div className="sapihum-fade-up inline-flex items-center gap-2 rounded-sm border border-[#2563EB]/20 bg-[#2563EB]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB]">
                Membresía SAPIHUM
              </div>
              <h1 className="sapihum-fade-up mt-8 font-serif text-3xl font-bold leading-[1.06] tracking-normal text-brand-text-strong sm:text-4xl md:text-5xl lg:text-6xl">
                Una membresía. Una comunidad.{' '}
                <span className="font-bold italic text-brand-blue-dark">
                  Todo lo que necesitas para crecer como psicólogo.
                </span>
              </h1>
              <p className="sapihum-fade-up mx-auto mt-8 max-w-2xl text-base font-light leading-relaxed text-brand-text-muted md:text-lg">
                Accede a formación continua, red de profesionales, recursos clínicos y eventos.
                Para quienes quieren más, hay expansiones opcionales.
              </p>

              <div className="sapihum-fade-up mt-10">
                <BillingToggle
                  isAnnual={isAnnual}
                  onToggle={() => setIsAnnual(!isAnnual)}
                  savingsPercent={level1Plan.annual.savingsPercent}
                />
              </div>

              <p className="mt-5 text-xs text-brand-text-muted">
                Montos en MXN · La expansión de Consultorio Digital es para Psicología Clínica
              </p>
            </div>
          </div>
        </section>

        {/* ── Pricing Cards ── */}
        <section className="w-full bg-background pb-16 pt-8 sm:pb-20 sm:pt-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-16 max-w-2xl">
              {cardConfigs.filter(c => c.key === 'level1').map((card) => {
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
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent" />
                    )}

                    <CardContent className="flex h-full flex-col p-0">
                      {/* Card header */}
                      <div className="px-6 pt-6 pb-5 sm:px-7">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border border-brand-border bg-brand-surface-soft text-[10px] uppercase tracking-[0.18em] text-brand-text-muted hover:bg-brand-surface-soft">
                            {copy.levelLabel}
                          </Badge>
                          {copy.badge && (
                            <Badge className="border border-[#2563EB]/15 bg-[#2563EB]/8 text-[10px] uppercase tracking-[0.18em] text-[#2563EB] hover:bg-[#2563EB]/8">
                              {copy.badge}
                            </Badge>
                          )}
                        </div>

                        {/* Icon + Title + Description */}
                        <div className="mt-5 flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.accent ? 'bg-[#2563EB]/12 text-[#2563EB]' : 'bg-brand-surface-soft text-[#2563EB]'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                            {copy.title}
                          </h2>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">
                          {copy.description}
                        </p>

                        {/* Price — own row, clean and prominent */}
                        <div className="mt-5 border-t border-border/[0.06] pt-5">
                          <PriceDisplay plan={card.plan} isAnnual={isAnnual} />
                        </div>
                      </div>

                      {/* Feature list */}
                      <div className="flex flex-1 flex-col border-t border-border/[0.06] px-6 py-5 sm:px-7">
                        <p className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
                          <span>Lo que incluye</span>
                        </p>

                        <ul className="flex-1 space-y-2.5">
                          {card.featureIds.map((featureId) => {
                            const feature = PRICING_FEATURES_BY_ID[featureId]
                            return (
                              <li key={featureId} className="group/feat flex items-center gap-3">
                                <Check className="h-4 w-4 shrink-0 text-[#2563EB]/70" />
                                <button
                                  type="button"
                                  onClick={() => setSelectedFeatureId(feature.id)}
                                  className="text-left text-sm font-medium text-brand-text-muted transition-colors hover:text-[#2563EB]"
                                >
                                  {feature.title}
                                </button>
                              </li>
                            )
                          })}
                        </ul>

                        {/* Note */}
                        <p className="mt-5 border-t border-border/[0.06] pt-4 text-xs leading-relaxed text-brand-text-muted">
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
                                title="tu Membresía"
                                successPath="/dashboard/subscription"
                                className="w-full"
                              />
                            )
                          )}

                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Separator */}
            <div className="relative mb-16 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/[0.06]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 font-medium tracking-wide text-brand-text-muted uppercase text-[10px]">Expansiones opcionales</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-5">
              {cardConfigs.filter(c => c.key !== 'level1').map((card) => {
                if (!card.plan) return null
                const copy = PRICING_PLAN_COPY[card.key]
                const Icon = card.icon
                return (
                  <Card
                    key={card.key}
                    className={`relative flex h-full flex-col overflow-hidden rounded-2xl ${card.cardClassName}`}
                  >
                    {card.accent && (
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent" />
                    )}
                    <CardContent className="flex h-full flex-col p-0">
                      <div className="px-6 pt-6 pb-5 sm:px-7">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border border-brand-border bg-brand-surface-soft text-[10px] uppercase tracking-[0.18em] text-brand-text-muted hover:bg-brand-surface-soft">
                            {copy.levelLabel}
                          </Badge>
                          {copy.badge && (
                            <Badge className="border border-[#2563EB]/15 bg-[#2563EB]/8 text-[10px] uppercase tracking-[0.18em] text-[#2563EB] hover:bg-[#2563EB]/8">
                              {copy.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-5 flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.accent ? 'bg-[#2563EB]/12 text-[#2563EB]' : 'bg-brand-surface-soft text-[#2563EB]'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                            {copy.title}
                          </h2>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">
                          {copy.description}
                        </p>
                        <div className="mt-5 border-t border-border/[0.06] pt-5">
                          <PriceDisplay plan={card.plan} isAnnual={isAnnual} />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col border-t border-border/[0.06] px-6 py-5 sm:px-7">
                        <p className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text-muted">
                          <span>Lo que incluye</span>
                          {card.key === 'level2' && (
                            <span className="text-[#2563EB]/70">+ toda la Membresía</span>
                          )}
                          {card.key === 'level3' && (
                            <span className="text-[#2563EB]/70">+ todo Consultorio Digital</span>
                          )}
                        </p>
                        <ul className="flex-1 space-y-2.5">
                          {card.featureIds.map((featureId) => {
                            const feature = PRICING_FEATURES_BY_ID[featureId]
                            const carryover = featureId === 'todo-nivel-1' || featureId === 'todo-nivel-2'
                            return (
                              <li key={featureId} className="group/feat flex items-center gap-3">
                                {carryover ? (
                                  <PlusCircle className="h-4 w-4 shrink-0 text-[#2563EB]" />
                                ) : (
                                  <Check className="h-4 w-4 shrink-0 text-[#2563EB]/70" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedFeatureId(feature.id)}
                                  className={`text-left text-sm transition-colors hover:text-[#2563EB] ${carryover ? 'font-medium text-foreground' : 'text-brand-text-muted'}`}
                                >
                                  {feature.title}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                        <p className="mt-5 border-t border-border/[0.06] pt-4 text-xs leading-relaxed text-brand-text-muted">
                          {copy.note}
                        </p>
                        <div className="mt-5">
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
                                  {level3Eligible ? copy.cta.member : 'Desbloquea primero Consultorio Digital'}
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
                          <p className="mt-3 text-center text-[11px] text-brand-text-muted">
                            Se habilita una vez que ya tienes activo Consultorio Digital.
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
        <section className="w-full border-y border-border/[0.06] bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB]">
                Comparativa
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Detalle por beneficio y{' '}
                <span className="font-serif font-normal italic text-brand-text-muted">
                  expansión
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm font-light leading-relaxed text-brand-text-muted">
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
              <div className="mt-10 overflow-x-auto rounded-2xl border border-brand-border bg-[#070707]">
                <Table className="w-full min-w-[640px] text-foreground">
                  <TableHeader>
                    <TableRow className="border-brand-border bg-white hover:bg-white">
                      <TableHead className="w-[40%] text-brand-text-muted text-xs">Beneficio</TableHead>
                      <TableHead className="w-[20%] text-center text-brand-text-muted text-xs">
                        Comunidad
                      </TableHead>
                      <TableHead className="w-[20%] text-center text-brand-text-muted text-xs">
                        + Consultorio
                      </TableHead>
                      <TableHead className="w-[20%] text-center text-brand-text-muted text-xs">
                        + Marketing
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonGroups.map((group) => (
                      <Fragment key={group.group}>
                        <TableRow className="border-border/[0.06] bg-[#0d0d0d] hover:bg-[#0d0d0d]">
                          <TableCell colSpan={4} className="py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB]">
                            {group.label}
                          </TableCell>
                        </TableRow>
                        {group.rows.map((feature, index) => (
                          <TableRow
                            key={feature.id}
                            className={`cursor-pointer border-border/[0.05] transition-colors hover:bg-brand-surface-soft ${
                              index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                            }`}
                            onClick={() => setSelectedFeatureId(feature.id)}
                          >
                            <TableCell className="align-middle">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{feature.title}</p>
                                <p className="mt-0.5 text-xs text-brand-text-muted">{feature.description}</p>
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
        <section className="w-full bg-background py-16 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            {[
              {
                icon: Users,
                title: 'Dónde empieza todo',
                text: 'La membresía es tu comunidad de referencia: formación, red y recursos desde el día uno.',
              },
              {
                icon: BookOpen,
                title: '¿Quieres digitalizar tu consultorio?',
                text: 'Suma la expansión clínica: web, agenda, pagos, plataforma y soporte operativo.',
              },
              {
                icon: Sparkles,
                title: '¿Quieres crecer tu marca?',
                text: 'La expansión de marketing te da community manager, contenido, ads y posicionamiento local.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-brand-border bg-background p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-surface-soft text-[#2563EB]">
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Feature Detail Dialog — Minimalist ── */}
      <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeatureId(null)}>
        <DialogContent className="max-w-md border-brand-border bg-background text-foreground sm:rounded-2xl">
          {selectedFeature && (
            <div className="space-y-4">
              <DialogHeader className="space-y-2 text-left">
                <Badge className="w-fit border border-[#2563EB]/15 bg-[#2563EB]/8 text-[10px] uppercase tracking-[0.18em] text-[#2563EB] hover:bg-[#2563EB]/8">
                  {PRICING_GROUP_LABELS[selectedFeature.group]}
                </Badge>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  {selectedFeature.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-brand-text-muted">
                  {selectedFeature.description}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-border/[0.06] bg-white/[0.02] p-4 text-sm leading-relaxed text-brand-text-muted">
                {selectedFeature.details}
              </div>

              {/* Simple availability row — compact */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-muted">
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
                            ? 'border border-[#2563EB]/20 bg-[#2563EB]/8 text-[#2563EB]'
                            : 'border border-border/[0.06] bg-white/[0.02] text-brand-text-disabled'
                        }`}
                      >
                        {enabled && <Check className="h-3 w-3" />}
                        {level === 'level1' ? 'Membresía' : level === 'level2' ? '+Consultorio' : '+Marketing'}
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

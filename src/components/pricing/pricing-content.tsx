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
  Info,
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
  type PricingFeatureDefinition,
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
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
          !isAnnual
            ? 'bg-white text-black shadow-sm'
            : 'text-[#c0bfbc]/70 hover:text-white'
        }`}
      >
        Mensual
      </button>
      <button
        onClick={() => isAnnual || onToggle()}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
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
  dark = false,
}: {
  plan: SerializedPlan
  isAnnual: boolean
  dark?: boolean
}) {
  const labelClass = dark ? 'text-white' : 'text-foreground'
  const metaClass = dark ? 'text-[#c0bfbc]/55' : 'text-muted-foreground'

  if (isAnnual) {
    return (
      <div>
        <div className="flex items-end gap-2">
          <span className={`text-4xl font-bold tracking-tight ${labelClass}`}>
            {currency(plan.annual.monthlyEquivalent)}
          </span>
          <span className={`pb-1 text-sm ${metaClass}`}>/mes</span>
        </div>
        <p className={`mt-2 text-xs ${metaClass}`}>
          <span className="line-through">{currency(plan.monthly.amount)}/mes</span>
          {' · '}
          {currency(plan.annual.amount)} facturado anualmente
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <span className={`text-4xl font-bold tracking-tight ${labelClass}`}>
        {currency(plan.monthly.amount)}
      </span>
      <span className={`pb-1 text-sm ${metaClass}`}>/mes</span>
    </div>
  )
}

function FeatureInfoButton({
  feature,
  onOpen,
}: {
  feature: PricingFeatureDefinition
  onOpen: (featureId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(feature.id)}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-[#c0bfbc]/55 transition-colors hover:border-[#f6ae02]/30 hover:text-[#f6ae02]"
      aria-label={`Ver detalle de ${feature.title}`}
    >
      <Info className="h-4 w-4" />
    </button>
  )
}

function ComparisonCell({ included }: { included: boolean }) {
  return included ? (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f6ae02]/12 text-[#f6ae02]">
      <Check className="h-4 w-4" />
    </span>
  ) : (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-white/25">
      <X className="h-4 w-4" />
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

  const plansByKey: Record<PricingPlanKey, SerializedPlan | null> = {
    level1: level1Plan,
    level2: level2Plan,
    level3: level3Plan,
  }

  const cardConfigs = [
    {
      key: 'level1' as const,
      plan: level1Plan,
      icon: Users,
      featureIds: LEVEL_1_FEATURE_IDS,
      cardClassName:
        'border-white/10 bg-[#050505]/95 text-white',
      iconClassName: 'bg-white/[0.04] text-[#f6ae02]',
      titleClassName: 'text-white',
      descriptionClassName: 'text-[#c0bfbc]/62',
      noteClassName: 'text-[#c0bfbc]/50',
    },
    {
      key: 'level2' as const,
      plan: level2Plan,
      icon: Zap,
      featureIds: LEVEL_2_CARD_FEATURE_IDS,
      cardClassName:
        'border-[#f6ae02]/25 bg-gradient-to-br from-[#090909] via-[#111111] to-[#1b1404] text-white shadow-[0_30px_80px_rgba(246,174,2,0.12)]',
      iconClassName: 'bg-[#f6ae02]/14 text-[#f6ae02]',
      titleClassName: 'text-white',
      descriptionClassName: 'text-[#c0bfbc]/70',
      noteClassName: 'text-[#c0bfbc]/55',
    },
    {
      key: 'level3' as const,
      plan: level3Plan,
      icon: Crown,
      featureIds: LEVEL_3_CARD_FEATURE_IDS,
      cardClassName:
        'border-white/10 bg-gradient-to-br from-[#080808] via-[#111111] to-[#1d1d1c] text-white',
      iconClassName: 'bg-white/[0.05] text-[#f6ae02]',
      titleClassName: 'text-white',
      descriptionClassName: 'text-[#c0bfbc]/68',
      noteClassName: 'text-[#c0bfbc]/52',
    },
  ]

  return (
    <>
      <div className="flex w-full flex-col bg-black text-white">
        <section className="relative w-full overflow-hidden border-b border-white/[0.06] bg-black">
          <div className="absolute inset-0 sapihum-grid-bg opacity-20" />
          <div className="absolute left-1/2 top-0 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[#f6ae02]/6 blur-[140px]" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <div className="sapihum-fade-up inline-flex items-center gap-2 rounded-sm border border-[#f6ae02]/20 bg-[#f6ae02]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                Membresía SAPIHUM
              </div>
              <h1 className="sapihum-fade-up mt-8 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Planes para crecer con
                {' '}
                <span className="font-serif font-normal italic text-[#c0bfbc]">
                  más estructura, tecnología y respaldo profesional
                </span>
              </h1>
              <p className="sapihum-fade-up mx-auto mt-8 max-w-3xl text-lg font-light leading-relaxed text-[#c0bfbc]/70 md:text-xl">
                Toma como base la comunidad, sube a un consultorio digital para psicología
                clínica y, cuando estés listo para escalar, activa el acompañamiento premium
                en gestión y marketing.
              </p>

              <div className="sapihum-fade-up mt-10">
                <BillingToggle
                  isAnnual={isAnnual}
                  onToggle={() => setIsAnnual(!isAnnual)}
                  savingsPercent={level1Plan.annual.savingsPercent}
                />
              </div>

              <p className="mt-5 text-sm text-[#c0bfbc]/45">
                Todos los montos están en MXN. El Nivel 2 comercial disponible hoy corresponde a
                Psicología Clínica.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full bg-black py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
              {cardConfigs.map((card) => {
                if (!card.plan) return null

                const copy = PRICING_PLAN_COPY[card.key]
                const Icon = card.icon

                return (
                  <Card
                    key={card.key}
                    className={`flex h-full flex-col overflow-hidden rounded-[28px] ${card.cardClassName}`}
                  >
                    <CardContent className="flex h-full flex-col p-0">
                      <div className="border-b border-white/8 px-6 pb-6 pt-6 sm:px-7">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-[0.18em] text-[#c0bfbc] hover:bg-white/[0.04]">
                              {copy.levelLabel}
                            </Badge>
                            <Badge className="border border-[#f6ae02]/15 bg-[#f6ae02]/8 text-[10px] uppercase tracking-[0.18em] text-[#f6ae02] hover:bg-[#f6ae02]/8">
                              {copy.eyebrow}
                            </Badge>
                          </div>
                          {copy.badge && (
                            <Badge className="border border-[#f6ae02]/15 bg-[#f6ae02]/8 text-[10px] uppercase tracking-[0.18em] text-[#f6ae02] hover:bg-[#f6ae02]/8">
                              {copy.badge}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-6 flex items-start justify-between gap-4">
                          <div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconClassName}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <h2 className={`mt-5 text-2xl font-bold ${card.titleClassName}`}>
                              {copy.title}
                            </h2>
                            <p className={`mt-3 text-sm leading-relaxed ${card.descriptionClassName}`}>
                              {copy.description}
                            </p>
                          </div>
                          <PriceDisplay plan={card.plan} isAnnual={isAnnual} dark />
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col px-6 py-6 sm:px-7">
                        <div className="mb-4 flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c0bfbc]/45">
                            Todo lo que incluye
                          </p>
                          {card.key === 'level2' && (
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f6ae02]/85">
                              Nivel 1 + software
                            </span>
                          )}
                          {card.key === 'level3' && (
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f6ae02]/85">
                              Nivel 2 + growth
                            </span>
                          )}
                        </div>

                        <ul className="flex-1 space-y-3">
                          {card.featureIds.map((featureId) => {
                            const feature = PRICING_FEATURES_BY_ID[featureId]
                            const carryover = featureId === 'todo-nivel-1' || featureId === 'todo-nivel-2'

                            return (
                              <li key={featureId} className="flex items-start gap-3">
                                {carryover ? (
                                  <PlusCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f6ae02]" />
                                ) : (
                                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f6ae02]" />
                                )}
                                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                                  <span className={carryover ? 'font-medium text-white' : 'text-sm text-[#c0bfbc]/75'}>
                                    {feature.title}
                                  </span>
                                  <FeatureInfoButton feature={feature} onOpen={setSelectedFeatureId} />
                                </div>
                              </li>
                            )
                          })}
                        </ul>

                        <p className={`mt-6 border-t border-white/8 pt-5 text-sm leading-relaxed ${card.noteClassName}`}>
                          {copy.note}
                        </p>

                        <div className="mt-6">
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
                          <p className="mt-3 text-center text-xs text-[#c0bfbc]/45">
                            Este nivel se habilita una vez que ya tienes activo tu Nivel 2.
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

        <section className="w-full border-y border-white/[0.06] bg-[#030303] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                Comparativa
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                La tabla ya incluye
                {' '}
                <span className="font-serif font-normal italic text-[#c0bfbc]">
                  detalle por beneficio
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg font-light leading-relaxed text-[#c0bfbc]/62">
                Cada fila tiene una explicación puntual para que puedas validar exactamente qué
                trae cada nivel antes de decidir.
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
                {comparisonOpen ? 'Ocultar comparativa detallada' : 'Ver comparativa detallada'}
                {comparisonOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {comparisonOpen && (
              <div className="mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-[#070707] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                <Table className="text-white">
                  <TableHeader>
                    <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                      <TableHead className="min-w-[320px] text-[#c0bfbc]/70">Beneficio</TableHead>
                      <TableHead className="min-w-[160px] text-center text-[#c0bfbc]/70">
                        {PRICING_PLAN_COPY.level1.title}
                      </TableHead>
                      <TableHead className="min-w-[160px] text-center text-[#c0bfbc]/70">
                        {PRICING_PLAN_COPY.level2.title}
                      </TableHead>
                      <TableHead className="min-w-[180px] text-center text-[#c0bfbc]/70">
                        {PRICING_PLAN_COPY.level3.title}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonGroups.map((group) => (
                      <Fragment key={group.group}>
                        <TableRow className="border-white/10 bg-[#0d0d0d] hover:bg-[#0d0d0d]">
                          <TableCell colSpan={4} className="py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#f6ae02]">
                            {group.label}
                          </TableCell>
                        </TableRow>
                        {group.rows.map((feature, index) => (
                          <TableRow
                            key={feature.id}
                            className={`border-white/8 ${
                              index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                            } hover:bg-white/[0.035]`}
                          >
                            <TableCell className="align-top">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-medium text-white">{feature.title}</p>
                                  <p className="mt-1 text-sm text-[#c0bfbc]/55">{feature.description}</p>
                                </div>
                                <FeatureInfoButton feature={feature} onOpen={setSelectedFeatureId} />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <ComparisonCell included={feature.availability.level1} />
                            </TableCell>
                            <TableCell className="text-center">
                              <ComparisonCell included={feature.availability.level2} />
                            </TableCell>
                            <TableCell className="text-center">
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

        <section className="w-full bg-black py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            <div className="rounded-[24px] border border-white/10 bg-[#050505] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#f6ae02]">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">Cómo empieza el recorrido</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#c0bfbc]/62">
                El Nivel 1 es la base para comunidad, formación continua y recursos. Desde ahí
                puedes decidir si solo quieres mantenerte actualizado o pasar a digitalizar tu
                consulta.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#050505] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#f6ae02]">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">Qué cubre Consultorio Digital</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#c0bfbc]/62">
                El Nivel 2 agrega infraestructura operativa: web profesional, agenda, pagos,
                plataforma clínica, soporte e integraciones para que tu práctica funcione con más
                orden y autonomía.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#050505] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#f6ae02]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">Cuándo conviene Nivel 3</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#c0bfbc]/62">
                Cuando ya operas con Nivel 2 y quieres acelerar crecimiento con ejecución de marca,
                contenido, anuncios, posicionamiento local y apoyo operativo especializado.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeatureId(null)}>
        <DialogContent className="border-white/10 bg-[#080808]/95 text-white">
          {selectedFeature && (
            <div className="space-y-5">
              <DialogHeader className="space-y-3 text-left">
                <Badge className="w-fit border border-[#f6ae02]/15 bg-[#f6ae02]/8 text-[10px] uppercase tracking-[0.18em] text-[#f6ae02] hover:bg-[#f6ae02]/8">
                  {PRICING_GROUP_LABELS[selectedFeature.group]}
                </Badge>
                <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                  {selectedFeature.title}
                </DialogTitle>
                <DialogDescription className="text-base text-[#c0bfbc]/68">
                  {selectedFeature.description}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-[#c0bfbc]/78">
                {selectedFeature.details}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {(['level1', 'level2', 'level3'] as PricingPlanKey[]).map((level) => {
                  const plan = plansByKey[level]
                  const enabled = selectedFeature.availability[level]

                  return (
                    <div
                      key={level}
                      className={`rounded-2xl border p-4 ${
                        enabled
                          ? 'border-[#f6ae02]/20 bg-[#f6ae02]/8'
                          : 'border-white/8 bg-white/[0.02]'
                      }`}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c0bfbc]/48">
                        {PRICING_PLAN_COPY[level].title}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {enabled ? (
                          <Check className="h-4 w-4 text-[#f6ae02]" />
                        ) : (
                          <X className="h-4 w-4 text-white/30" />
                        )}
                        <span className="text-sm text-white">
                          {enabled ? 'Incluido' : 'No incluido'}
                        </span>
                      </div>
                      {plan && (
                        <p className="mt-3 text-sm text-[#c0bfbc]/58">
                          Desde {currency(plan.monthly.amount)}/mes
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Sparkles,
  Wrench,
  ArrowRight,
  Users,
  BookOpen,
  Zap,
  Crown,
  X,
} from 'lucide-react'
import { WaitlistCTA } from '@/components/specializations/waitlist-cta'

/* ─── Types for serialized data from server ─── */
interface SerializedPlan {
  name: string
  membershipLevel: number
  monthly: { amount: number }
  annual: { amount: number; monthlyEquivalent: number; savingsPercent: number }
}

interface SerializedSpecialization {
  code: string
  name: string
  slug: string
  status: string
  icon: string
  tagline: string
  description: string
  includesSoftware: boolean
  includesEvents: boolean
  benefits: string[]
  tools: string[]
}

interface PricingContentProps {
  isLoggedIn: boolean
  level1Plan: SerializedPlan
  level3Plan: SerializedPlan | null
  level3Visible: boolean
  level1Features: string[]
  level3Features: string[]
  activeSpecializations: (SerializedSpecialization & { plan: SerializedPlan | null })[]
  comingSoonSpecializations: SerializedSpecialization[]
}

function currency(value: number) {
  return `$${value.toLocaleString('es-MX')}`
}

/* ─── Billing Toggle ─── */
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
    <div className="flex items-center justify-center gap-3" id="billing-toggle">
      <button
        onClick={() => !isAnnual || onToggle()}
        className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 ${
          !isAnnual
            ? 'bg-foreground text-background shadow-lg'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Mensual
      </button>
      <button
        onClick={() => isAnnual || onToggle()}
        className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
          isAnnual
            ? 'bg-foreground text-background shadow-lg'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Anual
        {savingsPercent > 0 && (
          <span className="inline-flex items-center rounded-full bg-brand-brown/20 text-brand-brown dark:text-brand-brown text-xs font-bold px-2 py-0.5">
            -{savingsPercent}%
          </span>
        )}
      </button>
    </div>
  )
}

/* ─── Price Display ─── */
function PriceDisplay({ plan, isAnnual }: { plan: SerializedPlan; isAnnual: boolean }) {
  if (isAnnual) {
    return (
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight">{currency(plan.annual.monthlyEquivalent)}</span>
          <span className="text-sm text-muted-foreground">/mes</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          <span className="line-through">{currency(plan.monthly.amount)}/mes</span>
          {' · '}
          {currency(plan.annual.amount)} facturado anualmente
        </p>
      </div>
    )
  }
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight">{currency(plan.monthly.amount)}</span>
        <span className="text-sm text-muted-foreground">/mes</span>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export function PricingContent({
  isLoggedIn,
  level1Plan,
  level3Plan,
  level3Visible,
  level1Features,
  level3Features,
  activeSpecializations,
  comingSoonSpecializations,
}: PricingContentProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  const savingsPercent = level1Plan.annual.savingsPercent

  return (
    <div className="flex flex-col items-center w-full">
      {/* ═══════ HERO ═══════ */}
      <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden sapihum-grid-bg sapihum-neural-dots">
        <div className="relative z-10 max-w-4xl mx-auto sapihum-fade-up">
          <Badge variant="outline" className="mb-5 text-sm px-4 py-1.5 border-foreground/20">
            Modelo por niveles
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text">
            Tu inversión en crecimiento profesional
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Tres niveles diseñados para cada etapa de tu carrera. Empieza con la comunidad,
            especialízate con herramientas avanzadas, y escala con un equipo dedicado.
          </p>
          <BillingToggle
            isAnnual={isAnnual}
            onToggle={() => setIsAnnual(!isAnnual)}
            savingsPercent={savingsPercent}
          />
        </div>
      </section>

      {/* ═══════ NIVEL 1 ═══════ */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 max-w-6xl mx-auto">
        <Card className="sapihum-card-glow overflow-hidden border-border/60" id="nivel-1-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-brand-brown/10">
                  <Users className="h-6 w-6 text-brand-brown dark:text-brand-brown" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Nivel 1 — Comunidad</CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    Comunidad, cursos y educación continua para todos
                  </CardDescription>
                </div>
              </div>
              <PriceDisplay plan={level1Plan} isAnnual={isAnnual} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-t pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Todo lo que incluye
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {level1Features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-brand-brown shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={isLoggedIn ? '/dashboard/subscription' : '/auth/register?plan=level1'}
              className="inline-block"
            >
              <Button
                size="lg"
                className="gap-2 shadow-md hover:shadow-lg transition-shadow"
                data-analytics-cta
                data-analytics-label={isLoggedIn ? 'Gestionar en mi cuenta' : 'Comenzar Nivel 1'}
                data-analytics-funnel={isLoggedIn ? 'subscription' : 'registration'}
                data-analytics-plan="level1"
              >
                {isLoggedIn ? 'Gestionar en mi cuenta' : 'Comenzar Nivel 1'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* ═══════ NIVEL 2 — ESPECIALIZACIONES ═══════ */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl mx-auto">
        <div className="mb-8 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-brand-yellow/10">
              <BookOpen className="h-5 w-5 text-brand-yellow dark:text-brand-yellow" />
            </div>
            <h2 className="text-3xl font-bold">Nivel 2 — Especialización</h2>
          </div>
          <p className="text-muted-foreground max-w-xl">
            Upgrade por especialización. Herramientas, protocolos y comunidad dedicada a tu área de expertise.
          </p>
        </div>

        <div className="space-y-6">
          {/* Active specializations */}
          {activeSpecializations.map((spec) => {
            if (!spec.plan) return null
            return (
              <Card
                key={spec.code}
                className="sapihum-card-glow border-primary/30 overflow-hidden"
                id={`spec-${spec.code}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl shrink-0 mt-0.5" role="img" aria-label={spec.name}>
                        {spec.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl">{spec.name}</CardTitle>
                          <Badge className="bg-brand-brown/15 text-brand-brown dark:text-brand-brown border-brand-brown/30 text-xs">
                            Activa
                          </Badge>
                          {spec.includesSoftware && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Zap className="h-3 w-3" /> Software incluido
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          {spec.tagline}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <PriceDisplay plan={spec.plan} isAnnual={isAnnual} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Benefits section */}
                  <div className="border-t pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      Beneficios incluidos
                    </p>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {spec.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-brand-brown shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tools section */}
                  {spec.tools.length > 0 && (
                    <div className="border-t pt-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5" />
                        Herramientas y recursos
                      </p>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {spec.tools.map((tool) => (
                          <li key={tool} className="flex items-start gap-2.5 text-sm">
                            <Sparkles className="h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                            <span>{tool}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link
                    href={
                      isLoggedIn
                        ? '/dashboard/subscription'
                        : `/auth/register?plan=level2&specialization=${spec.code}`
                    }
                    className="inline-block"
                  >
                    <Button
                      size="lg"
                      className="gap-2 shadow-md hover:shadow-lg transition-shadow"
                      data-analytics-cta
                      data-analytics-label={isLoggedIn ? 'Subir desde mi cuenta' : `Quiero ${spec.name}`}
                      data-analytics-funnel={isLoggedIn ? 'subscription' : 'registration'}
                      data-analytics-plan="level2"
                      data-analytics-specialization={spec.code}
                    >
                      {isLoggedIn ? 'Subir desde mi cuenta' : `Quiero ${spec.name}`}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}

          {/* Coming soon specializations */}
          {comingSoonSpecializations.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 mt-8">
                Próximas especializaciones
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {comingSoonSpecializations.map((spec) => (
                  <Card key={spec.code} className="border-dashed sapihum-card-glow" id={`spec-${spec.code}-soon`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl" role="img" aria-label={spec.name}>
                          {spec.icon}
                        </span>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{spec.name}</CardTitle>
                          <p className="text-xs text-muted-foreground italic truncate">{spec.tagline}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit text-xs mt-2">Próximamente</Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <WaitlistCTA
                        specializationCode={spec.code}
                        specializationName={spec.name}
                        source="landing"
                        className="w-full"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════ NIVEL 3 ═══════ */}
      {level3Visible && level3Plan && (
        <section className="w-full px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl mx-auto" id="nivel-3-section">
          <Card className="sapihum-card-glow overflow-hidden border-brand-yellow/40 bg-gradient-to-br from-brand-yellow/80 via-brand-brown/50 to-background dark:from-brand-yellow/30 dark:via-brand-brown/20 dark:to-background">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-brand-yellow/15 sapihum-glow-cta">
                    <Crown className="h-6 w-6 text-brand-yellow dark:text-brand-yellow" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-brand-yellow" />
                      Nivel 3 — Avanzado
                    </CardTitle>
                    <CardDescription className="text-sm mt-0.5">
                      Escala tu práctica con un equipo dedicado a hacerte crecer
                    </CardDescription>
                  </div>
                </div>
                <PriceDisplay plan={level3Plan} isAnnual={isAnnual} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-t border-brand-yellow/50 dark:border-brand-yellow/30 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Todo lo que incluye (además del Nivel 1 y tu especialización)
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {level3Features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Sparkles className="h-4 w-4 text-brand-yellow shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={isLoggedIn ? '/dashboard/subscription' : '/auth/login'}
                className="inline-block"
              >
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-brand-yellow to-brand-brown hover:from-brand-yellow hover:to-brand-brown text-white shadow-lg hover:shadow-xl transition-all"
                  data-analytics-cta
                  data-analytics-label={isLoggedIn ? 'Activar Nivel 3' : 'Inicia sesión para verlo'}
                  data-analytics-funnel={isLoggedIn ? 'subscription' : 'registration'}
                  data-analytics-plan="level3"
                >
                  {isLoggedIn ? 'Activar Nivel 3' : 'Inicia sesión para verlo'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══════ COMPARISON TABLE ═══════ */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-16 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Compara los niveles</h2>
          <p className="text-muted-foreground">
            Cada nivel incluye todo lo del anterior, más herramientas específicas.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm" id="comparison-table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-semibold min-w-[200px]">Característica</th>
                <th className="text-center p-4 font-semibold min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    <Users className="h-4 w-4 text-brand-brown" />
                    <span>Nivel 1</span>
                    <span className="text-xs font-normal text-muted-foreground">Comunidad</span>
                  </div>
                </th>
                <th className="text-center p-4 font-semibold min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    <BookOpen className="h-4 w-4 text-brand-yellow" />
                    <span>Nivel 2</span>
                    <span className="text-xs font-normal text-muted-foreground">Especialización</span>
                  </div>
                </th>
                <th className="text-center p-4 font-semibold min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    <Crown className="h-4 w-4 text-brand-yellow" />
                    <span>Nivel 3</span>
                    <span className="text-xs font-normal text-muted-foreground">Avanzado</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={row.label} className={`border-b ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                  <td className="p-4 font-medium">
                    {row.category && (
                      <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">
                        {row.category}
                      </span>
                    )}
                    {row.label}
                  </td>
                  <td className="text-center p-4">
                    <ComparisonCell value={row.level1} />
                  </td>
                  <td className="text-center p-4">
                    <ComparisonCell value={row.level2} />
                  </td>
                  <td className="text-center p-4">
                    <ComparisonCell value={row.level3} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══════ INFO SECTION ═══════ */}
      <section className="w-full py-16 border-t bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold mb-3">¿Cómo abrimos nuevas especializaciones?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Abrimos nuevas especializaciones según demanda real de la comunidad. La más
                solicitada en lista de espera es la siguiente en producción. Cada especialización
                incluye protocolos, herramientas y contenido diseñado específicamente para esa área.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">¿Puedo cambiar de plan?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sí. Puedes subir o bajar de nivel en cualquier momento desde tu dashboard. Los
                cambios se aplican inmediatamente y el cobro se ajusta de forma proporcional
                (prorrateado) a tu ciclo de facturación.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ─── Comparison data ─── */
type CellValue = boolean | string

interface ComparisonRow {
  category?: string
  label: string
  level1: CellValue
  level2: CellValue
  level3: CellValue
}

function ComparisonCell({ value }: { value: CellValue }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-brand-brown inline-block" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground/40 inline-block" />
    )
  }
  return <span className="text-sm">{value}</span>
}

const comparisonRows: ComparisonRow[] = [
  { category: 'Comunidad', label: 'Acceso a la comunidad', level1: true, level2: true, level3: true },
  { label: 'Educación continua', level1: true, level2: true, level3: true },
  { label: 'Sesiones en vivo y grabadas', level1: true, level2: true, level3: true },
  { label: 'Materiales psicoterapéuticos', level1: true, level2: true, level3: true },
  { label: 'Newsletter y convenios', level1: true, level2: true, level3: true },
  { category: 'Especialización', label: 'Protocolos especializados', level1: false, level2: true, level3: true },
  { label: 'Software de la especialidad', level1: false, level2: 'Según especialidad', level3: 'Según especialidad' },
  { label: 'Supervisión grupal', level1: false, level2: true, level3: true },
  { label: 'Red de derivación', level1: false, level2: true, level3: true },
  { label: 'Eventos especializados', level1: false, level2: true, level3: true },
  { category: 'Escala', label: 'Community Manager personal', level1: false, level2: false, level3: true },
  { label: 'Creación de contenido', level1: false, level2: false, level3: true },
  { label: 'Campañas en Ads (FB/IG)', level1: false, level2: false, level3: true },
  { label: 'SEO y posicionamiento local', level1: false, level2: false, level3: true },
  { label: 'Asistente personal', level1: false, level2: false, level3: true },
]

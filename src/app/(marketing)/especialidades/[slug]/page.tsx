import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { getSubscriptionPlan } from '@/lib/payments/config'
import {
  LEVEL_2_CARD_FEATURE_IDS,
  PRICING_FEATURES_BY_ID,
  PRICING_PLAN_COPY,
} from '@/lib/pricing-catalog'
import {
  getCanonicalSpecializationSlug,
  getSpecializationBySlug,
  getVisibleSpecializations,
} from '@/lib/specializations'

interface Props {
  params: Promise<{ slug: string }>
}

const CLINICAL_TOOL_FEATURE_IDS = [
  'pagina-web',
  'agenda-online',
  'plataforma-interaccion',
  'multiples-pagos',
  'dashboard-financiero',
  'transcripcion-ia',
] as const

function formatCurrency(value: number | null | undefined) {
  return `$${Number(value || 0).toLocaleString('es-MX')} MXN`
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const canonicalSlug = getCanonicalSpecializationSlug(params.slug)
  const spec = getSpecializationBySlug(canonicalSlug)
  if (!spec) return {}

  if (spec.code === 'clinica') {
    return {
      title: 'Psicología Clínica | SAPIHUM',
      description:
        'Consultorio Digital para psicología clínica: web profesional, agenda, pagos, soporte e IA para operar tu práctica con más orden.',
    }
  }

  return {
    title: `${spec.name} | SAPIHUM`,
    description: spec.description,
  }
}

export async function generateStaticParams() {
  const specializations = getVisibleSpecializations()
  return specializations.map((spec) => ({
    slug: spec.slug,
  }))
}

export default async function SpecializationPage(props: Props) {
  const params = await props.params
  const canonicalSlug = getCanonicalSpecializationSlug(params.slug)
  const spec = getSpecializationBySlug(canonicalSlug)

  if (!spec) {
    notFound()
  }

  if (canonicalSlug !== params.slug) {
    redirect(`/especialidades/${canonicalSlug}`)
  }

  const level2Plan = getSubscriptionPlan(2, spec.code)
  const isLevel2Active = !!level2Plan
  const isClinical = spec.code === 'clinica'

  const clinicalToolFeatures = CLINICAL_TOOL_FEATURE_IDS.map((id) => PRICING_FEATURES_BY_ID[id])
  const clinicalBenefitFeatures = LEVEL_2_CARD_FEATURE_IDS.map((id) => PRICING_FEATURES_BY_ID[id])

  const heroTitle = isClinical
    ? 'Consultorio Digital para Psicología Clínica'
    : spec.tagline

  const heroDescription = isClinical
    ? 'La experiencia de Nivel 2 para psicólogos clínicos que quieren digitalizar su consulta con web profesional, agenda, plataforma con pacientes, pagos, soporte e inteligencia artificial.'
    : spec.description

  const primaryCtaLabel = isClinical
    ? isLevel2Active
      ? 'Activar Consultorio Digital'
      : 'Comenzar con Nivel 1'
    : isLevel2Active
      ? 'Comenzar Especialización'
      : 'Comenzar con Nivel 1'

  const benefitsHeading = isClinical
    ? 'Todo lo que incluye tu Consultorio Digital'
    : 'El ecosistema completo para el psicólogo especialista'

  const benefitsDescription = isClinical
    ? 'Aquí ves el paquete comercial alineado a la página de precios. Incluye la base de comunidad y además las herramientas operativas que activan tu consulta clínica.'
    : `Al unirte a la especialidad de ${spec.name}, obtienes acceso no solo a software, sino a una red de apoyo clínico y formación continua focalizada.`

  const finalTitle = isClinical
    ? 'Opera tu práctica clínica con una infraestructura más completa'
    : 'Eleva tu estándar profesional hoy'

  const finalDescription = isClinical
    ? 'Activa el mismo paquete de Consultorio Digital que ya viste en precios: comunidad, operación clínica, pagos, soporte e IA en un solo flujo.'
    : 'Únete a cientos de colegas que ya gestionan su práctica y se capacitan en nuestra plataforma.'

  return (
    <div className="relative flex w-full flex-1 flex-col items-center overflow-x-hidden bg-background">
      <section className="relative flex w-full flex-col items-center overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-background px-4 py-20 text-center md:py-32">
        <div className="absolute inset-0 top-0 h-[600px] sapihum-grid-bg opacity-10" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-yellow/3 blur-[120px]" />

        <div className="relative z-10 flex max-w-4xl flex-col items-center">
          <div className="sapihum-fade-up mb-8 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-sm border border-brand-yellow/20 bg-brand-yellow/5 px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
            <span className="text-xl leading-none">{spec.icon}</span>
            {isClinical ? 'Psicología Clínica · Nivel 2' : `Especialidad: ${spec.name}`}
          </div>

          {isClinical && level2Plan && (
            <div className="sapihum-fade-up mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#c0bfbc]">
              <span className="font-semibold text-white">{PRICING_PLAN_COPY.level2.title}</span>
              <span className="h-1 w-1 rounded-full bg-[#f6ae02]" />
              <span>Desde {formatCurrency(level2Plan.monthly.amount)}/mes</span>
            </div>
          )}

          <h1
            className="sapihum-fade-up mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-7xl"
            style={{ animationDelay: '0.1s' }}
          >
            {heroTitle}
          </h1>

          <p
            className="sapihum-fade-up mb-10 max-w-3xl text-lg leading-relaxed text-neutral-400 md:text-xl"
            style={{ animationDelay: '0.2s' }}
          >
            {heroDescription}
          </p>

          <div className="sapihum-fade-up flex flex-col gap-4 sm:flex-row" style={{ animationDelay: '0.3s' }}>
            <Link href={`/auth/register?plan=${isLevel2Active ? 'level2' : 'level1'}&specialization=${spec.code}`}>
              <Button size="lg" className="h-auto max-w-full whitespace-normal px-8 py-4 text-center text-xs font-bold uppercase tracking-[0.1em]">
                {primaryCtaLabel}
              </Button>
            </Link>
            {isClinical && (
              <Link href="/precios">
                <Button size="lg" variant="outline" className="h-auto max-w-full whitespace-normal px-8 py-4 text-center text-xs font-bold uppercase tracking-[0.1em]">
                  Ver precios completos
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {isClinical ? 'Infraestructura clínica incluida' : 'Herramientas diseñadas para tu práctica'}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {isClinical
                ? 'Estas son las piezas operativas que hoy forman parte del paquete de Consultorio Digital para psicología clínica.'
                : 'Todo lo que necesitas para ejercer de forma ética, profesional y basada en evidencia.'}
            </p>
          </div>

          <div className={`grid gap-6 sapihum-stagger ${isClinical ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
            {isClinical
              ? clinicalToolFeatures.map((feature, index) => (
                  <div
                    key={feature.id}
                    className="flex flex-col rounded-2xl border bg-card p-6 text-left transition-colors hover:border-brand-yellow/30 sapihum-card-glow"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow text-xl">
                      {index % 3 === 0 ? '🌐' : index % 3 === 1 ? '🗓️' : '⚙️'}
                    </div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.details}</p>
                  </div>
                ))
              : spec.tools.map((tool, index) => (
                  <div
                    key={tool}
                    className="flex flex-col items-center rounded-2xl border bg-card p-6 text-center transition-colors hover:border-brand-yellow/30 sapihum-card-glow"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow text-xl">
                      {index % 4 === 0 ? '💻' : index % 4 === 1 ? '📊' : index % 4 === 2 ? '📋' : '🧠'}
                    </div>
                    <h3 className="font-semibold text-foreground">{tool}</h3>
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="w-full border-y bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                {isClinical ? 'Consultorio Digital' : 'Beneficios Exclusivos'}
              </p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
                {benefitsHeading}
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                {benefitsDescription}
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href={`/auth/register?plan=${isLevel2Active ? 'level2' : 'level1'}&specialization=${spec.code}`}>
                  <Button size="lg" className="h-auto max-w-full whitespace-normal px-8 py-3 text-center text-base font-semibold">
                    {isClinical ? 'Crear cuenta y activarlo' : 'Crear Cuenta Gratis'}
                  </Button>
                </Link>
                {isClinical && (
                  <Link href="/precios">
                    <Button size="lg" variant="outline" className="h-auto max-w-full whitespace-normal px-8 py-3 text-center text-base font-semibold">
                      Comparar planes
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {isClinical
                ? clinicalBenefitFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-start gap-4 rounded-xl border bg-card p-4 sapihum-card-glow">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/40 dark:text-brand-yellow">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{feature.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.details}</p>
                      </div>
                    </div>
                  ))
                : spec.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-4 rounded-xl border bg-card p-4 sapihum-card-glow">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/40 dark:text-brand-yellow">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{benefit}</span>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-full overflow-hidden bg-[#0a0a0a] py-20 text-white md:py-28">
        <div className="absolute inset-0 sapihum-grid-bg opacity-10" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">
            {finalTitle}
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-neutral-400">
            {finalDescription}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href={`/auth/register?plan=${isLevel2Active ? 'level2' : 'level1'}&specialization=${spec.code}`}>
              <Button size="lg" className="h-auto max-w-full whitespace-normal px-10 py-4 text-center text-xs font-bold uppercase tracking-[0.1em]">
                {isClinical ? 'Activar Consultorio Digital' : isLevel2Active ? `Activar Membresía ${spec.name}` : 'Unirme al Nivel 1'}
              </Button>
            </Link>
            {isClinical && (
              <Link href="/precios">
                <Button size="lg" variant="outline" className="h-auto max-w-full whitespace-normal px-10 py-4 text-center text-xs font-bold uppercase tracking-[0.1em]">
                  Revisar comparativa completa
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

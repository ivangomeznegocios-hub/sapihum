import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, BookOpenCheck, CalendarDays, CheckCircle2, GraduationCap, Layers3, Users } from 'lucide-react'
import { getPublicFormations } from '@/app/(marketing)/formaciones/actions'
import { PublicCatalogCard } from '@/components/catalog/public-catalog-card'
import { WaitlistCTA } from '@/components/specializations/waitlist-cta'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAppUrl } from '@/lib/config/app-url'
import { splitPublicCatalogEvents } from '@/lib/events/public'
import { getFormationMemberAccessMessage } from '@/lib/formations/pricing'
import { getSubscriptionPlan } from '@/lib/payments/config'
import { PRICING_PLAN_COPY } from '@/lib/pricing-catalog'
import {
  getCanonicalSpecializationSlug,
  getMarketingSpecializations,
  getSpecializationBySlug,
  type SpecializationCode,
  type SpecializationConfig,
} from '@/lib/specializations'
import { getUnifiedCatalogEvents } from '@/lib/supabase/queries/events'

interface Props {
  params: Promise<{ slug: string }>
}

type CatalogEvent = Awaited<ReturnType<typeof getUnifiedCatalogEvents>>[number]
type PublicFormation = Awaited<ReturnType<typeof getPublicFormations>>[number]

interface SpecializationSeoProfile {
  terms: string[]
  audiences: string[]
}

const appUrl = getAppUrl()

const SEO_PROFILES: Partial<Record<SpecializationCode, SpecializationSeoProfile>> = {
  clinica: {
    terms: ['psicoterapia basada en evidencia', 'evaluacion clinica', 'supervision clinica', 'consultorio digital'],
    audiences: [
      'Psicologos clinicos que quieren ordenar mejor su consulta.',
      'Terapeutas que buscan eventos, cursos y formaciones aplicadas.',
      'Profesionales que quieren pasar de membresia a una operacion mas completa.',
    ],
  },
  forense: {
    terms: ['peritaje psicologico', 'entrevista forense', 'credibilidad testimonial', 'valoracion de riesgo'],
    audiences: [
      'Psicologos que realizan o quieren realizar peritajes.',
      'Profesionales que buscan formacion aplicada al contexto juridico.',
      'Colegas que necesitan una ruta clara entre comunidad y especializacion.',
    ],
  },
  organizacional: {
    terms: ['NOM-035', 'clima laboral', 'gestion del talento', 'bienestar organizacional'],
    audiences: [
      'Psicologos que trabajan con empresas y talento humano.',
      'Consultores que buscan cursos y eventos mas aterrizados.',
      'Profesionales que quieren una ruta mas clara hacia especializacion.',
    ],
  },
  educacion: {
    terms: ['evaluacion psicopedagogica', 'orientacion educativa', 'inclusion escolar', 'necesidades educativas especiales'],
    audiences: [
      'Psicologos que trabajan con escuelas, familias e instituciones.',
      'Profesionales que buscan formacion para inclusion y orientacion.',
      'Colegas que quieren ordenar su crecimiento en esta rama.',
    ],
  },
  neuropsicologia: {
    terms: ['evaluacion cognitiva', 'rehabilitacion neuropsicologica', 'funciones ejecutivas', 'deterioro cognitivo'],
    audiences: [
      'Psicologos que trabajan con perfiles neurocognitivos.',
      'Profesionales que quieren combinar eventos cortos y rutas profundas.',
      'Colegas que necesitan una oferta mas especifica que la general.',
    ],
  },
  psicogerontologia: {
    terms: ['adulto mayor', 'demencias y deterioro cognitivo', 'estimulacion cognitiva', 'envejecimiento activo'],
    audiences: [
      'Psicologos que trabajan con adulto mayor y cuidadores.',
      'Profesionales que quieren una mezcla de comunidad y especializacion.',
      'Colegas que buscan visibilidad para esta rama de nicho.',
    ],
  },
  deportiva: {
    terms: ['rendimiento mental', 'ansiedad competitiva', 'recuperacion post lesion', 'cohesion de equipo'],
    audiences: [
      'Psicologos que trabajan con atletas, equipos o academias.',
      'Profesionales que buscan contenidos aplicados al alto rendimiento.',
      'Colegas que quieren un flujo claro entre comunidad y especialidad.',
    ],
  },
  sexologia_clinica: {
    terms: ['terapia sexual', 'terapia de pareja', 'diversidad sexual', 'salud sexual integral'],
    audiences: [
      'Psicologos que trabajan sexualidad, pareja o educacion sexual.',
      'Profesionales que quieren combinar formacion general y especifica.',
      'Colegas que buscan una pagina clara para descubrir la oferta.',
    ],
  },
}

function formatCurrency(value: number | null | undefined) {
  return `$${Number(value || 0).toLocaleString('es-MX')} MXN`
}

function formatHours(value: number | null | undefined) {
  const hours = Number(value || 0)
  if (!hours) return null
  return Number.isInteger(hours) ? `${hours} horas` : `${hours.toFixed(1)} horas`
}

function buildSpecializationPath(slug: string) {
  return `/especialidades/${slug}`
}

function getLevel2OfferName(spec: SpecializationConfig) {
  return spec.code === 'clinica' ? PRICING_PLAN_COPY.level2.title : `Nivel 2 en ${spec.name}`
}

function getSeoProfile(spec: SpecializationConfig) {
  return SEO_PROFILES[spec.code as SpecializationCode] ?? {
    terms: spec.tools.slice(0, 4),
    audiences: [
      `Profesionales que buscan crecer en ${spec.name}.`,
      'Psicologos que quieren combinar comunidad y especializacion.',
      'Colegas que buscan una sola pagina con eventos, formaciones y conversion.',
    ],
  }
}

function getSeoTitle(spec: SpecializationConfig) {
  return `${spec.name}: eventos, cursos y formacion especializada | SAPIHUM`
}

function getSeoDescription(spec: SpecializationConfig, level2Name: string, terms: string[]) {
  return (
    `Explora eventos, cursos, formaciones y membresia para ${spec.name} en SAPIHUM. ` +
    `Encuentra contenidos sobre ${terms.slice(0, 2).join(' y ')} y conoce la ruta de ${level2Name}.`
  )
}

function selectRelevantItems<T extends { specialization_code?: string | null }>(
  items: T[],
  specializationCode: string,
  limit: number
) {
  const specific = items.filter((item) => item.specialization_code === specializationCode)
  const general = items.filter((item) => !item.specialization_code)
  return [...specific, ...general].slice(0, limit)
}

function buildStructuredData(args: {
  spec: SpecializationConfig
  description: string
  events: CatalogEvent[]
  formations: PublicFormation[]
}) {
  const { spec, description, events, formations } = args
  const pageUrl = `${appUrl}${buildSpecializationPath(spec.slug)}`

  const schemas = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: getSeoTitle(spec), description, url: pageUrl },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Especialidades', item: `${appUrl}/especialidades` },
        { '@type': 'ListItem', position: 2, name: spec.name, item: pageUrl },
      ],
    },
    events.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Eventos de ${spec.name}`,
          itemListElement: events.map((event, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: event.title,
            url: `${appUrl}/eventos/${event.slug}`,
          })),
        }
      : null,
    formations.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Formaciones de ${spec.name}`,
          itemListElement: formations.map((formation, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: formation.title,
            url: `${appUrl}/formaciones/${formation.slug}`,
          })),
        }
      : null,
  ]

  return JSON.stringify(schemas.filter(Boolean)).replace(/</g, '\\u003c')
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const canonicalSlug = getCanonicalSpecializationSlug(params.slug)
  const spec = getSpecializationBySlug(canonicalSlug)
  if (!spec) return {}

  const profile = getSeoProfile(spec)
  const level2Name = getLevel2OfferName(spec)
  const description = getSeoDescription(spec, level2Name, profile.terms)
  const canonical = buildSpecializationPath(spec.slug)

  return {
    title: getSeoTitle(spec),
    description,
    keywords: [spec.name, `${spec.name} eventos`, `${spec.name} cursos`, `${spec.name} formacion`, ...profile.terms],
    alternates: { canonical },
    openGraph: { title: getSeoTitle(spec), description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title: getSeoTitle(spec), description },
  }
}

export async function generateStaticParams() {
  return getMarketingSpecializations().map((spec) => ({ slug: spec.slug }))
}

export default async function SpecializationPage(props: Props) {
  const params = await props.params
  const canonicalSlug = getCanonicalSpecializationSlug(params.slug)
  const spec = getSpecializationBySlug(canonicalSlug)

  if (!spec) notFound()
  if (canonicalSlug !== params.slug) redirect(buildSpecializationPath(canonicalSlug))

  const seoProfile = getSeoProfile(spec)
  const level1Plan = getSubscriptionPlan(1)
  const level2Plan = getSubscriptionPlan(2, spec.code)
  const level2OfferName = getLevel2OfferName(spec)
  const description = getSeoDescription(spec, level2OfferName, seoProfile.terms)

  const [allEvents, allFormations] = await Promise.all([getUnifiedCatalogEvents(), getPublicFormations()])

  const upcomingEvents = splitPublicCatalogEvents(
    allEvents.filter((event: CatalogEvent) => event.event_type !== 'on_demand')
  ).upcoming as CatalogEvent[]

  const featuredEvents = selectRelevantItems(upcomingEvents, spec.code, 6)
  const featuredFormations = selectRelevantItems(allFormations, spec.code, 4)
  const specificEventCount = upcomingEvents.filter((event) => event.specialization_code === spec.code).length
  const generalEventCount = upcomingEvents.filter((event) => !event.specialization_code).length
  const specificFormationCount = allFormations.filter((formation) => formation.specialization_code === spec.code).length

  const membershipHref = `/auth/register?plan=level1&specialization=${spec.code}`
  const level2Href = `/auth/register?plan=level2&specialization=${spec.code}`
  const structuredData = buildStructuredData({
    spec,
    description,
    events: featuredEvents,
    formations: featuredFormations,
  })

  return (
    <div className="relative flex w-full flex-1 flex-col items-center overflow-x-hidden bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-background">
        <div className="sapihum-grid-bg absolute inset-0 opacity-10" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[440px] w-[440px] -translate-x-1/2 rounded-full bg-brand-yellow/10 blur-[130px]" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-28">
          <div className="max-w-4xl space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="gap-2 border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow">
                <span className="text-base leading-none">{spec.icon}</span>
                Especialidad activa
              </Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-neutral-200">
                Eventos, cursos y formaciones
              </Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-neutral-200">
                Membresia + Nivel 2
              </Badge>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl lg:text-6xl">
                {spec.name}: eventos, cursos y formacion especializada
              </h1>
              <p className="max-w-3xl text-lg leading-relaxed text-neutral-300 md:text-xl">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {seoProfile.terms.map((term) => (
                <span
                  key={term}
                  className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-neutral-200"
                >
                  {term}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href={membershipHref}>
                <Button size="lg" className="h-auto px-8 py-4 text-xs font-bold uppercase tracking-[0.12em]">
                  Unirme a la membresia
                </Button>
              </Link>

              {level2Plan ? (
                <Link href={level2Href}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-auto px-8 py-4 text-xs font-bold uppercase tracking-[0.12em]"
                  >
                    Activar {level2OfferName}
                  </Button>
                </Link>
              ) : (
                <WaitlistCTA
                  specializationCode={spec.code}
                  specializationName={level2OfferName}
                  source="landing"
                  buttonLabel={`Quiero ${level2OfferName}`}
                  variant="outline"
                  className="h-auto px-8 py-4 text-xs font-bold uppercase tracking-[0.12em]"
                />
              )}
            </div>

            <p className="text-sm leading-relaxed text-neutral-400">
              Esta landing prioriza primero los contenidos de {spec.name} y despues suma eventos o formaciones generales
              cuando aplican a toda la comunidad.
            </p>
          </div>

          <aside className="lg:justify-self-end">
            <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-white shadow-2xl shadow-black/30 backdrop-blur-sm">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Eventos y cursos</p>
                <p className="mt-2 text-3xl font-black text-white">{specificEventCount}</p>
                <p className="mt-1 text-sm text-neutral-400">especificos de la especialidad</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Formaciones</p>
                <p className="mt-2 text-3xl font-black text-white">{specificFormationCount}</p>
                <p className="mt-1 text-sm text-neutral-400">rutas activas de esta rama</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Membresia</p>
                <p className="mt-2 text-lg font-bold text-white">
                  {level1Plan ? `Desde ${formatCurrency(level1Plan.monthly.amount)}/mes` : 'Acceso general'}
                </p>
                <p className="mt-1 text-sm text-neutral-400">Para pertenecer y entrar al ecosistema.</p>
              </div>

              <div className="rounded-2xl border border-brand-yellow/20 bg-brand-yellow/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow">{level2OfferName}</p>
                <p className="mt-2 text-lg font-bold text-white">
                  {level2Plan ? `Desde ${formatCurrency(level2Plan.monthly.amount)}/mes` : 'Activa tu interes'}
                </p>
                <p className="mt-1 text-sm text-neutral-300">
                  {level2Plan ? 'Ruta de profundidad para crecer dentro de la especialidad.' : 'Empujamos el interes aunque el precio aun no este publicado.'}
                </p>
              </div>

              <p className="text-xs leading-relaxed text-neutral-500">
                Tambien pueden aparecer {generalEventCount} eventos generales cuando sirven a toda la comunidad.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="w-full py-16 md:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">Enfoque SEO</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Una pagina que mezcla descubrimiento, catalogo y conversion
              </h2>
            </div>

            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
              En lugar de dejar la especialidad como una ficha estatica, esta landing funciona como hub. Posiciona
              busquedas de {spec.name.toLowerCase()}, distribuye trafico interno hacia eventos y formaciones, y empuja
              tanto la membresia para pertenecer como el Nivel 2 de la especialidad.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {seoProfile.terms.map((item) => (
                <div key={item} className="rounded-2xl border bg-card p-5 shadow-sm shadow-black/5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow/10 text-brand-yellow">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border bg-card p-6 shadow-sm shadow-black/5">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-brand-yellow" />
                <h3 className="text-lg font-bold">Ideal para</h3>
              </div>
              <div className="mt-5 space-y-3">
                {seoProfile.audiences.map((item) => (
                  <div key={item} className="rounded-2xl border bg-background/60 p-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border bg-card p-6 shadow-sm shadow-black/5">
              <div className="flex items-center gap-3">
                <Layers3 className="h-5 w-5 text-brand-yellow" />
                <h3 className="text-lg font-bold">Lo que se empuja aqui</h3>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border bg-background/60 p-4 text-sm text-muted-foreground">
                  Eventos y cursos de {spec.name}.
                </div>
                <div className="rounded-2xl border bg-background/60 p-4 text-sm text-muted-foreground">
                  Formaciones completas y rutas de aprendizaje.
                </div>
                <div className="rounded-2xl border bg-background/60 p-4 text-sm text-muted-foreground">
                  Membresia Nivel 1 para pertenecer y {level2OfferName} para profundizar.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-y bg-muted/30 py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">Eventos y cursos</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Lo mas relevante de {spec.name}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              Priorizamos primero los contenidos etiquetados con esta especialidad y despues completamos con eventos
              generales cuando tambien tienen sentido para tu practica.
            </p>
          </div>

          {featuredEvents.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {featuredEvents.map((event) => (
                <PublicCatalogCard key={event.id} event={event} fixedLayout />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border bg-card px-6 py-16 text-center shadow-sm shadow-black/5">
              <CalendarDays className="mx-auto mb-4 h-10 w-10 text-brand-yellow" />
              <h3 className="text-2xl font-bold text-foreground">No hay eventos publicados todavia</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Cuando publiquemos nuevos eventos, cursos o talleres de {spec.name}, apareceran aqui junto con los
                contenidos generales que apliquen a toda la comunidad.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="w-full py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">Formaciones</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Formaciones y rutas completas para {spec.name}
            </h2>
          </div>

          {featuredFormations.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {featuredFormations.map((formation) => {
                const accessMessage = getFormationMemberAccessMessage(formation)
                const totalHours = formatHours(formation.total_hours)
                const isSpecific = formation.specialization_code === spec.code

                return (
                  <article
                    key={formation.id}
                    className="flex h-full flex-col rounded-[28px] border bg-card p-6 shadow-sm shadow-black/5 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={isSpecific
                          ? 'border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow'
                          : 'border-white/10 bg-muted text-muted-foreground'}
                      >
                        {isSpecific ? spec.name : 'General'}
                      </Badge>
                      {totalHours && (
                        <Badge variant="outline" className="border-white/10 bg-muted text-muted-foreground">
                          {totalHours}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-5 flex-1 space-y-3">
                      <h3 className="text-2xl font-bold leading-tight text-foreground">{formation.title}</h3>
                      {formation.subtitle && (
                        <p className="text-base font-medium leading-relaxed text-foreground/80">{formation.subtitle}</p>
                      )}
                      {formation.description && (
                        <p className="text-sm leading-relaxed text-muted-foreground">{formation.description}</p>
                      )}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border bg-background/60 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Inversion</p>
                        <p className="mt-2 text-lg font-bold text-foreground">{formatCurrency(formation.bundle_price)}</p>
                      </div>
                      <div className="rounded-2xl border bg-background/60 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Acceso</p>
                        <p className="mt-2 text-sm font-medium text-foreground">{accessMessage.label}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {accessMessage.note || 'Disponible para compra directa y para miembros cuando aplica.'}
                      </p>
                      <Link href={`/formaciones/${formation.slug}`}>
                        <Button variant="outline" className="gap-2">
                          Ver formacion
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-[28px] border bg-card px-6 py-16 text-center shadow-sm shadow-black/5">
              <GraduationCap className="mx-auto mb-4 h-10 w-10 text-brand-yellow" />
              <h3 className="text-2xl font-bold text-foreground">Todavia no hay formaciones activas</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Cuando publiquemos nuevas rutas de {spec.name}, apareceran aqui junto con formaciones generales que
                tambien aporten a la especialidad.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="w-full border-y bg-[#050505] py-16 text-white md:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">Membresia y Nivel 2</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Dos caminos de conversion dentro de {spec.name}
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/20">
              <Badge variant="outline" className="border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow">
                Nivel 1
              </Badge>
              <h3 className="mt-5 text-3xl font-bold">{PRICING_PLAN_COPY.level1.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-neutral-300">
                Membresia para pertenecer a la comunidad, descubrir eventos generales y preparar el salto a una ruta mas
                especializada.
              </p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Desde</p>
                <p className="mt-2 text-3xl font-black text-white">
                  {level1Plan ? `${formatCurrency(level1Plan.monthly.amount)}/mes` : 'Consulta disponibilidad'}
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={membershipHref}>
                  <Button className="gap-2">
                    Unirme a la membresia
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/precios">
                  <Button variant="outline" className="gap-2">
                    Ver precios
                  </Button>
                </Link>
              </div>
            </article>

            <article className="rounded-[30px] border border-brand-yellow/20 bg-brand-yellow/10 p-7 shadow-2xl shadow-black/20">
              <Badge variant="outline" className="border-brand-yellow/30 bg-black/20 text-brand-yellow">
                Nivel 2
              </Badge>
              <h3 className="mt-5 text-3xl font-bold text-white">{level2OfferName}</h3>
              <p className="mt-3 text-base leading-relaxed text-neutral-200">
                La capa que empuja mejor la especialidad: mas foco, mas oferta y una propuesta mas clara para quienes
                quieren profundizar dentro de {spec.name}.
              </p>
              <div className="mt-6 rounded-2xl border border-brand-yellow/20 bg-black/20 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-yellow">Estado actual</p>
                <p className="mt-2 text-3xl font-black text-white">
                  {level2Plan ? `${formatCurrency(level2Plan.monthly.amount)}/mes` : 'Lista prioritaria'}
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {level2Plan ? (
                  <Link href={level2Href}>
                    <Button className="gap-2 bg-black text-white hover:bg-black/90">
                      Activar {level2OfferName}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <WaitlistCTA
                    specializationCode={spec.code}
                    specializationName={level2OfferName}
                    source="landing"
                    buttonLabel={`Quiero ${level2OfferName}`}
                    className="bg-black text-white hover:bg-black/90"
                  />
                )}
                <Link href="/precios">
                  <Button variant="outline" className="gap-2 border-white/15 bg-black/10 text-white hover:bg-black/20">
                    Comparar planes
                  </Button>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="relative w-full overflow-hidden bg-[#0a0a0a] py-16 text-white md:py-20">
        <div className="sapihum-grid-bg absolute inset-0 opacity-10" />
        <div className="relative mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            {spec.name}, comunidad, eventos y formaciones en un solo flujo
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-neutral-400">
            Entra por membresia para pertenecer, descubre contenidos de la especialidad y escala hacia {level2OfferName}
            cuando quieras una capa mas profunda.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={membershipHref}>
              <Button size="lg" className="gap-2">
                Crear cuenta y entrar por membresia
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {level2Plan ? (
              <Link href={level2Href}>
                <Button size="lg" variant="outline" className="gap-2">
                  Activar {level2OfferName}
                </Button>
              </Link>
            ) : (
              <WaitlistCTA
                specializationCode={spec.code}
                specializationName={level2OfferName}
                source="landing"
                buttonLabel={`Recibir aviso de ${level2OfferName}`}
                variant="outline"
                className="text-xs font-bold uppercase tracking-[0.12em]"
              />
            )}
          </div>

          <div className="mt-10 grid gap-4 text-left md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <Users className="mb-3 h-5 w-5 text-brand-yellow" />
              <h3 className="font-bold">Membresia</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">Para pertenecer y empezar a moverte dentro de la comunidad.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <CalendarDays className="mb-3 h-5 w-5 text-brand-yellow" />
              <h3 className="font-bold">Eventos y cursos</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">Para captar intencion de busqueda y llevarla a consumo real de catalogo.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <BookOpenCheck className="mb-3 h-5 w-5 text-brand-yellow" />
              <h3 className="font-bold">{level2OfferName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">Para profundizar cuando ya quieres una ruta mas seria dentro de la especialidad.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

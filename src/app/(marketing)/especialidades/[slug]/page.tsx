import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  getCanonicalSpecializationSlug,
  getSpecializationBySlug,
  getVisibleSpecializations,
} from '@/lib/specializations'
import { Metadata } from 'next'
import { getSubscriptionPlan } from '@/lib/payments/config'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const canonicalSlug = getCanonicalSpecializationSlug(params.slug)
  const spec = getSpecializationBySlug(canonicalSlug)
  if (!spec) return {}

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

  return (
    <div className="relative flex flex-1 w-full flex-col items-center overflow-x-hidden bg-background">
      {/* Hero Section */}
      <section className="relative flex w-full flex-col items-center overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-background px-4 py-20 text-center md:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 top-0 h-[600px] sapihum-grid-bg opacity-10" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-yellow/3 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl flex flex-col items-center">
          <div className="sapihum-fade-up mb-8 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-sm border border-brand-yellow/20 bg-brand-yellow/5 px-4 py-1.5 text-center text-[10px] font-bold text-brand-yellow uppercase tracking-[0.2em]">
            <span className="text-xl leading-none">{spec.icon}</span>
            Especialidad: {spec.name}
          </div>
          
          <h1 className="sapihum-fade-up text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1] text-white" style={{ animationDelay: '0.1s' }}>
            {spec.tagline}
          </h1>
          
          <p className="sapihum-fade-up text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            {spec.description}
          </p>
          
          <div className="sapihum-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link href={`/auth/register?plan=${isLevel2Active ? 'level2' : 'level1'}&specialization=${spec.code}`}>
              <Button size="lg" className="h-auto max-w-full whitespace-normal px-8 py-4 text-center font-bold uppercase text-xs tracking-[0.1em]">
                {isLevel2Active ? 'Comenzar Especialización' : 'Comenzar con Nivel 1'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tools & Features Grid */}
      <section className="w-full py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Herramientas diseñadas para tu práctica
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para ejercer de forma ética, profesional y basada en evidencia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sapihum-stagger">
            {spec.tools.map((tool, index) => (
              <div key={tool} className="flex flex-col p-6 rounded-2xl border bg-card hover:border-brand-yellow/30 transition-colors sapihum-card-glow text-center items-center">
                <div className="h-12 w-12 rounded-xl bg-brand-yellow dark:bg-brand-yellow/30 text-brand-yellow dark:text-brand-yellow flex items-center justify-center mb-4 text-xl">
                  {/* Pseudo-icon based on index or just a check */}
                  {index % 4 === 0 ? '💻' : index % 4 === 1 ? '📊' : index % 4 === 2 ? '📋' : '🧠'}
                </div>
                <h3 className="font-semibold text-foreground">{tool}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits List */}
      <section className="w-full py-24 bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[10px] font-bold text-brand-yellow uppercase tracking-[0.2em] mb-3">
                Beneficios Exclusivos
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                El ecosistema completo para el psicólogo especialista
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Al unirte a la especialidad de {spec.name}, obtienes acceso no solo a software, sino a una red de apoyo clínico y formación continua focalizada.
              </p>
              
              <Link href={`/auth/register?plan=${isLevel2Active ? 'level2' : 'level1'}&specialization=${spec.code}`}>
                <Button size="lg" className="h-auto max-w-full whitespace-normal px-8 py-3 text-center text-base font-semibold">
                  Crear Cuenta Gratis
                </Button>
              </Link>
            </div>

            <div className="grid gap-4">
              {spec.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-4 p-4 rounded-xl border bg-card sapihum-card-glow">
                  <div className="mt-1 h-6 w-6 rounded-full bg-brand-yellow dark:bg-brand-yellow/40 text-brand-yellow dark:text-brand-yellow flex items-center justify-center shrink-0">
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

      {/* Pricing / Final CTA */}
      <section className="w-full py-20 md:py-28 bg-[#0a0a0a] text-white relative overflow-hidden">
        <div className="absolute inset-0 sapihum-grid-bg opacity-10" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Eleva tu estándar profesional hoy
          </h2>
          <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
            Únete a cientos de colegas que ya gestionan su práctica y se capacitan en nuestra plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/auth/register?plan=${isLevel2Active ? 'level2' : 'level1'}&specialization=${spec.code}`}>
              <Button size="lg" className="h-auto max-w-full whitespace-normal px-10 py-4 text-center font-bold uppercase text-xs tracking-[0.1em]">
                {isLevel2Active ? `Activar Membresía ${spec.name}` : 'Unirme al Nivel 1'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSpecializationBySlug, getVisibleSpecializations } from '@/lib/specializations'
import { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const spec = getSpecializationBySlug(params.slug)
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
  const spec = getSpecializationBySlug(params.slug)

  if (!spec) {
    notFound()
  }

  return (
    <div className="flex flex-col items-center flex-1 w-full bg-background relative">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-gradient-to-b from-[#0A1628] to-background">
        {/* Background effects */}
        <div className="absolute inset-0 top-0 h-[600px] sapihum-grid-bg opacity-30" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl flex flex-col items-center">
          <div className="sapihum-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-4 py-1.5 text-sm font-semibold text-teal-300">
            <span className="text-xl leading-none">{spec.icon}</span>
            Especialidad: {spec.name}
          </div>
          
          <h1 className="sapihum-fade-up text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1] text-white" style={{ animationDelay: '0.1s' }}>
            {spec.tagline}
          </h1>
          
          <p className="sapihum-fade-up text-lg md:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            {spec.description}
          </p>
          
          <div className="sapihum-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link href={`/auth/register?plan=level2&specialization=${spec.code}`}>
              <Button size="lg" className="h-14 px-8 text-base shadow-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white border-0 font-bold sapihum-glow-cta">
                Comenzar Especialización
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
              <div key={tool} className="flex flex-col p-6 rounded-2xl border bg-card hover:border-teal-500/30 transition-colors sapihum-card-glow text-center items-center">
                <div className="h-12 w-12 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 text-xl">
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
              <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-3">
                Beneficios Exclusivos
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                El ecosistema completo para el psicólogo especialista
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Al unirte a la especialidad de {spec.name}, obtienes acceso no solo a software, sino a una red de apoyo clínico y formación continua focalizada.
              </p>
              
              <Link href={`/auth/register?plan=level2&specialization=${spec.code}`}>
                <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                  Crear Cuenta Gratis
                </Button>
              </Link>
            </div>

            <div className="grid gap-4">
              {spec.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-4 p-4 rounded-xl border bg-card sapihum-card-glow">
                  <div className="mt-1 h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
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
      <section className="w-full py-20 md:py-28 bg-[#0A1628] text-white relative overflow-hidden">
        <div className="absolute inset-0 sapihum-grid-bg opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Eleva tu estándar profesional hoy
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Únete a cientos de colegas que ya gestionan su práctica y se capacitan en nuestra plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/auth/register?plan=level2&specialization=${spec.code}`}>
              <Button size="lg" className="h-14 px-10 text-base shadow-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white border-0 font-bold sapihum-glow-cta">
                Activar Membresía {spec.name}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

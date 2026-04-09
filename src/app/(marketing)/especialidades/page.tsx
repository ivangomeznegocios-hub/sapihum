import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getMarketingSpecializations } from '@/lib/specializations'

const SPECIALIZATIONS = getMarketingSpecializations()
const SPECIALIZATION_COUNT = SPECIALIZATIONS.length

export const metadata = {
  title: 'Especialidades | SAPIHUM — Psicología Avanzada e Investigación Humana',
  description: '8 áreas activas de especialización con formación, herramientas y comunidad profesional para psicólogos.',
}

export default function EspecialidadesIndexPage() {
  const specializations = SPECIALIZATIONS

  return (
    <div className="flex flex-col items-center flex-1 w-full">
      {/* Hero */}
      <section className="relative w-full py-20 md:py-28 overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 sapihum-grid-bg opacity-10" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-yellow/3 blur-[120px]" />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] font-bold text-brand-yellow uppercase tracking-[0.2em] mb-4">
            {SPECIALIZATION_COUNT} áreas activas de especialización
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Encuentra tu{' '}
            <span className="font-serif italic font-normal text-[#c0bfbc]">
              especialización
            </span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Cada especialidad incluye formación continua, herramientas especializadas y una comunidad de profesionales enfocados en tu misma área.
          </p>
        </div>
      </section>

      {/* Specializations Grid */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sapihum-stagger">
          {specializations.map((spec) => (
            <Link
              key={spec.code}
              href={`/especialidades/${spec.slug}`}
              className="group relative rounded-2xl border bg-card p-7 sapihum-card-glow overflow-hidden"
            >
              {/* Left accent bar on hover */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-brand-yellow opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="text-3xl mb-5 bg-brand-yellow/5 w-14 h-14 rounded-sm flex items-center justify-center">
                {spec.icon}
              </div>

              <h2 className="text-lg font-bold mb-2 group-hover:text-brand-yellow transition-colors">
                {spec.name}
              </h2>

              <p className="text-xs text-brand-yellow font-medium mb-3 uppercase tracking-wider">
                {spec.tagline}
              </p>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {spec.description}
              </p>

              {/* Tools preview */}
              <div className="space-y-1.5 mb-5">
                {spec.tools.slice(0, 3).map((tool) => (
                  <div key={tool} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-brand-yellow shrink-0" />
                    {tool}
                  </div>
                ))}
                {spec.tools.length > 3 && (
                  <div className="text-xs text-muted-foreground/60">
                    +{spec.tools.length - 3} herramientas más
                  </div>
                )}
              </div>

              <div className="text-[10px] font-bold text-brand-yellow uppercase tracking-[0.15em] flex items-center">
                Explorar especialidad <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 border-t bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-3">¿No encuentras tu área de especialización?</h3>
          <p className="text-muted-foreground mb-6">
            SAPIHUM está en constante expansión. Contáctanos si tu rama de la psicología aún no está representada.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="h-12 px-8 font-bold uppercase text-xs tracking-[0.1em]">
              Crear mi cuenta
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

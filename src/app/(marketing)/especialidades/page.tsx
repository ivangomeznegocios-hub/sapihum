import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getMarketingSpecializations } from '@/lib/specializations'

const SPECIALIZATIONS = getMarketingSpecializations()
const SPECIALIZATION_COUNT = SPECIALIZATIONS.length

export const metadata = {
  title: 'Especialidades de psicologia: eventos, cursos y Nivel 2 | SAPIHUM',
  description: 'Explora 8 especialidades de psicologia con eventos, cursos, formaciones, membresia y rutas de Nivel 2 en SAPIHUM.',
}

export default function EspecialidadesIndexPage() {
  const specializations = SPECIALIZATIONS

  return (
    <div className="flex flex-1 w-full flex-col items-center">
      <section className="relative w-full overflow-hidden bg-[#0a0a0a] py-20 md:py-28">
        <div className="absolute inset-0 sapihum-grid-bg opacity-10" />
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-yellow/3 blur-[120px]" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
            {SPECIALIZATION_COUNT} areas activas de especializacion
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Especialidades con{' '}
            <span className="font-serif font-normal italic text-[#c0bfbc]">
              eventos, cursos y Nivel 2
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            Encuentra la rama que mejor se ajusta a tu práctica profesional. Cada especialidad ofrece eventos, cursos, formaciones y una ruta de Nivel 2 para quienes buscan mayor profundidad.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="grid grid-cols-1 gap-6 sapihum-stagger sm:grid-cols-2 lg:grid-cols-3">
          {specializations.map((spec) => (
            <Link
              key={spec.code}
              href={`/especialidades/${spec.slug}`}
              className="group relative overflow-hidden rounded-2xl border bg-card p-7 sapihum-card-glow"
            >
              <div className="absolute left-0 top-0 bottom-0 w-px bg-brand-yellow opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-sm bg-brand-yellow/5 text-3xl">
                {spec.icon}
              </div>

              <h2 className="mb-2 text-lg font-bold transition-colors group-hover:text-brand-yellow">
                {spec.name}
              </h2>

              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-brand-yellow">
                {spec.tagline}
              </p>

              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                {spec.description}
              </p>

              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Eventos
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Formaciones
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Nivel 2
                </span>
              </div>

              <div className="mb-5 space-y-1.5">
                {spec.tools.slice(0, 3).map((tool) => (
                  <div key={tool} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-brand-yellow" />
                    {tool}
                  </div>
                ))}
                {spec.tools.length > 3 && (
                  <div className="text-xs text-muted-foreground/60">
                    +{spec.tools.length - 3} herramientas mas
                  </div>
                )}
              </div>

              <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.15em] text-brand-yellow">
                Explorar especialidad <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="w-full border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h3 className="mb-3 text-2xl font-bold">Membresia para entrar. Nivel 2 para profundizar.</h3>
          <p className="mb-6 text-muted-foreground">
            Revisa cada especialidad para ver sus eventos, cursos y formaciones. Cuando estes listo, entra por membresia o explora la ruta de Nivel 2 de la rama que mas te interese.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/precios">
              <Button size="lg" className="h-12 px-8 text-xs font-bold uppercase tracking-[0.1em]">
                Ver membresia y planes
              </Button>
            </Link>
            <Link href="/eventos">
              <Button size="lg" variant="outline" className="h-12 px-8 text-xs font-bold uppercase tracking-[0.1em]">
                Explorar eventos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

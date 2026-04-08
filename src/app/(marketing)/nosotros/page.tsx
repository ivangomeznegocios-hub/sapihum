import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Nosotros | SAPIHUM — Psicología Avanzada e Investigación Humana',
  description: 'Conoce la historia, misión y el equipo detrás de SAPIHUM, la plataforma integral para profesionales de la psicología.',
}

export default function NosotrosPage() {
  return (
    <div className="flex flex-col items-center flex-1 w-full relative bg-background">
      {/* Hero */}
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-[#0a0a0a] text-white relative overflow-hidden">
         <div className="absolute inset-0 sapihum-grid-bg opacity-20" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-yellow/3 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl flex flex-col items-center">
          <div className="sapihum-fade-up mb-8 inline-flex items-center gap-2 rounded-sm border border-brand-yellow/20 bg-brand-yellow/5 px-4 py-1.5 text-[10px] font-bold text-brand-yellow uppercase tracking-[0.2em]">
            Nuestra Historia
          </div>
          <h1 className="sapihum-fade-up text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight" style={{ animationDelay: '0.1s' }}>
            De Comunidad a <br className="hidden sm:inline" />
              <span className="font-serif italic font-normal text-[#c0bfbc]">
                Ecosistema Profesional
              </span>
          </h1>
          <p className="sapihum-fade-up text-lg md:text-xl text-neutral-400 max-w-3xl mb-10 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Nacimos como una simple comunidad de psicólogos buscando compartir recursos. Hoy somos SAPIHUM, la infraestructura clínica, académica y de investigación más completa para el profesional de salud mental en habla hispana.
          </p>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="w-full py-20 md:py-28 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <div className="p-8 md:p-12 rounded-3xl border bg-card sapihum-card-glow relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-9xl text-brand-yellow/5 select-none font-serif">&ldquo;</div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow mb-4">Misión</h2>
            <p className="text-xl md:text-2xl font-medium leading-relaxed">
              Dignificar la práctica psicológica dotando a los profesionales de herramientas tecnológicas de primer nivel, formación basada en evidencia empírica y respaldada por investigación rigurosa.
            </p>
          </div>

          <div className="p-8 md:p-12 rounded-3xl border bg-card sapihum-card-glow relative overflow-hidden">
             <div className="absolute -right-10 -top-10 text-9xl text-brand-yellow/5 select-none font-serif">&ldquo;</div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow mb-4">Visión</h2>
            <p className="text-xl md:text-2xl font-medium leading-relaxed">
              Convertirnos en el estándar de oro (Gold Standard) operativo, académico e investigativo para el profesional de la psicología y ciencias del comportamiento.
            </p>
          </div>
        </div>
      </section>

      {/* Team / Leadership Placeholder */}
      <section className="w-full py-20 bg-muted/30 border-y px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Liderazgo Académico y Científico</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
            SAPIHUM es guiado por un consejo de especialistas dedicados a elevar el nivel de la práctica clínica.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sapihum-stagger">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900 border-4 border-background shadow-xl mb-4" />
                <h3 className="font-bold text-lg">Dr/Dra. Investigador {i}</h3>
                <p className="text-brand-yellow dark:text-brand-yellow text-sm font-medium">Director Científico</p>
                <p className="text-muted-foreground text-sm mt-3 max-w-xs text-center">Especialista en desarrollo de proyectos de la división.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Link to Manifesto */}
      <section className="w-full py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Nuestros Principios No Negociables</h2>
          <p className="text-lg text-muted-foreground mb-8">
            La psicología no es solo una ciencia empírica, es una responsabilidad ética monumental. Descubre los pilares que rigen todo lo que construimos en SAPIHUM.
          </p>
          <Link href="/manifiesto">
            <Button size="lg" className="h-14 px-8 font-bold uppercase text-xs tracking-[0.1em]">
              Leer el Manifiesto SAPIHUM
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

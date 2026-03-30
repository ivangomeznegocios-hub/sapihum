import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Investigación | SAPIHUM — Psicología Avanzada e Investigación Humana',
  description: 'Proyectos de investigación activa, publicaciones y alianzas institucionales en SAPIHUM.',
}

export default function InvestigacionPage() {
  return (
    <div className="flex flex-col items-center flex-1 w-full bg-background relative">
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] text-white overflow-hidden relative">
        <div className="absolute inset-0 sapihum-grid-bg opacity-30" />
        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-brand-yellow/10 blur-[150px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl flex flex-col items-center">
          <div className="sapihum-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/40 px-4 py-1.5 text-sm font-semibold text-brand-yellow">
            🔬 Centro de Investigación SAPIHUM
          </div>
          <h1 className="sapihum-fade-up text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight text-white" style={{ animationDelay: '0.1s' }}>
            Generando ciencia, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-brand-brown">
              transformando la práctica.
            </span>
          </h1>
          <p className="sapihum-fade-up text-lg md:text-xl text-neutral-400 max-w-3xl mb-10 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Nuestra comunidad no solo consume ciencia, la crea. Facilitamos el puente entre la práctica clínica privada y la investigación académica mediante el análisis ético y anonimizado de datos a gran escala.
          </p>
        </div>
      </section>

      {/* Main Focus / Lines */}
      <section className="w-full py-20 md:py-28 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-foreground">El poder de la Red de Práctica Basada en Evidencia</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              SAPIHUM funciona como la primera PBRN (Practice-Based Research Network) digital en la región. Al agrupar a cientos de clínicos independientes bajo una misma taxonomía y controles de calidad, logramos generar evidencia empírica con validez ecológica.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Todos los datos están alineados estrictamente con LFPDPPP y anonimizados desde su origen.
            </p>
            <Link href="/auth/register">
              <Button className="mt-4 bg-gradient-to-r from-brand-yellow to-brand-dark text-white shadow-lg">
                Quiero participar en investigaciones
              </Button>
            </Link>
          </div>
          
          <div className="space-y-6 sapihum-stagger">
            {[
              { title: "Eficacia de Teleterapia", desc: "Estudio longitudinal sobre la alianza terapéutica en medios digitales vs. presenciales en trastornos de ansiedad." },
              { title: "Adaptación Psicométrica", desc: "Validación y estratificación por población latinoamericana de escalas clínicas de uso abierto." },
              { title: "Modelos Predictivos IA", desc: "Uso de LLMs para sugerir diagnósticos diferenciales basados en síntomas reportados (en fase de revisión ética)." }
            ].map((linea, i) => (
              <div key={linea.title} className="p-6 rounded-2xl border bg-card sapihum-card-glow text-left">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow dark:bg-brand-yellow/40 text-brand-yellow dark:text-brand-yellow font-bold text-sm">
                    {i+1}
                  </span>
                  <h3 className="text-xl font-bold">{linea.title}</h3>
                </div>
                <p className="text-muted-foreground ml-11">{linea.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call for papers / Institutions */}
      <section className="w-full py-24 bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Colaboración Institucional</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            SAPIHUM colabora activamente con universidades, centros de investigación y hospitales. Ofrecemos acceso a datos anonimizados para investigadores principales (PI) que cumplan con nuestro comité de ética y bioseguridad.
          </p>
          <Button variant="outline" size="lg" className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow">
            Solicitar acceso para investigadores principales
          </Button>
        </div>
      </section>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Manifiesto | SAPIHUM — Psicología Avanzada e Investigación Humana',
  description: 'Los principios éticos y científicos que rigen a SAPIHUM y a nuestra comunidad de profesionales.',
}

const PRINCIPLES = [
  {
    title: "1. Basado en Evidencia, No en Opiniones",
    description: "Rechazamos la seudociencia. Cada protocolo, herramienta y curso en SAPIHUM está avalado por literatura científica verificable y el consenso empírico de la psicología moderna."
  },
  {
    title: "2. La Ética Clínico-Legal No Es Opcional",
    description: "Cumplimos las normas no por miedo, sino por respeto al paciente. NOM-004, NOM-024, LFPDPPP, HIPAA, GDPR — nuestra infraestructura técnica protege tu responsabilidad legal y el sigilo clínico más absoluto."
  },
  {
    title: "3. La Comunidad Multiplica",
    description: "El llanero solitario se estanca. El profesional clínico que pertenece a una red de práctica estructurada diagnostica mejor, sufre menos burnout y eleva los estándares del gremio."
  },
  {
    title: "4. Generar Ciencia, No Solo Consumirla",
    description: "Una práctica avanzada requiere de PBRNs (Practice-Based Research Networks). Usamos la agregación estadística anonimizada para devolverle al gremio datos de validación ecológica."
  },
  {
    title: "5. Herramientas al Servicio del Profesional, No al Revés",
    description: "La tecnología clínica, desde el expediente electrónico hasta los análisis por IA, debe reducir el trabajo friccional y aumentar el tiempo que pasas frente al paciente, no convertirse en un obstáculo administrativo."
  }
]

export default function ManifiestoPage() {
  return (
    <div className="flex flex-col items-center flex-1 w-full relative bg-background">
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-[#0A1628] text-white relative overflow-hidden">
         <div className="absolute inset-0 sapihum-grid-bg opacity-30" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[150px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl flex flex-col items-center">
          <div className="sapihum-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-4 py-1.5 text-sm font-semibold text-amber-300">
            Nuestros Pilares
          </div>
          <h1 className="sapihum-fade-up text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight" style={{ animationDelay: '0.1s' }}>
            El Manifiesto SAPIHUM
          </h1>
          <p className="sapihum-fade-up text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed" style={{ animationDelay: '0.2s' }}>
            En un mundo lleno de intrusismo y gurús sin respaldo, declaramos nuestra lealtad absoluta al rigor metodológico, la evidencia empírica y la empatía científica.
          </p>
        </div>
      </section>

      <section className="w-full py-20 md:py-28 px-4 max-w-4xl mx-auto">
        <div className="space-y-12 sapihum-stagger">
          {PRINCIPLES.map((principio, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-6 items-start">
               <div className="text-5xl font-bold text-amber-500/30 font-serif leading-none mt-1">
                 0{i + 1}
               </div>
               <div>
                  <h3 className="text-2xl font-bold md:text-3xl mb-4 text-foreground">{principio.title}</h3>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                    {principio.description}
                  </p>
               </div>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full py-24 bg-gradient-to-br from-[#0A1628] to-[#0A1628] text-center text-white relative">
        <div className="absolute inset-0 sapihum-grid-bg opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Si compartes estos valores, estás en casa.</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            SAPIHUM es la trinchera de los profesionales que se toman el cuidado mental humano con el mayor nivel de responsabilidad posible.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="h-14 px-8 text-base bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg sapihum-glow-cta border-0">
              Unirse al Ecosistema
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

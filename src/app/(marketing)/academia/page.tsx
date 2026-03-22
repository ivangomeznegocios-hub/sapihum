import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Academia | SAPIHUM — Psicología Avanzada e Investigación Humana',
  description: 'Formación continua con respaldo científico. Cursos, certificaciones, eventos y supervisión clínica para profesionales de la psicología.',
}

const CATEGORIES = [
  {
    icon: "🎓",
    title: "Cursos y Diplomados",
    description: "Programas diseñados por especialistas en ejercicio. Desde fundamentos hasta especializaciones avanzadas.",
    tag: "Asincrónico",
    color: "from-teal-500 to-emerald-500",
    colorText: "text-teal-500",
    borderColor: "border-t-teal-500"
  },
  {
    icon: "📜",
    title: "Certificaciones",
    description: "Acredita tu competencia profesional con certificaciones avaladas por instituciones reconocidas y exámenes rigurosos.",
    tag: "Acreditado",
    color: "from-amber-500 to-orange-500",
    colorText: "text-amber-500",
    borderColor: "border-t-amber-500"
  },
  {
    icon: "🎙",
    title: "Eventos y Webinars",
    description: "Conferencias magistrales, mesas de discusión y networking con los referentes de la psicología en habla hispana.",
    tag: "En vivo",
    color: "from-purple-500 to-violet-500",
    colorText: "text-purple-500",
    borderColor: "border-t-purple-500"
  },
  {
    icon: "🫂",
    title: "Supervisión Clínica",
    description: "Sesiones grupales de discusión de casos clínicos guiadas por expertos en tu área de especialización.",
    tag: "Participativo",
    color: "from-blue-500 to-cyan-500",
    colorText: "text-blue-500",
    borderColor: "border-t-blue-500"
  }
]

export default function AcademiaPage() {
  return (
    <div className="flex flex-col items-center flex-1 w-full relative bg-background">
      {/* Hero */}
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-gradient-to-b from-[#0A1628] to-background overflow-hidden relative">
        <div className="absolute inset-0 sapihum-grid-bg opacity-30" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl flex flex-col items-center">
          <div className="sapihum-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-4 py-1.5 text-sm font-semibold text-teal-300">
            📚 Academia SAPIHUM
          </div>
          
          <h1 className="sapihum-fade-up text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight text-white" style={{ animationDelay: '0.1s' }}>
            Formación continua con <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              respaldo científico
            </span>
          </h1>
          
          <p className="sapihum-fade-up text-lg md:text-xl text-slate-300 max-w-3xl mb-10 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Actualiza tu práctica clínica con programas diseñados e impartidos por referentes en su campo. 
            El conocimiento de la academia, llevado directamente a tu consultorio.
          </p>

          <div className="sapihum-fade-up flex flex-col sm:flex-row gap-4 w-full sm:w-auto" style={{ animationDelay: '0.3s' }}>
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-8 text-base shadow-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold border-0 sapihum-glow-cta">
                Unirse a SAPIHUM
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="w-full py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Aprende a tu ritmo y en tu formato</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Múltiples vías de aprendizaje continuo incluidas en los niveles de membresía.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sapihum-stagger">
          {CATEGORIES.map((cat) => (
            <div key={cat.title} className={`group flex flex-col md:flex-row gap-6 p-8 rounded-2xl border bg-card sapihum-card-glow border-t-4 ${cat.borderColor}`}>
              <div className={`shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br ${cat.color} opacity-90 flex items-center justify-center text-3xl font-bold text-white shadow-lg`}>
                {cat.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-2xl font-bold transition-colors group-hover:${cat.colorText}`}>{cat.title}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-1 rounded-sm">
                    {cat.tag}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {cat.description}
                </p>
                <div className="font-semibold text-sm flex items-center cursor-pointer transition-colors group-hover:text-foreground">
                  Explorar catálogo <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Teaser/Callout for Included Level 1/2 feature */}
      <section className="w-full py-20 bg-muted/30 border-y px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#0A1628] to-[#0A1628] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 sapihum-grid-bg opacity-30" />
          <div className="relative z-10 flex flex-col items-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">La Academia está incluida en tu membresía</h3>
            <p className="text-slate-300 md:text-lg mb-8 max-w-2xl">
              Al suscribirte a cualquier plan de SAPIHUM (Nivel 1 o 2), obtienes acceso inmediato al catálogo base de cursos, eventos en vivo y comunidad de aprendizaje sin costo extra.
            </p>
            <Link href="/precios">
              <Button size="lg" className="h-12 px-8 text-base bg-white text-[#0A1628] hover:bg-slate-100 border-0 font-bold">
                Ver Planes y Precios
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

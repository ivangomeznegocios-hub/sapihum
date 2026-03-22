import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Software para Psicología Forense | Comunidad de Psicología",
  description: "Custodia de evidencia, trazabilidad inalterable de reportes periciales y firma electrónica. La única plataforma diseñada para psicología forense.",
}

const FORENSIC_FEATURES = [
  {
    title: "Trazabilidad Inalterable",
    description: "Cada cambio en un archivo o reporte guarda un registro exacto de hora y usuario (Audit Trail), protegiéndote en auditorías y citatorios legales.",
    icon: "⚖️"
  },
  {
    title: "Custodia de Evidencias",
    description: "Sube audios, fotografías, y escaneos de pruebas psicológicas a un vault encriptado con los estándares más estrictos de HIPAA y LFPDPPP.",
    icon: "🔐"
  },
  {
    title: "Plantillas de Dictamen",
    description: "Crea y reutiliza plantillas estandarizadas para tus reportes periciales, agilizando el proceso de redacción sin perder rigor científico.",
    icon: "📑"
  }
]

export default function ForensicPsychologyPage() {
  return (
    <div className="flex flex-col items-center flex-1 w-full bg-background relative">
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <div className="max-w-3xl flex flex-col items-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-sm font-semibold text-slate-300">
              Especialidad: Psicología Forense
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Rigor legal, científico y <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                tecnológico.
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
              En tu campo, un error documental cuesta el caso. Trabaja con un sistema blindado diseñado para soportar el escrutinio pericial y judicial.
            </p>
            <div className="flex gap-4">
              <Link href="/precios">
                <Button size="lg" className="h-14 px-8 text-base bg-teal-500 hover:bg-teal-600 text-white border-0">
                  Unirme a lista de espera
                </Button>
              </Link>
            </div>
        </div>
      </section>

      <section className="w-full py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">La seguridad que tu trabajo exige</h2>
            <p className="text-lg text-muted-foreground">Tu responsabilidad legal es mayor. Te brindamos la infraestructura para que cada reporte pericial sea defendible.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FORENSIC_FEATURES.map((feature) => (
              <div key={feature.title} className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-5xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-24 bg-slate-50 dark:bg-slate-900 border-y">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">No pongas en riesgo tu licencia</h2>
          <p className="text-xl text-muted-foreground mb-10">Usa tecnología construida bajo lineamientos de cumplimiento normativo estricto.</p>
          <Link href="/auth/register">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">Crear Cuenta (14 días gratis)</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Software para Psicología del Adulto Mayor | Comunidad de Psicología",
  description: "Valoraciones cognitivas seriadas, portal para cuidadores primarios y control preciso de comorbilidades. La herramienta ideal para gerontólogos.",
}

const ELDERLY_FEATURES = [
  {
    title: "Gráficos de Evolución Cognitiva",
    description: "Registra los resultados de pruebas como el MMSE o MoCA y visualiza automáticamente curvas de declive o mantenimiento cognitivo a través del tiempo.",
    icon: "📈"
  },
  {
    title: "Portal de Cuidadores Profesionales",
    description: "Permite accesos limitados (Solo Lectura) a enfermeros, familiares o asilos para que vean rutinas conductuales e instrucciones de crisis reales.",
    icon: "🤝"
  },
  {
    title: "Control de Comorbilidades",
    description: "Tu paciente probablemente ve a 4 especialistas más. Mantén un registro central de todos los fármacos recetados por psiquiatras o internistas para prever efectos adversos.",
    icon: "💊"
  }
]

export default function ElderlyPsychologyPage() {
  return (
    <div className="flex flex-col items-center flex-1 w-full bg-background relative">
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <div className="max-w-3xl flex flex-col items-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Especialidad: Psicología del Adulto Mayor (Gerontopsicología)
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Acompañamiento clínico <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                basado en la evolución.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Monitorea el status cognitivo y apoya de forma integral a la red de cuidadores primarios usando herramientas tecnológicas compasivas.
            </p>
            <div className="flex gap-4">
              <Link href="/precios">
                <Button size="lg" className="h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20">
                  Unirme a lista de espera
                </Button>
              </Link>
            </div>
        </div>
      </section>

      <section className="w-full py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Diseñado para casos longitudinales y crónicos</h2>
            <p className="text-lg text-muted-foreground">Trabajar con la tercera edad requiere visibilidad a largo plazo. Deja de revisar hojas sueltas para encontrar cuándo empezó el deterioro.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {ELDERLY_FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col items-start p-8 rounded-3xl border bg-card hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-6 bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-24 bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Dignifica la historia clínica de tus pacientes</h2>
          <Link href="/auth/register">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20">
              Registrar mi cuenta
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

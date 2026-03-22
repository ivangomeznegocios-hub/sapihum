import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Software para Psicología Clínica | Comunidad de Psicología",
  description: "La plataforma definitiva para psicólogos clínicos. Expedientes NOM-024, agenda automatizada y cobros sin fricción.",
}

const PAIN_POINTS = [
  {
    title: "Expedientes NOM-024",
    description: "Estructura clínica completa: Motivo de consulta, evolución, pronóstico y alta. Firmados digitalmente y accesibles 24/7.",
    icon: "📋"
  },
  {
    title: "Cero inasistencias",
    description: "Tus pacientes reciben recordatorios automáticos por WhatsApp y correo. Si cancelan, el espacio se libera para alguien más.",
    icon: "📅"
  },
  {
    title: "Cobros sin incomodidad",
    description: "Envía links de pago profesionales por Stripe. Cobra por sesión o vende paquetes mensuales por adelantado.",
    icon: "💳"
  }
]

export default function ClinicalPsychologyPage() {
  return (
    <div className="flex flex-col items-center flex-1 w-full bg-background relative">
      {/* Hero */}
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-gradient-to-b from-blue-50/80 to-background dark:from-blue-950/20">
        <div className="max-w-3xl flex flex-col items-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-sm font-semibold text-blue-800 dark:text-blue-300">
              Especialidad: Psicología Clínica
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Diseñado para el día a día <br className="hidden sm:inline" />
              de la consulta <span className="text-blue-600 dark:text-blue-400">clínica.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Sabemos que tu tiempo entre pacientes es limitado. Olvídate de Word, Excel y WhatsApps manuales. Automatiza tu administración para enfocarte en la terapia.
            </p>
            <Link href="/auth/register?plan=level2&specialization=clinica">
              <Button size="lg" className="h-14 px-8 text-base shadow-xl bg-blue-600 hover:bg-blue-700 text-white">
                Activar Membresia Clinica
              </Button>
            </Link>
        </div>
      </section>

      {/* Características Clave */}
      <section className="w-full py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {PAIN_POINTS.map((point) => (
              <div key={point.title} className="flex flex-col items-center text-center p-6 rounded-3xl border bg-card hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-3xl w-24 h-24 flex items-center justify-center">
                  {point.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{point.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="w-full py-24 bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-10">Más de 500 psicólogos clínicos ya dieron el salto</h2>
          <blockquote className="text-2xl font-medium leading-relaxed italic text-muted-foreground mb-8">
            "Antes de Comunidad de Psicología pasaba mis domingos persiguiendo pagos y enviando recordatorios. Hoy mi agenda se maneja sola y mis notas clínicas cumplen con la NOM."
          </blockquote>
          <div className="font-bold text-lg">Mtro. Alejandro Vargas</div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Especialista en Terapia Cognitivo Conductual</div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="w-full py-20">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Moderniza tu práctica clínica hoy mismo</h2>
          <Link href="/auth/register">
            <Button size="lg" className="h-12 px-8 text-base">Crear Cuenta Gratis</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

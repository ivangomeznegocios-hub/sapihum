import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Software para Psicología Infantil y del Adolescente | Comunidad de Psicología",
  description: "Firma de padres, portal familiar y recursos de intervención lúdica. Una plataforma adaptada al trabajo con menores.",
}

const CHILD_FEATURES = [
  {
    title: "Gestión Multi-Tutor",
    description: "Vincula a padres separados, tutores legales o maestros al expediente del menor para facilitar encuestas cruzadas y reportes sin violar la privacidad del paciente.",
    icon: "👨‍👩‍👧"
  },
  {
    title: "Consentimientos Dinámicos",
    description: "Plantillas pre-cargadas de asentimiento para el menor y consentimiento informado para los tutores, con firmas electrónicas desde la comodidad de sus teléfonos.",
    icon: "📝"
  },
  {
    title: "Notas Escolares vs Clínicas",
    description: "Separa la evolución clínica privada de los reportes públicos o valoraciones que la escuela necesita. Imprime solo lo necesario con un clic.",
    icon: "🏫"
  }
]

export default function ChildPsychologyPage() {
  return (
    <div className="flex flex-col items-center flex-1 w-full bg-background relative">
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-gradient-to-br from-orange-50/80 via-background to-rose-50/50 dark:from-orange-950/20 dark:to-rose-950/20">
        <div className="max-w-3xl flex flex-col items-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/40 px-3 py-1 text-sm font-semibold text-orange-800 dark:text-orange-300">
              Especialidad: Psicología Infantil y del Adolescente
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Integra todo el <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
                ecosistema familiar.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Tratar a un menor implica coordinar al paciente, a sus padres y muchas veces a su escuela. Organiza fácilmente a todos los actores clave desde una sola herramienta clínica.
            </p>
            <div className="flex gap-4">
              <Link href="/precios">
                <Button size="lg" className="h-14 px-8 text-base bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/20">
                  Unirme a lista de espera
                </Button>
              </Link>
            </div>
        </div>
      </section>

      <section className="w-full py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Construido para la triangulación clínica</h2>
            <p className="text-lg text-muted-foreground">Sabemos que recabar el historial médico pediátrico toma horas. Nuestro sistema lo hace automático enviando cuestionarios previos a los padres.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CHILD_FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col text-center p-8 rounded-3xl border border-orange-100 dark:border-orange-900/50 bg-card hover:border-orange-300 dark:hover:border-orange-800 transition-colors">
                <div className="text-5xl mb-6 mx-auto bg-orange-50 dark:bg-orange-900/30 w-20 h-20 rounded-2xl flex items-center justify-center">
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
          <h2 className="text-3xl font-bold mb-6">Elige la plataforma que entiende tu flujo</h2>
          <Link href="/auth/register">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20">
              Crear Cuenta Inicial 
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

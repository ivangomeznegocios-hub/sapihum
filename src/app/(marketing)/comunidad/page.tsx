import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MessageSquare, Sparkles, Users2 } from "lucide-react"

const highlights = [
  {
    icon: Users2,
    title: "Conexion profesional",
    description: "Conecta con psicologos, ponentes y colegas afines sin friccion en mobile.",
  },
  {
    icon: CalendarDays,
    title: "Eventos y formaciones",
    description: "Consulta talleres, transmisiones y rutas de aprendizaje desde cualquier pantalla.",
  },
  {
    icon: MessageSquare,
    title: "Conversaciones utiles",
    description: "Intercambia ideas, preguntas y rutas de crecimiento con otros miembros.",
  },
  {
    icon: Sparkles,
    title: "Crecimiento continuo",
    description: "Recursos, novedades y oportunidades ordenadas para consultar rapido.",
  },
]

export default function ComunidadPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-center">
        <div className="space-y-5">
          <Badge variant="outline" className="w-fit">
            Comunidad exclusiva
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Un espacio pensado para compartir, aprender y crecer
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Estamos construyendo una comunidad que se lee bien en mobile: eventos, colaboraciones y conversaciones
            utiles sin saturar la pantalla.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/register">
              <Button className="w-full sm:w-auto">Unirme a la comunidad</Button>
            </Link>
            <Link href="/precios">
              <Button variant="outline" className="w-full sm:w-auto">
                Ver planes
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-primary/15 bg-gradient-to-br from-primary/10 via-background to-muted/40">
          <CardContent className="space-y-4 p-6">
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-sm font-medium">Proximamente</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Esta vista quedara como hub de comunidad, con foco en uso comodo desde telefono.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border bg-background/70 p-3">
                <p className="text-lg font-bold">4+</p>
                <p className="text-muted-foreground">formatos de contenido</p>
              </div>
              <div className="rounded-xl border bg-background/70 p-3">
                <p className="text-lg font-bold">Mobile</p>
                <p className="text-muted-foreground">first experience</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {highlights.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="border-border/60">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}

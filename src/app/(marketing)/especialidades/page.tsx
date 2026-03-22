import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WaitlistCTA } from '@/components/specializations/waitlist-cta'
import { getActiveSpecializations, getComingSoonSpecializations } from '@/lib/specializations'

export const metadata = {
  title: 'Especializaciones | Comunidad de Psicologia',
  description: 'Clinica activa y nuevas especializaciones en lanzamiento por demanda.',
}

export default function EspecialidadesIndexPage() {
  const active = getActiveSpecializations()
  const comingSoon = getComingSoonSpecializations()

  return (
    <div className="flex flex-col items-center flex-1 w-full bg-muted/20">
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Especializaciones por demanda real
        </h1>
        <p className="text-lg text-muted-foreground">
          Hoy arrancamos con Clinica. Las siguientes se liberan segun lista de espera.
        </p>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 pb-16 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {active.map((spec) => (
            <Card key={spec.code} className="border-primary/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{spec.name}</CardTitle>
                  <Badge>Disponible</Badge>
                </div>
                <CardDescription>
                  {spec.includesSoftware ? 'Incluye software' : 'Sin software'} ·{' '}
                  {spec.includesEvents ? 'Incluye eventos especializados' : 'Eventos por definir'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {spec.benefits.slice(0, 4).map((benefit) => (
                    <li key={benefit} className="text-sm text-muted-foreground">
                      - {benefit}
                    </li>
                  ))}
                </ul>
                <Link href={`/especialidades/${spec.slug}`}>
                  <Button>Ver especializacion</Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          {comingSoon.map((spec) => (
            <Card key={spec.code} className="border-dashed">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{spec.name}</CardTitle>
                  <Badge variant="secondary">Proximamente</Badge>
                </div>
                <CardDescription>
                  Precio e inclusion exacta por definir en lanzamiento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WaitlistCTA
                  specializationCode={spec.code}
                  specializationName={spec.name}
                  source="landing"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

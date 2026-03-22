import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles } from 'lucide-react'
import { MEMBERSHIP_TIERS } from '@/lib/membership'
import { getSubscriptionPlan } from '@/lib/payments/config'
import {
  canUserSeeLevel3Offer,
  getActiveSpecializations,
  getComingSoonSpecializations,
} from '@/lib/specializations'
import { getUserProfile } from '@/lib/supabase/server'
import { WaitlistCTA } from '@/components/specializations/waitlist-cta'

function currency(value: number) {
  return `$${value.toLocaleString('es-MX')}`
}

export default async function PricingPage() {
  const profile = await getUserProfile()
  const isLoggedIn = !!profile
  const currentLevel = profile?.membership_level ?? 0
  const currentSpecializationCode = (profile as any)?.membership_specialization_code ?? null

  const level1Plan = getSubscriptionPlan(1)
  const level3Plan = getSubscriptionPlan(3)
  const activeSpecializations = getActiveSpecializations()
  const comingSoonSpecializations = getComingSoonSpecializations()

  const level3Visible = canUserSeeLevel3Offer({
    membershipLevel: currentLevel,
    specializationCode: currentSpecializationCode,
    isAdmin: profile?.role === 'admin',
  })

  return (
    <div className="flex flex-col items-center w-full bg-muted/20">
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
        <Badge variant="outline" className="mb-4">
          Modelo por niveles
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Precios claros para crecer por especializacion
        </h1>
        <p className="text-lg text-muted-foreground">
          Nivel 1 para entrar y aprender. Nivel 2 por especializacion. Nivel 3 se desbloquea solo despues de Nivel 2.
        </p>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 pb-10 max-w-6xl">
        {level1Plan && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Nivel 1 - Comunidad</CardTitle>
                  <CardDescription>
                    Comunidad, cursos y educacion continua para todos.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{currency(level1Plan.monthly.amount)}</p>
                  <p className="text-sm text-muted-foreground">/mes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="grid gap-2 sm:grid-cols-2">
                {MEMBERSHIP_TIERS[1].features.slice(0, 8).map((feature) => (
                  <li key={feature} className="text-sm flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={isLoggedIn ? '/dashboard/subscription' : '/auth/register?plan=level1'}>
                <Button className="w-full sm:w-auto" data-analytics-cta data-analytics-label={isLoggedIn ? 'Gestionar en mi cuenta' : 'Comenzar Nivel 1'} data-analytics-funnel={isLoggedIn ? 'subscription' : 'registration'} data-analytics-plan="level1">
                  {isLoggedIn ? 'Gestionar en mi cuenta' : 'Comenzar Nivel 1'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 pb-14 max-w-6xl">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Nivel 2 - Especializacion</h2>
          <p className="text-sm text-muted-foreground">
            Algunas especializaciones incluyen software y otras no. Hoy Clinica esta activa.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {activeSpecializations.map((specialization) => {
            const level2Plan = getSubscriptionPlan(2, specialization.code)
            if (!level2Plan) return null

            return (
              <Card key={specialization.code} className="border-primary/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{specialization.name}</CardTitle>
                    <Badge>Activa</Badge>
                  </div>
                  <CardDescription>
                    {specialization.includesSoftware ? 'Incluye software' : 'Sin software'} ·{' '}
                    {specialization.includesEvents ? 'Incluye eventos especializados' : 'Eventos por definir'}
                  </CardDescription>
                  <div>
                    <p className="text-3xl font-bold">{currency(level2Plan.monthly.amount)}</p>
                    <p className="text-sm text-muted-foreground">/mes</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {specialization.benefits.slice(0, 5).map((benefit) => (
                      <li key={benefit} className="text-sm flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={
                      isLoggedIn
                        ? '/dashboard/subscription'
                        : `/auth/register?plan=level2&specialization=${specialization.code}`
                    }
                  >
                    <Button className="w-full sm:w-auto" data-analytics-cta data-analytics-label={isLoggedIn ? 'Subir desde mi cuenta' : `Quiero ${specialization.name}`} data-analytics-funnel={isLoggedIn ? 'subscription' : 'registration'} data-analytics-plan="level2" data-analytics-specialization={specialization.code}>
                      {isLoggedIn ? 'Subir desde mi cuenta' : `Quiero ${specialization.name}`}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}

          {comingSoonSpecializations.map((specialization) => (
            <Card key={specialization.code} className="border-dashed">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{specialization.name}</CardTitle>
                  <Badge variant="secondary">Proximamente</Badge>
                </div>
                <CardDescription>
                  {specialization.includesSoftware ? 'Incluye software' : 'Sin software'} ·{' '}
                  {specialization.includesEvents ? 'Incluye eventos especializados' : 'Eventos por definir'}
                </CardDescription>
                <div>
                  <p className="text-lg font-semibold text-muted-foreground">Precio por definir</p>
                </div>
              </CardHeader>
              <CardContent>
                <WaitlistCTA
                  specializationCode={specialization.code}
                  specializationName={specialization.name}
                  source="landing"
                  className="w-full sm:w-auto"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {level3Visible && level3Plan && (
        <section className="w-full px-4 sm:px-6 lg:px-8 pb-16 max-w-6xl">
          <Card className="border-amber-400/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Nivel 3 - Avanzado
                  </CardTitle>
                  <CardDescription>
                    Oferta visible porque ya tienes (o calificas por) Nivel 2.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{currency(level3Plan.monthly.amount)}</p>
                  <p className="text-sm text-muted-foreground">/mes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={isLoggedIn ? '/dashboard/subscription' : '/auth/login'}>
                <Button className="w-full sm:w-auto" data-analytics-cta data-analytics-label={isLoggedIn ? 'Activar Nivel 3' : 'Inicia sesion para verlo'} data-analytics-funnel={isLoggedIn ? 'subscription' : 'registration'} data-analytics-plan="level3">
                  {isLoggedIn ? 'Activar Nivel 3' : 'Inicia sesion para verlo'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="w-full py-14 border-t bg-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-3">Como abrimos nuevas especializaciones</h3>
          <p className="text-muted-foreground">
            Abrimos nuevas especializaciones segun demanda real de la comunidad. La mas solicitada en lista de espera es la siguiente en produccion.
          </p>
        </div>
      </section>
    </div>
  )
}

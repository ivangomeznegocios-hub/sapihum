import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Clock, CalendarDays, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { reconcileCompletedCheckoutSession } from '@/lib/payments'

interface PageProps {
    searchParams: Promise<{ session_id?: string; next?: string; kind?: string; formation_id?: string }>
}

async function getPurchaseFromSession(sessionId: string | undefined) {
    if (!sessionId) return { event: null, formation: null }

    try {
        const supabase = await createClient()

        const { data: eventPurchase } = await (supabase as any)
            .from('event_purchases')
            .select('event_id, events(id, title, slug)')
            .eq('provider_session_id', sessionId)
            .maybeSingle()

        if (eventPurchase?.events) {
            return {
                event: eventPurchase.events,
                formation: null,
            }
        }

        const { data: formationPurchase } = await (supabase as any)
            .from('formation_purchases')
            .select('formation_id, formations(id, title, slug)')
            .eq('provider_session_id', sessionId)
            .maybeSingle()

        if (formationPurchase?.formations) {
            return {
                event: null,
                formation: formationPurchase.formations,
            }
        }
    } catch {
        return { event: null, formation: null }
    }

    return { event: null, formation: null }
}

async function getFormationById(formationId: string | undefined) {
    if (!formationId) return null

    const supabase = await createClient()
    const { data } = await (supabase
        .from('formations') as any)
        .select('id, title, slug')
        .eq('id', formationId)
        .maybeSingle()

    return data ?? null
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
    const params = await searchParams
    const session_id = params.session_id
    const nextUrl = params.next

    if (session_id) {
        try {
            await reconcileCompletedCheckoutSession(session_id)
        } catch (error) {
            console.error('[PaymentSuccess] Failed to reconcile checkout session:', error)
        }
    }

    const purchase = await getPurchaseFromSession(session_id)
    const formation = purchase.formation || (params.kind === 'formation' ? await getFormationById(params.formation_id) : null)
    const event = purchase.event

    return (
        <div className="max-w-lg mx-auto mt-12 space-y-6">
            <Card className="border-green-200 dark:border-green-900 text-center">
                <CardHeader className="pb-2">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Â¡Pago exitoso!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        {event
                            ? `Tu acceso a "${event.title}" ha sido confirmado.`
                            : formation
                                ? `Tu acceso al diplomado "${formation.title}" ya quedÃ³ activo.`
                                : 'Tu pago ha sido procesado correctamente. Tu cuenta serÃ¡ actualizada en unos momentos.'}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        <Clock className="h-4 w-4" />
                        <span>Los cambios pueden tardar unos segundos en reflejarse</span>
                    </div>
                    {event ? (
                        <div className="flex flex-col gap-2">
                            <Button asChild className="w-full">
                                <Link href={`/dashboard/events/${event.id}`}>
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    Ir al evento
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/dashboard/events">
                                    Ver todos mis eventos
                                </Link>
                            </Button>
                        </div>
                    ) : formation ? (
                        <div className="flex flex-col gap-2">
                            <Button asChild className="w-full">
                                <Link href="/dashboard/mi-acceso">
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    Ir a Mis Accesos
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link href={`/formaciones/${formation.slug}`}>
                                    Ver pÃ¡gina del diplomado
                                </Link>
                            </Button>
                        </div>
                    ) : nextUrl ? (
                        <Button asChild className="w-full">
                            <Link href={nextUrl}>
                                Continuar
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    ) : (
                        <Button asChild className="w-full">
                            <Link href="/dashboard/subscription">
                                Ir a mi membresÃ­a
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

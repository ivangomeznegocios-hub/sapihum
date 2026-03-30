import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Clock, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { reconcileCompletedCheckoutSession } from '@/lib/payments'

interface PageProps {
    searchParams: Promise<{ session_id?: string; next?: string }>
}

async function getEventFromSession(sessionId: string | undefined) {
    if (!sessionId) return null
    try {
        const supabase = await createClient()
        // Find the event purchase linked to this Stripe session
        const { data: purchase } = await (supabase as any)
            .from('event_purchases')
            .select('event_id, events(id, title, slug)')
            .eq('provider_session_id', sessionId)
            .single()

        if (!purchase?.events) {
            // Fallback: check by provider_session_id in payment_webhook_events
            const { data: purchase2 } = await (supabase as any)
                .from('event_purchases')
                .select('event_id, events(id, title, slug)')
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
            return purchase2?.events || null
        }
        return purchase.events
    } catch {
        return null
    }
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

    const event = await getEventFromSession(session_id)

    return (
        <div className="max-w-lg mx-auto mt-12 space-y-6">
            <Card className="border-green-200 dark:border-green-900 text-center">
                <CardHeader className="pb-2">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">¡Pago exitoso!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        {event
                            ? `Tu acceso a "${event.title}" ha sido confirmado.`
                            : 'Tu pago ha sido procesado correctamente. Tu cuenta será actualizada en unos momentos.'}
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
                                Ir a mi membresía
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

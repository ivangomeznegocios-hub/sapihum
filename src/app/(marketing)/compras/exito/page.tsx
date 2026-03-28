import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUserProfile } from '@/lib/supabase/server'
import { reconcileCompletedCheckoutSession } from '@/lib/payments'
import { getPublicEventBySlug } from '@/lib/supabase/queries/events'
import { ArrowRight, CheckCircle2, Mail, Play } from 'lucide-react'

export const metadata = {
    title: 'Compra confirmada | Comunidad Psicología',
    robots: {
        index: false,
        follow: false,
    },
}

interface PageProps {
    searchParams: Promise<{ slug?: string; session_id?: string }>
}

export default async function PurchaseSuccessPage({ searchParams }: PageProps) {
    const { slug, session_id } = await searchParams

    if (session_id) {
        try {
            await reconcileCompletedCheckoutSession(session_id)
        } catch (error) {
            console.error('[PurchaseSuccess] Failed to reconcile checkout session:', error)
        }
    }

    const profile = await getUserProfile()
    const event = slug ? await getPublicEventBySlug(slug) : null
    const hubPath = event ? `/hub/${event.slug}` : '/mi-acceso'
    const recoveryPath = `/compras/recuperar?next=${encodeURIComponent(hubPath)}`

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full border-emerald-500/20 shadow-xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl">Compra confirmada</CardTitle>
                        <CardDescription className="text-base">
                            Tu pago se registró correctamente. El acceso se libera en tu hub privado en cuanto confirmamos la compra.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                        {profile
                            ? 'Ya tienes sesión iniciada, así que puedes entrar directo a tu acceso.'
                            : 'Si compraste como invitado, usa el mismo correo para recuperar tu acceso con magic link.'}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button asChild className="flex-1">
                            <Link href={profile ? hubPath : recoveryPath}>
                                {profile ? 'Abrir mi acceso' : 'Recuperar acceso por correo'}
                                {profile ? <Play className="ml-2 h-4 w-4" /> : <Mail className="ml-2 h-4 w-4" />}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                            <Link href={event ? `/${event.public_kind}/${event.slug}` : '/eventos'}>
                                Ver página pública
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </section>
    )
}

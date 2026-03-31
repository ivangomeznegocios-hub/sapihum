import Link from 'next/link'
import { ArrowRight, CheckCircle2, Mail, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { reconcileCompletedCheckoutSession } from '@/lib/payments'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import { getPublicEventBySlug } from '@/lib/supabase/queries/events'
import { formatPageTitle } from '@/lib/brand'
import { getMembershipLabel } from '@/lib/membership'
import { getSpecializationByCode } from '@/lib/specializations'
import { retrieveCompletedCheckoutSubscription } from '@/lib/payments/stripe'

export const metadata = {
    title: formatPageTitle('Compra confirmada'),
    robots: {
        index: false,
        follow: false,
    },
}

interface PageProps {
    searchParams: Promise<{
        slug?: string
        session_id?: string
        kind?: string
        level?: string
        specialization?: string
        next?: string
        email?: string
    }>
}

async function getFormationBySlug(slug: string) {
    const supabase = await createClient()
    const { data } = await (supabase
        .from('formations') as any)
        .select('id, slug, title')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle()

    return data ?? null
}

async function getSubscriptionSummary(sessionId: string | undefined) {
    if (!sessionId) {
        return null
    }

    try {
        return await retrieveCompletedCheckoutSubscription(sessionId)
    } catch {
        return null
    }
}

export default async function PurchaseSuccessPage({ searchParams }: PageProps) {
    const { slug, session_id, kind, level, specialization, next, email } = await searchParams

    if (session_id) {
        try {
            await reconcileCompletedCheckoutSession(session_id)
        } catch (error) {
            console.error('[PurchaseSuccess] Failed to reconcile checkout session:', error)
        }
    }

    const profile = await getUserProfile()
    const event = slug && kind !== 'formation' ? await getPublicEventBySlug(slug) : null
    const formation = slug && !event ? await getFormationBySlug(slug) : null
    const subscription = kind === 'subscription' ? await getSubscriptionSummary(session_id) : null

    if (kind === 'subscription') {
        const membershipLevel = Number(subscription?.membershipLevel || level || 0)
        const specializationCode = subscription?.specializationCode || specialization || null
        const specializationName = specializationCode ? getSpecializationByCode(specializationCode)?.name : null
        const membershipLabel = membershipLevel > 0 ? getMembershipLabel(membershipLevel) : 'Membresia'
        const destinationPath = next?.startsWith('/') ? next : '/dashboard/subscription'
        const recoveryEmail = subscription?.customerEmail || email || ''
        const recoveryPath = `/compras/recuperar?next=${encodeURIComponent(destinationPath)}${recoveryEmail ? `&email=${encodeURIComponent(recoveryEmail)}` : ''}`

        return (
            <section className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
                <Card className="w-full border-brand-brown/20 shadow-xl">
                    <CardHeader className="space-y-4 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-brown/10 text-brand-brown">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl">Membresia activada</CardTitle>
                            <CardDescription className="text-base">
                                {specializationName
                                    ? `Tu ${membershipLabel} de ${specializationName} ya quedo registrado correctamente.`
                                    : `Tu ${membershipLabel} ya quedo registrado correctamente.`}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                            {profile
                                ? 'Tu cuenta ya esta lista y puedes entrar directo a tu panel.'
                                : 'Primero se cobro la membresia y ahora puedes entrar con el mismo correo para terminar de acceder a tu cuenta, sin volver a comprar.'}
                        </div>

                        {!profile && recoveryEmail ? (
                            <div className="rounded-xl border border-brand-yellow/20 bg-brand-yellow/10 p-4 text-sm text-brand-yellow">
                                Si aun no te llega el acceso, usa <strong>{recoveryEmail}</strong> para recibir tu magic link.
                            </div>
                        ) : null}

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button asChild className="flex-1">
                                <Link href={profile ? destinationPath : recoveryPath}>
                                    {profile ? 'Abrir mi membresia' : 'Entrar con magic link'}
                                    {profile ? <Sparkles className="ml-2 h-4 w-4" /> : <Mail className="ml-2 h-4 w-4" />}
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="flex-1">
                                <Link href="/precios">
                                    Volver a precios
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>
        )
    }

    const hubPath = event ? `/hub/${event.slug}` : '/mi-acceso'
    const recoveryPath = `/compras/recuperar?next=${encodeURIComponent(hubPath)}`
    const publicPath = event
        ? `/${event.public_kind}/${event.slug}`
        : formation
            ? `/formaciones/${formation.slug}`
            : '/eventos'
    const title = event?.title || formation?.title || 'tu acceso'

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full border-brand-brown/20 shadow-xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-brown/10 text-brand-brown">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl">Compra confirmada</CardTitle>
                        <CardDescription className="text-base">
                            {formation
                                ? `Tu acceso al diplomado "${title}" ya quedo activo.`
                                : `Tu pago se registro correctamente. El acceso a "${title}" se libera en tu hub privado en cuanto confirmamos la compra.`}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                        {profile
                            ? 'Ya tienes sesion iniciada, asi que puedes entrar directo a tus accesos.'
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
                            <Link href={publicPath}>
                                Ver pagina publica
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </section>
    )
}

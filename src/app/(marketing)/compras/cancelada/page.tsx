import Link from 'next/link'
import { ArrowLeft, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getPublicEventBySlug } from '@/lib/supabase/queries/events'
import { formatPageTitle } from '@/lib/brand'

export const metadata = {
    title: formatPageTitle('Compra cancelada'),
    robots: {
        index: false,
        follow: false,
    },
}

interface PageProps {
    searchParams: Promise<{ slug?: string; kind?: string }>
}

async function getFormationBySlug(slug: string) {
    const supabase = await createClient()
    const { data } = await (supabase
        .from('formations') as any)
        .select('slug')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle()

    return data ?? null
}

export default async function PurchaseCancelledPage({ searchParams }: PageProps) {
    const { slug, kind } = await searchParams
    const event = slug && kind !== 'formation' ? await getPublicEventBySlug(slug) : null
    const formation = slug && !event ? await getFormationBySlug(slug) : null
    const backHref = kind === 'subscription'
        ? '/precios'
        : event
            ? `/${event.public_kind}/${event.slug}`
            : formation
                ? `/formaciones/${formation.slug}`
                : '/eventos'
    const description = kind === 'subscription'
        ? 'No se realizo ningun cargo de membresia. Si quieres, puedes volver a precios y retomar la compra cuando te convenga.'
        : 'No se realizo ningun cargo. Si quieres, puedes volver a la pagina del activo y retomar la compra cuando te convenga.'

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full border-brand-yellow/20 shadow-xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-yellow/10 text-brand-yellow">
                        <XCircle className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl">Compra cancelada</CardTitle>
                        <CardDescription className="text-base">
                            {description}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={backHref}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al activo
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </section>
    )
}

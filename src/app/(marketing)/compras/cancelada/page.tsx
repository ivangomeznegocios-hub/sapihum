import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPublicEventBySlug } from '@/lib/supabase/queries/events'
import { ArrowLeft, XCircle } from 'lucide-react'

export const metadata = {
    title: 'Compra cancelada | Comunidad Psicología',
    robots: {
        index: false,
        follow: false,
    },
}

interface PageProps {
    searchParams: Promise<{ slug?: string }>
}

export default async function PurchaseCancelledPage({ searchParams }: PageProps) {
    const { slug } = await searchParams
    const event = slug ? await getPublicEventBySlug(slug) : null
    const backHref = event ? `/${event.public_kind}/${event.slug}` : '/eventos'

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full border-amber-500/20 shadow-xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                        <XCircle className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl">Compra cancelada</CardTitle>
                        <CardDescription className="text-base">
                            No se realizó ningún cargo. Si quieres, puedes volver a la página del activo y retomar la compra cuando te convenga.
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

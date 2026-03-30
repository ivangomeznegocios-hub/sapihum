import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
    searchParams: Promise<{ kind?: string; formation_id?: string }>
}

async function getFormationById(formationId: string | undefined) {
    if (!formationId) return null

    const supabase = await createClient()
    const { data } = await (supabase
        .from('formations') as any)
        .select('id, slug, title')
        .eq('id', formationId)
        .maybeSingle()

    return data ?? null
}

export default async function PaymentCancelledPage({ searchParams }: PageProps) {
    const params = await searchParams
    const formation = params.kind === 'formation' ? await getFormationById(params.formation_id) : null

    const title = formation ? formation.title : null
    const primaryHref = formation ? `/formaciones/${formation.slug}` : '/dashboard/events'
    const secondaryHref = formation ? '/dashboard/mi-acceso' : '/dashboard/subscription'

    return (
        <div className="mx-auto mt-12 max-w-lg space-y-6">
            <Card className="text-center border-yellow-200 dark:border-yellow-900">
                <CardHeader className="pb-2">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <XCircle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <CardTitle className="text-2xl">Pago cancelado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        {formation
                            ? `La compra del diplomado "${title}" fue cancelada. No se realizo ningun cargo.`
                            : 'El proceso de pago fue cancelado. No se realizo ningun cargo. Puedes intentar de nuevo cuando gustes.'}
                    </p>

                    <div className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                            <Link href={primaryHref}>
                                {formation ? <GraduationCap className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
                                {formation ? 'Volver al diplomado' : 'Volver a eventos'}
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="w-full">
                            <Link href={secondaryHref}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {formation ? 'Ir a Mis Accesos' : 'Volver a membresia'}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getFormationsForAdmin } from '../formation-actions'

export const metadata = {
    title: 'Programas de Formacion | SAPIHUM Admin',
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activa',
    archived: 'Archivada',
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-neutral-200 text-neutral-800',
    active: 'bg-brand-brown text-brand-brown',
    archived: 'bg-orange-100 text-orange-800',
}

export default async function FormationsAdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = user
        ? await (supabase
            .from('profiles') as any)
            .select('role')
            .eq('id', user.id)
            .single()
        : { data: null }

    if (!profile || !['admin', 'ponente'].includes(profile.role)) {
        notFound()
    }

    const formations = await getFormationsForAdmin()

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Formaciones y Programas Completos</h1>
                    <p className="mt-1 text-muted-foreground">
                        Agrupa eventos y cursos para crear programas formativos completos.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/events/formations/nueva">
                        <Plus className="mr-2 h-4 w-4" />
                        Crear formacion
                    </Link>
                </Button>
            </div>

            {formations.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <CardTitle className="mb-2">No hay formaciones creadas</CardTitle>
                    <CardDescription className="mb-6 max-w-md">
                        Crea tu primera ruta formativa agrupando cursos individuales para ofrecer un paquete completo con certificacion unificada.
                    </CardDescription>
                    <Button asChild>
                        <Link href="/dashboard/events/formations/nueva">Comenzar ahora</Link>
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {formations.map((formation: any) => (
                        <Card key={formation.id} className="group transition-colors hover:border-primary/50">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 pr-4">
                                        <CardTitle className="line-clamp-2 text-lg">
                                            <Link href={`/dashboard/events/formations/${formation.id}`} className="hover:underline">
                                                {formation.title}
                                            </Link>
                                        </CardTitle>
                                        <CardDescription className="font-mono text-xs">
                                            /{formation.slug}
                                        </CardDescription>
                                    </div>
                                    <Badge className={`${STATUS_COLORS[formation.status]} shrink-0`} variant="secondary">
                                        {STATUS_LABELS[formation.status]}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-2 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                                    <div className="flex flex-col">
                                        <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cursos</span>
                                        <span className="font-medium">{formation.total_courses || 0} vinculados</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ventas completas</span>
                                        <span className="font-medium">{formation.total_purchases || 0} programas completos</span>
                                    </div>
                                    <div className="col-span-2 mt-1 flex flex-col">
                                        <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Precio Programa Completo</span>
                                        <span className="font-semibold text-primary">${formation.bundle_price} MXN</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

import Link from 'next/link'
import { Plus, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFormationsForAdmin } from '../formation-actions'

export const metadata = {
    title: 'Programas de Formación | SAPIHUM Admin',
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activa',
    archived: 'Archivada'
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-slate-200 text-slate-800',
    active: 'bg-emerald-100 text-emerald-800',
    archived: 'bg-orange-100 text-orange-800'
}

export default async function FormationsAdminPage() {
    const formations = await getFormationsForAdmin()

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Formaciones & Bundles</h1>
                    <p className="text-muted-foreground mt-1">
                        Agrupa eventos y cursos para crear programas formativos completos.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/events/formations/nueva">
                        <Plus className="mr-2 h-4 w-4" />
                        Crear formación
                    </Link>
                </Button>
            </div>

            {formations.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <CardTitle className="mb-2">No hay formaciones creadas</CardTitle>
                    <CardDescription className="mb-6 max-w-md">
                        Crea tu primera ruta formativa agrupando cursos individuales para ofrecer un paquete completo con certificación unificada.
                    </CardDescription>
                    <Button asChild>
                        <Link href="/dashboard/events/formations/nueva">Comenzar ahora</Link>
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {formations.map((formation: any) => (
                        <Card key={formation.id} className="group hover:border-primary/50 transition-colors">
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
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2 pt-4 border-t">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Cursos</span>
                                        <span className="font-medium">{formation.total_courses || 0} vinculados</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Ventas completas</span>
                                        <span className="font-medium">{formation.total_purchases || 0} bundles</span>
                                    </div>
                                    <div className="flex flex-col col-span-2 mt-1">
                                        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Precio Bundle</span>
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

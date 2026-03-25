import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUserProfile } from '@/lib/supabase/server'
import { getMyAccessibleEvents } from '@/lib/supabase/queries/event-entitlements'
import { ArrowRight, Calendar, Play, Library, ExternalLink } from 'lucide-react'

export const metadata = {
    title: 'Mi acceso | Comunidad Psicología',
    robots: {
        index: false,
        follow: false,
    },
}

function getTypeLabel(type: string) {
    if (type === 'course') return 'Curso'
    if (type === 'on_demand') return 'Grabación'
    return 'Evento'
}

function getStatusLabel(status: string) {
    if (status === 'completed') return 'Disponible'
    if (status === 'live') return 'En vivo'
    if (status === 'upcoming') return 'Próximo'
    return status
}

export default async function MyAccessPage() {
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/compras/recuperar?next=/mi-acceso')
    }

    const accesses = await getMyAccessibleEvents()

    return (
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    <Library className="h-3.5 w-3.5" />
                    Biblioteca privada
                </div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mis accesos</h1>
                <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                    Aquí centralizamos tus eventos, cursos y grabaciones activas. Cada activo conserva su página pública para vender
                    y su hub privado para consumir.
                </p>
            </div>

            {accesses.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                        <Library className="h-10 w-10 text-muted-foreground/60" />
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Todavía no tienes accesos activos</h2>
                            <p className="max-w-xl text-sm text-muted-foreground">
                                Cuando te registres, compres o recibas acceso por membresía, tus activos aparecerán aquí con un
                                enlace directo a su hub privado.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/eventos">
                                Explorar eventos
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {accesses.map((access: any) => {
                        const event = access.event
                        const hubPath = `/hub/${event.slug}`

                        return (
                            <Card key={access.id} className="overflow-hidden">
                                {event.image_url && (
                                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                                        <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <CardHeader className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">{getTypeLabel(event.event_type)}</Badge>
                                        <Badge variant="outline">{getStatusLabel(event.status)}</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle className="line-clamp-2 text-xl">{event.title}</CardTitle>
                                        {event.subtitle && (
                                            <CardDescription className="line-clamp-2">{event.subtitle}</CardDescription>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {event.start_time && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {new Date(event.start_time).toLocaleDateString('es-MX', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <Button asChild className="w-full">
                                            <Link href={hubPath}>
                                                Abrir hub privado
                                                <Play className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline" className="w-full">
                                            <Link href={access.public_path}>
                                                Ver página pública
                                                <ExternalLink className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

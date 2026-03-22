import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicEventById } from '@/lib/supabase/queries/events'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PageProps {
    params: Promise<{ id: string }>
}

function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(dateStr))
}

export default async function PublicEventPage({ params }: PageProps) {
    const { id } = await params
    const event = await getPublicEventById(id)

    if (!event) {
        notFound()
    }

    const speakers = event.speakers || []
    const isFree = event.price === 0
    const hasDiscount = event.member_access_type === 'discounted'
    const isFreeForMembers = event.member_access_type === 'free'
    const isPast = event.status === 'completed'

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
                <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground">
                                <path d="M12 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" />
                                <path d="M12 2v8l4 4" />
                            </svg>
                        </div>
                        <span className="truncate">Comunidad de Psicologia</span>
                    </Link>
                    <Button asChild size="sm" className="w-full sm:w-auto">
                        <Link href="/auth/login">Iniciar Sesion</Link>
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-8">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
                    <div className="order-1">
                        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
                            {event.image_url ? (
                                <img
                                    src={event.image_url}
                                    alt={event.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary/30">
                                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                        <line x1="16" x2="16" y1="2" y2="6" />
                                        <line x1="8" x2="8" y1="2" y2="6" />
                                        <line x1="3" x2="21" y1="10" y2="10" />
                                    </svg>
                                </div>
                            )}
                            <div className="absolute left-4 top-4">
                                <Badge className={isPast ? 'bg-gray-500' : event.status === 'live' ? 'bg-green-500' : 'bg-primary'}>
                                    {isPast ? 'Finalizado' : event.status === 'live' ? 'En Vivo' : 'Proximo'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="order-2 lg:sticky lg:top-20 lg:self-start">
                        <Card className="border-primary/10 shadow-lg">
                            <CardHeader className="space-y-2">
                                <CardTitle className="text-lg leading-tight sm:text-xl">{event.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-primary">
                                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                        <line x1="16" x2="16" y1="2" y2="6" />
                                        <line x1="8" x2="8" y1="2" y2="6" />
                                        <line x1="3" x2="21" y1="10" y2="10" />
                                    </svg>
                                    <span className="capitalize">{formatDate(event.start_time)}</span>
                                </div>

                                {event.location && (
                                    <div className="flex items-start gap-3 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-primary">
                                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span className="min-w-0 break-words">{event.location}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-primary">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    <span>{event.attendee_count} inscritos{event.max_attendees ? ` / ${event.max_attendees}` : ''}</span>
                                </div>

                                <div className="space-y-2 border-t pt-4">
                                    {isFree ? (
                                        <p className="text-2xl font-bold text-green-600">Gratis</p>
                                    ) : (
                                        <div>
                                            <p className="text-2xl font-bold text-primary">${event.price.toFixed(2)} MXN</p>
                                            <p className="text-xs text-muted-foreground">Precio publico</p>
                                        </div>
                                    )}

                                    {!isFree && isFreeForMembers && (
                                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-950">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-green-600">
                                                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                                            </svg>
                                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                                Gratis para miembros
                                            </span>
                                        </div>
                                    )}
                                    {!isFree && hasDiscount && (
                                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-amber-600">
                                                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                                            </svg>
                                            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                                Miembros: ${event.member_price?.toFixed(2)} MXN
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {!isPast && (
                                    <div className="space-y-2 pt-2">
                                        <Button asChild className="w-full" size="lg">
                                            <Link href="/auth/login">Inscribirme</Link>
                                        </Button>
                                        <p className="text-center text-xs text-muted-foreground">
                                            Inicia sesion o crea tu cuenta para inscribirte
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {event.description && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Acerca del Evento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                {event.description.split('\n').map((p: string, i: number) => (
                                    <p key={i}>{p}</p>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {speakers.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Ponentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {speakers.map((es: any) => (
                                    <Link key={es.id} href={`/speakers/${es.speaker_id}`}>
                                        <div className="flex h-full items-center gap-3 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/50 cursor-pointer">
                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-primary/10">
                                                {es.speaker?.profile?.avatar_url ? (
                                                    <img src={es.speaker.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/40">
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                            <circle cx="9" cy="7" r="4" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-semibold leading-tight">{es.speaker?.profile?.full_name || 'Ponente'}</h4>
                                                {es.speaker?.headline && (
                                                    <p className="text-sm text-muted-foreground">{es.speaker.headline}</p>
                                                )}
                                                <Badge variant="outline" className="mt-1 text-xs">
                                                    {es.role === 'moderator' ? 'Moderador' : es.role === 'host' ? 'Anfitrion' : 'Ponente'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>

            <footer className="mt-16 border-t bg-muted/30">
                <div className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Comunidad de Psicologia. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    )
}

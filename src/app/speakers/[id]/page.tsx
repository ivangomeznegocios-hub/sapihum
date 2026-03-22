import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSpeakerById, getSpeakerEvents } from '@/lib/supabase/queries/speakers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft,
    Award,
    Calendar,
    ExternalLink,
    Globe,
    GraduationCap,
    Instagram,
    Linkedin,
    Mic2,
    Sparkles,
    Twitter,
} from 'lucide-react'

interface PageProps {
    params: Promise<{ id: string }>
}

function formatEventDate(dateStr: string) {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date)
}

export default async function PublicSpeakerDetailPage({ params }: PageProps) {
    const { id } = await params
    const speaker = await getSpeakerById(id)

    if (!speaker || !speaker.is_public) {
        notFound()
    }

    const events = await getSpeakerEvents(id)
    const upcomingEvents = events.filter((e: any) => e.status === 'upcoming' || e.status === 'live')
    const pastEvents = events.filter((e: any) => e.status === 'completed')
    const socialLinks = speaker.social_links || {}

    return (
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
            <Button variant="ghost" size="sm" asChild className="w-full justify-start sm:w-auto">
                <Link href="/speakers">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Directorio
                </Link>
            </Button>

            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/20 via-primary/5 to-background">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary-rgb),0.1),transparent_70%)]" />
                <div className="relative flex flex-col items-center gap-6 p-6 sm:p-8 md:flex-row md:items-start md:gap-8 md:p-12">
                    <div className="h-36 w-36 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-background shadow-xl sm:h-40 sm:w-40 md:h-48 md:w-48">
                        {speaker.profile?.avatar_url ? (
                            <img
                                src={speaker.profile.avatar_url}
                                alt={speaker.profile?.full_name || 'Ponente'}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary/10">
                                <Mic2 className="h-16 w-16 text-primary/40" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                {speaker.profile?.full_name || 'Ponente'}
                            </h1>
                            {speaker.headline && (
                                <p className="mt-1 text-base font-medium text-primary sm:text-lg">
                                    {speaker.headline}
                                </p>
                            )}
                        </div>

                        {speaker.specialties && speaker.specialties.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                                {speaker.specialties.map((spec, i) => (
                                    <Badge key={i} className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
                                        <Sparkles className="mr-1 h-3 w-3" />
                                        {spec}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {speaker.social_links_enabled && Object.keys(socialLinks).length > 0 && (
                            <div className="flex flex-wrap justify-center gap-3 pt-2 md:justify-start">
                                {socialLinks.website && (
                                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="rounded-lg border bg-background p-2 transition-colors hover:bg-muted" title="Sitio Web">
                                        <Globe className="h-5 w-5" />
                                    </a>
                                )}
                                {socialLinks.linkedin && (
                                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-lg border bg-[#0077b5]/10 p-2 text-[#0077b5] transition-colors hover:bg-[#0077b5]/20" title="LinkedIn">
                                        <Linkedin className="h-5 w-5" />
                                    </a>
                                )}
                                {socialLinks.twitter && (
                                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="rounded-lg border bg-foreground/5 p-2 transition-colors hover:bg-foreground/10" title="Twitter / X">
                                        <Twitter className="h-5 w-5" />
                                    </a>
                                )}
                                {socialLinks.instagram && (
                                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="rounded-lg border bg-[#E1306C]/10 p-2 text-[#E1306C] transition-colors hover:bg-[#E1306C]/20" title="Instagram">
                                        <Instagram className="h-5 w-5" />
                                    </a>
                                )}
                                {Object.entries(socialLinks)
                                    .filter(([key]) => !['website', 'linkedin', 'twitter', 'instagram'].includes(key))
                                    .map(([key, url]) => (
                                        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border bg-background px-3 py-2 text-xs font-medium capitalize transition-colors hover:bg-muted" title={key}>
                                            <ExternalLink className="h-4 w-4" />
                                            {key}
                                        </a>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
                <div className="space-y-8">
                    {speaker.bio && (
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold">Acerca de</h2>
                            <div className="prose max-w-none text-muted-foreground dark:prose-invert">
                                {speaker.bio.split('\n').map((paragraph, i) => (
                                    <p key={i}>{paragraph}</p>
                                ))}
                            </div>
                        </section>
                    )}

                    {upcomingEvents.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="flex items-center gap-2 text-2xl font-bold">
                                <Calendar className="h-6 w-6 text-primary" />
                                Proximos Eventos
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {upcomingEvents.map((event: any) => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <Card className="flex h-full cursor-pointer flex-col transition-colors hover:border-primary/50">
                                            {event.image_url ? (
                                                <div className="aspect-video w-full overflow-hidden rounded-t-xl border-b">
                                                    <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="flex aspect-video w-full items-center justify-center rounded-t-xl border-b bg-muted">
                                                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                                                </div>
                                            )}
                                            <CardContent className="flex flex-1 flex-col p-4">
                                                <div className="mb-2">
                                                    {event.status === 'live' ? (
                                                        <Badge variant="default" className="mb-2 bg-green-500 hover:bg-green-600 border-green-500">En Vivo Ahora</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="mb-2">Proximamente</Badge>
                                                    )}
                                                </div>
                                                <h3 className="line-clamp-2 font-semibold">{event.title}</h3>
                                                <p className="mt-auto flex items-center gap-1 pt-4 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatEventDate(event.start_time)}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {pastEvents.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-muted-foreground">Eventos Anteriores (Archivados)</h2>
                            <div className="grid gap-4 sm:grid-cols-2 opacity-80">
                                {pastEvents.map((event: any) => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <Card className="flex h-full cursor-pointer flex-col transition-colors hover:border-primary/50">
                                            <CardContent className="flex flex-1 flex-col p-4">
                                                <div className="mb-2">
                                                    <Badge variant="outline" className="mb-2">Finalizado</Badge>
                                                </div>
                                                <h3 className="line-clamp-2 font-semibold">{event.title}</h3>
                                                <p className="mt-auto flex items-center gap-1 pt-4 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatEventDate(event.start_time)}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="space-y-6">
                    {speaker.credentials && speaker.credentials.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Award className="h-5 w-5 text-primary" />
                                    Credenciales
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {speaker.credentials.map((cred, i) => (
                                        <li key={i} className="flex gap-3 text-sm">
                                            <div className="mt-0.5 text-primary">-</div>
                                            <span className="text-muted-foreground">{cred}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {speaker.formations && speaker.formations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    Formacion
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {speaker.formations.map((form, i) => (
                                        <li key={i} className="flex gap-3 text-sm">
                                            <div className="mt-0.5 text-primary">-</div>
                                            <span className="text-muted-foreground">{form}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

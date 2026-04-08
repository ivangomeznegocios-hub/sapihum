import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSpeakerById, getSpeakerEvents } from '@/lib/supabase/queries/speakers'
import { getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isEventPast } from '@/lib/timezone'
import {
    ArrowLeft,
    Mic2,
    Globe,
    Linkedin,
    Twitter,
    Instagram,
    GraduationCap,
    Award,
    Sparkles,
    Calendar,
    Edit
} from 'lucide-react'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function SpeakerDetailPage({ params }: PageProps) {
    const { id } = await params
    const speaker = await getSpeakerById(id)
    const currentUser = await getUserProfile()

    if (!speaker) {
        notFound()
    }

    const events = await getSpeakerEvents(id)
    // Use date-based split: events with past dates go to pastEvents even if status is 'upcoming'
    const upcomingEvents = events.filter((e: any) => {
        if (e.status === 'completed' || e.status === 'cancelled') return false
        if (e.status === 'live') return true
        return !isEventPast(e.start_time)
    })
    const pastEvents = events.filter((e: any) => {
        if (e.status === 'completed') return true
        if (e.status === 'cancelled') return false
        return e.status === 'upcoming' && isEventPast(e.start_time)
    })

    const socialLinks = speaker.social_links || {}

    return (
        <div className="space-y-8">
            {/* Nav area */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/speakers">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a Ponentes
                    </Link>
                </Button>

                {(currentUser?.role === 'admin' || currentUser?.id === speaker.id) && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/admin/speakers/${id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Ponente
                        </Link>
                    </Button>
                )}
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-background border">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary-rgb),0.1),transparent_70%)]" />
                <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center md:items-start">
                    {/* Photo */}
                    <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-background shadow-xl flex-shrink-0">
                        {speaker.photo_url ? (
                            <Image
                                src={speaker.photo_url}
                                alt={speaker.profile?.full_name || 'Ponente'}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 160px, 192px"
                            />
                        ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <Mic2 className="h-16 w-16 text-primary/40" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                {speaker.profile?.full_name || 'Ponente'}
                            </h1>
                            {speaker.headline && (
                                <p className="text-lg text-primary font-medium mt-1">
                                    {speaker.headline}
                                </p>
                            )}
                        </div>

                        {/* Specialties */}
                        {speaker.specialties && speaker.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {speaker.specialties.map((spec, i) => (
                                    <Badge key={i} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        {spec}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Social Links */}
                        <div className="flex gap-3 justify-center md:justify-start pt-2">
                            {socialLinks.website && (
                                <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border bg-background hover:bg-muted transition-colors" title="Sitio Web">
                                    <Globe className="h-5 w-5" />
                                </a>
                            )}
                            {socialLinks.linkedin && (
                                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border bg-background hover:bg-muted transition-colors" title="LinkedIn">
                                    <Linkedin className="h-5 w-5" />
                                </a>
                            )}
                            {socialLinks.twitter && (
                                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border bg-background hover:bg-muted transition-colors" title="Twitter / X">
                                    <Twitter className="h-5 w-5" />
                                </a>
                            )}
                            {socialLinks.instagram && (
                                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border bg-background hover:bg-muted transition-colors" title="Instagram">
                                    <Instagram className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bio */}
                    {speaker.bio && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Sobre {speaker.profile?.full_name?.split(' ')[0] || 'el Ponente'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    {speaker.bio.split('\n').map((paragraph, i) => (
                                        <p key={i}>{paragraph}</p>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Upcoming Events */}
                    {upcomingEvents.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Próximos Eventos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {upcomingEvents.map((event: any) => (
                                    <Link key={event.id} href={`/dashboard/events/${event.id}`} className="block">
                                        <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                            {event.image_url && (
                                                <Image
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    width={64}
                                                    height={48}
                                                    className="rounded-md object-cover"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate">{event.title}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(event.start_time).toLocaleDateString('es-MX', {
                                                        day: 'numeric', month: 'long', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <Badge variant="default" className="text-xs shrink-0">Próximo</Badge>
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Past Events */}
                    {pastEvents.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    Eventos Pasados
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {pastEvents.slice(0, 5).map((event: any) => (
                                    <Link key={event.id} href={`/dashboard/events/${event.id}`} className="block">
                                        <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                            {event.image_url && (
                                                <Image
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    width={64}
                                                    height={48}
                                                    className="rounded-md object-cover"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate">{event.title}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(event.start_time).toLocaleDateString('es-MX', {
                                                        day: 'numeric', month: 'long', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            {event.recording_url && (
                                                <Badge variant="secondary" className="text-xs shrink-0">Grabación</Badge>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Credentials */}
                    {speaker.credentials && speaker.credentials.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    Credenciales
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {speaker.credentials.map((cred, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <Award className="h-4 w-4 text-brand-yellow mt-0.5 shrink-0" />
                                            <span>{cred}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Formations */}
                    {speaker.formations && speaker.formations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-brand-brown" />
                                    Formaciones
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {speaker.formations.map((formation, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <Sparkles className="h-4 w-4 text-brand-brown mt-0.5 shrink-0" />
                                            <span>{formation}</span>
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

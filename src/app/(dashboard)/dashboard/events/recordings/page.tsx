import { getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecordingCountdown, RecordingCardWrapper } from './recording-countdown'
import { getMyReplayAccessibleEvents } from '@/lib/supabase/queries/event-entitlements'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
    Play,
    Calendar,
    Clock,
    Video,
    Infinity as InfinityIcon
} from 'lucide-react'

export default async function RecordingsPage() {
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/compras/recuperar?next=/dashboard/events/recordings')
    }

    const now = new Date()
    const accessibleEvents = await getMyReplayAccessibleEvents()
    const accessibleRecordings = accessibleEvents
        .map((row: any) => row.event)
        .filter((event: any) => {
            if (!event?.recording_url) return false
            if (event.status !== 'completed') return false
            if (event.recording_expires_at && new Date(event.recording_expires_at) <= now) return false
            return true
        })
        .sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const getDaysRemaining = (expiresAt: string | null) => {
        if (!expiresAt) return null
        const expires = new Date(expiresAt)
        const diffMs = expires.getTime() - now.getTime()
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        return days
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Play className="h-8 w-8" />
                    Mis Grabaciones
                </h1>
                <p className="text-muted-foreground mt-1">
                    Accede a las grabaciones de los eventos que asististe
                </p>
            </div>

            {/* Info Notice */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <Video className="h-6 w-6 text-blue-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300">Solo eventos inscritos</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                Aquí aparecen las grabaciones de los eventos en los que te inscribiste.
                                Las grabaciones pueden tardar hasta 24 horas después del evento.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recordings Grid */}
            {accessibleRecordings.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="font-semibold mb-2">No hay grabaciones disponibles</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            Las grabaciones de eventos aparecerán aquí después de que finalicen.
                        </p>
                        <Link href="/dashboard/events">
                            <Button>Ver eventos próximos</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {accessibleRecordings.map((event: any) => {
                        const daysRemaining = getDaysRemaining(event.recording_expires_at)
                        const isExpiringSoon = daysRemaining !== null && daysRemaining <= 5

                        return (
                            <RecordingCardWrapper key={event.id} expiresAt={event.recording_expires_at}>
                                <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 to-primary/20">
                                        {event.image_url ? (
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Play className="h-12 w-12 text-primary/50" />
                                            </div>
                                        )}

                                        {/* Play overlay */}
                                <Link href={`/hub/${event.slug}`} className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                                                <Play className="h-8 w-8 text-primary ml-1" />
                                            </div>
                                        </Link>

                                        {/* Expiration badge - more prominent */}
                                        {isExpiringSoon && (
                                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-red-600/90 to-transparent p-3">
                                                <div className="flex items-center justify-center gap-2 text-white text-sm font-medium">
                                                    <Clock className="h-4 w-4 animate-pulse" />
                                                    <span>¡Expira pronto!</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <CardHeader className="pb-2">
                                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                                            {event.title}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(event.start_time)}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            {/* Countdown Timer */}
                                            {event.recording_expires_at ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-muted-foreground">Expira:</span>
                                                    <RecordingCountdown expiresAt={event.recording_expires_at} />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-green-600 flex items-center gap-1">
                                                    <InfinityIcon className="h-3 w-3" />
                                                    Acceso permanente
                                                </span>
                                            )}

                                            <Link href={`/hub/${event.slug}`}>
                                                <Button size="sm">
                                                    <Play className="h-4 w-4 mr-1" />
                                                    Ver
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </RecordingCardWrapper>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

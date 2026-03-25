import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicEventPath } from '@/lib/events/public'

function formatEventDate(date: string) {
    return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date))
}

export function PublicCatalogCard({ event }: { event: any }) {
    const publicPath = getPublicEventPath(event)
    const priceLabel = Number(event.price || 0) > 0
        ? `$${Number(event.price).toFixed(2)} MXN`
        : 'Gratis'

    const badgeLabel = event.event_type === 'course'
        ? 'Curso'
        : event.event_type === 'on_demand' || (event.status === 'completed' && event.recording_url)
            ? 'Grabacion'
            : 'Evento'

    return (
        <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-lg">
            <Link href={publicPath} className="block">
                <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/15 via-primary/5 to-background">
                    {event.image_url ? (
                        <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                    ) : null}
                    <div className="absolute left-4 top-4 flex gap-2">
                        <Badge>{badgeLabel}</Badge>
                        {event.hero_badge ? <Badge variant="secondary">{event.hero_badge}</Badge> : null}
                    </div>
                </div>
            </Link>

            <CardHeader className="space-y-3">
                <div className="space-y-1">
                    <CardTitle className="line-clamp-2 text-xl">
                        <Link href={publicPath} className="hover:text-primary">
                            {event.title}
                        </Link>
                    </CardTitle>
                    {event.subtitle ? (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{event.subtitle}</p>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm text-muted-foreground">
                    <p>{formatEventDate(event.start_time)}</p>
                    {event.location ? <p>{event.location}</p> : null}
                    <p>{event.attendee_count || 0} accesos registrados</p>
                </div>

                {event.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
                ) : null}

                <div className="flex items-center justify-between border-t pt-4">
                    <span className="font-semibold text-primary">{priceLabel}</span>
                    <Link href={publicPath} className="text-sm font-medium text-foreground hover:text-primary">
                        Ver pagina
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

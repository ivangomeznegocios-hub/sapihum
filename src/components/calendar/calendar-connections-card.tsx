import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarCheck2, Link2, RefreshCcw, ShieldCheck } from 'lucide-react'
import { buildCalendarFeedUrl, type CalendarFeedScope } from '@/lib/calendar-feed'
import { getAppUrl } from '@/lib/config/app-url'
import { getGoogleCalendarConnectionState, isGoogleCalendarSyncAvailable } from '@/lib/calendar-sync'
import { disconnectGoogleCalendar, updateGoogleCalendarSelection } from '@/app/(dashboard)/dashboard/settings/actions'
import { CalendarFeedLinkField } from './calendar-feed-link-field'

function getScopeForRole(role: string): CalendarFeedScope {
    return role === 'ponente' ? 'speaker-events' : 'appointments'
}

function getFeedLabel(role: string) {
    return role === 'ponente' ? 'Feed privado de eventos' : 'Feed privado de citas'
}

function getRoleDescription(role: string) {
    return role === 'ponente'
        ? 'Funciona como Calendly: conectas tu cuenta de Google una vez y la plataforma respeta cursos, reuniones y compromisos externos antes de asignarte un nuevo evento.'
        : 'Funciona como Calendly: conectas tu cuenta de Google una vez y la plataforma respeta tu agenda externa antes de confirmar nuevas citas.'
}

export async function CalendarConnectionsCard({
    userId,
    role,
    calendarFeedToken,
}: {
    userId: string
    role: string
    calendarFeedToken: string | null | undefined
}) {
    if (!(await isGoogleCalendarSyncAvailable())) {
        return null
    }

    const { googleConfigured, integration, calendars } = await getGoogleCalendarConnectionState(userId)
    const canUseIcsFeed = role === 'psychologist' || role === 'ponente'
    const settingsAnchor = '/dashboard/settings?section=calendar#calendar-sync'
    const googleConnectHref = `/api/calendar/google/connect?next=${encodeURIComponent(settingsAnchor)}`
    const feedUrl = canUseIcsFeed && calendarFeedToken
        ? buildCalendarFeedUrl(getAppUrl(), calendarFeedToken, getScopeForRole(role))
        : null
    const isConnected = googleConfigured && integration?.status === 'connected'
    const needsAttention = googleConfigured && integration?.status === 'error'

    async function handleGoogleCalendarSelection(formData: FormData) {
        'use server'

        await updateGoogleCalendarSelection(formData)
    }

    async function handleGoogleCalendarDisconnect() {
        'use server'

        await disconnectGoogleCalendar()
    }

    return (
        <Card id="calendar-sync" className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Link2 className="h-5 w-5 text-primary" />
                    Sincronizar con Google Calendar
                </CardTitle>
                <CardDescription>
                    {googleConfigured
                        ? getRoleDescription(role)
                        : 'Aqui podras conectar tu cuenta de Google y sincronizar disponibilidad sin salir de la plataforma.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-2xl border bg-background/70 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="default">Google Calendar</Badge>
                                {!googleConfigured && (
                                    <Badge variant="outline">Disponible aqui</Badge>
                                )}
                                {isConnected && (
                                    <Badge variant="secondary">Conectado</Badge>
                                )}
                                {needsAttention && (
                                    <Badge variant="destructive">Requiere atencion</Badge>
                                )}
                                {!integration && (
                                    <Badge variant="outline">Sin conectar</Badge>
                                )}
                            </div>

                            {!googleConfigured ? (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        El boton principal vivira aqui. Cuando la conexion de Google este activa en este entorno, el usuario podra iniciar sesion y sincronizar su agenda desde este mismo panel.
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span className="rounded-full border bg-background px-3 py-1.5">1. Conectar Google</span>
                                        <span className="rounded-full border bg-background px-3 py-1.5">2. Iniciar sesion</span>
                                        <span className="rounded-full border bg-background px-3 py-1.5">3. Ver bloques en la agenda</span>
                                    </div>
                                </>
                            ) : isConnected ? (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Tu Google Calendar ya esta conectado. Los bloques ocupados se reflejan aqui y se usan para evitar dobles reservas.
                                    </p>
                                    {integration?.provider_account_label && (
                                        <p className="text-sm font-medium text-foreground">
                                            Cuenta vinculada: {integration.provider_account_label}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Inicia sesion con tu cuenta de Google desde aqui mismo. Al volver a la plataforma, tus horarios ocupados se usaran para bloquear cruces automaticamente.
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span className="rounded-full border bg-background px-3 py-1.5">1. Conectas tu cuenta</span>
                                        <span className="rounded-full border bg-background px-3 py-1.5">2. Eliges calendarios</span>
                                        <span className="rounded-full border bg-background px-3 py-1.5">3. La agenda evita cruces</span>
                                    </div>
                                </>
                            )}

                            {integration?.last_error && (
                                <p className="text-sm text-destructive">
                                    {integration.last_error}
                                </p>
                            )}
                        </div>

                        {!googleConfigured ? (
                            <Button type="button" disabled>
                                <CalendarCheck2 className="mr-2 h-4 w-4" />
                                Conectar Google Calendar
                            </Button>
                        ) : isConnected || needsAttention ? (
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button asChild variant="outline">
                                    <a href={googleConnectHref}>
                                        <RefreshCcw className="mr-2 h-4 w-4" />
                                        Reconectar
                                    </a>
                                </Button>
                                <form action={handleGoogleCalendarDisconnect}>
                                    <Button type="submit" variant="outline" className="w-full sm:w-auto">
                                        Desconectar
                                    </Button>
                                </form>
                            </div>
                        ) : (
                            <Button asChild>
                                <a href={googleConnectHref}>
                                    <CalendarCheck2 className="mr-2 h-4 w-4" />
                                    Conectar Google Calendar
                                </a>
                            </Button>
                        )}
                    </div>

                    {googleConfigured && integration && calendars.length > 0 && (
                        <form action={handleGoogleCalendarSelection} className="mt-5 space-y-4">
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    Calendarios que se revisaran para evitar cruces
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Marca los calendarios que quieras tener en cuenta dentro de la plataforma.
                                </p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {calendars.map((calendar) => (
                                    <label
                                        key={calendar.id}
                                        className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card px-3 py-3 transition-colors hover:bg-accent/30"
                                    >
                                        <input
                                            type="checkbox"
                                            name="calendarIds"
                                            value={calendar.id}
                                            defaultChecked={calendar.selected}
                                            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="truncate text-sm font-medium text-foreground">
                                                    {calendar.summary}
                                                </span>
                                                {calendar.primary && (
                                                    <Badge variant="outline">Principal</Badge>
                                                )}
                                            </div>
                                            {calendar.description && (
                                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                    {calendar.description}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <Button type="submit">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Guardar calendarios
                            </Button>
                        </form>
                    )}
                </div>

                {feedUrl && (
                    <details className="rounded-2xl border bg-background/50 p-4">
                        <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                            Opciones avanzadas para Apple Calendar u Outlook
                        </summary>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Esto es opcional. Solo sirve si tambien quieres ver la agenda de la plataforma fuera de Google Calendar.
                        </p>

                        <div className="mt-4 space-y-4">
                            <CalendarFeedLinkField label={getFeedLabel(role)} feedUrl={feedUrl} />

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl border bg-card p-3">
                                    <p className="text-sm font-medium text-foreground">Google Calendar</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Puedes suscribirte por URL si quieres una copia visible de esta agenda en otra cuenta.
                                    </p>
                                </div>
                                <div className="rounded-xl border bg-card p-3">
                                    <p className="text-sm font-medium text-foreground">Apple Calendar</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Usa Suscribirse a calendario y pega este feed privado.
                                    </p>
                                </div>
                                <div className="rounded-xl border bg-card p-3">
                                    <p className="text-sm font-medium text-foreground">Outlook</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Agrega un calendario desde la web con esta misma URL.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </details>
                )}
            </CardContent>
        </Card>
    )
}

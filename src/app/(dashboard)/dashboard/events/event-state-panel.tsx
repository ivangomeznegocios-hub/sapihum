'use client'

import Link from 'next/link'
import { AlertTriangle, CalendarOff, Lock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type EventStateVariant = 'not-found' | 'restricted' | 'load-error' | 'empty-list'

interface EventStatePanelProps {
    variant: EventStateVariant
    title?: string
    description?: string
    primaryHref?: string
    primaryLabel?: string
    secondaryHref?: string
    secondaryLabel?: string
    onRetry?: () => void
    className?: string
}

const EVENT_STATE_COPY: Record<EventStateVariant, {
    title: string
    description: string
    primaryLabel: string
    primaryHref: string
    secondaryLabel?: string
    secondaryHref?: string
}> = {
    'not-found': {
        title: 'Este evento ya no esta disponible',
        description: 'Puede haber sido archivado, cancelado o movido a otra seccion del catalogo.',
        primaryLabel: 'Ver eventos disponibles',
        primaryHref: '/dashboard/events',
        secondaryLabel: 'Ir al dashboard',
        secondaryHref: '/dashboard',
    },
    restricted: {
        title: 'Tu perfil aun no tiene acceso a este evento',
        description: 'Puedes seguir explorando el catalogo o actualizar tu membresia para desbloquear mas eventos.',
        primaryLabel: 'Actualizar membresia',
        primaryHref: '/dashboard/subscription',
        secondaryLabel: 'Ver eventos disponibles',
        secondaryHref: '/dashboard/events',
    },
    'load-error': {
        title: 'No pudimos cargar los eventos',
        description: 'Hubo un problema temporal al consultar la informacion. Intenta de nuevo en unos segundos.',
        primaryLabel: 'Reintentar',
        primaryHref: '/dashboard/events',
        secondaryLabel: 'Ir al dashboard',
        secondaryHref: '/dashboard',
    },
    'empty-list': {
        title: 'Aun no hay eventos disponibles para tu perfil',
        description: 'Cuando se publiquen eventos para tu vertical o membresia apareceran aqui.',
        primaryLabel: 'Ir al dashboard',
        primaryHref: '/dashboard',
    },
}

const EVENT_STATE_ICON: Record<EventStateVariant, typeof CalendarOff> = {
    'not-found': CalendarOff,
    restricted: Lock,
    'load-error': AlertTriangle,
    'empty-list': CalendarOff,
}

export function EventStatePanel({
    variant,
    title,
    description,
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
    onRetry,
    className,
}: EventStatePanelProps) {
    const copy = EVENT_STATE_COPY[variant]
    const Icon = EVENT_STATE_ICON[variant]
    const resolvedPrimaryLabel = primaryLabel ?? copy.primaryLabel
    const resolvedPrimaryHref = primaryHref ?? copy.primaryHref
    const resolvedSecondaryLabel = secondaryLabel ?? copy.secondaryLabel
    const resolvedSecondaryHref = secondaryHref ?? copy.secondaryHref

    return (
        <Card className={className}>
            <CardContent className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-foreground">
                    {title ?? copy.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {description ?? copy.description}
                </p>
                <div className="mt-7 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                    {onRetry ? (
                        <Button type="button" onClick={onRetry} className="gap-2">
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            {resolvedPrimaryLabel}
                        </Button>
                    ) : (
                        <Button asChild>
                            <Link href={resolvedPrimaryHref}>{resolvedPrimaryLabel}</Link>
                        </Button>
                    )}
                    {resolvedSecondaryHref && resolvedSecondaryLabel ? (
                        <Button asChild variant="outline">
                            <Link href={resolvedSecondaryHref}>{resolvedSecondaryLabel}</Link>
                        </Button>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    )
}

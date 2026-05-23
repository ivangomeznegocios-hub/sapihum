'use client'

import { useEffect } from 'react'
import { EventStatePanel } from '../event-state-panel'

export default function EventDetailError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[Events] Detail route failed', {
            message: error.message,
            digest: error.digest,
        })
    }, [error])

    return (
        <div className="space-y-8">
            <EventStatePanel
                variant="load-error"
                title="No pudimos cargar el evento"
                description="La informacion del evento no esta disponible en este momento. Intenta de nuevo o vuelve al catalogo."
                onRetry={reset}
                secondaryHref="/dashboard/events"
                secondaryLabel="Ver eventos disponibles"
            />
        </div>
    )
}

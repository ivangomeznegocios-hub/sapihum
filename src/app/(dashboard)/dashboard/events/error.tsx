'use client'

import { useEffect } from 'react'
import { EventStatePanel } from './event-state-panel'

export default function EventsError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[Events] List route failed', {
            message: error.message,
            digest: error.digest,
        })
    }, [error])

    return (
        <div className="space-y-8">
            <EventStatePanel variant="load-error" onRetry={reset} />
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface CountdownTimerProps {
    expiresAt: string
    onExpired?: () => void
}

/**
 * Countdown timer that shows time remaining until recording expires.
 * Displays real-time countdown and can trigger a callback when expired.
 */
export function RecordingCountdown({ expiresAt, onExpired }: CountdownTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<{
        days: number
        hours: number
        minutes: number
        seconds: number
        isExpired: boolean
    } | null>(null)

    useEffect(() => {
        function calculateTime() {
            const now = new Date()
            const expires = new Date(expiresAt)
            const diffMs = expires.getTime() - now.getTime()

            if (diffMs <= 0) {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
                onExpired?.()
                return
            }

            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

            setTimeRemaining({ days, hours, minutes, seconds, isExpired: false })
        }

        calculateTime()
        const interval = setInterval(calculateTime, 1000)

        return () => clearInterval(interval)
    }, [expiresAt, onExpired])

    if (!timeRemaining) return null
    if (timeRemaining.isExpired) {
        return (
            <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>Expirado</span>
            </div>
        )
    }

    const { days, hours, minutes, seconds } = timeRemaining
    const isUrgent = days === 0 && hours < 24
    const isCritical = days === 0 && hours < 6

    // Format display based on time remaining
    let display: string
    if (days > 0) {
        display = `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
        display = `${hours}h ${minutes}m ${seconds}s`
    } else {
        display = `${minutes}m ${seconds}s`
    }

    return (
        <div className={`flex items-center gap-1.5 text-sm font-medium ${isCritical ? 'text-red-600 animate-pulse' :
                isUrgent ? 'text-brand-yellow' :
                    'text-muted-foreground'
            }`}>
            <Clock className="h-3.5 w-3.5" />
            <span>{display}</span>
        </div>
    )
}

interface RecordingCardWrapperProps {
    expiresAt: string | null
    children: React.ReactNode
}

/**
 * Wrapper component that hides the recording card when it expires.
 * Used to dynamically remove recordings from the list when they expire.
 */
export function RecordingCardWrapper({ expiresAt, children }: RecordingCardWrapperProps) {
    const [isExpired, setIsExpired] = useState(false)

    // Check initial state
    useEffect(() => {
        if (expiresAt) {
            const now = new Date()
            const expires = new Date(expiresAt)
            if (expires <= now) {
                setIsExpired(true)
            }
        }
    }, [expiresAt])

    if (isExpired) {
        return null // Hide the card when expired
    }

    return <>{children}</>
}

'use client'

import { useState } from 'react'
import { AlertCircle, Check, Loader2, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleGoogleCalendarSyncFeature } from './actions'

export function GoogleCalendarSyncToggle({
    currentValue,
    oauthConfigured,
}: {
    currentValue: boolean
    oauthConfigured: boolean
}) {
    const [enabled, setEnabled] = useState(currentValue)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    async function handleToggle() {
        if (!oauthConfigured && !enabled) {
            setMessage({
                type: 'error',
                text: 'Primero configura OAuth de Google en el entorno antes de activarlo para usuarios.',
            })
            return
        }

        setIsLoading(true)
        setMessage(null)

        const nextValue = !enabled
        const result = await toggleGoogleCalendarSyncFeature(nextValue)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setEnabled(nextValue)
            setMessage({
                type: 'success',
                text: nextValue
                    ? 'La sincronizacion ya quedo visible para usuarios.'
                    : 'La sincronizacion quedo oculta para usuarios.',
            })
        }

        setIsLoading(false)
    }

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
            <Power className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Google Calendar para usuarios</p>
                <p className="text-xs text-muted-foreground">
                    {enabled
                        ? 'Activo: psicologos y ponentes ya pueden ver y usar la sincronizacion.'
                        : 'Oculto: nadie ve la sincronizacion en su agenda ni en configuracion.'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    OAuth en entorno: {oauthConfigured ? 'listo' : 'pendiente'}
                </p>
                {message && (
                    <p className={`mt-2 flex items-center gap-1 text-xs ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                        {message.type === 'error' ? <AlertCircle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        {message.text}
                    </p>
                )}
            </div>
            <Button
                size="sm"
                variant={enabled ? 'default' : 'outline'}
                onClick={handleToggle}
                disabled={isLoading || (!oauthConfigured && !enabled)}
                className="h-8 w-full gap-1 sm:w-auto"
            >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : enabled ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                {enabled ? 'Desactivar' : 'Activar'}
            </Button>
        </div>
    )
}

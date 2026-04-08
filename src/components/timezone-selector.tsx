'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TIMEZONE_OPTIONS, DEFAULT_TIMEZONE, getTimezoneLabel } from '@/lib/timezone'
import { Globe, Check, Loader2 } from 'lucide-react'

interface TimezoneSelectorProps {
    currentTimezone?: string
    userId: string
}

export function TimezoneSelector({ currentTimezone }: TimezoneSelectorProps) {
    const router = useRouter()
    const [timezone, setTimezone] = useState(currentTimezone || DEFAULT_TIMEZONE)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    async function handleSave() {
        setSaving(true)
        try {
            const res = await fetch('/api/profile/timezone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timezone }),
            })
            if (res.ok) {
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
                router.refresh()
            }
        } finally {
            setSaving(false)
        }
    }

    const hasChanged = timezone !== (currentTimezone || DEFAULT_TIMEZONE)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Zona Horaria
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Los horarios de eventos se mostrarán en tu zona horaria seleccionada.
                </p>
                <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                >
                    {TIMEZONE_OPTIONS.map(tz => (
                        <option key={tz.value} value={tz.value}>
                            {tz.label}
                        </option>
                    ))}
                </select>

                {hasChanged && (
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full"
                        size="sm"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : saved ? (
                            <Check className="h-4 w-4 mr-2" />
                        ) : null}
                        {saved ? 'Guardado' : 'Guardar zona horaria'}
                    </Button>
                )}

                {!hasChanged && (
                    <p className="text-xs text-muted-foreground text-center">
                        Zona actual: {getTimezoneLabel(timezone)}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

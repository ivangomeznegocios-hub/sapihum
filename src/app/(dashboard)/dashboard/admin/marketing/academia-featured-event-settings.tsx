'use client'

import { useMemo, useState, useTransition } from 'react'
import { CalendarDays, Loader2, Save, Sparkles } from 'lucide-react'
import { updateAcademiaFeaturedEventSettings } from './actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { AcademiaFeaturedEventMode } from '@/lib/academia/featured-event'

type EventOption = {
    id: string
    title: string
    slug: string
    status: string
    startLabel: string
    hasImage: boolean
}

type AcademiaFeaturedEventSettingsProps = {
    initialMode: AcademiaFeaturedEventMode
    initialManualEventId: string | null
    eventOptions: EventOption[]
}

const MODE_COPY: Record<AcademiaFeaturedEventMode, { label: string; description: string }> = {
    auto: {
        label: 'Automatico',
        description: 'Mantiene el criterio actual y toma el proximo evento destacado segun la logica de Academia.',
    },
    manual: {
        label: 'Manual con fallback',
        description: 'Tu eliges el evento destacado y, cuando ya pase, Academia vuelve automaticamente al siguiente evento elegible.',
    },
}

export function AcademiaFeaturedEventSettings({
    initialMode,
    initialManualEventId,
    eventOptions,
}: AcademiaFeaturedEventSettingsProps) {
    const [mode, setMode] = useState<AcademiaFeaturedEventMode>(initialMode)
    const [manualEventId, setManualEventId] = useState<string>(initialManualEventId ?? '__none__')
    const [query, setQuery] = useState('')
    const [isPending, startTransition] = useTransition()

    const filteredOptions = useMemo(() => {
        const term = query.trim().toLocaleLowerCase('es-MX')
        if (!term) return eventOptions

        return eventOptions.filter((event) =>
            event.title.toLocaleLowerCase('es-MX').includes(term) ||
            event.slug.toLocaleLowerCase('es-MX').includes(term)
        )
    }, [eventOptions, query])

    const selectedEvent = useMemo(
        () => eventOptions.find((event) => event.id === manualEventId) ?? null,
        [eventOptions, manualEventId]
    )

    const canSave = mode !== 'manual' || manualEventId !== '__none__'

    function handleSave() {
        startTransition(async () => {
            const result = await updateAcademiaFeaturedEventSettings({
                mode,
                manualEventId: mode === 'manual' && manualEventId !== '__none__' ? manualEventId : null,
            })

            if (!result.success) {
                alert(result.error)
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-brand-blue" />
                    Academia · Evento destacado
                </CardTitle>
                <CardDescription>
                    Elige manualmente que evento aparece destacado en <code>/academia</code>. Si ese evento ya paso, la pagina vuelve al siguiente automaticamente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                    <div className="space-y-2">
                        <Label>Modo de seleccion</Label>
                        <Select value={mode} onValueChange={(value) => setMode(value as AcademiaFeaturedEventMode)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un modo" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(MODE_COPY).map(([value, copy]) => (
                                    <SelectItem key={value} value={value}>
                                        {copy.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">{MODE_COPY[mode].description}</p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-muted/15 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Sparkles className="h-4 w-4 text-brand-blue" />
                            Vista previa de criterio
                        </div>

                        {mode === 'auto' ? (
                            <div className="mt-3 space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Academia seguira usando el criterio automatico actual y elegira el proximo evento elegible.
                                </p>
                                {eventOptions[0] ? (
                                    <Badge variant="outline">
                                        Proximo elegible: {eventOptions[0].title}
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">No hay eventos upcoming disponibles</Badge>
                                )}
                            </div>
                        ) : (
                            <div className="mt-3 space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    El evento manual se usa mientras siga upcoming/live. Cuando deje de aplicar, vuelve el criterio automatico.
                                </p>
                                {selectedEvent ? (
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">
                                            {selectedEvent.title}
                                        </Badge>
                                        <Badge variant="secondary">{selectedEvent.startLabel}</Badge>
                                    </div>
                                ) : (
                                    <Badge variant="secondary">Aun no has seleccionado un evento manual</Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <Label className="text-sm">Evento manual</Label>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Solo se listan eventos upcoming/live publicados que hoy pueden funcionar como destacado.
                            </p>
                        </div>
                        <div className="w-full md:w-80">
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Buscar por nombre o slug"
                            />
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
                        <div className="space-y-3 rounded-xl border border-border/80 bg-background/40 p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Seleccion actual</div>
                                <Badge variant={mode === 'manual' ? 'default' : 'secondary'}>
                                    {mode === 'manual' ? 'Manual' : 'Automatico'}
                                </Badge>
                            </div>

                            {selectedEvent ? (
                                <div className="rounded-xl border border-border/80 bg-background/50 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">{selectedEvent.title}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{selectedEvent.startLabel}</p>
                                        </div>
                                        {selectedEvent.hasImage && (
                                            <Badge variant="outline">Con imagen</Badge>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sin seleccion manual. Academia usara el criterio automatico.
                                </p>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setMode('auto')
                                    setManualEventId('__none__')
                                }}
                            >
                                Volver a automatico
                            </Button>
                        </div>

                        <div className="space-y-2 rounded-xl border border-border/80 bg-background/40 p-4">
                            <Label>Evento para destacar</Label>
                            <Select value={manualEventId} onValueChange={setManualEventId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un evento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sin evento manual</SelectItem>
                                    {filteredOptions.map((event) => (
                                        <SelectItem key={event.id} value={event.id}>
                                            {event.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="max-h-72 space-y-2 overflow-y-auto pt-2">
                                {filteredOptions.map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => {
                                            setMode('manual')
                                            setManualEventId(event.id)
                                        }}
                                        className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                                            manualEventId === event.id
                                                ? 'border-brand-blue bg-brand-blue/5'
                                                : 'border-border/80 bg-background/50 hover:bg-muted/30'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-medium">{event.title}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{event.startLabel}</p>
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                {event.hasImage && <Badge variant="outline">Imagen</Badge>}
                                                <Badge variant="secondary">{event.status}</Badge>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={!canSave || isPending} className="min-w-40">
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar ajuste
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

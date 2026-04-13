'use client'

import { useMemo, useState, useTransition } from 'react'
import { updateHomeFeaturedSpeakersSettings } from './actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowDown, ArrowUp, Loader2, Save, Shuffle, Sparkles, Star } from 'lucide-react'
import type { HomeFeaturedSpeakersMode } from '@/lib/home/featured-speakers-config'

type SpeakerOption = {
    id: string
    name: string
    headline: string | null
    meritScore: number
    credentialsCount: number
    formationsCount: number
    specialtiesCount: number
    hasPhoto: boolean
}

type HomeSpeakersSettingsProps = {
    initialMode: HomeFeaturedSpeakersMode
    initialManualSpeakerIds: string[]
    speakerOptions: SpeakerOption[]
}

const ROTATION_POOL_SIZE = 8

const MODE_COPY: Record<HomeFeaturedSpeakersMode, { label: string; description: string }> = {
    ranked: {
        label: 'Ranking automatico',
        description: 'Muestra a los perfiles publicos mejor evaluados por trayectoria y completitud.',
    },
    manual: {
        label: 'Destacados manuales',
        description: 'Tu eliges y ordenas exactamente los 4 ponentes que van en el home.',
    },
    rotating: {
        label: 'Rotacion aleatoria',
        description: 'Cada dia rota 4 ponentes entre los perfiles mejor preparados.',
    },
}

export function HomeSpeakersSettings({
    initialMode,
    initialManualSpeakerIds,
    speakerOptions,
}: HomeSpeakersSettingsProps) {
    const [mode, setMode] = useState<HomeFeaturedSpeakersMode>(initialMode)
    const [manualSpeakerIds, setManualSpeakerIds] = useState(initialManualSpeakerIds)
    const [query, setQuery] = useState('')
    const [isPending, startTransition] = useTransition()

    const speakerMap = useMemo(
        () => new Map(speakerOptions.map((speaker) => [speaker.id, speaker])),
        [speakerOptions]
    )

    const manualSpeakers = useMemo(
        () =>
            manualSpeakerIds
                .map((speakerId) => speakerMap.get(speakerId))
                .filter(Boolean) as SpeakerOption[],
        [manualSpeakerIds, speakerMap]
    )

    const rankedPreview = useMemo(() => speakerOptions.slice(0, 4), [speakerOptions])
    const rotatingPool = useMemo(
        () => speakerOptions.slice(0, Math.min(Math.max(4, ROTATION_POOL_SIZE), speakerOptions.length)),
        [speakerOptions]
    )

    const filteredSpeakers = useMemo(() => {
        const term = query.trim().toLocaleLowerCase('es-MX')
        if (!term) return speakerOptions

        return speakerOptions.filter((speaker) => {
            return (
                speaker.name.toLocaleLowerCase('es-MX').includes(term) ||
                speaker.headline?.toLocaleLowerCase('es-MX').includes(term)
            )
        })
    }, [query, speakerOptions])

    const canSave = mode !== 'manual' || manualSpeakerIds.length === 4

    function toggleManualSpeaker(speakerId: string) {
        setManualSpeakerIds((current) => {
            if (current.includes(speakerId)) {
                return current.filter((id) => id !== speakerId)
            }

            if (current.length >= 4) {
                return current
            }

            return [...current, speakerId]
        })
    }

    function moveManualSpeaker(speakerId: string, direction: -1 | 1) {
        setManualSpeakerIds((current) => {
            const index = current.indexOf(speakerId)
            if (index < 0) return current

            const nextIndex = index + direction
            if (nextIndex < 0 || nextIndex >= current.length) return current

            const reordered = [...current]
            ;[reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]]
            return reordered
        })
    }

    function handleSave() {
        startTransition(async () => {
            const result = await updateHomeFeaturedSpeakersSettings({
                mode,
                manualSpeakerIds,
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
                    <Star className="h-5 w-5 text-brand-yellow" />
                    Ponentes del Home
                </CardTitle>
                <CardDescription>
                    Controla como se eligen los docentes destacados en la landing principal.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                    <div className="space-y-2">
                        <Label>Modo de seleccion</Label>
                        <Select value={mode} onValueChange={(value) => setMode(value as HomeFeaturedSpeakersMode)}>
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
                            {mode === 'rotating' ? (
                                <Shuffle className="h-4 w-4 text-brand-yellow" />
                            ) : (
                                <Sparkles className="h-4 w-4 text-brand-yellow" />
                            )}
                            Vista previa de criterio
                        </div>

                        {mode === 'ranked' ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {rankedPreview.map((speaker, index) => (
                                    <Badge key={speaker.id} variant="outline">
                                        {index + 1}. {speaker.name}
                                    </Badge>
                                ))}
                            </div>
                        ) : null}

                        {mode === 'manual' ? (
                            <div className="mt-3 space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Selecciona exactamente 4 y ordénalos como quieres que aparezcan.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {manualSpeakers.length > 0 ? (
                                        manualSpeakers.map((speaker, index) => (
                                            <Badge key={speaker.id} variant="outline">
                                                {index + 1}. {speaker.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge variant="secondary">Sin seleccion manual todavia</Badge>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {mode === 'rotating' ? (
                            <div className="mt-3 space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    La rotacion diaria toma 4 ponentes dentro de este pool superior:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {rotatingPool.map((speaker) => (
                                        <Badge key={speaker.id} variant="outline">
                                            {speaker.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <Label className="text-sm">Seleccion manual</Label>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Puedes elegir hasta 4 perfiles publicos y reordenarlos.
                            </p>
                        </div>
                        <div className="w-full md:w-72">
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Buscar por nombre o titular"
                            />
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
                        <div className="space-y-3 rounded-xl border border-border/80 bg-background/40 p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Orden manual</div>
                                <Badge variant={manualSpeakerIds.length === 4 ? 'default' : 'secondary'}>
                                    {manualSpeakerIds.length}/4
                                </Badge>
                            </div>

                            {manualSpeakers.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Aun no has seleccionado ponentes manuales.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {manualSpeakers.map((speaker, index) => (
                                        <div
                                            key={speaker.id}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/50 px-3 py-2"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">
                                                    {index + 1}. {speaker.name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {speaker.headline || 'Sin titular publico'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => moveManualSpeaker(speaker.id, -1)}
                                                    disabled={index === 0 || isPending}
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => moveManualSpeaker(speaker.id, 1)}
                                                    disabled={index === manualSpeakers.length - 1 || isPending}
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleManualSpeaker(speaker.id)}
                                                    disabled={isPending}
                                                >
                                                    Quitar
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-border/80 bg-background/40">
                            <div className="border-b border-border/80 px-4 py-3">
                                <div className="text-sm font-medium">Ponentes publicos disponibles</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    El ranking mostrado aqui ya va del perfil mas fuerte al mas sencillo.
                                </p>
                            </div>
                            <div className="max-h-[30rem] overflow-y-auto">
                                {filteredSpeakers.length === 0 ? (
                                    <div className="px-4 py-6 text-sm text-muted-foreground">
                                        No hay coincidencias con esa busqueda.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/80">
                                        {filteredSpeakers.map((speaker) => {
                                            const selected = manualSpeakerIds.includes(speaker.id)
                                            const canSelect = selected || manualSpeakerIds.length < 4

                                            return (
                                                <label
                                                    key={speaker.id}
                                                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors ${
                                                        selected ? 'bg-primary/6' : 'hover:bg-muted/20'
                                                    }`}
                                                >
                                                    <Checkbox
                                                        checked={selected}
                                                        disabled={!canSelect || isPending}
                                                        onCheckedChange={() => toggleManualSpeaker(speaker.id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="min-w-0 flex-1 space-y-2">
                                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-medium">
                                                                    {speaker.name}
                                                                </div>
                                                                <div className="truncate text-xs text-muted-foreground">
                                                                    {speaker.headline || 'Sin titular publico'}
                                                                </div>
                                                            </div>
                                                            <Badge variant="outline">
                                                                Score {speaker.meritScore}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                                            <span>{speaker.credentialsCount} credenciales</span>
                                                            <span>{speaker.formationsCount} formaciones</span>
                                                            <span>{speaker.specialtiesCount} especialidades</span>
                                                            <span>{speaker.hasPhoto ? 'Con foto' : 'Sin foto'}</span>
                                                        </div>
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        {mode === 'manual'
                            ? 'El modo manual requiere 4 ponentes seleccionados para guardar.'
                            : 'Los cambios se reflejan en el home despues de revalidar la landing.'}
                    </p>
                    <Button onClick={handleSave} disabled={isPending || !canSave}>
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Guardar configuracion
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

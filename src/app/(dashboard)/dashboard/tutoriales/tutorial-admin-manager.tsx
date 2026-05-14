'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SpeakerTutorial } from '@/types/database'
import {
    createSpeakerTutorial,
    deleteSpeakerTutorial,
    updateSpeakerTutorial,
    type TutorialActionState,
} from './actions'

const initialState: TutorialActionState = {}

function ActionMessage({ state }: { state: TutorialActionState }) {
    if (state.error) {
        return <p className="text-sm font-medium text-red-600">{state.error}</p>
    }

    if (state.success) {
        return <p className="text-sm font-medium text-emerald-700">{state.success}</p>
    }

    return null
}

function TutorialFormFields({ tutorial }: { tutorial?: SpeakerTutorial }) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor={tutorial ? `title-${tutorial.id}` : 'title'}>Titulo</Label>
                <Input
                    id={tutorial ? `title-${tutorial.id}` : 'title'}
                    name="title"
                    defaultValue={tutorial?.title ?? ''}
                    placeholder="Ej: Como preparar tu landing de ponente"
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={tutorial ? `youtube-${tutorial.id}` : 'youtube'}>Enlace de YouTube</Label>
                <Input
                    id={tutorial ? `youtube-${tutorial.id}` : 'youtube'}
                    name="youtube_url"
                    type="url"
                    defaultValue={tutorial?.youtube_url ?? ''}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={tutorial ? `description-${tutorial.id}` : 'description'}>Descripcion</Label>
                <Textarea
                    id={tutorial ? `description-${tutorial.id}` : 'description'}
                    name="description"
                    defaultValue={tutorial?.description ?? ''}
                    placeholder="Explica brevemente para que sirve este tutorial."
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-end">
                <div className="grid gap-2">
                    <Label htmlFor={tutorial ? `sort-${tutorial.id}` : 'sort'}>Orden</Label>
                    <Input
                        id={tutorial ? `sort-${tutorial.id}` : 'sort'}
                        name="sort_order"
                        type="number"
                        defaultValue={tutorial?.sort_order ?? 0}
                    />
                </div>

                <label className="flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm">
                    <input
                        name="is_active"
                        type="checkbox"
                        defaultChecked={tutorial?.is_active ?? true}
                        className="h-4 w-4 rounded border-input"
                    />
                    Activo para ponentes
                </label>
            </div>
        </div>
    )
}

function CreateTutorialCard() {
    const formRef = useRef<HTMLFormElement>(null)
    const [state, formAction, isPending] = useActionState(createSpeakerTutorial, initialState)

    useEffect(() => {
        if (state.success) {
            formRef.current?.reset()
        }
    }, [state.success])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Agregar tutorial</CardTitle>
                <CardDescription>
                    Sube un enlace de YouTube para que todos los ponentes lo puedan consultar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form ref={formRef} action={formAction} className="space-y-4">
                    <TutorialFormFields />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <ActionMessage state={state} />
                        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                            {isPending ? 'Guardando...' : 'Crear tutorial'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

function EditTutorialCard({ tutorial }: { tutorial: SpeakerTutorial }) {
    const updateAction = updateSpeakerTutorial.bind(null, tutorial.id)
    const deleteAction = deleteSpeakerTutorial.bind(null, tutorial.id)
    const [state, formAction, isPending] = useActionState(updateAction, initialState)

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle className="text-base">{tutorial.title}</CardTitle>
                        <CardDescription>Video ID: {tutorial.youtube_video_id}</CardDescription>
                    </div>
                    <Badge variant={tutorial.is_active ? 'default' : 'secondary'}>
                        {tutorial.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="aspect-video overflow-hidden rounded-xl border bg-muted">
                    <iframe
                        src={`https://www.youtube.com/embed/${tutorial.youtube_video_id}`}
                        title={tutorial.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </div>

                <form action={formAction} className="space-y-4">
                    <TutorialFormFields tutorial={tutorial} />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <ActionMessage state={state} />
                        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                            {isPending ? 'Actualizando...' : 'Actualizar'}
                        </Button>
                    </div>
                </form>

                <form action={deleteAction}>
                    <Button type="submit" variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar tutorial
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export function TutorialAdminManager({ tutorials }: { tutorials: SpeakerTutorial[] }) {
    return (
        <div className="space-y-6">
            <CreateTutorialCard />

            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Tutoriales existentes</h2>
                    <p className="text-sm text-muted-foreground">
                        Edita el orden, cambia enlaces o desactiva videos sin borrarlos.
                    </p>
                </div>

                {tutorials.length > 0 ? (
                    <div className="grid gap-5 lg:grid-cols-2">
                        {tutorials.map((tutorial) => (
                            <EditTutorialCard key={tutorial.id} tutorial={tutorial} />
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Aun no hay tutoriales disponibles.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

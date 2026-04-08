'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createNewsletter, toggleNewsletterActive, deleteNewsletter } from './actions'

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function NewsletterManager({ newsletters }: { newsletters: any[] }) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleCreate(formData: FormData) {
        setIsLoading(true)
        setError(null)
        const result = await createNewsletter(formData)
        if (result.error) {
            setError(result.error)
        } else {
            setShowForm(false)
            router.refresh()
        }
        setIsLoading(false)
    }

    async function handleToggle(id: string, isActive: boolean) {
        const result = await toggleNewsletterActive(id, isActive)
        if (!result.error) router.refresh()
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este newsletter?')) return
        const result = await deleteNewsletter(id)
        if (!result.error) router.refresh()
    }

    const now = new Date()

    return (
        <div className="space-y-6">
            <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
                {showForm ? 'Cancelar' : '+ Crear Newsletter'}
            </Button>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Nuevo Newsletter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Título *</label>
                                <input name="title" required className="mt-1 w-full px-3 py-2 border rounded-lg bg-background" placeholder="Newsletter Marzo 2026" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Resumen</label>
                                <textarea name="summary" rows={2} className="mt-1 w-full px-3 py-2 border rounded-lg bg-background resize-none" placeholder="Breve resumen..." />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Contenido HTML *</label>
                                <textarea name="contentHtml" rows={10} required className="mt-1 w-full px-3 py-2 border rounded-lg bg-background font-mono text-sm" placeholder="<h2>Hola Comunidad</h2><p>...</p>" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Imagen de Portada (URL)</label>
                                <input name="coverImageUrl" type="url" className="mt-1 w-full px-3 py-2 border rounded-lg bg-background" placeholder="https://..." />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium">Mes *</label>
                                    <select name="month" defaultValue={now.getMonth() + 1} className="mt-1 w-full px-3 py-2 border rounded-lg bg-background">
                                        {MONTH_NAMES.map((name, i) => (
                                            <option key={i} value={i + 1}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Año *</label>
                                    <input name="year" type="number" defaultValue={now.getFullYear()} min={2024} className="mt-1 w-full px-3 py-2 border rounded-lg bg-background" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input name="isActive" type="checkbox" value="true" id="isActive" className="rounded" />
                                <label htmlFor="isActive" className="text-sm">Activar inmediatamente (desactiva el newsletter actual)</label>
                            </div>
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <Button type="submit" disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Newsletter'}</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Newsletter List */}
            <div className="space-y-3">
                {newsletters.map((nl: any) => (
                    <Card key={nl.id}>
                        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                                {nl.cover_image_url && (
                                    <div className="relative h-10 w-16 overflow-hidden rounded">
                                        <Image
                                            src={nl.cover_image_url}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold">{nl.title}</span>
                                        {nl.is_active && (
                                            <Badge className="bg-green-100 text-green-700 text-[10px]">ACTIVO</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {MONTH_NAMES[nl.month - 1]} {nl.year}
                                    </p>
                                </div>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggle(nl.id, !nl.is_active)}
                                    className="w-full sm:w-auto"
                                >
                                    {nl.is_active ? 'Desactivar' : 'Activar'}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(nl.id)}
                                    className="w-full sm:w-auto"
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {newsletters.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No hay newsletters creados</p>
                )}
            </div>
        </div>
    )
}

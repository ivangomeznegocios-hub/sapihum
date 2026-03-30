'use client'

import { Plus, Link2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MATERIAL_LINK_TYPE_OPTIONS } from '@/lib/material-links'
import type { MaterialLinkType } from '@/types/database'

export type EditableMaterialLink = {
    id: string
    title: string
    url: string
    type: MaterialLinkType
}

interface MaterialLinksEditorProps {
    items: EditableMaterialLink[]
    onChange: (items: EditableMaterialLink[]) => void
    helperText?: string
    emptyText?: string
}

function createEmptyMaterialLink(): EditableMaterialLink {
    return {
        id: crypto.randomUUID(),
        title: '',
        url: '',
        type: 'document',
    }
}

export function MaterialLinksEditor({
    items,
    onChange,
    helperText,
    emptyText = 'Todavia no has agregado materiales por enlace.',
}: MaterialLinksEditorProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <label className="text-sm font-medium">Materiales por enlace</label>
                    {helperText ? <p className="mt-1 text-xs text-muted-foreground">{helperText}</p> : null}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange([...items, createEmptyMaterialLink()])}
                >
                    <Plus className="mr-1 h-4 w-4" />
                    Agregar enlace
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                    {emptyText}
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={item.id} className="rounded-xl border bg-muted/20 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Link2 className="h-4 w-4 text-primary" />
                                    Material {index + 1}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => onChange(items.filter((current) => current.id !== item.id))}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Nombre del material</label>
                                    <input
                                        value={item.title}
                                        onChange={(event) => onChange(items.map((current) => (
                                            current.id === item.id
                                                ? { ...current, title: event.target.value }
                                                : current
                                        )))}
                                        placeholder="Ej: Presentacion clase 1"
                                        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                                    <select
                                        value={item.type}
                                        onChange={(event) => onChange(items.map((current) => (
                                            current.id === item.id
                                                ? { ...current, type: event.target.value as MaterialLinkType }
                                                : current
                                        )))}
                                        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    >
                                        {MATERIAL_LINK_TYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-3">
                                <label className="text-xs font-medium text-muted-foreground">URL del material</label>
                                <input
                                    type="url"
                                    value={item.url}
                                    onChange={(event) => onChange(items.map((current) => (
                                        current.id === item.id
                                            ? { ...current, url: event.target.value }
                                            : current
                                    )))}
                                    placeholder="https://drive.google.com/... o https://canva.com/..."
                                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

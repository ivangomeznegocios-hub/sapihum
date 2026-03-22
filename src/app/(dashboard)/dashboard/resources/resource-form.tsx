'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createResource, updateResource, deleteResource } from './actions'
import { Loader2, X, Pencil, Trash2, AlertTriangle, Link as LinkIcon, FileText, Video, Music, Wrench, Upload, Code2, Eye, EyeOff } from 'lucide-react'

interface ResourceFormProps {
    onClose?: () => void
    initialData?: any
    resourceId?: string
    isEmbedded?: boolean
    events?: { id: string; title: string; start_time: string }[]
    userRole?: string
}

const RESOURCE_TYPES = [
    { value: 'video', label: 'Video', icon: Video },
    { value: 'pdf', label: 'Documento PDF', icon: FileText },
    { value: 'audio', label: 'Audio', icon: Music },
    { value: 'link', label: 'Enlace Externo', icon: LinkIcon },
    { value: 'tool', label: 'Herramienta Interactiva', icon: Wrench },
]

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Público (Todos)' },
    { value: 'members_only', label: 'Solo Miembros' },
    { value: 'private', label: 'Privado (Solo asignados)' },
]

const CATEGORY_OPTIONS = [
    { value: 'general', label: 'General' },
    { value: 'guia', label: 'Guía' },
    { value: 'estudio', label: 'Estudio / Investigación' },
    { value: 'herramienta', label: 'Herramienta' },
    { value: 'plantilla', label: 'Plantilla' },
    { value: 'curso_material', label: 'Material de Curso' },
]

const AUDIENCE_OPTIONS = [
    { value: 'public', label: 'Público' },
    { value: 'psychologists', label: 'Psicólogos' },
    { value: 'patients', label: 'Pacientes' },
    { value: 'members', label: 'Miembros' },
]

export function ResourceForm({ onClose, initialData, resourceId, isEmbedded = false, events = [], userRole = 'admin' }: ResourceFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tags, setTags] = useState<string[]>(initialData?.tags || [])
    const [tagInput, setTagInput] = useState('')
    const [selectedType, setSelectedType] = useState(initialData?.type || 'link')
    const [htmlContent, setHtmlContent] = useState(initialData?.html_content || '')
    const [showPreview, setShowPreview] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedAudience, setSelectedAudience] = useState<string[]>(
        initialData?.target_audience || ['public']
    )

    function handleClose() {
        if (onClose) {
            onClose()
        } else {
            router.push('/dashboard/resources')
        }
    }

    function addTag() {
        const trimmed = tagInput.trim()
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed])
            setTagInput('')
        }
    }

    function removeTag(tag: string) {
        setTags(tags.filter(t => t !== tag))
    }

    function toggleAudience(value: string) {
        setSelectedAudience(prev => {
            if (prev.includes(value)) {
                const next = prev.filter(v => v !== value)
                return next.length > 0 ? next : ['public']
            }
            return [...prev, value]
        })
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)

        // Append tags
        formData.set('tags', tags.join(','))

        // Append audience values
        formData.delete('target_audience')
        selectedAudience.forEach(a => formData.append('target_audience', a))

        // For tool type, append html_content
        if (selectedType === 'tool') {
            formData.set('html_content', htmlContent)
        }

        let result;
        if (initialData && resourceId) {
            result = await updateResource(resourceId, formData)
        } else {
            result = await createResource(formData)
        }

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else if (result.success) {
            handleClose()
            router.refresh()
        } else {
            setIsLoading(false)
        }
    }

    const FormContent = () => (
        <div className="space-y-4">
            {/* Title */}
            <div>
                <label className="text-sm font-medium" htmlFor="title">
                    Título *
                </label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    defaultValue={initialData?.title}
                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                    placeholder="Título del recurso"
                />
            </div>

            {/* Description */}
            <div>
                <label className="text-sm font-medium" htmlFor="description">
                    Descripción
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={initialData?.description}
                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-background resize-none"
                    placeholder="Breve descripción..."
                />
            </div>

            {/* Type + Category */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium" htmlFor="type">
                        Tipo *
                    </label>
                    <select
                        id="type"
                        name="type"
                        required
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                    >
                        {RESOURCE_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium" htmlFor="category">
                        Categoría
                    </label>
                    <select
                        id="category"
                        name="category"
                        defaultValue={initialData?.category || 'general'}
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                    >
                        {CATEGORY_OPTIONS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Visibility + Expiration */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium" htmlFor="visibility">
                        Visibilidad *
                    </label>
                    <select
                        id="visibility"
                        name="visibility"
                        required
                        defaultValue={initialData?.visibility || 'public'}
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                    >
                        {VISIBILITY_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium" htmlFor="expires_at">
                        Fecha de expiración
                    </label>
                    <input
                        id="expires_at"
                        name="expires_at"
                        type="date"
                        defaultValue={initialData?.expires_at ? initialData.expires_at.split('T')[0] : ''}
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                    />
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Dejar vacío = sin expiración
                    </p>
                </div>
            </div>

            {/* URL (for non-tool types) */}
            {selectedType !== 'tool' && (
                <div>
                    <label className="text-sm font-medium" htmlFor="url">
                        URL del Recurso *
                    </label>
                    <input
                        id="url"
                        name="url"
                        type="url"
                        required
                        defaultValue={initialData?.url}
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Enlace al archivo (Drive, Dropbox, YouTube, etc.)
                    </p>
                </div>
            )}

            {/* HTML Editor (for tool type) */}
            {selectedType === 'tool' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Code2 className="h-4 w-4" />
                            Código HTML de la Herramienta *
                        </label>
                        <div className="flex gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs gap-1"
                            >
                                <Upload className="h-3 w-3" />
                                Subir .html
                            </Button>
                            <Button
                                type="button"
                                variant={showPreview ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-xs gap-1"
                            >
                                {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                {showPreview ? 'Editor' : 'Preview'}
                            </Button>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".html,.htm"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                const reader = new FileReader()
                                reader.onload = (ev) => {
                                    setHtmlContent(ev.target?.result as string || '')
                                }
                                reader.readAsText(file)
                            }
                        }}
                    />

                    {showPreview ? (
                        <div className="border rounded-lg overflow-hidden bg-white">
                            <div className="text-[10px] px-2 py-1 bg-muted text-muted-foreground border-b">
                                Vista previa
                            </div>
                            {htmlContent ? (
                                <iframe
                                    srcDoc={htmlContent}
                                    sandbox="allow-scripts allow-forms"
                                    className="w-full border-0"
                                    style={{ height: '400px' }}
                                    title="Preview"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                                    Escribe o sube HTML para ver la vista previa
                                </div>
                            )}
                        </div>
                    ) : (
                        <textarea
                            value={htmlContent}
                            onChange={(e) => setHtmlContent(e.target.value)}
                            rows={12}
                            className="w-full px-3 py-2 border rounded-lg bg-background font-mono text-xs leading-relaxed resize-y"
                            placeholder={`<!DOCTYPE html>
<html lang="es">
<head>
  <style>
    /* Tus estilos aquí */
  </style>
</head>
<body>
  <!-- Tu herramienta interactiva aquí -->
  <script>
    // Tu código JavaScript aquí
  </script>
</body>
</html>`}
                            spellCheck={false}
                        />
                    )}

                    <p className="text-[11px] text-muted-foreground">
                        💡 Pega tu HTML completo o sube un archivo .html. La herramienta se renderizará en un iframe seguro.
                        Puedes incluir CSS y JavaScript inline.
                    </p>

                    {/* Optional external URL for tools that also have an external link */}
                    <div>
                        <label className="text-sm font-medium" htmlFor="url">
                            URL externa (opcional)
                        </label>
                        <input
                            id="url"
                            name="url"
                            type="url"
                            defaultValue={initialData?.url !== '#interactive-tool' ? initialData?.url : ''}
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                            placeholder="https://... (dejar vacío si solo usas HTML inline)"
                        />
                    </div>
                </div>
            )}

            {/* Target Audience */}
            <div>
                <label className="text-sm font-medium">Audiencia objetivo</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                    {AUDIENCE_OPTIONS.map(a => (
                        <button
                            key={a.value}
                            type="button"
                            onClick={() => toggleAudience(a.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                selectedAudience.includes(a.value)
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-muted border-input'
                            }`}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="text-sm font-medium">Etiquetas</label>
                <div className="flex gap-2 mt-1">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                        className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm"
                        placeholder="Agregar etiqueta..."
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag} className="shrink-0">
                        +
                    </Button>
                </div>
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs gap-1">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Link to Event (optional) */}
            {events.length > 0 && (
                <div>
                    <label className="text-sm font-medium" htmlFor="event_id">
                        Vincular a evento (opcional)
                    </label>
                    <select
                        id="event_id"
                        name="event_id"
                        defaultValue={initialData?.event_id || ''}
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                    >
                        <option value="">Sin vincular</option>
                        {events.map(e => (
                            <option key={e.id} value={e.id}>
                                {e.title}
                            </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        El recurso se mostrará bloqueado hasta que inicie el evento
                    </p>
                </div>
            )}

            {/* Featured (admin only) */}
            {userRole === 'admin' && (
                <div className="flex items-center gap-2">
                    <input
                        id="is_featured"
                        name="is_featured"
                        type="checkbox"
                        value="true"
                        defaultChecked={initialData?.is_featured || false}
                        className="h-4 w-4 rounded border-input"
                    />
                    <label className="text-sm font-medium" htmlFor="is_featured">
                        ⭐ Recurso destacado
                    </label>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? 'Guardar Cambios' : 'Crear Recurso')}
                </Button>
            </div>
        </div>
    )

    if (isEmbedded) {
        return (
            <form action={handleSubmit}>
                <FormContent />
                {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            </form>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                <CardHeader className="flex flex-row items-center justify-between border-b py-4">
                    <CardTitle>{initialData ? 'Editar Recurso' : 'Nuevo Recurso'}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <form action={handleSubmit}>
                        <FormContent />
                        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export function EditResourceButton({ resource, events, userRole }: { resource: any, events?: any[], userRole?: string }) {
    const [showForm, setShowForm] = useState(false)

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(true)} title="Editar">
                <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Button>
            {showForm && (
                <ResourceForm
                    onClose={() => setShowForm(false)}
                    initialData={resource}
                    resourceId={resource.id}
                    events={events}
                    userRole={userRole}
                />
            )}
        </>
    )
}

export function DeleteResourceButton({ resourceId }: { resourceId: string }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    async function handleDelete() {
        setIsLoading(true)
        const result = await deleteResource(resourceId)
        if (result.success) {
            router.refresh()
            setShowConfirm(false)
        } else {
            alert('Error al eliminar recurso')
        }
        setIsLoading(false)
    }

    if (showConfirm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <Card className="max-w-sm w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600 text-lg">
                            <AlertTriangle className="h-5 w-5" />
                            ¿Eliminar recurso?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4 text-sm">
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowConfirm(false)} size="sm">
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isLoading} size="sm">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Button variant="ghost" size="icon" onClick={() => setShowConfirm(true)} title="Eliminar">
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
    )
}

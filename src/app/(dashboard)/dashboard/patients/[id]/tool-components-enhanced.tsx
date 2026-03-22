'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ToolPreviewSandbox } from '@/components/tools/tool-preview'
import {
    Search,
    Plus,
    Eye,
    EyeOff,
    Trash2,
    Clock,
    CheckCircle,
    Brain,
    X,
    Send,
    ChevronRight,
    BarChart3,
    Timer,
    Filter,
} from 'lucide-react'
import { assignToolAction, toggleVisibilityAction, deleteAssignmentAction } from './tools-actions'
import { getCategoryLabel, getStatusLabel, getStatusColor } from '@/lib/tools/tool-schema'

interface AssignToolModalProps {
    patientId: string
    tools: any[]
    onClose: () => void
}

export function AssignToolModal({ patientId, tools, onClose }: AssignToolModalProps) {
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [selectedTool, setSelectedTool] = useState<any>(null)
    const [instructions, setInstructions] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState<'search' | 'confirm'>('search')

    const categories = Array.from(new Set(tools.map((tool) => tool.category).filter(Boolean)))
    const filtered = tools.filter((tool) => {
        const query = search.trim().toLowerCase()
        const matchesSearch = !query ||
            tool.title.toLowerCase().includes(query) ||
            (tool.description || '').toLowerCase().includes(query) ||
            (tool.tags || []).some((tag: string) => tag.toLowerCase().includes(query)) ||
            (tool.schema?.metadata?.instructions || '').toLowerCase().includes(query)
        const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    async function handleAssign() {
        if (!selectedTool) return
        setIsSubmitting(true)

        const formData = new FormData()
        formData.set('toolId', selectedTool.id)
        formData.set('patientId', patientId)
        formData.set('instructions', instructions)
        formData.set('dueDate', dueDate)

        await assignToolAction(formData)
        setIsSubmitting(false)
        onClose()
    }

    const previewTool = selectedTool || filtered[0] || null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b p-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Brain className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold">
                                {step === 'search' ? 'Asignar Herramienta' : 'Confirmar Asignación'}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {step === 'search' ? 'Busca, filtra y prueba antes de asignar' : selectedTool?.title}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {step === 'search' ? (
                    <div className="grid min-h-0 flex-1 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
                            <div className="space-y-3 border-b p-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre, etiqueta o instrucción..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Filter className="h-3.5 w-3.5" />
                                    Filtra por categoría
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCategoryFilter('all')}
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                                    >
                                        Todas
                                    </button>
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setCategoryFilter(category)}
                                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${categoryFilter === category ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                                        >
                                            {getCategoryLabel(category)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 space-y-1 overflow-y-auto p-2">
                                {filtered.length === 0 ? (
                                    <div className="py-10 text-center text-muted-foreground">
                                        <Brain className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                        <p className="text-sm">No se encontraron herramientas</p>
                                    </div>
                                ) : (
                                    filtered.map((tool: any) => {
                                        const isSelected = selectedTool?.id === tool.id
                                        return (
                                            <button
                                                key={tool.id}
                                                type="button"
                                                onClick={() => setSelectedTool(tool)}
                                                className={`w-full rounded-xl border p-3 text-left transition-all hover:border-primary/30 hover:bg-accent/50 ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent'}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium">{tool.title}</p>
                                                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                            {tool.description || tool.schema?.metadata?.instructions}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                                {getCategoryLabel(tool.category)}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                                <Timer className="h-3 w-3" />
                                                                {tool.estimated_minutes || tool.schema?.metadata?.estimated_minutes || '?'} min
                                                            </span>
                                                            {tool.is_template && (
                                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                                                    Plantilla
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 transition-opacity ${isSelected ? 'opacity-100 text-primary' : 'opacity-40'}`} />
                                                </div>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-col">
                            <div className="border-b p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vista previa</p>
                                <p className="text-sm text-muted-foreground">Responde la herramienta aquí antes de asignarla.</p>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                                <ToolPreviewSandbox tool={previewTool} dense />
                            </div>
                            <div className="border-t p-4">
                                <Button
                                    onClick={() => {
                                        if (!previewTool) return
                                        setSelectedTool(previewTool)
                                        setStep('confirm')
                                    }}
                                    disabled={!previewTool}
                                    className="w-full gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Usar esta herramienta
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid min-h-0 flex-1 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
                            <div className="flex-1 space-y-4 overflow-y-auto p-4">
                                <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
                                    <p className="text-sm font-semibold">{selectedTool?.title}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {selectedTool?.description || selectedTool?.schema?.metadata?.instructions}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                            {getCategoryLabel(selectedTool?.category)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                            <Timer className="h-3 w-3" />
                                            {selectedTool?.estimated_minutes || selectedTool?.schema?.metadata?.estimated_minutes || '?'} min
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Instrucciones para el paciente (opcional)
                                    </label>
                                    <Textarea
                                        placeholder="Ej: Completa este test antes de nuestra próxima sesión..."
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        rows={4}
                                        className="text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Fecha límite (opcional)
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>

                            <div className="border-t p-4">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setStep('search')}
                                        className="flex-1"
                                    >
                                        Atrás
                                    </Button>
                                    <Button
                                        onClick={handleAssign}
                                        disabled={isSubmitting}
                                        className="flex-1 gap-2"
                                    >
                                        <Send className="h-4 w-4" />
                                        {isSubmitting ? 'Asignando...' : 'Asignar'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="min-h-0 overflow-y-auto p-4">
                            <ToolPreviewSandbox tool={selectedTool} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export function AssignToolButton({ patientId, tools }: { patientId: string; tools: any[] }) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Asignar Herramienta
            </Button>
            {open && (
                <AssignToolModal
                    patientId={patientId}
                    tools={tools}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    )
}

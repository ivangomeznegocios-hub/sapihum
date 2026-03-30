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
import { assignToolAction, createToolAction, toggleVisibilityAction, deleteAssignmentAction } from './tools-actions'
import { getCategoryLabel, getStatusLabel, getStatusColor } from '@/lib/tools/tool-schema'

interface AssignToolModalProps {
    patientId: string
    tools: any[]
    onClose: () => void
}

export function AssignToolModal({ patientId, tools, onClose }: AssignToolModalProps) {
    const [catalog, setCatalog] = useState(tools)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [selectedTool, setSelectedTool] = useState<any>(null)
    const [instructions, setInstructions] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isCreatingTool, setIsCreatingTool] = useState(false)
    const [showCreator, setShowCreator] = useState(false)
    const [creatorError, setCreatorError] = useState<string | null>(null)
    const [creatorTitle, setCreatorTitle] = useState('')
    const [creatorDescription, setCreatorDescription] = useState('')
    const [creatorCategory, setCreatorCategory] = useState('exercise')
    const [creatorMinutes, setCreatorMinutes] = useState('10')
    const [creatorInstructions, setCreatorInstructions] = useState('')
    const [step, setStep] = useState<'search' | 'confirm'>('search')

    const categories = Array.from(new Set(catalog.map((tool) => tool.category).filter(Boolean)))
    const filtered = catalog.filter((tool) => {
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

    async function handleCreateTool() {
        setIsCreatingTool(true)
        setCreatorError(null)

        const result = await createToolAction({
            title: creatorTitle,
            description: creatorDescription,
            category: creatorCategory,
            estimatedMinutes: Number(creatorMinutes || 10),
            instructions: creatorInstructions,
        })

        setIsCreatingTool(false)

        if (result.error || !result.tool) {
            setCreatorError(result.error || 'No fue posible crear la herramienta')
            return
        }

        setCatalog((current) => [result.tool, ...current])
        setSelectedTool(result.tool)
        setShowCreator(false)
        setCreatorTitle('')
        setCreatorDescription('')
        setCreatorCategory('exercise')
        setCreatorMinutes('10')
        setCreatorInstructions('')
        setStep('confirm')
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
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs text-muted-foreground">
                                        Busca una herramienta existente o crea un borrador rapido.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => setShowCreator((current) => !current)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {showCreator ? 'Cerrar creador' : 'Crear herramienta'}
                                    </Button>
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
                                {showCreator && (
                                    <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                    Titulo
                                                </label>
                                                <Input
                                                    value={creatorTitle}
                                                    onChange={(e) => setCreatorTitle(e.target.value)}
                                                    placeholder="Ej. Registro breve de emociones"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                    Descripcion
                                                </label>
                                                <Textarea
                                                    rows={2}
                                                    value={creatorDescription}
                                                    onChange={(e) => setCreatorDescription(e.target.value)}
                                                    placeholder="Que busca esta herramienta y cuando usarla"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                    Categoria
                                                </label>
                                                <select
                                                    value={creatorCategory}
                                                    onChange={(e) => setCreatorCategory(e.target.value)}
                                                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                >
                                                    {['exercise', 'task', 'questionnaire', 'scale', 'test'].map((category) => (
                                                        <option key={category} value={category}>
                                                            {getCategoryLabel(category)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                    Duracion (min)
                                                </label>
                                                <Input
                                                    type="number"
                                                    min={3}
                                                    max={60}
                                                    value={creatorMinutes}
                                                    onChange={(e) => setCreatorMinutes(e.target.value)}
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                    Instrucciones
                                                </label>
                                                <Textarea
                                                    rows={3}
                                                    value={creatorInstructions}
                                                    onChange={(e) => setCreatorInstructions(e.target.value)}
                                                    placeholder="Que debe hacer el paciente antes de enviarla"
                                                />
                                            </div>
                                        </div>
                                        {creatorError && (
                                            <p className="text-xs font-medium text-destructive">{creatorError}</p>
                                        )}
                                        <Button
                                            type="button"
                                            onClick={handleCreateTool}
                                            disabled={isCreatingTool}
                                            className="w-full gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {isCreatingTool ? 'Creando...' : 'Crear borrador y continuar'}
                                        </Button>
                                    </div>
                                )}
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
                                                                <span className="rounded-full bg-brand-brown px-2 py-0.5 text-[10px] font-medium text-brand-brown">
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

export function ToggleVisibilityButton({
    assignmentId,
    patientId,
    isVisible
}: {
    assignmentId: string
    patientId: string
    isVisible: boolean
}) {
    const [loading, setLoading] = useState(false)

    async function handleToggle() {
        setLoading(true)
        const formData = new FormData()
        formData.set('assignmentId', assignmentId)
        formData.set('visible', (!isVisible).toString())
        formData.set('patientId', patientId)
        await toggleVisibilityAction(formData)
        setLoading(false)
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={loading}
            className={`h-7 gap-1.5 text-xs ${isVisible
                ? 'text-green-700 hover:text-green-800'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            title={isVisible ? 'Ocultar resultados al paciente' : 'Mostrar resultados al paciente'}
        >
            {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {isVisible ? 'Visible' : 'Oculto'}
        </Button>
    )
}

export function DeleteAssignmentButton({
    assignmentId,
    patientId
}: {
    assignmentId: string
    patientId: string
}) {
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        if (!confirm('Estas seguro de eliminar esta asignacion?')) return
        setLoading(true)
        const formData = new FormData()
        formData.set('assignmentId', assignmentId)
        formData.set('patientId', patientId)
        await deleteAssignmentAction(formData)
        setLoading(false)
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            title="Eliminar asignacion"
        >
            <Trash2 className="h-3.5 w-3.5" />
        </Button>
    )
}

export function ToolResultsCard({ assignment }: { assignment: any }) {
    const tool = assignment.tool
    const response = assignment.response
    const scoring = tool?.schema?.scoring
    const scores = response?.scores

    if (!response || scores?.total === undefined) return null

    const interpretation = scoring?.ranges?.find((range: any) =>
        scores.total >= range.min && scores.total <= range.max
    )

    return (
        <div className="mt-3 rounded-lg border bg-muted/50 p-3">
            <div className="mb-2 flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">Resultados</span>
            </div>

            <div className="mb-2 flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${(scores.total / (scoring?.max_score || 100)) * 100}%`,
                            backgroundColor: interpretation?.color || '#6b7280'
                        }}
                    />
                </div>
                <span className="text-sm font-bold tabular-nums">
                    {scores.total}/{scoring?.max_score}
                </span>
            </div>

            {interpretation && (
                <div className="flex items-center gap-2">
                    <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: interpretation.color }}
                    />
                    <span className="text-xs font-medium">{interpretation.label}</span>
                </div>
            )}
            {interpretation?.description && (
                <p className="mt-1 text-xs text-muted-foreground">{interpretation.description}</p>
            )}

            <DetailedResponseView schema={tool.schema} responses={response.responses} />
        </div>
    )
}

function DetailedResponseView({ schema, responses }: { schema: any, responses: any }) {
    const [isOpen, setIsOpen] = useState(false)

    if (!responses) return null

    return (
        <div className="mt-3 border-t pt-2">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
                <ChevronRight className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                {isOpen ? 'Ocultar respuestas detalladas' : 'Ver respuestas detalladas'}
            </button>

            {isOpen && (
                <div className="mt-3 animate-in space-y-4 slide-in-from-top-2 fade-in duration-200">
                    {schema.sections.map((section: any) => (
                        <div key={section.id} className="space-y-2">
                            <h4 className="rounded bg-muted/50 p-1.5 text-xs font-semibold text-foreground/80">
                                {section.title}
                            </h4>
                            <div className="space-y-2 pl-2">
                                {section.questions.map((question: any) => {
                                    const value = responses[question.id]
                                    const isAnswered = value !== undefined && value !== null && value !== ''

                                    let displayValue = value
                                    if (question.options) {
                                        const option = question.options.find((item: any) => item.value == value)
                                        if (option) displayValue = `${option.label} (${value})`
                                    }

                                    return (
                                        <div key={question.id} className="border-l-2 border-muted py-0.5 pl-2 text-xs">
                                            <p className="mb-0.5 line-clamp-1 text-muted-foreground">{question.text}</p>
                                            <p className={`font-medium ${!isAnswered ? 'italic text-muted-foreground' : ''}`}>
                                                {isAnswered ? displayValue : 'Sin responder'}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export function ToolsTabContent({
    assignments,
    patientId,
    tools
}: {
    assignments: any[]
    patientId: string
    tools: any[]
}) {
    const pending = assignments.filter((assignment: any) => assignment.status === 'pending' || assignment.status === 'in_progress')
    const completed = assignments.filter((assignment: any) => assignment.status === 'completed')

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {assignments.length} herramientas asignadas
                </p>
                <AssignToolButton patientId={patientId} tools={tools} />
            </div>

            {assignments.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                        <p className="font-medium text-muted-foreground">
                            No hay herramientas asignadas
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Asigna tests, escalas o cuestionarios interactivos
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {pending.length > 0 && (
                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                Pendientes ({pending.length})
                            </h3>
                            <div className="space-y-3">
                                {pending.map((assignment: any) => (
                                    <Card key={assignment.id} className="transition-shadow hover:shadow-md">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <p className="truncate text-sm font-medium">
                                                            {assignment.tool?.title || 'Herramienta'}
                                                        </p>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(assignment.status)}`}>
                                                            {getStatusLabel(assignment.status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Timer className="h-3 w-3" />
                                                            {assignment.tool?.estimated_minutes || '?'} min
                                                        </span>
                                                        <span>
                                                            Asignado: {new Date(assignment.assigned_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                        {assignment.due_date && (
                                                            <span className="font-medium text-brand-yellow">
                                                                Limite: {new Date(assignment.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {assignment.instructions && (
                                                        <p className="mt-1.5 line-clamp-1 text-xs italic text-muted-foreground">
                                                            &quot;{assignment.instructions}&quot;
                                                        </p>
                                                    )}
                                                    {assignment.status === 'in_progress' && assignment.response?.progress > 0 && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                                                <div
                                                                    className="h-full rounded-full bg-brand-yellow transition-all"
                                                                    style={{ width: `${assignment.response.progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] tabular-nums text-muted-foreground">
                                                                {assignment.response.progress}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <DeleteAssignmentButton assignmentId={assignment.id} patientId={patientId} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {completed.length > 0 && (
                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Completados ({completed.length})
                            </h3>
                            <div className="space-y-3">
                                {completed.map((assignment: any) => (
                                    <Card key={assignment.id} className="transition-shadow hover:shadow-md">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <p className="truncate text-sm font-medium">
                                                            {assignment.tool?.title || 'Herramienta'}
                                                        </p>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(assignment.status)}`}>
                                                            {getStatusLabel(assignment.status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        {assignment.completed_at && (
                                                            <span>
                                                                Completado: {new Date(assignment.completed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ToolResultsCard assignment={assignment} />
                                                </div>
                                                <div className="ml-2 flex shrink-0 items-center gap-1">
                                                    <ToggleVisibilityButton
                                                        assignmentId={assignment.id}
                                                        patientId={patientId}
                                                        isVisible={assignment.results_visible}
                                                    />
                                                    <DeleteAssignmentButton assignmentId={assignment.id} patientId={patientId} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

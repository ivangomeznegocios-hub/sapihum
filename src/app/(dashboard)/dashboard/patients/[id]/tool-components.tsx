'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Search, Plus, Eye, EyeOff, Trash2, Clock,
    CheckCircle, Brain, X, Send,
    ChevronRight, BarChart3, Timer
} from 'lucide-react'
import { assignToolAction, toggleVisibilityAction, deleteAssignmentAction } from './tools-actions'
import { getCategoryLabel, getStatusLabel, getStatusColor } from '@/lib/tools/tool-schema'

// ============================================
// ASSIGN TOOL MODAL
// ============================================
interface AssignToolModalProps {
    patientId: string
    tools: any[]
    onClose: () => void
}

export function AssignToolModal({ patientId, tools, onClose }: AssignToolModalProps) {
    const [search, setSearch] = useState('')
    const [selectedTool, setSelectedTool] = useState<any>(null)
    const [instructions, setInstructions] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState<'search' | 'confirm'>('search')

    const filtered = tools.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.tags || []).some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
    )

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

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col border">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Brain className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm">
                                {step === 'search' ? 'Asignar Herramienta' : 'Confirmar Asignación'}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {step === 'search' ? 'Busca y selecciona una herramienta' : selectedTool?.title}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {step === 'search' ? (
                    <>
                        {/* Search */}
                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar test, escala, cuestionario..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Tools List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filtered.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No se encontraron herramientas</p>
                                </div>
                            ) : (
                                filtered.map((tool: any) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => { setSelectedTool(tool); setStep('confirm') }}
                                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{tool.title}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                    {tool.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                        {getCategoryLabel(tool.category)}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                        <Timer className="h-3 w-3" />
                                                        {tool.estimated_minutes} min
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Confirm Step */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Selected Tool Card */}
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <p className="font-semibold text-sm">{selectedTool?.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{selectedTool?.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                        {getCategoryLabel(selectedTool?.category)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                        <Timer className="h-3 w-3" />
                                        {selectedTool?.estimated_minutes} min
                                    </span>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                                    Instrucciones para el paciente (opcional)
                                </label>
                                <Textarea
                                    placeholder="Ej: Completa este test antes de nuestra próxima sesión..."
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    rows={3}
                                    className="text-sm"
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
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

                        {/* Actions */}
                        <div className="p-4 border-t flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => { setStep('search'); setSelectedTool(null) }}
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
                    </>
                )}
            </div>
        </div>
    )
}

// ============================================
// ASSIGN TOOL BUTTON
// ============================================
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

// ============================================
// TOGGLE VISIBILITY BUTTON
// ============================================
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
            className={`gap-1.5 text-xs h-7 ${isVisible
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

// ============================================
// DELETE ASSIGNMENT BUTTON
// ============================================
export function DeleteAssignmentButton({
    assignmentId,
    patientId
}: {
    assignmentId: string
    patientId: string
}) {
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        if (!confirm('¿Estás seguro de eliminar esta asignación?')) return
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
            className="text-destructive hover:text-destructive h-7 w-7 p-0"
            title="Eliminar asignación"
        >
            <Trash2 className="h-3.5 w-3.5" />
        </Button>
    )
}

// ============================================
// TOOL RESULTS CARD (Psychologist View)
// ============================================
export function ToolResultsCard({ assignment }: { assignment: any }) {
    const tool = assignment.tool
    const response = assignment.response
    const scoring = tool?.schema?.scoring
    const scores = response?.scores

    if (!response || !scores?.total === undefined) return null

    const interpretation = scoring?.ranges?.find((r: any) =>
        scores.total >= r.min && scores.total <= r.max
    )

    return (
        <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">Resultados</span>
            </div>

            {/* Score bar */}
            <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
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

            {/* Interpretation */}
            {interpretation && (
                <div className="flex items-center gap-2">
                    <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: interpretation.color }}
                    />
                    <span className="text-xs font-medium">{interpretation.label}</span>
                </div>
            )}
            {interpretation?.description && (
                <p className="text-xs text-muted-foreground mt-1">{interpretation.description}</p>
            )}

            {/* Detailed Responses Toggle */}
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
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
                <ChevronRight className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                {isOpen ? 'Ocultar respuestas detalladas' : 'Ver respuestas detalladas'}
            </button>

            {isOpen && (
                <div className="mt-3 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    {schema.sections.map((section: any) => (
                        <div key={section.id} className="space-y-2">
                            <h4 className="text-xs font-semibold text-foreground/80 bg-muted/50 p-1.5 rounded">
                                {section.title}
                            </h4>
                            <div className="space-y-2 pl-2">
                                {section.questions.map((question: any) => {
                                    const val = responses[question.id]
                                    const isAnswered = val !== undefined && val !== null && val !== ''

                                    // Helper to format value based on type
                                    let displayVal = val
                                    if (question.options) {
                                        const opt = question.options.find((o: any) => o.value == val) // Loose match
                                        if (opt) displayVal = `${opt.label} (${val})`
                                    }

                                    return (
                                        <div key={question.id} className="text-xs border-l-2 border-muted pl-2 py-0.5">
                                            <p className="text-muted-foreground mb-0.5 line-clamp-1">{question.text}</p>
                                            <p className={`font-medium ${!isAnswered ? 'text-muted-foreground italic' : ''}`}>
                                                {isAnswered ? displayVal : 'Sin responder'}
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

// ============================================
// TOOLS TAB CONTENT (for ClinicalTabs)
// ============================================
export function ToolsTabContent({
    assignments,
    patientId,
    tools
}: {
    assignments: any[]
    patientId: string
    tools: any[]
}) {
    const pending = assignments.filter((a: any) => a.status === 'pending' || a.status === 'in_progress')
    const completed = assignments.filter((a: any) => a.status === 'completed')

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    {assignments.length} herramientas asignadas
                </p>
                <AssignToolButton patientId={patientId} tools={tools} />
            </div>

            {assignments.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="font-medium text-muted-foreground">
                            No hay herramientas asignadas
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Asigna tests, escalas o cuestionarios interactivos
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Pending */}
                    {pending.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Pendientes ({pending.length})
                            </h3>
                            <div className="space-y-3">
                                {pending.map((assignment: any) => (
                                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-sm truncate">
                                                            {assignment.tool?.title || 'Herramienta'}
                                                        </p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(assignment.status)}`}>
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
                                                            <span className="text-brand-yellow font-medium">
                                                                Límite: {new Date(assignment.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {assignment.instructions && (
                                                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 italic">
                                                            &quot;{assignment.instructions}&quot;
                                                        </p>
                                                    )}
                                                    {/* Progress bar for in_progress */}
                                                    {assignment.status === 'in_progress' && assignment.response?.progress > 0 && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full bg-brand-yellow transition-all"
                                                                    style={{ width: `${assignment.response.progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground tabular-nums">
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

                    {/* Completed */}
                    {completed.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Completados ({completed.length})
                            </h3>
                            <div className="space-y-3">
                                {completed.map((assignment: any) => (
                                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-sm truncate">
                                                            {assignment.tool?.title || 'Herramienta'}
                                                        </p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(assignment.status)}`}>
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
                                                    {/* Results */}
                                                    <ToolResultsCard assignment={assignment} />
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
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

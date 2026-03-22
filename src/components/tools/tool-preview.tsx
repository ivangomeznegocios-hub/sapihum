'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
    ArrowLeft,
    ArrowRight,
    Brain,
    CheckCircle2,
    ClipboardList,
    RotateCcw,
    Timer,
} from 'lucide-react'
import { calculateProgress, getTotalQuestions, getCategoryLabel } from '@/lib/tools/tool-schema'
import type { TherapeuticTool, ToolQuestion } from '@/types/database'

interface ToolPreviewSandboxProps {
    tool: TherapeuticTool | null
    className?: string
    dense?: boolean
}

export function ToolPreviewSandbox({ tool, className, dense = false }: ToolPreviewSandboxProps) {
    const [currentSection, setCurrentSection] = useState(0)
    const [responses, setResponses] = useState<Record<string, any>>({})

    if (!tool) {
        return (
            <Card className={className}>
                <CardContent className="py-10 text-center text-muted-foreground">
                    <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Selecciona una herramienta para verla aquí</p>
                </CardContent>
            </Card>
        )
    }

    const schema = tool.schema
    const sections = schema.sections || []
    const safeIndex = Math.min(currentSection, Math.max(sections.length - 1, 0))
    const section = sections[safeIndex]
    const progress = calculateProgress(schema, responses)
    const totalQuestions = getTotalQuestions(schema)
    const answeredCount = Object.keys(responses).filter((key) => responses[key] !== undefined && responses[key] !== '').length

    function updateResponse(questionId: string, value: any) {
        setResponses((prev) => ({ ...prev, [questionId]: value }))
    }

    function resetPreview() {
        setResponses({})
        setCurrentSection(0)
    }

    if (sections.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        {tool.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{tool.description || 'Sin descripción'}</p>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Esta herramienta todavía no tiene secciones configuradas.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Brain className="h-4 w-4 text-primary" />
                            {tool.title}
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {tool.description || schema.metadata.instructions}
                        </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                        {getCategoryLabel(tool.category)}
                    </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border bg-muted/30 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Secciones</p>
                        <p className="text-sm font-semibold">{sections.length}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Preguntas</p>
                        <p className="text-sm font-semibold">{totalQuestions}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tiempo</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                            {tool.estimated_minutes || schema.metadata.estimated_minutes || '?'} min
                        </p>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Vista previa local</span>
                        <span className="tabular-nums">{answeredCount}/{totalQuestions} respondidas · {progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className={dense ? 'space-y-4' : 'space-y-5'}>
                {sections.length > 1 && (
                    <div className="flex gap-1 overflow-x-auto pb-1">
                        {sections.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setCurrentSection(index)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                                    index === safeIndex
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-accent'
                                }`}
                            >
                                {index + 1}. {item.title}
                            </button>
                        ))}
                    </div>
                )}

                <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="mb-4">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Sección {safeIndex + 1} de {sections.length}
                        </p>
                        <h3 className="text-base font-semibold">{section.title}</h3>
                        {section.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        {section.questions.map((question, index) => (
                            <PreviewQuestion
                                key={question.id}
                                question={question}
                                index={index}
                                value={responses[question.id]}
                                onChange={(value) => updateResponse(question.id, value)}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentSection((prev) => Math.max(prev - 1, 0))}
                            disabled={safeIndex === 0}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Anterior
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={resetPreview}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Limpiar
                        </Button>
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setCurrentSection((prev) => Math.min(prev + 1, sections.length - 1))}
                        disabled={safeIndex >= sections.length - 1}
                    >
                        Siguiente
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-dashed bg-background p-3 text-xs text-muted-foreground">
                    <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p>Esta es una vista previa local. Las respuestas no se guardan y sirven para probar la herramienta antes de asignarla.</p>
                </div>
            </CardContent>
        </Card>
    )
}

function PreviewQuestion({
    question,
    index,
    value,
    onChange
}: {
    question: ToolQuestion
    index: number
    value: any
    onChange: (value: any) => void
}) {
    const isAnswered = value !== undefined && value !== null && value !== ''

    return (
        <div className={`rounded-lg border p-3 ${isAnswered ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
            <div className="flex items-start gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isAnswered ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">
                        {question.text}
                        {question.required && <span className="ml-0.5 text-destructive">*</span>}
                    </p>
                    <div className="mt-3">
                        <QuestionControl question={question} value={value} onChange={onChange} />
                    </div>
                </div>
            </div>
        </div>
    )
}

function QuestionControl({
    question,
    value,
    onChange
}: {
    question: ToolQuestion
    value: any
    onChange: (value: any) => void
}) {
    if (question.type === 'text') {
        return <Textarea rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={question.placeholder || 'Escribe tu respuesta...'} />
    }

    if (question.type === 'number') {
        return (
            <input
                type="number"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
                min={question.min}
                max={question.max}
                placeholder={question.placeholder || 'Ingresa un número'}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
        )
    }

    if (question.type === 'slider') {
        return (
            <div className="space-y-2">
                <input
                    type="range"
                    min={question.min ?? 0}
                    max={question.max ?? 10}
                    step={question.step ?? 1}
                    value={value ?? question.min ?? 0}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{question.min ?? 0}</span>
                    <span className="font-semibold text-primary tabular-nums">{value ?? '—'}</span>
                    <span>{question.max ?? 10}</span>
                </div>
            </div>
        )
    }

    if (question.type === 'yes_no') {
        return (
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onChange(1)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${value === 1 ? 'border-green-500 bg-green-50 text-green-700' : 'border-border hover:bg-accent'}`}
                >
                    Sí
                </button>
                <button
                    type="button"
                    onClick={() => onChange(0)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${value === 0 ? 'border-red-500 bg-red-50 text-red-700' : 'border-border hover:bg-accent'}`}
                >
                    No
                </button>
            </div>
        )
    }

    if (question.type === 'rating' || question.type === 'likert' || question.type === 'multiple_choice') {
        const options = question.options || []
        return (
            <div className="space-y-2">
                {options.map((option) => {
                    const selected = value == option.value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${selected ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-accent'}`}
                        >
                            {option.label}
                        </button>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Tipo de pregunta no soportado en la vista previa.
        </div>
    )
}

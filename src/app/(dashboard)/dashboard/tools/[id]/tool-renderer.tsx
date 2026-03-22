'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    ArrowLeft, ArrowRight, CheckCircle, Brain,
    ChevronLeft, ChevronRight, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { calculateProgress, calculateScores, isComplete, getTotalQuestions } from '@/lib/tools/tool-schema'
import type { ToolSchema, ToolQuestion, ToolSection } from '@/types/database'

interface ToolRendererProps {
    assignment: any
}

export function ToolRenderer({ assignment }: ToolRendererProps) {
    const tool = assignment.tool
    const schema: ToolSchema = tool.schema
    const sections = schema.sections
    const router = useRouter()

    const [currentSection, setCurrentSection] = useState(0)
    const [responses, setResponses] = useState<Record<string, any>>(
        assignment.response?.responses || {}
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const section = sections[currentSection]
    const progress = calculateProgress(schema, responses)
    const totalQuestions = getTotalQuestions(schema)
    const answeredCount = Object.keys(responses).filter(k => responses[k] !== undefined && responses[k] !== '').length

    const updateResponse = useCallback((questionId: string, value: any) => {
        setResponses(prev => ({ ...prev, [questionId]: value }))
    }, [])

    async function handleSaveProgress() {
        setIsSubmitting(true)
        try {
            const res = await fetch('/api/tools/save-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: assignment.id,
                    responses,
                    progress: calculateProgress(schema, responses)
                })
            })
            if (!res.ok) throw new Error('Error saving')
        } catch (e) {
            console.error('Error saving progress:', e)
        }
        setIsSubmitting(false)
    }

    async function handleSubmit() {
        setIsSubmitting(true)
        try {
            const scores = calculateScores(schema, responses)
            const res = await fetch('/api/tools/save-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: assignment.id,
                    responses,
                    scores,
                    progress: 100,
                    completed: true
                })
            })
            if (!res.ok) throw new Error('Error submitting')
            router.push(`/dashboard/tools/${assignment.id}`)
            router.refresh()
        } catch (e) {
            console.error('Error submitting:', e)
        }
        setIsSubmitting(false)
    }

    function goNext() {
        if (currentSection < sections.length - 1) {
            setCurrentSection(prev => prev + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
            if (canSubmit) {
                handleSubmit()
            } else {
                setShowConfirm(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        }
    }

    function goPrev() {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const isLastSection = currentSection === sections.length - 1
    const canSubmit = isComplete(schema, responses)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/tools">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">{tool.title}</h1>
                    <p className="text-xs text-muted-foreground">
                        {schema.metadata.instructions}
                    </p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progreso</span>
                    <span className="tabular-nums">{answeredCount}/{totalQuestions} preguntas • {progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {/* Section indicators */}
                <div className="flex gap-1">
                    {sections.map((s, i) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setCurrentSection(i)}
                            className={`flex-1 h-1 rounded-full transition-all ${i === currentSection
                                ? 'bg-primary'
                                : i < currentSection
                                    ? 'bg-primary/40'
                                    : 'bg-muted-foreground/20'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-sm">¿Enviar respuestas?</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {canSubmit
                                        ? 'Has completado todas las preguntas requeridas. Una vez enviado, tus respuestas serán evaluadas por tu psicólogo.'
                                        : 'Aún tienes preguntas sin responder. Completa todas las preguntas antes de enviar.'
                                    }
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowConfirm(false)}
                                    >
                                        Revisar
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSubmit}
                                        disabled={!canSubmit || isSubmitting}
                                        className="gap-1.5"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>
                                        ) : (
                                            <><CheckCircle className="h-3.5 w-3.5" /> Confirmar y Enviar</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Section Content */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-muted-foreground font-medium">
                                Sección {currentSection + 1} de {sections.length}
                            </p>
                            <CardTitle className="text-base">{section.title}</CardTitle>
                        </div>
                    </div>
                    {section.description && (
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {section.questions.map((question, qIdx) => (
                        <QuestionRenderer
                            key={question.id}
                            question={question}
                            index={qIdx}
                            value={responses[question.id]}
                            onChange={(val) => updateResponse(question.id, val)}
                        />
                    ))}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={goPrev}
                    disabled={currentSection === 0}
                    className="gap-1.5"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveProgress}
                        disabled={isSubmitting}
                        className="text-xs"
                    >
                        {isSubmitting ? 'Guardando...' : 'Guardar progreso'}
                    </Button>
                    <Button
                        onClick={goNext}
                        disabled={isSubmitting}
                        className="gap-1.5"
                    >
                        {isLastSection ? (
                            isSubmitting ? (
                                <>Enviando <Loader2 className="h-4 w-4 animate-spin" /></>
                            ) : (
                                <>Finalizar y Enviar <CheckCircle className="h-4 w-4" /></>
                            )
                        ) : (
                            <>Siguiente <ChevronRight className="h-4 w-4" /></>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================
// QUESTION RENDERER
// ============================================
function QuestionRenderer({
    question,
    index,
    value,
    onChange
}: {
    question: ToolQuestion
    index: number
    value: any
    onChange: (val: any) => void
}) {
    const isAnswered = value !== undefined && value !== null && value !== ''

    return (
        <div className={`p-4 rounded-lg border transition-all ${isAnswered ? 'border-primary/30 bg-primary/5' : 'border-border'
            }`}>
            <div className="flex items-start gap-3 mb-3">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAnswered ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {index + 1}
                </span>
                <p className="text-sm font-medium leading-snug pt-0.5">
                    {question.text}
                    {question.required && <span className="text-destructive ml-0.5">*</span>}
                </p>
            </div>

            <div className="ml-9">
                {question.type === 'likert' && question.options && (
                    <div className="space-y-1.5">
                        {question.options.map((option) => {
                            const isSelected = value == option.value
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => onChange(option.value)}
                                    className={`w-full text-left p-2.5 rounded-lg border text-sm transition-all ${isSelected
                                        ? 'border-primary bg-primary/10 text-primary font-medium shadow-sm'
                                        : 'border-border hover:border-muted-foreground/30 hover:bg-accent'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-primary' : 'border-muted-foreground/30'
                                            }`}>
                                            {isSelected && (
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <span>{option.label}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}

                {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-1.5">
                        {question.options.map((option) => {
                            const isSelected = value == option.value
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => onChange(option.value)}
                                    type="button"
                                    className={`w-full text-left p-2.5 rounded-lg border text-sm transition-all ${isSelected
                                        ? 'border-primary bg-primary/10 text-primary font-medium shadow-sm'
                                        : 'border-border hover:border-muted-foreground/30 hover:bg-accent'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>
                )}

                {question.type === 'text' && (
                    <Textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={question.placeholder || 'Escribe tu respuesta...'}
                        rows={3}
                        className="text-sm"
                    />
                )}

                {question.type === 'number' && (
                    <input
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
                        min={question.min}
                        max={question.max}
                        placeholder={question.placeholder || 'Ingresa un número'}
                        className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                )}

                {question.type === 'slider' && (
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
                            <span className="font-bold text-primary text-sm">{value ?? '—'}</span>
                            <span>{question.max ?? 10}</span>
                        </div>
                    </div>
                )}

                {question.type === 'yes_no' && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onChange(1)}
                            className={`flex-1 p-2.5 rounded-lg border text-sm font-medium transition-all ${value === 1
                                ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'border-border hover:bg-accent'
                                }`}
                        >
                            Sí
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange(0)}
                            className={`flex-1 p-2.5 rounded-lg border text-sm font-medium transition-all ${value === 0
                                ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'border-border hover:bg-accent'
                                }`}
                        >
                            No
                        </button>
                    </div>
                )}

                {question.type === 'rating' && (
                    <div className="flex gap-1">
                        {Array.from({ length: (question.max ?? 5) - (question.min ?? 1) + 1 }, (_, i) => i + (question.min ?? 1)).map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => onChange(num)}
                                className={`h-10 w-10 rounded-lg border text-sm font-bold transition-all ${value === num
                                    ? 'border-primary bg-primary text-primary-foreground shadow-md scale-110'
                                    : 'border-border hover:border-primary/30 hover:bg-accent'
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

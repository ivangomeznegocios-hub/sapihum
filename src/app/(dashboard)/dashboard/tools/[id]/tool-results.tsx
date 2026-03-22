'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Lock, Brain, CheckCircle } from 'lucide-react'
import type { ToolAssignmentWithDetails } from '@/types/database'
import { getInterpretation } from '@/lib/tools/tool-schema'

interface ToolResultsViewProps {
    assignment: ToolAssignmentWithDetails
    canSeeResults: boolean
}

export function ToolResultsView({ assignment, canSeeResults }: ToolResultsViewProps) {
    const tool = assignment.tool!
    const response = assignment.response
    const scoring = tool.schema?.scoring
    const scores = response?.scores as any

    if (!canSeeResults) {
        return (
            <Card>
                <CardContent className="py-16 text-center">
                    <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="font-semibold mb-1">Resultados no disponibles</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Tu psicólogo revisará tus respuestas y habilitará los resultados cuando lo considere apropiado
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (!response || !scores) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No hay resultados disponibles</p>
                </CardContent>
            </Card>
        )
    }

    const interpretation = scoring ? getInterpretation(scoring, scores.total) : null
    const percentage = scoring?.max_score ? Math.round((scores.total / scoring.max_score) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Completion badge */}
            <Card className="border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-green-800 dark:text-green-400">Completado</p>
                            <p className="text-xs text-green-600/80 dark:text-green-500/80">
                                {response.completed_at
                                    ? new Date(response.completed_at).toLocaleDateString('es-ES', {
                                        day: 'numeric', month: 'long', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })
                                    : 'Fecha no disponible'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Score Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Puntuación
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Big score */}
                    <div className="text-center py-4">
                        <div className="inline-flex items-end gap-1">
                            <span className="text-5xl font-bold tabular-nums" style={{ color: interpretation?.color || undefined }}>
                                {scores.total}
                            </span>
                            <span className="text-xl text-muted-foreground mb-1.5">
                                / {scoring?.max_score}
                            </span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-4 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                                width: `${percentage}%`,
                                backgroundColor: interpretation?.color || '#6b7280'
                            }}
                        />
                    </div>

                    {/* Interpretation */}
                    {interpretation && (
                        <div className="p-4 rounded-lg border" style={{
                            borderColor: `${interpretation.color}40`,
                            backgroundColor: `${interpretation.color}08`
                        }}>
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: interpretation.color }}
                                />
                                <span className="font-semibold text-sm">{interpretation.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{interpretation.description}</p>
                        </div>
                    )}

                    {/* All Ranges */}
                    {scoring?.ranges && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Escala de interpretación</p>
                            {scoring.ranges.map((range: any) => {
                                const isActive = scores.total >= range.min && scores.total <= range.max
                                return (
                                    <div
                                        key={range.label}
                                        className={`flex items-center gap-2 p-2 rounded-md text-xs transition-all ${isActive ? 'bg-accent font-medium' : 'opacity-60'
                                            }`}
                                    >
                                        <span
                                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: range.color }}
                                        />
                                        <span className="flex-1">{range.label}</span>
                                        <span className="text-muted-foreground tabular-nums">{range.min}–{range.max}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

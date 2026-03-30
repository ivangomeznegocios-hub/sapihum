import type { ToolSchema, ToolScoring, ToolScoringRange } from '@/types/database'

// ============================================
// SCORING ENGINE
// ============================================

/**
 * Calculate scores from responses based on the tool's scoring configuration
 */
export function calculateScores(
    schema: ToolSchema,
    responses: Record<string, number | string>
): { total: number; maxPossible: number; percentage: number } {
    const scoring = schema.scoring

    if (scoring.method === 'sum') {
        let total = 0
        let answeredCount = 0

        for (const section of schema.sections) {
            for (const question of section.questions) {
                const rawValue = responses[question.id]
                if (rawValue === undefined || rawValue === null || rawValue === '') continue

                const numValue = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue
                if (isNaN(numValue)) continue

                answeredCount++

                // Check if this is a reverse-scored item
                if (scoring.reverse_items.includes(question.id)) {
                    total += scoring.reverse_max - numValue
                } else {
                    total += numValue
                }
            }
        }

        return {
            total,
            maxPossible: scoring.max_score,
            percentage: scoring.max_score > 0 ? Math.round((total / scoring.max_score) * 100) : 0
        }
    }

    // Default: sum method
    return { total: 0, maxPossible: scoring.max_score, percentage: 0 }
}

/**
 * Get the interpretation/range label for a given score
 */
export function getInterpretation(
    scoring: ToolScoring,
    totalScore: number
): ToolScoringRange | null {
    for (const range of scoring.ranges) {
        if (totalScore >= range.min && totalScore <= range.max) {
            return range
        }
    }
    return null
}

/**
 * Calculate completion progress (percentage of answered questions)
 */
export function calculateProgress(
    schema: ToolSchema,
    responses: Record<string, any>
): number {
    let totalRequired = 0
    let answeredRequired = 0

    for (const section of schema.sections) {
        for (const question of section.questions) {
            if (question.required) {
                totalRequired++
                const value = responses[question.id]
                if (value !== undefined && value !== null && value !== '') {
                    answeredRequired++
                }
            }
        }
    }

    if (totalRequired === 0) return 100
    return Math.round((answeredRequired / totalRequired) * 100)
}

/**
 * Get total number of questions in a tool
 */
export function getTotalQuestions(schema: ToolSchema): number {
    return schema.sections.reduce((sum, section) => sum + section.questions.length, 0)
}

/**
 * Check if all required questions are answered
 */
export function isComplete(
    schema: ToolSchema,
    responses: Record<string, any>
): boolean {
    for (const section of schema.sections) {
        for (const question of section.questions) {
            if (question.required) {
                const value = responses[question.id]
                if (value === undefined || value === null || value === '') {
                    return false
                }
            }
        }
    }
    return true
}

/**
 * Validate tool schema structure
 */
export function validateToolSchema(schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!schema.version) errors.push('Missing version')
    if (!schema.metadata) errors.push('Missing metadata')
    if (!schema.sections || !Array.isArray(schema.sections)) errors.push('Missing or invalid sections')
    if (!schema.scoring) errors.push('Missing scoring')

    if (schema.metadata) {
        if (!schema.metadata.name) errors.push('Missing metadata.name')
        if (!schema.metadata.instructions) errors.push('Missing metadata.instructions')
    }

    if (schema.sections) {
        for (const section of schema.sections) {
            if (!section.id) errors.push(`Section missing id`)
            if (!section.questions || !Array.isArray(section.questions)) {
                errors.push(`Section ${section.id} missing questions`)
                continue
            }
            for (const q of section.questions) {
                if (!q.id) errors.push(`Question missing id in section ${section.id}`)
                if (!q.text) errors.push(`Question ${q.id} missing text`)
                if (!q.type) errors.push(`Question ${q.id} missing type`)
                if (q.type === 'likert' && (!q.options || q.options.length === 0)) {
                    errors.push(`Likert question ${q.id} missing options`)
                }
            }
        }
    }

    if (schema.scoring) {
        if (!schema.scoring.method) errors.push('Missing scoring.method')
        if (!schema.scoring.ranges || !Array.isArray(schema.scoring.ranges)) {
            errors.push('Missing scoring.ranges')
        }
    }

    return { valid: errors.length === 0, errors }
}

/**
 * Get category display label in Spanish
 */
export function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        test: 'Test',
        questionnaire: 'Cuestionario',
        task: 'Tarea',
        exercise: 'Ejercicio',
        scale: 'Escala'
    }
    return labels[category] || category
}

/**
 * Get status display label in Spanish
 */
export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        pending: 'Pendiente',
        in_progress: 'En Progreso',
        completed: 'Completado',
        expired: 'Expirado'
    }
    return labels[status] || status
}

/**
 * Get status color for styling
 */
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow',
        in_progress: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow',
        completed: 'surface-alert-success dark:bg-green-900/30 dark:text-green-400',
        expired: 'surface-alert-error dark:bg-red-900/30 dark:text-red-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
}


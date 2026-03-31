'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentInternalAccessContext } from '@/lib/access/internal-server'
import { canAccessPatientsModule } from '@/lib/access/internal-modules'
import {
    createToolAssignment,
    createTherapeuticTool,
    toggleResultsVisibilityForPsychologist,
    deleteToolAssignmentForPsychologist,
} from '@/lib/supabase/queries/tools'

async function requirePatientsWorkspace() {
    const { supabase, profile, viewer } = await getCurrentInternalAccessContext()

    if (!profile || !viewer) {
        return { supabase, profile: null, error: 'No autenticado' }
    }

    if (!canAccessPatientsModule(viewer)) {
        return { supabase, profile: null, error: 'No autorizado' }
    }

    return { supabase, profile, error: null }
}

async function hasActivePatientRelationship(supabase: any, psychologistId: string, patientId: string) {
    const { data: relationship } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id')
        .eq('patient_id', patientId)
        .eq('psychologist_id', psychologistId)
        .eq('status', 'active')
        .maybeSingle()

    return relationship
}

/**
 * Server action: Assign a tool to a patient
 */
export async function assignToolAction(formData: FormData) {
    const toolId = formData.get('toolId') as string
    const patientId = formData.get('patientId') as string
    const instructions = formData.get('instructions') as string
    const dueDate = formData.get('dueDate') as string

    if (!toolId || !patientId) {
        return { error: 'Herramienta y paciente son requeridos' }
    }

    const { supabase, profile, error: accessError } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const relationship = await hasActivePatientRelationship(supabase, profile.id, patientId)
    if (!relationship) {
        return { error: 'No tienes acceso a este paciente' }
    }

    const result = await createToolAssignment({
        tool_id: toolId,
        patient_id: patientId,
        psychologist_id: profile.id,
        instructions: instructions || null,
        due_date: dueDate || null
    })

    if (!result) {
        return { error: 'Error al asignar la herramienta' }
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true, assignment: result }
}

/**
 * Server action: Toggle results visibility for patient
 */
export async function toggleVisibilityAction(formData: FormData) {
    const assignmentId = formData.get('assignmentId') as string
    const visible = formData.get('visible') === 'true'
    const patientId = formData.get('patientId') as string

    if (!assignmentId) {
        return { error: 'Assignment ID requerido' }
    }

    const { profile, error: accessError } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const result = await toggleResultsVisibilityForPsychologist(profile.id, assignmentId, visible)

    if (!result) {
        return { error: 'No tienes permisos para cambiar la visibilidad de esta herramienta' }
    }

    if (patientId) {
        revalidatePath(`/dashboard/patients/${patientId}`)
    }
    return { success: true }
}

/**
 * Server action: Delete a tool assignment
 */
export async function deleteAssignmentAction(formData: FormData) {
    const assignmentId = formData.get('assignmentId') as string
    const patientId = formData.get('patientId') as string

    if (!assignmentId) {
        return { error: 'Assignment ID requerido' }
    }

    const { profile, error: accessError } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const result = await deleteToolAssignmentForPsychologist(profile.id, assignmentId)

    if (!result) {
        return { error: 'No tienes permisos para eliminar esta asignacion' }
    }

    if (patientId) {
        revalidatePath(`/dashboard/patients/${patientId}`)
    }
    return { success: true }
}

/**
 * Server action: Create a quick therapeutic tool draft for psychologists with clinical access
 */
export async function createToolAction(input: {
    title: string
    description?: string
    category?: string
    estimatedMinutes?: number
    instructions?: string
}) {
    const { profile, error: accessError } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const title = input.title?.trim()
    if (!title) {
        return { error: 'El titulo es requerido' }
    }

    const estimatedMinutes = Math.max(3, Math.min(60, Number(input.estimatedMinutes || 10)))

    const tool = await createTherapeuticTool({
        title,
        description: input.description?.trim() || null,
        category: (input.category as any) || 'exercise',
        estimated_minutes: estimatedMinutes,
        is_template: false,
        created_by: profile.id,
        tags: ['borrador', 'creado-por-psicologo'],
        schema: {
            version: '1.0',
            metadata: {
                name: title,
                author: 'SAPIHUM',
                estimated_minutes: estimatedMinutes,
                instructions: input.instructions?.trim() || 'Lee la consigna y responde la actividad.',
            },
            sections: [
                {
                    id: 'principal',
                    title: 'Actividad principal',
                    description: input.description?.trim() || undefined,
                    questions: [
                        {
                            id: 'respuesta_principal',
                            text: 'Escribe tu respuesta o desarrolla la actividad solicitada.',
                            type: 'text',
                            required: true,
                            placeholder: 'Escribe aqui tu respuesta...',
                        },
                    ],
                },
            ],
            scoring: {
                method: 'sum',
                max_score: 0,
                reverse_items: [],
                reverse_max: 0,
                ranges: [],
            },
        },
    })

    if (!tool) {
        return { error: 'No fue posible crear la herramienta' }
    }

    revalidatePath('/dashboard/tools')
    revalidatePath('/dashboard/patients')
    return { success: true, tool }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createToolAssignment, createTherapeuticTool, toggleResultsVisibility, deleteToolAssignment } from '@/lib/supabase/queries/tools'
import { createClient } from '@/lib/supabase/server'

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

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const result = await createToolAssignment({
        tool_id: toolId,
        patient_id: patientId,
        psychologist_id: user.id,
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

    const result = await toggleResultsVisibility(assignmentId, visible)

    if (!result) {
        return { error: 'Error al cambiar la visibilidad' }
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

    const result = await deleteToolAssignment(assignmentId)

    if (!result) {
        return { error: 'Error al eliminar la asignación' }
    }

    if (patientId) {
        revalidatePath(`/dashboard/patients/${patientId}`)
    }
    return { success: true }
}

/**
 * Server action: Create a quick therapeutic tool draft for psychologists/admins
 */
export async function createToolAction(input: {
    title: string
    description?: string
    category?: string
    estimatedMinutes?: number
    instructions?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (!profile || !['psychologist', 'admin'].includes(profile.role)) {
        return { error: 'No tienes permisos para crear herramientas' }
    }

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
        created_by: user.id,
        tags: ['borrador', 'creado-por-psicologo'],
        schema: {
            version: '1.0',
            metadata: {
                name: title,
                author: 'Comunidad Psicologia',
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
                            placeholder: 'Escribe aqui...',
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

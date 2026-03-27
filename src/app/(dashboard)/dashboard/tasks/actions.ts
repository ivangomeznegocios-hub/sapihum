'use server'

import { getCurrentInternalAccessContext } from '@/lib/access/internal-server'
import { canAccessTasksModule } from '@/lib/access/internal-modules'
import { revalidatePath } from 'next/cache'

async function requireTasksWorkspace() {
    const { supabase, profile, viewer } = await getCurrentInternalAccessContext()

    if (!profile || !viewer) {
        return { supabase, profile: null, viewer: null, error: 'No autenticado' }
    }

    return { supabase, profile, viewer, error: null }
}

export async function completeTask(taskId: string, response: any, notes: string) {
    const { supabase, profile, error } = await requireTasksWorkspace()

    if (error || !profile) {
        return { error: error || 'No autenticado' }
    }

    const { error: updateError } = await ((supabase
        .from('tasks') as any) as any)
        .update({
            status: 'completed',
            response: response || {},
            completion_notes: notes || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('patient_id', profile.id)

    if (updateError) {
        console.error('Error completing task:', updateError)
        return { error: updateError.message }
    }

    revalidatePath('/dashboard/tasks')
    return { success: true }
}

export async function createTask(data: {
    patientId: string
    title: string
    description: string
    type: string
    dueDate?: string
    content?: any
}) {
    const { supabase, profile, viewer, error } = await requireTasksWorkspace()

    if (error || !profile || !viewer) {
        return { error: error || 'No autenticado' }
    }

    if (profile.role !== 'psychologist') {
        return { error: 'Solo psicólogos pueden asignar tareas' }
    }

    if (!canAccessTasksModule(viewer)) {
        return { error: 'Tu plan actual no incluye esta función. Por favor mejora tu plan para asignar tareas.' }
    }

    const { data: relationship } = await ((supabase
        .from('patient_psychologist_relationships') as any) as any)
        .select('id')
        .eq('patient_id', data.patientId)
        .eq('psychologist_id', profile.id)
        .eq('status', 'active')
        .single()

    if (!relationship) {
        return { error: 'No tienes una relación activa con este paciente' }
    }

    const { error: insertError } = await ((supabase
        .from('tasks') as any) as any)
        .insert({
            patient_id: data.patientId,
            psychologist_id: profile.id,
            title: data.title,
            description: data.description || null,
            type: data.type || 'general',
            status: 'pending',
            due_date: data.dueDate || null,
            content: data.content || {},
        })

    if (insertError) {
        console.error('Error creating task:', insertError)
        return { error: insertError.message }
    }

    revalidatePath('/dashboard/tasks')
    revalidatePath(`/dashboard/patients/${data.patientId}`)
    return { success: true }
}

export async function deleteTask(taskId: string) {
    const { supabase, profile, viewer, error } = await requireTasksWorkspace()

    if (error || !profile || !viewer) {
        return { error: error || 'No autenticado' }
    }

    if (profile.role !== 'psychologist' || !canAccessTasksModule(viewer)) {
        return { error: 'No autorizado' }
    }

    const { error: deleteError } = await ((supabase
        .from('tasks') as any) as any)
        .delete()
        .eq('id', taskId)
        .eq('psychologist_id', profile.id)

    if (deleteError) {
        console.error('Error deleting task:', deleteError)
        return { error: deleteError.message }
    }

    revalidatePath('/dashboard/tasks')
    return { success: true }
}

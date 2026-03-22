'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeTask(taskId: string, response: any, notes: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const { error } = await ((supabase
        .from('tasks') as any) as any)
        .update({
            status: 'completed',
            response: response || {},
            completion_notes: notes || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('patient_id', user.id)

    if (error) {
        console.error('Error completing task:', error)
        return { error: error.message }
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
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    // Verify user is a psychologist
    const { data: profile } = await ((supabase
        .from('profiles') as any) as any)
        .select('role, membership_level')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'psychologist') {
        return { error: 'Solo psicólogos pueden asignar tareas' }
    }

    if ((profile?.membership_level ?? 0) < 2) {
        return { error: 'Tu plan actual no incluye esta función. Por favor mejora tu plan para asignar tareas.' }
    }

    // Verify relationship with patient
    const { data: relationship } = await ((supabase
        .from('patient_psychologist_relationships') as any) as any)
        .select('id')
        .eq('patient_id', data.patientId)
        .eq('psychologist_id', user.id)
        .eq('status', 'active')
        .single()

    if (!relationship) {
        return { error: 'No tienes una relación activa con este paciente' }
    }

    const { error } = await ((supabase
        .from('tasks') as any) as any)
        .insert({
            patient_id: data.patientId,
            psychologist_id: user.id,
            title: data.title,
            description: data.description || null,
            type: data.type || 'general',
            status: 'pending',
            due_date: data.dueDate || null,
            content: data.content || {}
        })

    if (error) {
        console.error('Error creating task:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/tasks')
    revalidatePath(`/dashboard/patients/${data.patientId}`)
    return { success: true }
}

export async function deleteTask(taskId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autenticado' }
    }

    const { error } = await ((supabase
        .from('tasks') as any) as any)
        .delete()
        .eq('id', taskId)
        .eq('psychologist_id', user.id)

    if (error) {
        console.error('Error deleting task:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/tasks')
    return { success: true }
}

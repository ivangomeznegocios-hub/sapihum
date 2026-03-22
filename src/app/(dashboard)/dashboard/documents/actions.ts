'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { DocumentCategory } from '@/types/database'

const DocumentSchema = z.object({
    id: z.string().optional(),
    patient_id: z.string().min(1, 'Debe seleccionar un paciente'),
    file_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    file_path: z.string().url('Debe ser una URL válida (ej. enlace de Drive)'),
    category: z.enum(['test_result', 'referral', 'consent', 'report', 'intake_form', 'other'] as const),
    notes: z.string().optional().nullable(),
})

export type DocumentActionState = {
    success: boolean
    message?: string
    errors?: Record<string, string[]>
}

export async function saveDocument(
    prevState: DocumentActionState,
    formData: FormData
): Promise<DocumentActionState> {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'No autenticado' }
    }

    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'psychologist') {
        return { success: false, message: 'Solo los psicólogos pueden subir documentos' }
    }

    // Validate data
    const rawData = {
        id: formData.get('id')?.toString(),
        patient_id: formData.get('patient_id')?.toString(),
        file_name: formData.get('file_name')?.toString(),
        file_path: formData.get('file_path')?.toString(), // The link
        category: formData.get('category')?.toString(),
        notes: formData.get('notes')?.toString(),
    }

    const validatedFields = DocumentSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Por favor corrija los errores en el formulario'
        }
    }

    const data = validatedFields.data

    try {
        if (data.id) {
            // Update
            const { error } = await (supabase
                .from('patient_documents') as any)
                .update({
                    patient_id: data.patient_id,
                    file_name: data.file_name,
                    file_path: data.file_path,
                    category: data.category as DocumentCategory,
                    notes: data.notes,
                } as any)
                .eq('id', data.id)
                .eq('psychologist_id', user.id)
                .is('deleted_at', null)

            if (error) throw error
        } else {
            // Insert
            const { error } = await (supabase
                .from('patient_documents') as any)
                .insert({
                    patient_id: data.patient_id,
                    psychologist_id: user.id,
                    file_name: data.file_name,
                    file_path: data.file_path,
                    file_type: 'link', // Always label as link
                    file_size: 0,      // Does not use storage
                    category: data.category as DocumentCategory,
                    notes: data.notes,
                } as any)

            if (error) throw error
        }

        revalidatePath('/dashboard/documents')
        return { success: true, message: data.id ? 'Enlace actualizado' : 'Enlace guardado' }
    } catch (e: any) {
        console.error('Save document error:', e)
        return { success: false, message: e.message || 'Error al guardar el enlace' }
    }
}

export async function deleteDocument(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'No autenticado' }

    try {
        const { data: doc } = await (supabase
            .from('patient_documents') as any)
            .select('patient_id, file_name, deleted_at')
            .eq('id', id)
            .eq('psychologist_id', user.id)
            .is('deleted_at', null)
            .single()

        if (!doc) {
            return { success: false, message: 'Documento no encontrado' }
        }

        const { error } = await (supabase
            .from('patient_documents') as any)
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('psychologist_id', user.id)
            .is('deleted_at', null)

        if (error) throw error

        revalidatePath('/dashboard/documents')
        return { success: true }
    } catch (e: any) {
        console.error('Delete document error:', e)
        return { success: false, message: e.message || 'Error al eliminar el enlace' }
    }
}

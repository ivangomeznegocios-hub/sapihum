'use server'

import { getCurrentInternalAccessContext } from '@/lib/access/internal-server'
import { canAccessClinicalWorkspace } from '@/lib/access/internal-modules'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { DocumentCategory } from '@/types/database'

const DocumentSchema = z.object({
    id: z.string().optional(),
    patient_id: z.string().min(1, 'Debe seleccionar un paciente'),
    file_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    file_path: z.string().url('Debe ser una URL valida (ej. enlace de Drive)'),
    category: z.enum(['test_result', 'referral', 'consent', 'report', 'intake_form', 'other'] as const),
    notes: z.string().optional().nullable(),
})

export type DocumentActionState = {
    success: boolean
    message?: string
    errors?: Record<string, string[]>
}

async function requireClinicalPsychologistForDocuments() {
    const { supabase, profile, viewer } = await getCurrentInternalAccessContext()

    if (!profile || !viewer) {
        return { supabase, profile: null, error: 'No autenticado' }
    }

    if (profile.role !== 'psychologist' || !canAccessClinicalWorkspace(viewer)) {
        return { supabase, profile: null, error: 'Solo los psicologos pueden gestionar documentos' }
    }

    return { supabase, profile, error: null }
}

export async function saveDocument(
    prevState: DocumentActionState,
    formData: FormData
): Promise<DocumentActionState> {
    void prevState

    const { supabase, profile, error: accessError } = await requireClinicalPsychologistForDocuments()
    if (accessError || !profile) {
        return { success: false, message: accessError ?? 'No autorizado' }
    }

    const rawData = {
        id: formData.get('id')?.toString(),
        patient_id: formData.get('patient_id')?.toString(),
        file_name: formData.get('file_name')?.toString(),
        file_path: formData.get('file_path')?.toString(),
        category: formData.get('category')?.toString(),
        notes: formData.get('notes')?.toString(),
    }

    const validatedFields = DocumentSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Por favor corrija los errores en el formulario',
        }
    }

    const data = validatedFields.data

    const { data: relationship } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id')
        .eq('patient_id', data.patient_id)
        .eq('psychologist_id', profile.id)
        .eq('status', 'active')
        .maybeSingle()

    if (!relationship) {
        return { success: false, message: 'No tienes acceso a este paciente' }
    }

    try {
        if (data.id) {
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
                .eq('psychologist_id', profile.id)
                .is('deleted_at', null)

            if (error) throw error
        } else {
            const { error } = await (supabase
                .from('patient_documents') as any)
                .insert({
                    patient_id: data.patient_id,
                    psychologist_id: profile.id,
                    file_name: data.file_name,
                    file_path: data.file_path,
                    file_type: 'link',
                    file_size: 0,
                    category: data.category as DocumentCategory,
                    notes: data.notes,
                } as any)

            if (error) throw error
        }

        revalidatePath('/dashboard/documents')
        return { success: true, message: data.id ? 'Enlace actualizado' : 'Enlace guardado' }
    } catch (error: any) {
        console.error('Save document error:', error)
        return { success: false, message: error.message || 'Error al guardar el enlace' }
    }
}

export async function deleteDocument(id: string) {
    const { supabase, profile, error: accessError } = await requireClinicalPsychologistForDocuments()
    if (accessError || !profile) {
        return { success: false, message: accessError ?? 'No autorizado' }
    }

    try {
        const { data: doc } = await (supabase
            .from('patient_documents') as any)
            .select('patient_id, file_name')
            .eq('id', id)
            .eq('psychologist_id', profile.id)
            .is('deleted_at', null)
            .single()

        if (!doc) {
            return { success: false, message: 'Documento no encontrado' }
        }

        const { error } = await (supabase
            .from('patient_documents') as any)
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: profile.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('psychologist_id', profile.id)
            .is('deleted_at', null)

        if (error) throw error

        revalidatePath('/dashboard/documents')
        return { success: true }
    } catch (error: any) {
        console.error('Delete document error:', error)
        return { success: false, message: error.message || 'Error al eliminar el enlace' }
    }
}

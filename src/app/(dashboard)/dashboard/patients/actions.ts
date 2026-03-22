'use server'

import { createClient, createAdminClient, getUserProfile } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// HELPERS
// ============================================
async function logAudit(
    supabase: any,
    userId: string,
    patientId: string | null,
    action: 'create' | 'update' | 'delete' | 'view' | 'export',
    recordType: string,
    recordId: string | null,
    details?: Record<string, any>
) {
    try {
        await (supabase.from('clinical_audit_log') as any).insert({
            psychologist_id: userId,
            patient_id: patientId,
            action,
            record_type: recordType,
            record_id: recordId,
            details: details || {}
        })
    } catch (e) {
        console.error('[AuditLog] Failed to log:', e)
    }
}

// ============================================
// ACCESS VERIFICATION
// ============================================
async function verifyAccess(minLevel: number) {
    const profile = await getUserProfile()

    if (!profile) {
        return { error: 'No autenticado', profile: null }
    }

    if (profile.role !== 'psychologist' && profile.role !== 'admin') {
        return { error: 'No autorizado', profile: null }
    }

    if (profile.role === 'psychologist' && (profile.membership_level ?? 0) < minLevel) {
        return { error: `Requiere membresía nivel ${minLevel} o superior`, profile: null }
    }

    return { error: null, profile }
}

// ============================================
// PATIENT MANAGEMENT
// ============================================

/**
 * Add a patient — supports two modes:
 *  1. WITH email: looks up existing user or sends invite
 *  2. WITHOUT email (name-only): creates a local patient profile
 */
export async function addPatient(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    const { error: accessError, profile } = await verifyAccess(2)
    if (accessError || !profile) return { error: accessError }

    const patientEmail = (formData.get('email') as string || '').trim().toLowerCase()
    const patientName = (formData.get('fullName') as string || '').trim()
    const patientPhone = (formData.get('phone') as string || '').trim()

    const hasEmail = patientEmail.length > 0
    const hasName = patientName.length > 0

    if (!hasEmail && !hasName) {
        return { error: 'Proporciona al menos el nombre o email del paciente' }
    }

    let patientId: string | undefined

    if (hasEmail) {
        // ─── MODE 1: Email-based ───
        const { data: existingPatient } = await (supabase
            .from('profiles') as any)
            .select('id, full_name, role')
            .eq('email', patientEmail)
            .single()

        patientId = existingPatient?.id

        if (!existingPatient) {
            const { data: invitationData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
                patientEmail,
                {
                    data: {
                        full_name: patientName || 'Paciente Invitado',
                        role: 'patient',
                    }
                }
            )

            if (inviteError) {
                return { error: `Error al invitar al paciente: ${inviteError.message}` }
            }

            patientId = invitationData.user.id

            if (patientName || patientPhone) {
                const updates: any = {}
                if (patientName) updates.full_name = patientName
                if (patientPhone) updates.phone = patientPhone
                await (adminSupabase.from('profiles') as any)
                    .update(updates)
                    .eq('id', patientId)
            }
        }
    } else {
        // ─── MODE 2: Name-only (local patient) ───
        const internalEmail = `local-patient-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@internal.comunidadpsicologia.app`
        const tempPassword = `CP-${crypto.randomUUID()}`

        const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
            email: internalEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: patientName,
                role: 'patient',
                is_local_patient: true,
            }
        })

        if (createError) {
            return { error: `Error al crear paciente: ${createError.message}` }
        }

        patientId = newUser.user.id

        const updates: any = { full_name: patientName, role: 'patient' }
        if (patientPhone) updates.phone = patientPhone
        await (adminSupabase.from('profiles') as any)
            .update(updates)
            .eq('id', patientId)
    }

    if (!patientId) {
        return { error: 'Error: no se pudo obtener el ID del paciente' }
    }

    // Check if relationship already exists (active)
    const { data: existingRelation } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('*')
        .eq('patient_id', patientId)
        .eq('psychologist_id', profile.id)
        .eq('status', 'active')
        .single()

    if (existingRelation) {
        return { success: 'Este paciente ya está en tu lista.', patientId, patientName }
    }

    // Check for inactive relationship to reactivate
    const { data: inactiveRelation } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('*')
        .eq('patient_id', patientId)
        .eq('psychologist_id', profile.id)
        .single()

    if (inactiveRelation) {
        const { error: updateError } = await (supabase
            .from('patient_psychologist_relationships') as any)
            .update({ status: 'active' })
            .eq('id', inactiveRelation.id)

        if (updateError) {
            return { error: 'Error al reactivar paciente' }
        }
        revalidatePath('/dashboard/patients')
        revalidatePath('/dashboard/calendar')
        return { success: 'Paciente reactivado exitosamente', patientId, patientName }
    }

    // Create new relationship
    const { error: createRelError } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .insert({
            patient_id: patientId,
            psychologist_id: profile.id,
            status: 'active'
        })

    if (createRelError) {
        return { error: 'Error al vincular paciente' }
    }

    revalidatePath('/dashboard/patients')
    revalidatePath('/dashboard/calendar')
    return {
        success: hasEmail
            ? 'Paciente agregado exitosamente'
            : '¡Paciente creado y vinculado exitosamente!',
        patientId,
        patientName
    }
}

export async function removePatient(patientId: string) {
    const supabase = await createClient()
    const { error: accessError, profile: user } = await verifyAccess(2)
    if (accessError || !user) return { error: accessError }

    const { error } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .update({ status: 'inactive' })
        .eq('patient_id', patientId)
        .eq('psychologist_id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/patients')
    return { success: true }
}

// ============================================
// CLINICAL NOTES
// ============================================
export async function addClinicalNote(formData: FormData) {
    const supabase = await createClient()
    const { error: accessError, profile: user } = await verifyAccess(2)
    if (accessError || !user) return { error: accessError }

    const patientId = formData.get('patientId') as string
    const type = formData.get('type') as string || 'session_note'
    const format = formData.get('format') as string || 'simple'
    const tagsRaw = formData.get('tags') as string || ''
    const appointmentId = formData.get('appointmentId') as string || null
    const isPinned = formData.get('isPinned') === 'true'

    // Verify relationship exists
    const { data: relationship } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id')
        .eq('patient_id', patientId)
        .eq('psychologist_id', user.id)
        .eq('status', 'active')
        .single()

    if (!relationship) {
        return { error: 'No tienes acceso a este paciente' }
    }

    // Get next session number
    const { count } = await (supabase
        .from('clinical_records') as any)
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('psychologist_id', user.id)
        .is('deleted_at', null)

    const sessionNumber = (count || 0) + 1

    let content: any = {}

    if (format === 'soap') {
        content = {
            subjective: formData.get('subjective') as string,
            objective: formData.get('objective') as string,
            assessment: formData.get('assessment') as string,
            plan: formData.get('plan') as string
        }
    } else {
        content = {
            subjective: formData.get('content') as string
        }
    }

    // Parse tags
    const tags = tagsRaw
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)

    const { data: record, error } = await (supabase
        .from('clinical_records') as any)
        .insert({
            patient_id: patientId,
            psychologist_id: user.id,
            type: type,
            content: content,
            tags,
            appointment_id: appointmentId || null,
            is_pinned: isPinned,
            session_number: sessionNumber
        })
        .select('id')
        .single()

    if (error) {
        return { error: error.message }
    }

    // Audit log
    await logAudit(supabase, user.id, patientId, 'create', 'clinical_record', record?.id, {
        record_type: type,
        format,
        tags
    })

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}

export async function updateClinicalNote(formData: FormData) {
    const supabase = await createClient()
    const { error: accessError, profile: user } = await verifyAccess(2)
    if (accessError || !user) return { error: accessError }

    const noteId = formData.get('noteId') as string
    const patientId = formData.get('patientId') as string
    const type = formData.get('type') as string
    const format = formData.get('format') as string || 'simple'
    const tagsRaw = formData.get('tags') as string || ''

    let content: any = {}

    if (format === 'soap') {
        content = {
            subjective: formData.get('subjective') as string,
            objective: formData.get('objective') as string,
            assessment: formData.get('assessment') as string,
            plan: formData.get('plan') as string
        }
    } else {
        content = {
            subjective: formData.get('content') as string
        }
    }

    const tags = tagsRaw
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)

    const { error } = await (supabase
        .from('clinical_records') as any)
        .update({
            type: type,
            content: content,
            tags,
            updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('psychologist_id', user.id)
        .is('deleted_at', null)

    if (error) {
        return { error: error.message }
    }

    // Audit log
    await logAudit(supabase, user.id, patientId, 'update', 'clinical_record', noteId, {
        record_type: type,
        format,
        tags
    })

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}

export async function deleteClinicalNote(noteId: string) {
    const supabase = await createClient()
    const { error: accessError, profile: user } = await verifyAccess(2)
    if (accessError || !user) return { error: accessError }

    // Get note details before deleting for audit
    const { data: note } = await (supabase
        .from('clinical_records') as any)
        .select('patient_id, type, deleted_at')
        .eq('id', noteId)
        .eq('psychologist_id', user.id)
        .is('deleted_at', null)
        .single()

    const { error } = await (supabase
        .from('clinical_records') as any)
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .eq('psychologist_id', user.id)
        .is('deleted_at', null)

    if (error) {
        return { error: error.message }
    }

    // Audit log
    if (note) {
        await logAudit(supabase, user.id, note.patient_id, 'delete', 'clinical_record', noteId, {
            record_type: note.type
        })
    }

    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function togglePinNote(noteId: string, isPinned: boolean) {
    const supabase = await createClient()
    const { error: accessError, profile: user } = await verifyAccess(2)
    if (accessError || !user) return { error: accessError }

    const { error } = await (supabase
        .from('clinical_records') as any)
        .update({ is_pinned: isPinned })
        .eq('id', noteId)
        .eq('psychologist_id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/patients')
    return { success: true }
}

// ============================================
// DOCUMENT MANAGEMENT
// ============================================
export async function uploadDocument(formData: FormData) {
    const supabase = await createClient()
    const { error: accessError, profile: user } = await verifyAccess(2)
    if (accessError || !user) return { error: accessError }

    const patientId = formData.get('patientId') as string
    const category = formData.get('category') as string || 'other'
    const notes = formData.get('notes') as string || null
    const file = formData.get('file') as File

    if (!file) {
        return { error: 'No se seleccionó ningún archivo' }
    }

    // Verify relationship
    const { data: relationship } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id')
        .eq('patient_id', patientId)
        .eq('psychologist_id', user.id)
        .eq('status', 'active')
        .single()

    if (!relationship) {
        return { error: 'No tienes acceso a este paciente' }
    }

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${user.id}/${patientId}/${timestamp}_${safeName}`

    const { error: uploadError } = await supabase.storage
        .from('clinical-documents')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (uploadError) {
        return { error: `Error al subir archivo: ${uploadError.message}` }
    }

    // Create DB record
    const { data: doc, error: dbError } = await (supabase
        .from('clinical_documents') as any)
        .insert({
            patient_id: patientId,
            psychologist_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            category,
            notes
        })
        .select('id')
        .single()

    if (dbError) {
        // Clean up uploaded file if DB insert fails
        await supabase.storage.from('clinical-documents').remove([filePath])
        return { error: `Error al registrar documento: ${dbError.message}` }
    }

    // Audit log
    await logAudit(supabase, user.id, patientId, 'create', 'clinical_document', doc?.id, {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        category
    })

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}

export async function deleteDocument(documentId: string) {
    const supabase = await createClient()
    const { error: accessError, profile: user } = await verifyAccess(2)
    if (accessError || !user) return { error: accessError }

    // Get document details
    const { data: doc } = await (supabase
        .from('clinical_documents') as any)
        .select('file_path, patient_id, file_name, deleted_at')
        .eq('id', documentId)
        .eq('psychologist_id', user.id)
        .is('deleted_at', null)
        .single()

    if (!doc) {
        return { error: 'Documento no encontrado' }
    }

    // Soft delete in DB, keep storage object for retention
    const { error } = await (supabase
        .from('clinical_documents') as any)
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .eq('psychologist_id', user.id)
        .is('deleted_at', null)

    if (error) {
        return { error: error.message }
    }

    // Audit log
    await logAudit(supabase, user.id, doc.patient_id, 'delete', 'clinical_document', documentId, {
        file_name: doc.file_name
    })

    revalidatePath(`/dashboard/patients/${doc.patient_id}`)
    return { success: true }
}

export async function getDocumentUrl(filePath: string) {
    const supabase = await createClient()
    const { error: accessError, profile: user } = await verifyAccess(2)
    if (accessError || !user) return { error: accessError }

    const normalizedPath = filePath.trim()
    if (!normalizedPath) {
        return { error: 'Ruta de archivo invalida' }
    }

    let query = (supabase
        .from('clinical_documents') as any)
        .select('id, patient_id, psychologist_id, file_path')
        .eq('file_path', normalizedPath)
        .is('deleted_at', null)

    if (user.role !== 'admin') {
        query = query.eq('psychologist_id', user.id)
    }

    const { data: document, error: documentError } = await query.single()

    if (documentError || !document) {
        return { error: 'Documento no encontrado o sin acceso' }
    }

    const { data, error } = await supabase.storage
        .from('clinical-documents')
        .createSignedUrl(normalizedPath, 3600) // 1 hour expiry

    if (error) {
        return { error: error.message }
    }

    return { url: data.signedUrl }
}

// ============================================
// SESSION SUMMARIES
// ============================================
export async function saveSessionSummary(formData: FormData) {
    const supabase = await createClient()
    const { error: accessError, profile: user } = await verifyAccess(2)
    if (accessError || !user) return { error: accessError }

    const patientId = formData.get('patientId') as string
    const appointmentId = formData.get('appointmentId') as string || null
    const summary = formData.get('summary') as string
    const moodRating = formData.get('moodRating') ? parseInt(formData.get('moodRating') as string) : null
    const progressRating = formData.get('progressRating') ? parseInt(formData.get('progressRating') as string) : null
    const keyTopicsRaw = formData.get('keyTopics') as string || ''
    const homework = formData.get('homework') as string || null
    const nextSessionFocus = formData.get('nextSessionFocus') as string || null
    const summaryId = formData.get('summaryId') as string || null

    const keyTopics = keyTopicsRaw
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

    if (summaryId) {
        // Update existing
    const { error } = await (supabase
        .from('session_summaries') as any)
        .update({
            summary,
            mood_rating: moodRating,
            progress_rating: progressRating,
            key_topics: keyTopics,
            homework,
            next_session_focus: nextSessionFocus,
            updated_at: new Date().toISOString()
        })
        .eq('id', summaryId)
        .eq('psychologist_id', user.id)
        .is('deleted_at', null)

        if (error) {
            return { error: error.message }
        }

        await logAudit(supabase, user.id, patientId, 'update', 'session_summary', summaryId, { summary: summary.substring(0, 50) })
    } else {
        // Create new
        const { data: record, error } = await (supabase
            .from('session_summaries') as any)
            .insert({
                appointment_id: appointmentId,
                psychologist_id: user.id,
                patient_id: patientId,
                summary,
                mood_rating: moodRating,
                progress_rating: progressRating,
                key_topics: keyTopics,
                homework,
                next_session_focus: nextSessionFocus
            })
            .select('id')
            .single()

        if (error) {
            return { error: error.message }
        }

        await logAudit(supabase, user.id, patientId, 'create', 'session_summary', record?.id, { summary: summary.substring(0, 50) })
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}

export async function deleteSessionSummary(summaryId: string) {
    const supabase = await createClient()
    const { error: accessError, profile: user } = await verifyAccess(2)
    if (accessError || !user) return { error: accessError }

    const { data: summary } = await (supabase
        .from('session_summaries') as any)
        .select('patient_id, deleted_at')
        .eq('id', summaryId)
        .eq('psychologist_id', user.id)
        .is('deleted_at', null)
        .single()

    const { error } = await (supabase
        .from('session_summaries') as any)
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', summaryId)
        .eq('psychologist_id', user.id)
        .is('deleted_at', null)

    if (error) {
        return { error: error.message }
    }

    if (summary) {
        await logAudit(supabase, user.id, summary.patient_id, 'delete', 'session_summary', summaryId, {})
        revalidatePath(`/dashboard/patients/${summary.patient_id}`)
    }

    return { success: true }
}

'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentInternalAccessContext } from '@/lib/access/internal-server'
import { canAccessPatientsModule } from '@/lib/access/internal-modules'
import { revalidatePath } from 'next/cache'

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
            details: details || {},
        })
    } catch (error) {
        console.error('[AuditLog] Failed to log:', error)
    }
}

async function requirePatientsWorkspace() {
    const { profile, viewer } = await getCurrentInternalAccessContext()

    if (!profile || !viewer) {
        return { profile: null, error: 'No autenticado' }
    }

    if (!canAccessPatientsModule(viewer)) {
        return { profile: null, error: 'No autorizado' }
    }

    return { profile, error: null }
}

async function verifyActiveRelationship(supabase: any, psychologistId: string, patientId: string) {
    const { data: relationship } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id')
        .eq('patient_id', patientId)
        .eq('psychologist_id', psychologistId)
        .eq('status', 'active')
        .maybeSingle()

    return relationship
}

export async function addPatient(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const patientEmail = (formData.get('email') as string || '').trim().toLowerCase()
    const patientName = (formData.get('fullName') as string || '').trim()
    const patientPhone = (formData.get('phone') as string || '').trim()

    if (!patientEmail && !patientName) {
        return { error: 'Proporciona al menos el nombre o email del paciente' }
    }

    let patientId: string | undefined

    if (patientEmail) {
        const { data: existingPatient } = await (supabase
            .from('profiles') as any)
            .select('id, full_name, role')
            .eq('email', patientEmail)
            .maybeSingle()

        patientId = existingPatient?.id

        if (!existingPatient) {
            const { data: invitationData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
                patientEmail,
                {
                    data: {
                        full_name: patientName || 'Paciente Invitado',
                        role: 'patient',
                    },
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
            },
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

    const { data: existingRelation } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id, status')
        .eq('patient_id', patientId)
        .eq('psychologist_id', profile.id)
        .maybeSingle()

    if (existingRelation?.status === 'active') {
        return { success: 'Este paciente ya esta en tu lista.', patientId, patientName }
    }

    if (existingRelation) {
        const { error } = await (supabase
            .from('patient_psychologist_relationships') as any)
            .update({ status: 'active' })
            .eq('id', existingRelation.id)

        if (error) {
            return { error: 'Error al reactivar paciente' }
        }
    } else {
        const { error } = await (supabase
            .from('patient_psychologist_relationships') as any)
            .insert({
                patient_id: patientId,
                psychologist_id: profile.id,
                status: 'active',
            })

        if (error) {
            return { error: 'Error al vincular paciente' }
        }
    }

    revalidatePath('/dashboard/patients')
    revalidatePath('/dashboard/calendar')
    return {
        success: patientEmail ? 'Paciente agregado exitosamente' : 'Paciente creado y vinculado exitosamente',
        patientId,
        patientName,
    }
}

export async function removePatient(patientId: string) {
    const supabase = await createClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const { error } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .update({ status: 'inactive' })
        .eq('patient_id', patientId)
        .eq('psychologist_id', profile.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function addClinicalNote(formData: FormData) {
    const supabase = await createClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const patientId = formData.get('patientId') as string
    const type = (formData.get('type') as string) || 'session_note'
    const format = (formData.get('format') as string) || 'simple'
    const tagsRaw = (formData.get('tags') as string) || ''
    const appointmentId = (formData.get('appointmentId') as string) || null
    const isPinned = formData.get('isPinned') === 'true'

    const relationship = await verifyActiveRelationship(supabase, profile.id, patientId)
    if (!relationship) {
        return { error: 'No tienes acceso a este paciente' }
    }

    const { count } = await (supabase
        .from('clinical_records') as any)
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('psychologist_id', profile.id)
        .is('deleted_at', null)

    const sessionNumber = (count || 0) + 1
    const tags = tagsRaw.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean)

    const content = format === 'soap'
        ? {
            subjective: formData.get('subjective') as string,
            objective: formData.get('objective') as string,
            assessment: formData.get('assessment') as string,
            plan: formData.get('plan') as string,
        }
        : {
            subjective: formData.get('content') as string,
        }

    const { data: record, error } = await (supabase
        .from('clinical_records') as any)
        .insert({
            patient_id: patientId,
            psychologist_id: profile.id,
            type,
            content,
            tags,
            appointment_id: appointmentId,
            is_pinned: isPinned,
            session_number: sessionNumber,
        })
        .select('id')
        .single()

    if (error) {
        return { error: error.message }
    }

    await logAudit(supabase, profile.id, patientId, 'create', 'clinical_record', record?.id, {
        record_type: type,
        format,
        tags,
    })

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}

export async function updateClinicalNote(formData: FormData) {
    const supabase = await createClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const noteId = formData.get('noteId') as string
    const patientId = formData.get('patientId') as string
    const type = formData.get('type') as string
    const format = (formData.get('format') as string) || 'simple'
    const tagsRaw = (formData.get('tags') as string) || ''

    const relationship = await verifyActiveRelationship(supabase, profile.id, patientId)
    if (!relationship) {
        return { error: 'No tienes acceso a este paciente' }
    }

    const tags = tagsRaw.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean)
    const content = format === 'soap'
        ? {
            subjective: formData.get('subjective') as string,
            objective: formData.get('objective') as string,
            assessment: formData.get('assessment') as string,
            plan: formData.get('plan') as string,
        }
        : {
            subjective: formData.get('content') as string,
        }

    const { error } = await (supabase
        .from('clinical_records') as any)
        .update({
            type,
            content,
            tags,
            updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .eq('psychologist_id', profile.id)
        .is('deleted_at', null)

    if (error) {
        return { error: error.message }
    }

    await logAudit(supabase, profile.id, patientId, 'update', 'clinical_record', noteId, {
        record_type: type,
        format,
        tags,
    })

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}

export async function deleteClinicalNote(noteId: string) {
    const supabase = await createClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const { data: note } = await (supabase
        .from('clinical_records') as any)
        .select('patient_id, type')
        .eq('id', noteId)
        .eq('psychologist_id', profile.id)
        .is('deleted_at', null)
        .single()

    const { error } = await (supabase
        .from('clinical_records') as any)
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: profile.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .eq('psychologist_id', profile.id)
        .is('deleted_at', null)

    if (error) {
        return { error: error.message }
    }

    if (note) {
        await logAudit(supabase, profile.id, note.patient_id, 'delete', 'clinical_record', noteId, {
            record_type: note.type,
        })
    }

    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function togglePinNote(noteId: string, isPinned: boolean) {
    const supabase = await createClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const { error } = await (supabase
        .from('clinical_records') as any)
        .update({ is_pinned: isPinned })
        .eq('id', noteId)
        .eq('psychologist_id', profile.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/patients')
    return { success: true }
}

export async function uploadDocument(formData: FormData) {
    const supabase = await createClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const patientId = formData.get('patientId') as string
    const category = (formData.get('category') as string) || 'other'
    const notes = (formData.get('notes') as string) || null
    const file = formData.get('file') as File

    if (!file) {
        return { error: 'No se selecciono ningun archivo' }
    }

    const relationship = await verifyActiveRelationship(supabase, profile.id, patientId)
    if (!relationship) {
        return { error: 'No tienes acceso a este paciente' }
    }

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${profile.id}/${patientId}/${timestamp}_${safeName}`

    const { error: uploadError } = await supabase.storage
        .from('clinical-documents')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (uploadError) {
        return { error: `Error al subir archivo: ${uploadError.message}` }
    }

    const { data: doc, error: dbError } = await (supabase
        .from('clinical_documents') as any)
        .insert({
            patient_id: patientId,
            psychologist_id: profile.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            category,
            notes,
        })
        .select('id')
        .single()

    if (dbError) {
        await supabase.storage.from('clinical-documents').remove([filePath])
        return { error: `Error al registrar documento: ${dbError.message}` }
    }

    await logAudit(supabase, profile.id, patientId, 'create', 'clinical_document', doc?.id, {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        category,
    })

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}

export async function deleteDocument(documentId: string) {
    const supabase = await createClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const { data: doc } = await (supabase
        .from('clinical_documents') as any)
        .select('patient_id, file_name')
        .eq('id', documentId)
        .eq('psychologist_id', profile.id)
        .is('deleted_at', null)
        .single()

    if (!doc) {
        return { error: 'Documento no encontrado' }
    }

    const { error } = await (supabase
        .from('clinical_documents') as any)
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: profile.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .eq('psychologist_id', profile.id)
        .is('deleted_at', null)

    if (error) {
        return { error: error.message }
    }

    await logAudit(supabase, profile.id, doc.patient_id, 'delete', 'clinical_document', documentId, {
        file_name: doc.file_name,
    })

    revalidatePath(`/dashboard/patients/${doc.patient_id}`)
    return { success: true }
}

export async function getDocumentUrl(filePath: string) {
    const supabase = await createClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const normalizedPath = filePath.trim()
    if (!normalizedPath) {
        return { error: 'Ruta de archivo invalida' }
    }

    const { data: document, error: documentError } = await (supabase
        .from('clinical_documents') as any)
        .select('id, patient_id, psychologist_id, file_path')
        .eq('file_path', normalizedPath)
        .eq('psychologist_id', profile.id)
        .is('deleted_at', null)
        .single()

    if (documentError || !document) {
        return { error: 'Documento no encontrado o sin acceso' }
    }

    const { data, error } = await supabase.storage
        .from('clinical-documents')
        .createSignedUrl(normalizedPath, 3600)

    if (error) {
        return { error: error.message }
    }

    return { url: data.signedUrl }
}

export async function saveSessionSummary(formData: FormData) {
    const supabase = await createClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const patientId = formData.get('patientId') as string
    const appointmentId = (formData.get('appointmentId') as string) || null
    const summary = formData.get('summary') as string
    const moodRating = formData.get('moodRating') ? parseInt(formData.get('moodRating') as string, 10) : null
    const progressRating = formData.get('progressRating') ? parseInt(formData.get('progressRating') as string, 10) : null
    const keyTopicsRaw = (formData.get('keyTopics') as string) || ''
    const homework = (formData.get('homework') as string) || null
    const nextSessionFocus = (formData.get('nextSessionFocus') as string) || null
    const summaryId = (formData.get('summaryId') as string) || null

    const relationship = await verifyActiveRelationship(supabase, profile.id, patientId)
    if (!relationship) {
        return { error: 'No tienes acceso a este paciente' }
    }

    const keyTopics = keyTopicsRaw.split(',').map((topic) => topic.trim()).filter(Boolean)

    if (summaryId) {
        const { error } = await (supabase
            .from('session_summaries') as any)
            .update({
                summary,
                mood_rating: moodRating,
                progress_rating: progressRating,
                key_topics: keyTopics,
                homework,
                next_session_focus: nextSessionFocus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', summaryId)
            .eq('psychologist_id', profile.id)
            .is('deleted_at', null)

        if (error) {
            return { error: error.message }
        }

        await logAudit(supabase, profile.id, patientId, 'update', 'session_summary', summaryId, {
            summary: summary.substring(0, 50),
        })
    } else {
        const { data: record, error } = await (supabase
            .from('session_summaries') as any)
            .insert({
                appointment_id: appointmentId,
                psychologist_id: profile.id,
                patient_id: patientId,
                summary,
                mood_rating: moodRating,
                progress_rating: progressRating,
                key_topics: keyTopics,
                homework,
                next_session_focus: nextSessionFocus,
            })
            .select('id')
            .single()

        if (error) {
            return { error: error.message }
        }

        await logAudit(supabase, profile.id, patientId, 'create', 'session_summary', record?.id, {
            summary: summary.substring(0, 50),
        })
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}

export async function deleteSessionSummary(summaryId: string) {
    const supabase = await createClient()
    const { error: accessError, profile } = await requirePatientsWorkspace()
    if (accessError || !profile) return { error: accessError }

    const { data: summary } = await (supabase
        .from('session_summaries') as any)
        .select('patient_id')
        .eq('id', summaryId)
        .eq('psychologist_id', profile.id)
        .is('deleted_at', null)
        .single()

    const { error } = await (supabase
        .from('session_summaries') as any)
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: profile.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', summaryId)
        .eq('psychologist_id', profile.id)
        .is('deleted_at', null)

    if (error) {
        return { error: error.message }
    }

    if (summary) {
        await logAudit(supabase, profile.id, summary.patient_id, 'delete', 'session_summary', summaryId, {})
        revalidatePath(`/dashboard/patients/${summary.patient_id}`)
    }

    return { success: true }
}

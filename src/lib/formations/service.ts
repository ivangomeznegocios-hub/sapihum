import { createServiceClient } from '@/lib/supabase/service'
import { grantEventEntitlements } from '@/lib/events/entitlements'

function normalizeFormationEmail(email: string) {
    return email.trim().toLowerCase()
}

function buildCertificateLabel(params: {
    formationTitle: string
    formationLabel?: string | null
    eventTitle?: string | null
    scopeType: 'individual_course' | 'full_program'
}) {
    if (params.scopeType === 'full_program') {
        return params.formationLabel?.trim() || `Certificacion de ${params.formationTitle}`
    }

    return params.eventTitle?.trim()
        ? `Constancia de ${params.eventTitle}`
        : `Constancia parcial de ${params.formationTitle}`
}

async function upsertFormationCertificate(params: {
    supabase: any
    formationId: string
    userId?: string | null
    email: string
    scopeType: 'individual_course' | 'full_program'
    scopeReference: string
    eventId?: string | null
    certificateType: 'participation' | 'completion' | 'specialized'
    label: string
    issuedBy?: string | null
    metadata?: Record<string, unknown>
}) {
    const normalizedEmail = normalizeFormationEmail(params.email)

    const { error } = await (params.supabase
        .from('formation_certificates') as any)
        .upsert({
            formation_id: params.formationId,
            user_id: params.userId ?? null,
            email: normalizedEmail,
            identity_key: normalizedEmail,
            scope_type: params.scopeType,
            scope_reference: params.scopeReference,
            event_id: params.eventId ?? null,
            certificate_type: params.certificateType,
            label: params.label,
            issued_by: params.issuedBy ?? null,
            issued_at: new Date().toISOString(),
            metadata: params.metadata ?? {},
        }, {
            onConflict: 'formation_id,scope_type,scope_reference,identity_key',
        })

    if (error) {
        throw new Error(`No fue posible emitir el certificado: ${error.message}`)
    }
}

export async function issueFormationFullCertificateRecord(params: {
    supabase: any
    formationId: string
    email: string
    userId?: string | null
    issuedBy?: string | null
}) {
    const normalizedEmail = normalizeFormationEmail(params.email)

    const [{ data: formation }, completionState, { data: confirmedBundlePurchase }] = await Promise.all([
        (params.supabase
            .from('formations') as any)
            .select('id, title, full_certificate_type, full_certificate_label')
            .eq('id', params.formationId)
            .single(),
        getFormationCompletionState({
            supabase: params.supabase,
            formationId: params.formationId,
            email: normalizedEmail,
        }),
        (params.supabase
            .from('formation_purchases') as any)
            .select('id')
            .eq('formation_id', params.formationId)
            .eq('email', normalizedEmail)
            .eq('status', 'confirmed')
            .maybeSingle(),
    ])

    if (!formation) {
        throw new Error('Formacion no encontrada')
    }

    if (formation.full_certificate_type === 'none') {
        throw new Error('Esta formacion no tiene certificado final configurado')
    }

    if (!confirmedBundlePurchase) {
        throw new Error('Solo los alumnos con compra completa del diplomado pueden recibir el certificado final')
    }

    if (!completionState.isFullyCompleted) {
        throw new Error('El alumno aun no ha completado todos los cursos requeridos')
    }

    await upsertFormationCertificate({
        supabase: params.supabase,
        formationId: params.formationId,
        userId: params.userId ?? null,
        email: normalizedEmail,
        scopeType: 'full_program',
        scopeReference: 'full_program',
        certificateType: formation.full_certificate_type,
        label: buildCertificateLabel({
            formationTitle: formation.title,
            formationLabel: formation.full_certificate_label,
            scopeType: 'full_program',
        }),
        issuedBy: params.issuedBy ?? null,
        metadata: {
            source: 'manual_issue',
            completed_required_courses: completionState.completedRequiredCount,
        },
    })

    return { success: true }
}

export async function claimFormationRecordsByEmail(params: {
    userId: string
    email: string | null | undefined
}) {
    const normalizedEmail = params.email?.trim().toLowerCase()
    if (!normalizedEmail) return

    const admin = createServiceClient()

    await Promise.all([
        (admin.from('formation_purchases') as any)
            .update({ user_id: params.userId })
            .is('user_id', null)
            .eq('email', normalizedEmail),
        (admin.from('formation_progress') as any)
            .update({ user_id: params.userId })
            .is('user_id', null)
            .eq('email', normalizedEmail),
        (admin.from('formation_certificates') as any)
            .update({ user_id: params.userId })
            .is('user_id', null)
            .eq('identity_key', normalizedEmail),
    ])
}

export async function getFormationCompletionState(params: {
    supabase: any
    formationId: string
    email: string
}) {
    const normalizedEmail = normalizeFormationEmail(params.email)

    const [{ data: requiredCourses }, { data: completedRows }] = await Promise.all([
        (params.supabase
            .from('formation_courses') as any)
            .select('event_id')
            .eq('formation_id', params.formationId)
            .eq('is_required', true),
        (params.supabase
            .from('formation_progress') as any)
            .select('event_id')
            .eq('formation_id', params.formationId)
            .eq('email', normalizedEmail),
    ])

    const requiredIds = (requiredCourses ?? []).map((course: any) => course.event_id).filter(Boolean)
    const completedIds = (completedRows ?? []).map((row: any) => row.event_id).filter(Boolean)
    const completedSet = new Set(completedIds)

    const completedRequiredCount = requiredIds.filter((eventId: string) => completedSet.has(eventId)).length

    return {
        requiredIds,
        completedIds,
        completedSet,
        completedRequiredCount,
        totalRequiredCount: requiredIds.length,
        isFullyCompleted: requiredIds.length > 0 && completedRequiredCount === requiredIds.length,
    }
}

export async function grantFormationBundleAccess(params: {
    supabase: any
    formationId: string
    purchaseId: string
    email: string
    userId?: string | null
    paymentReference?: string | null
    providerSessionId?: string | null
    providerPaymentId?: string | null
    source?: string
}) {
    const normalizedEmail = normalizeFormationEmail(params.email)

    const { data: linkedEvents, error: eventsError } = await (params.supabase
        .from('events') as any)
        .select('id, event_type, recording_expires_at')
        .eq('formation_id', params.formationId)

    if (eventsError) {
        throw new Error(`No fue posible cargar los cursos vinculados: ${eventsError.message}`)
    }

    for (const event of linkedEvents ?? []) {
        await grantEventEntitlements({
            event,
            email: normalizedEmail,
            userId: params.userId ?? null,
            sourceType: 'purchase',
            sourceReference: params.purchaseId,
            metadata: {
                formation_id: params.formationId,
                payment_reference: params.paymentReference ?? null,
                provider_session_id: params.providerSessionId ?? null,
                provider_payment_id: params.providerPaymentId ?? null,
                source: params.source ?? 'formation_purchase',
            },
        })

        if (params.userId && event.event_type !== 'on_demand') {
            const { data: existingRegistration } = await (params.supabase
                .from('event_registrations') as any)
                .select('id, registration_data')
                .eq('event_id', event.id)
                .eq('user_id', params.userId)
                .maybeSingle()

            const registrationPayload = {
                payment_reference: params.paymentReference ?? null,
                source: params.source ?? 'formation_purchase',
                formation_id: params.formationId,
            }

            if (existingRegistration) {
                await (params.supabase
                    .from('event_registrations') as any)
                    .update({
                        status: 'registered',
                        registration_data: {
                            ...(existingRegistration.registration_data ?? {}),
                            ...registrationPayload,
                        },
                    })
                    .eq('id', existingRegistration.id)
            } else {
                await (params.supabase
                    .from('event_registrations') as any)
                    .insert({
                        event_id: event.id,
                        user_id: params.userId,
                        status: 'registered',
                        registration_data: registrationPayload,
                    })
            }
        }
    }
}

export async function createConfirmedFormationPurchaseAndGrantAccess(params: {
    supabase: any
    formationId: string
    email: string
    fullName?: string | null
    userId?: string | null
    amountPaid: number
    currency?: string
    paymentReference?: string | null
    providerSessionId?: string | null
    providerPaymentId?: string | null
    metadata?: Record<string, unknown>
    source?: string
}) {
    const purchaseId = crypto.randomUUID()
    const normalizedEmail = normalizeFormationEmail(params.email)

    const { error } = await (params.supabase
        .from('formation_purchases') as any)
        .insert({
            id: purchaseId,
            formation_id: params.formationId,
            user_id: params.userId ?? null,
            email: normalizedEmail,
            full_name: params.fullName ?? null,
            amount_paid: params.amountPaid,
            currency: (params.currency || 'MXN').toUpperCase(),
            payment_reference: params.paymentReference ?? null,
            provider_session_id: params.providerSessionId ?? null,
            provider_payment_id: params.providerPaymentId ?? null,
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            metadata: params.metadata ?? {},
        })

    if (error) {
        throw new Error(`No fue posible confirmar la compra de la formacion: ${error.message}`)
    }

    await grantFormationBundleAccess({
        supabase: params.supabase,
        formationId: params.formationId,
        purchaseId,
        email: normalizedEmail,
        userId: params.userId ?? null,
        paymentReference: params.paymentReference ?? null,
        providerSessionId: params.providerSessionId ?? null,
        providerPaymentId: params.providerPaymentId ?? null,
        source: params.source,
    })

    return purchaseId
}

export async function markFormationCourseCompletedRecord(params: {
    supabase: any
    formationId: string
    eventId: string
    email: string
    userId?: string | null
    issuedBy?: string | null
}) {
    const normalizedEmail = normalizeFormationEmail(params.email)

    const [{ data: formation }, { data: linkedCourse }, { data: event }] = await Promise.all([
        (params.supabase
            .from('formations') as any)
            .select('id, title, individual_certificate_type, full_certificate_type, full_certificate_label')
            .eq('id', params.formationId)
            .single(),
        (params.supabase
            .from('formation_courses') as any)
            .select('id')
            .eq('formation_id', params.formationId)
            .eq('event_id', params.eventId)
            .maybeSingle(),
        (params.supabase
            .from('events') as any)
            .select('id, title')
            .eq('id', params.eventId)
            .maybeSingle(),
    ])

    if (!formation || !linkedCourse) {
        throw new Error('El curso no pertenece a esta formacion')
    }

    const shouldIssueIndividualCertificate = formation.individual_certificate_type !== 'none'

    const { error } = await (params.supabase
        .from('formation_progress') as any)
        .upsert({
            formation_id: params.formationId,
            event_id: params.eventId,
            email: normalizedEmail,
            user_id: params.userId ?? null,
            completed_at: new Date().toISOString(),
            certificate_issued: shouldIssueIndividualCertificate,
            certificate_issued_at: shouldIssueIndividualCertificate ? new Date().toISOString() : null,
        }, {
            onConflict: 'formation_id,email,event_id',
        })

    if (error) {
        throw new Error(`Error al marcar como completado: ${error.message}`)
    }

    if (shouldIssueIndividualCertificate) {
        await upsertFormationCertificate({
            supabase: params.supabase,
            formationId: params.formationId,
            userId: params.userId ?? null,
            email: normalizedEmail,
            scopeType: 'individual_course',
            scopeReference: params.eventId,
            eventId: params.eventId,
            certificateType: formation.individual_certificate_type,
            label: buildCertificateLabel({
                formationTitle: formation.title,
                eventTitle: event?.title ?? null,
                scopeType: 'individual_course',
            }),
            issuedBy: params.issuedBy ?? null,
            metadata: {
                source: 'formation_progress',
            },
        })
    }

    let fullCertificateIssued = false
    if (formation.full_certificate_type !== 'none') {
        const completionState = await getFormationCompletionState({
            supabase: params.supabase,
            formationId: params.formationId,
            email: normalizedEmail,
        })

        if (completionState.isFullyCompleted) {
            const { data: confirmedBundlePurchase } = await (params.supabase
                .from('formation_purchases') as any)
                .select('id')
                .eq('formation_id', params.formationId)
                .eq('email', normalizedEmail)
                .eq('status', 'confirmed')
                .maybeSingle()

            if (confirmedBundlePurchase) {
                await upsertFormationCertificate({
                    supabase: params.supabase,
                    formationId: params.formationId,
                    userId: params.userId ?? null,
                    email: normalizedEmail,
                    scopeType: 'full_program',
                    scopeReference: 'full_program',
                    certificateType: formation.full_certificate_type,
                    label: buildCertificateLabel({
                        formationTitle: formation.title,
                        formationLabel: formation.full_certificate_label,
                        scopeType: 'full_program',
                    }),
                    issuedBy: params.issuedBy ?? null,
                    metadata: {
                        source: 'formation_completion',
                        completed_required_courses: completionState.completedRequiredCount,
                    },
                })

                fullCertificateIssued = true
            }
        }
    }

    return { success: true, fullCertificateIssued }
}

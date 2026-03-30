'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FormationInsert, FormationUpdate } from '@/types/database'
import {
    issueFormationFullCertificateRecord,
    markFormationCourseCompletedRecord,
} from '@/lib/formations/service'

export async function createFormation(formation: FormationInsert, courseIds: string[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autorizado')
    }

    // 1. Create formation
    const { data: newFormation, error: formationError } = await (supabase
        .from('formations') as any)
        .insert({
            ...formation,
            created_by: user.id
        })
        .select()
        .single()

    if (formationError) {
        throw new Error(`Error al crear la formación: ${formationError.message}`)
    }

    // 2. Add courses
    if (courseIds && courseIds.length > 0) {
        const formationCourses = courseIds.map((eventId, index) => ({
            formation_id: newFormation.id,
            event_id: eventId,
            display_order: index,
            is_required: true
        }))

        const { error: coursesError } = await (supabase
            .from('formation_courses') as any)
            .insert(formationCourses)

        if (coursesError) {
            // Rollback is manual since RPC is not used
            await (supabase.from('formations') as any).delete().eq('id', newFormation.id)
            throw new Error(`Error al vincular los cursos: ${coursesError.message}`)
        }

        // 3. Update events to point to this formation
        await (supabase
            .from('events') as any)
            .update({ formation_id: newFormation.id })
            .in('id', courseIds)
    }

    revalidatePath('/dashboard/events/formations')
    return { success: true, formationId: newFormation.id }
}

export async function updateFormation(formationId: string, updates: FormationUpdate, newCourseIds: string[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autorizado')
    }

    // 1. Update formation details
    const { error: updateError } = await (supabase
        .from('formations') as any)
        .update(updates)
        .eq('id', formationId)

    if (updateError) {
        throw new Error(`Error al actualizar la formación: ${updateError.message}`)
    }

    // 2. Fetch existing courses
    const { data: existingCourses } = await (supabase
        .from('formation_courses') as any)
        .select('event_id')
        .eq('formation_id', formationId)

    const existingCourseIds = existingCourses?.map((ec: { event_id: string }) => ec.event_id) || []

    // 3. Determine courses to add and remove
    const coursesToRemove = existingCourseIds.filter((id: string) => !newCourseIds.includes(id))
    
    if (coursesToRemove.length > 0) {
        // Remove relationships
        await ((supabase
            .from('formation_courses' as any)) as any)
            .delete()
            .eq('formation_id', formationId)
            .in('event_id', coursesToRemove)
            
        // Disconnect from events table
        await (supabase
            .from('events') as any)
            .update({ formation_id: null })
            .eq('formation_id', formationId)
            .in('id', coursesToRemove)
    }

    // Update orders of all new courses
    for (let i = 0; i < newCourseIds.length; i++) {
        const eventId = newCourseIds[i]
        const isNew = !existingCourseIds.includes(eventId)

        if (isNew) {
            await ((supabase
                .from('formation_courses' as any)) as any)
                .insert({
                    formation_id: formationId,
                    event_id: eventId,
                    display_order: i,
                    is_required: true
                })
        } else {
            await ((supabase
                .from('formation_courses' as any)) as any)
                .update({ display_order: i })
                .eq('formation_id', formationId)
                .eq('event_id', eventId)
        }
    }

    // Connect new ones to events table
    if (newCourseIds.length > 0) {
        await (supabase
            .from('events') as any)
            .update({ formation_id: formationId })
            .in('id', newCourseIds)
    }

    revalidatePath(`/dashboard/events/formations/${formationId}`)
    revalidatePath('/dashboard/events/formations')
    return { success: true }
}

export async function deleteFormation(formationId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autorizado')
    }

    // Disconnect events
    await (supabase
        .from('events') as any)
        .update({ formation_id: null })
        .eq('formation_id', formationId)

    const { error } = await (supabase
        .from('formations') as any)
        .delete()
        .eq('id', formationId)

    if (error) {
        throw new Error(`Error al eliminar la formación: ${error.message}`)
    }

    revalidatePath('/dashboard/events/formations')
    return { success: true }
}

export async function getFormationsForAdmin() {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('formations') as any)
        .select(`
            id,
            slug,
            title,
            status,
            bundle_price,
            total_hours,
            created_at,
            courses:formation_courses(count),
            purchases:formation_purchases(count)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching formations:', error)
        return []
    }

    return data.map((f: any) => ({
        ...f,
        total_courses: f.courses?.[0]?.count || 0,
        total_purchases: f.purchases?.[0]?.count || 0
    }))
}

export async function getFormationById(id: string) {
    const supabase = await createClient()

    const { data: formation, error } = await (supabase
        .from('formations') as any)
        .select('*')
        .eq('id', id)
        .single()

    if (error || !formation) {
        return null
    }

    const { data: courses } = await (supabase
        .from('formation_courses') as any)
        .select(`
            id,
            event_id,
            display_order,
            is_required,
            event:events(id, slug, title, status, event_type, price)
        `)
        .eq('formation_id', id)
        .order('display_order', { ascending: true })

    return {
        ...formation,
        courses: courses || []
    }
}

export async function getFormationLearnerProgress(formationId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autorizado')
    }

    const [{ data: courses }, { data: purchases }, { data: progress }, { data: certificates }] = await Promise.all([
        (supabase
            .from('formation_courses') as any)
            .select(`
                event_id,
                display_order,
                is_required,
                event:events(id, title, slug)
            `)
            .eq('formation_id', formationId)
            .order('display_order', { ascending: true }),
        (supabase
            .from('formation_purchases') as any)
            .select('id, user_id, email, full_name, purchased_at, confirmed_at, amount_paid, status')
            .eq('formation_id', formationId)
            .eq('status', 'confirmed')
            .order('confirmed_at', { ascending: false }),
        (supabase
            .from('formation_progress') as any)
            .select('user_id, email, event_id, completed_at, certificate_issued, certificate_issued_at')
            .eq('formation_id', formationId),
        (supabase
            .from('formation_certificates') as any)
            .select('user_id, email, scope_type, scope_reference, event_id, label, issued_at')
            .eq('formation_id', formationId),
    ])

    const courseList = (courses ?? []).map((course: any) => ({
        event_id: course.event_id,
        display_order: course.display_order,
        is_required: course.is_required,
        event: Array.isArray(course.event) ? course.event[0] : course.event,
    }))

    const progressByEmail = new Map<string, any[]>()
    for (const row of progress ?? []) {
        const key = String(row.email || '').trim().toLowerCase()
        const collection = progressByEmail.get(key) ?? []
        collection.push(row)
        progressByEmail.set(key, collection)
    }

    const certificatesByEmail = new Map<string, any[]>()
    for (const row of certificates ?? []) {
        const key = String(row.email || '').trim().toLowerCase()
        const collection = certificatesByEmail.get(key) ?? []
        collection.push(row)
        certificatesByEmail.set(key, collection)
    }

    return (purchases ?? []).map((purchase: any) => {
        const emailKey = String(purchase.email || '').trim().toLowerCase()
        const learnerProgress = progressByEmail.get(emailKey) ?? []
        const learnerCertificates = certificatesByEmail.get(emailKey) ?? []
        const completedEventIds = new Set(learnerProgress.map((item: any) => item.event_id))
        const fullCertificate = learnerCertificates.find((item: any) => item.scope_type === 'full_program') ?? null
        const completedRequiredCount = courseList.filter((course: any) => course.is_required !== false && completedEventIds.has(course.event_id)).length
        const totalRequiredCount = courseList.filter((course: any) => course.is_required !== false).length

        return {
            ...purchase,
            completedRequiredCount,
            totalRequiredCount,
            hasFullCertificate: Boolean(fullCertificate),
            fullCertificateIssuedAt: fullCertificate?.issued_at ?? null,
            courses: courseList.map((course: any) => {
                const courseProgress = learnerProgress.find((item: any) => item.event_id === course.event_id) ?? null
                const courseCertificate = learnerCertificates.find((item: any) => item.scope_type === 'individual_course' && item.event_id === course.event_id) ?? null

                return {
                    ...course,
                    isCompleted: Boolean(courseProgress),
                    completedAt: courseProgress?.completed_at ?? null,
                    hasCertificate: Boolean(courseCertificate),
                    certificateIssuedAt: courseCertificate?.issued_at ?? courseProgress?.certificate_issued_at ?? null,
                }
            }),
        }
    })
}

// Client helper
export async function markCourseCompleted(formationId: string, eventId: string, email: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Find the student profile to link
    const { data: profile } = await (supabase.from('profiles') as any).select('id').eq('email', email).maybeSingle()

    await markFormationCourseCompletedRecord({
        supabase,
        formationId,
        eventId,
        email,
        userId: profile?.id || null,
        issuedBy: user.id,
    })

    revalidatePath(`/dashboard/events/formations/${formationId}`)
    return { success: true }
}

// Issue the final full certificate
export async function issueFullCertificate(formationId: string, email: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await (supabase.from('profiles') as any).select('id').eq('email', email).maybeSingle()

    await issueFormationFullCertificateRecord({
        supabase,
        formationId,
        email,
        userId: profile?.id || null,
        issuedBy: user.id,
    })

    revalidatePath(`/dashboard/events/formations/${formationId}`)
    return { success: true }
}

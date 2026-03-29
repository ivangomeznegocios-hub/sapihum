'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FormationInsert, FormationUpdate } from '@/types/database'

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
            event:events(id, title, status, event_type, price)
        `)
        .eq('formation_id', id)
        .order('display_order', { ascending: true })

    return {
        ...formation,
        courses: courses || []
    }
}

// Client helper
export async function markCourseCompleted(formationId: string, eventId: string, email: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Find the student profile to link
    const { data: profile } = await (supabase.from('profiles') as any).select('id').eq('email', email).maybeSingle()

    // Upsert progress
    const { error } = await (supabase
        .from('formation_progress') as any)
        .upsert({
            formation_id: formationId,
            event_id: eventId,
            email: email,
            user_id: profile?.id || null,
            completed_at: new Date().toISOString(),
            certificate_issued: true, // as requested: mark as granted automatically or by admin
            certificate_issued_at: new Date().toISOString()
        }, { onConflict: 'formation_id,email,event_id' })

    if (error) {
        throw new Error(`Error al marcar como completado: ${error.message}`)
    }

    revalidatePath(`/dashboard/events/formations/${formationId}`)
    return { success: true }
}

// Issue the final full certificate
export async function issueFullCertificate() {
    // This is a placeholder since the final certificate logic will be manual for now,
    // but we can track it globally per user if needed
    // Usually we would insert this into a global certificates table
    return { success: true }
}

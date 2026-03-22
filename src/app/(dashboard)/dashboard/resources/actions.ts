'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserRole } from '@/lib/supabase/server'

export async function createResource(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    const role = await getUserRole()
    if (role !== 'admin' && role !== 'ponente') {
        return { error: 'No tienes permisos para crear recursos' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const url = formData.get('url') as string
    const visibility = formData.get('visibility') as string
    const category = formData.get('category') as string || 'general'
    const expiresAt = formData.get('expires_at') as string || null
    const tagsRaw = formData.get('tags') as string || ''
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
    const isFeatured = formData.get('is_featured') === 'true'
    const eventId = formData.get('event_id') as string || null

    // Audience: multiple checkboxes
    const audienceValues = formData.getAll('target_audience') as string[]
    const targetAudience = audienceValues.length > 0 ? audienceValues : ['public']

    const htmlContent = formData.get('html_content') as string || null

    // For tool type, URL is optional (we use the inline HTML)
    if (!title || !type || !visibility) {
        return { error: 'Faltan campos requeridos' }
    }
    if (type !== 'tool' && !url) {
        return { error: 'URL es requerida para este tipo de recurso' }
    }

    const insertData: any = {
        title,
        description,
        type,
        url: type === 'tool' && !url ? '#interactive-tool' : url,
        visibility,
        created_by: user.id,
        category,
        tags,
        target_audience: targetAudience,
        expires_at: expiresAt || null,
        html_content: type === 'tool' ? htmlContent : null,
    }

    // Only admin can set featured
    if (role === 'admin') {
        insertData.is_featured = isFeatured
    }

    const { data: resource, error } = await (supabase
        .from('resources') as any)
        .insert(insertData)
        .select()
        .single()

    if (error) {
        console.error('Error creating resource:', error)
        return { error: 'Error al crear el recurso' }
    }

    // If event_id provided, link resource to event
    if (eventId && resource) {
        const { error: linkError } = await (supabase
            .from('event_resources') as any)
            .insert({
                event_id: eventId,
                resource_id: resource.id,
                is_locked: true
            } as any)

        if (linkError) {
            console.error('Error linking resource to event:', linkError)
            // Don't fail the whole operation, just log
        }
    }

    revalidatePath('/dashboard/resources')
    if (eventId) revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
}

export async function updateResource(resourceId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    const role = await getUserRole()

    // Admin can edit all. Ponente can edit only their own.
    if (role === 'ponente') {
        // Verify ownership
        const { data: existing } = await (supabase
            .from('resources') as any)
            .select('created_by')
            .eq('id', resourceId)
            .single()

        if (!existing || existing.created_by !== user.id) {
            return { error: 'Solo puedes editar tus propios recursos' }
        }
    } else if (role !== 'admin') {
        return { error: 'No tienes permisos para editar recursos' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const url = formData.get('url') as string
    const visibility = formData.get('visibility') as string
    const category = formData.get('category') as string || 'general'
    const expiresAt = formData.get('expires_at') as string || null
    const tagsRaw = formData.get('tags') as string || ''
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

    // Audience
    const audienceValues = formData.getAll('target_audience') as string[]
    const targetAudience = audienceValues.length > 0 ? audienceValues : ['public']

    const htmlContent = formData.get('html_content') as string || null

    if (!title || !type || !visibility) {
        return { error: 'Faltan campos requeridos' }
    }
    if (type !== 'tool' && !url) {
        return { error: 'URL es requerida para este tipo de recurso' }
    }

    const updateData: any = {
        title,
        description,
        type,
        url: type === 'tool' && !url ? '#interactive-tool' : url,
        visibility,
        category,
        tags,
        target_audience: targetAudience,
        expires_at: expiresAt || null,
        html_content: type === 'tool' ? htmlContent : null,
    }

    // Only admin can toggle featured
    if (role === 'admin') {
        const isFeatured = formData.get('is_featured') === 'true'
        updateData.is_featured = isFeatured
    }

    const { error } = await (supabase
        .from('resources') as any)
        .update(updateData)
        .eq('id', resourceId)

    if (error) {
        console.error('Error updating resource:', error)
        return { error: 'Error al actualizar el recurso' }
    }

    revalidatePath('/dashboard/resources')
    return { success: true }
}

export async function deleteResource(resourceId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    // Only admin can delete resources
    const role = await getUserRole()
    if (role !== 'admin') {
        return { error: 'Solo los administradores pueden eliminar recursos' }
    }

    const { error } = await (supabase
        .from('resources') as any)
        .delete()
        .eq('id', resourceId)

    if (error) {
        console.error('Error deleting resource:', error)
        return { error: 'Error al eliminar el recurso' }
    }

    revalidatePath('/dashboard/resources')
    return { success: true }
}

// ============================================
// EVENT-RESOURCE LINKING ACTIONS
// ============================================

export async function linkResourceToEventAction(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    const role = await getUserRole()
    if (role !== 'admin' && role !== 'ponente') {
        return { error: 'No tienes permisos' }
    }

    const eventId = formData.get('event_id') as string
    const resourceId = formData.get('resource_id') as string
    const isLocked = formData.get('is_locked') !== 'false'

    if (!eventId || !resourceId) {
        return { error: 'Faltan datos requeridos' }
    }

    // If ponente, verify they created the event
    if (role === 'ponente') {
        const { data: event } = await (supabase
            .from('events') as any)
            .select('created_by')
            .eq('id', eventId)
            .single()

        if (!event || event.created_by !== user.id) {
            return { error: 'Solo puedes vincular recursos a tus propios eventos' }
        }
    }

    const { error } = await (supabase
        .from('event_resources') as any)
        .insert({
            event_id: eventId,
            resource_id: resourceId,
            is_locked: isLocked
        } as any)

    if (error) {
        console.error('Error linking resource:', error)
        return { error: 'Error al vincular recurso' }
    }

    revalidatePath(`/dashboard/events/${eventId}`)
    revalidatePath('/dashboard/resources')
    return { success: true }
}

export async function unlinkResourceFromEventAction(eventResourceId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    const role = await getUserRole()
    if (role !== 'admin' && role !== 'ponente') {
        return { error: 'No tienes permisos' }
    }

    const { error } = await (supabase
        .from('event_resources') as any)
        .delete()
        .eq('id', eventResourceId)

    if (error) {
        console.error('Error unlinking resource:', error)
        return { error: 'Error al desvincular recurso' }
    }

    revalidatePath('/dashboard/resources')
    return { success: true }
}

import { createClient } from '@/lib/supabase/server'
import type {
    Resource,
    ResourceInsert,
    ResourceWithAssignment,
    PatientResource,
    PatientResourceInsert,
    EventResource,
    EventResourceInsert,
    ResourceWithEvent
} from '@/types/database'
import { audienceAllowsAccess, getCommercialAccessContext } from '@/lib/access/commercial'
import { canViewerSeeListedResource } from '@/lib/access/catalog'

// ============================================
// Filter types
// ============================================
export interface ResourceFilters {
    type?: string
    category?: string
    audience?: string
    search?: string
    showExpired?: boolean
    eventId?: string
}

/**
 * Get all resources visible to the current user, filtered by role and membership level
 * Automatically excludes expired resources unless showExpired is true
 */
export async function getVisibleResources(filters?: ResourceFilters): Promise<Resource[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let query = (supabase.from('resources') as any).select('*')

    // Apply type filter
    if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type)
    }

    // Apply category filter
    if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
    }

    // Apply search filter
    if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Order: featured first, then by sort_order, then by created_at
    query = query.order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

    const { data: resources, error } = await query

    if (error) {
        console.error('Error fetching resources:', error)
        return []
    }

    if (!resources) return []

    if (!user) {
        return (resources as any[]).filter((resource: any) => {
            const audience: string[] = resource.target_audience || ['public']

            if (filters?.audience && filters.audience !== 'all' && !audience.includes(filters.audience)) {
                return false
            }

            return canViewerSeeListedResource(resource, null, Boolean(filters?.showExpired))
        }) as Resource[]
    }

    const commercialAccess = await getCommercialAccessContext({
        supabase,
        userId: user.id,
    })

    if (!commercialAccess) return []

    // Filter resources by target_audience, min_membership_level, and expiration
    return (resources as any[]).filter((resource: any) => {
        const audience: string[] = resource.target_audience || ['public']

        // Apply audience filter from URL params
        if (filters?.audience && filters.audience !== 'all') {
            if (!audience.includes(filters.audience)) return false
        }

        if (!audienceAllowsAccess(audience, commercialAccess, { creatorId: resource.created_by })) return false
        if (!canViewerSeeListedResource(resource, commercialAccess.viewer, Boolean(filters?.showExpired))) return false

        return true
    }) as Resource[]
}

/**
 * Get resources created by the current psychologist
 */
export async function getMyResources(): Promise<Resource[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: resources, error } = await (supabase
        .from('resources') as any)
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching my resources:', error)
        return []
    }

    return (resources ?? []) as Resource[]
}

/**
 * Get resources assigned to a specific patient
 */
export async function getPatientResources(patientId: string): Promise<ResourceWithAssignment[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('patient_resources') as any)
        .select(`
            *,
            resource:resources (*)
        `)
        .eq('patient_id', patientId)
        .order('assigned_at', { ascending: false })

    if (error) {
        console.error('Error fetching patient resources:', error)
        return []
    }

    // Transform to ResourceWithAssignment
    return (data ?? []).map((item: any) => ({
        ...item.resource,
        assignment: {
            id: item.id,
            resource_id: item.resource_id,
            patient_id: item.patient_id,
            assigned_by: item.assigned_by,
            notes: item.notes,
            assigned_at: item.assigned_at,
            viewed_at: item.viewed_at
        }
    })) as ResourceWithAssignment[]
}

/**
 * Create a new resource
 */
export async function createResource(resource: ResourceInsert): Promise<Resource | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('resources') as any)
        .insert(resource as any)
        .select()
        .single()

    if (error) {
        console.error('Error creating resource:', error)
        return null
    }

    return data as Resource
}

/**
 * Assign a resource to a patient
 */
export async function assignResourceToPatient(
    assignment: PatientResourceInsert
): Promise<PatientResource | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('patient_resources') as any)
        .insert(assignment as any)
        .select()
        .single()

    if (error) {
        console.error('Error assigning resource:', error)
        return null
    }

    return data as PatientResource
}

/**
 * Remove resource assignment from patient
 */
export async function removeResourceAssignment(assignmentId: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('patient_resources') as any)
        .delete()
        .eq('id', assignmentId)

    if (error) {
        console.error('Error removing assignment:', error)
        return false
    }

    return true
}

/**
 * Mark resource as viewed by patient
 */
export async function markResourceViewed(assignmentId: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('patient_resources') as any)
        .update({ viewed_at: new Date().toISOString() } as any)
        .eq('id', assignmentId)

    if (error) {
        console.error('Error marking resource viewed:', error)
        return false
    }

    return true
}

/**
 * Delete a resource
 */
export async function deleteResource(resourceId: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('resources') as any)
        .delete()
        .eq('id', resourceId)

    if (error) {
        console.error('Error deleting resource:', error)
        return false
    }

    return true
}

// ============================================
// EVENT-RESOURCE LINKING
// ============================================

/**
 * Get resources linked to a specific event
 */
export async function getResourcesByEvent(eventId: string): Promise<ResourceWithEvent[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('event_resources') as any)
        .select(`
            *,
            resource:resources (*)
        `)
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching event resources:', error)
        return []
    }

    return (data ?? []).map((item: any) => ({
        ...item.resource,
        event_resource: {
            id: item.id,
            event_id: item.event_id,
            resource_id: item.resource_id,
            is_locked: item.is_locked,
            unlock_at: item.unlock_at,
            display_order: item.display_order,
            created_at: item.created_at
        }
    })) as ResourceWithEvent[]
}

/**
 * Link a resource to an event
 */
export async function linkResourceToEvent(
    data: EventResourceInsert
): Promise<EventResource | null> {
    const supabase = await createClient()

    const { data: result, error } = await (supabase
        .from('event_resources') as any)
        .insert(data as any)
        .select()
        .single()

    if (error) {
        console.error('Error linking resource to event:', error)
        return null
    }

    return result as EventResource
}

/**
 * Unlink a resource from an event
 */
export async function unlinkResourceFromEvent(eventResourceId: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('event_resources') as any)
        .delete()
        .eq('id', eventResourceId)

    if (error) {
        console.error('Error unlinking resource from event:', error)
        return false
    }

    return true
}

/**
 * Increment download/view counter for a resource
 */
export async function incrementDownloadCount(resourceId: string): Promise<void> {
    const supabase = await createClient()

    await (supabase as any).rpc('increment_resource_downloads', {
        p_resource_id: resourceId
    })
}

/**
 * Get all events (for linking dropdown)
 */
export async function getEventsForLinking(): Promise<{ id: string; title: string; start_time: string }[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('events') as any)
        .select('id, title, start_time')
        .in('status', ['draft', 'upcoming', 'live', 'completed'])
        .order('start_time', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching events for linking:', error)
        return []
    }

    return (data ?? []) as { id: string; title: string; start_time: string }[]
}

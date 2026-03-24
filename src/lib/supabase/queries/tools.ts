import { createClient } from '@/lib/supabase/server'
import type {
    TherapeuticTool,
    TherapeuticToolInsert,
    ToolAssignment,
    ToolAssignmentInsert,
    ToolAssignmentWithDetails,
    ToolAssignmentWithTool,
    ToolResponse,
    ToolResponseInsert,
    ToolResponseUpdate,
    ToolCategory
} from '@/types/database'

// ============================================
// TOOL CATALOG
// ============================================

/**
 * Get all available tools (templates + psychologist's own)
 */
export async function getToolsCatalog(): Promise<TherapeuticTool[]> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('therapeutic_tools') as any)
        .select('*')
        .order('is_template', { ascending: false })
        .order('updated_at', { ascending: false })
        .order('title', { ascending: true })

    if (error) {
        console.error('Error fetching tools catalog:', error)
        return []
    }

    return (data ?? []) as TherapeuticTool[]
}

/**
 * Create a therapeutic tool template or custom tool
 */
export async function createTherapeuticTool(
    data: TherapeuticToolInsert
): Promise<TherapeuticTool | null> {
    const supabase = await createClient()

    const { data: tool, error } = await (supabase
        .from('therapeutic_tools') as any)
        .insert(data as any)
        .select()
        .single()

    if (error) {
        console.error('Error creating therapeutic tool:', error)
        return null
    }

    return tool as TherapeuticTool
}

/**
 * Search tools by query and optional category filter
 */
export async function searchTools(
    query: string,
    category?: ToolCategory
): Promise<TherapeuticTool[]> {
    const supabase = await createClient()

    let queryBuilder = (supabase
        .from('therapeutic_tools') as any)
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

    if (category) {
        queryBuilder = queryBuilder.eq('category', category)
    }

    const { data, error } = await queryBuilder.order('title', { ascending: true })

    if (error) {
        console.error('Error searching tools:', error)
        return []
    }

    return (data ?? []) as TherapeuticTool[]
}

/**
 * Get a single tool by ID
 */
export async function getToolById(toolId: string): Promise<TherapeuticTool | null> {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('therapeutic_tools') as any)
        .select('*')
        .eq('id', toolId)
        .single()

    if (error) {
        console.error('Error fetching tool:', error)
        return null
    }

    return data as TherapeuticTool
}

// ============================================
// TOOL ASSIGNMENTS
// ============================================

/**
 * Get all assignments for a specific patient (psychologist view)
 */
export async function getPatientToolAssignments(
    patientId: string
): Promise<ToolAssignmentWithDetails[]> {
    const supabase = await createClient()

    const { data: assignments, error } = await (supabase
        .from('tool_assignments') as any)
        .select('*')
        .eq('patient_id', patientId)
        .order('assigned_at', { ascending: false })

    if (error) {
        console.error('Error fetching patient tool assignments:', error)
        return []
    }

    if (!assignments?.length) return []

    // Get all unique tool IDs
    const toolIds = [...new Set(assignments.map((a: any) => a.tool_id))]
    const assignmentIds = assignments.map((a: any) => a.id)

    // Fetch tools and responses in parallel
    const [toolsResult, responsesResult] = await Promise.all([
        (supabase.from('therapeutic_tools') as any)
            .select('*')
            .in('id', toolIds),
        (supabase.from('tool_responses') as any)
            .select('*')
            .in('assignment_id', assignmentIds)
    ])

    const tools = (toolsResult.data ?? []) as TherapeuticTool[]
    const responses = (responsesResult.data ?? []) as ToolResponse[]

    // Map tools and responses to assignments
    return assignments.map((assignment: any) => ({
        ...assignment,
        tool: tools.find((t) => t.id === assignment.tool_id),
        response: responses.find((r) => r.assignment_id === assignment.id)
    })) as ToolAssignmentWithDetails[]
}

/**
 * Get all assignments for the current patient (patient view)
 */
export async function getMyToolAssignments(): Promise<ToolAssignmentWithTool[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: assignments, error } = await (supabase
        .from('tool_assignments') as any)
        .select('*')
        .eq('patient_id', user.id)
        .order('assigned_at', { ascending: false })

    if (error) {
        console.error('Error fetching my tool assignments:', error)
        return []
    }

    if (!assignments?.length) return []

    // Get all unique tool IDs
    const toolIds = [...new Set(assignments.map((a: any) => a.tool_id))]

    const { data: tools } = await (supabase
        .from('therapeutic_tools') as any)
        .select('*')
        .in('id', toolIds)

    return assignments.map((assignment: any) => ({
        ...assignment,
        tool: (tools ?? []).find((t: any) => t.id === assignment.tool_id)
    })) as ToolAssignmentWithTool[]
}

/**
 * Get a specific assignment with full tool details (for rendering)
 */
export async function getAssignmentWithTool(
    assignmentId: string
): Promise<ToolAssignmentWithDetails | null> {
    const supabase = await createClient()

    const { data: assignment, error } = await (supabase
        .from('tool_assignments') as any)
        .select('*')
        .eq('id', assignmentId)
        .single()

    if (error || !assignment) {
        console.error('Error fetching assignment:', error)
        return null
    }

    // Get tool and response in parallel
    const [toolResult, responseResult] = await Promise.all([
        (supabase.from('therapeutic_tools') as any)
            .select('*')
            .eq('id', assignment.tool_id)
            .single(),
        (supabase.from('tool_responses') as any)
            .select('*')
            .eq('assignment_id', assignmentId)
            .single()
    ])

    return {
        ...assignment,
        tool: toolResult.data as TherapeuticTool,
        response: responseResult.data as ToolResponse | undefined
    } as ToolAssignmentWithDetails
}

/**
 * Create a tool assignment
 */
export async function createToolAssignment(
    data: ToolAssignmentInsert
): Promise<ToolAssignment | null> {
    const supabase = await createClient()

    const { data: assignment, error } = await (supabase
        .from('tool_assignments') as any)
        .insert(data as any)
        .select()
        .single()

    if (error) {
        console.error('Error creating tool assignment:', error)
        return null
    }

    return assignment as ToolAssignment
}

async function getAssignmentAccessContext(assignmentId: string): Promise<
    Pick<ToolAssignment, 'id' | 'patient_id' | 'psychologist_id'> | null
> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data: assignment, error } = await (supabase
        .from('tool_assignments') as any)
        .select('id, patient_id, psychologist_id')
        .eq('id', assignmentId)
        .maybeSingle()

    if (error) {
        console.error('Error fetching assignment access context:', error)
        return null
    }

    return (assignment ?? null) as Pick<ToolAssignment, 'id' | 'patient_id' | 'psychologist_id'> | null
}

/**
 * Toggle results visibility for a tool assignment
 */
export async function toggleResultsVisibility(
    assignmentId: string,
    visible: boolean
): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('tool_assignments') as any)
        .update({ results_visible: visible } as any)
        .eq('id', assignmentId)

    if (error) {
        console.error('Error toggling visibility:', error)
        return false
    }

    return true
}

/**
 * Delete a tool assignment
 */
export async function deleteToolAssignment(assignmentId: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('tool_assignments') as any)
        .delete()
        .eq('id', assignmentId)

    if (error) {
        console.error('Error deleting assignment:', error)
        return false
    }

    return true
}

export async function saveToolResponseForPatientUser(
    patientUserId: string,
    data: ToolResponseInsert
): Promise<ToolResponse | null> {
    const assignment = await getAssignmentAccessContext(data.assignment_id)

    if (!assignment || assignment.patient_id !== patientUserId) {
        console.error('Unauthorized tool response save attempt', {
            assignmentId: data.assignment_id,
            patientUserId,
        })
        return null
    }

    return saveToolResponse(data)
}

export async function updateAssignmentStatusForPatientUser(
    patientUserId: string,
    assignmentId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'expired',
    completedAt?: string
): Promise<boolean> {
    const assignment = await getAssignmentAccessContext(assignmentId)

    if (!assignment || assignment.patient_id !== patientUserId) {
        console.error('Unauthorized assignment status update attempt', {
            assignmentId,
            patientUserId,
            status,
        })
        return false
    }

    return updateAssignmentStatus(assignmentId, status, completedAt)
}

export async function toggleResultsVisibilityForPsychologist(
    psychologistUserId: string,
    assignmentId: string,
    visible: boolean
): Promise<boolean> {
    const assignment = await getAssignmentAccessContext(assignmentId)

    if (!assignment || assignment.psychologist_id !== psychologistUserId) {
        console.error('Unauthorized tool visibility update attempt', {
            assignmentId,
            psychologistUserId,
        })
        return false
    }

    return toggleResultsVisibility(assignmentId, visible)
}

export async function deleteToolAssignmentForPsychologist(
    psychologistUserId: string,
    assignmentId: string
): Promise<boolean> {
    const assignment = await getAssignmentAccessContext(assignmentId)

    if (!assignment || assignment.psychologist_id !== psychologistUserId) {
        console.error('Unauthorized tool assignment delete attempt', {
            assignmentId,
            psychologistUserId,
        })
        return false
    }

    return deleteToolAssignment(assignmentId)
}

// ============================================
// TOOL RESPONSES
// ============================================

/**
 * Save or update a tool response (for patient)
 */
export async function saveToolResponse(
    data: ToolResponseInsert
): Promise<ToolResponse | null> {
    const supabase = await createClient()

    // Check if response already exists
    const { data: existing } = await (supabase
        .from('tool_responses') as any)
        .select('id')
        .eq('assignment_id', data.assignment_id)
        .single()

    if (existing) {
        // Update existing response
        const { data: updated, error } = await (supabase
            .from('tool_responses') as any)
            .update({
                responses: data.responses,
                scores: data.scores,
                progress: data.progress,
                completed_at: data.progress === 100 ? new Date().toISOString() : null
            } as any)
            .eq('id', existing.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating response:', error)
            return null
        }

        return updated as ToolResponse
    }

    // Create new response
    const { data: response, error } = await (supabase
        .from('tool_responses') as any)
        .insert(data as any)
        .select()
        .single()

    if (error) {
        console.error('Error creating response:', error)
        return null
    }

    return response as ToolResponse
}

/**
 * Update assignment status
 */
export async function updateAssignmentStatus(
    assignmentId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'expired',
    completedAt?: string
): Promise<boolean> {
    const supabase = await createClient()

    const updateData: any = { status }
    if (completedAt) updateData.completed_at = completedAt

    const { error } = await (supabase
        .from('tool_assignments') as any)
        .update(updateData)
        .eq('id', assignmentId)

    if (error) {
        console.error('Error updating assignment status:', error)
        return false
    }

    return true
}

/**
 * Get pending tool count for a patient (for dashboard badge)
 */
export async function getPendingToolCount(): Promise<number> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { count, error } = await (supabase
        .from('tool_assignments') as any)
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', user.id)
        .in('status', ['pending', 'in_progress'])

    if (error) {
        console.error('Error counting pending tools:', error)
        return 0
    }

    return count ?? 0
}

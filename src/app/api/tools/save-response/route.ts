import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveToolResponse, updateAssignmentStatus } from '@/lib/supabase/queries/tools'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const body = await request.json()
        const { assignmentId, responses, scores, progress, completed } = body

        if (!assignmentId) {
            return NextResponse.json({ error: 'Assignment ID requerido' }, { status: 400 })
        }

        // Save response
        const result = await saveToolResponse({
            assignment_id: assignmentId,
            responses: responses || {},
            scores: scores || {},
            progress: progress || 0
        })

        if (!result) {
            return NextResponse.json({ error: 'Error al guardar respuesta' }, { status: 500 })
        }

        // If completed, update assignment status
        if (completed) {
            await updateAssignmentStatus(
                assignmentId,
                'completed',
                new Date().toISOString()
            )
        } else if (progress > 0) {
            await updateAssignmentStatus(assignmentId, 'in_progress')
        }

        return NextResponse.json({ success: true, response: result })
    } catch (error) {
        console.error('Error in save-response API:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

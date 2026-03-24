import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    saveToolResponseForPatientUser,
    updateAssignmentStatusForPatientUser,
} from '@/lib/supabase/queries/tools'

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
        const result = await saveToolResponseForPatientUser(user.id, {
            assignment_id: assignmentId,
            responses: responses || {},
            scores: scores || {},
            progress: progress || 0
        })

        if (!result) {
            return NextResponse.json(
                { error: 'No tienes acceso a esta herramienta o no se pudo guardar la respuesta' },
                { status: 403 }
            )
        }

        // If completed, update assignment status
        if (completed) {
            const updated = await updateAssignmentStatusForPatientUser(
                user.id,
                assignmentId,
                'completed',
                new Date().toISOString()
            )
            if (!updated) {
                return NextResponse.json({ error: 'No fue posible actualizar el estado de la herramienta' }, { status: 403 })
            }
        } else if (progress > 0) {
            const updated = await updateAssignmentStatusForPatientUser(user.id, assignmentId, 'in_progress')
            if (!updated) {
                return NextResponse.json({ error: 'No fue posible actualizar el estado de la herramienta' }, { status: 403 })
            }
        }

        return NextResponse.json({ success: true, response: result })
    } catch (error) {
        console.error('Error in save-response API:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

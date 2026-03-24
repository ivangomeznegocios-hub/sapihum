import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ClinicalRecordInsert } from '@/types/database'

const ClinicalRecordSchema = z.object({
    patient_id: z.string().uuid(),
    psychologist_id: z.string().uuid(),
    type: z.string().min(1),
    content: z.record(z.string(), z.unknown()),
    tags: z.array(z.string()).optional(),
    appointment_id: z.string().uuid().nullable().optional(),
    is_pinned: z.boolean().optional(),
    session_number: z.number().int().positive().optional(),
})

async function getCurrentProfileRole(supabase: any, userId: string): Promise<string | null> {
    const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('id', userId)
        .maybeSingle()

    return profile?.role ?? null
}

async function hasActiveRelationship(
    supabase: any,
    patientId: string,
    psychologistId: string
): Promise<boolean> {
    const { data: relationship } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('id')
        .eq('patient_id', patientId)
        .eq('psychologist_id', psychologistId)
        .eq('status', 'active')
        .maybeSingle()

    return Boolean(relationship)
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const role = await getCurrentProfileRole(supabase, user.id)
        if (!role || !['psychologist', 'admin'].includes(role)) {
            return NextResponse.json(
                { error: 'Solo psicologos o admins pueden crear registros clinicos' },
                { status: 403 }
            )
        }

        const parsedBody = ClinicalRecordSchema.safeParse(await request.json())
        if (!parsedBody.success) {
            return NextResponse.json(
                { error: 'Payload de registro clinico invalido' },
                { status: 400 }
            )
        }

        const body = parsedBody.data as ClinicalRecordInsert

        if (role !== 'admin' && body.psychologist_id !== user.id) {
            return NextResponse.json(
                { error: 'No autorizado para crear registros para otro psicologo' },
                { status: 403 }
            )
        }

        const authorizedPsychologistId = role === 'admin' ? body.psychologist_id : user.id
        const relationshipExists = await hasActiveRelationship(
            supabase,
            body.patient_id,
            authorizedPsychologistId
        )

        if (!relationshipExists) {
            return NextResponse.json(
                { error: 'No existe una relacion activa con este paciente' },
                { status: 403 }
            )
        }

        const { data, error } = await (supabase
            .from('clinical_records') as any)
            .insert({
                ...body,
                psychologist_id: authorizedPsychologistId,
            } as any)
            .select()
            .single()

        if (error) {
            console.error('Error creating clinical record:', error)
            return NextResponse.json(
                { error: 'Error al crear el registro clinico' },
                { status: 500 }
            )
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('Error in clinical records API:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const role = await getCurrentProfileRole(supabase, user.id)
        if (!role || !['psychologist', 'admin'].includes(role)) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const patientId = searchParams.get('patient_id')

        let query = (supabase
            .from('clinical_records') as any)
            .select('*')
            .eq('psychologist_id', user.id)
            .order('created_at', { ascending: false })

        if (patientId) {
            const relationshipExists = await hasActiveRelationship(supabase, patientId, user.id)
            if (!relationshipExists) {
                return NextResponse.json(
                    { error: 'No tienes acceso a los registros de este paciente' },
                    { status: 403 }
                )
            }

            query = query.eq('patient_id', patientId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching clinical records:', error)
            return NextResponse.json(
                { error: 'Error al obtener registros clinicos' },
                { status: 500 }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in clinical records API:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

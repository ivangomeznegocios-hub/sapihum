import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ClinicalRecordInsert } from '@/types/database'

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

        const body: ClinicalRecordInsert = await request.json()

        // Validate that the psychologist matches the authenticated user
        if (body.psychologist_id !== user.id) {
            return NextResponse.json(
                { error: 'No autorizado para crear registros para otro psicólogo' },
                { status: 403 }
            )
        }

        // Create the clinical record
        const { data, error } = await (supabase
            .from('clinical_records') as any)
            .insert(body as any)
            .select()
            .single()

        if (error) {
            console.error('Error creating clinical record:', error)
            return NextResponse.json(
                { error: 'Error al crear el registro clínico' },
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

        const { searchParams } = new URL(request.url)
        const patientId = searchParams.get('patient_id')

        let query = (supabase
            .from('clinical_records') as any)
            .select('*')
            .eq('psychologist_id', user.id)
            .order('created_at', { ascending: false })

        if (patientId) {
            query = query.eq('patient_id', patientId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching clinical records:', error)
            return NextResponse.json(
                { error: 'Error al obtener registros clínicos' },
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

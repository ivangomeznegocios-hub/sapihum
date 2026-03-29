import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { getFormationById } from '../../formation-actions'
import { FormationForm } from '@/components/formations/formation-form'

export const metadata = {
    title: 'Editar Formación | SAPIHUM Admin',
}

export default async function EditFormationPage({ params }: { params: { id: string } }) {
    const supabase = createServerComponentClient<Database>({ cookies })

    const formation = await getFormationById(params.id)

    if (!formation) {
        notFound()
    }

    // Fetch all events for the select dropdown
    const { data: events } = await supabase
        .from('events')
        .select('id, title, price, status')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Formación</h1>
                <p className="text-muted-foreground mt-1">
                    Actualiza la información, precios o los cursos que conforman este paquete.
                </p>
            </div>

            <FormationForm 
                initialData={formation} 
                availableEvents={events || []} 
            />
        </div>
    )
}

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { FormationForm } from '@/components/formations/formation-form'

export const metadata = {
    title: 'Crear Formación | SAPIHUM Admin',
}

export default async function NewFormationPage() {
    const supabase = createServerComponentClient<Database>({ cookies })

    // Fetch all events to let the admin select which ones belong to the formation
    const { data: events } = await supabase
        .from('events')
        .select('id, title, price, status')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nueva Formación</h1>
                <p className="text-muted-foreground mt-1">
                    Agrupa múltiples eventos y cursos en un solo paquete para tus alumnos.
                </p>
            </div>

            <FormationForm availableEvents={events || []} />
        </div>
    )
}

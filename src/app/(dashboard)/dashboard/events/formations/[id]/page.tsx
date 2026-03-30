import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFormationById, getFormationLearnerProgress } from '../../formation-actions'
import { FormationForm } from '@/components/formations/formation-form'
import { FormationProgressManager } from '@/components/formations/formation-progress-manager'

export const metadata = {
    title: 'Editar Formacion | SAPIHUM Admin',
}

export default async function EditFormationPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const [formation, learners, eventsResult] = await Promise.all([
        getFormationById(id),
        getFormationLearnerProgress(id),
        supabase
            .from('events')
            .select('id, title, price, status')
            .order('created_at', { ascending: false }),
    ])

    if (!formation) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Formacion</h1>
                <p className="mt-1 text-muted-foreground">
                    Actualiza la informacion, precios, cursos incluidos y seguimiento real del diplomado.
                </p>
            </div>

            <FormationForm initialData={formation} availableEvents={eventsResult.data || []} />

            <FormationProgressManager formationId={id} learners={learners} />
        </div>
    )
}

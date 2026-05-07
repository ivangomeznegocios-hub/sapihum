import { notFound } from 'next/navigation'
import { getViewerContext } from '@/lib/supabase/server'
import { getFormationById, getFormationLearnerProgress } from '../../formation-actions'
import { FormationForm } from '@/components/formations/formation-form'
import { FormationProgressManager } from '@/components/formations/formation-progress-manager'
import { applyVerticalContentFilter } from '@/lib/supabase/vertical-content'

export const metadata = {
    title: 'Editar Formacion | SAPIHUM Admin',
}

export default async function EditFormationPage({ params }: { params: Promise<{ id: string }> }) {
    const viewer = await getViewerContext()
    const { supabase, user, profile, availableVerticals, activeVertical } = viewer
    const { id } = await params

    if (!profile || !['admin', 'ponente'].includes(profile.role)) {
        notFound()
    }

    const isAdmin = profile?.role === 'admin'

    let eventsQuery = supabase
        .from('events')
        .select('id, title, price, status')
        .or(`formation_id.is.null,formation_id.eq.${id}`)
        .order('created_at', { ascending: false })

    if (!isAdmin && user) {
        eventsQuery = eventsQuery.eq('created_by', user.id)
    }

    eventsQuery = (await applyVerticalContentFilter(
        supabase,
        eventsQuery,
        { table: 'event_verticals', contentIdColumn: 'event_id' },
        activeVertical?.id
    )).query

    const [formation, learners, eventsResult] = await Promise.all([
        getFormationById(id),
        isAdmin ? getFormationLearnerProgress(id) : Promise.resolve([]),
        eventsQuery,
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

            <FormationForm
                initialData={formation}
                availableEvents={eventsResult.data || []}
                canPublish={isAdmin}
                availableVerticals={availableVerticals}
                activeVertical={activeVertical}
            />

            {isAdmin ? <FormationProgressManager formationId={id} learners={learners} /> : null}
        </div>
    )
}

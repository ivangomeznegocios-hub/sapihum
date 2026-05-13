import { notFound } from 'next/navigation'
import { FormationForm } from '@/components/formations/formation-form'
import { getViewerContext } from '@/lib/supabase/server'
import { applyVerticalContentFilter } from '@/lib/supabase/vertical-content'
import { canCreateEvent, canManageAnyEvent, canPublishEvent } from '@/lib/events/permissions'

export const metadata = {
    title: 'Crear Formacion | SAPIHUM Admin',
}

export default async function NewFormationPage() {
    const viewer = await getViewerContext()
    const { supabase, user, profile, availableVerticals, activeVertical } = viewer

    if (!profile || !canCreateEvent(profile.role)) {
        notFound()
    }

    const canManageAllEvents = canManageAnyEvent(profile?.role)
    const canPublish = canPublishEvent(profile?.role)

    let eventsQuery = supabase
        .from('events')
        .select('id, title, price, status')
        .is('formation_id', null)
        .order('created_at', { ascending: false })

    if (!canManageAllEvents && user) {
        eventsQuery = eventsQuery.eq('created_by', user.id)
    }

    eventsQuery = (await applyVerticalContentFilter(
        supabase,
        eventsQuery,
        { table: 'event_verticals', contentIdColumn: 'event_id' },
        activeVertical?.id
    )).query

    const { data: events } = await eventsQuery

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nueva Formacion</h1>
                <p className="mt-1 text-muted-foreground">
                    Agrupa multiples eventos y cursos en un solo paquete para tus alumnos.
                </p>
            </div>

            <FormationForm
                availableEvents={events || []}
                canPublish={canPublish}
                availableVerticals={availableVerticals}
                activeVertical={activeVertical}
            />
        </div>
    )
}

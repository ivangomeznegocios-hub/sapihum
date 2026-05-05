import { getEventsWithRegistration } from '@/lib/supabase/queries/events'
import { getViewerContext } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { EventsCategoryNav } from '../events-filter'
import { FilteredEventsList } from '../filtered-events-list'
import { isCommunityReadOnlyViewer } from '@/lib/access/commercial'
import { DEFAULT_TIMEZONE } from '@/lib/timezone'
import { EVENTS_LIST_SELECT } from '../event-list-select'

export default async function ClinicalEventsPage() {
    const viewer = await getViewerContext({ includeCommercialAccess: true })
    const { supabase, profile, commercialAccess } = viewer
    const events = await getEventsWithRegistration({
        supabase,
        userId: viewer.user?.id ?? null,
        profile,
        commercialAccess,
        select: EVENTS_LIST_SELECT,
    })
    const isActiveMember = Boolean(
        commercialAccess?.hasActiveMembership ||
        profile?.role === 'patient' ||
        profile?.role === 'admin'
    )
    const userTimezone = (profile as any)?.timezone || DEFAULT_TIMEZONE

    // Filter by clinical category
    const clinicalEvents = events.filter((e: any) => e.category === 'clinical')

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Escuela Clínica</h1>
                <p className="text-muted-foreground mt-1">
                    Educación continua clínica: cursos, diplomados, clases, talleres y más para tu crecimiento profesional
                </p>
            </div>

            <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando filtros...</div>}>
                <EventsCategoryNav />
            </Suspense>

            <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando eventos...</div>}>
                <FilteredEventsList
                    events={clinicalEvents}
                    isActiveMember={isActiveMember}
                    userId={profile?.id}
                    isReadOnly={commercialAccess ? isCommunityReadOnlyViewer(commercialAccess) : false}
                    timezone={userTimezone}
                />
            </Suspense>
        </div>
    )
}

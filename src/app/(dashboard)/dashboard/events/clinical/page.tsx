import { getEventsWithRegistration } from '@/lib/supabase/queries/events'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { EventsCategoryNav } from '../events-filter'
import { FilteredEventsList } from '../filtered-events-list'
import { getCommercialAccessContext, isCommunityReadOnlyViewer } from '@/lib/access/commercial'

export default async function ClinicalEventsPage() {
    const events = await getEventsWithRegistration()
    const profile = await getUserProfile()
    const supabase = profile ? await createClient() : null
    const commercialAccess = profile && supabase
        ? await getCommercialAccessContext({
            supabase,
            userId: profile.id,
            profile,
        })
        : null
    const isActiveMember = Boolean(
        commercialAccess?.hasActiveMembership ||
        profile?.role === 'patient' ||
        profile?.role === 'admin'
    )

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
                />
            </Suspense>
        </div>
    )
}

import { getEventsWithRegistration } from '@/lib/supabase/queries/events'
import { getViewerContext } from '@/lib/supabase/server'
import { EventsCategoryNav } from '../events-filter'
import { FilteredEventsList } from '../filtered-events-list'
import { isCommunityReadOnlyViewer } from '@/lib/access/commercial'
import { DEFAULT_TIMEZONE } from '@/lib/timezone'
import { EVENTS_LIST_SELECT } from '../event-list-select'

export default async function NetworkingEventsPage() {
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

    // Filter by networking category
    const networkingEvents = events.filter((e: any) => e.category === 'networking')

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Eventos de Networking</h1>
                <p className="text-muted-foreground mt-1">
                    Conecta con otros profesionales, amplía tu red y participa en eventos sociales
                </p>
            </div>

            <EventsCategoryNav />

            <FilteredEventsList
                events={networkingEvents}
                isActiveMember={isActiveMember}
                userId={profile?.id}
                isReadOnly={commercialAccess ? isCommunityReadOnlyViewer(commercialAccess) : false}
                timezone={userTimezone}
            />
        </div>
    )
}

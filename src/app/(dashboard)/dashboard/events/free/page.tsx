import { getEventsWithRegistration } from '@/lib/supabase/queries/events'
import { getViewerContext } from '@/lib/supabase/server'
import { EventsCategoryNav } from '../events-filter'
import { FilteredEventsList } from '../filtered-events-list'
import { isCommunityReadOnlyViewer } from '@/lib/access/commercial'
import { DEFAULT_TIMEZONE } from '@/lib/timezone'
import { EVENTS_LIST_SELECT } from '../event-list-select'

function isPublicFreeEvent(event: any) {
    const audience = Array.isArray(event.target_audience) && event.target_audience.length > 0
        ? event.target_audience
        : ['public']

    return Number(event.price || 0) <= 0 &&
        !event.is_members_only &&
        audience.includes('public')
}

export default async function FreeEventsPage() {
    const viewer = await getViewerContext({ includeCommercialAccess: true })
    const { supabase, profile, commercialAccess } = viewer
    const events = await getEventsWithRegistration({
        supabase,
        userId: viewer.user?.id ?? null,
        profile,
        commercialAccess,
        activeVerticalId: viewer.activeVertical?.id ?? null,
        select: EVENTS_LIST_SELECT,
    })
    const userTimezone = (profile as any)?.timezone || DEFAULT_TIMEZONE
    const freeEvents = events.filter(isPublicFreeEvent)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Eventos gratuitos</h1>
                <p className="mt-1 text-muted-foreground">
                    Eventos abiertos al público, sin costo y sin membresía requerida.
                </p>
            </div>

            <EventsCategoryNav />

            <FilteredEventsList
                events={freeEvents}
                isActiveMember={Boolean(
                    commercialAccess?.hasActiveMembership ||
                    profile?.role === 'patient' ||
                    profile?.role === 'admin'
                )}
                userId={profile?.id}
                isReadOnly={commercialAccess ? isCommunityReadOnlyViewer(commercialAccess) : false}
                timezone={userTimezone}
            />
        </div>
    )
}

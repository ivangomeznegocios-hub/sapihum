import { getEventsWithRegistration } from '@/lib/supabase/queries/events'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import { EventsCategoryNav } from '../events-filter'
import { FilteredEventsList } from '../filtered-events-list'
import { getCommercialAccessContext, isCommunityReadOnlyViewer } from '@/lib/access/commercial'

export default async function BusinessEventsPage() {
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

    // Filter by business category
    const businessEvents = events.filter((e: any) => e.category === 'business')

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Eventos de Negocios</h1>
                <p className="text-muted-foreground mt-1">
                    Mejora tu práctica profesional, área corporativa y habilidades de negocio como psicólogo
                </p>
            </div>

            <EventsCategoryNav />

            <FilteredEventsList
                events={businessEvents}
                isActiveMember={isActiveMember}
                userId={profile?.id}
                isReadOnly={commercialAccess ? isCommunityReadOnlyViewer(commercialAccess) : false}
            />
        </div>
    )
}

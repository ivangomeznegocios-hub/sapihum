import { getEventsWithRegistration } from '@/lib/supabase/queries/events'
import { getUserProfile } from '@/lib/supabase/server'
import { EventsCategoryNav } from '../events-filter'
import { FilteredEventsList } from '../filtered-events-list'

export default async function NetworkingEventsPage() {
    const events = await getEventsWithRegistration()
    const profile = await getUserProfile()

    const isActiveMember = profile?.role === 'patient' || profile?.role === 'admin' || (profile?.membership_level ?? 0) >= 1

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
            />
        </div>
    )
}

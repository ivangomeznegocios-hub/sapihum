'use client'

import { useState } from 'react'
import { SubcategoryFilter, ModalityFilter } from './events-filter'
import { EventCard } from './event-card'
import type { EventWithRegistration } from '@/types/database'
import { DEFAULT_TIMEZONE, isEventPast } from '@/lib/timezone'

export function FilteredEventsList({
    events,
    isActiveMember,
    userId,
    isReadOnly,
    timezone = DEFAULT_TIMEZONE,
}: {
    events: EventWithRegistration[]
    isActiveMember: boolean
    userId?: string
    isReadOnly?: boolean
    timezone?: string
}) {
    const [selectedSub, setSelectedSub] = useState<string | null>(null)
    const [selectedModality, setSelectedModality] = useState('all')

    // Extract unique subcategories
    const subcategories = [...new Set(
        events
            .map((e: any) => e.subcategory)
            .filter(Boolean)
    )] as string[]

    // Apply subcategory filter
    let filtered = selectedSub
        ? events.filter((e: any) => e.subcategory === selectedSub)
        : events

    // Apply modality filter
    if (selectedModality !== 'all') {
        filtered = filtered.filter((e: any) => {
            const eventType = (e as any).event_type || ''
            const modality = (e as any).session_config?.modality || ''
            if (selectedModality === 'presencial') {
                return eventType === 'presencial' || modality === 'presencial'
            }
            return eventType !== 'presencial' && modality !== 'presencial'
        })
    }

    // Split by actual date, NOT just status
    // Events with status "upcoming" but start_time in the past should appear in past
    const upcoming = filtered.filter(e => {
        if (e.status === 'completed' || e.status === 'cancelled') return false
        if (e.status === 'live') return true
        // Even if status is 'upcoming', check if date has passed
        return !isEventPast(e.start_time)
    })

    const past = filtered.filter(e => {
        if (e.status === 'completed') return true
        if (e.status === 'cancelled') return false
        // Status is 'upcoming' but date already passed
        return e.status === 'upcoming' && isEventPast(e.start_time)
    })

    return (
        <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
                {subcategories.length > 0 && (
                    <SubcategoryFilter
                        subcategories={subcategories}
                        selected={selectedSub}
                        onSelect={setSelectedSub}
                    />
                )}
                <ModalityFilter
                    selected={selectedModality}
                    onSelect={setSelectedModality}
                />
            </div>

            {upcoming.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        Próximos Eventos
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {upcoming.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                isActiveMember={isActiveMember}
                                userId={userId}
                                isReadOnly={isReadOnly}
                                timezone={timezone}
                            />
                        ))}
                    </div>
                </section>
            )}

            {past.length > 0 && (
                <section className="mt-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                            <path d="m9 16 2 2 4-4" />
                        </svg>
                        Eventos Pasados
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {past.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                isActiveMember={isActiveMember}
                                userId={userId}
                                isReadOnly={isReadOnly}
                                timezone={timezone}
                            />
                        ))}
                    </div>
                </section>
            )}

            {filtered.length === 0 && (
                <div className="border border-dashed rounded-lg flex flex-col items-center justify-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mb-4">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <h3 className="text-lg font-medium mb-1">No hay eventos en esta categoría</h3>
                    <p className="text-sm text-muted-foreground">
                        Pronto agregaremos nuevos eventos aquí
                    </p>
                </div>
            )}
        </>
    )
}

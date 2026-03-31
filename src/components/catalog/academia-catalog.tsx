'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { PublicCatalogCard } from './public-catalog-card'

const AREA_FILTERS = [
    { value: 'all', label: 'Todas las areas' },
    { value: 'clinical', label: 'Escuela Clinica' },
    { value: 'networking', label: 'Networking y Comunidad' },
    { value: 'business', label: 'Negocios y Marketing' },
    { value: 'general', label: 'General' },
] as const

const FORMAT_FILTERS = [
    { value: 'all', label: 'Todos los formatos' },
    { value: 'taller', label: 'Taller / Masterclass' },
    { value: 'curso', label: 'Curso' },
    { value: 'diplomado', label: 'Diplomado' },
    { value: 'conferencia', label: 'Conferencia' },
    { value: 'seminario', label: 'Seminario' },
    { value: 'congreso', label: 'Congreso' },
    { value: 'meetup', label: 'Meetup' },
    { value: 'presencial', label: 'Presencial' },
] as const

interface AcademiaCatalogProps {
    events: any[]
}

export function AcademiaCatalog({ events }: AcademiaCatalogProps) {
    const [areaFilter, setAreaFilter] = useState<string>('all')
    const [formatFilter, setFormatFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            if (areaFilter !== 'all' && event.category !== areaFilter) return false

            if (formatFilter !== 'all') {
                if (formatFilter === 'presencial') {
                    if (event.event_type !== 'presencial') return false
                } else if (event.subcategory !== formatFilter) {
                    return false
                }
            }

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase()
                const title = (event.title || '').toLowerCase()
                const description = (event.description || '').toLowerCase()
                const subtitle = (event.subtitle || '').toLowerCase()
                const speakerName = event.speakers?.[0]?.speaker?.profile?.full_name?.toLowerCase() || ''

                if (
                    !title.includes(query) &&
                    !description.includes(query) &&
                    !subtitle.includes(query) &&
                    !speakerName.includes(query)
                ) {
                    return false
                }
            }

            return true
        })
    }, [events, areaFilter, formatFilter, searchQuery])

    const hasActiveFilters =
        areaFilter !== 'all' || formatFilter !== 'all' || searchQuery.trim() !== ''
    const liveCount = events.filter((event) => event.status === 'live').length

    function clearAllFilters() {
        setAreaFilter('all')
        setFormatFilter('all')
        setSearchQuery('')
    }

    return (
        <div className="space-y-10">
            {(events.length > 0 || liveCount > 0) && (
                <div className="flex flex-wrap gap-3">
                    {liveCount > 0 && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 animate-pulse">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
                            </span>
                            {liveCount} en vivo ahora
                        </div>
                    )}

                    {events.length > 0 && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                            </span>
                            {events.length} encuentro{events.length !== 1 ? 's' : ''} publico{events.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por titulo, ponente o tema..."
                        className="w-full rounded-xl border border-border/60 bg-card py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 rounded-full p-1 -translate-y-1/2 transition-colors hover:bg-muted"
                        >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                        showFilters
                            ? 'border-primary/20 bg-primary/10 text-primary'
                            : 'border-border/60 text-foreground/80 hover:border-primary/30 hover:bg-white/[0.05] hover:text-foreground'
                    }`}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                    {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {AREA_FILTERS.map((filter) => {
                    const isActive = areaFilter === filter.value

                    return (
                        <button
                            key={filter.value}
                            onClick={() => setAreaFilter(filter.value)}
                            className={`inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold tracking-[0.01em] transition-all duration-200 ${
                                isActive
                                    ? 'scale-[1.03] border border-primary/20 bg-primary text-primary-foreground shadow-[0_14px_32px_rgba(246,174,2,0.16)]'
                                    : 'border border-white/12 bg-white/[0.03] text-foreground/80 hover:border-primary/30 hover:bg-white/[0.05] hover:text-foreground'
                            }`}
                        >
                            {filter.label}
                        </button>
                    )
                })}
            </div>

            {showFilters && (
                <div className="space-y-4 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Formato del encuentro
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {FORMAT_FILTERS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setFormatFilter(option.value)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                                        formatFilter === option.value
                                            ? 'border border-primary/20 bg-primary text-primary-foreground'
                                            : 'border border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-foreground"
                        >
                            <X className="h-3 w-3" />
                            Limpiar todos los filtros
                        </button>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{filteredEvents.length}</span>{' '}
                    {filteredEvents.length === 1 ? 'resultado' : 'resultados'}
                    {hasActiveFilters && (
                        <span className="text-muted-foreground/60"> de {events.length} en total</span>
                    )}
                </p>

                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-medium text-primary transition-colors hover:text-foreground"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {filteredEvents.length > 0 ? (
                <section>
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredEvents.map((event, index) => (
                            <div
                                key={event.id}
                                className="h-full animate-in fade-in-0 zoom-in-95 duration-300"
                                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                            >
                                <PublicCatalogCard event={event} hidePrice fixedLayout />
                            </div>
                        ))}
                    </div>
                </section>
            ) : (
                <div className="rounded-3xl border-2 border-dashed border-border/40 bg-gradient-to-br from-muted/30 to-muted/10 px-6 py-20 text-center">
                    <div className="mx-auto max-w-sm space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-primary">
                            S
                        </div>
                        <h2 className="text-xl font-bold">Sin resultados</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {hasActiveFilters
                                ? 'No encontramos eventos con esos filtros. Intenta con otra combinacion.'
                                : 'Estamos preparando nuevas formaciones. Vuelve pronto para explorar todo lo que tenemos.'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_14px_32px_rgba(246,174,2,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#e7a103]"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

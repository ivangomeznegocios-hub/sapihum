'use client'

import { useState, useMemo } from 'react'
import { PublicCatalogCard } from './public-catalog-card'
import { Search, SlidersHorizontal, X } from 'lucide-react'

type FilterTag = 'all' | 'live' | 'course' | 'presencial'

const TYPE_FILTERS: { value: FilterTag; label: string; icon: string }[] = [
    { value: 'all', label: 'Todos', icon: '✨' },
    { value: 'live', label: 'En Vivo', icon: '🟢' },
    { value: 'course', label: 'Formaciones', icon: '📚' },
    { value: 'presencial', label: 'Presencial', icon: '📍' },
]

const CATEGORY_FILTERS = [
    { value: 'all', label: 'Todas las áreas' },
    { value: 'clinical', label: 'Escuela Clínica' },
    { value: 'networking', label: 'Networking / Social' },
    { value: 'business', label: 'Negocios' },
    { value: 'general', label: 'General' },
]

export function AcademiaCatalog({ events }: { events: any[] }) {
    const [typeFilter, setTypeFilter] = useState<FilterTag>('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const filtered = useMemo(() => {
        return events.filter((event) => {
            // Type filter
            if (typeFilter !== 'all') {
                if (event.event_type !== typeFilter) return false
            }

            // Category filter
            if (categoryFilter !== 'all' && event.category !== categoryFilter) return false

            // Search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const title = (event.title || '').toLowerCase()
                const desc = (event.description || '').toLowerCase()
                const subtitle = (event.subtitle || '').toLowerCase()
                const speakerName = event.speakers?.[0]?.speaker?.profile?.full_name?.toLowerCase() || ''
                if (!title.includes(q) && !desc.includes(q) && !subtitle.includes(q) && !speakerName.includes(q)) {
                    return false
                }
            }

            return true
        })
    }, [events, typeFilter, categoryFilter, searchQuery])

    const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim() !== ''

    // Stats
    const upcomingCount = events.filter(e => e.status === 'upcoming' || e.status === 'live').length
    const liveCount = events.filter(e => e.status === 'live').length

    function clearAllFilters() {
        setTypeFilter('all')
        setCategoryFilter('all')
        setSearchQuery('')
    }

    return (
        <div className="space-y-8">
            {/* Live indicator */}
            {(upcomingCount > 0 || liveCount > 0) && (
                <div className="flex flex-wrap gap-3">
                    {liveCount > 0 && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 animate-pulse">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                            </span>
                            {liveCount} en vivo ahora
                        </div>
                    )}
                    {upcomingCount > 0 && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                            </span>
                            {upcomingCount} evento{upcomingCount !== 1 ? 's' : ''} próximo{upcomingCount !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}

            {/* Search + Filter Toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por título, ponente o tema..."
                        className="w-full rounded-xl border border-border/60 bg-card pl-10 pr-10 py-3 text-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 placeholder:text-muted-foreground/60"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                        >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all shrink-0 ${showFilters ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300' : 'border-border/60 hover:bg-muted'}`}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                    {hasActiveFilters && (
                        <span className="h-2 w-2 rounded-full bg-teal-500" />
                    )}
                </button>
            </div>

            {/* Type Filter Chips */}
            <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map(filter => {
                    const isActive = typeFilter === filter.value
                    return (
                        <button
                            key={filter.value}
                            onClick={() => setTypeFilter(filter.value)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20 scale-[1.03]'
                                    : 'border border-border/60 bg-card hover:bg-muted hover:border-teal-500/30 hover:shadow-sm'
                            }`}
                        >
                            <span>{filter.icon}</span>
                            {filter.label}
                        </button>
                    )
                })}
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-sm">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                            Área temática
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORY_FILTERS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setCategoryFilter(opt.value)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                                        categoryFilter === opt.value
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="text-xs font-medium text-rose-600 hover:text-rose-500 transition-colors flex items-center gap-1"
                        >
                            <X className="h-3 w-3" />
                            Limpiar todos los filtros
                        </button>
                    )}
                </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                    {filtered.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
                    {hasActiveFilters && <span className="text-muted-foreground/60"> de {events.length} en total</span>}
                </p>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-medium text-teal-600 hover:text-teal-500 transition-colors"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Events Grid */}
            {filtered.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((event, i) => (
                        <div
                            key={event.id}
                            className="animate-in fade-in-0 zoom-in-95 duration-300"
                            style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                        >
                            <PublicCatalogCard event={event} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-3xl border-2 border-dashed border-border/40 bg-gradient-to-br from-muted/30 to-muted/10 px-6 py-20 text-center">
                    <div className="mx-auto max-w-sm space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-3xl">
                            🎓
                        </div>
                        <h2 className="text-xl font-bold">Sin resultados</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {hasActiveFilters
                                ? 'No encontramos eventos con esos filtros. Intenta con otra combinación.'
                                : 'Estamos preparando nuevas formaciones. Vuelve pronto para explorar todo lo que tenemos.'
                            }
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all"
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

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Search, Filter, X } from 'lucide-react'

const TYPE_FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'video', label: 'Videos' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'audio', label: 'Audio' },
    { value: 'link', label: 'Enlaces' },
    { value: 'tool', label: 'Herramientas' },
]

const CATEGORY_FILTERS = [
    { value: 'all', label: 'Todas' },
    { value: 'guia', label: 'Guías' },
    { value: 'estudio', label: 'Estudios' },
    { value: 'herramienta', label: 'Herramientas' },
    { value: 'plantilla', label: 'Plantillas' },
    { value: 'curso_material', label: 'Material de Curso' },
    { value: 'general', label: 'General' },
]

const AUDIENCE_FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'psychologists', label: 'Psicólogos' },
    { value: 'patients', label: 'Pacientes' },
    { value: 'members', label: 'Miembros' },
]

export function ResourceFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentType = searchParams.get('type') || 'all'
    const currentCategory = searchParams.get('category') || 'all'
    const currentAudience = searchParams.get('audience') || 'all'
    const currentSearch = searchParams.get('search') || ''

    const hasActiveFilters = currentType !== 'all' || currentCategory !== 'all' || currentAudience !== 'all' || currentSearch !== ''

    const createQueryString = useCallback(
        (params: Record<string, string>) => {
            const newParams = new URLSearchParams(searchParams.toString())
            Object.entries(params).forEach(([key, value]) => {
                if (value === '' || value === 'all') {
                    newParams.delete(key)
                } else {
                    newParams.set(key, value)
                }
            })
            return newParams.toString()
        },
        [searchParams]
    )

    function setFilter(key: string, value: string) {
        const qs = createQueryString({ [key]: value })
        router.push(qs ? `${pathname}?${qs}` : pathname)
    }

    function clearFilters() {
        router.push(pathname)
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar recursos..."
                    defaultValue={currentSearch}
                    onChange={(e) => {
                        const timer = setTimeout(() => {
                            setFilter('search', e.target.value)
                        }, 400)
                        return () => clearTimeout(timer)
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background text-sm"
                />
            </div>

            {/* Filter Tabs Row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Type Filter */}
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1">
                    {TYPE_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter('type', f.value)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                currentType === f.value
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Category Filter */}
                <select
                    value={currentCategory}
                    onChange={(e) => setFilter('category', e.target.value)}
                    className="px-3 py-1.5 border rounded-lg bg-background text-xs"
                >
                    <option value="all" disabled>Categoría</option>
                    {CATEGORY_FILTERS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>

                {/* Audience Filter */}
                <select
                    value={currentAudience}
                    onChange={(e) => setFilter('audience', e.target.value)}
                    className="px-3 py-1.5 border rounded-lg bg-background text-xs"
                >
                    <option value="all" disabled>Audiencia</option>
                    {AUDIENCE_FILTERS.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                </select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground h-7 gap-1"
                    >
                        <X className="h-3 w-3" />
                        Limpiar filtros
                    </Button>
                )}
            </div>
        </div>
    )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const CATEGORY_TABS = [
    { value: 'all', label: 'Todos', href: '/dashboard/events' },
    { value: 'networking', label: 'Networking', href: '/dashboard/events/networking' },
    { value: 'clinical', label: 'Escuela Clínica', href: '/dashboard/events/clinical' },
    { value: 'business', label: 'Negocios', href: '/dashboard/events/business' },
]

const SUBCATEGORY_LABELS: Record<string, string> = {
    curso: 'Curso',
    diplomado: 'Diplomado',
    clase: 'Clase',
    taller: 'Taller',
    conferencia: 'Conferencia',
    seminario: 'Seminario',
    congreso: 'Congreso',
    meetup: 'Meetup',
    otro: 'Otro',
}

export function EventsCategoryNav() {
    const pathname = usePathname()

    return (
        <div className="flex w-full min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1 pb-1">
            {CATEGORY_TABS.map(tab => {
                const isActive = pathname === tab.href ||
                    (tab.value === 'all' && pathname === '/dashboard/events')
                return (
                    <Link
                        key={tab.value}
                        href={tab.href}
                        className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${isActive
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                    >
                        {tab.label}
                    </Link>
                )
            })}
        </div>
    )
}

export function SubcategoryFilter({
    subcategories,
    selected,
    onSelect
}: {
    subcategories: string[]
    selected: string | null
    onSelect: (value: string | null) => void
}) {
    if (subcategories.length === 0) return null

    return (
        <div className="flex w-full min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1">
            <button
                onClick={() => onSelect(null)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${!selected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
            >
                Todos
            </button>
            {subcategories.map(sub => (
                <button
                    key={sub}
                    onClick={() => onSelect(sub)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${selected === sub
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    {SUBCATEGORY_LABELS[sub] || sub}
                </button>
            ))}
        </div>
    )
}

const MODALITY_OPTIONS = [
    { value: 'all', label: 'Todos' },
    { value: 'online', label: '🌐 Online' },
    { value: 'presencial', label: '📍 Presencial' },
]

export function ModalityFilter({
    selected,
    onSelect
}: {
    selected: string
    onSelect: (value: string) => void
}) {
    return (
        <div className="flex w-full min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1">
            {MODALITY_OPTIONS.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onSelect(opt.value)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${selected === opt.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}


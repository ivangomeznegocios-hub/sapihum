import Link from 'next/link'
import { ArrowRight, Calendar, FileText, Newspaper } from 'lucide-react'

export interface ContentItem {
    id: string
    type: 'event' | 'resource' | 'newsletter'
    title: string
    subtitle?: string
    href: string
    imageUrl?: string | null
    badge?: string
}

interface ContentCarouselProps {
    items: ContentItem[]
    title?: string
    viewAllHref?: string
    viewAllLabel?: string
}

const typeIcons = {
    event: Calendar,
    resource: FileText,
    newsletter: Newspaper,
}

const typeBadges: Record<string, { label: string; className: string }> = {
    event: { label: 'Evento', className: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/50 dark:text-brand-yellow' },
    resource: { label: 'Recurso', className: 'bg-brand-brown text-brand-brown dark:bg-brand-brown/50 dark:text-brand-brown' },
    newsletter: { label: 'Newsletter', className: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/50 dark:text-brand-yellow' },
}

export function ContentCarousel({
    items,
    title = 'Contenido Nuevo',
    viewAllHref,
    viewAllLabel = 'Ver todo'
}: ContentCarouselProps) {
    if (items.length === 0) return null

    return (
        <div className="min-w-0 space-y-4">
            <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="min-w-0 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {title}
                </h3>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 hover:text-primary sm:min-h-9"
                    >
                        {viewAllLabel}
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                )}
            </div>
            <div className="flex max-w-full gap-3 overflow-x-auto pb-2 sm:gap-4 snap-x snap-mandatory scrollbar-thin">
                {items.map((item) => {
                    const TypeIcon = typeIcons[item.type]
                    const badge = typeBadges[item.type]

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="
                                group min-w-0 flex-shrink-0 w-[84vw] max-w-[84vw] sm:w-[280px] sm:max-w-[280px] lg:w-[260px] lg:max-w-[260px] snap-start
                                rounded-xl border bg-card overflow-hidden
                                hover:shadow-lg hover:border-primary/30 transition-all duration-300
                            "
                        >
                            {/* Image or placeholder */}
                            <div className="relative h-32 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                                {item.imageUrl ? (
                                    <div
                                        role="img"
                                        aria-label={item.title}
                                        className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url("${item.imageUrl}")` }}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <TypeIcon className="h-10 w-10 text-muted-foreground/30" />
                                    </div>
                                )}
                                <div className="absolute top-2 left-2">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                                        {item.badge || badge.label}
                                    </span>
                                </div>
                            </div>
                            {/* Content */}
                            <div className="p-3.5">
                                <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                    {item.title}
                                </h4>
                                {item.subtitle && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.subtitle}</p>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

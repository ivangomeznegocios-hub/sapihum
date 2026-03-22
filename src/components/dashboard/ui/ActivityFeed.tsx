'use client'

import {
    Calendar, Users, FileText, CheckSquare, UserPlus, Mic2,
    CalendarDays, TrendingUp, Star, Award, BookOpen, Clock,
    type LucideIcon
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
    Calendar, Users, FileText, CheckSquare, UserPlus, Mic2,
    CalendarDays, TrendingUp, Star, Award, BookOpen, Clock,
}

export interface ActivityItem {
    icon: string
    iconColor?: string
    title: string
    description?: string
    timeAgo: string
}

interface ActivityFeedProps {
    items: ActivityItem[]
    title?: string
    emptyMessage?: string
}

export function ActivityFeed({
    items,
    title = 'Actividad Reciente',
    emptyMessage = 'No hay actividad reciente'
}: ActivityFeedProps) {
    if (items.length === 0) {
        return (
            <div className="min-w-0 rounded-xl border bg-card p-6">
                <h3 className="text-sm font-semibold mb-4">{title}</h3>
                <p className="text-sm text-muted-foreground text-center py-6">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-4 sm:mb-5">{title}</h3>
            <div className="space-y-0">
                {items.map((item, index) => {
                    const Icon = iconMap[item.icon] || Calendar
                    const isLast = index === items.length - 1

                    return (
                        <div key={index} className="flex min-w-0 gap-3 group">
                            {/* Timeline */}
                            <div className="flex flex-col items-center">
                                <div className={`
                                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                    bg-muted/80 group-hover:bg-muted transition-colors
                                    ${item.iconColor || 'text-muted-foreground'}
                                `}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                {!isLast && (
                                    <div className="w-px h-full min-h-6 bg-border my-1" />
                                )}
                            </div>
                            {/* Content */}
                            <div className={`min-w-0 flex-1 ${!isLast ? 'pb-4' : 'pb-0'}`}>
                                <p className="break-words text-sm font-medium leading-tight">{item.title}</p>
                                {item.description && (
                                    <p className="mt-0.5 break-words text-xs text-muted-foreground">{item.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground/60 mt-1">{item.timeAgo}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

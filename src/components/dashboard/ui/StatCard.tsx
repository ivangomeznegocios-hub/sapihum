'use client'

import {
    Calendar, Users, FileText, TrendingUp, Clock, UserPlus,
    BookOpen, Award, Star, Sparkles, Zap, CheckCircle2,
    CalendarDays, Eye, Shield, Activity, Mic2, UserCog,
    Brain, CheckSquare, Heart, Info,
    type LucideIcon
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
    Calendar, Users, FileText, TrendingUp, Clock, UserPlus,
    BookOpen, Award, Star, Sparkles, Zap, CheckCircle2,
    CalendarDays, Eye, Shield, Activity, Mic2, UserCog,
    Brain, CheckSquare, Heart, Info
}
type ColorVariant = 'primary' | 'secondary'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    trend?: string
    icon: string
    color?: ColorVariant
    delay?: number
    statusIndicator?: 'good' | 'warning' | 'critical'
    info?: string
}

const colorStyles: Record<ColorVariant, {
    bg: string
    border: string
    iconBg: string
    iconColor: string
    valueColor: string
    trendColor: string
}> = {
    primary: {
        bg: 'bg-brand-yellow/50 dark:bg-brand-yellow/20',
        border: 'border-brand-yellow/60 dark:border-brand-yellow/40',
        iconBg: 'bg-brand-yellow dark:bg-brand-yellow/50',
        iconColor: 'text-brand-yellow dark:text-brand-yellow',
        valueColor: 'text-brand-yellow dark:text-brand-yellow',
        trendColor: 'text-brand-yellow/70 dark:text-brand-yellow/70',
    },
    secondary: {
        bg: 'bg-brand-brown/50 dark:bg-brand-brown/20',
        border: 'border-brand-brown/60 dark:border-brand-brown/40',
        iconBg: 'bg-brand-brown dark:bg-brand-brown/50',
        iconColor: 'text-brand-brown dark:text-brand-brown',
        valueColor: 'text-brand-brown dark:text-brand-brown',
        trendColor: 'text-brand-brown/70 dark:text-brand-brown/70',
    },
}

export function StatCard({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = 'primary',
    delay = 0,
    statusIndicator,
    info
}: StatCardProps) {
    const styles = colorStyles[color]
    const Icon = iconMap[icon] || Calendar

    let finalValueColor = styles.valueColor
    if (statusIndicator === 'good') finalValueColor = 'text-green-600 dark:text-green-400'
    if (statusIndicator === 'warning') finalValueColor = 'text-brand-yellow dark:text-brand-yellow'
    if (statusIndicator === 'critical') finalValueColor = 'text-red-600 dark:text-red-400'

    return (
        <div
            className={`
                relative min-w-0 overflow-visible rounded-xl border p-4 sm:p-5 transition-all duration-300
                hover:shadow-lg hover:scale-[1.02] bg-card
                ${styles.bg} ${styles.border}
                animate-[slide-up_0.5s_ease-out_both]
            `}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1 space-y-2 pr-2 sm:pr-4">
                    <div className="flex items-center gap-1.5">
                        <p className="min-w-0 break-words text-xs font-medium leading-tight text-muted-foreground sm:text-sm">{title}</p>
                        {info && (
                            <div className="group relative inline-flex items-center justify-center">
                                <Info className="h-4 w-4 text-muted-foreground/60 hover:text-foreground cursor-help transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-xl border opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 whitespace-normal text-center leading-relaxed font-normal">
                                    {info}
                                </div>
                            </div>
                        )}
                    </div>
                    <p className={`min-w-0 break-words text-2xl font-bold tracking-tight leading-tight sm:text-3xl ${finalValueColor}`}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">{subtitle}</p>
                    )}
                    {trend && (
                        <p className={`text-[11px] sm:text-xs font-medium ${styles.trendColor}`}>
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`p-2.5 rounded-lg ${styles.iconBg}`}>
                    <Icon className={`h-5 w-5 ${styles.iconColor}`} />
                </div>
            </div>
        </div>
    )
}

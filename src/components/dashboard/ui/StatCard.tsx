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
type ColorVariant = 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'indigo'

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
    blue: {
        bg: 'bg-blue-50/50 dark:bg-blue-950/20',
        border: 'border-blue-200/60 dark:border-blue-800/40',
        iconBg: 'bg-blue-100 dark:bg-blue-900/50',
        iconColor: 'text-blue-600 dark:text-blue-400',
        valueColor: 'text-blue-700 dark:text-blue-300',
        trendColor: 'text-blue-600/70 dark:text-blue-400/70',
    },
    emerald: {
        bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
        border: 'border-emerald-200/60 dark:border-emerald-800/40',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        valueColor: 'text-emerald-700 dark:text-emerald-300',
        trendColor: 'text-emerald-600/70 dark:text-emerald-400/70',
    },
    purple: {
        bg: 'bg-purple-50/50 dark:bg-purple-950/20',
        border: 'border-purple-200/60 dark:border-purple-800/40',
        iconBg: 'bg-purple-100 dark:bg-purple-900/50',
        iconColor: 'text-purple-600 dark:text-purple-400',
        valueColor: 'text-purple-700 dark:text-purple-300',
        trendColor: 'text-purple-600/70 dark:text-purple-400/70',
    },
    amber: {
        bg: 'bg-amber-50/50 dark:bg-amber-950/20',
        border: 'border-amber-200/60 dark:border-amber-800/40',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        iconColor: 'text-amber-600 dark:text-amber-400',
        valueColor: 'text-amber-700 dark:text-amber-300',
        trendColor: 'text-amber-600/70 dark:text-amber-400/70',
    },
    rose: {
        bg: 'bg-rose-50/50 dark:bg-rose-950/20',
        border: 'border-rose-200/60 dark:border-rose-800/40',
        iconBg: 'bg-rose-100 dark:bg-rose-900/50',
        iconColor: 'text-rose-600 dark:text-rose-400',
        valueColor: 'text-rose-700 dark:text-rose-300',
        trendColor: 'text-rose-600/70 dark:text-rose-400/70',
    },
    indigo: {
        bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
        border: 'border-indigo-200/60 dark:border-indigo-800/40',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/50',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        valueColor: 'text-indigo-700 dark:text-indigo-300',
        trendColor: 'text-indigo-600/70 dark:text-indigo-400/70',
    },
}

export function StatCard({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = 'blue',
    delay = 0,
    statusIndicator,
    info
}: StatCardProps) {
    const styles = colorStyles[color]
    const Icon = iconMap[icon] || Calendar

    let finalValueColor = styles.valueColor
    if (statusIndicator === 'good') finalValueColor = 'text-green-600 dark:text-green-400'
    if (statusIndicator === 'warning') finalValueColor = 'text-amber-600 dark:text-amber-400'
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

'use client'

import {
    CheckCircle2, Circle, Users, Calendar, BookOpen, Award,
    UserPlus, Star, Mic2, CalendarDays, UserCog, Brain, CheckSquare,
    type LucideIcon
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
    CheckCircle2, Circle, Users, Calendar, BookOpen, Award,
    UserPlus, Star, Mic2, CalendarDays, UserCog, Brain, CheckSquare,
}

export interface Milestone {
    title: string
    icon?: string
    completed: boolean
    current?: boolean
}

interface MilestoneTrackerProps {
    milestones: Milestone[]
    title?: string
}

export function MilestoneTracker({ milestones, title }: MilestoneTrackerProps) {
    return (
        <div className="min-w-0 w-full">
            {title && (
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {title}
                </h3>
            )}
            <div className="flex w-full min-w-0 flex-col gap-4 pb-2 md:items-start md:flex-row md:gap-0 md:overflow-x-auto">
                {milestones.map((milestone, index) => {
                    const Icon = milestone.icon ? iconMap[milestone.icon] : undefined
                    const isLast = index === milestones.length - 1

                    return (
                        <div key={index} className="flex min-w-0 items-start gap-3 md:flex-1 md:flex-col md:items-center">
                            {/* Milestone node */}
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                <div
                                    className={`
                                        relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500
                                        ${milestone.completed
                                            ? 'bg-brand-brown/15 border-brand-brown text-brand-brown'
                                            : milestone.current
                                                ? 'bg-brand-yellow/15 border-brand-yellow text-brand-yellow shadow-[0_0_12px_rgba(59,130,246,0.4)] animate-[glow-pulse_2s_ease-in-out_infinite]'
                                                : 'bg-muted/50 border-muted-foreground/25 text-muted-foreground/50'
                                        }
                                    `}
                                >
                                    {milestone.completed ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : Icon ? (
                                        <Icon className="h-4 w-4" />
                                    ) : (
                                        <Circle className="h-4 w-4" />
                                    )}
                                </div>
                                <span
                                    className={`text-xs text-left md:text-center max-w-[140px] md:max-w-[80px] leading-tight ${milestone.completed
                                            ? 'text-brand-brown dark:text-brand-brown font-medium'
                                            : milestone.current
                                                ? 'text-brand-yellow dark:text-brand-yellow font-medium'
                                                : 'text-muted-foreground/60'
                                        }`}
                                >
                                    {milestone.title}
                                </span>
                            </div>
                            {/* Connector line */}
                            {!isLast && (
                                <div className="hidden md:block flex-1 min-w-4 mt-5 mx-1">
                                    <div
                                        className={`h-0.5 w-full rounded-full transition-all duration-700 ${milestone.completed
                                                ? 'bg-brand-brown'
                                                : 'bg-muted-foreground/15'
                                            }`}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

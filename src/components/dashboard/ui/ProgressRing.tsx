'use client'

import { useEffect, useState } from 'react'

interface ProgressRingProps {
    percentage: number
    label: string
    sublabel?: string
    size?: number
    strokeWidth?: number
    color?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose'
}

const colorMap = {
    blue: { stroke: 'stroke-blue-500', text: 'text-blue-500', track: 'stroke-blue-500/15' },
    emerald: { stroke: 'stroke-emerald-500', text: 'text-emerald-500', track: 'stroke-emerald-500/15' },
    purple: { stroke: 'stroke-purple-500', text: 'text-purple-500', track: 'stroke-purple-500/15' },
    amber: { stroke: 'stroke-amber-500', text: 'text-amber-500', track: 'stroke-amber-500/15' },
    rose: { stroke: 'stroke-rose-500', text: 'text-rose-500', track: 'stroke-rose-500/15' },
}

export function ProgressRing({
    percentage,
    label,
    sublabel,
    size = 120,
    strokeWidth = 8,
    color = 'emerald'
}: ProgressRingProps) {
    const [animatedPercentage, setAnimatedPercentage] = useState(0)

    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (animatedPercentage / 100) * circumference

    const colors = colorMap[color]

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedPercentage(percentage)
        }, 200)
        return () => clearTimeout(timer)
    }, [percentage])

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    className="transform -rotate-90"
                >
                    {/* Background track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        className={colors.track}
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress arc */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        className={colors.stroke}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{
                            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${colors.text}`}>
                        {Math.round(animatedPercentage)}%
                    </span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm font-medium">{label}</p>
                {sublabel && (
                    <p className="text-xs text-muted-foreground">{sublabel}</p>
                )}
            </div>
        </div>
    )
}

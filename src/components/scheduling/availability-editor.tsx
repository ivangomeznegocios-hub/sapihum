'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

interface TimeSlot {
    start: string
    end: string
}

interface AvailabilitySchedule {
    [day: string]: TimeSlot[]
}

interface AvailabilityEditorProps {
    value: AvailabilitySchedule
    onChange: (schedule: AvailabilitySchedule) => void
}

const DAYS = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
]

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7 // Start at 7:00 AM
    const minute = i % 2 === 0 ? '00' : '30'
    return `${hour.toString().padStart(2, '0')}:${minute}`
})

export function AvailabilityEditor({ value, onChange }: AvailabilityEditorProps) {
    const addSlot = (day: string) => {
        const currentSlots = value[day] || []
        const newSlot: TimeSlot = { start: '09:00', end: '17:00' }
        onChange({
            ...value,
            [day]: [...currentSlots, newSlot]
        })
    }

    const removeSlot = (day: string, index: number) => {
        const currentSlots = value[day] || []
        onChange({
            ...value,
            [day]: currentSlots.filter((_, i) => i !== index)
        })
    }

    const updateSlot = (day: string, index: number, field: 'start' | 'end', time: string) => {
        const currentSlots = value[day] || []
        const updatedSlots = currentSlots.map((slot, i) =>
            i === index ? { ...slot, [field]: time } : slot
        )
        onChange({
            ...value,
            [day]: updatedSlots
        })
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
                Configura los horarios en que estás disponible para consultas.
            </div>

            <div className="space-y-3">
                {DAYS.map(({ key, label }) => {
                    const slots = value[key] || []

                    return (
                        <div key={key} className="flex items-start gap-4 p-3 border rounded-lg">
                            <div className="w-24 font-medium text-sm pt-2">
                                {label}
                            </div>

                            <div className="flex-1 space-y-2">
                                {slots.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-2">
                                        No disponible
                                    </p>
                                ) : (
                                    slots.map((slot, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <select
                                                value={slot.start}
                                                onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                                                className="px-2 py-1 border rounded text-sm bg-background"
                                            >
                                                {TIME_OPTIONS.map(time => (
                                                    <option key={time} value={time}>{time}</option>
                                                ))}
                                            </select>
                                            <span className="text-muted-foreground">a</span>
                                            <select
                                                value={slot.end}
                                                onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                                                className="px-2 py-1 border rounded text-sm bg-background"
                                            >
                                                {TIME_OPTIONS.map(time => (
                                                    <option key={time} value={time}>{time}</option>
                                                ))}
                                            </select>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeSlot(key, index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addSlot(key)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

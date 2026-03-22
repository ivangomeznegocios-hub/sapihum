'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Video, MapPin } from 'lucide-react'

interface Service {
    name: string
    price: number
    duration: number
    modality: 'video' | 'in_person' | 'both'
}

interface ServicesEditorProps {
    value: Service[]
    onChange: (services: Service[]) => void
}

const DURATION_OPTIONS = [
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 50, label: '50 min' },
    { value: 55, label: '55 min' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1.5 horas' },
    { value: 120, label: '2 horas' }
]

const MODALITY_OPTIONS = [
    { value: 'video', label: 'Online', icon: '🎥' },
    { value: 'in_person', label: 'Presencial', icon: '📍' },
    { value: 'both', label: 'Ambas', icon: '🔄' }
]

export function ServicesEditor({ value, onChange }: ServicesEditorProps) {
    const addService = () => {
        onChange([
            ...value,
            { name: '', price: 0, duration: 60, modality: 'both' }
        ])
    }

    const removeService = (index: number) => {
        onChange(value.filter((_, i) => i !== index))
    }

    const updateService = (index: number, field: keyof Service, fieldValue: string | number) => {
        onChange(value.map((service, i) =>
            i === index ? { ...service, [field]: fieldValue } : service
        ))
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Define los servicios que ofreces. Los pacientes verán estas opciones al agendar.
            </p>

            <div className="space-y-3">
                {value.map((service, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3 relative group">
                        <div className="flex items-start justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                                Servicio {index + 1}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeService(index)}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="text-xs text-muted-foreground">Nombre del servicio</label>
                            <input
                                type="text"
                                value={service.name}
                                onChange={(e) => updateService(index, 'name', e.target.value)}
                                placeholder="Ej: Terapia Individual"
                                className="mt-1 w-full px-3 py-2 border rounded-lg bg-background text-sm"
                            />
                        </div>

                        {/* Price, Duration, Modality */}
                        <div className="grid gap-3 grid-cols-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Precio (MXN)</label>
                                <input
                                    type="number"
                                    value={service.price}
                                    onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                                    placeholder="800"
                                    min="0"
                                    step="50"
                                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-background text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Duración</label>
                                <select
                                    value={service.duration}
                                    onChange={(e) => updateService(index, 'duration', parseInt(e.target.value))}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-background text-sm"
                                >
                                    {DURATION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Modalidad</label>
                                <select
                                    value={service.modality}
                                    onChange={(e) => updateService(index, 'modality', e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-background text-sm"
                                >
                                    {MODALITY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.icon} {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {value.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">No tienes servicios configurados</p>
                    <p className="text-xs text-muted-foreground">Los pacientes verán un servicio genérico por defecto</p>
                </div>
            )}

            <Button
                type="button"
                variant="outline"
                onClick={addService}
                className="w-full"
            >
                <Plus className="mr-2 h-4 w-4" />
                Agregar servicio
            </Button>
        </div>
    )
}

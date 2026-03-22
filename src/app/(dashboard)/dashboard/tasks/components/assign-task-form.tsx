'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createTask } from '../actions'
import { Plus, X, Loader2, CheckSquare } from 'lucide-react'

interface Patient {
    id: string
    full_name: string | null
}

interface AssignTaskFormProps {
    patients: Patient[]
    onClose: () => void
}

export function AssignTaskForm({ patients, onClose }: AssignTaskFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)

        const result = await createTask({
            patientId: formData.get('patientId') as string,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            type: formData.get('type') as string,
            dueDate: formData.get('dueDate') as string || undefined,
        })

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            setSuccess(true)
            setTimeout(() => onClose(), 1200)
        }
    }

    return (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-lg my-8">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        Asignar Tarea
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose} className="self-end sm:self-auto">
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium" htmlFor="patientId">
                                Paciente
                            </label>
                            <select
                                id="patientId"
                                name="patientId"
                                required
                                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mt-1"
                            >
                                <option value="">Seleccionar paciente...</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.full_name || 'Sin nombre'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium" htmlFor="title">
                                Título de la tarea
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                                placeholder="Ej: Ejercicio de respiración diafragmática"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium" htmlFor="description">
                                Descripción / Instrucciones
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                className="mt-1 w-full px-3 py-2 border rounded-lg bg-background resize-none"
                                placeholder="Instrucciones detalladas para el paciente..."
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium" htmlFor="type">
                                    Tipo
                                </label>
                                <select
                                    id="type"
                                    name="type"
                                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                                >
                                    <option value="general">General</option>
                                    <option value="journal">Diario / Reflexión</option>
                                    <option value="exercise">Ejercicio</option>
                                    <option value="reading">Lectura</option>
                                    <option value="form">Formulario</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium" htmlFor="dueDate">
                                    Fecha límite (opcional)
                                </label>
                                <input
                                    id="dueDate"
                                    name="dueDate"
                                    type="date"
                                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg text-sm surface-alert-error">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-lg text-sm surface-alert-success flex items-center gap-2">
                                <CheckSquare className="h-4 w-4" />
                                Tarea asignada exitosamente
                            </div>
                        )}

                        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:flex-1">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading || success} className="w-full sm:flex-1">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Asignar Tarea'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export function AssignTaskButton({ patients }: { patients: Patient[] }) {
    const [showForm, setShowForm] = useState(false)

    return (
        <>
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Asignar Tarea
            </Button>
            {showForm && <AssignTaskForm patients={patients} onClose={() => setShowForm(false)} />}
        </>
    )
}



'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SOAPContent, RecordType } from '@/types/database'

interface NewNoteFormProps {
    patientId: string
    psychologistId: string
}

export function NewNoteForm({ patientId, psychologistId }: NewNoteFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [noteType, setNoteType] = useState<RecordType>('nota')
    const [content, setContent] = useState<SOAPContent>({
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/clinical-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: patientId,
                    psychologist_id: psychologistId,
                    content,
                    type: noteType
                })
            })

            if (response.ok) {
                router.push(`/dashboard/patients/${patientId}`)
                router.refresh()
            } else {
                console.error('Error creating note')
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Note Type Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Tipo de Registro</CardTitle>
                    <CardDescription>
                        Selecciona el tipo de nota clínica
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant={noteType === 'nota' ? 'default' : 'outline'}
                            onClick={() => setNoteType('nota')}
                        >
                            Nota de Sesión
                        </Button>
                        <Button
                            type="button"
                            variant={noteType === 'historia_clinica' ? 'default' : 'outline'}
                            onClick={() => setNoteType('historia_clinica')}
                        >
                            Historia Clínica
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* SOAP Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Notas SOAP</CardTitle>
                    <CardDescription>
                        Formato estructurado: Subjetivo, Objetivo, Análisis, Plan
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Subjective */}
                    <div className="space-y-2">
                        <Label htmlFor="subjective" className="text-base font-semibold">
                            S - Subjetivo
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Lo que el paciente refiere: síntomas, sentimientos, percepciones
                        </p>
                        <Textarea
                            id="subjective"
                            placeholder="El paciente refiere que..."
                            rows={4}
                            value={content.subjective}
                            onChange={(e) => setContent({ ...content, subjective: e.target.value })}
                        />
                    </div>

                    {/* Objective */}
                    <div className="space-y-2">
                        <Label htmlFor="objective" className="text-base font-semibold">
                            O - Objetivo
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Observaciones del terapeuta: comportamiento, apariencia, afecto
                        </p>
                        <Textarea
                            id="objective"
                            placeholder="Se observa que..."
                            rows={4}
                            value={content.objective}
                            onChange={(e) => setContent({ ...content, objective: e.target.value })}
                        />
                    </div>

                    {/* Assessment */}
                    <div className="space-y-2">
                        <Label htmlFor="assessment" className="text-base font-semibold">
                            A - Análisis
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Interpretación clínica, diagnóstico diferencial, progreso
                        </p>
                        <Textarea
                            id="assessment"
                            placeholder="Análisis clínico..."
                            rows={4}
                            value={content.assessment}
                            onChange={(e) => setContent({ ...content, assessment: e.target.value })}
                        />
                    </div>

                    {/* Plan */}
                    <div className="space-y-2">
                        <Label htmlFor="plan" className="text-base font-semibold">
                            P - Plan
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Intervenciones, tareas, objetivos para próximas sesiones
                        </p>
                        <Textarea
                            id="plan"
                            placeholder="Plan de tratamiento..."
                            rows={4}
                            value={content.plan}
                            onChange={(e) => setContent({ ...content, plan: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <svg
                                className="mr-2 h-4 w-4 animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Guardando...
                        </>
                    ) : (
                        'Guardar Nota'
                    )}
                </Button>
            </div>
        </form>
    )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createReferralRequest, acceptReceivedReferral, rejectReceivedReferral } from './actions'
import {
    Plus, Loader2, Check, X, AlertCircle, CheckCircle2,
    User, Phone, FileText, Brain, AlertTriangle
} from 'lucide-react'

export function NewReferralForm({ onSuccess }: { onSuccess?: () => void }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [patientName, setPatientName] = useState('')
    const [patientAge, setPatientAge] = useState('')
    const [patientContact, setPatientContact] = useState('')
    const [reason, setReason] = useState('')
    const [specialtyNeeded, setSpecialtyNeeded] = useState('')
    const [populationType, setPopulationType] = useState('')
    const [urgency, setUrgency] = useState('normal')
    const [notes, setNotes] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        if (!patientName.trim() || !reason.trim()) {
            setMessage({ type: 'error', text: 'Nombre del paciente y motivo son obligatorios' })
            setIsLoading(false)
            return
        }

        const result = await createReferralRequest({
            patientName: patientName.trim(),
            patientAge: patientAge ? parseInt(patientAge) : null,
            patientContact: patientContact.trim(),
            reason: reason.trim(),
            specialtyNeeded: specialtyNeeded.trim(),
            populationType,
            urgency,
            notes: notes.trim()
        })

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Solicitud enviada. El equipo administrativo buscara el mejor ajuste clinico.' })
            setPatientName('')
            setPatientAge('')
            setPatientContact('')
            setReason('')
            setSpecialtyNeeded('')
            setPopulationType('')
            setUrgency('normal')
            setNotes('')
            setTimeout(() => { setOpen(false); onSuccess?.() }, 2000)
        }
        setIsLoading(false)
    }

    if (!open) {
        return (
            <Button onClick={() => setOpen(true)} className="w-full gap-2 sm:w-auto">
                <Plus className="h-4 w-4" />
                Nueva Canalizacion
            </Button>
        )
    }

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Solicitar Canalizacion Clinica
                </CardTitle>
                <CardDescription>
                    Comparte la informacion necesaria para transferir el caso al colega mas adecuado. No existe pago ni comision por esta accion.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="text-sm font-medium flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                Nombre del Paciente *
                            </label>
                            <Input
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                placeholder="Nombre completo"
                                className="mt-1"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Edad</label>
                            <Input
                                type="number"
                                value={patientAge}
                                onChange={(e) => setPatientAge(e.target.value)}
                                placeholder="Ej: 12"
                                className="mt-1"
                                min={0}
                                max={120}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                Contacto del Paciente
                            </label>
                            <Input
                                value={patientContact}
                                onChange={(e) => setPatientContact(e.target.value)}
                                placeholder="Telefono o email"
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium flex items-center gap-1.5">
                            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                            Motivo de Canalizacion *
                        </label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe por que necesitas transferir este caso y que ajuste clinico buscas..."
                            className="mt-1 h-20 resize-none"
                            required
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="text-sm font-medium">Especialidad Requerida</label>
                            <Input
                                value={specialtyNeeded}
                                onChange={(e) => setSpecialtyNeeded(e.target.value)}
                                placeholder="Ej: Psicologia Infantil"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Tipo de Poblacion</label>
                            <select
                                value={populationType}
                                onChange={(e) => setPopulationType(e.target.value)}
                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Ninos">Ninos</option>
                                <option value="Adolescentes">Adolescentes</option>
                                <option value="Adultos">Adultos</option>
                                <option value="Parejas">Parejas</option>
                                <option value="Familias">Familias</option>
                                <option value="Adultos mayores">Adultos mayores</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                                Urgencia
                            </label>
                            <select
                                value={urgency}
                                onChange={(e) => setUrgency(e.target.value)}
                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="normal">Normal</option>
                                <option value="alta">Alta</option>
                                <option value="urgente">Urgente</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Notas Adicionales</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Comparte solo la informacion necesaria para facilitar la continuidad de cuidado..."
                            className="mt-1 h-16 resize-none"
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {message.text}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 justify-end sm:flex-row">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                            ) : (
                                <><Check className="mr-2 h-4 w-4" />Enviar Solicitud</>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

export function ReferralResponseButtons({ referralId }: { referralId: string }) {
    const [isLoading, setIsLoading] = useState<'accept' | 'reject' | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    async function handleAccept() {
        setIsLoading('accept')
        const result = await acceptReceivedReferral(referralId)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Canalizacion aceptada' })
        }
        setIsLoading(null)
    }

    async function handleReject() {
        setIsLoading('reject')
        const result = await rejectReceivedReferral(referralId)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Canalizacion rechazada' })
        }
        setIsLoading(null)
    }

    if (message) {
        return (
            <span className={`text-xs px-2 py-1 rounded-full ${message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                }`}>
                {message.text}
            </span>
        )
    }

    return (
        <div className="flex flex-col gap-2 sm:flex-row">
            <Button
                size="sm"
                variant="default"
                onClick={handleAccept}
                disabled={isLoading !== null}
                className="h-9 w-full gap-1 sm:w-auto"
            >
                {isLoading === 'accept' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Aceptar
            </Button>
            <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                disabled={isLoading !== null}
                className="h-9 w-full gap-1 sm:w-auto"
            >
                {isLoading === 'reject' ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                Rechazar
            </Button>
        </div>
    )
}

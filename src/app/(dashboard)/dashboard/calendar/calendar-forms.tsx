'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAppointment, cancelAppointment, confirmAppointment, completeAppointment, quickCreatePatient } from './actions'
import { Plus, X, Check, Loader2, Calendar, Clock, Video, MapPin, CheckCircle2, AlertCircle, UserPlus, Phone, Mail, User } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface Patient {
    id: string
    full_name: string | null
}

interface Appointment {
    id: string
    start_time: string
    end_time: string
    status: string
    type: string
    notes: string | null
    meeting_link?: string | null
    patient: { full_name: string } | null
    psychologist: { full_name: string } | null
}

// ────────────────────────────────────────
// INLINE QUICK CREATE PATIENT
// ────────────────────────────────────────
interface QuickCreatePatientProps {
    onCreated: (patient: Patient) => void
    onCancel: () => void
}

function QuickCreatePatientInline({ onCreated, onCancel }: QuickCreatePatientProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        const form = e.currentTarget
        const formData = new FormData(form)

        try {
            const result = await quickCreatePatient(formData)
            if (result.error) {
                setError(result.error)
            } else if (result.patient) {
                onCreated(result.patient)
            }
        } catch {
            setError('Error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                    <UserPlus className="h-4 w-4" />
                    Crear Nuevo Paciente
                </h4>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                {/* Name - Required */}
                <div className="space-y-1">
                    <label htmlFor="qcp-name" className="text-xs font-medium flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        Nombre completo *
                    </label>
                    <Input
                        id="qcp-name"
                        name="fullName"
                        required
                        placeholder="Nombre del paciente"
                        className="h-9 text-sm"
                    />
                </div>

                {/* Email & Phone - Optional */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label htmlFor="qcp-email" className="text-xs font-medium flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            Email <span className="text-muted-foreground">(opcional)</span>
                        </label>
                        <Input
                            id="qcp-email"
                            name="email"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            className="h-9 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="qcp-phone" className="text-xs font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            Teléfono <span className="text-muted-foreground">(opcional)</span>
                        </label>
                        <Input
                            id="qcp-phone"
                            name="phone"
                            type="tel"
                            placeholder="55 1234 5678"
                            className="h-9 text-sm"
                        />
                    </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                    💡 Sin correo = paciente local (no necesita cuenta). Con correo = se le envía invitación.
                </p>

                {error && (
                    <div className="p-2 rounded-md text-xs surface-alert-error flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={onCancel} className="flex-1 h-8 text-xs">
                        Cancelar
                    </Button>
                    <Button type="submit" size="sm" disabled={isLoading} className="flex-1 h-8 text-xs">
                        {isLoading ? (
                            <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Creando...</>
                        ) : (
                            <><UserPlus className="mr-1.5 h-3 w-3" />Crear Paciente</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}

// ────────────────────────────────────────
// CREATE APPOINTMENT FORM
// ────────────────────────────────────────
interface CreateAppointmentFormProps {
    patients: Patient[]
    onClose: () => void
}

export function CreateAppointmentForm({ patients: initialPatients, onClose }: CreateAppointmentFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [showCreatePatient, setShowCreatePatient] = useState(false)
    const [patients, setPatients] = useState<Patient[]>(initialPatients)
    const [selectedPatientId, setSelectedPatientId] = useState<string>('')

    async function handleSubmit(formData: FormData) {
        setError(null)
        setSuccess(null)

        if (!selectedPatientId) {
            setError('Selecciona un paciente para la cita')
            return
        }

        setIsLoading(true)
        formData.set('patientId', selectedPatientId)

        try {
            const result = await createAppointment(formData)
            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(result.success || 'Cita creada')
                setTimeout(() => onClose(), 1500)
            }
        } catch (e) {
            setError('Error inesperado al crear la cita')
        } finally {
            setIsLoading(false)
        }
    }

    function handlePatientCreated(newPatient: Patient) {
        setPatients(prev => [...prev, newPatient])
        setSelectedPatientId(newPatient.id)
        setShowCreatePatient(false)
    }

    // Get tomorrow's date as min for the date input
    const today = new Date()
    const minDate = today.toISOString().split('T')[0]

    const hasPatients = patients.length > 0

    return (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg animate-in fade-in zoom-in duration-200 border-border/80 shadow-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        Nueva Cita
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="self-end sm:self-auto">
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-5">
                        {/* Patient Select + Quick Create */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="patientId" className="text-sm font-medium">
                                    Paciente
                                </label>
                                {!showCreatePatient && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-primary hover:text-primary"
                                        onClick={() => setShowCreatePatient(true)}
                                    >
                                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                        Nuevo Paciente
                                    </Button>
                                )}
                            </div>

                            {showCreatePatient ? (
                                <QuickCreatePatientInline
                                    onCreated={handlePatientCreated}
                                    onCancel={() => setShowCreatePatient(false)}
                                />
                            ) : hasPatients ? (
                                <select
                                    id="patientId"
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="">Seleccionar paciente...</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.full_name || 'Sin nombre'}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                /* No patients empty state */
                                <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center">
                                    <div className="mx-auto w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-3">
                                        <UserPlus className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium mb-1">Aún no tienes pacientes</p>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Crea tu primer paciente para agendar una cita
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setShowCreatePatient(true)}
                                    >
                                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                        Crear Primer Paciente
                                    </Button>
                                </div>
                            )}

                            {/* Show selected patient confirmation */}
                            {selectedPatientId && !showCreatePatient && (
                                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Paciente seleccionado: {patients.find(p => p.id === selectedPatientId)?.full_name}
                                </div>
                            )}
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="date" className="text-sm font-medium flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    Fecha
                                </label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    min={minDate}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="time" className="text-sm font-medium flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    Hora
                                </label>
                                <Input
                                    id="time"
                                    name="time"
                                    type="time"
                                    required
                                />
                            </div>
                        </div>

                        {/* Duration & Type */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="duration" className="text-sm font-medium">
                                    Duración
                                </label>
                                <select
                                    id="duration"
                                    name="duration"
                                    defaultValue="60"
                                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="30">30 min</option>
                                    <option value="45">45 min</option>
                                    <option value="60">60 min</option>
                                    <option value="90">90 min</option>
                                    <option value="120">120 min</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="type" className="text-sm font-medium">
                                    Modalidad
                                </label>
                                <select
                                    id="type"
                                    name="type"
                                    defaultValue="video"
                                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="video">🎥 Videollamada</option>
                                    <option value="in_person">📍 Presencial</option>
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <label htmlFor="notes" className="text-sm font-medium">
                                Notas (opcional)
                            </label>
                            <Textarea
                                id="notes"
                                name="notes"
                                rows={2}
                                placeholder="Notas adicionales sobre la cita..."
                                className="resize-none"
                            />
                        </div>

                        {/* Feedback */}
                        {success && (
                            <div className="surface-alert-success rounded-lg p-3 text-sm flex items-center gap-2 animate-in fade-in">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="surface-alert-error rounded-lg p-3 text-sm flex items-center gap-2 animate-in fade-in">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:flex-1">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading || !selectedPatientId} className="w-full sm:flex-1">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Crear Cita
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

// ────────────────────────────────────────
// APPOINTMENT ACTIONS
// ────────────────────────────────────────
interface AppointmentActionsProps {
    appointment: Appointment
    userRole: string
}

export function AppointmentActions({ appointment, userRole }: AppointmentActionsProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleCancel() {
        if (!confirm('¿Estás seguro de cancelar esta cita?')) return
        setIsLoading(true)
        await cancelAppointment(appointment.id)
        setIsLoading(false)
    }

    async function handleConfirm() {
        setIsLoading(true)
        await confirmAppointment(appointment.id)
        setIsLoading(false)
    }

    async function handleComplete() {
        if (!confirm('¿Marcar esta cita como completada?')) return
        setIsLoading(true)
        await completeAppointment(appointment.id)
        setIsLoading(false)
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
        return null
    }

    return (
        <div className="flex flex-wrap gap-2 mt-3">
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
                <>
                    {appointment.status === 'pending' && userRole === 'psychologist' && (
                        <Button size="sm" variant="default" onClick={handleConfirm} className="h-7 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Confirmar
                        </Button>
                    )}
                    {appointment.status === 'confirmed' && userRole === 'psychologist' && (
                        <Button size="sm" variant="default" onClick={handleComplete} className="h-7 text-xs bg-green-600 hover:bg-green-700">
                            <Check className="h-3 w-3 mr-1" />
                            Completar
                        </Button>
                    )}
                    {(appointment.status === 'confirmed' || appointment.status === 'pending') && appointment.meeting_link && (
                        <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                            <a href={appointment.meeting_link} target="_blank" rel="noopener noreferrer">
                                <Video className="h-3 w-3 mr-1" />
                                Unirse
                            </a>
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                        <X className="h-3 w-3 mr-1" />
                        Cancelar
                    </Button>
                </>
            )}
        </div>
    )
}

// ────────────────────────────────────────
// NEW APPOINTMENT BUTTON
// ────────────────────────────────────────
interface NewAppointmentButtonProps {
    patients: Patient[]
}

export function NewAppointmentButton({ patients }: NewAppointmentButtonProps) {
    const [showForm, setShowForm] = useState(false)

    return (
        <>
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cita
            </Button>
            {showForm && (
                <CreateAppointmentForm
                    patients={patients}
                    onClose={() => setShowForm(false)}
                />
            )}
        </>
    )
}

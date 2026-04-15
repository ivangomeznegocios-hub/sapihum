'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { bookAppointment } from './actions'
import { collectAnalyticsEvent } from '@/lib/analytics/client'
import { format, addDays, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Check, Clock, Calendar as CalendarIcon,
    ArrowLeft, ArrowRight, Loader2,
    Video, MapPin, CheckCircle2, AlertCircle,
    ChevronLeft, ChevronRight
} from 'lucide-react'

interface Service {
    name: string
    duration: number
    price: number
    modality: 'video' | 'in_person' | 'both'
}

interface BookingWizardProps {
    psychologist: any
    patient: any
    existingAppointments: any[]
}

// Default services if psychologist hasn't configured any
const DEFAULT_SERVICES: Service[] = [
    { name: 'Consulta Psicológica', duration: 60, price: 0, modality: 'both' }
]

export function BookingWizard({ psychologist, existingAppointments }: BookingWizardProps) {
    const services: Service[] = (psychologist?.services && psychologist.services.length > 0)
        ? psychologist.services
        : DEFAULT_SERVICES

    const [step, setStep] = useState(1)
    const [selectedService, setSelectedService] = useState<Service | null>(services.length === 1 ? services[0] : null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Calendar navigation
    const [calendarMonth, setCalendarMonth] = useState(new Date())

    const [bookingType, setBookingType] = useState('video')

    // Generate available time slots
    const getAvailableSlots = (date: Date) => {
        if (!date || !selectedService) return []

        const now = new Date()
        const isToday = isSameDay(date, now)
        const duration = selectedService.duration

        // Check psychologist availability for this day
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const dayKey = dayNames[date.getDay()]
        const dayAvailability = psychologist?.availability?.[dayKey]

        const slots: string[] = []

        if (dayAvailability && dayAvailability.length > 0) {
            // Use psychologist's configured availability
            dayAvailability.forEach((range: { start: string; end: string }) => {
                const [startH, startM] = range.start.split(':').map(Number)
                const [endH, endM] = range.end.split(':').map(Number)
                const startMinutes = startH * 60 + (startM || 0)
                const endMinutes = endH * 60 + (endM || 0)

                for (let m = startMinutes; m + duration <= endMinutes; m += 30) {
                    const h = Math.floor(m / 60)
                    const min = m % 60
                    slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
                }
            })
        } else {
            // Default: 9AM-6PM weekdays
            if (date.getDay() === 0) return [] // Sunday off
            for (let m = 9 * 60; m + duration <= 18 * 60; m += 30) {
                const h = Math.floor(m / 60)
                const min = m % 60
                slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
            }
        }

        // Filter past and conflicting slots
        return slots.filter(time => {
            const [h, m] = time.split(':').map(Number)
            const slotStart = new Date(date)
            slotStart.setHours(h, m, 0, 0)
            const slotEnd = new Date(slotStart.getTime() + duration * 60000)

            if (isToday && slotStart <= now) return false

            return !existingAppointments.some((apt: any) => {
                const aptStart = new Date(apt.start_time)
                const aptEnd = new Date(apt.end_time)
                return slotStart < aptEnd && slotEnd > aptStart
            })
        })
    }

    const handleBook = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return

        setIsSubmitting(true)
        setError(null)

        const dateStr = format(selectedDate, 'yyyy-MM-dd')

        const result = await bookAppointment({
            psychologistId: psychologist.id,
            date: dateStr,
            time: selectedTime,
            duration: selectedService.duration,
            type: bookingType,
            notes: notes || undefined,
            serviceName: selectedService.name,
            price: selectedService.price
        })

        setIsSubmitting(false)

        if (result.error) {
            setError(result.error)
        } else {
            await collectAnalyticsEvent('book_appointment', {
                properties: {
                    psychologist_id: psychologist.id,
                    service_name: selectedService.name,
                    duration_minutes: selectedService.duration,
                    booking_type: bookingType,
                    has_paid_service: selectedService.price > 0,
                },
                touch: {
                    funnel: 'dashboard',
                    landingPath: '/dashboard/booking',
                },
            })
            setIsSuccess(true)
        }
    }

    // Success Screen
    if (isSuccess) {
        return (
            <Card className="max-w-lg mx-auto">
                <CardContent className="pt-10 pb-8 text-center space-y-6">
                    <div className="mx-auto w-20 h-20 bg-brand-brown dark:bg-brand-brown/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-brand-brown" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">¡Cita Solicitada!</h2>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                            Tu solicitud ha sido enviada. Tu psicólogo la confirmará pronto.
                        </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 max-w-xs mx-auto text-left space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Servicio</span>
                            <span className="font-medium">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha</span>
                            <span className="font-medium capitalize">
                                {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Hora</span>
                            <span className="font-medium">{selectedTime}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Duración</span>
                            <span className="font-medium">{selectedService?.duration} min</span>
                        </div>
                        {selectedService && selectedService.price > 0 && (
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-muted-foreground">Precio</span>
                                <span className="font-bold">${selectedService.price} MXN</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 justify-center pt-2">
                        <Button variant="outline" onClick={() => window.location.href = '/dashboard/calendar'}>
                            Ver mis Citas
                        </Button>
                        <Button onClick={() => {
                            setIsSuccess(false)
                            setSelectedDate(undefined)
                            setSelectedTime(null)
                            setNotes('')
                            setStep(services.length > 1 ? 1 : 2)
                        }}>
                            Agendar otra
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Dynamic step labels
    const steps = services.length > 1
        ? [{ id: 1, label: 'Servicio' }, { id: 2, label: 'Fecha y Hora' }, { id: 3, label: 'Confirmación' }]
        : [{ id: 1, label: 'Fecha y Hora' }, { id: 2, label: 'Confirmación' }]

    // Map logical step to visual step
    const effectiveStep = services.length > 1 ? step : step + 1

    const availableSlots = selectedDate ? getAvailableSlots(selectedDate) : []

    // Simple calendar renderer
    const renderCalendar = () => {
        const year = calendarMonth.getFullYear()
        const month = calendarMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startWeekday = firstDay.getDay() // 0=Sun

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const maxDate = addDays(new Date(), 60)

        const dayHeaders = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']
        const days: (number | null)[] = []

        // Empty slots before first day
        for (let i = 0; i < startWeekday; i++) days.push(null)
        for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)

        return (
            <div className="w-full max-w-sm mx-auto">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                        disabled={month <= today.getMonth() && year <= today.getFullYear()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium capitalize">
                        {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {dayHeaders.map(d => (
                        <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => {
                        if (day === null) return <div key={`empty-${idx}`} />

                        const date = new Date(year, month, day)
                        const isPast = date < today
                        const isTooFar = date > maxDate
                        const isSunday = date.getDay() === 0
                        const isDisabled = isPast || isTooFar || isSunday
                        const isSelected = selectedDate && isSameDay(date, selectedDate)
                        const isToday = isSameDay(date, new Date())

                        return (
                            <button
                                key={day}
                                disabled={isDisabled}
                                onClick={() => {
                                    setSelectedDate(date)
                                    setSelectedTime(null)
                                }}
                                className={`
                                    h-9 w-full rounded-md text-sm font-medium transition-colors
                                    ${isDisabled
                                        ? 'text-muted-foreground/30 cursor-not-allowed'
                                        : isSelected
                                            ? 'bg-primary text-primary-foreground'
                                            : isToday
                                                ? 'bg-accent text-accent-foreground hover:bg-accent/80'
                                                : 'hover:bg-muted'
                                    }
                                `}
                            >
                                {day}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2">
                {steps.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                        <div className={`
                            h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                            ${step >= s.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }
                        `}>
                            {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                        </div>
                        <span className={`text-sm hidden sm:inline ${step >= s.id ? 'font-medium' : 'text-muted-foreground'}`}>
                            {s.label}
                        </span>
                        {i < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Service Selection (only if multiple services) */}
            {effectiveStep === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Selecciona un Servicio</CardTitle>
                        <CardDescription>Elige el tipo de consulta que necesitas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {services.map((service, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedService(service)}
                                className={`
                                    p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50
                                    ${selectedService?.name === service.name
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : ''
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">{service.name}</p>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {service.duration} min
                                            </span>
                                            <span className="flex items-center gap-1">
                                                {service.modality === 'video' && <><Video className="h-3.5 w-3.5" /> Online</>}
                                                {service.modality === 'in_person' && <><MapPin className="h-3.5 w-3.5" /> Presencial</>}
                                                {service.modality === 'both' && <><Video className="h-3.5 w-3.5" /> Online / Presencial</>}
                                            </span>
                                        </div>
                                    </div>
                                    {service.price > 0 && (
                                        <span className="font-bold text-lg">${service.price}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Date & Time */}
            {effectiveStep === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            Selecciona Fecha y Hora
                        </CardTitle>
                        <CardDescription>
                            {selectedService?.name} — {selectedService?.duration} min
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Custom Calendar */}
                        <div className="border rounded-lg p-4">
                            {renderCalendar()}
                        </div>

                        {/* Time Slots */}
                        {selectedDate && (
                            <div className="space-y-3">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    Horarios — {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                                </h3>
                                {availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                                        {availableSlots.map(time => (
                                            <Button
                                                key={time}
                                                variant={selectedTime === time ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedTime(time)}
                                                className="text-xs"
                                            >
                                                {time}
                                            </Button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                                        <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                        No hay horarios disponibles para este día
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Modality (only show if service allows both) */}
                        {selectedService?.modality === 'both' && selectedTime && (
                            <div className="space-y-3">
                                <h3 className="font-medium text-sm">Modalidad</h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div
                                        className={`p-3 border rounded-lg cursor-pointer text-center transition-all hover:border-primary/50 ${bookingType === 'video' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                                            }`}
                                        onClick={() => setBookingType('video')}
                                    >
                                        <Video className="h-5 w-5 mx-auto mb-1 text-primary" />
                                        <span className="text-sm font-medium">Online</span>
                                    </div>
                                    <div
                                        className={`p-3 border rounded-lg cursor-pointer text-center transition-all hover:border-primary/50 ${bookingType === 'in_person' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                                            }`}
                                        onClick={() => setBookingType('in_person')}
                                    >
                                        <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
                                        <span className="text-sm font-medium">Presencial</span>
                                    </div>
                                </div>
                                {bookingType === 'in_person' && psychologist.office_address && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {psychologist.office_address}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Confirm */}
            {effectiveStep === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Check className="h-5 w-5 text-primary" />
                            Confirma tu Cita
                        </CardTitle>
                        <CardDescription>Verifica los detalles antes de enviar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="bg-muted/50 rounded-lg p-5 space-y-3">
                            <div className="flex items-center gap-3 pb-3 border-b">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                    {psychologist.full_name?.charAt(0) || 'P'}
                                </div>
                                <div>
                                    <p className="font-medium">{psychologist.full_name}</p>
                                    <p className="text-xs text-muted-foreground">Psicólogo</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                                <div>
                                    <span className="text-muted-foreground text-xs">Servicio</span>
                                    <p className="font-medium">{selectedService?.name}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs">Duración</span>
                                    <p className="font-medium">{selectedService?.duration} min</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs">Fecha</span>
                                    <p className="font-medium capitalize">
                                        {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs">Hora</span>
                                    <p className="font-medium">{selectedTime}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs">Modalidad</span>
                                    <p className="font-medium">
                                        {bookingType === 'video' ? '🎥 Online' : '📍 Presencial'}
                                    </p>
                                </div>
                                {selectedService && selectedService.price > 0 && (
                                    <div>
                                        <span className="text-muted-foreground text-xs">Precio</span>
                                        <p className="font-bold text-lg">${selectedService.price}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notas (opcional)</label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="¿Algo que quieras mencionar antes de la cita?"
                                rows={2}
                                className="resize-none"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg text-sm surface-alert-error dark:bg-red-900/30 dark:text-red-200 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Navigation */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 1 || isSubmitting}
                    className="w-full sm:w-auto"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Atrás
                </Button>

                {effectiveStep < 3 ? (
                    <Button
                        onClick={() => setStep(step + 1)}
                        disabled={
                            (effectiveStep === 1 && !selectedService) ||
                            (effectiveStep === 2 && (!selectedDate || !selectedTime))
                        }
                        className="w-full sm:w-auto"
                    >
                        Siguiente
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleBook} disabled={isSubmitting} className="w-full min-w-[140px] sm:w-auto">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Agendando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Confirmar Cita
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}


'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { registerForEvent, cancelEventRegistration, createEvent, updateEvent, deleteEvent } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Loader2, Check, UserPlus, UserMinus, Users, Lock, Globe, Stethoscope, Heart, Pencil, Trash2, AlertTriangle, HelpCircle, GripVertical, MapPin, Copy, Code2, Link2, Calendar, Clock, Repeat, GraduationCap, Award, Mic2, Video } from 'lucide-react'

interface Event {
    id: string
    title: string
    start_time: string
    registration_fields?: { label: string; required: boolean }[]
}

interface EventRegistrationButtonProps {
    event: Event
    isRegistered: boolean
}

export function EventRegistrationButton({ event, isRegistered }: EventRegistrationButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [registered, setRegistered] = useState(isRegistered)
    const [error, setError] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [answers, setAnswers] = useState<Record<string, string>>({})

    const hasQuestions = event.registration_fields && event.registration_fields.length > 0

    async function handleRegister(registrationData: Record<string, string> = {}) {
        setIsLoading(true)
        setError(null)
        const result = await registerForEvent(event.id, registrationData)
        if (result.error) {
            setError(result.error)
        } else {
            setRegistered(true)
            setShowModal(false)
        }
        setIsLoading(false)
    }

    function handleRegisterClick() {
        if (hasQuestions) {
            setShowModal(true)
        } else {
            handleRegister()
        }
    }

    function handleSubmitForm(e: React.FormEvent) {
        e.preventDefault()
        // Validate required fields
        for (const field of event.registration_fields || []) {
            if (field.required && !answers[field.label]?.trim()) {
                setError(`El campo "${field.label}" es obligatorio`)
                return
            }
        }
        handleRegister(answers)
    }

    async function handleCancel() {
        if (!confirm('¿Cancelar tu registro en este evento?')) return
        setIsLoading(true)
        const result = await cancelEventRegistration(event.id)
        if (!result.error) {
            setRegistered(false)
        }
        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <Button disabled className="w-full">
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        )
    }

    if (registered) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 p-2 surface-alert-success rounded-lg">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">Registrado</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleCancel} className="w-full text-red-600">
                    <UserMinus className="h-4 w-4 mr-2" />
                    Cancelar registro
                </Button>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-2">
                <Button className="w-full" onClick={handleRegisterClick}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrarme
                </Button>
                {error && !showModal && (
                    <p className="text-sm text-red-600 text-center">{error}</p>
                )}
            </div>

            {/* Registration Modal */}
            {showModal && (
                <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Completa tu registro</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitForm} className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Por favor responde las siguientes preguntas para completar tu registro en <strong>{event.title}</strong>.
                                </p>

                                {event.registration_fields?.map((field, index) => (
                                    <div key={index}>
                                        <label className="text-sm font-medium flex items-center gap-1">
                                            {field.label}
                                            {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type="text"
                                            value={answers[field.label] || ''}
                                            onChange={(e) => setAnswers(prev => ({ ...prev, [field.label]: e.target.value }))}
                                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                                            placeholder={`Responde: ${field.label}`}
                                        />
                                    </div>
                                ))}

                                {error && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Registro'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    )
}

interface CreateEventFormProps {
    onClose?: () => void
    isEmbedded?: boolean // When used in a page instead of modal
    initialData?: any // Should be typed properly with Event type
    eventId?: string
    userRole?: string
}

const CATEGORY_OPTIONS = [
    { value: 'general', label: 'General' },
    { value: 'networking', label: 'Networking / Social' },
    { value: 'clinical', label: 'Escuela Clínica' },
    { value: 'business', label: 'Negocios' },
]

const SUBCATEGORY_OPTIONS: Record<string, { value: string; label: string }[]> = {
    clinical: [
        { value: 'curso', label: 'Curso' },
        { value: 'diplomado', label: 'Diplomado' },
        { value: 'clase', label: 'Clase' },
        { value: 'taller', label: 'Taller' },
        { value: 'conferencia', label: 'Conferencia' },
        { value: 'seminario', label: 'Seminario' },
        { value: 'congreso', label: 'Congreso' },
        { value: 'otro', label: 'Otro' },
    ],
    networking: [
        { value: 'meetup', label: 'Meetup' },
        { value: 'conferencia', label: 'Conferencia' },
        { value: 'taller', label: 'Taller' },
        { value: 'otro', label: 'Otro' },
    ],
    business: [
        { value: 'curso', label: 'Curso' },
        { value: 'taller', label: 'Taller' },
        { value: 'conferencia', label: 'Conferencia' },
        { value: 'seminario', label: 'Seminario' },
        { value: 'otro', label: 'Otro' },
    ],
}

const AUDIENCE_OPTIONS = [
    { value: 'public', label: 'Público General', icon: Globe, description: 'Cualquier persona puede ver y registrarse' },
    { value: 'members', label: 'Solo Miembros', icon: Lock, description: 'Usuarios con suscripción activa' },
    { value: 'psychologists', label: 'Solo Psicólogos', icon: Stethoscope, description: 'Exclusivo para profesionales de la salud mental' },
    { value: 'patients', label: 'Solo Pacientes', icon: Heart, description: 'Exclusivo para pacientes registrados' },
    { value: 'active_patients', label: 'Pacientes Activos', icon: Users, description: 'Pacientes con psicólogo asignado actualmente' },
    { value: 'ponentes', label: 'Solo Ponentes', icon: Mic2, description: 'Eventos internos exclusivos para ponentes' },
    { value: 'students', label: 'Estudiantes', icon: GraduationCap, description: 'Estudiantes de psicología u otras disciplinas' },
    { value: 'certified', label: 'Profesionales Certificados', icon: Award, description: 'Profesionales con cédula profesional o certificación vigente' },
]

const SESSION_DURATION_OPTIONS = [
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1.5 horas' },
    { value: 120, label: '2 horas' },
    { value: 150, label: '2.5 horas' },
    { value: 180, label: '3 horas' },
    { value: 240, label: '4 horas' },
    { value: 300, label: '5 horas' },
    { value: 360, label: '6 horas' },
]

const RECURRENCE_OPTIONS = [
    { value: 'none', label: 'Sin recurrencia (fechas manuales)' },
    { value: 'lunes', label: 'Cada Lunes' },
    { value: 'martes', label: 'Cada Martes' },
    { value: 'miercoles', label: 'Cada Miércoles' },
    { value: 'jueves', label: 'Cada Jueves' },
    { value: 'viernes', label: 'Cada Viernes' },
    { value: 'sabado', label: 'Cada Sábado' },
    { value: 'domingo', label: 'Cada Domingo' },
]

const MEETING_PLATFORM_OPTIONS = [
    { value: 'manual', label: 'Manual (pegar enlace)' },
    { value: 'google_meet', label: 'Google Meet' },
    { value: 'jitsi', label: 'Jitsi Meet' },
    { value: 'youtube_live', label: 'YouTube Live' },
    { value: 'zoom', label: 'Zoom' },
]

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hrs}h ${mins}min` : `${hrs} hora${hrs > 1 ? 's' : ''}`
}

export function CreateEventForm({ onClose, isEmbedded = false, initialData, eventId, userRole }: CreateEventFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedAudience, setSelectedAudience] = useState<string[]>(initialData?.target_audience || ['public'])
    const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'general')
    const [selectedSubcategory, setSelectedSubcategory] = useState(initialData?.subcategory || '')
    const [memberAccessType, setMemberAccessType] = useState(initialData?.member_access_type || 'free')

    // Session configuration state
    const [totalSessions, setTotalSessions] = useState(initialData?.session_config?.total_sessions || 1)
    const [sessionDuration, setSessionDuration] = useState(initialData?.session_config?.session_duration_minutes || 60)
    const [recurrence, setRecurrence] = useState(initialData?.session_config?.recurrence || 'none')
    const [modality, setModality] = useState(initialData?.session_config?.modality || 'online')
    const [meetingPlatform, setMeetingPlatform] = useState('manual')

    // Computed session summary
    const totalHours = (totalSessions * sessionDuration) / 60
    const sessionSummary = totalSessions === 1
        ? `Evento único de ${formatDuration(sessionDuration)}`
        : `${totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)} horas total · ${totalSessions} sesiones de ${formatDuration(sessionDuration)}${recurrence !== 'none' ? ` · ${RECURRENCE_OPTIONS.find(r => r.value === recurrence)?.label}` : ''}`

    // Speakers selection
    const [availableSpeakers, setAvailableSpeakers] = useState<{ id: string; name: string; avatar: string | null }[]>([])
    const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>(
        initialData?.speakers?.map((s: any) => s.speaker_id) || []
    )
    const [loadingSpeakers, setLoadingSpeakers] = useState(true)

    // Use a counter ref to generate stable unique IDs
    const questionIdCounter = useRef(0)

    // Initialize registration fields with unique IDs
    const [registrationFields, setRegistrationFields] = useState<{ id: number; label: string; required: boolean }[]>(
        (initialData?.registration_fields || []).map((f: any) => ({ ...f, id: questionIdCounter.current++ }))
    )

    // Fetch available speakers
    useState(() => {
        async function fetchSpeakers() {
            setLoadingSpeakers(true)
            const supabase = createClient()
            const { data, error } = await supabase
                .from('speakers')
                .select(`
                    id,
                    profile:profiles ( full_name, avatar_url )
                `)

            if (!error && data) {
                setAvailableSpeakers(data.map((s: any) => ({
                    id: s.id,
                    name: s.profile?.full_name || 'Desconocido',
                    avatar: s.profile?.avatar_url
                })))
            }
            setLoadingSpeakers(false)
        }
        fetchSpeakers()
    })

    function addQuestion() {
        const newId = questionIdCounter.current++
        setRegistrationFields(prev => [...prev, { id: newId, label: '', required: false }])
    }

    function removeQuestion(id: number) {
        setRegistrationFields(prev => prev.filter(q => q.id !== id))
    }

    function updateQuestion(id: number, field: 'label' | 'required', value: string | boolean) {
        setRegistrationFields(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q))
    }

    function toggleAudience(value: string) {
        setSelectedAudience(prev => {
            if (prev.includes(value)) {
                return prev.filter(v => v !== value)
            }
            // If selecting 'public', clear others
            if (value === 'public') {
                return ['public']
            }
            // If selecting other, remove 'public'
            return [...prev.filter(v => v !== 'public'), value]
        })
    }

    function toggleSpeaker(speakerId: string) {
        setSelectedSpeakers(prev => {
            if (prev.includes(speakerId)) {
                return prev.filter(id => id !== speakerId)
            }
            return [...prev, speakerId]
        })
    }

    function handleClose() {
        if (onClose) {
            onClose()
        } else {
            router.push('/dashboard/events')
        }
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)

        // Add selected audiences to form data
        selectedAudience.forEach(a => formData.append('audience', a))

        // Add registration fields (custom questions) - strip the id before saving
        const validFields = registrationFields
            .filter(f => f.label.trim() !== '')
            .map(({ label, required }) => ({ label, required }))
        formData.append('registrationFields', JSON.stringify(validFields))

        // Add session configuration
        formData.append('sessionConfig', JSON.stringify({
            total_sessions: totalSessions,
            session_duration_minutes: sessionDuration,
            recurrence: recurrence !== 'none' ? recurrence : undefined,
            modality,
        }))

        // Add selected speakers
        formData.append('speakerIds', JSON.stringify(selectedSpeakers))

        let result;
        if (initialData && eventId) {
            result = await updateEvent(eventId, formData)
        } else {
            result = await createEvent(formData)
        }

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            handleClose()
        }
    }

    // Form content as JSX (not a component) to prevent remounting on state changes
    const formContent = (
        <>
            {/* Basic Info */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Información Básica
                </h3>

                <div>
                    <label className="text-sm font-medium" htmlFor="title">
                        Título *
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        required
                        defaultValue={initialData?.title}
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        placeholder="Nombre del evento"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium" htmlFor="description">
                        Descripción
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        defaultValue={initialData?.description}
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-background resize-none"
                        placeholder="Describe el evento..."
                    />
                </div>

                <div>
                    <label className="text-sm font-medium" htmlFor="imageUrl">
                        Imagen del evento (URL)
                    </label>
                    <input
                        id="imageUrl"
                        name="imageUrl"
                        type="url"
                        defaultValue={initialData?.image_url}
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        placeholder="https://ejemplo.com/imagen.jpg"
                    />
                </div>
            </div>

            {/* Category */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Categoría del Evento
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium" htmlFor="category">
                            Categoría *
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory('') }}
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        >
                            {CATEGORY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    {SUBCATEGORY_OPTIONS[selectedCategory] && (
                        <div>
                            <label className="text-sm font-medium" htmlFor="subcategory">
                                Subcategoría
                            </label>
                            <select
                                id="subcategory"
                                name="subcategory"
                                value={selectedSubcategory}
                                onChange={(e) => setSelectedSubcategory(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                            >
                                <option value="">Seleccionar...</option>
                                {SUBCATEGORY_OPTIONS[selectedCategory].map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha, Hora y Programación
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium" htmlFor="date">
                            Fecha de inicio *
                        </label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            required
                            defaultValue={initialData?.start_time ? new Date(initialData.start_time).toISOString().split('T')[0] : ''}
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium" htmlFor="time">
                            Hora *
                        </label>
                        <input
                            id="time"
                            name="time"
                            type="time"
                            required
                            defaultValue={initialData?.start_time ? new Date(initialData.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Hora Central de CDMX (UTC-6)
                        </p>
                    </div>
                </div>

                {/* Modality */}
                <div>
                    <label className="text-sm font-medium" htmlFor="eventType">
                        Tipo de Evento
                    </label>
                    <select
                        id="eventType"
                        name="eventType"
                        defaultValue={initialData?.event_type || 'live'}
                        onChange={(e) => {
                            if (e.target.value === 'presencial') setModality('presencial')
                            else if (modality === 'presencial') setModality('online')
                        }}
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                    >
                        <option value="live">🟢 En Vivo (Online)</option>
                        <option value="on_demand">📹 Grabado (On Demand)</option>
                        <option value="course">📚 Curso (Múltiples sesiones)</option>
                        <option value="presencial">📍 Presencial</option>
                    </select>
                </div>

                {/* Location for in-person */}
                {modality === 'presencial' && (
                    <div>
                        <label className="text-sm font-medium" htmlFor="location">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            Ubicación / Dirección
                        </label>
                        <input
                            id="location"
                            name="location"
                            type="text"
                            defaultValue={initialData?.session_config?.location || initialData?.location || ''}
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                            placeholder="Ej: Auditorio Central, Av. Reforma 222, CDMX"
                        />
                    </div>
                )}

                {/* Professional Session Configuration */}
                <div className="border rounded-xl p-4 bg-muted/20 space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-primary" />
                        Configuración de Sesiones
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">
                                Número de sesiones
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={totalSessions}
                                onChange={(e) => setTotalSessions(Math.max(1, parseInt(e.target.value) || 1))}
                                className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">
                                Duración por sesión
                            </label>
                            <select
                                value={sessionDuration}
                                onChange={(e) => setSessionDuration(parseInt(e.target.value))}
                                className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                            >
                                {SESSION_DURATION_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Recurrence (only when multiple sessions) */}
                    {totalSessions > 1 && (
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">
                                Recurrencia
                            </label>
                            <select
                                value={recurrence}
                                onChange={(e) => setRecurrence(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                            >
                                {RECURRENCE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Session Summary Card */}
                    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-primary">{sessionSummary}</p>
                            {totalSessions > 1 && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Primera sesión: fecha y hora indicadas arriba
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Hidden inputs for form submission */}
                    <input type="hidden" name="duration" value={String(sessionDuration)} />
                </div>

                {/* Speaker Selection */}
                <div className="pt-2">
                    <label className="text-sm font-medium mb-2 block">
                        Ponentes del Evento
                    </label>
                    <div className="border rounded-lg p-4 bg-muted/10 space-y-3 max-h-60 overflow-y-auto">
                        {loadingSpeakers ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground opacity-50" />
                            </div>
                        ) : availableSpeakers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {availableSpeakers.map(speaker => {
                                    const isSelected = selectedSpeakers.includes(speaker.id)
                                    return (
                                        <div
                                            key={speaker.id}
                                            onClick={() => toggleSpeaker(speaker.id)}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-transparent hover:bg-muted/50'
                                                }`}
                                        >
                                            <div className="relative">
                                                {speaker.avatar ? (
                                                    <img src={speaker.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                        <span className="text-xs font-medium">{speaker.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                                {isSelected && (
                                                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-0.5 rounded-full">
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                                                    {speaker.name}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-2">
                                No hay ponentes disponibles en la plataforma.
                            </p>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Selecciona uno o más ponentes para asociarlos a este evento. Sus perfiles de ponente públicos enlazarán con esta página.
                    </p>
                </div>

                {/* Status for Editing (Hidden for Ponentes) */}
                {initialData && userRole !== 'ponente' && (
                    <div>
                        <label className="text-sm font-medium" htmlFor="status">
                            Estado
                        </label>
                        <select
                            id="status"
                            name="status"
                            defaultValue={initialData.status}
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        >
                            <option value="draft">Borrador</option>
                            <option value="upcoming">Próximo</option>
                            <option value="live">En Vivo</option>
                            <option value="completed">Finalizado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                )}

                {/* Draft Notice for Ponentes */}
                {userRole === 'ponente' && (
                    <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <p>
                            Al guardar, este evento quedará en estado <strong>Borrador</strong>.
                            Un administrador deberá revisarlo y aprobarlo para que sea visible al público.
                        </p>
                    </div>
                )}
            </div>

            {/* Meeting Link & Recordings */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Acceso y Grabación
                </h3>

                {/* Meeting Link Section (hidden for presencial-only) */}
                {modality !== 'presencial' && (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">
                                Plataforma de Reunión
                            </label>
                            <select
                                value={meetingPlatform}
                                onChange={(e) => setMeetingPlatform(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                            >
                                {MEETING_PLATFORM_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {meetingPlatform === 'manual' ? (
                            <div>
                                <label className="text-sm font-medium" htmlFor="meetingLink">
                                    Enlace de Reunión
                                </label>
                                <input
                                    id="meetingLink"
                                    name="meetingLink"
                                    type="url"
                                    defaultValue={initialData?.meeting_link}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                                    placeholder="https://meet.google.com/... o https://zoom.us/..."
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Solo visible para registrados el día del evento
                                </p>
                            </div>
                        ) : (
                            <div className="p-3 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                                <p className="font-medium">Enlace automático</p>
                                <p className="text-xs mt-1">
                                    El administrador conectará la cuenta de {MEETING_PLATFORM_OPTIONS.find(p => p.value === meetingPlatform)?.label} para generar enlaces automáticamente. Por ahora, puedes pegar el enlace manualmente.
                                </p>
                                <input
                                    name="meetingLink"
                                    type="url"
                                    defaultValue={initialData?.meeting_link}
                                    className="mt-2 w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                                    placeholder="Pega el enlace mientras se configura la integración"
                                />
                            </div>
                        )}
                    </div>
                )}

                {initialData && (
                    <div>
                        <label className="text-sm font-medium" htmlFor="recordingUrl">
                            URL de Grabación (YouTube, Vimeo, etc.)
                        </label>
                        <input
                            id="recordingUrl"
                            name="recordingUrl"
                            type="text"
                            defaultValue={initialData?.recording_url}
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                            placeholder="https://youtube.com/... o https://vimeo.com/..."
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium" htmlFor="recordingDays">
                            Días de Grabación Disponible
                        </label>
                        <input
                            id="recordingDays"
                            name="recordingDays"
                            type="number"
                            defaultValue={initialData?.recording_available_days || "15"}
                            min="7"
                            max="30"
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            De 7 a 30 días (por defecto 15)
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium" htmlFor="price">
                            Precio (MXN)
                        </label>
                        <input
                            id="price"
                            name="price"
                            type="number"
                            defaultValue={initialData?.price || "0"}
                            min="0"
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        />
                    </div>
                </div>
            </div>

            {/* Dual Pricing for Members */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Precios para Miembros
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium" htmlFor="memberAccessType">
                            Acceso para Miembros
                        </label>
                        <select
                            id="memberAccessType"
                            name="memberAccessType"
                            value={memberAccessType}
                            onChange={(e) => setMemberAccessType(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                        >
                            <option value="free">Gratis para Miembros</option>
                            <option value="discounted">Precio Preferencial</option>
                            <option value="full_price">Mismo Precio</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Define qué precio ven los miembros activos
                        </p>
                    </div>

                    {memberAccessType === 'discounted' && (
                        <div>
                            <label className="text-sm font-medium" htmlFor="memberPrice">
                                Precio Miembros (MXN)
                            </label>
                            <input
                                id="memberPrice"
                                name="memberPrice"
                                type="number"
                                defaultValue={initialData?.member_price || "0"}
                                min="0"
                                className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Embed & Sharing */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Compartir y Embed
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <input
                            type="checkbox"
                            id="isEmbeddable"
                            name="isEmbeddable"
                            defaultChecked={initialData?.is_embeddable !== false}
                            className="rounded"
                        />
                        <div>
                            <label className="text-sm font-medium cursor-pointer" htmlFor="isEmbeddable">
                                Permitir incrustar en otras webs
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Los usuarios podrán copiar un código para embeber este evento en cualquier sitio web
                            </p>
                        </div>
                    </div>

                    {/* Direct Public Link & Embed Code (only shows when editing existing event) */}
                    {initialData && eventId && (
                        <div className="border rounded-xl p-4 bg-muted/20 space-y-4">
                            {/* Direct Link */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                                    <Link2 className="h-3.5 w-3.5" />
                                    Enlace público del evento
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        readOnly
                                        value={typeof window !== 'undefined' ? `${window.location.origin}/events/${eventId}` : `/events/${eventId}`}
                                        className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = typeof window !== 'undefined' ? `${window.location.origin}/events/${eventId}` : ''
                                            navigator.clipboard.writeText(url)
                                        }}
                                        className="px-3 py-2 border rounded-lg hover:bg-muted transition-colors text-sm flex items-center gap-1.5"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        Copiar
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Comparte este enlace para que cualquier persona vea el evento y pueda registrarse o comprarlo
                                </p>
                            </div>

                            {/* Embed Code */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                                    <Code2 className="h-3.5 w-3.5" />
                                    Código para incrustar (Embed)
                                </label>
                                <div className="flex items-center gap-2">
                                    <pre className="flex-1 px-3 py-2 border rounded-lg bg-background text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                                        {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/events/${eventId}/embed" width="400" height="420" frameborder="0" style="border-radius:16px;overflow:hidden;" loading="lazy"></iframe>`}
                                    </pre>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const code = `<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/events/${eventId}/embed" width="400" height="420" frameborder="0" style="border-radius:16px;overflow:hidden;" loading="lazy"></iframe>`
                                            navigator.clipboard.writeText(code)
                                        }}
                                        className="px-3 py-2 border rounded-lg hover:bg-muted transition-colors text-sm flex items-center gap-1.5 flex-shrink-0"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        Copiar
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Pega este código en tu sitio web para mostrar el evento embebido
                                </p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium" htmlFor="ogDescription">
                            Descripción para Redes Sociales
                        </label>
                        <input
                            id="ogDescription"
                            name="ogDescription"
                            type="text"
                            maxLength={160}
                            defaultValue={initialData?.og_description || ''}
                            className="mt-1 w-full px-3 py-2 border rounded-lg bg-background"
                            placeholder="Descripción corta que se muestra al compartir en redes..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Max 160 caracteres. Se muestra en WhatsApp, Facebook, Twitter, etc.
                        </p>
                    </div>
                </div>
            </div>

            {/* Registration Questions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Preguntas de Registro
                    </h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addQuestion}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Pregunta
                    </Button>
                </div>

                {registrationFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-4 text-center">
                        Sin preguntas adicionales. Los usuarios solo necesitarán registrarse.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {registrationFields.map((field) => (
                            <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => updateQuestion(field.id, 'label', e.target.value)}
                                    placeholder="Ej: ¿Empresa?"
                                    className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm"
                                />
                                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateQuestion(field.id, 'required', e.target.checked)}
                                        className="rounded"
                                    />
                                    Obligatorio
                                </label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                                    onClick={() => removeQuestion(field.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Audience */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Audiencia Objetivo
                </h3>
                <div className="grid gap-2">
                    {AUDIENCE_OPTIONS.map((option) => {
                        const isSelected = selectedAudience.includes(option.value)
                        return (
                            <div
                                key={option.value}
                                className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                                    }`}
                                onClick={() => toggleAudience(option.value)}
                            >
                                <div className={`mt-0.5 mr-3 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {isSelected ? <Check className="h-4 w-4" /> : <option.icon className="h-4 w-4" />}
                                </div>
                                <div>
                                    <div className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                                        {option.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {option.description}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? 'Guardar Cambios' : 'Crear Evento')}
                </Button>
            </div>
        </>
    )

    // If embedded (used in a page), render just the form without modal wrapper
    if (isEmbedded) {
        return (
            <form action={handleSubmit} className="space-y-6">
                {formContent}

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mt-4">
                        {error}
                    </div>
                )}
            </form>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose()
            }}
        >
            <div className="min-h-screen py-8 px-4 flex items-center justify-center">
                <Card className="w-full max-w-2xl shadow-2xl bg-card border animate-in fade-in zoom-in-95 duration-200">
                    <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 border-b">
                        <CardTitle>{initialData ? 'Editar Evento' : 'Nuevo Evento'}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={handleClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="max-h-[70vh] overflow-y-auto">
                        <form action={handleSubmit} className="space-y-6 py-4">
                            {formContent}
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mt-4">
                                    {error}
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export function CreateEventButton() {
    const [showForm, setShowForm] = useState(false)

    return (
        <>
            <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Evento
            </Button>
            {showForm && <CreateEventForm onClose={() => setShowForm(false)} />}
        </>
    )
}

export function EditEventButton({ event, userRole }: { event: any, userRole?: string }) {
    const [showForm, setShowForm] = useState(false)

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
            </Button>
            {showForm && <CreateEventForm onClose={() => setShowForm(false)} initialData={event} eventId={event.id} userRole={userRole} />}
        </>
    )
}

export function DeleteEventButton({ eventId }: { eventId: string }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    async function handleDelete() {
        setIsLoading(true)
        const result = await deleteEvent(eventId)
        if (result.success) {
            router.push('/dashboard/events')
            router.refresh()
        } else {
            alert('Error al eliminar evento')
            setIsLoading(false)
        }
    }

    if (showConfirm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Card className="max-w-md w-full mx-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            ¿Eliminar evento?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Esta acción no se puede deshacer. Se eliminarán todos los registros de usuarios asociados.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowConfirm(false)}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sí, eliminar'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Button variant="destructive" size="sm" onClick={() => setShowConfirm(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
        </Button>
    )
}



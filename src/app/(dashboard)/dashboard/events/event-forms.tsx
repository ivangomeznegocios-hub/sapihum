'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { registerForEvent, cancelEventRegistration, createEvent, updateEvent, deleteEvent, duplicateEvent } from './actions'
import { createClient } from '@/lib/supabase/client'
import { getPublicEventPath } from '@/lib/events/public'
import { canManageEventAdvancedSettings, canPublishEvent } from '@/lib/events/permissions'
import { MaterialLinksEditor, type EditableMaterialLink } from '@/components/materials/material-links-editor'
import { EventImageFormUpload } from './event-image-form-upload'
import {
    DEFAULT_SPEAKER_PERCENTAGE_RATE,
    normalizeSpeakerCompensationType,
    normalizeSpeakerCompensationValue,
    type SpeakerCompensationType,
} from '@/lib/earnings/compensation'
import {
    DEFAULT_TIMEZONE,
    formatEventDateTime,
    getEventInputDateValue,
    getEventInputTimeValue,
    zonedDateTimeToUtcIso,
} from '@/lib/timezone'
import { isValidMaterialLinkUrl } from '@/lib/material-links'
import { getMembershipSpecializations } from '@/lib/specializations'
import { Plus, X, Loader2, Check, UserPlus, UserMinus, Users, Pencil, Trash2, AlertTriangle, GripVertical, Copy, Code2, Link2, Calendar, Clock, GraduationCap, Mic2, ChevronDown } from 'lucide-react'
import type { ContentScope, Vertical } from '@/types/database'

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
    speakerOptions?: SpeakerOption[]
    availableVerticals?: Pick<Vertical, 'id' | 'code' | 'name' | 'slug'>[]
    activeVertical?: Pick<Vertical, 'id' | 'code' | 'name' | 'slug'> | null
}

type UISpeakerCompensationType = SpeakerCompensationType | 'percentage_default'

type SpeakerAssignmentState = {
    speakerId: string
    compensationType: UISpeakerCompensationType
    compensationValue: string
}

type SpeakerOption = {
    id: string
    name: string
    avatar: string | null
}

type ProgramEventOption = {
    id: string
    title: string
    startTime: string | null
    status: string | null
}

type ManualSessionInput = {
    id: number
    date: string
    time: string
}

function formatSpeakerCompensationInputValue(
    compensationType: SpeakerCompensationType,
    compensationValue: number | null
) {
    if (compensationType === 'variable' || compensationValue == null) {
        return ''
    }

    if (compensationType === 'percentage') {
        const percentValue = Math.round(compensationValue * 10000) / 100
        return Number.isInteger(percentValue) ? String(percentValue) : String(percentValue)
    }

    return String(compensationValue)
}

function createDefaultSpeakerAssignment(speakerId: string): SpeakerAssignmentState {
    return {
        speakerId,
        compensationType: 'percentage_default',
        compensationValue: '',
    }
}

function mapSpeakerAssignmentFromSource(source: any): SpeakerAssignmentState | null {
    const speakerId = typeof source?.speaker_id === 'string'
        ? source.speaker_id
        : typeof source?.speakerId === 'string'
            ? source.speakerId
            : ''

    if (!speakerId) return null

    const compensationType = normalizeSpeakerCompensationType(source?.compensation_type ?? source?.compensationType)
    const isPercentageDefault = compensationType === 'percentage' && (source?.compensation_value == null && source?.compensationValue == null)

    const compensationValue = normalizeSpeakerCompensationValue(
        compensationType,
        source?.compensation_value ?? source?.compensationValue
    )

    return {
        speakerId,
        compensationType: isPercentageDefault ? 'percentage_default' : compensationType,
        compensationValue: isPercentageDefault ? '' : formatSpeakerCompensationInputValue(compensationType, compensationValue),
    }
}

function getInitialSpeakerAssignments(initialData: any): SpeakerAssignmentState[] {
    const assignmentSources = [
        initialData?.speakers,
        initialData?.event_speakers,
        initialData?.speakerAssignments,
        initialData?.speaker_assignments,
    ]
    const source = assignmentSources.find((items) => Array.isArray(items) && items.length > 0) || []

    return source
        .map((speaker: any) => mapSpeakerAssignmentFromSource(speaker))
        .filter((assignment: SpeakerAssignmentState | null): assignment is SpeakerAssignmentState => Boolean(assignment))
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

const DEFAULT_EVENT_AUDIENCE = ['public']

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

const MEMBERSHIP_SPECIALIZATION_OPTIONS = getMembershipSpecializations().map((specialization) => ({
    value: specialization.code,
    label: specialization.name,
}))

function EditableList({
    label,
    helperText,
    placeholder,
    items,
    onChange,
}: {
    label: string
    helperText?: string
    placeholder: string
    items: { id: number; value: string }[]
    onChange: (items: { id: number; value: string }[]) => void
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">{label}</label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange([...items, { id: Date.now() + Math.random(), value: '' }])}
                >
                    <Plus className="mr-1 h-4 w-4" />
                    Agregar
                </Button>
            </div>
            {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-lg border bg-background p-2">
                        <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <input
                            value={item.value}
                            onChange={(e) => {
                                const next = [...items]
                                next[index] = { ...item, value: e.target.value }
                                onChange(next)
                            }}
                            placeholder={placeholder}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function QuestionList({
    items,
    onChange,
}: {
    items: { id: number; label: string; required: boolean }[]
    onChange: (items: { id: number; label: string; required: boolean }[]) => void
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-medium">Preguntas de registro</h4>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange([...items, { id: Date.now() + Math.random(), label: '', required: false }])}
                >
                    <Plus className="mr-1 h-4 w-4" />
                    Agregar pregunta
                </Button>
            </div>
            {items.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Sin preguntas adicionales. Las personas podran registrarse con un clic.
                </p>
            ) : (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                            <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <input
                                value={item.label}
                                onChange={(e) => {
                                    const next = [...items]
                                    next[index] = { ...item, label: e.target.value }
                                    onChange(next)
                                }}
                                placeholder="Ej: ¿A que area pertenece?"
                                className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                            />
                            <label className="flex items-center gap-2 whitespace-nowrap text-sm">
                                <input
                                    type="checkbox"
                                    checked={item.required}
                                    onChange={(e) => {
                                        const next = [...items]
                                        next[index] = { ...item, required: e.target.checked }
                                        onChange(next)
                                    }}
                                />
                                Obligatoria
                            </label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function SectionCard({
    icon,
    title,
    description,
    children,
}: {
    icon?: React.ReactNode
    title: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
                </div>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {children}
        </section>
    )
}

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hrs}h ${mins}min` : `${hrs} hora${hrs > 1 ? 's' : ''}`
}

function formatInputDate(dateStr?: string | null) {
    return getEventInputDateValue(dateStr, DEFAULT_TIMEZONE)
}

function formatInputTime(dateStr?: string | null) {
    return getEventInputTimeValue(dateStr, DEFAULT_TIMEZONE)
}

function getInitialManualSessions(initialData: any): ManualSessionInput[] {
    const sessions = Array.isArray(initialData?.session_config?.sessions)
        ? initialData.session_config.sessions
        : []

    return sessions.slice(1).map((session: any, index: number) => ({
        id: Date.now() + index,
        date: formatInputDate(session?.start_time),
        time: formatInputTime(session?.start_time),
    }))
}

function normalizeSpeakerOptionProfile(profile: any) {
    return Array.isArray(profile) ? profile[0] : profile
}

function getSpeakerOptionName(profile: any, fallbackName?: string | null) {
    const normalizedFallback = typeof fallbackName === 'string' ? fallbackName.trim() : ''
    return profile?.full_name || normalizedFallback || profile?.email || 'Ponente sin nombre'
}

function detectMeetingPlatform(meetingLink?: string | null) {
    if (!meetingLink) return 'manual'

    const normalizedLink = meetingLink.toLowerCase()
    if (normalizedLink.includes('meet.google.com')) return 'google_meet'
    if (normalizedLink.includes('zoom.us')) return 'zoom'
    if (normalizedLink.includes('jitsi')) return 'jitsi'
    if (normalizedLink.includes('youtube.com') || normalizedLink.includes('youtu.be')) return 'youtube_live'

    return 'manual'
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    upcoming: 'Proximo',
    live: 'En vivo',
    completed: 'Finalizado',
    cancelled: 'Cancelado',
}

export function CreateEventForm({
    onClose,
    isEmbedded = false,
    initialData,
    eventId,
    userRole,
    speakerOptions,
    availableVerticals = [],
    activeVertical = null,
}: CreateEventFormProps) {
    const router = useRouter()
    const canPublish = canPublishEvent(userRole)
    const canUseAdvancedSettings = canManageEventAdvancedSettings(userRole)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formEventId] = useState(() => initialData?.id || eventId || crypto.randomUUID())
    const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'general')
    const [selectedSubcategory, setSelectedSubcategory] = useState(initialData?.subcategory || '')
    const [selectedStatus, setSelectedStatus] = useState(initialData?.status || 'draft')
    const [eventType, setEventType] = useState(initialData?.event_type || 'live')
    const [memberAccessType, setMemberAccessType] = useState(initialData?.member_access_type || 'free')
    const [priceValue, setPriceValue] = useState(String(initialData?.price ?? 0))
    const [selectedSpecializationCode, setSelectedSpecializationCode] = useState(
        canUseAdvancedSettings ? initialData?.specialization_code || '' : ''
    )
    const [memberPriceValue, setMemberPriceValue] = useState(
        initialData?.member_price ? String(initialData.member_price) : ''
    )
    const [maxAttendeesValue, setMaxAttendeesValue] = useState(
        initialData?.max_attendees ? String(initialData.max_attendees) : ''
    )
    const [titleValue, setTitleValue] = useState(initialData?.title || '')
    const [subtitleValue, setSubtitleValue] = useState(initialData?.subtitle || '')
    const [dateValue, setDateValue] = useState(formatInputDate(initialData?.start_time))
    const [timeValue, setTimeValue] = useState(formatInputTime(initialData?.start_time))
    const fallbackPrimaryVerticalId =
        initialData?.primary_vertical_id ||
        activeVertical?.id ||
        availableVerticals[0]?.id ||
        ''
    const [contentScopeValue, setContentScopeValue] = useState<ContentScope>(initialData?.content_scope || 'vertical')
    const [primaryVerticalIdValue, setPrimaryVerticalIdValue] = useState(fallbackPrimaryVerticalId)
    const [relatedVerticalIds, setRelatedVerticalIds] = useState<string[]>(
        initialData?.related_vertical_ids?.length
            ? initialData.related_vertical_ids
            : fallbackPrimaryVerticalId
                ? [fallbackPrimaryVerticalId]
                : []
    )

    // Session configuration state
    const [totalSessions, setTotalSessions] = useState(initialData?.session_config?.total_sessions || 1)
    const [sessionDuration, setSessionDuration] = useState(initialData?.session_config?.session_duration_minutes || 60)
    const [recurrence, setRecurrence] = useState(initialData?.session_config?.recurrence || 'none')
    const [openAgendaMode, setOpenAgendaMode] = useState(Boolean(initialData?.session_config?.open_agenda))
    const [programMode, setProgramMode] = useState<'individual' | 'program'>(
        canUseAdvancedSettings && initialData?.program_mode === 'program' ? 'program' : 'individual'
    )
    const [programName, setProgramName] = useState(initialData?.program_name || '')
    const [programTypeLabel, setProgramTypeLabel] = useState(initialData?.program_type_label || '')
    const [programEventOptions, setProgramEventOptions] = useState<ProgramEventOption[]>([])
    const [selectedProgramChildIds, setSelectedProgramChildIds] = useState<string[]>(
        Array.isArray(initialData?.program_child_event_ids) ? initialData.program_child_event_ids : []
    )
    const [loadingProgramEvents, setLoadingProgramEvents] = useState(canUseAdvancedSettings)
    const [manualSessions, setManualSessions] = useState<ManualSessionInput[]>(() => getInitialManualSessions(initialData))
    const [modality, setModality] = useState(
        initialData?.session_config?.modality || (initialData?.event_type === 'presencial' ? 'presencial' : 'online')
    )
    const [meetingPlatform, setMeetingPlatform] = useState(detectMeetingPlatform(initialData?.meeting_link))
    const [locationValue, setLocationValue] = useState(
        initialData?.session_config?.location || initialData?.location || ''
    )
    const [showLandingDetails, setShowLandingDetails] = useState(
        Boolean(
            initialData?.ideal_for?.length ||
            initialData?.learning_outcomes?.length ||
            initialData?.included_resources?.length ||
            initialData?.material_links?.length ||
            initialData?.certificate_type ||
            initialData?.formation_track
        )
    )
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(
        Boolean(
            initialData?.slug ||
            initialData?.og_description ||
            initialData?.seo_title ||
            initialData?.seo_description ||
            initialData?.hero_badge ||
            initialData?.public_cta_label
        )
    )
    const [isEmbeddable, setIsEmbeddable] = useState(initialData?.is_embeddable !== false)

    // Computed session summary
    const totalHours = (totalSessions * sessionDuration) / 60
    const sessionSummary = totalSessions === 1
        ? `Evento único de ${formatDuration(sessionDuration)}`
        : `${totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)} horas total · ${totalSessions} sesiones de ${formatDuration(sessionDuration)}${recurrence !== 'none' ? ` · ${RECURRENCE_OPTIONS.find(r => r.value === recurrence)?.label}` : ''}`

    const summaryDateTime = useMemo(() => {
        if (!dateValue || !timeValue) return null
        return zonedDateTimeToUtcIso(dateValue, timeValue, DEFAULT_TIMEZONE)
    }, [dateValue, timeValue])
    const normalizedAudience = DEFAULT_EVENT_AUDIENCE
    const statusPreview = canPublish ? selectedStatus : 'draft'
    const numericPrice = Number.parseFloat(priceValue || '0') || 0
    const numericMemberPrice = Number.parseFloat(memberPriceValue || '0') || 0
    const selectedSpecializationLabel =
        MEMBERSHIP_SPECIALIZATION_OPTIONS.find((option) => option.value === selectedSpecializationCode)?.label ?? null
    const imageSignatureEndpoint = initialData && eventId
        ? `/api/events/${eventId}/image-upload-signature`
        : '/api/events/new/image-upload-signature'

    // Speakers selection
    const initialSpeakerAssignments = useMemo(() => getInitialSpeakerAssignments(initialData), [initialData])
    const [availableSpeakers, setAvailableSpeakers] = useState<SpeakerOption[]>(speakerOptions ?? [])
    const [selectedSpeakerAssignments, setSelectedSpeakerAssignments] = useState<SpeakerAssignmentState[]>(
        initialSpeakerAssignments
    )
    const [loadingSpeakers, setLoadingSpeakers] = useState(speakerOptions === undefined)
    const selectedSpeakerIds = selectedSpeakerAssignments.map((assignment) => assignment.speakerId)

    // Use a counter ref to generate stable unique IDs
    const questionIdCounter = useRef(0)
    const listIdCounter = useRef(0)

    // Initialize registration fields with unique IDs
    const [registrationFields, setRegistrationFields] = useState<{ id: number; label: string; required: boolean }[]>(
        (initialData?.registration_fields || []).map((f: any) => ({ ...f, id: questionIdCounter.current++ }))
    )

    useEffect(() => {
        setManualSessions((current) => {
            const desiredCount = Math.max(0, totalSessions - 1)

            if (current.length === desiredCount) {
                return current
            }

            if (current.length > desiredCount) {
                return current.slice(0, desiredCount)
            }

            const additions = Array.from({ length: desiredCount - current.length }, (_, index) => ({
                id: Date.now() + current.length + index,
                date: '',
                time: timeValue,
            }))

            return [...current, ...additions]
        })
    }, [totalSessions, timeValue])
    const [idealForItems, setIdealForItems] = useState<{ id: number; value: string }[]>(
        (initialData?.ideal_for || []).map((value: string) => ({ id: listIdCounter.current++, value }))
    )
    const [learningOutcomeItems, setLearningOutcomeItems] = useState<{ id: number; value: string }[]>(
        (initialData?.learning_outcomes || []).map((value: string) => ({ id: listIdCounter.current++, value }))
    )
    const [includedResourceItems, setIncludedResourceItems] = useState<{ id: number; value: string }[]>(
        (initialData?.included_resources || []).map((value: string) => ({ id: listIdCounter.current++, value }))
    )
    const [materialLinkItems, setMaterialLinkItems] = useState<EditableMaterialLink[]>(
        (initialData?.material_links || []).map((item: any, index: number) => ({
            id: typeof item?.id === 'string' ? item.id : `material-${index}`,
            title: typeof item?.title === 'string' ? item.title : '',
            url: typeof item?.url === 'string' ? item.url : '',
            type: item?.type || 'document',
        }))
    )

    const publicPath = initialData?.slug
        ? getPublicEventPath({
            slug: initialData.slug,
            event_type: initialData.event_type || 'live',
            status: initialData.status || 'upcoming',
            recording_url: initialData.recording_url || null,
        })
        : null
    const publicUrl = typeof window !== 'undefined' && publicPath ? `${window.location.origin}${publicPath}` : publicPath
    const statusLabel = STATUS_LABELS[statusPreview] || statusPreview
    const isMembersOnlyEvent = normalizedAudience.includes('members') && !normalizedAudience.includes('public')
    const summaryPrice = numericPrice > 0 ? `$${numericPrice.toFixed(0)} MXN` : (isMembersOnlyEvent ? 'Incluido con Membresía' : 'Gratis')
    const summaryAudience = 'Publico General'
    const memberAccessSummary =
        numericPrice <= 0
            ? (isMembersOnlyEvent
                ? 'Este evento es exclusivo para miembros con suscripción activa.'
                : 'Los miembros entran sin costo porque el evento es gratuito.')
            : selectedSpecializationCode
                ? memberAccessType === 'discounted'
                    ? `${selectedSpecializationLabel || 'La especialidad seleccionada'} entra incluida con membresia activa Nivel 2+. Otros miembros pagan $${numericMemberPrice.toFixed(0)} MXN y publico ${summaryPrice}.`
                    : memberAccessType === 'free'
                        ? `${selectedSpecializationLabel || 'La especialidad seleccionada'} entra incluida con membresia activa Nivel 2+. El resto de miembros tambien entra sin costo y publico paga ${summaryPrice}.`
                        : `${selectedSpecializationLabel || 'La especialidad seleccionada'} entra incluida con membresia activa Nivel 2+. Otros miembros y publico pagan ${summaryPrice}.`
            : memberAccessType === 'discounted'
                ? `Miembros pagan $${numericMemberPrice.toFixed(0)} MXN.`
                : memberAccessType === 'full_price'
                    ? 'Miembros pagan el mismo precio general.'
                    : 'Miembros entran sin costo.'

    // Fetch available speakers
    useEffect(() => {
        let ignore = false

        async function fetchSpeakers() {
            const supabase = createClient()
            setLoadingSpeakers(speakerOptions === undefined)

            const [speakerResponse, selectedSpeakerResponse] = await Promise.all([
                speakerOptions !== undefined
                    ? Promise.resolve({ data: null, error: null })
                    : supabase
                        .from('speakers')
                        .select(`
                            id,
                            headline,
                            photo_url,
                            profile:profiles ( full_name, avatar_url, email )
                        `),
                eventId && initialSpeakerAssignments.length === 0
                    ? supabase
                        .from('event_speakers')
                        .select('speaker_id, compensation_type, compensation_value')
                        .eq('event_id', eventId)
                        .order('display_order', { ascending: true })
                    : Promise.resolve({ data: [], error: null }),
            ])

            if (ignore) return

            if (speakerOptions !== undefined) {
                setAvailableSpeakers(speakerOptions)
            } else if (!speakerResponse.error && speakerResponse.data) {
                setAvailableSpeakers(speakerResponse.data.map((s: any) => {
                    const profile = normalizeSpeakerOptionProfile(s.profile)

                    return {
                        id: s.id,
                        name: getSpeakerOptionName(profile, s.headline),
                        avatar: s.photo_url || profile?.avatar_url || null
                    }
                }))
            }

            if (selectedSpeakerResponse.data) {
                const fetchedAssignments = selectedSpeakerResponse.data
                    .map((row: any) => mapSpeakerAssignmentFromSource(row))
                    .filter((assignment: SpeakerAssignmentState | null): assignment is SpeakerAssignmentState => Boolean(assignment))

                if (fetchedAssignments.length > 0) {
                    setSelectedSpeakerAssignments((current) => (
                        current.length > 0 ? current : fetchedAssignments
                    ))
                }
            }

            setLoadingSpeakers(false)
        }
        fetchSpeakers()

        return () => {
            ignore = true
        }
    }, [eventId, initialSpeakerAssignments, speakerOptions])

    useEffect(() => {
        if (!canUseAdvancedSettings) return
        let ignore = false

        async function fetchProgramEvents() {
            setLoadingProgramEvents(true)
            const supabase = createClient()
            const { data, error } = await (supabase
                .from('events') as any)
                .select('id, title, start_time, status')
                .in('status', ['draft', 'upcoming', 'live', 'completed'])
                .order('start_time', { ascending: false })
                .limit(200)

            if (!ignore && !error) {
                setProgramEventOptions((data ?? [])
                    .filter((event: any) => event.id !== eventId)
                    .map((event: any) => ({
                        id: event.id,
                        title: event.title || 'Evento sin titulo',
                        startTime: event.start_time || null,
                        status: event.status || null,
                    })))
            }

            if (!ignore) {
                setLoadingProgramEvents(false)
            }
        }

        fetchProgramEvents()

        return () => {
            ignore = true
        }
    }, [canUseAdvancedSettings, eventId])

    function toggleSpeaker(speakerId: string) {
        setSelectedSpeakerAssignments(prev => {
            const alreadySelected = prev.some((assignment) => assignment.speakerId === speakerId)

            if (alreadySelected) {
                return prev.filter((assignment) => assignment.speakerId !== speakerId)
            }

            return [...prev, createDefaultSpeakerAssignment(speakerId)]
        })
    }

    function selectAllSpeakers() {
        setSelectedSpeakerAssignments((current) => {
            const currentById = new Map(current.map((assignment) => [assignment.speakerId, assignment]))
            return availableSpeakers.map((speaker) => currentById.get(speaker.id) ?? createDefaultSpeakerAssignment(speaker.id))
        })
    }

    function clearSpeakers() {
        setSelectedSpeakerAssignments([])
    }

    function toggleProgramChildEvent(eventId: string) {
        setSelectedProgramChildIds((current) => (
            current.includes(eventId)
                ? current.filter((id) => id !== eventId)
                : [...current, eventId]
        ))
    }

    function formatProgramEventDate(value: string | null) {
        if (!value) return 'Sin fecha'
        return formatEventDateTime(value, DEFAULT_TIMEZONE)
    }

    function addDaysToInputDate(value: string, days: number) {
        const [year, month, day] = value.split('-').map(Number)
        if (!year || !month || !day) return ''

        const date = new Date(Date.UTC(year, month - 1, day + days))
        return date.toISOString().slice(0, 10)
    }

    function fillConsecutiveManualSessions() {
        if (!dateValue) {
            setError('Primero elige la fecha principal.')
            return
        }

        setManualSessions((current) => current.map((session, index) => ({
            ...session,
            date: addDaysToInputDate(dateValue, index + 1),
            time: session.time || timeValue,
        })))
    }

    function updatePrimaryVertical(nextVerticalId: string) {
        setPrimaryVerticalIdValue(nextVerticalId)
        setRelatedVerticalIds((current) => Array.from(new Set([nextVerticalId, ...current.filter(Boolean)])))
    }

    function toggleRelatedVertical(verticalId: string) {
        setRelatedVerticalIds((current) => {
            if (verticalId === primaryVerticalIdValue) {
                return Array.from(new Set([primaryVerticalIdValue, ...current]))
            }

            return current.includes(verticalId)
                ? current.filter((id) => id !== verticalId)
                : [...current, verticalId]
        })
    }

    function updateSpeakerAssignment(
        speakerId: string,
        updates: Partial<SpeakerAssignmentState>
    ) {
        setSelectedSpeakerAssignments((prev) => prev.map((assignment) => {
            if (assignment.speakerId !== speakerId) {
                return assignment
            }

            return {
                ...assignment,
                ...updates,
            }
        }))
    }

    function updateSpeakerCompensationType(speakerId: string, nextType: UISpeakerCompensationType) {
        setSelectedSpeakerAssignments((prev) => prev.map((assignment) => {
            if (assignment.speakerId !== speakerId) {
                return assignment
            }

            const nextValue =
                nextType === 'percentage'
                    ? assignment.compensationType === 'percentage' && assignment.compensationValue.trim()
                        ? assignment.compensationValue
                        : String(DEFAULT_SPEAKER_PERCENTAGE_RATE * 100)
                    : nextType === 'fixed'
                        ? assignment.compensationType === 'fixed'
                            ? assignment.compensationValue
                            : ''
                        : ''

            return {
                ...assignment,
                compensationType: nextType,
                compensationValue: nextValue,
            }
        }))
    }

    function createEditableItem(value = '') {
        return { id: listIdCounter.current++, value }
    }

    function toggleLandingSection() {
        if (!showLandingDetails) {
            if (idealForItems.length === 0) setIdealForItems([createEditableItem()])
            if (learningOutcomeItems.length === 0) setLearningOutcomeItems([createEditableItem()])
            if (includedResourceItems.length === 0) setIncludedResourceItems([createEditableItem()])
            if (materialLinkItems.length === 0) {
                setMaterialLinkItems([{
                    id: crypto.randomUUID(),
                    title: '',
                    url: '',
                    type: 'document',
                }])
            }
        }

        setShowLandingDetails((current) => !current)
    }

    function copyToClipboard(value: string) {
        if (!value) return
        navigator.clipboard.writeText(value)
    }

    function renderSpeakerPicker() {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h4 className="text-sm font-medium">Ponentes del evento</h4>
                        <p className="text-xs text-muted-foreground">
                            Elige quienes apareceran vinculados a la pagina publica del evento.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {availableSpeakers.length > 0 && (
                            <>
                                <Button type="button" variant="outline" size="sm" onClick={selectAllSpeakers}>
                                    Seleccionar todos
                                </Button>
                                {selectedSpeakerAssignments.length > 0 && (
                                    <Button type="button" variant="ghost" size="sm" onClick={clearSpeakers}>
                                        Limpiar
                                    </Button>
                                )}
                            </>
                        )}
                        <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            {selectedSpeakerAssignments.length} seleccionados
                        </div>
                    </div>
                </div>

                <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border bg-muted/10 p-4">
                    {loadingSpeakers ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground opacity-50" />
                        </div>
                    ) : availableSpeakers.length > 0 ? (
                        <div className="grid gap-2 md:grid-cols-2">
                            {availableSpeakers.map((speaker) => {
                                const isSelected = selectedSpeakerIds.includes(speaker.id)

                                return (
                                    <button
                                        key={speaker.id}
                                        type="button"
                                        onClick={() => toggleSpeaker(speaker.id)}
                                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-transparent hover:bg-muted/50'
                                            }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            {speaker.avatar ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={speaker.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                                            ) : (
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                    {speaker.name.charAt(0)}
                                                </div>
                                            )}
                                            {isSelected && (
                                                <span className="absolute -bottom-1 -right-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                                                    <Check className="h-3 w-3" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`truncate text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                                                {speaker.name}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="py-3 text-center text-sm text-muted-foreground">
                            No hay ponentes disponibles en la plataforma.
                        </p>
                    )}
                </div>

                {canUseAdvancedSettings && selectedSpeakerAssignments.length > 0 && (
                    <div className="space-y-3 rounded-xl border bg-background p-4">
                        <div>
                            <h4 className="text-sm font-medium">Pago por ponente</h4>
                            <p className="text-xs text-muted-foreground">
                                Aqui defines cuanto le toca a cada ponente especificamente para este evento.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {selectedSpeakerAssignments.map((assignment, index) => {
                                const speaker = availableSpeakers.find((item) => item.id === assignment.speakerId)
                                const valueLabel = assignment.compensationType === 'percentage'
                                    ? 'Porcentaje del precio'
                                    : 'Monto fijo por venta (MXN)'

                                const helperText = assignment.compensationType === 'percentage'
                                    ? 'Ejemplo: 50 significa que al ponente le toca el 50% de cada compra.'
                                    : 'Ejemplo: 250 significa que al ponente le tocan $250 MXN por cada compra confirmada.'

                                return (
                                    <div key={assignment.speakerId} className="space-y-3 rounded-xl border bg-muted/10 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-medium">{speaker?.name || 'Ponente seleccionado'}</p>
                                                <p className="text-xs text-muted-foreground">Orden del evento: {index + 1}</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                                            <div>
                                                <label className="text-sm font-medium">Esquema de pago</label>
                                                <select
                                                    value={assignment.compensationType}
                                                    onChange={(e) => updateSpeakerCompensationType(
                                                        assignment.speakerId,
                                                        e.target.value as UISpeakerCompensationType
                                                    )}
                                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                                >
                                                    <option value="percentage_default">% predeterminado del ponente</option>
                                                    <option value="percentage">% personalizado</option>
                                                    <option value="fixed">Monto fijo por venta</option>
                                                    <option value="variable">Variable / manual</option>
                                                </select>
                                            </div>

                                            {assignment.compensationType === 'variable' ? (
                                                <div className="rounded-xl border border-brand-blue bg-brand-blue p-4 text-sm text-brand-blue">
                                                    Este esquema no genera la ganancia automaticamente. Se deja para ajuste manual despues.
                                                </div>
                                            ) : assignment.compensationType === 'percentage_default' ? (
                                                <div className="rounded-xl border border-muted bg-muted/20 p-4 text-sm text-muted-foreground">
                                                    Se calculará automáticamente usando la tasa configurada en el perfil de este ponente (o en su defecto el 20%).
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="text-sm font-medium">{valueLabel}</label>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step={assignment.compensationType === 'percentage' ? '0.01' : '1'}
                                                            value={assignment.compensationValue}
                                                            onChange={(e) => updateSpeakerAssignment(assignment.speakerId, {
                                                                compensationValue: e.target.value,
                                                            })}
                                                            className="w-full rounded-lg border bg-background px-3 py-2"
                                                            placeholder={assignment.compensationType === 'percentage' ? '50' : '250'}
                                                        />
                                                        <span className="text-xs text-muted-foreground">
                                                            {assignment.compensationType === 'percentage' ? '%' : 'MXN'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    function renderProgramSettings() {
        if (!canUseAdvancedSettings) return null

        return (
            <SectionCard
                icon={<Calendar className="h-4 w-4 text-primary" />}
                title="Programacion"
                description="Agrupa varios eventos bajo una pagina padre cuando quieras crear un foro, congreso, ciclo mensual o cualquier experiencia especial."
            >
                <div className="grid gap-3 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setProgramMode('individual')}
                        className={`rounded-xl border p-4 text-left transition-colors ${programMode === 'individual' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                    >
                        <p className="text-sm font-medium">Evento individual</p>
                        <p className="mt-1 text-xs text-muted-foreground">Un evento normal con su propia pagina, acceso y materiales.</p>
                    </button>
                    <button
                        type="button"
                        onClick={() => setProgramMode('program')}
                        className={`rounded-xl border p-4 text-left transition-colors ${programMode === 'program' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                    >
                        <p className="text-sm font-medium">Programacion</p>
                        <p className="mt-1 text-xs text-muted-foreground">Un evento padre que agrupa varias actividades y puede venderse como paquete.</p>
                    </button>
                </div>

                {programMode === 'program' && (
                    <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium" htmlFor="programName">
                                    Nombre de la programacion
                                </label>
                                <input
                                    id="programName"
                                    name="programName"
                                    type="text"
                                    value={programName}
                                    onChange={(e) => setProgramName(e.target.value)}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                    placeholder="Ej: Foro mensual de psicologia clinica"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium" htmlFor="programTypeLabel">
                                    Tipo visible
                                </label>
                                <input
                                    id="programTypeLabel"
                                    name="programTypeLabel"
                                    type="text"
                                    value={programTypeLabel}
                                    onChange={(e) => setProgramTypeLabel(e.target.value)}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                    placeholder="Ej: Foro, Congreso, Ciclo mensual"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-sm font-medium">Eventos incluidos</h4>
                                    <p className="text-xs text-muted-foreground">
                                        El acceso a esta programacion dara acceso a los eventos que selecciones aqui.
                                    </p>
                                </div>
                                <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                    {selectedProgramChildIds.length} incluidos
                                </div>
                            </div>

                            <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border bg-background p-3">
                                {loadingProgramEvents ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground opacity-50" />
                                    </div>
                                ) : programEventOptions.length > 0 ? (
                                    programEventOptions.map((eventOption) => {
                                        const selected = selectedProgramChildIds.includes(eventOption.id)
                                        return (
                                            <button
                                                key={eventOption.id}
                                                type="button"
                                                onClick={() => toggleProgramChildEvent(eventOption.id)}
                                                className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${selected ? 'border-primary bg-primary/5 text-primary' : 'border-transparent hover:bg-muted/50'}`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{eventOption.title}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {formatProgramEventDate(eventOption.startTime)} · {STATUS_LABELS[eventOption.status || ''] || eventOption.status || 'Sin estado'}
                                                    </p>
                                                </div>
                                                {selected && <Check className="h-4 w-4 shrink-0" />}
                                            </button>
                                        )
                                    })
                                ) : (
                                    <p className="py-3 text-center text-sm text-muted-foreground">
                                        No hay eventos disponibles para vincular.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </SectionCard>
        )
    }

    function renderAdvancedSettings() {
        if (!canUseAdvancedSettings) return null

        const embedCode = publicUrl
            ? `<iframe src="${publicUrl}/embed" width="400" height="420" frameBorder="0" style="border-radius:16px;overflow:hidden;" loading="lazy"></iframe>`
            : ''

        return (
            <SectionCard
                icon={<Code2 className="h-4 w-4 text-primary" />}
                title="Ajustes avanzados"
                description="Solo para administracion. Aqui van URL, textos especiales y opciones de distribucion."
            >
                <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
                    <div>
                        <p className="text-sm font-medium">Mostrar configuracion avanzada</p>
                        <p className="text-xs text-muted-foreground">
                            Si no llenas estos campos, la pagina publica usara sus textos automáticos.
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setShowAdvancedSettings((current) => !current)}>
                        {showAdvancedSettings ? 'Ocultar' : 'Mostrar'}
                        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
                    </Button>
                </div>

                {showAdvancedSettings && (
                    <div className="space-y-4">
                        {availableVerticals.length > 0 && (
                            <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                                <div>
                                    <label className="text-sm font-medium" htmlFor="contentScope">
                                        Alcance por vertical
                                    </label>
                                    <select
                                        id="contentScope"
                                        name="contentScope"
                                        value={contentScopeValue}
                                        onChange={(e) => setContentScopeValue(e.target.value as ContentScope)}
                                        className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                    >
                                        <option value="vertical">Una vertical</option>
                                        <option value="cross_vertical">Compartido entre verticales</option>
                                        <option value="global">Global SAPIHUM</option>
                                    </select>
                                </div>

                                {contentScopeValue !== 'global' && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium" htmlFor="primaryVerticalId">
                                                Vertical principal
                                            </label>
                                            <select
                                                id="primaryVerticalId"
                                                name="primaryVerticalId"
                                                value={primaryVerticalIdValue}
                                                onChange={(e) => updatePrimaryVertical(e.target.value)}
                                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                            >
                                                {availableVerticals.map((vertical) => (
                                                    <option key={vertical.id} value={vertical.id}>
                                                        {vertical.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {contentScopeValue === 'cross_vertical' && (
                                            <div>
                                                <p className="text-sm font-medium">Visible tambien en</p>
                                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                                    {availableVerticals.map((vertical) => {
                                                        const checked = relatedVerticalIds.includes(vertical.id) || vertical.id === primaryVerticalIdValue
                                                        return (
                                                            <label key={vertical.id} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    name="relatedVerticalIds"
                                                                    value={vertical.id}
                                                                    checked={checked}
                                                                    disabled={vertical.id === primaryVerticalIdValue}
                                                                    onChange={() => toggleRelatedVertical(vertical.id)}
                                                                    className="rounded"
                                                                />
                                                                <span>{vertical.name}</span>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium" htmlFor="slug">
                                    URL publica
                                </label>
                                <input
                                    id="slug"
                                    name="slug"
                                    type="text"
                                    defaultValue={initialData?.slug || ''}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-mono"
                                    placeholder="terapia-de-pareja-2026"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Si lo dejas vacio, se genera automaticamente con el titulo.
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium" htmlFor="heroBadge">
                                    Badge publico
                                </label>
                                <input
                                    id="heroBadge"
                                    name="heroBadge"
                                    type="text"
                                    defaultValue={initialData?.hero_badge || ''}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                    placeholder="Ej: Preventa, Cupo limitado, Cohorte 2026"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium" htmlFor="ogDescription">
                                Texto breve para compartir
                            </label>
                            <input
                                id="ogDescription"
                                name="ogDescription"
                                type="text"
                                maxLength={160}
                                defaultValue={initialData?.og_description || ''}
                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                placeholder="Descripcion corta para WhatsApp, Facebook o redes."
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium" htmlFor="seoTitle">
                                    Titulo SEO
                                </label>
                                <input
                                    id="seoTitle"
                                    name="seoTitle"
                                    type="text"
                                    defaultValue={initialData?.seo_title || ''}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                    placeholder="Version larga para buscadores"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium" htmlFor="publicCtaLabel">
                                    CTA principal
                                </label>
                                <input
                                    id="publicCtaLabel"
                                    name="publicCtaLabel"
                                    type="text"
                                    defaultValue={initialData?.public_cta_label || ''}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                    placeholder="Ej: Comprar acceso, Registrarme gratis"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium" htmlFor="seoDescription">
                                Descripcion SEO
                            </label>
                            <textarea
                                id="seoDescription"
                                name="seoDescription"
                                rows={3}
                                defaultValue={initialData?.seo_description || ''}
                                className="mt-1 w-full resize-none rounded-lg border bg-background px-3 py-2"
                                placeholder="Texto canonico para buscadores."
                            />
                        </div>

                        <label className="flex items-start gap-3 rounded-xl border p-4">
                            <input
                                type="checkbox"
                                id="isEmbeddable"
                                name="isEmbeddable"
                                checked={isEmbeddable}
                                onChange={(e) => setIsEmbeddable(e.target.checked)}
                                className="mt-1 rounded"
                            />
                            <div>
                                <span className="text-sm font-medium">Permitir embeber este evento</span>
                                <p className="text-xs text-muted-foreground">
                                    Activalo si quieres compartir un iframe listo para copiar en otras paginas.
                                </p>
                            </div>
                        </label>

                        {initialData && eventId && (
                            <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                                <div>
                                    <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <Link2 className="h-3.5 w-3.5" />
                                        Enlace publico
                                    </label>
                                    <div className="flex flex-col gap-2 md:flex-row">
                                        <input
                                            readOnly
                                            value={publicUrl || 'Guarda el evento para generar la URL publica'}
                                            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm font-mono"
                                        />
                                        <Button type="button" variant="outline" onClick={() => copyToClipboard(publicUrl || '')}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copiar
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <Code2 className="h-3.5 w-3.5" />
                                        Codigo embed
                                    </label>
                                    <div className="flex flex-col gap-2 md:flex-row">
                                        <pre className="flex-1 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border bg-background px-3 py-2 text-xs font-mono">
                                            {embedCode || 'Guarda el evento para generar el iframe.'}
                                        </pre>
                                        <Button type="button" variant="outline" onClick={() => copyToClipboard(embedCode)}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copiar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </SectionCard>
        )
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
        normalizedAudience.forEach(a => formData.append('audience', a))

        // Add registration fields (custom questions) - strip the id before saving
        const validFields = registrationFields
            .filter(f => f.label.trim() !== '')
            .map(({ label, required }) => ({ label, required }))
        formData.set('registrationFields', JSON.stringify(validFields))

        if (totalSessions > 1 && recurrence === 'none') {
            const hasIncompleteSession = manualSessions
                .slice(0, totalSessions - 1)
                .some((session) => !session.date || !session.time)

            if (hasIncompleteSession) {
                setError('Completa la fecha y hora de todas las sesiones manuales.')
                setIsLoading(false)
                return
            }

            formData.set('sessionSchedule', JSON.stringify([
                { date: dateValue, time: timeValue },
                ...manualSessions.slice(0, totalSessions - 1).map((session) => ({
                    date: session.date,
                    time: session.time,
                })),
            ]))
        } else if (totalSessions === 1) {
            formData.set('sessionSchedule', JSON.stringify([{ date: dateValue, time: timeValue }]))
        }

        // Add session configuration
        formData.set('sessionConfig', JSON.stringify({
            total_sessions: totalSessions,
            session_duration_minutes: sessionDuration,
            recurrence: totalSessions > 1 && recurrence !== 'none' ? recurrence : undefined,
            modality,
            open_agenda: canUseAdvancedSettings && openAgendaMode,
            ...(modality === 'presencial' && locationValue.trim() ? { location: locationValue.trim() } : {}),
        }))
        formData.set('duration', String(sessionDuration))
        formData.set('openAgendaMode', canUseAdvancedSettings && openAgendaMode ? 'on' : 'off')

        // Add selected speakers and their payout configuration
        const invalidSpeakerAssignment = selectedSpeakerAssignments.find((assignment) => {
            if (assignment.compensationType === 'variable' || assignment.compensationType === 'percentage_default') {
                return false
            }

            const parsedValue = Number.parseFloat(assignment.compensationValue)
            return !Number.isFinite(parsedValue) || parsedValue <= 0
        })

        if (invalidSpeakerAssignment) {
            setError('Cada ponente con esquema fijo o porcentual personalizado necesita un valor mayor a 0.')
            setIsLoading(false)
            return
        }

        const serializedSpeakerAssignments = selectedSpeakerAssignments.map((assignment) => {
            const normalizedType = assignment.compensationType === 'percentage_default'
                ? 'percentage'
                : normalizeSpeakerCompensationType(assignment.compensationType)
            const parsedValue = Number.parseFloat(assignment.compensationValue)
            
            let normalizedValue: number | null = null;
            if (assignment.compensationType === 'percentage_default' || assignment.compensationType === 'variable') {
                normalizedValue = null
            } else if (assignment.compensationType === 'percentage') {
                normalizedValue = Math.max(0, parsedValue / 100)
            } else {
                normalizedValue = normalizeSpeakerCompensationValue(normalizedType, assignment.compensationValue)
            }

            return {
                speakerId: assignment.speakerId,
                compensationType: normalizedType,
                compensationValue: normalizedValue,
            }
        })

        formData.set('speakerIds', JSON.stringify(selectedSpeakerAssignments.map((assignment) => assignment.speakerId)))
        formData.set('speakerAssignments', JSON.stringify(serializedSpeakerAssignments))
        formData.set('idealFor', JSON.stringify(idealForItems.map((item) => item.value.trim()).filter(Boolean)))
        formData.set('learningOutcomes', JSON.stringify(learningOutcomeItems.map((item) => item.value.trim()).filter(Boolean)))
        formData.set('includedResources', JSON.stringify(includedResourceItems.map((item) => item.value.trim()).filter(Boolean)))
        if (canUseAdvancedSettings) {
            formData.set('specializationCode', selectedSpecializationCode)
            formData.set('programMode', programMode)
            formData.set('programName', programMode === 'program' ? programName.trim() : '')
            formData.set('programTypeLabel', programMode === 'program' ? programTypeLabel.trim() : '')
            formData.set('programChildEventIds', JSON.stringify(programMode === 'program' ? selectedProgramChildIds : []))
        }

        const invalidMaterialLink = materialLinkItems.find((item) => {
            const hasContent = item.title.trim() || item.url.trim()
            if (!hasContent) {
                return false
            }

            return !item.title.trim() || !item.url.trim() || !isValidMaterialLinkUrl(item.url.trim())
        })

        if (invalidMaterialLink) {
            setError('Cada material debe tener nombre y una URL valida que empiece con http o https.')
            setIsLoading(false)
            return
        }

        formData.set('materialLinks', JSON.stringify(
            materialLinkItems
                .map((item) => ({
                    id: item.id,
                    title: item.title.trim(),
                    url: item.url.trim(),
                    type: item.type,
                }))
                .filter((item) => item.title && item.url)
        ))

        if (canUseAdvancedSettings) {
            formData.set('isEmbeddable', isEmbeddable ? 'on' : 'off')
            formData.set('contentScope', contentScopeValue)
            formData.delete('relatedVerticalIds')
            if (contentScopeValue !== 'global') {
                formData.set('primaryVerticalId', primaryVerticalIdValue)
                const nextRelatedIds = contentScopeValue === 'cross_vertical'
                    ? Array.from(new Set([primaryVerticalIdValue, ...relatedVerticalIds]))
                    : [primaryVerticalIdValue]
                nextRelatedIds.filter(Boolean).forEach((verticalId) => {
                    formData.append('relatedVerticalIds', verticalId)
                })
            }
        }

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
            <SectionCard
                icon={<Calendar className="h-4 w-4 text-primary" />}
                title="Datos esenciales"
                description="Primero captura lo minimo para que cualquier ponente o admin pueda publicar un evento coherente."
            >
                <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium" htmlFor="title">
                                Titulo *
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                value={titleValue}
                                onChange={(e) => setTitleValue(e.target.value)}
                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                placeholder="Ej: Masterclass de ansiedad infantil"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium" htmlFor="subtitle">
                                Frase corta para la portada
                            </label>
                            <input
                                id="subtitle"
                                name="subtitle"
                                type="text"
                                value={subtitleValue}
                                onChange={(e) => setSubtitleValue(e.target.value)}
                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                placeholder="Resume en una frase por que vale la pena asistir"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Se muestra debajo del titulo en la landing publica.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium" htmlFor="description">
                                Descripcion
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={5}
                                defaultValue={initialData?.description || ''}
                                className="mt-1 w-full resize-none rounded-lg border bg-background px-3 py-2"
                                placeholder="Explica de que trata, que problema resuelve y por que seria util asistir."
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">
                                Imagen del evento
                            </label>
                            <div className="mt-2">
                                <EventImageFormUpload
                                    eventId={formEventId}
                                    signatureEndpoint={imageSignatureEndpoint}
                                    initialImageUrl={initialData?.image_url || ''}
                                    initialPublicId={initialData?.image_public_id || ''}
                                    initialAltText={initialData?.image_alt_text || ''}
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                En eventos nuevos, la imagen se sube a Cloudinary y queda guardada al crear el evento.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium" htmlFor="category">
                                    Categoria *
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value)
                                        setSelectedSubcategory('')
                                    }}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                >
                                    {CATEGORY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {SUBCATEGORY_OPTIONS[selectedCategory] && (
                                <div>
                                    <label className="text-sm font-medium" htmlFor="subcategory">
                                        Subcategoria
                                    </label>
                                    <select
                                        id="subcategory"
                                        name="subcategory"
                                        value={selectedSubcategory}
                                        onChange={(e) => setSelectedSubcategory(e.target.value)}
                                        className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {SUBCATEGORY_OPTIONS[selectedCategory].map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-dashed bg-muted/20 p-4">
                            <p className="text-sm font-medium">Vista rapida de portada</p>
                            <p className="mt-2 text-base font-semibold">{titleValue || 'Titulo del evento'}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {subtitleValue || 'Tu frase corta aparecera aqui para contextualizar el evento.'}
                            </p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard
                icon={<Clock className="h-4 w-4 text-primary" />}
                title="Fecha y modalidad"
                description="Define cuando ocurre, cuanto dura y si sera presencial, en linea o bajo demanda."
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium" htmlFor="date">
                            Fecha *
                        </label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            required
                            value={dateValue}
                            onChange={(e) => setDateValue(e.target.value)}
                            className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
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
                            value={timeValue}
                            onChange={(e) => setTimeValue(e.target.value)}
                            className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Horario de referencia: CDMX.</p>
                    </div>
                </div>

                {canUseAdvancedSettings && (
                    <label className="flex items-start gap-3 rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-4">
                        <input
                            type="checkbox"
                            checked={openAgendaMode}
                            onChange={(e) => setOpenAgendaMode(e.target.checked)}
                            className="mt-1 rounded"
                        />
                        <div>
                            <span className="text-sm font-medium">Permitir solapes de agenda</span>
                            <p className="text-xs text-muted-foreground">
                                Permite guardar aunque los ponentes ya tengan eventos o calendario ocupado. Usalo solo cuando la programacion tenga muchas participaciones o bloques simultaneos.
                            </p>
                        </div>
                    </label>
                )}

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium" htmlFor="eventType">
                                Tipo de evento
                            </label>
                            <select
                                id="eventType"
                                name="eventType"
                                value={eventType}
                                onChange={(e) => {
                                    const nextType = e.target.value
                                    setEventType(nextType)
                                    setModality(nextType === 'presencial' ? 'presencial' : 'online')
                                }}
                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                            >
                                <option value="live">En vivo</option>
                                <option value="on_demand">Grabado / on demand</option>
                                <option value="course">Curso de varias sesiones</option>
                                <option value="presencial">Presencial</option>
                            </select>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">Numero de sesiones</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={totalSessions}
                                    onChange={(e) => setTotalSessions(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Duracion por sesion</label>
                                <select
                                    value={sessionDuration}
                                    onChange={(e) => setSessionDuration(parseInt(e.target.value, 10))}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                >
                                    {SESSION_DURATION_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {totalSessions > 1 && (
                            <div>
                                <label className="text-sm font-medium">Recurrencia</label>
                                <select
                                    value={recurrence}
                                    onChange={(e) => setRecurrence(e.target.value)}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                >
                                    {RECURRENCE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {totalSessions > 1 && recurrence === 'none' && (
                            <div className="space-y-3 rounded-xl border bg-muted/10 p-4">
                                <div>
                                    <p className="text-sm font-medium">Fechas manuales de sesiones</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        La primera sesion usa la fecha principal de arriba. Agrega aqui las siguientes sesiones.
                                    </p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={fillConsecutiveManualSessions}>
                                    Rellenar dias consecutivos
                                </Button>

                                <div className="space-y-2">
                                    {manualSessions.slice(0, totalSessions - 1).map((session, index) => (
                                        <div key={session.id} className="grid gap-2 rounded-lg border bg-background p-3 sm:grid-cols-[auto_1fr_1fr] sm:items-end">
                                            <div className="text-sm font-medium text-muted-foreground">
                                                Sesion {index + 2}
                                            </div>
                                            <label className="text-sm">
                                                Fecha
                                                <input
                                                    type="date"
                                                    value={session.date}
                                                    onChange={(e) => {
                                                        setManualSessions((current) => current.map((item) => (
                                                            item.id === session.id ? { ...item, date: e.target.value } : item
                                                        )))
                                                    }}
                                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                                />
                                            </label>
                                            <label className="text-sm">
                                                Hora
                                                <input
                                                    type="time"
                                                    value={session.time}
                                                    onChange={(e) => {
                                                        setManualSessions((current) => current.map((item) => (
                                                            item.id === session.id ? { ...item, time: e.target.value } : item
                                                        )))
                                                    }}
                                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border bg-muted/20 p-4">
                            <p className="text-sm font-medium">Resumen de sesiones</p>
                            <p className="mt-2 text-sm text-muted-foreground">{sessionSummary}</p>
                            {summaryDateTime && (
                                <p className="mt-3 text-sm font-medium">
                                    Primera sesion: {formatEventDateTime(summaryDateTime, DEFAULT_TIMEZONE)}
                                </p>
                            )}
                        </div>

                        {eventType === 'presencial' ? (
                            <div>
                                <label className="text-sm font-medium" htmlFor="location">
                                    Ubicacion *
                                </label>
                                <input
                                    id="location"
                                    name="location"
                                    type="text"
                                    value={locationValue}
                                    onChange={(e) => setLocationValue(e.target.value)}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                    placeholder="Ej: Auditorio Central, Reforma 222, CDMX"
                                />
                            </div>
                        ) : (
                            <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
                                <div>
                                    <label className="text-sm font-medium">Plataforma o canal</label>
                                    <select
                                        value={meetingPlatform}
                                        onChange={(e) => setMeetingPlatform(e.target.value)}
                                        className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                    >
                                        {MEETING_PLATFORM_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium" htmlFor="meetingLink">
                                        Enlace de acceso
                                    </label>
                                    <input
                                        id="meetingLink"
                                        name="meetingLink"
                                        type="url"
                                        defaultValue={initialData?.meeting_link || ''}
                                        className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                        placeholder="https://meet.google.com/... o enlace de streaming"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Solo sera visible para las personas con acceso al evento.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <input type="hidden" name="duration" value={String(sessionDuration)} />
            </SectionCard>

            {renderProgramSettings()}

            <SectionCard
                icon={<Users className="h-4 w-4 text-primary" />}
                title="Acceso"
                description=""
            >
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium" htmlFor="price">
                                Precio general (MXN)
                            </label>
                            <input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                value={priceValue}
                                onChange={(e) => setPriceValue(e.target.value)}
                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                El evento siempre queda abierto a Publico General. Si configuras precio preferencial, los miembros deben tener al menos $200 MXN de descuento frente al precio general.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium" htmlFor="maxAttendees">
                                Cupo
                            </label>
                            <input
                                id="maxAttendees"
                                name="maxAttendees"
                                type="number"
                                min="1"
                                value={maxAttendeesValue}
                                onChange={(e) => setMaxAttendeesValue(e.target.value)}
                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                placeholder="Opcional"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Numero maximo de lugares disponibles. Dejalo vacio si no necesitas limitar registros o compras.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium" htmlFor="memberAccessType">
                                {selectedSpecializationCode ? 'Acceso para otros miembros' : 'Acceso para miembros'}
                            </label>
                            <select
                                id="memberAccessType"
                                name="memberAccessType"
                                value={memberAccessType}
                                onChange={(e) => setMemberAccessType(e.target.value)}
                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                            >
                                <option value="free">Gratis para miembros</option>
                                <option value="discounted">Precio preferencial</option>
                                <option value="full_price">Mismo precio</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium" htmlFor="memberPrice">
                                {selectedSpecializationCode ? 'Precio otros miembros (MXN)' : 'Precio miembros (MXN)'}
                            </label>
                            <input
                                id="memberPrice"
                                name="memberPrice"
                                type="number"
                                min="0"
                                value={memberPriceValue}
                                onChange={(e) => setMemberPriceValue(e.target.value)}
                                disabled={memberAccessType !== 'discounted' || numericPrice <= 0}
                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                                placeholder={memberAccessType === 'discounted' && numericPrice > 0 ? 'Ej: 399' : 'Solo aplica con descuento'}
                            />
                        </div>

                        {canUseAdvancedSettings && (
                            <div className="sm:col-span-2">
                                <label className="text-sm font-medium" htmlFor="specializationCode">
                                    Especialidad incluida
                                </label>
                                <select
                                    id="specializationCode"
                                    name="specializationCode"
                                    value={selectedSpecializationCode}
                                    onChange={(e) => setSelectedSpecializationCode(e.target.value)}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                >
                                    <option value="">Sin especialidad asignada</option>
                                    {MEMBERSHIP_SPECIALIZATION_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Si eliges una especialidad, los miembros activos Nivel 2 o superior de esa especialidad entran sin costo. Los demas miembros siguen el ajuste que definas arriba.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
                        <div>
                            <label className="text-sm font-medium" htmlFor="recordingDays">
                                Dias con grabacion disponible
                            </label>
                            <input
                                id="recordingDays"
                                name="recordingDays"
                                type="number"
                                min="7"
                                max="30"
                                defaultValue={initialData?.recording_available_days || '15'}
                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium" htmlFor="recordingUrl">
                                URL de grabacion
                            </label>
                            <input
                                id="recordingUrl"
                                name="recordingUrl"
                                type="url"
                                defaultValue={initialData?.recording_url || ''}
                                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                placeholder="https://youtube.com/... o https://vimeo.com/..."
                            />
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <p className="text-sm font-medium">Resumen comercial</p>
                            <p className="mt-2 text-sm text-muted-foreground">Precio general: {summaryPrice}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{memberAccessSummary}</p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard
                icon={<Mic2 className="h-4 w-4 text-primary" />}
                title="Ponentes y registro"
                description="Relaciona a las personas que impartiran el evento y agrega preguntas extra solo si hacen falta."
            >
                {renderSpeakerPicker()}
                <QuestionList items={registrationFields} onChange={setRegistrationFields} />

                {canPublish && (
                    <div>
                        <label className="text-sm font-medium" htmlFor="status">
                            Estado del evento
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                        >
                            <option value="draft">Borrador</option>
                            <option value="upcoming">Proximo</option>
                            <option value="live">En vivo</option>
                            <option value="completed">Finalizado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                )}

                {!canPublish && (
                    <div className="flex items-start gap-2 rounded-xl border border-brand-blue/30 bg-brand-blue/10 p-4 text-sm text-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-blue-hover" />
                        <p>
                            Al guardar, este evento quedara en <strong>Borrador</strong> para revision administrativa.
                        </p>
                    </div>
                )}
            </SectionCard>

            <SectionCard
                icon={<GraduationCap className="h-4 w-4 text-primary" />}
                title="Landing publica"
                description="Este bloque es opcional y sirve para explicar mejor el valor del evento sin pedir conocimientos tecnicos."
            >
                <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
                    <div>
                        <p className="text-sm font-medium">Agregar detalles para la pagina publica</p>
                        <p className="text-xs text-muted-foreground">
                            Recomendado cuando quieras reforzar a quien va dirigido, que se aprende y que incluye.
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={toggleLandingSection}>
                        {showLandingDetails ? 'Ocultar' : 'Completar'}
                        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showLandingDetails ? 'rotate-180' : ''}`} />
                    </Button>
                </div>

                {showLandingDetails && (
                    <div className="space-y-4">
                        <div className="grid gap-4 lg:grid-cols-3">
                            <EditableList
                                label="Ideal para"
                                helperText="Agrega perfiles de asistentes o situaciones donde este evento aporta valor."
                                placeholder="Ej: Psicologos clinicos que atienden adolescencia"
                                items={idealForItems}
                                onChange={setIdealForItems}
                            />
                            <EditableList
                                label="Que aprenderan"
                                helperText="Describe resultados o habilidades concretas que obtendra la persona."
                                placeholder="Ej: Identificar senales tempranas de ansiedad"
                                items={learningOutcomeItems}
                                onChange={setLearningOutcomeItems}
                            />
                            <EditableList
                                label="Que incluye"
                                helperText="Menciona materiales, bonos o recursos entregables."
                                placeholder="Ej: Plantilla de evaluacion en PDF"
                                items={includedResourceItems}
                                onChange={setIncludedResourceItems}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium" htmlFor="certificateType">
                                    Certificado o constancia
                                </label>
                                <select
                                    id="certificateType"
                                    name="certificateType"
                                    defaultValue={initialData?.certificate_type || 'none'}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                >
                                    <option value="none">Sin certificado</option>
                                    <option value="participation">Constancia de participacion</option>
                                    <option value="completion">Diploma de finalizacion</option>
                                    <option value="specialized">Acreditacion especializada</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium" htmlFor="formationTrack">
                                    Programa o ruta formativa
                                </label>
                                <input
                                    id="formationTrack"
                                    name="formationTrack"
                                    type="text"
                                    defaultValue={initialData?.formation_track || ''}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                                    placeholder="Ej: Diplomado en TCC"
                                />
                            </div>
                        </div>

                        <MaterialLinksEditor
                            items={materialLinkItems}
                            onChange={setMaterialLinkItems}
                            helperText={
                                canUseAdvancedSettings
                                    ? 'Agrega presentaciones, PDFs, carpetas o enlaces externos para que la gente con acceso pueda abrirlos despues.'
                                    : 'Agrega presentaciones, PDFs, carpetas o enlaces externos. Como ponente, el evento quedara en borrador para revision con estos materiales.'
                            }
                            emptyText="Todavia no hay materiales por enlace para este evento."
                        />
                    </div>
                )}
            </SectionCard>

            {renderAdvancedSettings()}

            <SectionCard
                icon={<Check className="h-4 w-4 text-primary" />}
                title="Resumen final"
                description="Antes de guardar, revisa que la publicacion se entienda bien para quien la va a ver."
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border bg-muted/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha y hora</p>
                        <p className="mt-2 text-sm font-medium">
                            {summaryDateTime ? formatEventDateTime(summaryDateTime, DEFAULT_TIMEZONE) : 'Completa fecha y hora'}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-muted/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Visibilidad</p>
                        <p className="mt-2 text-sm font-medium">{summaryAudience}</p>
                    </div>

                    <div className="rounded-xl border bg-muted/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Precio</p>
                        <p className="mt-2 text-sm font-medium">{summaryPrice}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{memberAccessSummary}</p>
                    </div>

                    <div className="rounded-xl border bg-muted/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado al guardar</p>
                        <p className="mt-2 text-sm font-medium">{statusLabel}</p>
                    </div>
                </div>

                <div className="rounded-xl border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                    {canPublish
                        ? 'Puedes guardar y ajustar despues el estado o los metadatos avanzados.'
                        : 'Como ponente, el evento se guardara como borrador y mantendra intactos los ajustes avanzados existentes.'}
                </div>

                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? 'Guardar cambios' : 'Crear evento')}
                    </Button>
                </div>
            </SectionCard>
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
                <Card className="w-full max-w-5xl shadow-2xl bg-card border animate-in fade-in zoom-in-95 duration-200">
                    <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 border-b">
                        <CardTitle>{initialData ? 'Editar Evento' : 'Nuevo Evento'}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={handleClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="max-h-[80vh] overflow-y-auto">
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

export function CreateEventButton({
    speakerOptions,
    availableVerticals,
    activeVertical,
}: {
    speakerOptions?: SpeakerOption[]
    availableVerticals?: Pick<Vertical, 'id' | 'code' | 'name' | 'slug'>[]
    activeVertical?: Pick<Vertical, 'id' | 'code' | 'name' | 'slug'> | null
} = {}) {
    const [showForm, setShowForm] = useState(false)

    return (
        <>
            <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Evento
            </Button>
            {showForm && (
                <CreateEventForm
                    onClose={() => setShowForm(false)}
                    speakerOptions={speakerOptions}
                    availableVerticals={availableVerticals}
                    activeVertical={activeVertical}
                />
            )}
        </>
    )
}

export function EditEventButton({
    event,
    userRole,
    speakerOptions,
    availableVerticals,
}: {
    event: any
    userRole?: string
    speakerOptions?: SpeakerOption[]
    availableVerticals?: Pick<Vertical, 'id' | 'code' | 'name' | 'slug'>[]
}) {
    const [showForm, setShowForm] = useState(false)

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
            </Button>
            {showForm && (
                <CreateEventForm
                    onClose={() => setShowForm(false)}
                    initialData={event}
                    eventId={event.id}
                    userRole={userRole}
                    speakerOptions={speakerOptions}
                    availableVerticals={availableVerticals}
                />
            )}
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

export function DuplicateEventButton({ eventId }: { eventId: string }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function handleDuplicate() {
        setIsLoading(true)
        const result = await duplicateEvent(eventId)

        if (result.success && result.eventId) {
            router.push(`/dashboard/events/${result.eventId}`)
            return
        }

        alert(result.error || 'Error al duplicar evento')
        setIsLoading(false)
    }

    return (
        <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
            Duplicar
        </Button>
    )
}





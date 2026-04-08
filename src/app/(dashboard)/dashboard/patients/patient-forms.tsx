'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    addPatient,
    removePatient,
    addClinicalNote,
    updateClinicalNote,
    deleteClinicalNote,
    togglePinNote,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    saveSessionSummary,
} from './actions'
import {
    Plus, X, Loader2, UserPlus, FileText, Trash2, Edit2,
    CheckCircle2, AlertCircle, Pin, PinOff, Upload, Download,
    File, Tag, Calendar, Star, Paperclip, User, Mail, Phone
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

// ============================================
// ADD PATIENT (Dual mode: with email or name-only)
// ============================================
interface AddPatientFormProps {
    onClose: () => void
}

export function AddPatientForm({ onClose }: AddPatientFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [mode, setMode] = useState<'email' | 'local'>('local')

    async function handleSubmit(formData: FormData) {
        setError(null)
        setSuccess(null)
        setIsLoading(true)
        try {
            const result = await addPatient(formData)
            if (result.error) {
                setError(result.error)
            } else if (result.success) {
                setSuccess(typeof result.success === 'string' ? result.success : 'Operación exitosa')
                setTimeout(() => onClose(), 2000)
            }
        } catch {
            setError('Ocurrió un error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200 border-border/80 shadow-2xl">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Agregar Paciente
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="self-end sm:self-auto">
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Mode Tabs */}
                    <div className="grid w-full grid-cols-2 h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4">
                        <button
                            type="button"
                            onClick={() => setMode('local')}
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${mode === 'local' ? 'bg-background text-foreground shadow-sm' : ''}`}
                        >
                            <User className="mr-1.5 h-3.5 w-3.5" />
                            Sin correo
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('email')}
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${mode === 'email' ? 'bg-background text-foreground shadow-sm' : ''}`}
                        >
                            <Mail className="mr-1.5 h-3.5 w-3.5" />
                            Con correo
                        </button>
                    </div>

                    <form action={handleSubmit} className="space-y-4">
                        {mode === 'local' ? (
                            <>
                                {/* Name - Required */}
                                <div className="space-y-2">
                                    <label htmlFor="fullName" className="text-sm font-medium">
                                        Nombre completo *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="fullName"
                                            name="fullName"
                                            placeholder="Nombre del paciente"
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Phone - Optional */}
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium">
                                        Teléfono <span className="text-muted-foreground text-xs">(opcional)</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="55 1234 5678"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md">
                                    💡 <strong>Paciente local:</strong> Se crea un registro interno sin necesidad de correo electrónico. Ideal para pacientes que no necesitan acceso a la plataforma.
                                </p>
                            </>
                        ) : (
                            <>
                                {/* Email - Required in this mode */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Correo Electrónico *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="paciente@ejemplo.com"
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Name - Optional in this mode */}
                                <div className="space-y-2">
                                    <label htmlFor="fullNameEmail" className="text-sm font-medium">
                                        Nombre <span className="text-muted-foreground text-xs">(opcional)</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="fullNameEmail"
                                            name="fullName"
                                            placeholder="Nombre del paciente"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md">
                                    📧 <strong>Con invitación:</strong> Si no está registrado, se le enviará una invitación para que pueda acceder a la plataforma, ver sus citas y recursos.
                                </p>
                            </>
                        )}

                        {success && (
                            <div className="p-3 rounded-lg text-sm surface-alert-success flex items-center gap-2 animate-in fade-in">
                                <CheckCircle2 className="h-4 w-4" />
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="p-3 rounded-lg text-sm surface-alert-error flex items-center gap-2 animate-in fade-in">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-2 justify-end mt-4 sm:flex-row">
                            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</> : 'Agregar Paciente'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export function AddPatientButton() {
    const [showForm, setShowForm] = useState(false)
    return (
        <>
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Agregar Paciente
            </Button>
            {showForm && <AddPatientForm onClose={() => setShowForm(false)} />}
        </>
    )
}

interface RemovePatientButtonProps {
    patientId: string
    patientName: string
}

export function RemovePatientButton({ patientId, patientName }: RemovePatientButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleRemove() {
        if (!confirm(`¿Estás seguro de remover a ${patientName} de tus pacientes?`)) return
        setIsLoading(true)
        await removePatient(patientId)
        setIsLoading(false)
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleRemove} disabled={isLoading} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}

// ============================================
// CLINICAL NOTE FORM (Enhanced with Tags)
// ============================================
interface ClinicalNoteFormProps {
    patientId: string
    note?: any
    appointments?: any[]
    onClose: () => void
}

export function ClinicalNoteForm({ patientId, note, appointments, onClose }: ClinicalNoteFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [format, setFormat] = useState<'simple' | 'soap'>(
        note?.content?.subjective && note?.content?.assessment ? 'soap' : 'simple'
    )
    const [tags, setTags] = useState<string[]>(note?.tags || [])
    const [tagInput, setTagInput] = useState('')

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase()
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag])
        }
        setTagInput('')
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove))
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)
        formData.append('format', format)
        formData.append('tags', tags.join(','))
        if (note) {
            formData.append('noteId', note.id)
        }

        const result = note
            ? await updateClinicalNote(formData)
            : await addClinicalNote(formData)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            onClose()
        }
    }

    const suggestedTags = ['ansiedad', 'depresión', 'trauma', 'familia', 'pareja', 'duelo', 'autoestima', 'estrés', 'crisis', 'seguimiento']

    return (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl my-8 border-border/80 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {note ? 'Editar Nota Clínica' : 'Nueva Nota Clínica'}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <input type="hidden" name="patientId" value={patientId} />

                        {/* Type + Format row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium" htmlFor="type">Tipo de nota</label>
                                <select
                                    name="type"
                                    defaultValue={note?.type || 'session_note'}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="session_note">Nota de sesión</option>
                                    <option value="assessment">Evaluación</option>
                                    <option value="treatment_plan">Plan de tratamiento</option>
                                    <option value="progress_note">Nota de progreso</option>
                                    <option value="intake">Nota de ingreso</option>
                                    <option value="discharge">Nota de alta</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Formato</label>
                                <div className="grid w-full grid-cols-2 h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                                    <button
                                        type="button"
                                        onClick={() => setFormat('simple')}
                                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${format === 'simple' ? 'bg-background text-foreground shadow-sm' : ''}`}
                                    >
                                        Simple
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormat('soap')}
                                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${format === 'soap' ? 'bg-background text-foreground shadow-sm' : ''}`}
                                    >
                                        SOAP
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Appointment Linking */}
                        {appointments && appointments.length > 0 && (
                            <div>
                                <label className="text-sm font-medium flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Vincular a cita (opcional)
                                </label>
                                <select
                                    name="appointmentId"
                                    defaultValue={note?.appointment_id || ''}
                                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Sin vincular</option>
                                    {appointments.map((apt: any) => (
                                        <option key={apt.id} value={apt.id}>
                                            {new Date(apt.start_time).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {' — '}{apt.status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Tags */}
                        <div>
                            <label className="text-sm font-medium flex items-center gap-1">
                                <Tag className="h-3.5 w-3.5" />
                                Etiquetas
                            </label>
                            <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                                {tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium"
                                    >
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                                    placeholder="Agregar etiqueta..."
                                    className="flex-1"
                                />
                                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {/* Suggested tags */}
                            <div className="flex flex-wrap gap-1 mt-2">
                                {suggestedTags.filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => setTags([...tags, tag])}
                                        className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        {format === 'simple' ? (
                            <div>
                                <label className="text-sm font-medium" htmlFor="content">Contenido</label>
                                <Textarea
                                    id="content"
                                    name="content"
                                    rows={8}
                                    defaultValue={note?.content?.subjective || (typeof note?.content === 'string' ? note?.content : '')}
                                    required={format === 'simple'}
                                    className="mt-1 resize-none"
                                    placeholder="Escribe la nota clínica..."
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-brand-yellow dark:text-brand-yellow flex items-center gap-1">
                                            <span className="w-5 h-5 rounded bg-brand-yellow dark:bg-brand-yellow/20 flex items-center justify-center text-xs font-bold">S</span>
                                            Subjetivo
                                        </label>
                                        <p className="text-[11px] text-muted-foreground mb-1">Lo que el paciente refiere</p>
                                        <Textarea
                                            name="subjective"
                                            rows={4}
                                            defaultValue={note?.content?.subjective}
                                            placeholder="El paciente reporta que..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-brand-brown dark:text-brand-brown flex items-center gap-1">
                                            <span className="w-5 h-5 rounded bg-brand-brown dark:bg-brand-brown/20 flex items-center justify-center text-xs font-bold">O</span>
                                            Objetivo
                                        </label>
                                        <p className="text-[11px] text-muted-foreground mb-1">Observaciones del terapeuta</p>
                                        <Textarea
                                            name="objective"
                                            rows={4}
                                            defaultValue={note?.content?.objective}
                                            placeholder="Se observa que..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-brand-yellow dark:text-brand-yellow flex items-center gap-1">
                                            <span className="w-5 h-5 rounded bg-brand-yellow dark:bg-brand-yellow/20 flex items-center justify-center text-xs font-bold">A</span>
                                            Análisis
                                        </label>
                                        <p className="text-[11px] text-muted-foreground mb-1">Interpretación clínica</p>
                                        <Textarea
                                            name="assessment"
                                            rows={4}
                                            defaultValue={note?.content?.assessment}
                                            placeholder="Análisis clínico..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-brand-brown dark:text-brand-brown flex items-center gap-1">
                                            <span className="w-5 h-5 rounded bg-brand-brown dark:bg-brand-brown/20 flex items-center justify-center text-xs font-bold">P</span>
                                            Plan
                                        </label>
                                        <p className="text-[11px] text-muted-foreground mb-1">Próximos pasos y tareas</p>
                                        <Textarea
                                            name="plan"
                                            rows={4}
                                            defaultValue={note?.content?.plan}
                                            placeholder="Plan de tratamiento..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-lg text-sm surface-alert-error flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
                            <Button type="submit" disabled={isLoading} className="flex-1">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (note ? 'Actualizar' : 'Guardar Nota')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export function AddNoteButton({ patientId, appointments }: { patientId: string; appointments?: any[] }) {
    const [showForm, setShowForm] = useState(false)
    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Nueva Nota
            </Button>
            {showForm && <ClinicalNoteForm patientId={patientId} appointments={appointments} onClose={() => setShowForm(false)} />}
        </>
    )
}

export function EditNoteButton({ note, patientId, appointments }: { note: any; patientId: string; appointments?: any[] }) {
    const [showForm, setShowForm] = useState(false)
    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(true)} title="Editar nota">
                <Edit2 className="h-4 w-4 text-muted-foreground" />
            </Button>
            {showForm && <ClinicalNoteForm patientId={patientId} note={note} appointments={appointments} onClose={() => setShowForm(false)} />}
        </>
    )
}

export function DeleteNoteButton({ noteId }: { noteId: string }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleDelete() {
        if (!confirm('¿Estás seguro de eliminar esta nota? Esta acción no se puede deshacer.')) return
        setIsLoading(true)
        await deleteClinicalNote(noteId)
        setIsLoading(false)
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isLoading} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Eliminar nota">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}

export function PinNoteButton({ noteId, isPinned }: { noteId: string; isPinned: boolean }) {
    const [isLoading, setIsLoading] = useState(false)
    const [pinned, setPinned] = useState(isPinned)

    async function handleToggle() {
        setIsLoading(true)
        const result = await togglePinNote(noteId, !pinned)
        if (!result.error) {
            setPinned(!pinned)
        }
        setIsLoading(false)
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleToggle} disabled={isLoading} title={pinned ? 'Desfijar nota' : 'Fijar nota'}>
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : pinned ? (
                <PinOff className="h-4 w-4 text-primary" />
            ) : (
                <Pin className="h-4 w-4 text-muted-foreground" />
            )}
        </Button>
    )
}

// ============================================
// DOCUMENT UPLOAD FORM
// ============================================
interface DocumentUploadFormProps {
    patientId: string
    onClose: () => void
}

export function DocumentUploadForm({ patientId, onClose }: DocumentUploadFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
        else if (e.type === 'dragleave') setDragActive(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files?.[0]) {
            setSelectedFile(e.dataTransfer.files[0])
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    async function handleSubmit(formData: FormData) {
        if (!selectedFile) {
            setError('Selecciona un archivo')
            return
        }
        setIsLoading(true)
        setError(null)

        formData.append('file', selectedFile)
        formData.append('patientId', patientId)

        const result = await uploadDocument(formData)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            onClose()
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const categoryLabels: Record<string, string> = {
        test_result: 'Resultado de prueba',
        referral: 'Referencia',
        consent: 'Consentimiento informado',
        report: 'Reporte',
        intake_form: 'Formulario de ingreso',
        other: 'Otro'
    }

    return (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg animate-in fade-in zoom-in duration-200 border-border/80 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Subir Documento
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        {/* Drop zone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragActive
                                ? 'border-primary bg-primary/5 scale-[1.02]'
                                : selectedFile
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.txt,.xlsx,.csv"
                            />
                            {selectedFile ? (
                                <div className="space-y-2">
                                    <File className="h-10 w-10 mx-auto text-brand-brown dark:text-brand-brown" />
                                    <p className="font-medium text-sm">{selectedFile.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                                    <p className="text-xs text-brand-brown dark:text-brand-brown">Haz clic para cambiar archivo</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="h-10 w-10 mx-auto text-muted-foreground/50" />
                                    <p className="text-sm font-medium">Arrastra un archivo aquí</p>
                                    <p className="text-xs text-muted-foreground">o haz clic para seleccionar</p>
                                    <p className="text-[11px] text-muted-foreground">PDF, DOC, imágenes, Excel — Máx 10MB</p>
                                </div>
                            )}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-sm font-medium">Categoría</label>
                            <select
                                name="category"
                                defaultValue="other"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {Object.entries(categoryLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-sm font-medium">Notas (opcional)</label>
                            <Textarea
                                name="notes"
                                rows={2}
                                placeholder="Nota sobre el documento..."
                                className="resize-none"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg text-sm surface-alert-error flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />{error}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
                            <Button type="submit" disabled={isLoading || !selectedFile} className="flex-1">
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Subiendo...</> : 'Subir Documento'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export function UploadDocumentButton({ patientId }: { patientId: string }) {
    const [showForm, setShowForm] = useState(false)
    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Paperclip className="mr-2 h-4 w-4" />
                Subir Documento
            </Button>
            {showForm && <DocumentUploadForm patientId={patientId} onClose={() => setShowForm(false)} />}
        </>
    )
}

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleDelete() {
        if (!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return
        setIsLoading(true)
        await deleteDocument(documentId)
        setIsLoading(false)
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isLoading} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Eliminar">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}

export function DownloadDocumentButton({ filePath }: { filePath: string; fileName: string }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleDownload() {
        setIsLoading(true)
        const result = await getDocumentUrl(filePath)
        if (result.url) {
            window.open(result.url, '_blank')
        }
        setIsLoading(false)
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleDownload} disabled={isLoading} title="Descargar">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </Button>
    )
}

// ============================================
// SESSION SUMMARY FORM
// ============================================
interface SessionSummaryFormProps {
    patientId: string
    appointmentId?: string | null
    summary?: any
    onClose: () => void
}

export function SessionSummaryForm({ patientId, appointmentId, summary, onClose }: SessionSummaryFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [moodRating, setMoodRating] = useState(summary?.mood_rating || 5)
    const [progressRating, setProgressRating] = useState(summary?.progress_rating || 3)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)

        formData.append('patientId', patientId)
        if (appointmentId) formData.append('appointmentId', appointmentId)
        if (summary?.id) formData.append('summaryId', summary.id)
        formData.append('moodRating', moodRating.toString())
        formData.append('progressRating', progressRating.toString())

        const result = await saveSessionSummary(formData)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-lg my-8 border-border/80 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        {summary ? 'Editar Resumen de Sesión' : 'Resumen de Sesión'}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        {/* Summary */}
                        <div>
                            <label className="text-sm font-medium">Resumen de la sesión *</label>
                            <Textarea
                                name="summary"
                                rows={4}
                                defaultValue={summary?.summary}
                                required
                                placeholder="Breve resumen de lo discutido en la sesión..."
                            />
                        </div>

                        {/* Mood Rating */}
                        <div>
                            <label className="text-sm font-medium">Estado de ánimo del paciente: {moodRating}/10</label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={moodRating}
                                onChange={(e) => setMoodRating(parseInt(e.target.value))}
                                className="w-full mt-1 accent-primary"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>😞 Bajo</span>
                                <span>😐 Neutro</span>
                                <span>😊 Alto</span>
                            </div>
                        </div>

                        {/* Progress Rating */}
                        <div>
                            <label className="text-sm font-medium">Progreso terapéutico: {progressRating}/5</label>
                            <div className="flex gap-2 mt-1">
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <button
                                        key={rating}
                                        type="button"
                                        onClick={() => setProgressRating(rating)}
                                        className={`flex-1 h-10 rounded-md border text-sm font-medium transition-all ${rating <= progressRating
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-muted text-muted-foreground border-muted hover:bg-accent'
                                            }`}
                                    >
                                        {rating}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                <span>Sin avance</span>
                                <span>Excelente</span>
                            </div>
                        </div>

                        {/* Key Topics */}
                        <div>
                            <label className="text-sm font-medium">Temas clave (separados por coma)</label>
                            <Input
                                name="keyTopics"
                                defaultValue={summary?.key_topics?.join(', ')}
                                placeholder="ansiedad, relaciones, autoestima..."
                            />
                        </div>

                        {/* Homework */}
                        <div>
                            <label className="text-sm font-medium">Tarea para el paciente</label>
                            <Textarea
                                name="homework"
                                rows={2}
                                defaultValue={summary?.homework}
                                placeholder="Ejercicios o actividades para la próxima semana..."
                                className="resize-none"
                            />
                        </div>

                        {/* Next Session Focus */}
                        <div>
                            <label className="text-sm font-medium">Enfoque próxima sesión</label>
                            <Input
                                name="nextSessionFocus"
                                defaultValue={summary?.next_session_focus}
                                placeholder="¿Qué trabajar en la próxima sesión?"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg text-sm surface-alert-error flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />{error}
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
                            <Button type="submit" disabled={isLoading} className="flex-1">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (summary ? 'Actualizar' : 'Guardar Resumen')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export function AddSessionSummaryButton({ patientId, appointmentId }: { patientId: string; appointmentId?: string }) {
    const [showForm, setShowForm] = useState(false)
    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Star className="mr-2 h-4 w-4" />
                Resumen de Sesión
            </Button>
            {showForm && (
                <SessionSummaryForm
                    patientId={patientId}
                    appointmentId={appointmentId}
                    onClose={() => setShowForm(false)}
                />
            )}
        </>
    )
}


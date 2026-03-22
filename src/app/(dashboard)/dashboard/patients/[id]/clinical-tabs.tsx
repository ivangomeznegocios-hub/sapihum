'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    AddNoteButton, EditNoteButton, DeleteNoteButton, PinNoteButton,
    UploadDocumentButton, DeleteDocumentButton, DownloadDocumentButton,
    AddSessionSummaryButton
} from '../patient-forms'
import { ToolsTabContent } from './tool-components-enhanced'
import {
    FileText, Paperclip, Calendar, LayoutDashboard, Search,
    Pin, Tag, Clock, File, AlertCircle, Star, BookOpen,
    TrendingUp, Brain, ClipboardList, Activity
} from 'lucide-react'

interface ClinicalTabsProps {
    patient: any
    notes: any[]
    documents: any[]
    appointments: any[]
    sessionSummaries: any[]
    patientId: string
    toolAssignments?: any[]
    tools?: any[]
}

function formatDateTime(dateString: string) {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

function formatDate(dateString: string) {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric'
    })
}

function formatShortDate(dateString: string) {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short'
    })
}

function getNoteTypeLabel(type: string) {
    const labels: Record<string, string> = {
        session_note: 'Nota de sesión',
        assessment: 'Evaluación',
        treatment_plan: 'Plan de tratamiento',
        progress_note: 'Nota de progreso',
        intake: 'Nota de ingreso',
        discharge: 'Nota de alta',
        nota: 'Nota',
        historia_clinica: 'Historia clínica'
    }
    return labels[type] || 'Nota'
}

function getNoteTypeColor(type: string) {
    const colors: Record<string, string> = {
        session_note: 'bg-blue-100 text-blue-800',
        assessment: 'bg-purple-100 text-purple-800',
        treatment_plan: 'bg-emerald-100 text-emerald-800',
        progress_note: 'bg-amber-100 text-amber-800',
        intake: 'bg-cyan-100 text-cyan-800',
        discharge: 'bg-rose-100 text-rose-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
}

function getDocCategoryLabel(cat: string) {
    const labels: Record<string, string> = {
        test_result: 'Resultado de prueba',
        referral: 'Referencia',
        consent: 'Consentimiento',
        report: 'Reporte',
        intake_form: 'Formulario de ingreso',
        other: 'Otro'
    }
    return labels[cat] || cat
}

function getDocCategoryColor(cat: string) {
    const colors: Record<string, string> = {
        test_result: 'bg-violet-100 text-violet-800',
        referral: 'bg-cyan-100 text-cyan-800',
        consent: 'surface-alert-success',
        report: 'bg-orange-100 text-orange-800',
        intake_form: 'bg-blue-100 text-blue-800',
        other: 'bg-gray-100 text-gray-800'
    }
    return colors[cat] || 'bg-gray-100 text-gray-800'
}

function formatFileSize(bytes: number) {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const tabs = [
    { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { id: 'notas', label: 'Notas SOAP', icon: FileText },
    { id: 'documentos', label: 'Documentos', icon: Paperclip },
    { id: 'herramientas', label: 'Herramientas', icon: Brain },
    { id: 'sesiones', label: 'Sesiones', icon: Calendar },
]

export function ClinicalTabs({ patient, notes, documents, appointments, sessionSummaries, patientId, toolAssignments = [], tools = [] }: ClinicalTabsProps) {
    const [activeTab, setActiveTab] = useState('resumen')
    const [searchQuery, setSearchQuery] = useState('')
    const [filterTag, setFilterTag] = useState<string | null>(null)

    // Gather all unique tags from notes
    const allTags = Array.from(
        new Set(notes.flatMap((n: any) => n.tags || []))
    ).sort()

    // Stats
    const totalSessions = notes.filter((n: any) => n.type === 'session_note').length
    const pinnedNotes = notes.filter((n: any) => n.is_pinned)
    const lastAppointment = appointments?.[0]

    // Filter notes
    const filteredNotes = notes.filter((n: any) => {
        const matchesSearch = !searchQuery ||
            (n.content?.subjective || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (n.content?.objective || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (n.content?.assessment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (n.content?.plan || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTag = !filterTag || (n.tags || []).includes(filterTag)
        return matchesSearch && matchesTag
    })

    return (
        <div>
            {/* Tab Navigation */}
            <div className="border-b mb-6">
                <div className="flex gap-1 overflow-x-auto pb-px">
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        let count = 0
                        if (tab.id === 'notas') count = notes.length
                        if (tab.id === 'documentos') count = documents.length
                        if (tab.id === 'herramientas') count = toolAssignments.length
                        if (tab.id === 'sesiones') count = appointments.length

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${isActive
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                                {count > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ============================================ */}
            {/* TAB: RESUMEN */}
            {/* ============================================ */}
            {activeTab === 'resumen' && (
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <ClipboardList className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{totalSessions}</p>
                                        <p className="text-xs text-muted-foreground">Sesiones</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{notes.length}</p>
                                        <p className="text-xs text-muted-foreground">Notas</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <Paperclip className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{documents.length}</p>
                                        <p className="text-xs text-muted-foreground">Documentos</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {lastAppointment
                                                ? formatShortDate(lastAppointment.start_time)
                                                : '—'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Última cita</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                <AddNoteButton patientId={patientId} appointments={appointments} />
                                <UploadDocumentButton patientId={patientId} />
                                <AddSessionSummaryButton patientId={patientId} appointmentId={lastAppointment?.id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pinned Notes */}
                    {pinnedNotes.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Pin className="h-4 w-4 text-primary" />
                                    Notas Fijadas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {pinnedNotes.map((note: any) => (
                                    <div key={note.id} className="p-3 border rounded-lg bg-primary/5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getNoteTypeColor(note.type)}`}>
                                                {getNoteTypeLabel(note.type)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{formatDateTime(note.created_at)}</span>
                                        </div>
                                        <p className="text-sm line-clamp-2">
                                            {note.content?.subjective || note.content?.assessment || 'Sin contenido'}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Actividad Reciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {notes.length === 0 && documents.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No hay actividad registrada aún
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {notes.slice(0, 5).map((note: any) => (
                                        <div key={note.id} className="flex items-start gap-3 text-sm">
                                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <FileText className="h-3.5 w-3.5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">
                                                    {getNoteTypeLabel(note.type)}
                                                    {note.session_number && <span className="text-muted-foreground ml-1">#{note.session_number}</span>}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {note.content?.subjective?.substring(0, 80) || 'Sin contenido'}
                                                </p>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatShortDate(note.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ============================================ */}
            {/* TAB: NOTAS SOAP */}
            {/* ============================================ */}
            {activeTab === 'notas' && (
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar en notas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <AddNoteButton patientId={patientId} appointments={appointments} />
                    </div>

                    {/* Tag Filters */}
                    {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setFilterTag(null)}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${!filterTag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                            >
                                Todas
                            </button>
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${filterTag === tag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                                >
                                    <Tag className="inline h-3 w-3 mr-1" />
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Notes List */}
                    {filteredNotes.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                <p className="font-medium text-muted-foreground">
                                    {searchQuery || filterTag ? 'No se encontraron notas con esos filtros' : 'No hay notas clínicas'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Usa el botón "Nueva Nota" para agregar la primera
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredNotes.map((note: any) => {
                                const isSoap = note.content && typeof note.content === 'object' && 'assessment' in note.content && note.content.assessment
                                const content = note.content

                                return (
                                    <Card key={note.id} className={`transition-all hover:shadow-md ${note.is_pinned ? 'ring-1 ring-primary/30' : ''}`}>
                                        <CardContent className="p-4">
                                            {/* Note Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {note.is_pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getNoteTypeColor(note.type)}`}>
                                                        {getNoteTypeLabel(note.type)}
                                                    </span>
                                                    {note.session_number && (
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            #{note.session_number}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDateTime(note.created_at)}
                                                    </span>
                                                    {isSoap && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border">
                                                            SOAP
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center">
                                                    <PinNoteButton noteId={note.id} isPinned={note.is_pinned} />
                                                    <EditNoteButton note={note} patientId={patientId} appointments={appointments} />
                                                    <DeleteNoteButton noteId={note.id} />
                                                </div>
                                            </div>

                                            {/* Tags */}
                                            {note.tags && note.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {note.tags.map((tag: string) => (
                                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Content */}
                                            {isSoap ? (
                                                <div className="grid gap-3 text-sm">
                                                    {content.subjective && (
                                                        <div className="flex gap-2">
                                                            <span className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">S</span>
                                                            <p className="whitespace-pre-wrap text-sm">{content.subjective}</p>
                                                        </div>
                                                    )}
                                                    {content.objective && (
                                                        <div className="flex gap-2">
                                                            <span className="w-6 h-6 rounded bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">O</span>
                                                            <p className="whitespace-pre-wrap text-sm">{content.objective}</p>
                                                        </div>
                                                    )}
                                                    {content.assessment && (
                                                        <div className="flex gap-2">
                                                            <span className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">A</span>
                                                            <p className="whitespace-pre-wrap text-sm">{content.assessment}</p>
                                                        </div>
                                                    )}
                                                    {content.plan && (
                                                        <div className="flex gap-2">
                                                            <span className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">P</span>
                                                            <p className="whitespace-pre-wrap text-sm">{content.plan}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {typeof content === 'string' ? content : content?.subjective || 'Sin contenido'}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* TAB: DOCUMENTOS */}
            {/* ============================================ */}
            {activeTab === 'documentos' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">{documents.length} documentos</p>
                        <UploadDocumentButton patientId={patientId} />
                    </div>

                    {documents.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Paperclip className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                <p className="font-medium text-muted-foreground">No hay documentos</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Sube PDFs, imágenes, resultados de pruebas y más
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {documents.map((doc: any) => (
                                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                                <File className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{doc.file_name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getDocCategoryColor(doc.category)}`}>
                                                        {getDocCategoryLabel(doc.category)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                                                    <span className="text-xs text-muted-foreground">• {formatShortDate(doc.created_at)}</span>
                                                </div>
                                                {doc.notes && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{doc.notes}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <DownloadDocumentButton filePath={doc.file_path} fileName={doc.file_name} />
                                                <DeleteDocumentButton documentId={doc.id} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* TAB: SESIONES */}
            {/* ============================================ */}
            {activeTab === 'sesiones' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">{appointments.length} citas registradas</p>
                        <AddSessionSummaryButton patientId={patientId} />
                    </div>

                    {appointments.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                <p className="font-medium text-muted-foreground">No hay citas registradas</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((apt: any) => {
                                const linkedNotes = notes.filter((n: any) => n.appointment_id === apt.id)
                                const linkedSummary = sessionSummaries.find((s: any) => s.appointment_id === apt.id)
                                const statusLabel: Record<string, string> = {
                                    pending: 'Pendiente',
                                    confirmed: 'Confirmada',
                                    cancelled: 'Cancelada',
                                    scheduled: 'Programada',
                                    completed: 'Completada'
                                }
                                const statusColor: Record<string, string> = {
                                    pending: 'bg-yellow-100 text-yellow-800',
                                    confirmed: 'surface-alert-success',
                                    cancelled: 'surface-alert-error',
                                    scheduled: 'bg-blue-100 text-blue-800',
                                    completed: 'bg-gray-100 text-gray-800'
                                }

                                return (
                                    <Card key={apt.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            {/* Appointment Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    <span className="font-medium text-sm">{formatDateTime(apt.start_time)}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[apt.status] || 'bg-gray-100 text-gray-800'}`}>
                                                        {statusLabel[apt.status] || apt.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Notes section */}
                                            {apt.notes && (
                                                <p className="text-sm text-muted-foreground mb-3">{apt.notes}</p>
                                            )}

                                            {/* Session Summary */}
                                            {linkedSummary && (
                                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Star className="h-3.5 w-3.5 text-amber-600" />
                                                        <span className="text-xs font-semibold text-amber-800">Resumen de Sesión</span>
                                                        {linkedSummary.mood_rating && (
                                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                                                Ánimo: {linkedSummary.mood_rating}/10
                                                            </span>
                                                        )}
                                                        {linkedSummary.progress_rating && (
                                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                                Progreso: {linkedSummary.progress_rating}/5
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm">{linkedSummary.summary}</p>
                                                    {linkedSummary.key_topics?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {linkedSummary.key_topics.map((topic: string) => (
                                                                <span key={topic} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                                                    {topic}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {linkedSummary.homework && (
                                                        <div className="mt-2 text-xs">
                                                            <span className="font-medium text-amber-800">Tarea:</span>{' '}
                                                            <span className="text-amber-700">{linkedSummary.homework}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Linked Notes */}
                                            {linkedNotes.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        {linkedNotes.length} nota(s) vinculada(s)
                                                    </p>
                                                    {linkedNotes.map((note: any) => (
                                                        <div key={note.id} className="p-2 rounded border bg-muted/30 text-sm">
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium mr-2 ${getNoteTypeColor(note.type)}`}>
                                                                {getNoteTypeLabel(note.type)}
                                                            </span>
                                                            <span className="text-sm">
                                                                {note.content?.subjective?.substring(0, 100) || 'Sin contenido'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Quick action if no summary */}
                                            {!linkedSummary && (
                                                <div className="mt-2">
                                                    <AddSessionSummaryButton patientId={patientId} appointmentId={apt.id} />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* TAB: HERRAMIENTAS */}
            {/* ============================================ */}
            {activeTab === 'herramientas' && (
                <ToolsTabContent
                    assignments={toolAssignments}
                    patientId={patientId}
                    tools={tools}
                />
            )}
        </div>
    )
}

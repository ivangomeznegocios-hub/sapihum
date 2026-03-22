'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ExternalLink, FileText, Trash2, CalendarDays, Loader2 } from 'lucide-react'
import type { ClinicalDocument } from '@/types/database'
import { useState } from 'react'
import { deleteDocument } from './actions'

interface DocumentsListProps {
    documents: (ClinicalDocument & { patient?: { full_name: string | null } })[]
    isPsychologist: boolean
}

const categoryLabels: Record<string, string> = {
    test_result: 'Resultado Prueba',
    referral: 'Derivacion',
    consent: 'Consentimiento',
    report: 'Informe',
    intake_form: 'Formulario Inicial',
    other: 'Otro',
}

export function DocumentsList({ documents, isPsychologist }: DocumentsListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!confirm('Estas seguro de eliminar este enlace?')) return
        setDeletingId(id)
        try {
            await deleteDocument(id)
        } finally {
            setDeletingId(null)
        }
    }

    if (documents.length === 0) {
        return (
            <div className="mt-6 rounded-lg border bg-card py-12 text-center text-muted-foreground">
                <FileText className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p className="mb-2 text-lg font-medium">Sin documentos</p>
                <p className="text-sm">
                    {isPsychologist
                        ? 'Anade enlaces a documentos para que tus pacientes puedan verlos aqui'
                        : 'No te han compartido documentos aun'}
                </p>
            </div>
        )
    }

    return (
        <div className="mt-6 space-y-3">
            <div className="space-y-3 md:hidden">
                {documents.map((doc) => (
                    <div key={doc.id} className="rounded-xl border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="flex items-center gap-2 font-medium">
                                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                                    <span className="truncate" title={doc.file_name}>
                                        {doc.file_name}
                                    </span>
                                </p>
                                <p className="mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                                    {categoryLabels[doc.category] || 'Otro'}
                                </p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                                <div className="flex items-center justify-end gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: es })}
                                </div>
                            </div>
                        </div>

                        {isPsychologist && (
                            <div className="text-sm text-muted-foreground">
                                Paciente: <span className="text-foreground">{doc.patient?.full_name || 'Paciente Desconocido'}</span>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" asChild className="flex-1 sm:flex-none">
                                <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Abrir
                                </a>
                            </Button>
                            {isPsychologist && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(doc.id)}
                                    disabled={deletingId === doc.id}
                                    className="flex-1 sm:flex-none"
                                >
                                    {deletingId === doc.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="hidden rounded-md border md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoria</TableHead>
                            {isPsychologist && <TableHead>Paciente</TableHead>}
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <span className="block max-w-[200px] truncate" title={doc.file_name}>
                                            {doc.file_name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                                        {categoryLabels[doc.category] || 'Otro'}
                                    </span>
                                </TableCell>
                                {isPsychologist && (
                                    <TableCell className="max-w-[150px] truncate">
                                        {doc.patient?.full_name || 'Paciente Desconocido'}
                                    </TableCell>
                                )}
                                <TableCell className="text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />
                                        {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: es })}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Abrir
                                            </a>
                                        </Button>
                                        {isPsychologist && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(doc.id)}
                                                disabled={deletingId === doc.id}
                                            >
                                                {deletingId === doc.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

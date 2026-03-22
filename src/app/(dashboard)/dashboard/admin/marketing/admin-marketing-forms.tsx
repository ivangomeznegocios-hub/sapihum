'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateServiceStatus, updateBriefStatus, adminInitializeServices } from './actions'
import {
    Loader2,
    CheckCircle2,
    Pencil,
    Save,
    X,
    Eye,
    ThumbsUp,
    UserPlus,
} from 'lucide-react'

// ============================================
// UPDATE SERVICE FORM (inline editing)
// ============================================
interface UpdateServiceFormProps {
    serviceId: string
    currentStatus: string
    currentNotes: string | null
    currentAdminNotes: string | null
    currentAssignedTo: string | null
    currentContactLink: string | null
}

export function UpdateServiceForm({
    serviceId,
    currentStatus,
    currentNotes,
    currentAdminNotes,
    currentAssignedTo,
    currentContactLink,
}: UpdateServiceFormProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isPending, startTransition] = useTransition()

    const [status, setStatus] = useState(currentStatus)
    const [notes, setNotes] = useState(currentNotes ?? '')
    const [adminNotes, setAdminNotes] = useState(currentAdminNotes ?? '')
    const [assignedTo, setAssignedTo] = useState(currentAssignedTo ?? '')
    const [contactLink, setContactLink] = useState(currentContactLink ?? '')

    function handleSave() {
        startTransition(async () => {
            const result = await updateServiceStatus(serviceId, {
                status,
                notes: notes || undefined,
                admin_notes: adminNotes || undefined,
                assigned_to: assignedTo || undefined,
                contact_link: contactLink || undefined,
            })
            if (result.success) {
                setIsEditing(false)
            } else {
                alert(result.error)
            }
        })
    }

    if (!isEditing) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 px-2 text-xs"
            >
                <Pencil className="w-3 h-3 mr-1" />
                Editar
            </Button>
        )
    }

    return (
        <div className="space-y-3 mt-2 p-3 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label className="text-xs">Estado</Label>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full h-8 px-2 text-xs rounded-md border bg-background"
                    >
                        <option value="pending_brief">Esperando Brief</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="active">Activo</option>
                        <option value="paused">Pausado</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Asignado a</Label>
                    <Input
                        value={assignedTo}
                        onChange={e => setAssignedTo(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Nombre del responsable"
                    />
                </div>
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Link de contacto (WhatsApp/email)</Label>
                <Input
                    value={contactLink}
                    onChange={e => setContactLink(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="https://wa.me/521..."
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Nota para el usuario</Label>
                <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="text-xs min-h-[40px]"
                    placeholder="Mensaje visible para el cliente"
                    rows={2}
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Nota interna (solo admin)</Label>
                <Textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    className="text-xs min-h-[40px]"
                    placeholder="Solo visible para admins"
                    rows={2}
                />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-7 text-xs">
                    <X className="w-3 h-3 mr-1" />
                    Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isPending} className="h-7 text-xs">
                    {isPending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                        <Save className="w-3 h-3 mr-1" />
                    )}
                    Guardar
                </Button>
            </div>
        </div>
    )
}

// ============================================
// BRIEF STATUS BUTTONS
// ============================================
interface BriefStatusButtonsProps {
    briefId: string
    currentStatus: string
}

export function BriefStatusButtons({ briefId, currentStatus }: BriefStatusButtonsProps) {
    const [isPending, startTransition] = useTransition()

    function handleUpdate(newStatus: 'reviewed' | 'approved') {
        startTransition(async () => {
            const result = await updateBriefStatus(briefId, newStatus)
            if (!result.success) {
                alert(result.error)
            }
        })
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {currentStatus === 'submitted' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdate('reviewed')}
                    disabled={isPending}
                    className="h-7 text-xs"
                >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3 mr-1" />}
                    Marcar Revisado
                </Button>
            )}
            {(currentStatus === 'submitted' || currentStatus === 'reviewed') && (
                <Button
                    size="sm"
                    onClick={() => handleUpdate('approved')}
                    disabled={isPending}
                    className="h-7 text-xs"
                >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3 mr-1" />}
                    Aprobar
                </Button>
            )}
            {currentStatus === 'approved' && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Aprobado
                </span>
            )}
        </div>
    )
}

// ============================================
// INITIALIZE SERVICES BUTTON (Admin)
// ============================================
interface InitServicesButtonProps {
    userId: string
}

export function InitServicesButton({ userId }: InitServicesButtonProps) {
    const [isPending, startTransition] = useTransition()

    function handleInit() {
        startTransition(async () => {
            const result = await adminInitializeServices(userId)
            if (!result.success) {
                alert(result.error)
            }
        })
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleInit}
            disabled={isPending}
            className="h-7 text-xs"
        >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <UserPlus className="w-3 h-3 mr-1" />}
            Inicializar Servicios
        </Button>
    )
}

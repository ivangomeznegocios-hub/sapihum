'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { assignReferral, markReferralHandoffCompleted, cancelReferral, togglePublicReferrals } from './actions'
import {
    Loader2, Check, X, Ban, UserPlus,
    CheckCircle2, AlertCircle, Settings
} from 'lucide-react'

export function AssignReferralForm({
    referralId,
    eligiblePsychologists,
}: {
    referralId: string
    eligiblePsychologists: { id: string, full_name: string, specialty: string | null }[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedPsy, setSelectedPsy] = useState('')
    const [notes, setNotes] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    async function handleAssign() {
        if (!selectedPsy) return
        setIsLoading(true)
        setMessage(null)
        const result = await assignReferral(referralId, selectedPsy, notes)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Canalizacion asignada' })
            setIsOpen(false)
        }
        setIsLoading(false)
    }

    if (!isOpen) {
        return (
            <Button size="sm" variant="outline" onClick={() => setIsOpen(true)} className="gap-1 h-8">
                <UserPlus className="h-3 w-3" />
                Asignar
            </Button>
        )
    }

    return (
        <div className="w-full max-w-sm border rounded-lg p-3 space-y-3">
            <select
                value={selectedPsy}
                onChange={(e) => setSelectedPsy(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
                <option value="">Seleccionar psicologo...</option>
                {eligiblePsychologists.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.full_name} {p.specialty ? `(${p.specialty})` : ''}
                    </option>
                ))}
            </select>
            <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Criterios de match y notas clinicas operativas..."
                className="h-16 resize-none text-xs"
            />
            {message && (
                <p className={`text-xs flex items-center gap-1 ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {message.type === 'error' ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {message.text}
                </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
                <Button size="sm" onClick={handleAssign} disabled={!selectedPsy || isLoading} className="h-7 w-full gap-1 text-xs sm:w-auto">
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Confirmar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} className="h-7 w-full text-xs sm:w-auto">
                    Cancelar
                </Button>
            </div>
        </div>
    )
}

export function MarkHandoffCompletedButton({ referralId }: { referralId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [done, setDone] = useState(false)

    async function handleSubmit() {
        if (!confirm('Marcar esta canalizacion como transferencia clinica completada?')) return
        setIsLoading(true)
        const result = await markReferralHandoffCompleted(referralId)
        if (!result.error) setDone(true)
        setIsLoading(false)
    }

    if (done) return <span className="text-xs text-green-600">Transferencia completada</span>

    return (
        <Button size="sm" variant="outline" onClick={handleSubmit} disabled={isLoading} className="gap-1 h-7 text-xs">
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Cerrar transferencia
        </Button>
    )
}

export function CancelReferralButton({ referralId }: { referralId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [done, setDone] = useState(false)

    async function handleCancel() {
        if (!confirm('Cancelar esta canalizacion?')) return
        setIsLoading(true)
        const result = await cancelReferral(referralId)
        if (!result.error) setDone(true)
        setIsLoading(false)
    }

    if (done) return <span className="text-xs text-red-600">Cancelada</span>

    return (
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isLoading} className="gap-1 h-7 text-xs text-red-600 hover:text-red-700">
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
            Cancelar
        </Button>
    )
}

export function PublicReferralsToggle({ currentValue }: { currentValue: boolean }) {
    const [enabled, setEnabled] = useState(currentValue)
    const [isLoading, setIsLoading] = useState(false)

    async function handleToggle() {
        setIsLoading(true)
        const result = await togglePublicReferrals(!enabled)
        if (!result.error) {
            setEnabled(!enabled)
        }
        setIsLoading(false)
    }

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Canalizacion entre colegas</p>
                <p className="text-xs text-muted-foreground">
                    {enabled ? 'Los psicologos pueden proponer canalizaciones directas entre colegas' : 'Solo admins asignan y validan la canalizacion clinica'}
                </p>
            </div>
            <Button
                size="sm"
                variant={enabled ? 'default' : 'outline'}
                onClick={handleToggle}
                disabled={isLoading}
                className="gap-1 h-8 w-full sm:w-auto"
            >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : enabled ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {enabled ? 'Activo' : 'Inactivo'}
            </Button>
        </div>
    )
}

'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { PlusCircle, Loader2 } from 'lucide-react'
import { adminAddManualEarning } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ManualEarningModalProps {
    speakers: { id: string; full_name: string; avatar_url: string | null }[]
    currentMonth: string
}

export function ManualEarningModal({ speakers, currentMonth }: ManualEarningModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [notes, setNotes] = useState<string>('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSpeakerId || !amount) {
            toast.error('Por favor completa los campos obligatorios')
            return
        }

        setLoading(true)
        try {
            const result = await adminAddManualEarning(
                selectedSpeakerId,
                parseFloat(amount),
                notes,
                currentMonth
            )

            if (result.error) {
                toast.error(`Error: ${result.error}`)
            } else {
                toast.success('Ingreso manual agregado con éxito')
                setOpen(false)
                setSelectedSpeakerId('')
                setAmount('')
                setNotes('')
                router.refresh()
            }
        } catch (error) {
            toast.error('Error inesperado al procesar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Agregar Bono / Ingreso
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agregar Ingreso Manual</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="speaker">Ponente *</Label>
                        <Select
                            value={selectedSpeakerId}
                            onValueChange={setSelectedSpeakerId}
                            required
                        >
                            <SelectTrigger id="speaker">
                                <SelectValue placeholder="Seleccionar ponente" />
                            </SelectTrigger>
                            <SelectContent>
                                {speakers.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto (MXN) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas / Concepto</Label>
                        <Textarea
                            id="notes"
                            placeholder="Ej: Bono por conferencia especial, ajuste manual, etc."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Este ingreso aparecerá como "Pendiente" y se liberará en 30 días automáticamente (o manualmente por admin).
                        </p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Ingreso
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

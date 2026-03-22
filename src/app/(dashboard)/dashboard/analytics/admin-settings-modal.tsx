'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Settings, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateAdminSettings } from './actions'
import { toast } from 'sonner'

interface AdminSettingsModalProps {
    initialCac: number
    initialMargin: number
}

export function AdminSettingsModal({ initialCac, initialMargin }: AdminSettingsModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [cac, setCac] = useState(initialCac.toString())
    const [margin, setMargin] = useState(initialMargin.toString())
    
    const router = useRouter()

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const numCac = parseFloat(cac) || 0
            const numMargin = parseFloat(margin) || 85

            const result = await updateAdminSettings(numCac, numMargin)
            
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Métricas configuradas correctamente.')
                setOpen(false)
                router.refresh()
            }
        } catch (error) {
            console.error('Error in save:', error)
            toast.error('Ocurrió un error inesperado. Intenta de nuevo.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configurar Métricas
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configurar Datos de Negocio</DialogTitle>
                    <DialogDescription>
                        Ajusta el margen bruto (% de ganancia limpia de las suscripciones) y tu Costo de Adquisición (CAC) real para calcular el LTV con precisión.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="cac">Costo de Adquisición (CAC) (MXN$)</Label>
                        <Input
                            id="cac"
                            type="number"
                            min="0"
                            step="10"
                            placeholder="Ej. 1200"
                            value={cac}
                            onChange={(e) => setCac(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            El dinero gastado en marketing dividido por los nuevos clientes reales del periodo.
                        </p>
                    </div>
                    
                    <div className="grid gap-2 mt-2">
                        <Label htmlFor="margin">Margen Bruto de Software (%)</Label>
                        <Input
                            id="margin"
                            type="number"
                            min="1"
                            max="100"
                            placeholder="Ej. 85"
                            value={margin}
                            onChange={(e) => setMargin(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            El estándar de la industria es 85% para productos puramente digitales sin costo de entrega físico.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

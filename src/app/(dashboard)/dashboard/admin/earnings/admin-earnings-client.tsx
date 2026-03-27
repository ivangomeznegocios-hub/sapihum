'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle2, Lock, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { adminReleaseEarnings, adminCloseMonth } from './actions'
import { useRouter } from 'next/navigation'
import { ManualEarningModal } from './manual-earning-modal'

interface AdminEarningsActionsProps {
    currentMonth: string
    speakers: { id: string; full_name: string; avatar_url: string | null }[]
}

export function AdminEarningsActions({ currentMonth, speakers }: AdminEarningsActionsProps) {
    const [releasing, setReleasing] = useState(false)
    const [closing, setClosing] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const router = useRouter()

    const handleRelease = async () => {
        setReleasing(true)
        setMessage(null)
        try {
            const result = await adminReleaseEarnings()
            if (result.error) {
                setMessage(`Error: ${result.error}`)
            } else {
                setMessage(`✅ ${result.releasedCount} ganancias liberadas`)
                router.refresh()
            }
        } catch {
            setMessage('Error al procesar')
        } finally {
            setReleasing(false)
        }
    }

    const handleCloseMonth = async () => {
        if (!confirm(`¿Cerrar el mes ${currentMonth}? Esto congelará todas las métricas.`)) return
        setClosing(true)
        setMessage(null)
        try {
            const result = await adminCloseMonth(currentMonth)
            if (result.error) {
                setMessage(`Error: ${result.error}`)
            } else {
                setMessage(`✅ Mes cerrado. Liberado: $${result.totals?.released}, Pendiente: $${result.totals?.pending}`)
                router.refresh()
            }
        } catch {
            setMessage('Error al cerrar mes')
        } finally {
            setClosing(false)
        }
    }

    return (
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRelease}
                    disabled={releasing}
                    className="w-full sm:w-auto"
                >
                    {releasing ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                        <CheckCircle2 className="mr-2 h-3 w-3" />
                    )}
                    Liberar Pendientes (+30 días)
                </Button>
                <ManualEarningModal speakers={speakers} currentMonth={currentMonth} />
                <Button
                    variant="default"
                    size="sm"
                    onClick={handleCloseMonth}
                    disabled={closing}
                    className="w-full sm:w-auto"
                >
                    {closing ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                        <Lock className="mr-2 h-3 w-3" />
                    )}
                    Cerrar Mes
                </Button>
            </div>
            {message && (
                <p className="text-xs text-muted-foreground">{message}</p>
            )}
        </div>
    )
}

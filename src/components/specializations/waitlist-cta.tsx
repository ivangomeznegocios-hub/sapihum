'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { collectAnalyticsEvent, getClientAnalyticsContext } from '@/lib/analytics/client'

interface WaitlistCTAProps {
    specializationCode: string
    specializationName: string
    source?: 'landing' | 'app'
    buttonLabel?: string
    variant?: 'default' | 'outline'
    className?: string
}

export function WaitlistCTA({
    specializationCode,
    specializationName,
    source = 'landing',
    buttonLabel = 'Quiero esta especializacion',
    variant = 'outline',
    className = '',
}: WaitlistCTAProps) {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const submit = async () => {
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const analyticsContext = getClientAnalyticsContext({
                funnel: 'waitlist',
                targetSpecialization: specializationCode,
            })

            const response = await fetch('/api/specializations/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    specializationCode,
                    email,
                    source,
                    analyticsContext,
                }),
            })

            const data = await response.json()
            if (!response.ok) {
                setError(data.error || 'No se pudo registrar tu interes')
                return
            }

            setSuccessMessage(data.message || 'Listo, te avisaremos cuando abra')
            await collectAnalyticsEvent('waitlist_joined', {
                properties: {
                    specializationCode,
                    specializationName,
                    source,
                },
                touch: {
                    funnel: 'waitlist',
                    targetSpecialization: specializationCode,
                },
            })
            setEmail('')
            setOpen(false)
        } catch (err) {
            console.error('Waitlist error:', err)
            setError('Error inesperado al registrar tu interes')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-2">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        className={className}
                        variant={variant}
                        data-analytics-cta
                        data-analytics-label={buttonLabel}
                        data-analytics-funnel="waitlist"
                        data-analytics-specialization={specializationCode}
                    >
                        {buttonLabel}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{specializationName} - Lista de espera</DialogTitle>
                        <DialogDescription>
                            Dejanos tu correo y te avisamos apenas abramos esta especializacion.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void submit()
                        }}
                        data-analytics-form="waitlist"
                        data-analytics-surface={source}
                        data-analytics-funnel="waitlist"
                        data-analytics-specialization={specializationCode}
                    >
                        <div className="space-y-2">
                            <Label htmlFor={`waitlist-email-${specializationCode}`}>Correo</Label>
                            <Input
                                id={`waitlist-email-${specializationCode}`}
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Si ya iniciaste sesion, tambien tomamos tu correo automaticamente.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Guardando...' : 'Unirme a la lista'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {successMessage && <p className="text-xs text-green-600">{successMessage}</p>}
        </div>
    )
}

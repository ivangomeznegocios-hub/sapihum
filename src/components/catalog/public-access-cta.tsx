'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Ticket, CreditCard } from 'lucide-react'
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
} from '@/components/ui/dialog'

interface PublicAccessCtaProps {
    eventId: string
    eventSlug: string
    title: string
    label: string
    requiresPayment: boolean
}

export function PublicAccessCta({
    eventId,
    eventSlug,
    title,
    label,
    requiresPayment,
}: PublicAccessCtaProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const icon = useMemo(() => {
        return requiresPayment ? <CreditCard className="mr-2 h-4 w-4" /> : <Ticket className="mr-2 h-4 w-4" />
    }, [requiresPayment])

    async function runRequest(withGuestDetails: boolean) {
        setLoading(true)
        setError(null)
        setStatusMessage(null)

        try {
            const endpoint = requiresPayment ? '/api/payments/checkout' : '/api/events/public-access'
            const body = requiresPayment
                ? {
                    purchaseType: 'event_purchase',
                    eventId,
                    ...(withGuestDetails ? { email, fullName, successPath: `/compras/exito?slug=${eventSlug}` } : {}),
                }
                : {
                    eventId,
                    ...(withGuestDetails ? { email, fullName } : {}),
                }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await response.json()

            if (!response.ok) {
                if (response.status === 401 || data.requiresGuestDetails) {
                    setDialogOpen(true)
                    return
                }

                setError(data.error || 'No fue posible continuar')
                return
            }

            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl
                return
            }

            if (data.redirectTo) {
                router.push(data.redirectTo)
                router.refresh()
                return
            }

            if (data.recoveryUrl) {
                router.push(data.recoveryUrl)
                router.refresh()
                return
            }

            if (data.message) {
                setStatusMessage(data.message)
                setDialogOpen(false)
                return
            }
        } catch (requestError) {
            console.error('Public access CTA error:', requestError)
            setError('Ocurrió un error inesperado')
        } finally {
            setLoading(false)
        }
    }

    async function handlePrimaryAction() {
        await runRequest(false)
    }

    async function handleGuestSubmit(event: React.FormEvent) {
        event.preventDefault()
        await runRequest(true)
    }

    return (
        <>
            <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={handlePrimaryAction} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icon}
                    {loading ? 'Procesando...' : label}
                </Button>
                {statusMessage && (
                    <p className="rounded-lg border border-brand-brown bg-brand-brown px-3 py-2 text-sm text-brand-brown">
                        {statusMessage}
                    </p>
                )}
                {error && (
                    <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </p>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{requiresPayment ? 'Compra rápida' : 'Recibe tu acceso'}</DialogTitle>
                        <DialogDescription>
                            Usa tu correo para {requiresPayment ? 'continuar al pago' : 'reservar tu lugar'} en <strong>{title}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleGuestSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="guest-full-name">Nombre</Label>
                            <Input
                                id="guest-full-name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Tu nombre completo"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guest-email">Correo</Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="guest-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        {requiresPayment ? <CreditCard className="mr-2 h-4 w-4" /> : <Ticket className="mr-2 h-4 w-4" />}
                                        {requiresPayment ? 'Continuar al pago' : 'Recibir acceso'}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Download, Loader2, Mail, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { collectAnalyticsEvent, getClientAnalyticsContext } from '@/lib/analytics/client'
import { getEventCampaignByKey, type EventCampaignKey } from '@/lib/events/campaigns'

interface CampaignLeadMagnetButtonProps {
    campaignKey: EventCampaignKey
    triggerLabel?: string
    sourceSurface: string
    sourceAction?: string
    eventId?: string | null
    eventSlug?: string | null
    redirectAfterSuccess?: boolean
    title?: string
    description?: string
    variant?: 'default' | 'outline' | 'secondary'
    size?: 'default' | 'sm' | 'lg'
    className?: string
}

export function CampaignLeadMagnetButton({
    campaignKey,
    triggerLabel = 'Descargar temario detallado',
    sourceSurface,
    sourceAction = 'download_syllabus',
    eventId,
    eventSlug,
    redirectAfterSuccess = false,
    title,
    description,
    variant = 'outline',
    size = 'default',
    className,
}: CampaignLeadMagnetButtonProps) {
    const router = useRouter()
    const pathname = usePathname()
    const campaign = getEventCampaignByKey(campaignKey)
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    if (!campaign) return null
    const activeCampaign = campaign

    async function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen)
        setError(null)

        if (nextOpen) {
            await collectAnalyticsEvent('cta_clicked', {
                properties: {
                    ctaLabel: triggerLabel,
                    ctaType: 'download_syllabus',
                    campaignKey,
                    eventSlug: eventSlug ?? null,
                    sourceSurface,
                },
                touch: {
                    funnel: 'event',
                },
            }).catch(() => undefined)

            await collectAnalyticsEvent('form_start', {
                properties: {
                    formName: 'event_campaign_temario',
                    campaignKey,
                    eventSlug: eventSlug ?? null,
                    sourceSurface,
                    sourceAction,
                },
                touch: {
                    funnel: 'event',
                },
            }).catch(() => undefined)
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)
        setSuccessMessage(null)

        const analyticsContext = getClientAnalyticsContext({ funnel: 'event' })

        try {
            await collectAnalyticsEvent('form_submit', {
                properties: {
                    formName: 'event_campaign_temario',
                    campaignKey,
                    eventSlug: eventSlug ?? null,
                    sourceSurface,
                    sourceAction,
                },
                touch: {
                    funnel: 'event',
                },
            }).catch(() => undefined)

            const response = await fetch('/api/leads/capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    whatsapp,
                    eventId,
                    eventSlug,
                    formationTrack: activeCampaign.formationTrack,
                    sourceSurface,
                    sourceAction,
                    assetKey: campaignKey,
                    analyticsContext,
                }),
            })

            const data = await response.json()
            if (!response.ok) {
                setError(data.error || 'No fue posible entregar el temario')
                return
            }

            setSuccessMessage('Te enviamos el temario y abrimos la descarga para que puedas revisarlo de inmediato.')
            setOpen(false)

            if (data.downloadUrl) {
                window.open(data.downloadUrl, '_blank', 'noopener,noreferrer')
            }

            if (redirectAfterSuccess && data.redirectUrl && data.redirectUrl !== pathname) {
                router.push(data.redirectUrl)
            }
        } catch (requestError) {
            console.error('Campaign lead magnet error:', requestError)
            setError('Ocurrio un error inesperado. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="space-y-2">
                <Button
                    type="button"
                    variant={variant}
                    size={size}
                    className={className}
                    onClick={() => handleOpenChange(true)}
                >
                    <Download className="mr-2 h-4 w-4" />
                    {triggerLabel}
                </Button>
                {successMessage && (
                    <p className="rounded-lg border border-brand-yellow/30 bg-brand-yellow/10 px-3 py-2 text-sm text-foreground">
                        {successMessage}
                    </p>
                )}
                {error && (
                    <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </p>
                )}
            </div>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>{title || `Recibe el temario de ${activeCampaign.title}`}</DialogTitle>
                        <DialogDescription>
                            {description || `Deja tus datos y te enviaremos el temario del bloque ${activeCampaign.title.toLowerCase()} junto con la agenda activa.`}
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor={`campaign-name-${campaignKey}`}>Nombre</Label>
                            <div className="relative">
                                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id={`campaign-name-${campaignKey}`}
                                    value={name}
                                    onChange={(inputEvent) => setName(inputEvent.target.value)}
                                    placeholder="Tu nombre completo"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`campaign-email-${campaignKey}`}>Correo</Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id={`campaign-email-${campaignKey}`}
                                    type="email"
                                    value={email}
                                    onChange={(inputEvent) => setEmail(inputEvent.target.value)}
                                    placeholder="tu@email.com"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`campaign-whatsapp-${campaignKey}`}>WhatsApp (opcional)</Label>
                            <div className="relative">
                                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id={`campaign-whatsapp-${campaignKey}`}
                                    value={whatsapp}
                                    onChange={(inputEvent) => setWhatsapp(inputEvent.target.value)}
                                    placeholder="5512345678"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Enviar y descargar temario
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

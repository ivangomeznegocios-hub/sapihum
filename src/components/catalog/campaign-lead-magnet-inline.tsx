'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Download, Loader2, Mail, Phone, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { collectAnalyticsEvent, getClientAnalyticsContext } from '@/lib/analytics/client'
import { getEventCampaignByKey, type EventCampaignKey } from '@/lib/events/campaigns'
import { cn } from '@/lib/utils'

interface CampaignLeadMagnetInlineProps {
    campaignKey: EventCampaignKey
    sourceSurface: string
    sourceAction?: string
    eventId?: string | null
    eventSlug?: string | null
    redirectAfterSuccess?: boolean
    eyebrow?: string
    title?: string
    description?: string
    submitLabel?: string
    className?: string
    compact?: boolean
    sectionId?: string
}

export function CampaignLeadMagnetInline({
    campaignKey,
    sourceSurface,
    sourceAction = 'download_syllabus',
    eventId,
    eventSlug,
    redirectAfterSuccess = false,
    eyebrow = 'Temario del bloque',
    title,
    description,
    submitLabel = 'Enviar y descargar temario',
    className,
    compact = false,
    sectionId,
}: CampaignLeadMagnetInlineProps) {
    const router = useRouter()
    const pathname = usePathname()
    const campaign = getEventCampaignByKey(campaignKey)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
    const [trackedStart, setTrackedStart] = useState(false)

    if (!campaign) return null
    const activeCampaign = campaign

    async function trackFormStart() {
        if (trackedStart) return
        setTrackedStart(true)

        await collectAnalyticsEvent('form_start', {
            properties: {
                formName: 'event_campaign_temario_inline',
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

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)
        setSuccessMessage(null)

        const analyticsContext = getClientAnalyticsContext({ funnel: 'event' })

        try {
            await collectAnalyticsEvent('form_submit', {
                properties: {
                    formName: 'event_campaign_temario_inline',
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
                setError(data.error || 'No fue posible entregar el temario.')
                return
            }

            setSuccessMessage('Te enviamos el temario y dejamos lista la ruta recomendada para seguir avanzando.')
            setDownloadUrl(data.downloadUrl || null)
            setRedirectUrl(data.redirectUrl || null)
            setName('')
            setEmail('')
            setWhatsapp('')

            if (data.downloadUrl) {
                window.open(data.downloadUrl, '_blank', 'noopener,noreferrer')
            }

            if (redirectAfterSuccess && data.redirectUrl && data.redirectUrl !== pathname) {
                router.push(data.redirectUrl)
            }
        } catch (requestError) {
            console.error('Campaign inline lead magnet error:', requestError)
            setError('Ocurrio un error inesperado. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    const topTopics = activeCampaign.temario.topics.slice(0, compact ? 2 : 3)

    return (
        <section
            id={sectionId}
            className={cn(
                'relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 text-white shadow-2xl shadow-black/25 backdrop-blur-sm',
                compact ? 'p-5' : 'p-6 md:p-7',
                className
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(246,174,2,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(122,86,2,0.16),transparent_30%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative space-y-5">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-yellow">
                        <Sparkles className="h-3.5 w-3.5" />
                        {eyebrow}
                    </div>
                    <div className="space-y-2">
                        <h3 className={cn('font-bold tracking-tight text-white', compact ? 'text-2xl' : 'text-2xl md:text-3xl')}>
                            {title || `Recibe el temario de ${activeCampaign.title}`}
                        </h3>
                        <p className="max-w-2xl text-sm leading-relaxed text-neutral-300 md:text-base">
                            {description || `Te enviaremos el temario del bloque, la agenda activa y el siguiente evento recomendado dentro de ${activeCampaign.title.toLowerCase()}.`}
                        </p>
                    </div>
                </div>

                <div className={cn('grid gap-3', compact ? 'md:grid-cols-1' : 'md:grid-cols-3')}>
                    {topTopics.map((topic) => (
                        <div
                            key={topic}
                            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-relaxed text-neutral-200"
                        >
                            {topic}
                        </div>
                    ))}
                </div>

                {successMessage ? (
                    <div className="rounded-[24px] border border-brand-yellow/20 bg-black/25 p-5">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-yellow/15 text-brand-yellow">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-base font-semibold text-white">Temario enviado</p>
                                    <p className="mt-1 text-sm leading-relaxed text-neutral-300">{successMessage}</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {downloadUrl && (
                                        <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                            <Button className="gap-2">
                                                <Download className="h-4 w-4" />
                                                Abrir temario
                                            </Button>
                                        </a>
                                    )}
                                    {redirectUrl && redirectUrl !== pathname && (
                                        <a href={redirectUrl}>
                                            <Button variant="outline" className="gap-2">
                                                Ver siguiente paso
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form className="grid gap-4" onSubmit={handleSubmit} onFocusCapture={trackFormStart}>
                        <div className={cn('grid gap-4', compact ? 'md:grid-cols-1' : 'md:grid-cols-2')}>
                            <div className="space-y-2">
                                <Label htmlFor={`campaign-inline-name-${campaignKey}`} className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                                    Nombre
                                </Label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                                    <Input
                                        id={`campaign-inline-name-${campaignKey}`}
                                        value={name}
                                        onChange={(inputEvent) => setName(inputEvent.target.value)}
                                        placeholder="Tu nombre completo"
                                        className="border-white/10 bg-black/20 pl-10 text-white placeholder:text-neutral-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`campaign-inline-email-${campaignKey}`} className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                                    Correo
                                </Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                                    <Input
                                        id={`campaign-inline-email-${campaignKey}`}
                                        type="email"
                                        value={email}
                                        onChange={(inputEvent) => setEmail(inputEvent.target.value)}
                                        placeholder="tu@email.com"
                                        className="border-white/10 bg-black/20 pl-10 text-white placeholder:text-neutral-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`campaign-inline-whatsapp-${campaignKey}`} className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                                WhatsApp opcional
                            </Label>
                            <div className="relative">
                                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                                <Input
                                    id={`campaign-inline-whatsapp-${campaignKey}`}
                                    value={whatsapp}
                                    onChange={(inputEvent) => setWhatsapp(inputEvent.target.value)}
                                    placeholder="5512345678"
                                    className="border-white/10 bg-black/20 pl-10 text-white placeholder:text-neutral-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-xs leading-relaxed text-neutral-400">
                                Recibes PDF, contexto del bloque y una recomendacion clara del siguiente evento.
                            </p>
                            <Button type="submit" className="gap-2 md:min-w-[15rem]" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        {submitLabel}
                                    </>
                                )}
                            </Button>
                        </div>

                        {error && (
                            <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </form>
                )}
            </div>
        </section>
    )
}

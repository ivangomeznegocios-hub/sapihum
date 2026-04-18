'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getPublicEventPath, slugifyCatalogText } from '@/lib/events/public'
import {
    Share2,
    Copy,
    Check,
    Code2,
    MessageCircle,
    Facebook,
    Linkedin,
} from 'lucide-react'

interface ShareEventButtonProps {
    eventSlug: string
    eventType?: 'live' | 'on_demand' | 'course' | 'presencial' | null
    eventStatus?: string | null
    recordingUrl?: string | null
    eventTitle: string
    isEmbeddable?: boolean
    speakerRef?: string | null
    campaignName?: string | null
}

export function ShareEventButton({
    eventSlug,
    eventType,
    eventStatus,
    recordingUrl,
    eventTitle,
    isEmbeddable = true,
    speakerRef = null,
    campaignName = null,
}: ShareEventButtonProps) {
    const [showPanel, setShowPanel] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)
    const [copiedEmbed, setCopiedEmbed] = useState(false)

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const publicPath = getPublicEventPath({
        slug: eventSlug,
        event_type: eventType || 'live',
        status: (eventStatus as any) || 'upcoming',
        recording_url: recordingUrl || null,
    })
    const publicUrl = `${baseUrl}${publicPath}`
    const trackedUrl = (() => {
        if (!baseUrl) return publicUrl

        const url = new URL(publicUrl)
        url.searchParams.set('utm_source', speakerRef ? 'speaker' : 'team')
        url.searchParams.set('utm_medium', 'organic')
        url.searchParams.set('utm_campaign', slugifyCatalogText(campaignName || eventSlug))

        if (speakerRef) {
            url.searchParams.set('ref', speakerRef)
        }

        return url.toString()
    })()
    const embedCode = `<iframe src="${publicUrl}/embed" width="400" height="420" frameborder="0" style="border-radius:16px;overflow:hidden;" loading="lazy"></iframe>`

    const shareLinks = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${eventTitle}\n${trackedUrl}`)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackedUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(trackedUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(trackedUrl)}`,
    }

    const copyToClipboard = async (text: string, type: 'link' | 'embed') => {
        await navigator.clipboard.writeText(text)
        if (type === 'link') {
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2000)
        } else {
            setCopiedEmbed(true)
            setTimeout(() => setCopiedEmbed(false), 2000)
        }
    }

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPanel(!showPanel)}
                className="gap-2"
            >
                <Share2 className="h-4 w-4" />
                Compartir
            </Button>

            {showPanel && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowPanel(false)} />

                    <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] space-y-4 rounded-xl border bg-popover p-4 shadow-xl animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-semibold text-sm">Compartir Evento</h4>

                        <button
                            className="w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted"
                            onClick={() => copyToClipboard(trackedUrl, 'link')}
                        >
                            {copiedLink ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
                            <div>
                                <span className="text-sm font-medium">{copiedLink ? 'Copiado' : 'Copiar enlace rastreable'}</span>
                                <p className="text-xs text-muted-foreground line-clamp-1">{trackedUrl}</p>
                            </div>
                        </button>

                        <div className="flex flex-wrap gap-2">
                            <a
                                href={shareLinks.whatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-w-[6.5rem] flex-1 items-center justify-center gap-2 rounded-lg bg-green-500/10 p-2.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-500/20"
                            >
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp
                            </a>
                            <a
                                href={shareLinks.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-w-[4rem] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-yellow/10 p-2.5 text-sm font-medium text-brand-yellow transition-colors hover:bg-brand-yellow/20"
                            >
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a
                                href={shareLinks.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-w-[4rem] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-yellow/10 p-2.5 text-sm font-medium text-brand-yellow transition-colors hover:bg-brand-yellow/20"
                            >
                                X
                            </a>
                            <a
                                href={shareLinks.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-w-[4rem] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-yellow/10 p-2.5 text-sm font-medium text-brand-yellow transition-colors hover:bg-brand-yellow/20"
                            >
                                <Linkedin className="h-4 w-4" />
                            </a>
                        </div>

                        {isEmbeddable && (
                            <div className="space-y-2 border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-sm font-medium">
                                        <Code2 className="h-4 w-4" />
                                        Codigo de embed
                                    </span>
                                    <button
                                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                                        onClick={() => copyToClipboard(embedCode, 'embed')}
                                    >
                                        {copiedEmbed ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        {copiedEmbed ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                                <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border bg-muted/50 p-2 text-xs font-mono">
                                    {embedCode}
                                </pre>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

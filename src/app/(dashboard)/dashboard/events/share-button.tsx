'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
    eventId: string
    eventTitle: string
    isEmbeddable?: boolean
}

export function ShareEventButton({ eventId, eventTitle, isEmbeddable = true }: ShareEventButtonProps) {
    const [showPanel, setShowPanel] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)
    const [copiedEmbed, setCopiedEmbed] = useState(false)

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const publicUrl = `${baseUrl}/events/${eventId}`
    const embedCode = `<iframe src="${publicUrl}/embed" width="400" height="420" frameborder="0" style="border-radius:16px;overflow:hidden;" loading="lazy"></iframe>`

    const shareLinks = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${eventTitle}\n${publicUrl}`)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(publicUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`,
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
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowPanel(false)} />

                    {/* Panel */}
                    <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] space-y-4 rounded-xl border bg-popover p-4 shadow-xl animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-semibold text-sm">Compartir Evento</h4>

                        {/* Copy Link */}
                        <button
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                            onClick={() => copyToClipboard(publicUrl, 'link')}
                        >
                            {copiedLink ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
                            <div>
                                <span className="text-sm font-medium">{copiedLink ? '¡Copiado!' : 'Copiar enlace'}</span>
                                <p className="text-xs text-muted-foreground line-clamp-1">{publicUrl}</p>
                            </div>
                        </button>

                        {/* Social Sharing */}
                        <div className="flex flex-wrap gap-2">
                            <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer"
                                className="flex min-w-[6.5rem] flex-1 items-center justify-center gap-2 rounded-lg bg-green-500/10 p-2.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-500/20"
                            >
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp
                            </a>
                            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer"
                                className="flex min-w-[4rem] flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500/10 p-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-500/20"
                            >
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer"
                                className="flex min-w-[4rem] flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500/10 p-2.5 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-500/20"
                            >
                                𝕏
                            </a>
                            <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer"
                                className="flex min-w-[4rem] flex-1 items-center justify-center gap-2 rounded-lg bg-blue-700/10 p-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-700/20"
                            >
                                <Linkedin className="h-4 w-4" />
                            </a>
                        </div>

                        {/* Embed Code */}
                        {isEmbeddable && (
                            <div className="border-t pt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium flex items-center gap-1.5">
                                        <Code2 className="h-4 w-4" />
                                        Código de Embed
                                    </span>
                                    <button
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                        onClick={() => copyToClipboard(embedCode, 'embed')}
                                    >
                                        {copiedEmbed ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        {copiedEmbed ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                                <pre className="bg-muted/50 border rounded-lg p-2 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
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

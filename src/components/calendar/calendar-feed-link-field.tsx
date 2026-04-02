'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CalendarFeedLinkField({
    label,
    feedUrl,
}: {
    label: string
    feedUrl: string
}) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(feedUrl)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1600)
        } catch (error) {
            console.error('[CalendarSync] No se pudo copiar el feed ICS:', error)
        }
    }

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
                {label}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Input readOnly value={feedUrl} className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={handleCopy} className="sm:w-auto">
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                </Button>
                <Button type="button" asChild className="sm:w-auto">
                    <a href={feedUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir
                    </a>
                </Button>
            </div>
        </div>
    )
}

'use client'

import { Button } from '@/components/ui/button'
import { Share2, Check, Copy } from 'lucide-react'
import { useState } from 'react'

export function ShareButton() {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(window.location.href)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <Button
            variant="outline"
            className="w-full"
            onClick={handleCopy}
        >
            {copied ? (
                <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado
                </>
            ) : (
                <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar enlace
                </>
            )}
        </Button>
    )
}

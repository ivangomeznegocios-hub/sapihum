'use client'

import { useState } from 'react'
import { Maximize2, Minimize2, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InteractiveToolViewerProps {
    htmlContent: string
    title: string
    height?: string
}

export function InteractiveToolViewer({
    htmlContent,
    title,
    height = '500px'
}: InteractiveToolViewerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false)

    if (!htmlContent) return null

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                    <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-brand-yellow" />
                        <span className="font-medium text-sm">{title}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFullscreen(false)}
                        className="gap-1"
                    >
                        <Minimize2 className="h-4 w-4" />
                        Salir
                    </Button>
                </div>
                <iframe
                    srcDoc={htmlContent}
                    sandbox="allow-scripts allow-forms allow-modals"
                    className="flex-1 w-full border-0"
                    title={title}
                />
            </div>
        )
    }

    return (
        <div className="rounded-lg border overflow-hidden bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between px-3 py-1.5 bg-brand-yellow dark:bg-brand-yellow/30 border-b">
                <div className="flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-brand-yellow" />
                    <span className="text-xs font-medium text-brand-yellow dark:text-brand-yellow">{title}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                    className="h-6 px-2 text-[10px] gap-1 text-brand-yellow hover:text-brand-yellow"
                >
                    <Maximize2 className="h-3 w-3" />
                    Pantalla completa
                </Button>
            </div>
            <iframe
                srcDoc={htmlContent}
                sandbox="allow-scripts allow-forms allow-modals"
                className="w-full border-0"
                style={{ height }}
                title={title}
            />
        </div>
    )
}

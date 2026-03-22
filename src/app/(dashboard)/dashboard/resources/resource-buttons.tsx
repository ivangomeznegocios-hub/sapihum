'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VideoPlayer } from '@/components/ui/video-player'
import { Play, X, ExternalLink } from 'lucide-react'

interface VideoResourceButtonProps {
    url: string
    title: string
}

/**
 * Button that opens a video in an embedded modal player
 * Keeps users within the platform instead of redirecting to YouTube
 */
export function VideoResourceButton({ url, title }: VideoResourceButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                size="sm"
                variant="secondary"
                className="w-full max-w-[140px]"
                onClick={() => setIsOpen(true)}
            >
                <Play className="h-4 w-4 mr-1" />
                Ver Video
            </Button>

            {/* Video Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="w-full max-w-4xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Card className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-muted/50">
                                <CardTitle className="text-base font-medium truncate pr-4">
                                    {title}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="flex-shrink-0"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <VideoPlayer
                                    src={url}
                                    title={title}
                                    aspectRatio="16/9"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </>
    )
}

interface ResourceActionButtonProps {
    url: string
    title: string
    type: string
    resourceId?: string
    htmlContent?: string | null
}

/**
 * Smart button that shows video in modal, opens tool page, or opens external link
 */
export function ResourceActionButton({ url, title, type, resourceId, htmlContent }: ResourceActionButtonProps) {
    const typeLabels: Record<string, string> = {
        pdf: 'Abrir PDF',
        video: 'Ver Video',
        audio: 'Escuchar',
        link: 'Abrir',
        document: 'Abrir',
        tool: 'Abrir Herramienta'
    }

    // For videos, use the modal player
    if (type === 'video') {
        return <VideoResourceButton url={url} title={title} />
    }

    // For interactive tools with html_content, link to the resource detail page
    if (type === 'tool' && htmlContent && resourceId) {
        return (
            <Button asChild size="sm" variant="secondary" className="w-full max-w-[160px]">
                <a href={`/dashboard/resources/${resourceId}`}>
                    🔧 Abrir Herramienta
                </a>
            </Button>
        )
    }

    // For other types, use external link (PDFs, links, etc.)
    return (
        <Button asChild size="sm" variant="secondary" className="w-full max-w-[140px]">
            <a href={url} target="_blank" rel="noopener noreferrer">
                {typeLabels[type] || 'Abrir'}
                <ExternalLink className="h-3 w-3 ml-1" />
            </a>
        </Button>
    )
}

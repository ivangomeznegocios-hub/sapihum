'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface VideoRoomProps {
    appointmentId: string
    patientName: string
    meetingLink?: string | null
    onSessionEnd?: () => void
}

export function VideoRoom({ appointmentId, patientName, meetingLink, onSessionEnd }: VideoRoomProps) {
    const [isSessionActive, setIsSessionActive] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    // Generate unique room name based on appointment ID or use provided link
    const roomName = `comunidad-psicologia-${appointmentId.slice(0, 8)}`
    const jitsiUrl = meetingLink || `https://meet.jit.si/${roomName}`

    const handleStartSession = () => {
        setIsLoading(true)
        // Small delay to show loading state
        setTimeout(() => {
            setIsSessionActive(true)
            setIsLoading(false)
        }, 500)
    }

    const handleEndSession = () => {
        setIsSessionActive(false)
        onSessionEnd?.()
    }

    if (!isSessionActive) {
        return (
            <Card className="border-2 border-dashed">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                        >
                            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                            <rect x="2" y="6" width="14" height="12" rx="2" />
                        </svg>
                        Videoconsulta
                    </CardTitle>
                    <CardDescription>
                        Sesión con {patientName}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <div className="bg-muted rounded-lg p-8 w-full flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mx-auto text-muted-foreground"
                            >
                                <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                                <rect x="2" y="6" width="14" height="12" rx="2" />
                            </svg>
                            <p className="text-sm text-muted-foreground">
                                La videollamada se iniciará con Jitsi Meet
                            </p>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        onClick={handleStartSession}
                        disabled={isLoading}
                        className="w-full max-w-xs"
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="mr-2 h-4 w-4 animate-spin"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Conectando...
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="mr-2"
                                >
                                    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                                    <rect x="2" y="6" width="14" height="12" rx="2" />
                                </svg>
                                Iniciar Sesión
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Sesión en Vivo
                        </CardTitle>
                        <CardDescription>
                            Videoconsulta con {patientName}
                        </CardDescription>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleEndSession}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                        >
                            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                            <line x1="22" x2="2" y1="2" y2="22" />
                        </svg>
                        Finalizar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                    <iframe
                        ref={iframeRef}
                        src={jitsiUrl}
                        className="w-full h-full"
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        allowFullScreen
                    />
                </div>
            </CardContent>
        </Card>
    )
}

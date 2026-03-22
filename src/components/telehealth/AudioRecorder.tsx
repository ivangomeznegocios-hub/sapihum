'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { recordAiProcessingConsent } from '@/actions/consent'

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob, durationSeconds: number) => void
    isProcessing?: boolean
    disabled?: boolean
}

export function AudioRecorder({
    onRecordingComplete,
    isProcessing = false,
    disabled = false
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [hasConsent, setHasConsent] = useState(false)
    const [consentError, setConsentError] = useState<string | null>(null)
    const [savingConsent, setSavingConsent] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const recordingTimeRef = useRef(0)

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const requestPermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            })
            streamRef.current = stream
            setHasPermission(true)
            return stream
        } catch (error) {
            console.error('Error accessing microphone:', error)
            setHasPermission(false)
            return null
        }
    }, [])

    const startRecording = useCallback(async () => {
        // Clear previous recording
        setAudioUrl(null)
        chunksRef.current = []

        // Get or request stream
        let stream = streamRef.current
        if (!stream) {
            stream = await requestPermission()
            if (!stream) return
        }

        // Create MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        })

        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data)
            }
        }

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
            const url = URL.createObjectURL(audioBlob)
            setAudioUrl(url)

            // Allow state to settle before emitting
            setTimeout(() => {
                onRecordingComplete(audioBlob, recordingTimeRef.current)
            }, 100)
        }

        // Start recording
        mediaRecorder.start(1000) // Collect data every second
        setIsRecording(true)
        setRecordingTime(0)
        recordingTimeRef.current = 0

        // Start timer
        timerRef.current = setInterval(() => {
            recordingTimeRef.current += 1
            setRecordingTime(prev => prev + 1)
        }, 1000)
    }, [onRecordingComplete, requestPermission])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)

            // Clear timer
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }

            // Stop tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
        }
    }, [isRecording])

    const handleRecordClick = () => {
        if (isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }

    const handleConsentChange = useCallback(async (checked: boolean) => {
        setConsentError(null)

        if (!checked) {
            setHasConsent(false)
            return
        }

        setSavingConsent(true)

        try {
            const result = await recordAiProcessingConsent()

            if (!result.success) {
                setHasConsent(false)
                setConsentError(
                    result.error ||
                    'No se pudo guardar el consentimiento de IA. No es posible grabar hasta que se complete el registro.'
                )
                return
            }

            setHasConsent(true)
        } catch (error) {
            setHasConsent(false)
            setConsentError(
                error instanceof Error
                    ? error.message
                    : 'No se pudo guardar el consentimiento de IA. No es posible grabar hasta que se complete el registro.'
            )
        } finally {
            setSavingConsent(false)
        }
    }, [])

    // Permission denied state
    if (hasPermission === false) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="2" x2="22" y1="2" y2="22" />
                            <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                            <path d="M5 10v2a7 7 0 0 0 12 5" />
                            <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                            <line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                        Micrófono No Disponible
                    </CardTitle>
                    <CardDescription>
                        Permite el acceso al micrófono para grabar la sesión
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => requestPermission()} variant="outline">
                        Reintentar Permiso
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={isRecording ? 'border-red-500 border-2' : ''}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={isRecording ? 'text-red-500' : ''}
                            >
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" x2="12" y1="19" y2="22" />
                            </svg>
                            Grabación de Sesión
                        </CardTitle>
                        <CardDescription>
                            {isRecording
                                ? 'Grabando audio de la sesión...'
                                : 'Graba el audio para generar notas con IA'}
                        </CardDescription>
                    </div>
                    {isRecording && (
                        <Badge variant="destructive" className="animate-pulse">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            {formatTime(recordingTime)}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Recording Controls */}
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleRecordClick}
                        variant={isRecording ? 'destructive' : 'default'}
                        disabled={disabled || isProcessing || savingConsent || (!isRecording && !hasConsent)}
                        className="min-w-[180px]"
                    >
                        {isRecording ? (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="mr-2"
                                >
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                                Detener Grabación
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
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" x2="12" y1="19" y2="22" />
                                </svg>
                                Grabar Sesión
                            </>
                        )}
                    </Button>

                    {isProcessing && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <svg
                                className="h-4 w-4 animate-spin"
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
                            Procesando con IA...
                        </div>
                    )}
                </div>

                {/* Audio Preview */}
                {audioUrl && !isRecording && (
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Vista previa del audio:</p>
                        <audio controls src={audioUrl} className="w-full" />
                    </div>
                )}

                {/* Consent Notice */}
                {!isRecording && (
                    <div className="flex flex-col gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5 flex-shrink-0">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                            </svg>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                    Requisito de Privacidad (HIPAA Safe Harbor)
                                </p>
                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                    El audio será procesado por Inteligencia Artificial para generar notas clínicas. Para proteger la privacidad del paciente y cumplir normativas legales, <strong>está estrictamente prohibido grabar Información Personal Identificable (PII)</strong>.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 mt-2 pt-3 border-t border-amber-200/50 dark:border-amber-800/50">
                            <Checkbox 
                                id="hipaa-consent" 
                                checked={hasConsent}
                                onCheckedChange={(checked) => handleConsentChange(checked === true)}
                                disabled={savingConsent}
                                className="mt-0.5 border-amber-500 data-[state=checked]:bg-amber-600 data-[state=checked]:text-amber-50"
                            />
                            <Label htmlFor="hipaa-consent" className="text-xs leading-relaxed text-amber-900 dark:text-amber-100 cursor-pointer">
                                Confirmo que tengo el consentimiento del paciente y <strong>NO mencionaré nombres completos, fechas de nacimiento, correos, ni números de teléfono</strong> durante la grabación.
                            </Label>
                        </div>
                        {consentError && (
                            <p className="text-xs font-medium text-red-700 dark:text-red-300">
                                {consentError}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

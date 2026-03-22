'use client'

import { useState } from 'react'
import { VideoRoom } from './VideoRoom'
import { AudioRecorder } from './AudioRecorder'
import { processSessionRecording } from '@/actions/transcribe'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { SOAPContent } from '@/types/database'

interface TelehealthSessionProps {
    appointmentId: string
    patientId: string
    patientName: string
    meetingLink?: string | null
    aiMinutes?: number
    membershipLevel?: number
    userRole?: string | null
}

export function TelehealthSession({
    appointmentId,
    patientId,
    patientName,
    meetingLink,
    aiMinutes = 0,
    membershipLevel = 0,
    userRole = null,
}: TelehealthSessionProps) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [soapNotes, setSoapNotes] = useState<SOAPContent | null>(null)
    const [transcription, setTranscription] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isSaved, setIsSaved] = useState(false)

    const [isLocalMode, setIsLocalMode] = useState(false)
    const [recordedDuration, setRecordedDuration] = useState(0)
    const [generateNotes, setGenerateNotes] = useState(true)
    const [generateActionPlan, setGenerateActionPlan] = useState(false)

    const isAIAvailable = userRole === 'psychologist' && membershipLevel >= 2
    const hasEnoughCredits = aiMinutes > 0
    const canUseClinicalAI = isAIAvailable && hasEnoughCredits

    const handleRecordingComplete = async (audioBlob: Blob, durationSeconds: number) => {
        setIsProcessing(true)
        setError(null)
        setSoapNotes(null)
        setTranscription(null)

        try {
            if (userRole !== 'psychologist') {
                setError('La IA clinica solo esta disponible para psicologos.')
                setIsProcessing(false)
                return
            }

            if (!isAIAvailable) {
                setError('La IA clinica requiere membresia Nivel 2 o superior.')
                setIsProcessing(false)
                return
            }

            if (!hasEnoughCredits) {
                setError('No tienes suficientes minutos de IA disponibles. Por favor, recarga tu saldo.')
                setIsProcessing(false)
                return
            }

            const arrayBuffer = await audioBlob.arrayBuffer()
            const base64 = btoa(
                new Uint8Array(arrayBuffer).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    ''
                )
            )
            setRecordedDuration(durationSeconds)

            const consumedMinutes = Math.max(1, Math.ceil(durationSeconds / 60))
            const result = await processSessionRecording(
                base64,
                appointmentId,
                patientId,
                consumedMinutes,
                { generateNotes, generateActionPlan }
            )

            if (result.success) {
                setTranscription(result.transcription ?? null)
                setSoapNotes(result.soapNotes ?? null)
                setIsSaved(!!result.record)

                if (result.error) {
                    setError(result.error)
                }
            } else {
                setError(result.error ?? 'Error procesando la grabacion')
            }
        } catch (err) {
            console.error('Error processing recording:', err)
            setError('Error inesperado al procesar la grabacion')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="bg-muted/50 border-primary/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex justify-between items-center">
                        Configuracion de la Sesion
                        {isAIAvailable ? (
                            <Badge variant={hasEnoughCredits ? 'secondary' : 'destructive'}>
                                IA Minutos: {aiMinutes} {hasEnoughCredits ? 'disp.' : '(Sin saldo)'}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                                {userRole === 'psychologist' ? 'IA requiere Nivel 2+' : 'Solo psicologos con Nivel 2+'}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="local-mode" className="flex flex-col space-y-1">
                                <span>Modalidad Presencial (Local)</span>
                                <span className="font-normal text-xs text-muted-foreground text-left whitespace-normal">
                                    Desactiva Jitsi y usa solo el microfono para consultas fisicas.
                                </span>
                            </Label>
                            <Switch
                                id="local-mode"
                                checked={isLocalMode}
                                onCheckedChange={setIsLocalMode}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="ai-notes" className="flex flex-col space-y-1">
                                <span className={!canUseClinicalAI ? 'text-muted-foreground' : ''}>
                                    Generar Notas Clinicas (SOAP)
                                </span>
                                <span className="font-normal text-xs text-muted-foreground">
                                    Extrae Subjectivo, Objetivo, Analisis y Plan.
                                </span>
                            </Label>
                            <Switch
                                id="ai-notes"
                                checked={generateNotes}
                                onCheckedChange={setGenerateNotes}
                                disabled={!canUseClinicalAI}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="ai-action-plan" className="flex flex-col space-y-1">
                                <span className={!generateNotes || !canUseClinicalAI ? 'text-muted-foreground' : ''}>
                                    Incluir Plan de Accion
                                </span>
                                <span className="font-normal text-xs text-muted-foreground text-left whitespace-normal">
                                    Anade recomendaciones de tareas o pasos para el paciente.
                                </span>
                            </Label>
                            <Switch
                                id="ai-action-plan"
                                checked={generateActionPlan}
                                onCheckedChange={setGenerateActionPlan}
                                disabled={!generateNotes || !canUseClinicalAI}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {!isLocalMode && (
                <VideoRoom
                    appointmentId={appointmentId}
                    patientName={patientName}
                    meetingLink={meetingLink}
                />
            )}

            <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                isProcessing={isProcessing}
                disabled={!canUseClinicalAI}
            />

            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
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
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" x2="12" y1="8" y2="12" />
                                <line x1="12" x2="12.01" y1="16" y2="16" />
                            </svg>
                            <span className="font-medium">{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {soapNotes && Object.keys(soapNotes).length > 0 && (
                <Card className="border-primary">
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
                                        className="text-primary"
                                    >
                                        <path d="M12 8V4H8" />
                                        <rect width="16" height="12" x="4" y="8" rx="2" />
                                        <path d="M2 14h2" />
                                        <path d="M20 14h2" />
                                        <path d="M15 13v2" />
                                        <path d="M9 13v2" />
                                    </svg>
                                    Notas SOAP Generadas por IA
                                </CardTitle>
                                <CardDescription>
                                    Revisa el resumen generado analizando {recordedDuration ?? 0}s de audio
                                </CardDescription>
                            </div>
                            {isSaved ? (
                                <Badge variant={'success' as any}>Guardado</Badge>
                            ) : (
                                <Badge variant={'warning' as any}>Borrador</Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {soapNotes.subjective && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-primary">S - Subjetivo</h4>
                                <p className="text-sm bg-muted p-3 rounded-lg">
                                    {soapNotes.subjective}
                                </p>
                            </div>
                        )}

                        {soapNotes.objective && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-primary">O - Objetivo</h4>
                                <p className="text-sm bg-muted p-3 rounded-lg">
                                    {soapNotes.objective}
                                </p>
                            </div>
                        )}

                        {soapNotes.assessment && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-primary">A - Analisis</h4>
                                <p className="text-sm bg-muted p-3 rounded-lg">
                                    {soapNotes.assessment}
                                </p>
                            </div>
                        )}

                        {soapNotes.plan && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-primary">P - Plan</h4>
                                <p className="text-sm bg-muted p-3 rounded-lg">
                                    {soapNotes.plan}
                                </p>
                            </div>
                        )}

                        {soapNotes.action_plan && Array.isArray(soapNotes.action_plan) && (
                            <div className="space-y-2 mt-4 pt-4 border-t">
                                <h4 className="font-semibold text-primary">Plan de Accion (Pendientes)</h4>
                                <ul className="text-sm bg-muted p-3 rounded-lg space-y-2">
                                    {soapNotes.action_plan.map((item: string, idx: number) => (
                                        <li key={idx} className="flex gap-2">
                                            <span className="text-primary font-bold">-</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {transcription && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Transcripcion Original</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {transcription}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

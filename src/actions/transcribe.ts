'use server'

import { createClient } from '@/lib/supabase/server'
import { getViewerCommercialAccessContext } from '@/lib/access/commercial'
import { canUseClinicalAi } from '@/lib/access/internal-modules'
import type { SOAPContent, ClinicalRecord } from '@/types/database'

const GROQ_API_URL = 'https://api.groq.com/openai/v1'
const AI_CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

function scrubPII(text: string): string {
    let scrubbed = text

    scrubbed = scrubbed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_CENSURADO]')
    scrubbed = scrubbed.replace(/(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/g, '[TELEFONO_CENSURADO]')
    scrubbed = scrubbed.replace(/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, '[ID_CENSURADO]')

    return scrubbed
}

const getSystemPrompt = (includeActionPlan: boolean) => `Eres un asistente clinico experto en psicologia. Tu tarea es convertir transcripciones de sesiones terapeuticas en notas clinicas.

FORMATO DE SALIDA (JSON):
{
  "subjective": "Lo que el paciente refiere: sintomas, sentimientos, preocupaciones expresadas.",
  "objective": "Observaciones del terapeuta: comportamiento, comunicacion no verbal.",
  "assessment": "Analisis clinico: interpretacion, progreso terapeutico, diagnostico si aplica.",
  "plan": "Plan de tratamiento: intervenciones, siguientes pasos."${includeActionPlan ? ',\n  "action_plan": ["Puntos de accion 1", "Puntos de accion 2"]' : ''}
}

INSTRUCCIONES:
- Responde SOLO con el JSON, sin texto adicional.
- Se clinico, conciso y profesional.
- Si no incluye nada, deja el valor en string vacio o "No especificado".`

interface TranscriptionResult {
    success: boolean
    transcription?: string
    soapNotes?: SOAPContent
    error?: string
}

interface SavedRecordResult {
    success: boolean
    record?: ClinicalRecord
    error?: string
}

interface ClinicalAiAccessResult {
    success: boolean
    error?: string
    userId?: string
    patientId?: string
    consumedMinutes?: number
}

async function transcribeAudio(audioBlob: Blob): Promise<string> {
    const groqApiKey = process.env.AI_API_KEY

    if (!groqApiKey) {
        throw new Error('GROQ API key not configured')
    }

    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'whisper-large-v3-turbo')
    formData.append('language', 'es')
    formData.append('response_format', 'text')

    const response = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${groqApiKey}`,
        },
        body: formData,
    })

    if (!response.ok) {
        console.error('Transcription error: request failed with status', response.status)
        throw new Error(`Transcription failed: ${response.status}`)
    }

    const transcription = await response.text()
    return scrubPII(transcription.trim())
}

async function generateSOAPNotes(transcription: string, includeActionPlan: boolean): Promise<SOAPContent> {
    const groqApiKey = process.env.AI_API_KEY

    if (!groqApiKey) {
        throw new Error('GROQ API key not configured')
    }

    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: getSystemPrompt(includeActionPlan),
                },
                {
                    role: 'user',
                    content: `Analiza la siguiente transcripcion de una sesion terapeutica y genera notas en formato JSON:\n\n${transcription}`,
                },
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        }),
    })

    if (!response.ok) {
        console.error('SOAP generation error: request failed with status', response.status)
        throw new Error(`SOAP generation failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
        throw new Error('No content in SOAP response')
    }

    try {
        return JSON.parse(content) as SOAPContent
    } catch {
        console.error('Error parsing SOAP JSON response')
        throw new Error('Invalid SOAP JSON response')
    }
}

async function hasValidAiProcessingConsent(supabase: any, userId: string): Promise<boolean> {
    const { data: consent, error } = await (supabase
        .from('consent_records') as any)
        .select('granted, granted_at, revoked_at')
        .eq('user_id', userId)
        .eq('consent_type', 'ai_processing')
        .order('granted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error || !consent) {
        return false
    }

    if (!consent.granted || consent.revoked_at) {
        return false
    }

    const grantedAt = consent.granted_at ? new Date(consent.granted_at).getTime() : NaN
    if (!Number.isFinite(grantedAt)) {
        return false
    }

    return Date.now() - grantedAt <= AI_CONSENT_MAX_AGE_MS
}

async function validateClinicalAiAccess(
    appointmentId: string,
    patientId: string,
    consumedMinutes: number
): Promise<ClinicalAiAccessResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'No autenticado' }
    }

    if (!appointmentId || !patientId) {
        return { success: false, error: 'Faltan datos de la sesion' }
    }

    if (!Number.isFinite(consumedMinutes) || consumedMinutes <= 0) {
        return { success: false, error: 'Duracion de audio invalida' }
    }

    const [{ data: profile }, { data: appointment }, commercialAccess] = await Promise.all([
        (supabase
            .from('profiles') as any)
            .select('id, role, ai_minutes_available')
            .eq('id', user.id)
            .single(),
        (supabase
            .from('appointments') as any)
            .select('id, patient_id, psychologist_id')
            .eq('id', appointmentId)
            .single(),
        getViewerCommercialAccessContext(supabase, user.id),
    ])

    if (!profile || profile.role !== 'psychologist') {
        return { success: false, error: 'Solo psicologos pueden usar IA clinica.' }
    }

    if (!commercialAccess || !canUseClinicalAi({
        role: commercialAccess.profile.role,
        membershipLevel: commercialAccess.membershipLevel,
    })) {
        return { success: false, error: 'Tu membresia actual no incluye IA clinica.' }
    }

    if ((profile.ai_minutes_available ?? 0) < consumedMinutes) {
        return { success: false, error: 'No tienes suficientes minutos de IA disponibles.' }
    }

    if (!appointment || appointment.psychologist_id !== user.id || appointment.patient_id !== patientId) {
        return { success: false, error: 'No tienes acceso a esta sesion clinica.' }
    }

    const hasConsent = await hasValidAiProcessingConsent(supabase, user.id)
    if (!hasConsent) {
        return { success: false, error: 'No existe consentimiento vigente para procesamiento con IA.' }
    }

    return {
        success: true,
        userId: user.id,
        patientId: appointment.patient_id,
        consumedMinutes,
    }
}

async function consumeAiMinutes(consumedMinutes: number) {
    const supabase = await createClient()
    const { data, error } = await (supabase as any).rpc('consume_ai_minutes', {
        p_minutes: consumedMinutes,
        p_description: `Uso de IA clinica (${consumedMinutes} min)`,
    })

    if (error || !data) {
        return {
            success: false,
            error: error?.message || 'No fue posible descontar minutos de IA.',
        }
    }

    return { success: true }
}

async function refundAiMinutes(consumedMinutes: number) {
    const supabase = await createClient()
    await (supabase as any).rpc('refund_ai_minutes', {
        p_minutes: consumedMinutes,
        p_description: `Reembolso automatico de IA clinica (${consumedMinutes} min)`,
    })
}

export async function transcribeAndGenerateSOAP(
    audioData: string,
    options: { generateNotes: boolean; generateActionPlan: boolean } = { generateNotes: true, generateActionPlan: false }
): Promise<TranscriptionResult> {
    try {
        const binaryString = atob(audioData)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        const audioBlob = new Blob([bytes], { type: 'audio/webm' })

        const transcription = await transcribeAudio(audioBlob)

        let soapNotes: SOAPContent | undefined = undefined
        if (options.generateNotes || options.generateActionPlan) {
            soapNotes = await generateSOAPNotes(transcription, options.generateActionPlan)
        }

        return {
            success: true,
            transcription,
            soapNotes,
        }
    } catch (error) {
        console.error('Transcription error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

export async function saveSOAPAsDraft(
    patientId: string,
    psychologistId: string,
    soapNotes: SOAPContent | undefined,
    transcription?: string
): Promise<SavedRecordResult> {
    try {
        const supabase = await createClient()

        const content: any = {
            ...(soapNotes || {}),
        }

        if (transcription) {
            content.original_transcription = transcription
        }

        const { data, error } = await (supabase
            .from('clinical_records') as any)
            .insert({
                patient_id: patientId,
                psychologist_id: psychologistId,
                content,
                type: 'nota',
            } as any)
            .select()
            .single()

        if (error) {
            console.error('Error saving SOAP draft:', error)
            return {
                success: false,
                error: error.message,
            }
        }

        return {
            success: true,
            record: data as ClinicalRecord,
        }
    } catch (error) {
        console.error('Error saving draft:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

export async function processSessionRecording(
    audioData: string,
    appointmentId: string,
    patientId: string,
    consumedMinutes: number,
    options: { generateNotes: boolean; generateActionPlan: boolean } = { generateNotes: true, generateActionPlan: false }
): Promise<{
    success: boolean
    transcription?: string
    soapNotes?: SOAPContent
    record?: ClinicalRecord
    error?: string
}> {
    const access = await validateClinicalAiAccess(appointmentId, patientId, consumedMinutes)
    if (!access.success || !access.userId || !access.patientId || !access.consumedMinutes) {
        return {
            success: false,
            error: access.error || 'Acceso denegado a IA clinica',
        }
    }

    const creditConsumption = await consumeAiMinutes(access.consumedMinutes)
    if (!creditConsumption.success) {
        return {
            success: false,
            error: creditConsumption.error || 'No fue posible reservar minutos de IA.',
        }
    }

    const result = await transcribeAndGenerateSOAP(audioData, options)

    if (!result.success || !result.transcription) {
        await refundAiMinutes(access.consumedMinutes)
        return {
            success: false,
            error: result.error || 'Failed to generate transcription',
        }
    }

    const saveResult = await saveSOAPAsDraft(
        access.patientId,
        access.userId,
        result.soapNotes,
        result.transcription
    )

    if (!saveResult.success) {
        return {
            success: true,
            transcription: result.transcription,
            soapNotes: result.soapNotes,
            error: `Notas generadas pero error al guardar: ${saveResult.error}`,
        }
    }

    return {
        success: true,
        transcription: result.transcription,
        soapNotes: result.soapNotes,
        record: saveResult.record,
    }
}

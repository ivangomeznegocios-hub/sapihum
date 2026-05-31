'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Mail, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { collectAnalyticsEvent, getClientAnalyticsContext } from '@/lib/analytics/client'
import { getOrganicSpecialtyOptions } from '@/lib/organic-leads/taxonomy'
import type {
    OrganicLeadActionType,
    OrganicLeadCapturePayload,
    OrganicLeadIntent,
    OrganicLifecycleStage,
    OrganicSourceType,
} from '@/lib/organic-leads/types'

interface OrganicLeadFormProps {
    sourcePage: string
    sourceTopic?: string | null
    sourceAsset?: string | null
    intent: OrganicLeadIntent
    interestTags?: string[]
    actionType: OrganicLeadActionType
    sourceType?: OrganicSourceType
    ctaLabel?: string
    onSuccess?: (result: {
        leadId: string
        lifecycleStage: OrganicLifecycleStage
        nextStepUrl: string
        downloadUrl?: string
    }) => void
}

const PRIMARY_INTERESTS = [
    { value: 'evaluacion_clinica', label: 'Evaluacion clinica' },
    { value: 'formacion', label: 'Formacion continua' },
    { value: 'recursos', label: 'Recursos y formatos' },
    { value: 'comunidad', label: 'Comunidad profesional' },
]

const PROFESSIONAL_GOALS = [
    'Ordenar mi practica',
    'Conseguir mejores recursos',
    'Especializarme',
    'Entrar a comunidad',
]

const INTENT_OPTIONS: Array<{ value: OrganicLeadIntent; label: string }> = [
    { value: 'download_resource', label: 'Descargar recurso' },
    { value: 'explore_formation', label: 'Explorar formacion' },
    { value: 'attend_event', label: 'Asistir a evento' },
    { value: 'evaluate_membership', label: 'Evaluar membresia' },
]

interface OrganicLeadFormState {
    name: string
    email: string
    primaryInterest: string
    specialty: string
    country: string
    whatsapp: string
    yearsExperience: string
    professionalGoal: string
    intent: OrganicLeadIntent
}

function getCurrentUtms() {
    if (typeof window === 'undefined') return {}
    const url = new URL(window.location.href)
    const utms: Record<string, string> = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
        const value = url.searchParams.get(key)
        if (value) utms[key] = value
    }
    return utms
}

export function OrganicLeadForm({
    sourcePage,
    sourceTopic,
    sourceAsset,
    intent,
    interestTags = [],
    actionType,
    sourceType = 'resource',
    ctaLabel = 'Enviar',
    onSuccess,
}: OrganicLeadFormProps) {
    const specialtyOptions = useMemo(() => getOrganicSpecialtyOptions(), [])
    const [step, setStep] = useState(1)
    const [trackedStart, setTrackedStart] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [form, setForm] = useState<OrganicLeadFormState>({
        name: '',
        email: '',
        primaryInterest: interestTags[0] ?? PRIMARY_INTERESTS[0].value,
        specialty: '',
        country: '',
        whatsapp: '',
        yearsExperience: '',
        professionalGoal: PROFESSIONAL_GOALS[0],
        intent,
    })

    function updateField<K extends keyof OrganicLeadFormState>(key: K, value: OrganicLeadFormState[K]) {
        setForm((current) => ({ ...current, [key]: value }))
    }

    async function trackStart() {
        if (trackedStart) return
        setTrackedStart(true)
        await collectAnalyticsEvent('form_start', {
            properties: {
                formName: 'organic_lead_form',
                sourcePage,
                sourceTopic,
                sourceAsset,
                sourceType,
            },
            touch: {
                funnel: 'landing',
                landingPath: sourcePage,
            },
        }).catch(() => undefined)
    }

    function goNext() {
        void trackStart()
        setError(null)

        if (step === 1 && (!form.name.trim() || !form.email.trim())) {
            setError('Completa nombre y correo para continuar.')
            return
        }

        setStep((current) => Math.min(3, current + 1))
    }

    async function submit() {
        setLoading(true)
        setError(null)

        const payload: OrganicLeadCapturePayload = {
            name: form.name,
            email: form.email,
            whatsapp: form.whatsapp || null,
            country: form.country || null,
            specialty: form.specialty || null,
            yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null,
            professionalGoal: form.professionalGoal,
            intent: form.intent,
            sourcePage,
            sourceTopic,
            sourceAsset,
            sourceType,
            actionType,
            interestTags: [form.primaryInterest, form.specialty, ...interestTags].filter(Boolean),
            utms: getCurrentUtms(),
            referrer: typeof document !== 'undefined' ? document.referrer : null,
            analyticsContext: getClientAnalyticsContext({
                funnel: 'landing',
                landingPath: sourcePage,
            }),
            metadata: {
                form_step_count: 3,
                primary_interest: form.primaryInterest,
            },
        }

        try {
            await collectAnalyticsEvent('form_submit', {
                properties: {
                    formName: 'organic_lead_form',
                    sourcePage,
                    sourceTopic,
                    sourceAsset,
                    sourceType,
                    intent: form.intent,
                },
                touch: {
                    funnel: 'landing',
                    landingPath: sourcePage,
                },
            }).catch(() => undefined)

            const response = await fetch('/api/organic-leads/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const result = await response.json()

            if (!response.ok) {
                setError(result.error || 'No fue posible guardar tus datos.')
                return
            }

            setSuccess(true)
            onSuccess?.(result)

            if (result.downloadUrl) {
                window.open(result.downloadUrl, '_blank', 'noopener,noreferrer')
            }
        } catch (requestError) {
            console.error('[OrganicLeadForm] submit failed:', requestError)
            setError('Ocurrio un error inesperado. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue/10 p-5 text-sm text-foreground">
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                    <div>
                        <p className="font-semibold">Registro recibido</p>
                        <p className="mt-1 leading-relaxed text-brand-text-muted">
                            Dejamos lista tu descarga y una ruta recomendada para continuar dentro de SAPIHUM.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <form
            className="space-y-5"
            onSubmit={(event) => {
                event.preventDefault()
                if (step < 3) {
                    goNext()
                    return
                }
                void submit()
            }}
            onFocusCapture={trackStart}
            data-analytics-form="organic_lead_form"
            data-analytics-surface={sourcePage}
            data-analytics-funnel="landing"
            data-analytics-specialization={form.specialty}
        >
            <div className="flex items-center gap-2">
                {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className={item <= step ? 'h-1.5 flex-1 rounded-full bg-brand-blue' : 'h-1.5 flex-1 rounded-full bg-muted'}
                    />
                ))}
            </div>

            {step === 1 ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="organic-lead-name">Nombre</Label>
                        <div className="relative">
                            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="organic-lead-name"
                                value={form.name}
                                onChange={(event) => updateField('name', event.target.value)}
                                className="pl-10"
                                placeholder="Tu nombre"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="organic-lead-email">Correo</Label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="organic-lead-email"
                                type="email"
                                value={form.email}
                                onChange={(event) => updateField('email', event.target.value)}
                                className="pl-10"
                                placeholder="tu@email.com"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="organic-lead-interest">Interes principal</Label>
                        <select
                            id="organic-lead-interest"
                            value={form.primaryInterest}
                            onChange={(event) => updateField('primaryInterest', event.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            {PRIMARY_INTERESTS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : null}

            {step === 2 ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="organic-lead-specialty">Especialidad</Label>
                        <select
                            id="organic-lead-specialty"
                            value={form.specialty}
                            onChange={(event) => updateField('specialty', event.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Selecciona una opcion</option>
                            {specialtyOptions.map((item) => (
                                <option key={item.code} value={item.code}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="organic-lead-country">Pais</Label>
                        <Input
                            id="organic-lead-country"
                            value={form.country}
                            onChange={(event) => updateField('country', event.target.value)}
                            placeholder="Mexico"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="organic-lead-whatsapp">WhatsApp</Label>
                        <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="organic-lead-whatsapp"
                                value={form.whatsapp}
                                onChange={(event) => updateField('whatsapp', event.target.value)}
                                className="pl-10"
                                placeholder="5512345678"
                            />
                        </div>
                    </div>
                </div>
            ) : null}

            {step === 3 ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="organic-lead-years">Anos de experiencia</Label>
                        <Input
                            id="organic-lead-years"
                            type="number"
                            min={0}
                            max={80}
                            value={form.yearsExperience}
                            onChange={(event) => updateField('yearsExperience', event.target.value)}
                            placeholder="3"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="organic-lead-goal">Objetivo profesional</Label>
                        <select
                            id="organic-lead-goal"
                            value={form.professionalGoal}
                            onChange={(event) => updateField('professionalGoal', event.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            {PROFESSIONAL_GOALS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="organic-lead-intent">Intencion principal</Label>
                        <select
                            id="organic-lead-intent"
                            value={form.intent}
                            onChange={(event) => updateField('intent', event.target.value as OrganicLeadIntent)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                            {INTENT_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : null}

            {error ? (
                <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </p>
            ) : null}

            <div className="flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="outline"
                    disabled={step === 1 || loading}
                    onClick={() => setStep((current) => Math.max(1, current - 1))}
                >
                    Atras
                </Button>
                <Button type="submit" disabled={loading} data-analytics-cta data-analytics-label={ctaLabel}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando
                        </>
                    ) : (
                        <>
                            {step < 3 ? 'Continuar' : ctaLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}

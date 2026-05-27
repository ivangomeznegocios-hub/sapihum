'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buildAuthCallbackUrl } from '@/lib/config/app-url'
import { buildRegistrationConsentMetadata, CONSENT_POLICY_VERSION } from '@/lib/consent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type SpeakerFormState = {
    fullName: string
    email: string
    password: string
    confirmPassword: string
    phone: string
    professionalId: string
    specialty: string
    yearsExperience: string
    photoUrl: string
    bio: string
    credentials: string
    linkedinUrl: string
    websiteUrl: string
    topicProposal: string
    acceptPrivacy: boolean
    acceptTerms: boolean
    acceptSpeakerTerms: boolean
    acceptIncomeTerms: boolean
}

const INITIAL_STATE: SpeakerFormState = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    professionalId: '',
    specialty: '',
    yearsExperience: '',
    photoUrl: '',
    bio: '',
    credentials: '',
    linkedinUrl: '',
    websiteUrl: '',
    topicProposal: '',
    acceptPrivacy: false,
    acceptTerms: false,
    acceptSpeakerTerms: false,
    acceptIncomeTerms: false,
}

function isLikelyDirectImageUrl(value: string) {
    try {
        const url = new URL(value)
        return (
            ['http:', 'https:'].includes(url.protocol) &&
            (
                /\.(avif|gif|jpe?g|png|svg|webp)(?:$|[/?#])/i.test(`${url.pathname}${url.search}`) ||
                url.hostname.endsWith('.googleusercontent.com') ||
                url.hostname.endsWith('.supabase.co') ||
                url.hostname.endsWith('.wixstatic.com')
            )
        )
    } catch {
        return false
    }
}

function parseCredentials(value: string) {
    return value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
}

export function SpeakerApplicationForm() {
    const [form, setForm] = useState<SpeakerFormState>(INITIAL_STATE)
    const [error, setError] = useState<string | null>(null)
    const [successEmail, setSuccessEmail] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const supabase = useMemo(() => createClient(), [])

    function updateField<K extends keyof SpeakerFormState>(key: K, value: SpeakerFormState[K]) {
        setForm((current) => ({ ...current, [key]: value }))
    }

    function validateForm() {
        const requiredText: Array<[keyof SpeakerFormState, string]> = [
            ['fullName', 'Ingresa tu nombre completo.'],
            ['email', 'Ingresa tu correo.'],
            ['phone', 'Ingresa un telefono de contacto.'],
            ['professionalId', 'Ingresa tu cedula, registro o credencial profesional.'],
            ['specialty', 'Ingresa tu especialidad principal.'],
            ['yearsExperience', 'Ingresa tus anos de experiencia.'],
            ['photoUrl', 'Agrega una URL directa de foto profesional.'],
            ['bio', 'Escribe una bio profesional.'],
        ]

        for (const [key, message] of requiredText) {
            if (typeof form[key] === 'string' && !form[key].trim()) return message
        }

        if (form.password.length < 8) return 'La contrasena debe tener al menos 8 caracteres.'
        if (form.password !== form.confirmPassword) return 'Las contrasenas no coinciden.'

        const yearsExperience = Number(form.yearsExperience)
        if (!Number.isInteger(yearsExperience) || yearsExperience < 1) {
            return 'Ingresa anos de experiencia como numero entero mayor a 0.'
        }

        if (form.bio.trim().length < 80) {
            return 'La bio debe tener al menos 80 caracteres para evaluar tu perfil.'
        }

        if (!isLikelyDirectImageUrl(form.photoUrl.trim())) {
            return 'La foto debe ser una URL directa a imagen JPG, PNG, WebP, AVIF, GIF o SVG.'
        }

        if (!form.acceptPrivacy || !form.acceptTerms || !form.acceptSpeakerTerms || !form.acceptIncomeTerms) {
            return 'Debes aceptar privacidad, terminos, reglas de ponente y reglas de ingresos.'
        }

        return null
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setLoading(true)

        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            setLoading(false)
            return
        }

        const acceptedAt = new Date().toISOString()
        const consentMetadata = buildRegistrationConsentMetadata(
            {
                privacyPolicy: form.acceptPrivacy,
                termsOfService: form.acceptTerms,
                clinicalData: true,
                aiProcessing: false,
                internationalTransfer: true,
            },
            acceptedAt
        )

        const yearsExperience = Number(form.yearsExperience)
        const credentials = parseCredentials(form.credentials)

        const { error: signUpError } = await supabase.auth.signUp({
            email: form.email.trim().toLowerCase(),
            password: form.password,
            options: {
                emailRedirectTo: buildAuthCallbackUrl({ nextPath: '/dashboard' }),
                data: {
                    registration_role: 'ponente',
                    full_name: form.fullName.trim(),
                    avatar_url: form.photoUrl.trim(),
                    consent_version: CONSENT_POLICY_VERSION,
                    consent_accepted_at: acceptedAt,
                    consents: consentMetadata.consents,
                    speaker_application: {
                        phone: form.phone.trim(),
                        professional_id: form.professionalId.trim(),
                        specialty: form.specialty.trim(),
                        years_experience: yearsExperience,
                        photo_url: form.photoUrl.trim(),
                        bio: form.bio.trim(),
                        credentials,
                        linkedin_url: form.linkedinUrl.trim() || null,
                        website_url: form.websiteUrl.trim() || null,
                        topic_proposal: form.topicProposal.trim() || null,
                        accepted_speaker_terms: true,
                        accepted_income_terms: true,
                        accepted_at: acceptedAt,
                        requirements_version: '2026-05-27',
                        terms_version: '2026-05-27',
                        income_terms_version: '2026-05-27',
                    },
                },
            },
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        setSuccessEmail(form.email.trim().toLowerCase())
        setForm(INITIAL_STATE)
        setLoading(false)
    }

    if (successEmail) {
        return (
            <Card className="rounded-md border-brand-border shadow-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <CardTitle>Revisa tu correo</CardTitle>
                    <CardDescription>
                        Enviamos la confirmacion a <strong>{successEmail}</strong>. Al validar tu email se procesara
                        tu alta interna como ponente.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="rounded-md border-brand-border shadow-sm">
            <CardHeader>
                <CardTitle>Solicitud de ponente</CardTitle>
                <CardDescription>
                    Todos los campos marcados como obligatorios se usan para validar el alta automatica.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="speaker-full-name">Nombre completo</Label>
                            <Input id="speaker-full-name" value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-email">Correo</Label>
                            <Input id="speaker-email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-password">Contrasena</Label>
                            <Input id="speaker-password" type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-confirm-password">Confirmar contrasena</Label>
                            <Input id="speaker-confirm-password" type="password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-phone">Telefono</Label>
                            <Input id="speaker-phone" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-professional-id">Cedula o credencial profesional</Label>
                            <Input id="speaker-professional-id" value={form.professionalId} onChange={(event) => updateField('professionalId', event.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-specialty">Especialidad principal</Label>
                            <Input id="speaker-specialty" value={form.specialty} onChange={(event) => updateField('specialty', event.target.value)} placeholder="Psicoterapia, neuropsicologia, forense..." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-years">Anos de experiencia</Label>
                            <Input id="speaker-years" type="number" min={1} value={form.yearsExperience} onChange={(event) => updateField('yearsExperience', event.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="speaker-photo">URL directa de foto profesional</Label>
                        <Input id="speaker-photo" type="url" value={form.photoUrl} onChange={(event) => updateField('photoUrl', event.target.value)} placeholder="https://..." required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="speaker-bio">Bio profesional</Label>
                        <Textarea id="speaker-bio" value={form.bio} onChange={(event) => updateField('bio', event.target.value)} rows={5} placeholder="Resume tu trayectoria, enfoque y experiencia docente." required />
                        <p className="text-xs text-muted-foreground">{form.bio.trim().length}/80 caracteres minimos</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="speaker-credentials">Credenciales o formaciones</Label>
                            <Textarea id="speaker-credentials" value={form.credentials} onChange={(event) => updateField('credentials', event.target.value)} rows={4} placeholder="Una por linea o separadas por coma." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-topic">Tema que te interesa impartir</Label>
                            <Textarea id="speaker-topic" value={form.topicProposal} onChange={(event) => updateField('topicProposal', event.target.value)} rows={4} placeholder="Ej. taller introductorio, masterclass, formacion..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-linkedin">LinkedIn o red profesional</Label>
                            <Input id="speaker-linkedin" type="url" value={form.linkedinUrl} onChange={(event) => updateField('linkedinUrl', event.target.value)} placeholder="https://..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speaker-website">Sitio web</Label>
                            <Input id="speaker-website" type="url" value={form.websiteUrl} onChange={(event) => updateField('websiteUrl', event.target.value)} placeholder="https://..." />
                        </div>
                    </div>

                    <div className="space-y-3 rounded-md border border-brand-border bg-muted/25 p-4">
                        {[
                            {
                                key: 'acceptPrivacy' as const,
                                label: <>Acepto el <Link href="/aviso-privacidad" className="text-primary hover:underline">Aviso de Privacidad</Link>.</>,
                            },
                            {
                                key: 'acceptTerms' as const,
                                label: <>Acepto los <Link href="/terminos" className="text-primary hover:underline">Terminos del Servicio</Link>.</>,
                            },
                            {
                                key: 'acceptSpeakerTerms' as const,
                                label: 'Confirmo que mi informacion profesional es veraz y que SAPIHUM puede revisar mi perfil antes de publicarlo.',
                            },
                            {
                                key: 'acceptIncomeTerms' as const,
                                label: 'Acepto el sistema de ingresos descrito: 80/20 en venta directa atribuida y 50/50 en canal SAPIHUM, salvo reglas especiales aprobadas.',
                            },
                        ].map((item) => (
                            <label key={item.key} className="flex cursor-pointer items-start gap-3 text-sm leading-6">
                                <input
                                    type="checkbox"
                                    checked={form[item.key]}
                                    onChange={(event) => updateField(item.key, event.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-input accent-primary"
                                    required
                                />
                                <span>{item.label}</span>
                            </label>
                        ))}
                    </div>

                    <Button type="submit" className="w-full font-semibold" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando solicitud
                            </>
                        ) : (
                            'Enviar solicitud y crear cuenta'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

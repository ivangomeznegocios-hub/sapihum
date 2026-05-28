'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Sparkles, User, Award, BarChart } from 'lucide-react'
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
            ['email', 'Ingresa tu correo electrónico.'],
            ['phone', 'Ingresa un teléfono de contacto.'],
            ['professionalId', 'Ingresa tu cédula, registro o credencial profesional.'],
            ['specialty', 'Ingresa tu especialidad principal.'],
            ['yearsExperience', 'Ingresa tus años de experiencia.'],
            ['photoUrl', 'Agrega una URL directa de tu foto profesional.'],
            ['bio', 'Escribe una bio profesional.'],
        ]

        for (const [key, message] of requiredText) {
            if (typeof form[key] === 'string' && !form[key].trim()) return message
        }

        if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
        if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden.'

        const yearsExperience = Number(form.yearsExperience)
        if (!Number.isInteger(yearsExperience) || yearsExperience < 1) {
            return 'Ingresa los años de experiencia como número entero mayor a 0.'
        }

        if (form.bio.trim().length < 80) {
            return 'La bio debe tener al menos 80 caracteres para que nuestro comité evalúe tu perfil correctamente.'
        }

        if (!isLikelyDirectImageUrl(form.photoUrl.trim())) {
            return 'La foto debe ser una URL directa a una imagen pública (JPG, PNG, WebP, AVIF, GIF o SVG).'
        }

        if (!form.acceptPrivacy || !form.acceptTerms || !form.acceptSpeakerTerms || !form.acceptIncomeTerms) {
            return 'Debes aceptar la privacidad, términos, reglas de ponente y condiciones de ingresos.'
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
            <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="text-center py-8">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                        <CheckCircle2 className="h-10 w-10 animate-bounce" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-brand-text-strong">¡Solicitud recibida con éxito!</CardTitle>
                    <CardDescription className="mt-4 text-base text-brand-text-muted">
                        Hemos enviado un enlace de confirmación a tu dirección de correo electrónico: <strong className="text-brand-text-strong">{successEmail}</strong>.
                    </CardDescription>
                    <p className="mt-4 text-sm text-brand-text-muted max-w-md mx-auto leading-relaxed">
                        Una vez verifiques tu cuenta a través del enlace de correo, podrás iniciar sesión y acceder de forma inmediata a tu panel privado de ponente para comenzar a estructurar tus cursos.
                    </p>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-6 pt-8 pb-6 border-b border-brand-border/40">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand-blue" />
                    <CardTitle className="text-xl font-extrabold text-brand-text-strong">Formulario de Postulación</CardTitle>
                </div>
                <CardDescription className="mt-2 text-sm text-brand-text-muted">
                    Todos los datos proporcionados son tratados con estricta confidencialidad académica y profesional.
                </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {error && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive leading-relaxed font-semibold">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* SECCIÓN 1: DATOS BÁSICOS */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-blue-dark flex items-center gap-1.5 border-b border-brand-border/40 pb-1">
                            <User className="h-4 w-4" /> Datos de Identidad
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-full-name" className="text-xs font-bold text-brand-text-strong">Nombre completo *</Label>
                                <Input 
                                    id="speaker-full-name" 
                                    value={form.fullName} 
                                    onChange={(event) => updateField('fullName', event.target.value)} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="Ej: Dr. Alejandro Gómez"
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-email" className="text-xs font-bold text-brand-text-strong">Correo electrónico *</Label>
                                <Input 
                                    id="speaker-email" 
                                    type="email" 
                                    value={form.email} 
                                    onChange={(event) => updateField('email', event.target.value)} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="ejemplo@correo.com"
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-password" className="text-xs font-bold text-brand-text-strong">Contraseña de acceso *</Label>
                                <Input 
                                    id="speaker-password" 
                                    type="password" 
                                    value={form.password} 
                                    onChange={(event) => updateField('password', event.target.value)} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="Mínimo 8 caracteres"
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-confirm-password" className="text-xs font-bold text-brand-text-strong">Confirmar contraseña *</Label>
                                <Input 
                                    id="speaker-confirm-password" 
                                    type="password" 
                                    value={form.confirmPassword} 
                                    onChange={(event) => updateField('confirmPassword', event.target.value)} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="Repite la contraseña"
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-phone" className="text-xs font-bold text-brand-text-strong">Teléfono de contacto *</Label>
                                <Input 
                                    id="speaker-phone" 
                                    value={form.phone} 
                                    onChange={(event) => updateField('phone', event.target.value)} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="+52 55 1234 5678"
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-professional-id" className="text-xs font-bold text-brand-text-strong">Cédula o registro profesional *</Label>
                                <Input 
                                    id="speaker-professional-id" 
                                    value={form.professionalId} 
                                    onChange={(event) => updateField('professionalId', event.target.value)} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="Número de cédula/licencia"
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: PERFIL ACADÉMICO */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-blue-dark flex items-center gap-1.5 border-b border-brand-border/40 pb-1">
                            <Award className="h-4 w-4" /> Trayectoria Académica
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-specialty" className="text-xs font-bold text-brand-text-strong">Especialidad académica principal *</Label>
                                <Input 
                                    id="speaker-specialty" 
                                    value={form.specialty} 
                                    onChange={(event) => updateField('specialty', event.target.value)} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="Terapia Cognitivo-Conductual, Neuropsicología..." 
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-years" className="text-xs font-bold text-brand-text-strong">Años de experiencia profesional *</Label>
                                <Input 
                                    id="speaker-years" 
                                    type="number" 
                                    min={1} 
                                    value={form.yearsExperience} 
                                    onChange={(event) => updateField('yearsExperience', event.target.value)} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="speaker-photo" className="text-xs font-bold text-brand-text-strong">Enlace (URL) directo a tu fotografía profesional *</Label>
                            <Input 
                                id="speaker-photo" 
                                type="url" 
                                value={form.photoUrl} 
                                onChange={(event) => updateField('photoUrl', event.target.value)} 
                                className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                placeholder="https://ejemplo.com/mi-foto-profesional.jpg" 
                                required 
                            />
                            <p className="text-[10px] text-brand-text-muted">Debe ser un enlace directo a una imagen de alta resolución (PNG, JPG, WebP) alojada públicamente.</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="speaker-bio" className="text-xs font-bold text-brand-text-strong">Resumen de biografía profesional *</Label>
                            <Textarea 
                                id="speaker-bio" 
                                value={form.bio} 
                                onChange={(event) => updateField('bio', event.target.value)} 
                                rows={4} 
                                className="border-brand-border focus-visible:ring-brand-blue text-sm resize-y"
                                placeholder="Resume tu trayectoria clínica, experiencia docente, enfoques terapéuticos y publicaciones..." 
                                required 
                            />
                            <div className="flex justify-between text-[10px] text-brand-text-muted">
                                <span>Mínimo 80 caracteres para validación institucional.</span>
                                <span className={form.bio.trim().length >= 80 ? 'text-green-600 font-bold' : 'text-brand-blue-dark font-bold'}>
                                    {form.bio.trim().length} caracteres ingresados
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: PROPUESTA DOCENTE */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-blue-dark flex items-center gap-1.5 border-b border-brand-border/40 pb-1">
                            <BarChart className="h-4 w-4" /> Propuesta Docente e Información Adicional
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-credentials" className="text-xs font-bold text-brand-text-strong">Credenciales y títulos clave</Label>
                                <Textarea 
                                    id="speaker-credentials" 
                                    value={form.credentials} 
                                    onChange={(event) => updateField('credentials', event.target.value)} 
                                    rows={3} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="Ej: Maestría en Psicología Clínica (UNAM), Especialidad en Ansiedad. (Una por línea)" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-topic" className="text-xs font-bold text-brand-text-strong">Propuesta de tema a impartir</Label>
                                <Textarea 
                                    id="speaker-topic" 
                                    value={form.topicProposal} 
                                    onChange={(event) => updateField('topicProposal', event.target.value)} 
                                    rows={3} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="Ej: Masterclass práctica de intervención en trauma complejo infantil." 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-linkedin" className="text-xs font-bold text-brand-text-strong">Enlace a perfil de LinkedIn</Label>
                                <Input 
                                    id="speaker-linkedin" 
                                    type="url" 
                                    value={form.linkedinUrl} 
                                    onChange={(event) => updateField('linkedinUrl', event.target.value)} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="https://linkedin.com/in/tu-perfil" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="speaker-website" className="text-xs font-bold text-brand-text-strong">Enlace a Sitio Web profesional</Label>
                                <Input 
                                    id="speaker-website" 
                                    type="url" 
                                    value={form.websiteUrl} 
                                    onChange={(event) => updateField('websiteUrl', event.target.value)} 
                                    className="border-brand-border focus-visible:ring-brand-blue text-sm"
                                    placeholder="https://miweb.com" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN DE TÉRMINOS Y CONSENTIMIENTOS */}
                    <div className="space-y-3 rounded-xl border border-brand-border bg-brand-surface-soft/60 p-5 pt-4">
                        {[
                            {
                                key: 'acceptPrivacy' as const,
                                label: <>Acepto el <Link href="/aviso-privacidad" className="text-brand-blue hover:underline font-bold">Aviso de Privacidad</Link> institucional de SAPIHUM.</>,
                            },
                            {
                                key: 'acceptTerms' as const,
                                label: <>Acepto los <Link href="/terminos" className="text-brand-blue hover:underline font-bold">Términos de Servicio</Link> y colaboración académica.</>,
                            },
                            {
                                key: 'acceptSpeakerTerms' as const,
                                label: 'Confirmo bajo protesta de decir verdad que toda mi información y títulos declarados son plenamente válidos.',
                            },
                            {
                                key: 'acceptIncomeTerms' as const,
                                label: 'Acepto el sistema de retribuciones detallado en la landing page: 80% en venta directa atribuida y 50% en ventas del canal SAPIHUM.',
                            },
                        ].map((item) => (
                            <label key={item.key} className="flex cursor-pointer items-start gap-3.5 text-xs text-brand-text-muted leading-relaxed">
                                <input
                                    type="checkbox"
                                    checked={form[item.key]}
                                    onChange={(event) => updateField(item.key, event.target.checked)}
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-border accent-brand-blue cursor-pointer"
                                    required
                                />
                                <span className="select-none">{item.label}</span>
                            </label>
                        ))}
                    </div>

                    {/* BOTÓN DE SUBMIT */}
                    <Button 
                        type="submit" 
                        className="w-full py-6 font-bold text-base bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg shadow-brand-glow hover:shadow-brand-hover transition-all sapihum-glow-cta cursor-pointer" 
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Validando y enviando solicitud...
                            </span>
                        ) : (
                            'Enviar Solicitud Académica y Crear Cuenta'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

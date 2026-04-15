'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { buildRegistrationConsentMetadata, CONSENT_POLICY_VERSION } from '@/lib/consent'
import { collectAnalyticsEvent, getClientAnalyticsContext } from '@/lib/analytics/client'
import { brandCommunityLabel } from '@/lib/brand'
import { buildAuthCallbackUrl } from '@/lib/config/app-url'

function normalizeRegistrationValue(value: string | null): string {
    return (value || '').trim().toLowerCase()
}

function isLevel2Intent(plan: string | null, specialization: string | null): boolean {
    const normalizedPlan = normalizeRegistrationValue(plan)
    const normalizedSpecialization = normalizeRegistrationValue(specialization)

    if (normalizedPlan) {
        if (
            ['level1', 'nivel1', '1', 'free', 'basico', 'basic', 'registro', 'starter', 'general'].includes(
                normalizedPlan
            )
        ) {
            return false
        }

        if (['level2', 'nivel2', '2', 'clinica'].includes(normalizedPlan)) {
            return true
        }
    }

    return Boolean(normalizedSpecialization)
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <Card className="border-border/50 shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Cargando...</CardTitle>
                    </CardHeader>
                </Card>
            }
        >
            <RegisterForm />
        </Suspense>
    )
}

function RegisterForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [clinicalDataAccepted, setClinicalDataAccepted] = useState(false)
    const [aiProcessingAccepted, setAiProcessingAccepted] = useState(false)
    const [internationalTransferAccepted, setInternationalTransferAccepted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const searchParams = useSearchParams()
    const supabase = createClient()
    const requestedNext = searchParams.get('next')
    const nextPath = requestedNext?.startsWith('/') ? requestedNext : '/dashboard'

    const [referralCode, setReferralCode] = useState<string | null>(null)
    const [preselectedPlan, setPreselectedPlan] = useState<string | null>(null)
    const [preselectedSpecialization, setPreselectedSpecialization] = useState<string | null>(null)

    useEffect(() => {
        const ref = searchParams.get('ref')
        const plan = searchParams.get('plan')
        const specialization = searchParams.get('specialization')

        if (ref) {
            const code = ref.toUpperCase()
            setReferralCode(code)
            localStorage.setItem('invite_ref_code', code)
        } else {
            const storedRef = localStorage.getItem('invite_ref_code')
            if (storedRef) setReferralCode(storedRef)
        }

        if (plan) {
            setPreselectedPlan(plan)
            localStorage.setItem('preselected_plan', plan)
        } else {
            const storedPlan = localStorage.getItem('preselected_plan')
            if (storedPlan) setPreselectedPlan(storedPlan)
        }

        if (specialization) {
            setPreselectedSpecialization(specialization)
            localStorage.setItem('preselected_specialization', specialization)
        } else {
            const storedSpecialization = localStorage.getItem('preselected_specialization')
            if (storedSpecialization) setPreselectedSpecialization(storedSpecialization)
        }
    }, [searchParams])

    const requiresLevel2Compliance = isLevel2Intent(preselectedPlan, preselectedSpecialization)

    useEffect(() => {
        if (!requiresLevel2Compliance) {
            setPrivacyPolicyAccepted(false)
            setTermsAccepted(false)
            setClinicalDataAccepted(false)
            setAiProcessingAccepted(false)
            setInternationalTransferAccepted(false)
        }
    }, [requiresLevel2Compliance])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (password !== confirmPassword) {
            setError('Las contrasenas no coinciden')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('La contrasena debe tener al menos 6 caracteres')
            setLoading(false)
            return
        }

        const signUpMetadata: Record<string, unknown> = {}
        const refCode = referralCode || localStorage.getItem('invite_ref_code')
        if (refCode) signUpMetadata.invite_ref_code = refCode

        const selectedPlan = preselectedPlan || localStorage.getItem('preselected_plan')
        const selectedSpecialization = preselectedSpecialization || localStorage.getItem('preselected_specialization')
        if (selectedPlan) signUpMetadata.preselected_plan = selectedPlan
        if (selectedSpecialization) signUpMetadata.preselected_specialization = selectedSpecialization

        const analyticsContext = getClientAnalyticsContext({
            funnel: 'registration',
            targetPlan: selectedPlan,
            targetSpecialization: selectedSpecialization,
            ref: refCode,
        })
        if (analyticsContext?.visitorId) signUpMetadata.analytics_visitor_id = analyticsContext.visitorId
        if (analyticsContext?.sessionId) signUpMetadata.analytics_session_id = analyticsContext.sessionId
        if (analyticsContext?.consent) signUpMetadata.analytics_consent = analyticsContext.consent
        if (analyticsContext?.touch) signUpMetadata.analytics_touch = analyticsContext.touch

        await collectAnalyticsEvent('registration_started', {
            properties: {
                hasInviteCode: Boolean(refCode),
                selectedPlan: selectedPlan ?? null,
                selectedSpecialization: selectedSpecialization ?? null,
            },
            touch: {
                funnel: 'registration',
                targetPlan: selectedPlan,
                targetSpecialization: selectedSpecialization,
                ref: refCode,
            },
        })

        const requiresComplianceForThisSignup = isLevel2Intent(selectedPlan, selectedSpecialization)
        if (requiresComplianceForThisSignup && (!privacyPolicyAccepted || !termsAccepted || !clinicalDataAccepted)) {
            setError('Para Nivel 2 debes aceptar aviso de privacidad, terminos y tratamiento de datos sensibles')
            setLoading(false)
            return
        }

        if (requiresComplianceForThisSignup) {
            const acceptedAt = new Date().toISOString()
            const consentMetadata = buildRegistrationConsentMetadata(
                {
                    privacyPolicy: privacyPolicyAccepted,
                    termsOfService: termsAccepted,
                    clinicalData: clinicalDataAccepted,
                    aiProcessing: aiProcessingAccepted,
                    internationalTransfer: internationalTransferAccepted,
                },
                acceptedAt
            )

            signUpMetadata.consent_version = CONSENT_POLICY_VERSION
            signUpMetadata.consent_accepted_at = acceptedAt
            signUpMetadata.consents = consentMetadata.consents
        }

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: buildAuthCallbackUrl({ nextPath }),
                data: {
                    ...signUpMetadata,
                },
            },
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        await collectAnalyticsEvent('registration_completed', {
            properties: {
                hasInviteCode: Boolean(refCode),
                selectedPlan: selectedPlan ?? null,
                selectedSpecialization: selectedSpecialization ?? null,
            },
            touch: {
                funnel: 'registration',
                targetPlan: selectedPlan,
                targetSpecialization: selectedSpecialization,
                ref: refCode,
            },
        })

        setSuccess(true)
        setLoading(false)
    }

    if (success) {
        return (
            <Card className="border-border/50 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                            <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Revisa tu correo</CardTitle>
                    <CardDescription>
                        Te enviamos un enlace de confirmacion a <strong>{email}</strong>
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="w-full">
                        <Button variant="outline" className="w-full">
                            Volver al inicio de sesion
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="border-border/50 shadow-xl">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                        </svg>
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
                <CardDescription>Únete a {brandCommunityLabel}</CardDescription>

                {(preselectedPlan || preselectedSpecialization) && (
                    <div className="mt-3 rounded-md border border-brand-yellow bg-brand-yellow px-3 py-2 text-left text-xs text-brand-yellow">
                        {preselectedPlan && <p>Plan sugerido: {preselectedPlan}</p>}
                        {preselectedSpecialization && <p>Especializacion sugerida: {preselectedSpecialization}</p>}
                    </div>
                )}
            </CardHeader>

            <form
                onSubmit={handleRegister}
                data-analytics-form="register"
                data-analytics-surface="auth_register"
                data-analytics-funnel="registration"
                data-analytics-plan={preselectedPlan ?? ''}
                data-analytics-specialization={preselectedSpecialization ?? ''}
            >
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="inviteCode">
                            Codigo de Invitacion <span className="text-muted-foreground font-normal">(Opcional)</span>
                        </Label>
                        <Input
                            id="inviteCode"
                            type="text"
                            placeholder="Ej. ABC12345"
                            value={referralCode || ''}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            className={referralCode ? 'border-green-500/50 bg-green-500/5 focus-visible:ring-green-500/50 uppercase' : 'uppercase'}
                        />
                        {referralCode && (
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                Codigo de invitacion aplicado
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Correo electronico</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contrasena</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="********"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {requiresLevel2Compliance && (
                        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold">Consentimientos legales</h3>
                                <p className="text-xs text-muted-foreground">
                                    Registramos la version vigente ({CONSENT_POLICY_VERSION}) de cada consentimiento para respaldar el cumplimiento.
                                </p>
                            </div>

                            <label className="flex items-start gap-3 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={privacyPolicyAccepted}
                                    onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-input accent-primary"
                                    required
                                />
                                <span>
                                    Acepto el <Link href="/aviso-privacidad" className="text-primary hover:underline">Aviso de Privacidad</Link> y autorizo el tratamiento de mis datos personales conforme a la normativa aplicable.
                                </span>
                            </label>

                            <label className="flex items-start gap-3 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-input accent-primary"
                                    required
                                />
                                <span>
                                    Acepto los <Link href="/terminos" className="text-primary hover:underline">Términos del Servicio</Link> y confirmo que conozco el alcance de la plataforma.
                                </span>
                            </label>

                            <label className="flex items-start gap-3 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={clinicalDataAccepted}
                                    onChange={(e) => setClinicalDataAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-input accent-primary"
                                    required
                                />
                                <span>
                                    Autorizo el tratamiento de datos personales sensibles y clinicos necesarios para la prestacion del servicio profesional.
                                </span>
                            </label>

                            <label className="flex items-start gap-3 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={aiProcessingAccepted}
                                    onChange={(e) => setAiProcessingAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-input accent-primary"
                                />
                                <span>
                                    Autorizo el uso de IA para transcripcion y generacion de notas clinicas, entendiendo sus limites y riesgos.
                                </span>
                            </label>

                            <label className="flex items-start gap-3 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={internationalTransferAccepted}
                                    onChange={(e) => setInternationalTransferAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-input accent-primary"
                                />
                                <span>
                                    Autorizo la transferencia internacional de datos cuando sea necesaria para operar la plataforma y sus proveedores.
                                </span>
                            </label>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={loading} data-analytics-cta data-analytics-label="Crear cuenta" data-analytics-funnel="registration">
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                        Ya tienes cuenta?{' '}
                        <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="text-primary hover:underline font-medium">
                            Iniciar sesion
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}

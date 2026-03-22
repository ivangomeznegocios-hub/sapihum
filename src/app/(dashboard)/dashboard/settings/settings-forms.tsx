'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityEditor } from '@/components/scheduling/availability-editor'
import { ServicesEditor } from '@/components/scheduling/services-editor'
import { PaymentMethodsEditor } from '@/components/scheduling/payment-methods-editor'
import { updateProfile, updatePsychologistProfile, changePassword, acceptReferralTerms } from './actions'
import {
    User, Shield, Check, Loader2, Stethoscope,
    Clock, CreditCard, UserCog, MapPin, CheckCircle2, AlertCircle,
    GraduationCap, GitBranch
} from 'lucide-react'

// ──────────────────────────────────────────────
// Patient / Admin Profile Form
// ──────────────────────────────────────────────
interface ProfileFormProps {
    profile: {
        id: string
        full_name: string | null
        role: string
        specialty?: string | null
        subscription_status: string | null
    }
}

export function ProfileForm({ profile }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setMessage(null)
        const result = await updateProfile(formData)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
        }
        setIsLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    Perfil
                </CardTitle>
                <CardDescription>Información personal y de cuenta</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium" htmlFor="fullName">Nombre completo</label>
                        <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            defaultValue={profile.full_name || ''}
                            placeholder="Tu nombre"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Rol</label>
                        <div className="mt-1 p-3 bg-muted rounded-lg text-sm capitalize">
                            {profile.role === 'psychologist' ? 'Psicólogo' :
                                profile.role === 'patient' ? 'Paciente' :
                                    profile.role === 'admin' ? 'Administrador' : profile.role}
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success'
                            ? 'surface-alert-success dark:bg-green-900/30 dark:text-green-200'
                            : 'surface-alert-error dark:bg-red-900/30 dark:text-red-200'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {message.text}
                        </div>
                    )}

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                        ) : (
                            <><Check className="mr-2 h-4 w-4" />Guardar cambios</>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

// ──────────────────────────────────────────────
// Password Form
// ──────────────────────────────────────────────
export function PasswordForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setMessage(null)
        const result = await changePassword(formData)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' })
        }
        setIsLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    Contraseña
                </CardTitle>
                <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium" htmlFor="newPassword">Nueva contraseña</label>
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            required
                            minLength={6}
                            placeholder="Mínimo 6 caracteres"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium" htmlFor="confirmPassword">Confirmar contraseña</label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            placeholder="Repite tu nueva contraseña"
                            className="mt-1"
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success'
                            ? 'surface-alert-success dark:bg-green-900/30 dark:text-green-200'
                            : 'surface-alert-error dark:bg-red-900/30 dark:text-red-200'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {message.text}
                        </div>
                    )}

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Actualizando...</>
                        ) : (
                            <><Shield className="mr-2 h-4 w-4" />Cambiar contraseña</>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

// ──────────────────────────────────────────────
// Psychologist Full Profile Form (Tabs)
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// Constants for multi-select fields
// ──────────────────────────────────────────────
const POPULATIONS = [
    'Niños', 'Adolescentes', 'Adultos', 'Parejas',
    'Familias', 'Adultos mayores', 'Empresas/Organizaciones'
]

const APPROACHES = [
    'Cognitivo-Conductual (TCC)', 'Psicodinámico', 'Humanista',
    'Sistémico', 'Gestalt', 'Psicoanalítico', 'EMDR',
    'Terapia Breve', 'Narrativo', 'Integrativo', 'Conductual',
    'Neuropsicología', 'Otro'
]

const LANGUAGES_OPTIONS = ['Español', 'Inglés', 'Francés', 'Portugués', 'Otro']

// ──────────────────────────────────────────────
// Multi-Select Checkbox Component
// ──────────────────────────────────────────────
function MultiSelectCheckboxes({ options, selected, onChange, columns = 2 }: {
    options: string[]
    selected: string[]
    onChange: (val: string[]) => void
    columns?: number
}) {
    const toggle = (item: string) => {
        if (selected.includes(item)) {
            onChange(selected.filter(s => s !== item))
        } else {
            onChange([...selected, item])
        }
    }
    const gridClass = columns === 3
        ? 'grid-cols-2 sm:grid-cols-3'
        : columns === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1'

    return (
        <div className={`grid gap-2 ${gridClass}`}>
            {options.map(opt => (
                <label key={opt} className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer hover:text-primary transition-colors">
                    <input
                        type="checkbox"
                        checked={selected.includes(opt)}
                        onChange={() => toggle(opt)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {opt}
                </label>
            ))}
        </div>
    )
}

// ──────────────────────────────────────────────
// Psychologist Full Profile Form (Tabs)
// ──────────────────────────────────────────────
interface PsychologistProfileFormProps {
    profile: {
        id: string
        full_name: string | null
        specialty?: string | null
        bio?: string | null
        hourly_rate?: number | null
        services?: any[]
        availability?: any
        payment_methods?: any
        office_address?: string | null
        phone?: string | null
        cedula_profesional?: string | null
        populations_served?: string[]
        therapeutic_approaches?: string[]
        languages?: string[]
        years_experience?: number | null
        education?: string | null
        accepts_referral_terms?: boolean
        referral_terms_accepted_at?: string | null
    }
}

export function PsychologistProfileForm({ profile }: PsychologistProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [fullName, setFullName] = useState(profile.full_name || '')
    const [specialty, setSpecialty] = useState(profile.specialty || '')
    const [bio, setBio] = useState(profile.bio || '')
    const [hourlyRate, setHourlyRate] = useState(profile.hourly_rate || 0)
    const [officeAddress, setOfficeAddress] = useState(profile.office_address || '')
    const [services, setServices] = useState(profile.services || [])
    const [availability, setAvailability] = useState(profile.availability || {})
    const [paymentMethods, setPaymentMethods] = useState(profile.payment_methods || {})

    // New professional fields
    const [phone, setPhone] = useState(profile.phone || '')
    const [cedula, setCedula] = useState(profile.cedula_profesional || '')
    const [populationsServed, setPopulationsServed] = useState<string[]>(profile.populations_served || [])
    const [approaches, setApproaches] = useState<string[]>(profile.therapeutic_approaches || [])
    const [languages, setLanguages] = useState<string[]>(profile.languages || ['Español'])
    const [yearsExperience, setYearsExperience] = useState(profile.years_experience || 0)
    const [education, setEducation] = useState(profile.education || '')

    // Referral terms
    const [acceptsTerms, setAcceptsTerms] = useState(profile.accepts_referral_terms || false)
    const [termsLoading, setTermsLoading] = useState(false)
    const [termsMessage, setTermsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const visibleTermsMessage = termsMessage?.type === 'success'
        ? (acceptsTerms
            ? 'Has aceptado los lineamientos de canalizacion clinica. Ya puedes participar en la red.'
            : 'Has revocado tu aceptacion de los lineamientos de canalizacion clinica.')
        : termsMessage?.text

    async function handleSubmit() {
        setIsLoading(true)
        setMessage(null)

        const result = await updatePsychologistProfile({
            fullName,
            specialty,
            bio,
            hourlyRate,
            officeAddress,
            services,
            availability,
            paymentMethods,
            phone,
            cedulaProfesional: cedula,
            populationsServed,
            therapeuticApproaches: approaches,
            languages,
            yearsExperience,
            education
        })

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: '¡Perfil profesional actualizado!' })
        }

        setIsLoading(false)
    }

    async function handleAcceptTerms() {
        setTermsLoading(true)
        setTermsMessage(null)
        const result = await acceptReferralTerms(!acceptsTerms)
        if (result.error) {
            setTermsMessage({ type: 'error', text: result.error })
        } else {
            setAcceptsTerms(!acceptsTerms)
            setTermsMessage({
                type: 'success',
                text: !acceptsTerms
                    ? '¡Términos de derivación aceptados! Ya puedes participar en el sistema.'
                    : 'Has revocado tu aceptación de los términos de derivación.'
            })
        }
        setTermsLoading(false)
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCog className="h-5 w-5 text-primary" />
                    Perfil Profesional
                </CardTitle>
                <CardDescription>
                    Gestiona tu información, servicios, disponibilidad y métodos de pago
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6 mb-6">
                        <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">General</span>
                        </TabsTrigger>
                        <TabsTrigger value="professional" className="gap-1.5 text-xs sm:text-sm">
                            <GraduationCap className="h-4 w-4" />
                            <span className="hidden sm:inline">Profesional</span>
                        </TabsTrigger>
                        <TabsTrigger value="services" className="gap-1.5 text-xs sm:text-sm">
                            <Stethoscope className="h-4 w-4" />
                            <span className="hidden sm:inline">Servicios</span>
                        </TabsTrigger>
                        <TabsTrigger value="availability" className="gap-1.5 text-xs sm:text-sm">
                            <Clock className="h-4 w-4" />
                            <span className="hidden sm:inline">Agenda</span>
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="gap-1.5 text-xs sm:text-sm">
                            <CreditCard className="h-4 w-4" />
                            <span className="hidden sm:inline">Pagos</span>
                        </TabsTrigger>
                        <TabsTrigger value="referrals" className="gap-1.5 text-xs sm:text-sm">
                            <GitBranch className="h-4 w-4" />
                            <span className="hidden sm:inline">Canalizacion</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ── General Tab ── */}
                    <TabsContent value="general" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">Nombre Completo</label>
                                <Input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="mt-1"
                                    placeholder="Tu nombre completo"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Especialidad</label>
                                <Input
                                    type="text"
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                    className="mt-1"
                                    placeholder="Ej: Psicólogo Clínico"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Precio por Hora Base (MXN)</label>
                            <Input
                                type="number"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                                className="mt-1"
                                placeholder="800"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Referencia general. Los precios específicos se configuran por servicio.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                Dirección del Consultorio
                            </label>
                            <Input
                                type="text"
                                value={officeAddress}
                                onChange={(e) => setOfficeAddress(e.target.value)}
                                className="mt-1"
                                placeholder="Calle, Colonia, Ciudad, Estado"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Los pacientes verán esta dirección al agendar citas presenciales.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Biografía Profesional</label>
                            <Textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="mt-1 h-28 resize-none"
                                placeholder="Describe tu experiencia y enfoque terapéutico..."
                            />
                        </div>
                    </TabsContent>

                    {/* ── Professional Tab ── */}
                    <TabsContent value="professional" className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">Cédula Profesional</label>
                                <Input
                                    type="text"
                                    value={cedula}
                                    onChange={(e) => setCedula(e.target.value)}
                                    className="mt-1"
                                    placeholder="Ej: 12345678"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Teléfono de Contacto</label>
                                <Input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="mt-1"
                                    placeholder="+52 55 1234 5678"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">Años de Experiencia</label>
                                <Input
                                    type="number"
                                    value={yearsExperience}
                                    onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                                    className="mt-1"
                                    min={0}
                                    placeholder="5"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Idiomas</label>
                                <div className="mt-2">
                                    <MultiSelectCheckboxes
                                        options={LANGUAGES_OPTIONS}
                                        selected={languages}
                                        onChange={setLanguages}
                                        columns={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Formación Académica</label>
                            <Textarea
                                value={education}
                                onChange={(e) => setEducation(e.target.value)}
                                className="mt-1 h-20 resize-none"
                                placeholder="Ej: Lic. en Psicología - UNAM, Maestría en Terapia Familiar - UAEM..."
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Poblaciones que Atiendes</label>
                            <p className="text-xs text-muted-foreground mb-2">Selecciona los tipos de pacientes con los que trabajas</p>
                            <MultiSelectCheckboxes
                                options={POPULATIONS}
                                selected={populationsServed}
                                onChange={setPopulationsServed}
                                columns={2}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Enfoques Terapéuticos</label>
                            <p className="text-xs text-muted-foreground mb-2">Selecciona tus enfoques de trabajo</p>
                            <MultiSelectCheckboxes
                                options={APPROACHES}
                                selected={approaches}
                                onChange={setApproaches}
                                columns={2}
                            />
                        </div>
                    </TabsContent>

                    {/* ── Services Tab ── */}
                    <TabsContent value="services">
                        <ServicesEditor value={services} onChange={setServices} />
                    </TabsContent>

                    {/* ── Availability Tab ── */}
                    <TabsContent value="availability">
                        <AvailabilityEditor value={availability} onChange={setAvailability} />
                    </TabsContent>

                    {/* ── Payments Tab ── */}
                    <TabsContent value="payments">
                        <PaymentMethodsEditor value={paymentMethods} onChange={setPaymentMethods} />
                    </TabsContent>

                    {/* ── Referrals / Derivaciones Tab ── */}
                    <TabsContent value="referrals" className="space-y-6">
                        <div className="rounded-lg border p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${acceptsTerms ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    <GitBranch className={`h-6 w-6 ${acceptsTerms ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">Canalizacion Clinica</h3>
                                    <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
                                        Esta red prohbe comisiones, porcentajes, bonos o pagos por recomendar, canalizar o recibir pacientes.
                                    </p>
                                    <div className="mt-3 rounded-lg bg-muted/50 p-4 space-y-3 text-sm">
                                        <h4 className="font-medium">Lineamientos de Canalizacion Clinica:</h4>
                                        <ul className="space-y-2 text-muted-foreground">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span>La canalizacion se define por ajuste clinico, continuidad de cuidado y necesidad real del paciente.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span>No existe comision, bono, porcentaje ni retribucion economica por mover pacientes entre colegas.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span>Comparte solo la informacion necesaria y respeta consentimiento, confidencialidad y trazabilidad clinica.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span>La administracion supervisa las canalizaciones para cuidar el mejor ajuste para cada paciente.</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <p className="hidden text-sm text-muted-foreground mt-1">
                                        Al aceptar, puedes derivar pacientes a colegas y recibir derivaciones de otros psicólogos.
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Al aceptar, puedes canalizar pacientes con trazabilidad clinica y recibir solicitudes de continuidad de cuidado de otros colegas.
                                    </p>
                                </div>
                            </div>

                            <div className="hidden">
                                <h4 className="font-medium">Términos del Sistema de Derivaciones:</h4>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>Cuando derives un paciente a otro colega, recibirás el <strong className="text-foreground">100% de la primera sesión</strong> como comisión.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>Cuando recibas un paciente derivado, la primera sesión será comisión para el colega que te lo refirió.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>La derivación prioriza la ética profesional: se busca el mejor ajuste para el paciente.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>Los administradores supervisan y gestionan todas las derivaciones.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="hidden">
                            {acceptsTerms && profile.referral_terms_accepted_at && (
                                <p className="text-xs text-muted-foreground">
                                    Términos aceptados el {new Date(profile.referral_terms_accepted_at).toLocaleDateString('es-MX', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </p>
                            )}
                            </div>
                            {acceptsTerms && profile.referral_terms_accepted_at && (
                                <p className="text-xs text-muted-foreground">
                                    Lineamientos aceptados el {new Date(profile.referral_terms_accepted_at).toLocaleDateString('es-MX', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </p>
                            )}

                            {termsMessage && (
                                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${termsMessage.type === 'success'
                                        ? 'surface-alert-success dark:bg-green-900/30 dark:text-green-200'
                                        : 'surface-alert-error dark:bg-red-900/30 dark:text-red-200'
                                    }`}>
                                    {termsMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {visibleTermsMessage}
                                </div>
                            )}

                            <div className="hidden">
                            <Button
                                onClick={handleAcceptTerms}
                                disabled={termsLoading}
                                variant={acceptsTerms ? 'outline' : 'default'}
                                className="w-full"
                            >
                                {termsLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</>
                                ) : acceptsTerms ? (
                                    <><Shield className="mr-2 h-4 w-4" />Revocar Aceptación de Términos</>
                                ) : (
                                    <><Check className="mr-2 h-4 w-4" />Aceptar Términos de Derivación</>
                                )}
                            </Button>
                            </div>
                            <Button
                                onClick={handleAcceptTerms}
                                disabled={termsLoading}
                                variant={acceptsTerms ? 'outline' : 'default'}
                                className="w-full"
                            >
                                {termsLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</>
                                ) : acceptsTerms ? (
                                    <><Shield className="mr-2 h-4 w-4" />Revocar Lineamientos Clinicos</>
                                ) : (
                                    <><Check className="mr-2 h-4 w-4" />Aceptar Lineamientos Clinicos</>
                                )}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Feedback */}
                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success'
                        ? 'surface-alert-success dark:bg-green-900/30 dark:text-green-200'
                        : 'surface-alert-error dark:bg-red-900/30 dark:text-red-200'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {message.text}
                    </div>
                )}

                {/* Submit */}
                <div className="mt-6 flex justify-end">
                    <Button onClick={handleSubmit} disabled={isLoading} className="w-full min-w-0 sm:w-auto sm:min-w-[160px]">
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                        ) : (
                            <><Check className="mr-2 h-4 w-4" />Guardar Todo</>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}


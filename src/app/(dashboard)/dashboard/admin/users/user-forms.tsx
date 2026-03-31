'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    updateUserRole,
    assignPatientToPsychologist,
    adminUpdateProfile,
    adminCreateUser,
    adminConfirmUserEmail,
    adminUpdateMembership,
} from './actions'
import { LEVEL_2_DEFAULT_SPECIALIZATION, getMembershipSpecializations } from '@/lib/specializations'
import { X, Loader2, UserCog, Link2, Shield, User as UserIcon, UserPlus, MailCheck, Sparkles } from 'lucide-react'

export interface User {
    id: string
    full_name: string | null
    role: string
    bio?: string | null
    specialty?: string | null
    hourly_rate?: number | null
    membership_level?: number | null
    membership_specialization_code?: string | null
    subscription_status?: string | null
    email_confirmed_at?: string | null
    is_test?: boolean
}

interface RoleChangeFormProps {
    user: User
    onClose: () => void
}

export function RoleChangeForm({ user, onClose }: RoleChangeFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedRole, setSelectedRole] = useState(user.role)

    async function handleSubmit() {
        if (selectedRole === user.role) {
            onClose()
            return
        }

        setIsLoading(true)
        setError(null)

        const result = await updateUserRole(user.id, selectedRole)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
            <Card className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto border-border/80 shadow-2xl">
                <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" />
                        Cambiar Rol
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Usuario:</p>
                        <p className="font-medium">{user.full_name || 'Sin nombre'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Nuevo rol</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="patient">Paciente</option>
                            <option value="psychologist">Psicólogo</option>
                            <option value="ponente">Ponente</option>
                            <option value="support">Soporte</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    {error && (
                        <div className="surface-alert-error rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

interface UserEditFormProps {
    user: User
    onClose: () => void
}

const MEMBERSHIP_SPECIALIZATIONS = getMembershipSpecializations()

interface ConfirmEmailFormProps {
    user: User
    onClose: () => void
}

export function ConfirmEmailForm({ user, onClose }: ConfirmEmailFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit() {
        setIsLoading(true)
        setError(null)

        const result = await adminConfirmUserEmail(user.id)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            return
        }

        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
            <Card className="w-full max-w-md border-border/80 shadow-2xl">
                <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <MailCheck className="h-5 w-5" />
                        Confirmar Correo
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Esto marcara el correo de <span className="font-medium text-foreground">{user.full_name || 'este usuario'}</span> como confirmado desde admin.
                    </p>

                    {error && (
                        <div className="surface-alert-error rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar correo'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

interface MembershipChangeFormProps {
    user: User
    onClose: () => void
}

export function MembershipChangeForm({ user, onClose }: MembershipChangeFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [membershipLevel, setMembershipLevel] = useState(String(user.membership_level ?? 0))
    const [subscriptionStatus, setSubscriptionStatus] = useState(user.subscription_status || 'inactive')
    const [specializationCode, setSpecializationCode] = useState(
        user.membership_specialization_code || LEVEL_2_DEFAULT_SPECIALIZATION
    )

    const numericLevel = Number(membershipLevel || 0)
    const needsSpecialization = numericLevel >= 2

    async function handleSubmit() {
        setIsLoading(true)
        setError(null)

        const result = await adminUpdateMembership(user.id, {
            membershipLevel: numericLevel,
            subscriptionStatus: numericLevel <= 0 ? 'inactive' : subscriptionStatus,
            specializationCode: needsSpecialization ? specializationCode : null,
        })

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            return
        }

        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
            <Card className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto border-border/80 shadow-2xl">
                <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Cambiar Nivel
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Usuario:</p>
                        <p className="font-medium">{user.full_name || 'Sin nombre'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Nivel de membresia</label>
                        <select
                            value={membershipLevel}
                            onChange={(event) => setMembershipLevel(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="0">Nivel 0 · Sin membresia</option>
                            <option value="1">Nivel 1 · Comunidad</option>
                            <option value="2">Nivel 2 · Especializacion</option>
                            <option value="3">Nivel 3 · Avanzado</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Estado comercial</label>
                        <select
                            value={numericLevel <= 0 ? 'inactive' : subscriptionStatus}
                            onChange={(event) => setSubscriptionStatus(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            disabled={numericLevel <= 0}
                        >
                            <option value="inactive">Inactiva</option>
                            <option value="trial">Trial</option>
                            <option value="active">Activa</option>
                            <option value="past_due">Past due</option>
                            <option value="cancelled">Cancelada</option>
                        </select>
                    </div>

                    {needsSpecialization && (
                        <div>
                            <label className="text-sm font-medium">Especializacion</label>
                            <select
                                value={specializationCode}
                                onChange={(event) => setSpecializationCode(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {MEMBERSHIP_SPECIALIZATIONS.map((specialization) => (
                                    <option key={specialization.code} value={specialization.code}>
                                        {specialization.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="rounded-lg border border-brand-yellow bg-brand-yellow px-3 py-3 text-sm text-brand-yellow">
                        Este cambio sincroniza tanto el perfil como la suscripcion operativa para que accesos y permisos queden alineados.
                    </div>

                    {error && (
                        <div className="surface-alert-error rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar nivel'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function UserEditForm({ user, onClose }: UserEditFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [fullName, setFullName] = useState(user.full_name || '')
    const [bio, setBio] = useState(user.bio || '')
    const [specialty, setSpecialty] = useState(user.specialty || '')
    const [hourlyRate, setHourlyRate] = useState(user.hourly_rate?.toString() || '')
    const [isTest, setIsTest] = useState(user.is_test || false)

    async function handleSubmit() {
        setIsLoading(true)
        setError(null)

        const result = await adminUpdateProfile(user.id, {
            full_name: fullName,
            bio: bio,
            specialty: specialty,
            hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
            is_test: isTest
        })

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
            <Card className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto border-border/80 shadow-2xl">
                <CardHeader className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-card pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        Editar Perfil
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div>
                        <label className="text-sm font-medium">Nombre completo</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Biografía</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    <div className="rounded-lg border border-brand-yellow bg-brand-yellow px-3 py-3 text-sm text-brand-yellow">
                        Los cambios avanzados de compras, relinks y grants manuales siguen en{' '}
                        <Link href="/dashboard/admin/operations" className="font-medium underline underline-offset-4">
                            Operaciones
                        </Link>
                        .
                    </div>

                    <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                        <input
                            type="checkbox"
                            id="isTest"
                            checked={isTest}
                            onChange={(e) => setIsTest(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <div className="flex flex-col">
                            <label htmlFor="isTest" className="text-sm font-medium text-red-900 dark:text-red-200">
                                Cuenta de Prueba [TEST]
                            </label>
                            <span className="text-xs text-red-700 dark:text-red-300">
                                Evita que la actividad de este usuario se cuente en las Analíticas (MRR, Citas, Usuarios Activos).
                            </span>
                        </div>
                    </div>

                    {(user.role === 'psychologist' || user.role === 'admin') && (
                        <>
                            <div>
                                <label className="text-sm font-medium">Especialidad</label>
                                <input
                                    type="text"
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Tarifa por hora</label>
                                <input
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="surface-alert-error rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

interface AssignPatientFormProps {
    patients: User[]
    psychologists: User[]
    onClose: () => void
}

export function AssignPatientForm({ patients, psychologists, onClose }: AssignPatientFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [patientId, setPatientId] = useState('')
    const [psychologistId, setPsychologistId] = useState('')

    async function handleSubmit() {
        if (!patientId || !psychologistId) {
            setError('Selecciona paciente y psicólogo')
            return
        }

        setIsLoading(true)
        setError(null)

        const result = await assignPatientToPsychologist(patientId, psychologistId)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
            <Card className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto border-border/80 shadow-2xl">
                <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Asignar Paciente
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Paciente</label>
                        <select
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Seleccionar paciente</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name || 'Sin nombre'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Psicólogo</label>
                        <select
                            value={psychologistId}
                            onChange={(e) => setPsychologistId(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Seleccionar psicólogo</option>
                            {psychologists.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name || 'Sin nombre'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="surface-alert-error rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Asignar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

interface UserRowActionsProps {
    user: User
}

export function UserRowActions({ user }: UserRowActionsProps) {
    const [showRoleForm, setShowRoleForm] = useState(false)
    const [showMembershipForm, setShowMembershipForm] = useState(false)
    const [showConfirmEmailForm, setShowConfirmEmailForm] = useState(false)
    const [showEditForm, setShowEditForm] = useState(false)

    return (
        <div className="flex items-center gap-2">
            {!user.email_confirmed_at && (
                <Button variant="ghost" size="sm" onClick={() => setShowConfirmEmailForm(true)} title="Confirmar Correo">
                    <MailCheck className="h-4 w-4" />
                </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowMembershipForm(true)} title="Cambiar Nivel">
                <Sparkles className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowRoleForm(true)} title="Cambiar Rol">
                <Shield className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowEditForm(true)} title="Editar Perfil">
                <UserPlus className="h-4 w-4" />
            </Button>

            {showConfirmEmailForm && (
                <ConfirmEmailForm user={user} onClose={() => setShowConfirmEmailForm(false)} />
            )}
            {showMembershipForm && (
                <MembershipChangeForm user={user} onClose={() => setShowMembershipForm(false)} />
            )}
            {showRoleForm && (
                <RoleChangeForm user={user} onClose={() => setShowRoleForm(false)} />
            )}
            {showEditForm && (
                <UserEditForm user={user} onClose={() => setShowEditForm(false)} />
            )}
        </div>
    )
}

interface AssignButtonProps {
    patients: User[]
    psychologists: User[]
}

export function AssignButton({ patients, psychologists }: AssignButtonProps) {
    const [showForm, setShowForm] = useState(false)

    return (
        <>
            <Button variant="outline" onClick={() => setShowForm(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Asignar Paciente
            </Button>

            {showForm && (
                <AssignPatientForm
                    patients={patients}
                    psychologists={psychologists}
                    onClose={() => setShowForm(false)}
                />
            )}
        </>
    )
}

export function AddUserForm({ onClose }: { onClose: () => void }) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('patient')

    async function handleSubmit() {
        if (!fullName || !email || !password) {
            setError('Todos los campos son obligatorios')
            return
        }

        setIsLoading(true)
        setError(null)

        const result = await adminCreateUser({
            fullName,
            email,
            password,
            role
        })

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
            <Card className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto border-border/80 shadow-2xl">
                <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Agregar Usuario
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Nombre completo</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Correo electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Contraseña Temporal</label>
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Rol</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="patient">Paciente</option>
                            <option value="psychologist">Psicólogo</option>
                            <option value="ponente">Ponente</option>
                            <option value="support">Soporte</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    {error && (
                        <div className="surface-alert-error rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear Usuario'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function AddUserButton() {
    const [showForm, setShowForm] = useState(false)

    return (
        <>
            <Button onClick={() => setShowForm(true)} className="w-full gap-2 sm:w-auto">
                <UserPlus className="h-4 w-4" />
                <span>Agregar Usuario</span>
            </Button>
            {showForm && <AddUserForm onClose={() => setShowForm(false)} />}
        </>
    )
}

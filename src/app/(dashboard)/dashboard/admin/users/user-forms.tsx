'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateUserRole, assignPatientToPsychologist, adminUpdateProfile, adminCreateUser } from './actions'
import { X, Loader2, UserCog, Link2, Shield, User as UserIcon, UserPlus } from 'lucide-react'

export interface User {
    id: string
    full_name: string | null
    role: string
    bio?: string | null
    specialty?: string | null
    hourly_rate?: number | null
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
                        Membresias y accesos se operan en{' '}
                        <Link href="/dashboard/admin/operations" className="font-medium underline underline-offset-4">
                            Operaciones
                        </Link>
                        , no desde esta pantalla.
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
    const [showEditForm, setShowEditForm] = useState(false)

    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowRoleForm(true)} title="Cambiar Rol">
                <Shield className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowEditForm(true)} title="Editar Perfil">
                <UserPlus className="h-4 w-4" />
            </Button>

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

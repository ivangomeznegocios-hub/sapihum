'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Users } from 'lucide-react'
import { UserRowActions } from './user-forms'

interface Profile {
    id: string
    full_name: string | null
    role: string
    created_at: string
    bio: string | null
    specialty: string | null
    hourly_rate: number | null
    email?: string
    is_test?: boolean
}

interface UsersTableProps {
    users: Profile[]
}

const ROLE_BADGES: Record<string, string> = {
    admin: 'surface-alert-error dark:bg-red-900 dark:text-red-200',
    support: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow dark:text-brand-yellow',
    psychologist: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow dark:text-brand-yellow',
    patient: 'surface-alert-success dark:bg-green-900 dark:text-green-200',
    ponente: 'bg-brand-brown text-brand-brown dark:bg-brand-brown dark:text-brand-brown',
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    support: 'Soporte',
    psychologist: 'Psicologo',
    patient: 'Paciente',
    ponente: 'Ponente',
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export function UsersTable({ users }: UsersTableProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')

    const filteredUsers = useMemo(() => {
        const searchLower = searchTerm.trim().toLowerCase()

        return users.filter((user) => {
            const matchesSearch =
                !searchLower ||
                (user.full_name?.toLowerCase().includes(searchLower) ?? false) ||
                (user.email?.toLowerCase().includes(searchLower) ?? false)

            const matchesRole = roleFilter === 'all' || user.role === roleFilter

            return matchesSearch && matchesRole
        })
    }, [roleFilter, searchTerm, users])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Todos los Usuarios</CardTitle>
                <CardDescription>
                    Busca usuarios por nombre, correo o rol. Membresias y accesos se operan en Operaciones.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">Todos los roles</option>
                        <option value="patient">Pacientes</option>
                        <option value="psychologist">Psicologos</option>
                        <option value="ponente">Ponentes</option>
                        <option value="support">Soporte</option>
                        <option value="admin">Administradores</option>
                    </select>
                </div>

                {filteredUsers.length === 0 ? (
                    <div className="rounded-lg border bg-muted/20 py-12 text-center text-muted-foreground">
                        <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No se encontraron usuarios que coincidan con los filtros</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-[880px] w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-4 py-3 text-left font-medium">Usuario</th>
                                    <th className="px-4 py-3 text-left font-medium">Correo</th>
                                    <th className="px-4 py-3 text-left font-medium">Rol</th>
                                    <th className="px-4 py-3 text-left font-medium">Registro</th>
                                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b hover:bg-muted/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600 font-medium text-white">
                                                    {user.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="flex items-center gap-2 truncate font-medium">
                                                        {user.full_name || 'Sin nombre'}
                                                        {user.is_test ? (
                                                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-700 dark:bg-red-900/50 dark:text-red-300">
                                                                Test
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                    <p className="w-[150px] truncate text-sm text-muted-foreground md:w-auto">
                                                        {user.id.slice(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="block max-w-[200px] truncate text-sm text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${ROLE_BADGES[user.role] || 'bg-gray-100 text-gray-800'}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="whitespace-nowrap text-sm text-muted-foreground">
                                                {formatDate(user.created_at)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <UserRowActions
                                                user={{
                                                    id: user.id,
                                                    full_name: user.full_name,
                                                    role: user.role,
                                                    bio: user.bio,
                                                    specialty: user.specialty,
                                                    hourly_rate: user.hourly_rate,
                                                    is_test: user.is_test,
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

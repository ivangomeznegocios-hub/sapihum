'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, Search } from 'lucide-react'
import { UserRowActions } from './user-forms'

interface Profile {
    id: string
    full_name: string | null
    role: string
    subscription_status: string | null
    membership_level: number
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

const getRoleBadge = (role: string) => {
    switch (role) {
        case 'admin':
            return 'surface-alert-error dark:bg-red-900 dark:text-red-200'
        case 'psychologist':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        case 'patient':
            return 'surface-alert-success dark:bg-green-900 dark:text-green-200'
        case 'ponente':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

const getRoleLabel = (role: string) => {
    switch (role) {
        case 'admin': return 'Admin'
        case 'psychologist': return 'Psicólogo'
        case 'patient': return 'Paciente'
        case 'ponente': return 'Ponente'
        default: return role
    }
}

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

export function UsersTable({ users }: UsersTableProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [paymentFilter, setPaymentFilter] = useState('all')

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Buscador por nombre o correo
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch = 
                (user.full_name?.toLowerCase().includes(searchLower) ?? false) || 
                (user.email?.toLowerCase().includes(searchLower) ?? false)
            
            // Filtro por rol
            const matchesRole = roleFilter === 'all' || user.role === roleFilter

            // Filtro por estado
            let matchesStatus = true
            if (statusFilter !== 'all') {
                if (statusFilter === 'active') {
                    matchesStatus = user.subscription_status === 'active' || user.subscription_status === 'trial'
                } else if (statusFilter === 'trial') {
                    matchesStatus = user.subscription_status === 'trial'
                } else if (statusFilter === 'past_due') {
                    matchesStatus = user.subscription_status === 'past_due'
                } else if (statusFilter === 'cancelled') {
                    matchesStatus = user.subscription_status === 'cancelled'
                } else if (statusFilter === 'inactive') {
                    matchesStatus = !user.subscription_status || user.subscription_status === 'inactive'
                }
            }

            // Filtro por Pago/Gratis -> Basado en el nivel de membresía o suscripción
            let matchesPayment = true
            if (paymentFilter === 'paid') {
                matchesPayment = user.membership_level > 0
            } else if (paymentFilter === 'free') {
                matchesPayment = !user.membership_level || user.membership_level === 0
            }

            return matchesSearch && matchesRole && matchesStatus && matchesPayment
        })
    }, [users, searchTerm, roleFilter, statusFilter, paymentFilter])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Todos los Usuarios</CardTitle>
                <CardDescription>
                    Busca y filtra usuarios por rol, estado y nivel de membresía
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Filtros */}
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,12rem))] mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">Todos los roles</option>
                        <option value="patient">Pacientes</option>
                        <option value="psychologist">Psicólogos</option>
                        <option value="ponente">Ponentes</option>
                        <option value="admin">Administradores</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos (Incluye Trial)</option>
                        <option value="trial">En Prueba (Trial)</option>
                        <option value="past_due">Pago Atrasado</option>
                        <option value="cancelled">Cancelados</option>
                        <option value="inactive">Inactivos (Sin suscripción)</option>
                    </select>
                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">Cualquier membresía</option>
                        <option value="free">Gratis (Nivel 0)</option>
                        <option value="paid">De Pago</option>
                    </select>
                </div>

                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No se encontraron usuarios que coincidan con los filtros</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-[980px] w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">Usuario</th>
                                    <th className="text-left py-3 px-4 font-medium">Correo</th>
                                    <th className="text-left py-3 px-4 font-medium">Rol</th>
                                    <th className="text-left py-3 px-4 font-medium">Suscripción</th>
                                    <th className="text-left py-3 px-4 font-medium">Registro</th>
                                    <th className="text-right py-3 px-4 font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b hover:bg-muted/50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-medium shrink-0">
                                                    {user.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate flex items-center gap-2">
                                                        {user.full_name || 'Sin nombre'}
                                                        {user.is_test && (
                                                            <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
                                                                Test
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground truncate w-[150px] md:w-auto">
                                                        {user.id.slice(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                                                {user.email}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getRoleBadge(user.role)}`}>
                                                    {getRoleLabel(user.role)}
                                                </span>
                                                {user.membership_level > 0 && (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 whitespace-nowrap">
                                                        Lvl {user.membership_level}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm">
                                                {user.subscription_status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                {formatDate(user.created_at)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <UserRowActions user={{
                                                id: user.id,
                                                full_name: user.full_name,
                                                role: user.role,
                                                bio: user.bio,
                                                specialty: user.specialty,
                                                hourly_rate: user.hourly_rate,
                                                subscription_status: user.subscription_status,
                                                membership_level: user.membership_level,
                                                is_test: user.is_test
                                            }} />
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

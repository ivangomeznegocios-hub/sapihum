import { createClient, createAdminClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import { UserRowActions, AssignButton, AddUserButton } from './user-forms'
import { UsersTable } from './users-table'
import {
    Users,
    Shield,
    Activity,
    UserCog,
    Mic2
} from 'lucide-react'

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

export default async function AdminUsersPage() {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    // Only admins can access this page
    if (profile.role !== 'admin') {
        redirect('/dashboard')
    }

    // Get all users profiles
    const { data: users } = await (supabase
        .from('profiles') as any)
        .select('*')
        .order('created_at', { ascending: false })

    // Get auth users to match emails
    const { data: authData } = await adminSupabase.auth.admin.listUsers()
    const authUsers = authData?.users || []

    const allUsers: Profile[] = (users || []).map((u: any) => {
        const authUser = authUsers.find(au => au.id === u.id)
        return {
            ...u,
            is_test: u.is_test || false,
            email: authUser?.email || 'Sin correo'
        }
    })

    // Count by role
    const psychologists = allUsers.filter(u => u.role === 'psychologist')
    const patients = allUsers.filter(u => u.role === 'patient')
    const admins = allUsers.filter(u => u.role === 'admin')
    const ponentes = allUsers.filter(u => u.role === 'ponente')

    return (
        <div className="w-full space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
                        <Users className="h-8 w-8" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Administra todos los usuarios de la plataforma
                    </p>
                </div>
                <div className="flex w-full flex-wrap items-stretch gap-3 md:w-auto md:justify-end">
                    <AssignButton
                        patients={patients.map(p => ({ id: p.id, full_name: p.full_name, role: p.role }))}
                        psychologists={psychologists.map(p => ({ id: p.id, full_name: p.full_name, role: p.role }))}
                    />
                    <AddUserButton />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allUsers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{admins.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Psicólogos</CardTitle>
                        <UserCog className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{psychologists.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{patients.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ponentes</CardTitle>
                        <Mic2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ponentes.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <UsersTable users={allUsers} />
        </div>
    )
}


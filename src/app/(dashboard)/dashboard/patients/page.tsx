import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AddPatientButton, RemovePatientButton } from './patient-forms'
import {
    Users,
    UserPlus,
    Calendar,
    FileText,
    ArrowRight
} from 'lucide-react'

interface Patient {
    id: string
    full_name: string | null
    created_at: string
    subscription_status: string | null
}

interface Relationship {
    patient_id: string
    created_at: string
    patient: Patient
}

export default async function PatientsPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    // Only psychologists can access this page
    if (profile.role !== 'psychologist') {
        redirect('/dashboard')
    }

    if ((profile.membership_level ?? 0) < 2) {
        redirect('/dashboard/subscription')
    }

    // Get psychologist's patient relationships
    const { data: relationships } = await ((supabase
        .from('patient_psychologist_relationships') as any) as any)
        .select('patient_id, created_at')
        .eq('psychologist_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    // Fetch patient profiles separately
    const patientIds = (relationships || []).map((r: any) => r.patient_id)
    let patientProfiles: any[] = []
    if (patientIds.length > 0) {
        const { data } = await ((supabase
            .from('profiles') as any) as any)
            .select('id, full_name, created_at, subscription_status')
            .in('id', patientIds)
        patientProfiles = data || []
    }

    // Build patient lookup map
    const patientMap: Record<string, any> = {}
    patientProfiles.forEach((p: any) => { patientMap[p.id] = p })

    // Combine relationship + patient data
    const patients = (relationships || []).map((r: any) => ({
        patient_id: r.patient_id,
        created_at: r.created_at,
        patient: patientMap[r.patient_id] || { id: r.patient_id, full_name: null, created_at: r.created_at, subscription_status: null }
    }))

    // Get upcoming appointments count for each patient
    const patientAppointments: Record<string, number> = {}
    if (patients.length > 0) {
        const patientIds = patients.map((p: any) => p.patient_id)
        const { data: appointments } = await (supabase
            .from('appointments') as any)
            .select('patient_id')
            .eq('psychologist_id', profile.id)
            .in('patient_id', patientIds)
            .gte('start_time', new Date().toISOString())
            .in('status', ['scheduled', 'confirmed'])

        appointments?.forEach((apt: any) => {
            patientAppointments[apt.patient_id] = (patientAppointments[apt.patient_id] || 0) + 1
        })
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Users className="h-8 w-8" />
                        Mis Pacientes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tus pacientes y sus registros clínicos
                    </p>
                </div>
                <AddPatientButton />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{patients.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Citas Pendientes</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.values(patientAppointments).reduce((a, b) => a + b, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Activos</CardTitle>
                        <UserPlus className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{patients.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Patients List */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Pacientes</CardTitle>
                    <CardDescription>
                        Haz clic en un paciente para ver su historial completo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {patients.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No tienes pacientes asignados</p>
                            <p className="text-sm mt-2">
                                Usa el botón "Agregar Paciente" para comenzar
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {patients.map((rel: any) => (
                                <div
                                    key={rel.patient_id}
                                    className="flex flex-col gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg font-medium">
                                            {rel.patient?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {rel.patient?.full_name || 'Sin nombre'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Desde {formatDate(rel.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                                        {patientAppointments[rel.patient_id] && (
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {patientAppointments[rel.patient_id]} citas
                                            </span>
                                        )}
                                        <Link href={`/dashboard/patients/${rel.patient_id}`}>
                                            <Button variant="ghost" size="sm">
                                                Ver perfil
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <RemovePatientButton
                                            patientId={rel.patient_id}
                                            patientName={rel.patient?.full_name || 'paciente'}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ClinicalTabs } from './clinical-tabs'
import { getPatientToolAssignments, getToolsCatalog } from '@/lib/supabase/queries/tools'
import {
    User,
    ArrowLeft,
    Mail,
    CalendarDays,
    Shield
} from 'lucide-react'

function formatDate(dateString: string) {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function PatientDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile || profile.role !== 'psychologist') {
        redirect('/dashboard')
    }

    if ((profile.membership_level ?? 0) < 2) {
        redirect('/dashboard/subscription')
    }

    // Verify relationship
    const { data: relationship } = await supabase
        .from('patient_psychologist_relationships' as any)
        .select('*')
        .eq('patient_id', id)
        .eq('psychologist_id', profile.id)
        .eq('status', 'active')
        .single()

    if (!relationship) {
        redirect('/dashboard/patients')
    }

    // Fetch patient details
    const { data: patientData } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id', id)
        .single()

    const patient = patientData as any

    if (!patient) {
        notFound()
    }

    // Parallel data fetches for all tabs
    const [notesResult, appointmentsResult, documentsResult, summariesResult, toolAssignments, tools] = await Promise.all([
        // Clinical notes (enhanced)
        supabase
            .from('clinical_records' as any)
            .select('*')
            .eq('patient_id', id)
            .eq('psychologist_id', profile.id)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false }),

        // Appointments
        supabase
            .from('appointments' as any)
            .select('*')
            .eq('patient_id', id)
            .eq('psychologist_id', profile.id)
            .order('start_time', { ascending: false }),

        // Documents
        supabase
            .from('clinical_documents' as any)
            .select('*')
            .eq('patient_id', id)
            .eq('psychologist_id', profile.id)
            .order('created_at', { ascending: false }),

        // Session summaries
        supabase
            .from('session_summaries' as any)
            .select('*')
            .eq('patient_id', id)
            .eq('psychologist_id', profile.id)
            .order('created_at', { ascending: false }),

        // Tool assignments for this patient
        getPatientToolAssignments(id),

        // Tools catalog for assignment modal
        getToolsCatalog()
    ])

    const notes = (notesResult.data || []) as any[]
    const appointments = (appointmentsResult.data || []) as any[]
    const documents = (documentsResult.data || []) as any[]
    const sessionSummaries = (summariesResult.data || []) as any[]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/patients">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{patient.full_name}</h1>
                    <p className="text-muted-foreground text-sm">Expediente Clínico Digital</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                {/* Main Content — Tabbed Interface */}
                <div>
                    <ClinicalTabs
                        patient={patient}
                        notes={notes}
                        documents={documents}
                        appointments={appointments}
                        sessionSummaries={sessionSummaries}
                        patientId={id}
                        toolAssignments={toolAssignments}
                        tools={tools}
                    />
                </div>

                {/* Sidebar — Patient Info */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Información del Paciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Avatar */}
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border">
                                    <span className="text-lg font-bold text-primary">
                                        {patient.full_name?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-semibold">{patient.full_name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {patient.subscription_status || 'Sin suscripción'}
                                    </p>
                                </div>
                            </div>

                            <div className="h-px bg-border" />

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground truncate">
                                        {patient.email || 'No registrado'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        Registro: {formatDate(patient.created_at)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground text-xs">
                                        Datos protegidos • Solo tu acceso
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats Sidebar */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="p-2 rounded-lg bg-muted/50">
                                    <p className="text-lg font-bold">{notes.length}</p>
                                    <p className="text-[10px] text-muted-foreground">Notas</p>
                                </div>
                                <div className="p-2 rounded-lg bg-muted/50">
                                    <p className="text-lg font-bold">{appointments.length}</p>
                                    <p className="text-[10px] text-muted-foreground">Citas</p>
                                </div>
                                <div className="p-2 rounded-lg bg-muted/50">
                                    <p className="text-lg font-bold">{documents.length}</p>
                                    <p className="text-[10px] text-muted-foreground">Documentos</p>
                                </div>
                                <div className="p-2 rounded-lg bg-muted/50">
                                    <p className="text-lg font-bold">{sessionSummaries.length}</p>
                                    <p className="text-[10px] text-muted-foreground">Resúmenes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

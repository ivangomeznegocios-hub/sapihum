import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentInternalAccessContext } from '@/lib/access/internal-server'
import { canAccessPatientsModule } from '@/lib/access/internal-modules'
import { getPatientById } from '@/lib/supabase/queries/patients'
import { NewNoteForm } from '@/components/clinical/new-note-form'

interface NewNotesPageProps {
    params: Promise<{ id: string }>
}

export default async function NewNotesPage({ params }: NewNotesPageProps) {
    const resolvedParams = await params
    const { profile, viewer } = await getCurrentInternalAccessContext()

    if (!profile || !viewer) {
        redirect('/auth/login')
    }

    if (!canAccessPatientsModule(viewer)) {
        if (profile.role === 'psychologist') {
            redirect('/dashboard/subscription')
        }

        redirect('/dashboard')
    }

    const patient = await getPatientById(resolvedParams.id)

    if (!patient) {
        notFound()
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard/patients" className="hover:text-foreground">
                    Pacientes
                </Link>
                <span>/</span>
                <Link href={`/dashboard/patients/${patient.id}`} className="hover:text-foreground">
                    {patient.full_name ?? 'Paciente'}
                </Link>
                <span>/</span>
                <span className="text-foreground">Nueva Nota</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nueva Nota Clínica</h1>
                <p className="text-muted-foreground">
                    Paciente: {patient.full_name}
                </p>
            </div>

            {/* Form */}
            <NewNoteForm patientId={patient.id} psychologistId={profile.id} />
        </div>
    )
}

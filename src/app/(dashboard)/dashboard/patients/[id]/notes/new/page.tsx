import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPatientById } from '@/lib/supabase/queries/patients'
import { getUserProfile } from '@/lib/supabase/server'
import { NewNoteForm } from '@/components/clinical/new-note-form'

interface NewNotesPageProps {
    params: Promise<{ id: string }>
}

export default async function NewNotesPage({ params }: NewNotesPageProps) {
    const resolvedParams = await params
    const patient = await getPatientById(resolvedParams.id)
    const profile = await getUserProfile()

    if (!patient || !profile) {
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

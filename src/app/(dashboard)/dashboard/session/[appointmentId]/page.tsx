import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TelehealthSession } from '@/components/telehealth'
import { Badge } from '@/components/ui/badge'
import { getAppointmentById } from '@/lib/supabase/queries/appointments'
import { createClient, getUserProfile } from '@/lib/supabase/server'

interface SessionPageProps {
    params: Promise<{ appointmentId: string }>
}

export default async function SessionPage({ params }: SessionPageProps) {
    const resolvedParams = await params
    const supabase = await createClient()
    const appointment = await getAppointmentById(resolvedParams.appointmentId)
    const profile = await getUserProfile()

    if (!appointment || !profile) {
        notFound()
    }

    const canAccessAppointment =
        profile.role === 'admin' ||
        (profile.role === 'psychologist' && appointment.psychologist_id === profile.id) ||
        (profile.role === 'patient' && appointment.patient_id === profile.id)

    if (!canAccessAppointment) {
        notFound()
    }

    const { data: patient, error: patientError } = await (supabase
        .from('profiles') as any)
        .select('id, full_name')
        .eq('id', appointment.patient_id)
        .single()

    if (patientError || !patient) {
        notFound()
    }

    const isPatientView = profile.role === 'patient'

    return (
        <div className="space-y-6">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground">
                    Dashboard
                </Link>
                <span>/</span>
                {isPatientView ? (
                    <Link href="/dashboard/calendar" className="hover:text-foreground">
                        Calendario
                    </Link>
                ) : (
                    <>
                        <Link href="/dashboard/patients" className="hover:text-foreground">
                            Pacientes
                        </Link>
                        <span>/</span>
                        <Link href={`/dashboard/patients/${patient.id}`} className="hover:text-foreground">
                            {patient.full_name}
                        </Link>
                    </>
                )}
                <span>/</span>
                <span className="text-foreground">Sesion</span>
            </nav>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
                        Sesion de Telemedicina
                        <Badge variant={"success" as any} className="text-base">
                            <span className="relative mr-2 flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                            </span>
                            En Vivo
                        </Badge>
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Paciente: {patient.full_name}
                    </p>
                </div>
            </div>

            <TelehealthSession
                appointmentId={appointment.id}
                patientId={patient.id}
                patientName={patient.full_name ?? 'Paciente'}
                meetingLink={appointment.meeting_link}
                aiMinutes={profile.ai_minutes_available || 0}
                membershipLevel={profile.membership_level || 0}
                userRole={profile.role}
            />
        </div>
    )
}

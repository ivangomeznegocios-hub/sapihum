import { createClient, getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookingWizard } from './booking-wizard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getLatestActiveRelationshipForPatient } from '@/lib/supabase/queries/relationships'

export default async function BookingPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    if (profile.role !== 'patient') {
        redirect('/dashboard/calendar')
    }

    const relationship = await getLatestActiveRelationshipForPatient(profile.id)

    if (!relationship) {
        return (
            <div className="max-w-md mx-auto py-12">
                <Card>
                    <CardContent className="pt-8 pb-6 text-center space-y-4">
                        <div className="mx-auto w-14 h-14 bg-brand-yellow dark:bg-brand-yellow/30 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-7 w-7 text-brand-yellow" />
                        </div>
                        <h2 className="text-xl font-bold">Sin psicólogo asignado</h2>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Para agendar citas necesitas tener un psicólogo asignado.
                            Contacta a soporte para que te vinculen con uno.
                        </p>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al inicio
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Get psychologist profile
    const { data: psychologist } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', relationship.psychologist_id)
        .single()

    // Get existing future appointments to block slots
    const { data: appointments } = await (supabase
        .from('appointments') as any)
        .select('start_time, end_time')
        .eq('psychologist_id', relationship.psychologist_id)
        .gte('start_time', new Date().toISOString())
        .neq('status', 'cancelled')

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/calendar">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Calendar className="h-7 w-7 text-primary" />
                        Agendar Cita
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Reserva una sesión con {psychologist?.full_name || 'tu psicólogo'}
                    </p>
                </div>
            </div>

            <BookingWizard
                psychologist={psychologist}
                patient={profile}
                existingAppointments={appointments || []}
            />
        </div>
    )
}

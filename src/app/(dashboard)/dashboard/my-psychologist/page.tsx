import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    UserCog,
    Mail,
    Phone,
    Calendar,
    Clock,
    MessageSquare,
    Star,
    Award
} from 'lucide-react'

export default async function MyPsychologistPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    // Only patients can access this page
    if (profile.role !== 'patient') {
        redirect('/dashboard')
    }

    // Get patient's psychologist relationship
    const { data: relationship } = await (supabase
        .from('patient_psychologist_relationships') as any)
        .select('psychologist_id, created_at, status')
        .eq('patient_id', profile.id)
        .eq('status', 'active')
        .single()

    let psychologist = null
    let appointmentCount = 0
    let nextAppointment = null

    if (relationship?.psychologist_id) {
        // Get psychologist profile
        const { data: psyProfile } = await (supabase
            .from('profiles') as any)
            .select('*')
            .eq('id', relationship.psychologist_id)
            .single()

        psychologist = psyProfile

        // Get appointment count
        const { count } = await (supabase
            .from('appointments') as any)
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', profile.id)
            .eq('psychologist_id', relationship.psychologist_id)
            .eq('status', 'completed')

        appointmentCount = count || 0

        // Get next appointment
        const { data: nextApt } = await (supabase
            .from('appointments') as any)
            .select('*')
            .eq('patient_id', profile.id)
            .eq('psychologist_id', relationship.psychologist_id)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(1)
            .single()

        nextAppointment = nextApt
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const relationshipDuration = relationship?.created_at
        ? Math.floor((Date.now() - new Date(relationship.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <UserCog className="h-8 w-8" />
                    Mi Psicólogo
                </h1>
                <p className="text-muted-foreground mt-1">
                    Información sobre tu profesional de salud mental
                </p>
            </div>

            {psychologist ? (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Psychologist Profile Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {psychologist.full_name?.charAt(0) || 'P'}
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl">
                                        {psychologist.full_name || 'Psicólogo'}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Psicólogo(a) Clínico(a)
                                    </CardDescription>
                                    <div className="flex items-center gap-1 mt-2">
                                        <Award className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            {psychologist.specialty || 'Psicólogo General'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Contact Info */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">Contactar por mensaje</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <Award className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Especialidad</p>
                                        <p className="font-medium">{psychologist.specialty || 'General'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-3xl font-bold text-primary">
                                        {appointmentCount}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Sesiones completadas
                                    </p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-3xl font-bold text-primary">
                                        {relationshipDuration}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Meses juntos
                                    </p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-3xl font-bold text-green-600">
                                        Activo
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Estado
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link href="/dashboard/messages" className="flex-1">
                                    <Button className="w-full">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Enviar mensaje
                                    </Button>
                                </Link>
                                <Link href="/dashboard/calendar" className="flex-1">
                                    <Button variant="outline" className="w-full">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Ver citas
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Next Appointment */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Próxima Cita</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nextAppointment ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {formatDate(nextAppointment.start_time)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {formatTime(nextAppointment.start_time)}
                                            </span>
                                        </div>
                                        <div className="pt-2">
                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                                {nextAppointment.type === 'video' ? 'Videollamada' : 'Presencial'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No hay citas programadas</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Links */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Acceso Rápido</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href="/dashboard/resources">
                                    <Button variant="ghost" className="w-full justify-start">
                                        Mis recursos asignados
                                    </Button>
                                </Link>
                                <Link href="/dashboard/calendar">
                                    <Button variant="ghost" className="w-full justify-start">
                                        Historial de citas
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                /* No Psychologist Assigned */
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <UserCog className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h2 className="text-xl font-semibold mb-2">
                                Sin psicólogo asignado
                            </h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Actualmente no tienes un psicólogo asignado.
                                Contacta al administrador para que te asignen un profesional.
                            </p>
                            <Link href="/dashboard/messages">
                                <Button>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Contactar soporte
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

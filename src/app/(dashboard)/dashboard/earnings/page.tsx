import { createClient, getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EarningsSummary } from '@/components/dashboard/earnings-summary'
import { EarningsTable } from '@/components/dashboard/earnings-table'
import { StudentTable } from '@/components/dashboard/student-table'
import { getSpeakerFinancialSummary, getSpeakerEarningsHistory, getSpeakerCourses, getSpeakerStudents, getEarningsReportData } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, CalendarDays, ExternalLink, Video, Link2, Users, FileSpreadsheet } from 'lucide-react'

export default async function EarningsDashboardPage() {
    const profile = await getUserProfile()

    if (!profile) redirect('/auth/login')
    if (!['ponente', 'admin'].includes(profile.role)) redirect('/dashboard')

    // Fetch all data in parallel
    const [summaryRes, earningsRes, coursesRes, studentsRes] = await Promise.all([
        getSpeakerFinancialSummary(),
        getSpeakerEarningsHistory(),
        getSpeakerCourses(),
        getSpeakerStudents(),
    ])

    const summary = summaryRes.data
    const earnings = earningsRes.data || []
    const courses = coursesRes.data || []
    const students = studentsRes.data || []

    // Get current month CSV data
    const currentMonth = new Date().toISOString().slice(0, 7)
    const csvRes = await getEarningsReportData(currentMonth)
    const csvData = csvRes.data || []

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">💰 Panel de Ganancias</h1>
                <p className="text-muted-foreground mt-1">
                    Resumen financiero, cursos y gestión de alumnos
                </p>
            </div>

            {/* I. Financial Summary */}
            {summary && <EarningsSummary summary={summary} />}

            {/* II. My Courses & Materials */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            Mis Cursos y Sesiones
                        </CardTitle>
                        <CardDescription>
                            Eventos con links de sesión y grabación
                        </CardDescription>
                    </div>
                    <Link href="/dashboard/events">
                        <Button variant="outline" size="sm">
                            Ver Todos <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {courses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>No has creado cursos aún</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {courses.slice(0, 8).map((course: any) => {
                                const statusColors: Record<string, string> = {
                                    draft: 'bg-muted text-muted-foreground',
                                    upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                                    live: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                                    completed: 'bg-muted text-muted-foreground',
                                    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                                }
                                const statusLabels: Record<string, string> = {
                                    draft: 'Borrador', upcoming: 'Próximo', live: 'En Vivo',
                                    completed: 'Finalizado', cancelled: 'Cancelado',
                                }

                                return (
                                    <div key={course.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/dashboard/events/${course.id}`} className="text-sm font-medium hover:underline truncate">
                                                    {course.title}
                                                </Link>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[course.status] || ''}`}>
                                                    {statusLabels[course.status] || course.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(course.start_time).toLocaleDateString('es-MX', {
                                                    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                                {' · '}
                                                <span className="inline-flex items-center gap-0.5">
                                                    <Users className="h-3 w-3" /> {course.attendee_count}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                            {course.meeting_link && (
                                                <a href={course.meeting_link} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-md hover:bg-background transition-colors"
                                                    title="Link de Sesión">
                                                    <Link2 className="h-3.5 w-3.5 text-blue-500" />
                                                </a>
                                            )}
                                            {course.recording_url && !course.recording_expired && (
                                                <a href={course.recording_url} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-md hover:bg-background transition-colors"
                                                    title={`Grabación (expira en ${course.recording_available_days || 20} días)`}>
                                                    <Video className="h-3.5 w-3.5 text-purple-500" />
                                                </a>
                                            )}
                                            {course.recording_url && course.recording_expired && (
                                                <span className="text-[10px] text-muted-foreground" title="Grabación expirada">
                                                    Expirada
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* III. Student Management */}
            <StudentTable students={students} showPaymentStatus={true} />

            {/* IV. Earnings History */}
            <EarningsTable
                earnings={earnings}
                csvData={csvData}
                showStudentPaymentStatus={true}
            />
        </div>
    )
}

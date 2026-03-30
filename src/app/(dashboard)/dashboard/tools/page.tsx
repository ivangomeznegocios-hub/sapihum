import { getMyToolAssignments } from '@/lib/supabase/queries/tools'
import { getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Brain, Clock, CheckCircle, AlertCircle, Timer, ArrowRight, ChevronRight } from 'lucide-react'
import { getStatusLabel, getStatusColor, getCategoryLabel } from '@/lib/tools/tool-schema'

export default async function PatientToolsPage() {
    const profile = await getUserProfile()

    if (!profile || profile.role !== 'patient') {
        redirect('/dashboard')
    }

    const assignments = await getMyToolAssignments()

    const pending = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress')
    const completed = assignments.filter(a => a.status === 'completed')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Brain className="h-6 w-6 text-primary" />
                    Mis Herramientas
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Tests, cuestionarios y ejercicios asignados por tu psicólogo
                </p>
            </div>

            {/* Pending Tools */}
            {pending.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-brand-yellow" />
                        Pendientes ({pending.length})
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2">
                        {pending.map(assignment => (
                            <Link
                                key={assignment.id}
                                href={`/dashboard/tools/${assignment.id}`}
                            >
                                <Card className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group h-full">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold text-sm truncate">
                                                        {assignment.tool?.title || 'Herramienta'}
                                                    </p>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getStatusColor(assignment.status)}`}>
                                                        {getStatusLabel(assignment.status)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                    {assignment.tool?.description}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                        {getCategoryLabel(assignment.tool?.category || 'test')}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Timer className="h-3 w-3" />
                                                        {assignment.tool?.estimated_minutes || '?'} min
                                                    </span>
                                                </div>
                                                {assignment.instructions && (
                                                    <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-primary/20 pl-2">
                                                        {assignment.instructions}
                                                    </p>
                                                )}
                                                {assignment.due_date && (
                                                    <p className="text-xs text-brand-yellow font-medium mt-1.5 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Límite: {new Date(assignment.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                                    </p>
                                                )}
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Tools */}
            {completed.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Completados ({completed.length})
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2">
                        {completed.map(assignment => (
                            <Link
                                key={assignment.id}
                                href={`/dashboard/tools/${assignment.id}`}
                            >
                                <Card className="hover:shadow-md transition-all cursor-pointer opacity-80 hover:opacity-100 h-full">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {assignment.tool?.title || 'Herramienta'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Completado {assignment.completed_at
                                                        ? new Date(assignment.completed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                                                        : ''}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {assignments.length === 0 && (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
                        <h3 className="font-semibold text-lg mb-1">Sin herramientas asignadas</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Tu psicólogo te asignará tests, cuestionarios y ejercicios que aparecerán aquí
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

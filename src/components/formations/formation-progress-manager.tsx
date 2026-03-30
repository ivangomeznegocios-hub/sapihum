'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, CheckCircle2, Loader2, Mail, UserRound } from 'lucide-react'
import { issueFullCertificate, markCourseCompleted } from '@/app/(dashboard)/dashboard/events/formation-actions'

interface FormationProgressManagerProps {
    formationId: string
    learners: Array<{
        email: string
        full_name?: string | null
        completedRequiredCount: number
        totalRequiredCount: number
        hasFullCertificate: boolean
        fullCertificateIssuedAt?: string | null
        courses: Array<{
            event_id: string
            event?: {
                title?: string | null
            } | null
            isCompleted: boolean
            hasCertificate: boolean
        }>
    }>
}

function formatIssuedAt(value: string | null | undefined) {
    if (!value) return null
    return new Date(value).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export function FormationProgressManager({ formationId, learners }: FormationProgressManagerProps) {
    const router = useRouter()
    const [pendingKey, setPendingKey] = useState<string | null>(null)

    const handleMarkCompleted = async (email: string, eventId: string, title: string) => {
        const actionKey = `course:${email}:${eventId}`
        setPendingKey(actionKey)

        try {
            await markCourseCompleted(formationId, eventId, email)
            toast.success(`Curso marcado como completado: ${title}`)
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('No fue posible actualizar el progreso')
        } finally {
            setPendingKey(null)
        }
    }

    const handleIssueFullCertificate = async (email: string) => {
        const actionKey = `full:${email}`
        setPendingKey(actionKey)

        try {
            await issueFullCertificate(formationId, email)
            toast.success('Certificado final emitido')
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error?.message || 'No fue posible emitir el certificado final')
        } finally {
            setPendingKey(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Seguimiento y CertificaciÃ³n</CardTitle>
                <CardDescription>
                    Administra el avance de cada alumno del diplomado y emite el certificado final cuando complete toda la ruta.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {learners.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                        TodavÃ­a no hay compras confirmadas de esta formaciÃ³n.
                    </div>
                ) : (
                    learners.map((learner) => {
                        const fullCertActionKey = `full:${learner.email}`
                        const canIssueFullCertificate =
                            learner.completedRequiredCount === learner.totalRequiredCount &&
                            learner.totalRequiredCount > 0 &&
                            !learner.hasFullCertificate

                        return (
                            <div key={learner.email} className="rounded-2xl border bg-muted/20 p-5 space-y-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <UserRound className="h-4 w-4 text-muted-foreground" />
                                            <span>{learner.full_name || 'Alumno sin nombre capturado'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            <span>{learner.email}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">
                                            {learner.completedRequiredCount}/{learner.totalRequiredCount} cursos requeridos
                                        </Badge>
                                        {learner.hasFullCertificate ? (
                                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                                                <Award className="mr-1 h-3.5 w-3.5" />
                                                Certificado final emitido
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Certificado final pendiente</Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    {learner.courses.map((course) => {
                                        const courseTitle = course.event?.title || 'Curso'
                                        const actionKey = `course:${learner.email}:${course.event_id}`
                                        const isPending = pendingKey === actionKey

                                        return (
                                            <div key={`${learner.email}:${course.event_id}`} className="rounded-xl border bg-background p-4 space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium text-sm">{courseTitle}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {course.isCompleted ? 'Completado' : 'Pendiente de completar'}
                                                        </p>
                                                    </div>
                                                    {course.hasCertificate ? (
                                                        <Badge className="bg-brand-brown text-brand-brown hover:bg-brand-brown">
                                                            Certificado
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">Sin certificado</Badge>
                                                    )}
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant={course.isCompleted ? 'outline' : 'default'}
                                                    className="w-full"
                                                    disabled={course.isCompleted || Boolean(pendingKey)}
                                                    onClick={() => handleMarkCompleted(learner.email, course.event_id, courseTitle)}
                                                >
                                                    {isPending ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Guardando...
                                                        </>
                                                    ) : course.isCompleted ? (
                                                        <>
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Completado
                                                        </>
                                                    ) : (
                                                        'Marcar como completado'
                                                    )}
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        {learner.hasFullCertificate
                                            ? `Emitido el ${formatIssuedAt(learner.fullCertificateIssuedAt) || 'sin fecha visible'}`
                                            : canIssueFullCertificate
                                                ? 'El alumno ya cumple para recibir el certificado final.'
                                                : 'Completa todos los cursos requeridos para emitir el certificado final.'}
                                    </div>

                                    <Button
                                        type="button"
                                        variant={learner.hasFullCertificate ? 'outline' : 'default'}
                                        disabled={!canIssueFullCertificate || Boolean(pendingKey)}
                                        onClick={() => handleIssueFullCertificate(learner.email)}
                                    >
                                        {pendingKey === fullCertActionKey ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Emitiendo...
                                            </>
                                        ) : (
                                            <>
                                                <Award className="mr-2 h-4 w-4" />
                                                Emitir certificado final
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    )
}

import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import { NewReferralForm, ReferralResponseButtons } from './referral-forms'
import {
    GitBranch, ArrowUpRight, ArrowDownLeft, Clock,
    CheckCircle2, XCircle, AlertTriangle, User
} from 'lucide-react'

export default async function ReferralsPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) redirect('/auth/login')
    if (profile.role !== 'psychologist') redirect('/dashboard')

    const { data: sentReferrals } = await (supabase
        .from('referrals') as any)
        .select('*, receiving_psychologist:receiving_psychologist_id(id, full_name, specialty)')
        .eq('referring_psychologist_id', profile.id)
        .eq('referral_domain', 'clinical_referral')
        .order('created_at', { ascending: false })

    const { data: receivedReferrals } = await (supabase
        .from('referrals') as any)
        .select('*, referring_psychologist:referring_psychologist_id(id, full_name, specialty)')
        .eq('receiving_psychologist_id', profile.id)
        .eq('referral_domain', 'clinical_referral')
        .order('created_at', { ascending: false })

    const sent = sentReferrals || []
    const received = receivedReferrals || []

    const inProgressCount = [...sent, ...received].filter((referral: any) =>
        ['pending', 'assigned', 'accepted'].includes(referral.status)
    ).length
    const handoffCompletedCount = [...sent, ...received].filter((referral: any) =>
        ['handoff_completed', 'completed'].includes(referral.status)
    ).length

    const hasAcceptedTerms = (profile as any).accepts_referral_terms

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { class: string, icon: any, label: string }> = {
            pending: { class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200', icon: <Clock className="h-3 w-3" />, label: 'Pendiente' },
            assigned: { class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200', icon: <User className="h-3 w-3" />, label: 'Asignada' },
            accepted: { class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Aceptada' },
            rejected: { class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Rechazada' },
            handoff_completed: { class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Transferencia clinica' },
            completed: { class: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Completada' },
            cancelled: { class: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400', icon: <XCircle className="h-3 w-3" />, label: 'Cancelada' },
        }
        const badge = badges[status] || badges.pending
        return (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${badge.class}`}>
                {badge.icon} {badge.label}
            </span>
        )
    }

    const getUrgencyBadge = (urgency: string) => {
        if (urgency === 'urgente') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">Urgente</span>
        if (urgency === 'alta') return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">Alta</span>
        return null
    }

    const formatDate = (date: string) => new Date(date).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric'
    })

    const ReferralStatusChip = ({ status }: { status: string }) => getStatusBadge(status)

    const ReceivedReferralCard = ({ referral }: { referral: any }) => (
        <Card className="md:hidden">
            <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-semibold leading-tight">{referral.patient_name}</p>
                        {referral.patient_age && (
                            <p className="text-xs text-muted-foreground">{referral.patient_age} anos</p>
                        )}
                    </div>
                    <ReferralStatusChip status={referral.status} />
                </div>

                <div className="space-y-3 text-sm">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Solicita</p>
                        <p className="mt-1">{referral.referring_psychologist?.full_name || 'N/A'}</p>
                        {referral.referring_psychologist?.specialty && (
                            <p className="text-xs text-muted-foreground">{referral.referring_psychologist.specialty}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Motivo</p>
                        <p className="mt-1 text-sm">{referral.reason}</p>
                        <div className="mt-2">{getUrgencyBadge(referral.urgency)}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha</p>
                            <p className="mt-1 text-sm text-muted-foreground">{formatDate(referral.created_at)}</p>
                        </div>
                        <div>
                            {referral.status === 'assigned' ? (
                                <ReferralResponseButtons referralId={referral.id} />
                            ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const SentReferralCard = ({ referral }: { referral: any }) => (
        <Card className="md:hidden">
            <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-semibold leading-tight">{referral.patient_name}</p>
                        {referral.patient_age && (
                            <p className="text-xs text-muted-foreground">{referral.patient_age} anos</p>
                        )}
                    </div>
                    <ReferralStatusChip status={referral.status} />
                </div>

                <div className="space-y-3 text-sm">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Especialidad</p>
                        <p className="mt-1">{referral.specialty_needed || '-'}</p>
                        <div className="mt-2">{getUrgencyBadge(referral.urgency)}</div>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Asignado a</p>
                        {referral.receiving_psychologist ? (
                            <div className="mt-1">
                                <p className="text-sm">{referral.receiving_psychologist.full_name}</p>
                                {referral.receiving_psychologist.specialty && (
                                    <p className="text-xs text-muted-foreground">{referral.receiving_psychologist.specialty}</p>
                                )}
                            </div>
                        ) : (
                            <p className="mt-1 text-sm text-muted-foreground italic">Pendiente de asignar</p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatDate(referral.created_at)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <GitBranch className="h-8 w-8" />
                        Canalizacion Clinica
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Solicita apoyo para transferir pacientes a colegas adecuados con trazabilidad y sin pago por derivacion
                    </p>
                </div>
                {hasAcceptedTerms && <NewReferralForm />}
            </div>

            {!hasAcceptedTerms && (
                <Card className="border-yellow-200 dark:border-yellow-800/50 bg-yellow-50/50 dark:bg-yellow-900/10">
                    <CardContent className="flex items-start gap-4 pt-6">
                        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 shrink-0" />
                        <div>
                            <h3 className="font-semibold">Lineamientos no aceptados</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Para participar en la red de canalizacion clinica debes aceptar los lineamientos eticos.
                                Ve a <strong>Configuracion - Perfil Profesional - Canalizacion</strong> para aceptarlos.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sent.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recibidas</CardTitle>
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{received.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Seguimiento</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inProgressCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transferencias Cerradas</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{handoffCompletedCount}</div>
                    </CardContent>
                </Card>
            </div>

            {received.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowDownLeft className="h-5 w-5 text-green-500" />
                            Canalizaciones Recibidas
                        </CardTitle>
                        <CardDescription>Casos que otros colegas te han solicitado recibir</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 md:hidden">
                            {received.map((referral: any) => (
                                <ReceivedReferralCard key={referral.id} referral={referral} />
                            ))}
                        </div>
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-sm">Paciente</th>
                                        <th className="text-left py-3 px-4 font-medium text-sm">Solicita</th>
                                        <th className="text-left py-3 px-4 font-medium text-sm">Motivo</th>
                                        <th className="text-left py-3 px-4 font-medium text-sm">Estado</th>
                                        <th className="text-left py-3 px-4 font-medium text-sm">Fecha</th>
                                        <th className="text-right py-3 px-4 font-medium text-sm">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {received.map((referral: any) => (
                                        <tr key={referral.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{referral.patient_name}</p>
                                                    {referral.patient_age && <p className="text-xs text-muted-foreground">{referral.patient_age} anos</p>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm">{referral.referring_psychologist?.full_name || 'N/A'}</p>
                                                {referral.referring_psychologist?.specialty && (
                                                    <p className="text-xs text-muted-foreground">{referral.referring_psychologist.specialty}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm max-w-[200px] truncate">{referral.reason}</p>
                                                {getUrgencyBadge(referral.urgency)}
                                            </td>
                                            <td className="py-3 px-4">{getStatusBadge(referral.status)}</td>
                                            <td className="py-3 px-4">
                                                <span className="text-sm text-muted-foreground">{formatDate(referral.created_at)}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {referral.status === 'assigned' ? (
                                                    <ReferralResponseButtons referralId={referral.id} />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5 text-blue-500" />
                        Canalizaciones Solicitadas
                    </CardTitle>
                    <CardDescription>Pacientes para quienes has pedido continuidad de cuidado con otro colega</CardDescription>
                </CardHeader>
                <CardContent>
                    {sent.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No has solicitado canalizaciones aun</p>
                            <p className="text-sm mt-1">Cuando necesites transferir un caso a otro colega, hazlo desde aqui.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 md:hidden">
                                {sent.map((referral: any) => (
                                    <SentReferralCard key={referral.id} referral={referral} />
                                ))}
                            </div>
                            <div className="overflow-x-auto hidden md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-sm">Paciente</th>
                                        <th className="text-left py-3 px-4 font-medium text-sm">Especialidad</th>
                                        <th className="text-left py-3 px-4 font-medium text-sm">Asignado a</th>
                                        <th className="text-left py-3 px-4 font-medium text-sm">Estado</th>
                                        <th className="text-left py-3 px-4 font-medium text-sm">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sent.map((referral: any) => (
                                        <tr key={referral.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{referral.patient_name}</p>
                                                    {referral.patient_age && <p className="text-xs text-muted-foreground">{referral.patient_age} anos</p>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm">{referral.specialty_needed || '-'}</p>
                                                {getUrgencyBadge(referral.urgency)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {referral.receiving_psychologist ? (
                                                    <div>
                                                        <p className="text-sm">{referral.receiving_psychologist.full_name}</p>
                                                        {referral.receiving_psychologist.specialty && (
                                                            <p className="text-xs text-muted-foreground">{referral.receiving_psychologist.specialty}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground italic">Pendiente de asignar</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">{getStatusBadge(referral.status)}</td>
                                            <td className="py-3 px-4">
                                                <span className="text-sm text-muted-foreground">{formatDate(referral.created_at)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

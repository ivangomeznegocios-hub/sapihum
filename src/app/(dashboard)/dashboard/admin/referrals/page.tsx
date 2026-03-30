import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import {
    AssignReferralForm, MarkHandoffCompletedButton,
    CancelReferralButton, PublicReferralsToggle
} from './admin-referral-forms'
import {
    GitBranch, CheckCircle2, User, ArrowUpRight, AlertTriangle
} from 'lucide-react'

export default async function AdminReferralsPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) redirect('/auth/login')
    if (profile.role !== 'admin') redirect('/dashboard')

    const { data: referrals } = await (supabase
        .from('referrals') as any)
        .select(`
            *,
            referring_psychologist:referring_psychologist_id(id, full_name, specialty),
            receiving_psychologist:receiving_psychologist_id(id, full_name, specialty)
        `)
        .eq('referral_domain', 'clinical_referral')
        .order('created_at', { ascending: false })

    const { data: eligiblePsychologists } = await (supabase
        .from('profiles') as any)
        .select('id, full_name, specialty')
        .eq('role', 'psychologist')
        .eq('accepts_referral_terms', true)
        .order('full_name')

    const { data: publicSetting } = await (supabase
        .from('platform_settings') as any)
        .select('value')
        .eq('key', 'allow_public_referrals')
        .single()

    const allReferrals = referrals || []
    const eligible = eligiblePsychologists || []
    const publicEnabled = publicSetting?.value === true || publicSetting?.value === 'true'

    const pending = allReferrals.filter((referral: any) => referral.status === 'pending')
    const active = allReferrals.filter((referral: any) => ['assigned', 'accepted'].includes(referral.status))
    const handoffCompleted = allReferrals.filter((referral: any) => ['handoff_completed', 'completed'].includes(referral.status))

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { cls: string, label: string }> = {
            pending: { cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200', label: 'Pendiente' },
            assigned: { cls: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow', label: 'Asignada' },
            accepted: { cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', label: 'Aceptada' },
            rejected: { cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', label: 'Rechazada' },
            handoff_completed: { cls: 'bg-brand-brown text-brand-brown dark:bg-brand-brown/30 dark:text-brand-brown', label: 'Transferencia clinica' },
            completed: { cls: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200', label: 'Completada' },
            cancelled: { cls: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400', label: 'Cancelada' },
        }
        const badge = badges[status] || badges.pending
        return <span className={`text-xs px-2 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
    }

    const formatDate = (date: string) => new Date(date).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric'
    })

    return (
        <div className="w-full space-y-8">
            <div>
                <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    <GitBranch className="h-8 w-8" />
                    Gestion de Canalizacion Clinica
                </h1>
                <p className="text-muted-foreground mt-1">
                    Supervisa, asigna y cierra transferencias de cuidado sin contraprestacion economica por paciente
                </p>
            </div>

            <PublicReferralsToggle currentValue={publicEnabled} />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Por Asignar</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pending.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Seguimiento</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-brand-yellow" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{active.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transferencias Cerradas</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-brand-brown" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{handoffCompleted.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Psic. Elegibles</CardTitle>
                        <User className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{eligible.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todas las Canalizaciones</CardTitle>
                    <CardDescription>
                        {allReferrals.length} casos registrados en la red de transferencia clinica
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {allReferrals.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay canalizaciones aun</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-[980px] w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-3 font-medium">Paciente</th>
                                        <th className="text-left py-3 px-3 font-medium">Solicita</th>
                                        <th className="text-left py-3 px-3 font-medium">Motivo</th>
                                        <th className="text-left py-3 px-3 font-medium">Asignado a</th>
                                        <th className="text-left py-3 px-3 font-medium">Estado</th>
                                        <th className="text-left py-3 px-3 font-medium">Fecha</th>
                                        <th className="text-right py-3 px-3 font-medium">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allReferrals.map((referral: any) => (
                                        <tr key={referral.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-3">
                                                <div>
                                                    <p className="font-medium">{referral.patient_name}</p>
                                                    {referral.patient_age && <span className="text-xs text-muted-foreground">{referral.patient_age} anos</span>}
                                                    {referral.urgency === 'urgente' && <span className="ml-1 text-xs text-red-600">Urgente</span>}
                                                    {referral.urgency === 'alta' && <span className="ml-1 text-xs text-orange-600">Alta</span>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">{referral.referring_psychologist?.full_name || '-'}</td>
                                            <td className="py-3 px-3">
                                                <p className="max-w-[180px] truncate" title={referral.reason}>{referral.reason}</p>
                                            </td>
                                            <td className="py-3 px-3">
                                                {referral.receiving_psychologist ? referral.receiving_psychologist.full_name : (
                                                    <span className="text-muted-foreground italic text-xs">Sin asignar</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3">{getStatusBadge(referral.status)}</td>
                                            <td className="py-3 px-3 text-muted-foreground text-xs">{formatDate(referral.created_at)}</td>
                                            <td className="py-3 px-3 text-right">
                                                <div className="flex flex-col gap-1 items-end">
                                                    {referral.status === 'pending' && (
                                                        <AssignReferralForm
                                                            referralId={referral.id}
                                                            eligiblePsychologists={eligible.filter((psych: any) => psych.id !== referral.referring_psychologist_id)}
                                                        />
                                                    )}
                                                    {referral.status === 'accepted' && (
                                                        <MarkHandoffCompletedButton referralId={referral.id} />
                                                    )}
                                                    {!['completed', 'cancelled', 'handoff_completed'].includes(referral.status) && (
                                                        <CancelReferralButton referralId={referral.id} />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

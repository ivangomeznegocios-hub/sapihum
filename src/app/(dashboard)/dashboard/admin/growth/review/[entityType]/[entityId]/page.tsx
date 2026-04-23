import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Gift,
    ShieldCheck,
    Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getGrowthAdminReviewData } from '@/lib/growth/queries'
import {
    GrowthAttributionFraudButton,
    GrowthConversionFraudButton,
    GrowthFlagReviewActions,
    GrowthRewardActions,
} from '../../../admin-growth-forms'

const entityLabels: Record<string, string> = {
    attributions: 'Atribucion',
    conversions: 'Conversion',
    rewards: 'Reward',
    flags: 'Flag',
}

const rewardTypeLabels: Record<string, string> = {
    extra_days: 'Dias extra',
    level2_free_month: 'Nivel 2 gratis',
    upgrade_temp: 'Upgrade temporal',
    badge: 'Badge',
    manual_bonus: 'Bono manual',
    commission: 'Comision',
    revenue_share: 'Revenue share',
    custom: 'Reward especial',
}

function formatDate(value?: string | null) {
    if (!value) return 'Sin fecha'
    return new Date(value).toLocaleString('es-MX')
}

function DetailCard({
    title,
    children,
}: {
    title: string
    children: ReactNode
}) {
    return (
        <section className="rounded-2xl border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
            {children}
        </section>
    )
}

export default async function GrowthReviewPage({
    params,
}: {
    params: Promise<{ entityType: string; entityId: string }>
}) {
    const { entityType, entityId } = await params
    if (!['attributions', 'conversions', 'rewards', 'flags'].includes(entityType)) notFound()

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'admin') redirect('/dashboard')

    const review = await getGrowthAdminReviewData({
        entityType: entityType as 'attributions' | 'conversions' | 'rewards' | 'flags',
        entityId,
    })

    if (!review) notFound()

    const primary = review.primary

    return (
        <div className="w-full max-w-6xl space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link href="/dashboard/admin/growth" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Volver a growth admin
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Revision de {entityLabels[review.entityType] || review.entityType}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Caso {primary.id}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {review.attribution?.id && <GrowthAttributionFraudButton attributionId={review.attribution.id} />}
                    {review.entityType === 'conversions' && primary.id && <GrowthConversionFraudButton conversionId={primary.id} />}
                    {review.entityType === 'rewards' && primary.id && <GrowthRewardActions reward={{ id: primary.id, status: primary.status }} />}
                    {review.entityType === 'flags' && primary.id && <GrowthFlagReviewActions flagId={primary.id} status={primary.status} />}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 text-primary" />
                        Estado actual
                    </div>
                    <p className="mt-3 text-2xl font-bold">{primary.status || primary.rejection_reason || 'Sin estado'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Creado: {formatDate(primary.created_at)}
                    </p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Gift className="h-4 w-4 text-primary" />
                        Rewards relacionados
                    </div>
                    <p className="mt-3 text-2xl font-bold">{review.rewards.length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Beneficios activos: {review.benefits.length}
                    </p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Flags abiertos
                    </div>
                    <p className="mt-3 text-2xl font-bold">{review.flags.filter((flag: any) => flag.status === 'open').length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Conversiones vinculadas: {review.conversions.length}
                    </p>
                </div>
            </div>

            {review.attribution && (
                <DetailCard title="Atribucion">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border p-4">
                            <p className="text-sm font-medium">{review.attribution.invitee?.full_name || review.attribution.invitee?.email || 'Invitado'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Owner: {review.attribution.owner?.full_name || review.attribution.owner?.email || 'Sin owner'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Codigo: {review.attribution.referral_code_used || 'Sin codigo'}</p>
                        </div>
                        <div className="rounded-xl border p-4">
                            <p className="text-xs text-muted-foreground">Fuente: {review.attribution.source_type} / {review.attribution.source_channel}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Capturada: {formatDate(review.attribution.captured_at)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Registrada: {formatDate(review.attribution.registered_at)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Pagada: {formatDate(review.attribution.paid_at)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Calificada: {formatDate(review.attribution.qualified_at)}</p>
                        </div>
                    </div>
                </DetailCard>
            )}

            <DetailCard title="Conversiones">
                {review.conversions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin conversiones relacionadas.</p>
                ) : (
                    <div className="space-y-3">
                        {review.conversions.map((conversion: any) => (
                            <div key={conversion.id} className="rounded-xl border p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{conversion.invitee?.full_name || conversion.invitee?.email || 'Invitado'}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Estado: {conversion.status}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Activada: {formatDate(conversion.activated_at)}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Calificada: {formatDate(conversion.qualified_at)}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Rule: {conversion.metadata?.consolidation?.qualified_by_rule || conversion.metadata?.consolidation?.primary_rule || 'Sin regla'}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={`/dashboard/admin/growth/review/conversions/${conversion.id}`} className="text-xs text-primary hover:underline">
                                            Abrir conversion
                                        </Link>
                                        <GrowthConversionFraudButton conversionId={conversion.id} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DetailCard>

            <DetailCard title="Rewards">
                {review.rewards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin rewards relacionados.</p>
                ) : (
                    <div className="space-y-3">
                        {review.rewards.map((reward: any) => (
                            <div key={reward.id} className="rounded-xl border p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{rewardTypeLabels[reward.reward_type] || reward.reward_type}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Estado: {reward.status}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Beneficiario: {reward.beneficiary?.full_name || reward.beneficiary?.email || 'Usuario'}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Creado: {formatDate(reward.created_at)}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={`/dashboard/admin/growth/review/rewards/${reward.id}`} className="text-xs text-primary hover:underline">
                                            Abrir reward
                                        </Link>
                                        <GrowthRewardActions reward={{ id: reward.id, status: reward.status }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DetailCard>

            <DetailCard title="Beneficios aplicados">
                {review.benefits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin beneficios activos o historicos para este caso.</p>
                ) : (
                    <div className="space-y-3">
                        {review.benefits.map((benefit: any) => (
                            <div key={benefit.id} className="rounded-xl border p-4">
                                <p className="text-sm font-medium">{benefit.benefit_type}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Nivel: {benefit.membership_level}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Inicio: {formatDate(benefit.starts_at)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Fin: {formatDate(benefit.ends_at)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Estado: {benefit.status}</p>
                            </div>
                        ))}
                    </div>
                )}
            </DetailCard>

            <DetailCard title="Flags de fraude">
                {review.flags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin flags relacionados.</p>
                ) : (
                    <div className="space-y-3">
                        {review.flags.map((flag: any) => (
                            <div key={flag.id} className="rounded-xl border p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{flag.flag_type}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Estado: {flag.status}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Severidad: {flag.severity}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Usuario: {flag.user?.full_name || flag.user?.email || 'Sin usuario'}</p>
                                        {flag.notes && <p className="mt-1 text-xs text-muted-foreground">{flag.notes}</p>}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={`/dashboard/admin/growth/review/flags/${flag.id}`} className="text-xs text-primary hover:underline">
                                            Abrir flag
                                        </Link>
                                        <GrowthFlagReviewActions flagId={flag.id} status={flag.status} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DetailCard>

            {review.primary?.metadata && (
                <DetailCard title="Metadata">
                    <pre className="overflow-x-auto rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
                        {JSON.stringify(review.primary.metadata, null, 2)}
                    </pre>
                </DetailCard>
            )}

            {review.primary?.status === 'qualified' && (
                <div className="rounded-2xl border border-green-600/20 bg-green-600/5 p-4 text-sm text-green-700">
                    <div className="flex items-center gap-2 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Caso consolidado
                    </div>
                    <p className="mt-1 text-xs text-green-700/80">
                        La consolidacion se resolvio con la regla {review.primary?.metadata?.consolidation?.qualified_by_rule || 'no registrada'}.
                    </p>
                </div>
            )}

            {review.primary?.status === 'fraud_flagged' && (
                <div className="rounded-2xl border border-red-600/20 bg-red-600/5 p-4 text-sm text-red-700">
                    <div className="flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        Caso marcado como fraude
                    </div>
                    <p className="mt-1 text-xs text-red-700/80">
                        Revisa rewards revocados y flags confirmados antes de cerrar el caso.
                    </p>
                </div>
            )}
        </div>
    )
}

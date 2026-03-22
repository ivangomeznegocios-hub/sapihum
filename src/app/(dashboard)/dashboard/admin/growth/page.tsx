import { redirect } from 'next/navigation'
import {
    Award,
    BarChart3,
    BriefcaseBusiness,
    CheckCircle2,
    Gift,
    Megaphone,
    ShieldCheck,
    Share2,
    TrendingUp,
    Users,
    type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getInviteSystemStats, getUnprocessedRewardEvents } from '@/lib/supabase/queries/invite-referrals'
import { getAllCampaigns, getTopReferrers } from '@/lib/supabase/queries/growth-campaigns'
import {
    CreateCampaignSection,
    DeleteCampaignButton,
    ProcessRewardButton,
    ToggleCampaignButton,
} from './admin-growth-forms'
import { cn } from '@/lib/utils'

const campaignTypeLabels: Record<string, string> = {
    referral_boost: 'Referral boost',
    milestone: 'Milestone',
    promo: 'Promocion',
    challenge: 'Reto',
    custom: 'Custom',
}

const rewardTypeLabels: Record<string, string> = {
    credit: 'Credito',
    discount: 'Descuento',
    unlock: 'Unlock',
    commission: 'Comision',
    cash_bonus: 'Bono en efectivo',
    membership_benefit: 'Beneficio de membresia',
    custom: 'Reward especial',
}

const triggerLabels: Record<string, string> = {
    signup: 'Registro validado',
    profile_completed: 'Perfil completo',
    subscription: 'Primera suscripcion',
    first_purchase: 'Primera compra',
    event_purchase: 'Compra de evento',
}

const roleLabels: Record<string, string> = {
    psychologist: 'Psicologos',
    ponente: 'Ponentes',
    patient: 'Pacientes',
    admin: 'Admins',
}

function formatCurrency(value: unknown): string {
    const amount = Number(value)
    if (!Number.isFinite(amount)) return ''

    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatRewardValue(config?: Record<string, any> | null): string {
    if (!config) return ''
    if (config.label) return String(config.label)
    if (config.amount !== undefined && config.amount !== null) return formatCurrency(config.amount)
    if (config.percentage !== undefined && config.percentage !== null) return `${config.percentage}%`
    return rewardTypeLabels[config.reward_type] || 'Reward'
}

function formatRoleList(roles?: string[] | null): string {
    if (!roles || roles.length === 0) return 'Sin definir'
    return roles.map((role) => roleLabels[role] || role).join(', ')
}

function formatTriggerList(triggers?: string[] | null): string {
    if (!triggers || triggers.length === 0) return 'Sin definir'
    return triggers.map((trigger) => triggerLabels[trigger] || trigger).join(', ')
}

function MetricCard({
    label,
    value,
    icon: Icon,
    color,
    description,
}: {
    label: string
    value: number | string
    icon: LucideIcon
    color: string
    description: string
}) {
    return (
        <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-start gap-3">
                <div className={cn('rounded-xl bg-muted/50 p-2', color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">{description}</p>
                </div>
            </div>
        </div>
    )
}

export default async function AdminGrowthPage() {
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

    const [systemStats, unprocessedRewards, campaigns, topReferrers] = await Promise.all([
        getInviteSystemStats(),
        getUnprocessedRewardEvents(),
        getAllCampaigns(),
        getTopReferrers(20),
    ])

    const conversionRate =
        systemStats && systemStats.totalAttributions > 0
            ? ((systemStats.completedAttributions / systemStats.totalAttributions) * 100).toFixed(1)
            : '0.0'

    return (
        <div className="w-full max-w-7xl space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 text-white shadow-lg shadow-emerald-500/20">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Programa de Invitacion Profesional</h1>
                        <p className="text-sm text-muted-foreground">
                            Growth monetizable para adquisicion de psicologos y ponentes, separado de la canalizacion clinica.
                        </p>
                    </div>
                </div>

                <CreateCampaignSection />
            </div>

            <div className="rounded-2xl border bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-5 dark:from-emerald-950/10 dark:via-background dark:to-teal-950/10">
                <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <BriefcaseBusiness className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Motor economico permitido</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Aqui si se empujan payouts, boosts, hitos y rewards duales para atraer profesionales a la plataforma. El modulo clinico queda excluido por diseno.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-background/70 p-4 text-sm">
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                            <div>
                                <p className="font-medium">Enforcement activo</p>
                                <p className="text-muted-foreground">
                                    Todas las campanas y reward events de este panel se fijan a <code>professional_invite</code>. Ninguna accion clinica puede escribir aqui.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    Salud del programa
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricCard
                        label="Codigos activos"
                        value={systemStats?.totalCodes ?? 0}
                        icon={Share2}
                        color="text-blue-600 dark:text-blue-400"
                        description="Base de embajadores con codigo disponible"
                    />
                    <MetricCard
                        label="Invitados psicologos"
                        value={systemStats?.psychologistAttributions ?? 0}
                        icon={Users}
                        color="text-emerald-600 dark:text-emerald-400"
                        description="Adquisicion del target principal"
                    />
                    <MetricCard
                        label="Invitados ponentes"
                        value={systemStats?.ponenteAttributions ?? 0}
                        icon={Megaphone}
                        color="text-violet-600 dark:text-violet-400"
                        description="Expansion de speakers y visibilidad"
                    />
                    <MetricCard
                        label="Conversion"
                        value={`${conversionRate}%`}
                        icon={CheckCircle2}
                        color="text-amber-600 dark:text-amber-400"
                        description="Invitaciones completadas o recompensadas"
                    />
                    <MetricCard
                        label="Rewards pendientes"
                        value={systemStats?.pendingRewards ?? 0}
                        icon={Gift}
                        color="text-rose-600 dark:text-rose-400"
                        description="Eventos listos para procesar payout"
                    />
                </div>
            </div>

            <div>
                <div className="mb-4 flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Campanas configuradas</h2>
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {campaigns.length} total
                    </span>
                </div>

                {campaigns.length === 0 ? (
                    <div className="rounded-2xl border bg-muted/10 py-10 text-center">
                        <Megaphone className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Aun no hay campanas de invitacion profesional.</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Crea retos agresivos de activacion, volumen y suscripcion para mover el programa.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {campaigns.map((campaign) => {
                            const rewardConfig = campaign.reward_config || {}
                            const stageRewards = rewardConfig.stage_rewards || {}
                            const milestoneRewards = rewardConfig.milestone_rewards || {}
                            const dualReward = rewardConfig.dual_reward || null
                            const rewardSummary = formatRewardValue(rewardConfig)
                            const stageEntries = Object.entries(stageRewards)
                            const milestoneEntries = Object.entries(milestoneRewards).sort(
                                (a, b) => Number(a[0]) - Number(b[0])
                            )

                            return (
                                <div
                                    key={campaign.id}
                                    className={cn(
                                        'rounded-2xl border p-5 transition-colors',
                                        campaign.is_active ? 'bg-card' : 'bg-muted/20 opacity-75'
                                    )}
                                >
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-semibold">{campaign.title}</h3>
                                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {campaignTypeLabels[campaign.campaign_type] || campaign.campaign_type}
                                                </span>
                                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                                    professional_invite
                                                </span>
                                            </div>

                                            {campaign.description && (
                                                <p className="mt-2 text-sm text-muted-foreground">{campaign.description}</p>
                                            )}

                                            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                                <div className="rounded-xl border bg-background/70 p-3">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Regla economica
                                                    </p>
                                                    <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                                                        <p>Reward base: {rewardSummary || 'Sin definir'}</p>
                                                        <p>Visible para: {formatRoleList(campaign.target_roles)}</p>
                                                        <p>Puede invitar: {formatRoleList(campaign.eligible_referrer_roles)}</p>
                                                        <p>Invitado elegible: {formatRoleList(campaign.eligible_referred_roles)}</p>
                                                        <p>Triggers: {formatTriggerList(campaign.allowed_trigger_events)}</p>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border bg-background/70 p-3">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Fechas y bonos
                                                    </p>
                                                    <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                                                        <p>
                                                            Inicio: {campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString('es-MX') : 'Inmediato'}
                                                        </p>
                                                        <p>
                                                            Fin: {campaign.ends_at ? new Date(campaign.ends_at).toLocaleDateString('es-MX') : 'Sin cierre'}
                                                        </p>
                                                        <p>Orden: {campaign.sort_order}</p>
                                                        {dualReward && (
                                                            <p>
                                                                Reward dual: <span className="font-medium text-foreground">{formatRewardValue(dualReward)}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {(stageEntries.length > 0 || milestoneEntries.length > 0) && (
                                                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                                    <div className="rounded-xl border bg-background/70 p-3">
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Bonos por activacion
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {stageEntries.length === 0 ? (
                                                                <span className="text-xs text-muted-foreground">Sin bonos por etapa</span>
                                                            ) : (
                                                                stageEntries.map(([trigger, value]) => (
                                                                    <span key={trigger} className="rounded-full bg-muted px-2 py-1 text-xs">
                                                                        {triggerLabels[trigger] || trigger}: {formatCurrency(value)}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="rounded-xl border bg-background/70 p-3">
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Bonos por volumen
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {milestoneEntries.length === 0 ? (
                                                                <span className="text-xs text-muted-foreground">Sin hitos definidos</span>
                                                            ) : (
                                                                milestoneEntries.map(([count, value]) => (
                                                                    <span key={count} className="rounded-full bg-muted px-2 py-1 text-xs">
                                                                        {count} activaciones: {formatCurrency(value)}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5 sm:justify-start xl:flex-shrink-0 xl:justify-end">
                                            <ToggleCampaignButton campaignId={campaign.id} isActive={campaign.is_active} />
                                            <DeleteCampaignButton campaignId={campaign.id} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border bg-card p-5">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        <Award className="h-4 w-4" />
                        Rewards pendientes ({unprocessedRewards.length})
                    </h2>

                    {unprocessedRewards.length === 0 ? (
                        <div className="py-6 text-center text-muted-foreground">
                            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 opacity-40" />
                            <p className="text-sm">No hay payouts pendientes.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {unprocessedRewards.map((reward: any) => (
                            <div key={reward.id} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">{reward.beneficiary?.full_name || 'Usuario'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {rewardTypeLabels[reward.reward_type] || reward.reward_type}
                                            {reward.reward_value ? ` - ${formatRewardValue(reward.reward_value)}` : ''}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Trigger: {triggerLabels[reward.trigger_event] || reward.trigger_event}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(reward.created_at).toLocaleDateString('es-MX')}
                                        </p>
                                    </div>
                                    <ProcessRewardButton rewardEventId={reward.id} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Embajadores top
                    </h2>

                    {topReferrers.length === 0 ? (
                        <div className="py-6 text-center text-muted-foreground">
                            <Users className="mx-auto mb-2 h-6 w-6 opacity-40" />
                            <p className="text-sm">Aun no hay actividad en el ranking.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {topReferrers.map((referrer, index) => (
                                <div key={referrer.id} className="flex flex-col gap-2 rounded-xl px-2 py-2 hover:bg-muted/50 sm:flex-row sm:items-center">
                                    <span className="w-6 shrink-0 text-center text-xs font-bold text-muted-foreground">
                                        {index + 1}
                                    </span>
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                                        {referrer.avatar_url ? (
                                            <img src={referrer.avatar_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                {(referrer.full_name || '?').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{referrer.full_name || 'Usuario'}</p>
                                        <p className="text-[10px] text-muted-foreground">{roleLabels[referrer.role] || referrer.role}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-bold">{referrer.total_referrals}</p>
                                        <p className="text-[10px] text-muted-foreground">{referrer.completed_referrals} activados</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

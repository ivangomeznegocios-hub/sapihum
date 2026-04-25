'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Crown,
    Gift,
    Share2,
    Sparkles,
    Target,
    Trophy,
    Zap,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GrowthCampaign } from '@/types/database'
import {
    createGroupPackAction,
    inviteGroupPackMemberAction,
    refreshGroupPackAction,
} from './actions'

const rewardTypeLabels: Record<string, string> = {
    extra_days: 'Dias extra',
    level2_free_month: 'Nivel 2 gratis',
    upgrade_temp: 'Upgrade temporal',
    exclusive_session: 'Sesion exclusiva',
    badge: 'Badge',
    manual_bonus: 'Bono manual',
    revenue_share: 'Revenue share',
    credit: 'Credito',
    discount: 'Descuento',
    unlock: 'Beneficio desbloqueado',
    commission: 'Comision',
    cash_bonus: 'Bono en efectivo',
    membership_benefit: 'Beneficio de membresia',
    custom: 'Reward especial',
}

const rewardTriggerLabels: Record<string, string> = {
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

const campaignTypeConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
    referral_boost: {
        icon: Zap,
        color: 'text-brand-yellow dark:text-brand-yellow',
        bg: 'bg-brand-yellow/80 border-brand-yellow dark:bg-brand-yellow/20 dark:border-brand-yellow',
    },
    milestone: {
        icon: Trophy,
        color: 'text-brand-brown dark:text-brand-brown',
        bg: 'bg-brand-brown/80 border-brand-brown dark:bg-brand-brown/20 dark:border-brand-brown',
    },
    promo: {
        icon: Gift,
        color: 'text-brand-brown dark:text-brand-brown',
        bg: 'bg-brand-brown/80 border-brand-brown dark:bg-brand-brown/20 dark:border-brand-brown',
    },
    challenge: {
        icon: Target,
        color: 'text-brand-brown dark:text-brand-brown',
        bg: 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900',
    },
    custom: {
        icon: Sparkles,
        color: 'text-brand-yellow dark:text-brand-yellow',
        bg: 'bg-brand-yellow/80 border-brand-yellow dark:bg-brand-yellow/20 dark:border-brand-yellow',
    },
}

function formatCurrency(value: unknown): string {
    const amount = Number(value)
    if (!Number.isFinite(amount)) {
        return ''
    }

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
    return triggers.map((trigger) => rewardTriggerLabels[trigger] || trigger).join(', ')
}

function getTimeLabel(endsAt: string | null): string {
    if (!endsAt) return ''

    const now = new Date()
    const end = new Date(endsAt)
    const diffMs = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Cierra hoy'
    if (diffDays === 1) return 'Ultimo dia'
    if (diffDays <= 30) return `${diffDays} dias restantes`

    const months = Math.floor(diffDays / 30)
    return `${months} mes${months === 1 ? '' : 'es'} restantes`
}

export function CopyCodeButton({ code }: { code: string }) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            const input = document.createElement('input')
            input.value = code
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? (
                <>
                    <Check className="h-3.5 w-3.5 text-brand-brown" />
                    Copiado
                </>
            ) : (
                <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar codigo
                </>
            )}
        </Button>
    )
}

export function ShareLinkButton({ code, baseUrl }: { code: string; baseUrl: string }) {
    const [shared, setShared] = useState(false)
    const inviteLink = `${baseUrl}/auth/register?ref=${code}`

    async function handleShare() {
        const shareData: ShareData = {
            title: 'Invitación profesional a SAPIHUM',
            text: 'Te invito a sumarte a SAPIHUM como profesional. Usa mi código para registrarte.',
            url: inviteLink,
        }

        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(inviteLink)
            }

            setShared(true)
            setTimeout(() => setShared(false), 2000)
        } catch {
            // Ignore user cancellation
        }
    }

    return (
        <Button size="sm" onClick={handleShare} className="gap-1.5">
            {shared ? (
                <>
                    <Check className="h-3.5 w-3.5" />
                    Compartido
                </>
            ) : (
                <>
                    <Share2 className="h-3.5 w-3.5" />
                    Compartir link
                </>
            )}
        </Button>
    )
}

export function CopyLinkButton({ code, baseUrl }: { code: string; baseUrl: string }) {
    const [copied, setCopied] = useState(false)
    const inviteLink = `${baseUrl}/auth/register?ref=${code}`

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(inviteLink)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Ignore clipboard errors
        }
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            {copied ? (
                <>
                    <Check className="h-3 w-3 text-brand-brown" />
                    Link copiado
                </>
            ) : (
                <>
                    <Copy className="h-3 w-3" />
                    Copiar link
                </>
            )}
        </Button>
    )
}

export function CampaignCard({ campaign }: { campaign: GrowthCampaign }) {
    const config = campaignTypeConfig[campaign.campaign_type] || campaignTypeConfig.custom
    const Icon = config.icon
    const rewardConfig = campaign.reward_config || {}
    const stageRewards = rewardConfig.stage_rewards || {}
    const milestoneRewards = rewardConfig.milestone_rewards || {}
    const dualReward = rewardConfig.dual_reward || null

    const stageEntries = ['signup', 'profile_completed', 'subscription', 'first_purchase']
        .filter((key) => stageRewards[key] !== undefined && stageRewards[key] !== null)
        .map((key) => ({
            key,
            label: rewardTriggerLabels[key] || key,
            value: formatCurrency(stageRewards[key]),
        }))

    const milestoneEntries = Object.entries(milestoneRewards)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([count, value]) => ({
            label: `${count} activaciones`,
            value: formatCurrency(value),
        }))

    const baseRewardLabel = formatRewardValue(rewardConfig)
    const dualRewardLabel = formatRewardValue(dualReward)
    const timeLabel = getTimeLabel(campaign.ends_at)

    return (
        <div className={cn('rounded-2xl border p-5 transition-all hover:shadow-md', config.bg)}>
            <div className="flex items-start gap-3">
                <div className={cn('rounded-xl p-2.5 bg-white/80 dark:bg-white/5', config.color)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold">{campaign.title}</h3>
                            {campaign.description && (
                                <p className="mt-1 text-xs text-muted-foreground">{campaign.description}</p>
                            )}
                        </div>
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:bg-white/10">
                            Invitacion profesional
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {baseRewardLabel && (
                            <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium dark:bg-white/10">
                                Pago base: {baseRewardLabel}
                            </span>
                        )}
                        {timeLabel && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium dark:bg-white/10">
                                <Clock className="h-3 w-3" />
                                {timeLabel}
                            </span>
                        )}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border bg-background/70 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Elegibilidad
                            </p>
                            <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                                <p>Visible para: {formatRoleList(campaign.target_roles)}</p>
                                <p>Puede invitar: {formatRoleList(campaign.eligible_referrer_roles)}</p>
                                <p>Invitado elegible: {formatRoleList(campaign.eligible_referred_roles)}</p>
                                <p>Triggers: {formatTriggerList(campaign.allowed_trigger_events)}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background/70 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Incentivos
                            </p>
                            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                                {stageEntries.length > 0 && (
                                    <div>
                                        <p className="font-medium text-foreground">Bonos por activacion</p>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {stageEntries.map((item) => (
                                                <span key={item.key} className="rounded-full bg-muted px-2 py-1">
                                                    {item.label}: {item.value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {milestoneEntries.length > 0 && (
                                    <div>
                                        <p className="font-medium text-foreground">Bonos por volumen</p>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {milestoneEntries.map((item) => (
                                                <span key={item.label} className="rounded-full bg-muted px-2 py-1">
                                                    {item.label}: {item.value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {dualRewardLabel && (
                                    <p>
                                        Invitado tambien recibe: <span className="font-medium text-foreground">{dualRewardLabel}</span>
                                    </p>
                                )}

                                {stageEntries.length === 0 && milestoneEntries.length === 0 && !dualRewardLabel && (
                                    <p>Campana de payout directo sin bonos adicionales.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function LeaderboardTable({
    referrers,
    currentUserId,
}: {
    referrers: {
        id: string
        full_name: string | null
        avatar_url: string | null
        role: string
        referral_code?: string | null
        rank_position?: number
        total_referrals: number
        completed_referrals: number
        monthly_qualified?: number
        monthly_paid?: number
        monthly_revenue?: number
    }[]
    currentUserId: string
}) {
    if (referrers.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <Trophy className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">Aun no hay embajadores.</p>
                <p className="mt-1 text-xs">Comparte tu codigo para iniciar el ranking.</p>
            </div>
        )
    }

    const medalColors = ['text-brand-yellow', 'text-neutral-500', 'text-orange-600']

    return (
        <div className="space-y-2">
            {referrers.map((referrer, index) => {
                const isCurrentUser = referrer.id === currentUserId
                const rank = referrer.rank_position ?? index + 1
                const isMonthlyProgramRow = referrer.monthly_qualified !== undefined
                const primaryScore = isMonthlyProgramRow ? referrer.monthly_qualified : referrer.total_referrals
                const secondaryScore = isMonthlyProgramRow
                    ? `${referrer.monthly_paid ?? 0} pagos - ${formatCurrency(referrer.monthly_revenue ?? 0)}`
                    : `${referrer.completed_referrals} activados`

                return (
                    <div
                        key={referrer.id}
                        className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                            isCurrentUser
                                ? 'border border-primary/20 bg-primary/5 dark:bg-primary/10'
                                : 'hover:bg-muted/50'
                        )}
                    >
                        <div className="w-8 shrink-0 text-center">
                            {rank <= 3 ? (
                                <Crown className={cn('mx-auto h-5 w-5', medalColors[index])} />
                            ) : (
                                <span className="text-sm font-medium text-muted-foreground">{rank}</span>
                            )}
                        </div>

                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                            {referrer.avatar_url ? (
                                <Image
                                    src={referrer.avatar_url}
                                    alt={referrer.full_name || ''}
                                    fill
                                    className="object-cover"
                                    sizes="32px"
                                />
                            ) : (
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {(referrer.full_name || '?').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className={cn('truncate text-sm font-medium', isCurrentUser && 'text-primary')}>
                                {referrer.full_name || 'Usuario'}
                                {isCurrentUser && <span className="ml-1.5 text-xs text-primary/70">(tu)</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {referrer.referral_code || roleLabels[referrer.role] || referrer.role}
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className="text-sm font-bold">{primaryScore}</p>
                            <p className="text-[10px] text-muted-foreground">{secondaryScore}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export function RewardTimeline({ rewards }: { rewards: any[] }) {
    if (rewards.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <Gift className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">Aun no tienes rewards de invitacion profesional.</p>
                <p className="mt-1 text-xs">Invita psicologos o ponentes para empezar a monetizar.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {rewards.map((reward) => {
                const valueLabel = formatRewardValue(reward.reward_value)
                const isGranted = reward.status ? reward.status === 'granted' : Boolean(reward.processed)
                const triggerLabel = reward.reason_type || reward.trigger_event

                return (
                    <div key={reward.id} className="flex items-start gap-3 rounded-xl border p-3">
                        <div
                            className={cn(
                                'mt-0.5 rounded-full p-1.5',
                                isGranted
                                    ? 'bg-brand-brown text-brand-brown dark:bg-brand-brown/30 dark:text-brand-brown'
                                    : 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow'
                            )}
                        >
                            {isGranted ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                                <Clock className="h-3.5 w-3.5" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                                {rewardTypeLabels[reward.reward_type] || 'Reward'}
                                {valueLabel && <span className="ml-1 text-primary">{valueLabel}</span>}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Programa: invitacion profesional
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Motivo: {rewardTriggerLabels[triggerLabel] || triggerLabel}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {new Date(reward.created_at).toLocaleDateString('es-MX', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </p>
                            {reward.notes && (
                                <p className="mt-1 text-xs italic text-muted-foreground">{reward.notes}</p>
                            )}
                        </div>

                        <span
                            className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                                isGranted
                                    ? 'bg-brand-brown text-brand-brown dark:bg-brand-brown/30 dark:text-brand-brown'
                                    : 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow'
                            )}
                        >
                            {isGranted ? 'Entregada' : reward.status === 'approved' ? 'Aprobada' : 'Pendiente'}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

export function GroupPackManager({
    groupPacks,
    baseUrl,
}: {
    groupPacks: any[]
    baseUrl: string
}) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading('create')
        setMessage(null)
        const result = await createGroupPackAction(new FormData(event.currentTarget))
        setMessage(result.success ? 'Pack creado' : result.error || 'Error al crear pack')
        setLoading(null)
        if (result.success) {
            event.currentTarget.reset()
            router.refresh()
        }
    }

    async function submitInvite(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading('invite')
        setMessage(null)
        const result = await inviteGroupPackMemberAction(new FormData(event.currentTarget))
        setMessage(result.success ? 'Integrante invitado' : result.error || 'Error al invitar')
        setLoading(null)
        if (result.success) {
            event.currentTarget.reset()
            router.refresh()
        }
    }

    async function refresh(packId: string) {
        setLoading(packId)
        const result = await refreshGroupPackAction(packId)
        setMessage(result.success ? 'Pack actualizado' : result.error || 'Error al actualizar')
        setLoading(null)
        if (result.success) router.refresh()
    }

    return (
        <div className="space-y-4">
            <form onSubmit={submitCreate} className="rounded-2xl border bg-card p-5">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">Packs grupales</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Crea un grupo comercial sin cambiar el owner principal de atribucion.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="text-xs font-medium">
                        Tipo de pack
                        <select name="packType" defaultValue="pack_3" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="pack_3">Pack 3</option>
                            <option value="pack_5">Pack 5</option>
                            <option value="pack_10">Pack 10</option>
                            <option value="custom">Custom</option>
                        </select>
                    </label>
                    <label className="text-xs font-medium">
                        Miembros requeridos
                        <input name="requiredMembers" type="number" min={1} defaultValue={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs font-medium xl:col-span-2">
                        Beneficio
                        <input name="benefitLabel" placeholder="Ej. beneficio grupal manual" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                    </label>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <Button type="submit" disabled={loading === 'create'} size="sm" className="gap-1.5">
                        {loading === 'create' ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Gift className="h-3.5 w-3.5" />}
                        Crear pack
                    </Button>
                    {message && <span className="text-xs text-muted-foreground">{message}</span>}
                </div>
            </form>

            {groupPacks.length === 0 ? (
                <div className="rounded-2xl border bg-muted/10 py-8 text-center text-sm text-muted-foreground">
                    Aun no tienes packs grupales.
                </div>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {groupPacks.map((pack) => {
                        const link = `${baseUrl}/auth/register?pack=${pack.pack_code}`
                        const progress = Math.min(100, Math.round((Number(pack.active_members_count ?? 0) / Math.max(1, Number(pack.required_members ?? 1))) * 100))

                        return (
                            <div key={pack.id} className="rounded-2xl border bg-card p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold">{pack.pack_type}</h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {pack.active_members_count ?? 0}/{pack.required_members} activos - faltan {pack.missing}
                                        </p>
                                    </div>
                                    <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                                        {pack.status}
                                    </span>
                                </div>
                                <div className="mt-3 rounded-xl bg-muted/50 px-3 py-2">
                                    <p className="font-mono text-xs">{link}</p>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                                </div>

                                <form onSubmit={submitInvite} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                                    <input type="hidden" name="groupPackId" value={pack.id} />
                                    <input name="invitedEmail" type="email" placeholder="email@dominio.com" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    <Button type="submit" disabled={loading === 'invite'} size="sm">
                                        Invitar
                                    </Button>
                                </form>

                                <div className="mt-4 space-y-2">
                                    {(pack.members ?? []).length === 0 ? (
                                        <p className="text-xs text-muted-foreground">Sin integrantes invitados.</p>
                                    ) : (
                                        (pack.members ?? []).map((member: any) => (
                                            <div key={member.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                                                <span>{member.invited_email || member.invited_phone || member.user_id || 'Integrante'}</span>
                                                <span className="rounded-full bg-muted px-2 py-0.5">{member.status}</span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(link)}>
                                        Copiar link
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" disabled={loading === pack.id} onClick={() => refresh(pack.id)}>
                                        Actualizar
                                    </Button>
                                    {pack.status === 'completed' && (
                                        <span className="text-xs font-medium text-primary">Beneficio desbloqueado</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

'use client'

import Image from 'next/image'
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
import type { GrowthCampaign, InviteRewardEvent } from '@/types/database'

const rewardTypeLabels: Record<string, string> = {
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

    if (config.benefit_kind === 'percent_discount') {
        return `${config.discount_percent ?? 0}% sobre ${config.target_membership_level === 'current' ? 'plan actual' : `Nivel ${config.target_membership_level}`}`
    }
    if (config.benefit_kind === 'free_membership_level') {
        return `${config.target_membership_level === 'current' ? 'Membresia actual' : `Nivel ${config.target_membership_level}`} gratis`
    }
    if (config.label) return String(config.label)
    if (config.amount !== undefined && config.amount !== null) return formatCurrency(config.amount)
    if (config.percentage !== undefined && config.percentage !== null) return `${config.percentage}%`

    return rewardTypeLabels[config.reward_type] || 'Reward'
}

function formatRoleList(roles?: string[] | null): string {
    if (!roles || roles.length === 0) return 'Sin definir'
    return roles.map((role) => roleLabels[role] || role).join(', ')
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
                                Beneficio: {baseRewardLabel}
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
                                <p>Hito: {rewardConfig.threshold_count ?? 0} invitados activos</p>
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
        total_referrals: number
        completed_referrals: number
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
                            {index < 3 ? (
                                <Crown className={cn('mx-auto h-5 w-5', medalColors[index])} />
                            ) : (
                                <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
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
                            <p className="text-[10px] text-muted-foreground">{roleLabels[referrer.role] || referrer.role}</p>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className="text-sm font-bold">{referrer.total_referrals}</p>
                            <p className="text-[10px] text-muted-foreground">{referrer.completed_referrals} activados</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export function RewardTimeline({ rewards }: { rewards: InviteRewardEvent[] }) {
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

                return (
                    <div key={reward.id} className="flex items-start gap-3 rounded-xl border p-3">
                        <div
                            className={cn(
                                'mt-0.5 rounded-full p-1.5',
                                reward.processed
                                    ? 'bg-brand-brown text-brand-brown dark:bg-brand-brown/30 dark:text-brand-brown'
                                    : 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow'
                            )}
                        >
                            {reward.processed ? (
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
                                Trigger: {rewardTriggerLabels[reward.trigger_event] || reward.trigger_event}
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
                                reward.processed
                                    ? 'bg-brand-brown text-brand-brown dark:bg-brand-brown/30 dark:text-brand-brown'
                                    : 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow'
                            )}
                        >
                            {reward.processed ? 'Entregada' : 'Pendiente'}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

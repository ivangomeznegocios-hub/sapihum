'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Loader2, Check, Plus, Trash2, Power, PowerOff,
    CheckCircle2, AlertCircle, Pencil, Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createCampaign, updateCampaign, toggleCampaignActive, deleteCampaign } from '@/actions/growth-campaigns'
import {
    approveGrowthRewardAction,
    consolidateGrowthNowAction,
    grantGrowthRewardAction,
    markGrowthAttributionFraudAction,
    markGrowthConversionFraudAction,
    processRewardEvent,
    reviewGrowthFraudFlagAction,
    revokeGrowthRewardAction,
    updateMemberReferralConfigAction,
    upsertGrowthOrganizationAction,
    upsertGrowthProgramEnrollmentAction,
} from './actions'
import type { GrowthCampaign, GrowthCampaignType } from '@/types/database'

const visibilityRoleLabels: Record<string, string> = {
    psychologist: 'Psicologos',
    ponente: 'Ponentes',
    patient: 'Pacientes',
}

const professionalRoleLabels: Record<string, string> = {
    psychologist: 'Psicologos',
    ponente: 'Ponentes',
}

const triggerLabels: Record<string, string> = {
    signup: 'Registro validado',
    profile_completed: 'Perfil completo',
    subscription: 'Primera suscripcion',
    first_purchase: 'Primera compra',
}

function toggleSelection(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export function CampaignForm({
    campaign,
    onDone,
}: {
    campaign?: GrowthCampaign
    onDone?: () => void
}) {
    const isEditing = !!campaign
    const rewardConfig = campaign?.reward_config || {}
    const stageRewards = rewardConfig.stage_rewards || {}
    const milestoneRewards = rewardConfig.milestone_rewards || {}
    const dualReward = rewardConfig.dual_reward || {}

    const [title, setTitle] = useState(campaign?.title || '')
    const [description, setDescription] = useState(campaign?.description || '')
    const [campaignType, setCampaignType] = useState<GrowthCampaignType>(campaign?.campaign_type || 'referral_boost')
    const [rewardType, setRewardType] = useState(rewardConfig.reward_type || 'commission')
    const [rewardAmount, setRewardAmount] = useState(
        rewardConfig.amount?.toString() || rewardConfig.cash_amount?.toString() || ''
    )
    const [rewardPercentage, setRewardPercentage] = useState(rewardConfig.percentage?.toString() || '')
    const [rewardLabel, setRewardLabel] = useState(rewardConfig.label || '')
    const [targetRoles, setTargetRoles] = useState<string[]>(campaign?.target_roles || ['psychologist', 'ponente'])
    const [eligibleReferrerRoles, setEligibleReferrerRoles] = useState<string[]>(campaign?.eligible_referrer_roles || ['psychologist', 'ponente'])
    const [eligibleReferredRoles, setEligibleReferredRoles] = useState<string[]>(campaign?.eligible_referred_roles || ['psychologist'])
    const [allowedTriggerEvents, setAllowedTriggerEvents] = useState<string[]>(campaign?.allowed_trigger_events || ['signup', 'profile_completed', 'subscription', 'first_purchase'])
    const [signupBonus, setSignupBonus] = useState(stageRewards.signup?.toString() || '')
    const [profileBonus, setProfileBonus] = useState(stageRewards.profile_completed?.toString() || '')
    const [subscriptionBonus, setSubscriptionBonus] = useState(stageRewards.subscription?.toString() || '')
    const [firstPurchaseBonus, setFirstPurchaseBonus] = useState(stageRewards.first_purchase?.toString() || '')
    const [milestone3, setMilestone3] = useState(milestoneRewards['3']?.toString() || '')
    const [milestone5, setMilestone5] = useState(milestoneRewards['5']?.toString() || '')
    const [milestone10, setMilestone10] = useState(milestoneRewards['10']?.toString() || '')
    const [dualRewardEnabled, setDualRewardEnabled] = useState(Boolean(dualReward?.reward_type))
    const [dualRewardType, setDualRewardType] = useState(dualReward.reward_type || 'discount')
    const [dualRewardAmount, setDualRewardAmount] = useState(dualReward.amount?.toString() || '')
    const [dualRewardPercentage, setDualRewardPercentage] = useState(dualReward.percentage?.toString() || '')
    const [dualRewardLabel, setDualRewardLabel] = useState(dualReward.label || '')
    const [startsAt, setStartsAt] = useState(campaign?.starts_at ? campaign.starts_at.slice(0, 16) : '')
    const [endsAt, setEndsAt] = useState(campaign?.ends_at ? campaign.ends_at.slice(0, 16) : '')
    const [isActive, setIsActive] = useState(campaign?.is_active ?? true)
    const [sortOrder, setSortOrder] = useState(campaign?.sort_order?.toString() || '0')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) {
            setMessage({ type: 'error', text: 'El titulo es requerido' })
            return
        }

        if (eligibleReferrerRoles.length === 0 || eligibleReferredRoles.length === 0 || allowedTriggerEvents.length === 0) {
            setMessage({ type: 'error', text: 'Define roles elegibles y al menos un trigger economico' })
            return
        }

        setIsLoading(true)
        setMessage(null)

        const nextRewardConfig: Record<string, any> = {
            reward_type: rewardType,
        }

        if (rewardAmount) {
            nextRewardConfig.amount = parseFloat(rewardAmount)
            nextRewardConfig.currency = 'MXN'
        }
        if (rewardPercentage) {
            nextRewardConfig.percentage = parseFloat(rewardPercentage)
        }
        if (rewardLabel.trim()) {
            nextRewardConfig.label = rewardLabel.trim()
        }

        const nextStageRewards: Record<string, number> = {}
        if (signupBonus) nextStageRewards.signup = parseFloat(signupBonus)
        if (profileBonus) nextStageRewards.profile_completed = parseFloat(profileBonus)
        if (subscriptionBonus) nextStageRewards.subscription = parseFloat(subscriptionBonus)
        if (firstPurchaseBonus) nextStageRewards.first_purchase = parseFloat(firstPurchaseBonus)
        if (Object.keys(nextStageRewards).length > 0) {
            nextRewardConfig.stage_rewards = nextStageRewards
        }

        const nextMilestones: Record<string, number> = {}
        if (milestone3) nextMilestones['3'] = parseFloat(milestone3)
        if (milestone5) nextMilestones['5'] = parseFloat(milestone5)
        if (milestone10) nextMilestones['10'] = parseFloat(milestone10)
        if (Object.keys(nextMilestones).length > 0) {
            nextRewardConfig.milestone_rewards = nextMilestones
        }

        if (dualRewardEnabled) {
            const dualRewardConfig: Record<string, any> = { reward_type: dualRewardType }
            if (dualRewardAmount) {
                dualRewardConfig.amount = parseFloat(dualRewardAmount)
                dualRewardConfig.currency = 'MXN'
            }
            if (dualRewardPercentage) {
                dualRewardConfig.percentage = parseFloat(dualRewardPercentage)
            }
            if (dualRewardLabel.trim()) {
                dualRewardConfig.label = dualRewardLabel.trim()
            }
            nextRewardConfig.dual_reward = dualRewardConfig
        }

        const data = {
            title: title.trim(),
            description: description.trim() || null,
            campaign_type: campaignType,
            program_type: 'professional_invite' as const,
            reward_config: nextRewardConfig,
            target_roles: targetRoles,
            eligible_referrer_roles: eligibleReferrerRoles,
            eligible_referred_roles: eligibleReferredRoles,
            allowed_trigger_events: allowedTriggerEvents,
            is_active: isActive,
            starts_at: startsAt ? new Date(startsAt).toISOString() : null,
            ends_at: endsAt ? new Date(endsAt).toISOString() : null,
            sort_order: parseInt(sortOrder) || 0,
        }

        const result = isEditing && campaign
            ? await updateCampaign(campaign.id, data)
            : await createCampaign(data)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: isEditing ? 'Campana actualizada' : 'Campana creada' })
            onDone?.()
        }

        setIsLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 border rounded-lg p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    {isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {isEditing ? 'Editar Campana' : 'Nueva Campana'}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Programa: invitacion profesional
                </span>
            </div>

            <div className="rounded-lg border border-brand-brown bg-brand-brown/70 p-3 text-xs text-brand-brown dark:border-brand-brown dark:bg-brand-brown/20 dark:text-brand-brown">
                Este formulario solo configura incentivos para adquisicion de psicologos y ponentes. No aplica a canalizacion clinica de pacientes.
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label className="text-xs font-medium">Titulo *</label>
                    <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Ej: Invita 5 psicologos y gana MXN 2500"
                        className="mt-1"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium">Tipo de Campana</label>
                    <select
                        value={campaignType}
                        onChange={(event) => setCampaignType(event.target.value as GrowthCampaignType)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="referral_boost">Referral Boost</option>
                        <option value="milestone">Milestone</option>
                        <option value="promo">Promocion</option>
                        <option value="challenge">Reto</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="text-xs font-medium">Descripcion</label>
                <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe la propuesta de valor, payout y reglas de elegibilidad..."
                    className="mt-1 h-20 resize-none"
                />
            </div>

            <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Alcance y Elegibilidad
                </p>

                <div>
                    <label className="text-xs font-medium">Visible para</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(visibilityRoleLabels).map(([role, label]) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => setTargetRoles(toggleSelection(targetRoles, role))}
                                className={cn(
                                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                                    targetRoles.includes(role)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-muted/50 text-muted-foreground border-input hover:bg-muted'
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="text-xs font-medium">Roles que pueden invitar</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(professionalRoleLabels).map(([role, label]) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setEligibleReferrerRoles(toggleSelection(eligibleReferrerRoles, role))}
                                    className={cn(
                                        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                                        eligibleReferrerRoles.includes(role)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-muted/50 text-muted-foreground border-input hover:bg-muted'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium">Roles invitables con reward</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(professionalRoleLabels).map(([role, label]) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setEligibleReferredRoles(toggleSelection(eligibleReferredRoles, role))}
                                    className={cn(
                                        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                                        eligibleReferredRoles.includes(role)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-muted/50 text-muted-foreground border-input hover:bg-muted'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium">Triggers economicos habilitados</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(triggerLabels).map(([trigger, label]) => (
                            <button
                                key={trigger}
                                type="button"
                                onClick={() => setAllowedTriggerEvents(toggleSelection(allowedTriggerEvents, trigger))}
                                className={cn(
                                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                                    allowedTriggerEvents.includes(trigger)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-muted/50 text-muted-foreground border-input hover:bg-muted'
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reward Principal
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label className="text-xs font-medium">Tipo de reward</label>
                        <select
                            value={rewardType}
                            onChange={(event) => setRewardType(event.target.value)}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="commission">Comision</option>
                            <option value="cash_bonus">Bono en efectivo</option>
                            <option value="credit">Credito</option>
                            <option value="discount">Descuento</option>
                            <option value="membership_benefit">Beneficio de membresia</option>
                            <option value="unlock">Beneficio exclusivo</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium">Monto MXN</label>
                        <Input
                            type="number"
                            value={rewardAmount}
                            onChange={(event) => setRewardAmount(event.target.value)}
                            placeholder="500"
                            min={0}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium">Porcentaje</label>
                        <Input
                            type="number"
                            value={rewardPercentage}
                            onChange={(event) => setRewardPercentage(event.target.value)}
                            placeholder="20"
                            min={0}
                            max={100}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium">Etiqueta corta</label>
                        <Input
                            value={rewardLabel}
                            onChange={(event) => setRewardLabel(event.target.value)}
                            placeholder="Bono premium"
                            className="mt-1"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bonos por Activacion
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label className="text-xs font-medium">Registro validado</label>
                        <Input type="number" value={signupBonus} onChange={(event) => setSignupBonus(event.target.value)} placeholder="150" min={0} className="mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium">Perfil completo</label>
                        <Input type="number" value={profileBonus} onChange={(event) => setProfileBonus(event.target.value)} placeholder="200" min={0} className="mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium">Primera suscripcion</label>
                        <Input type="number" value={subscriptionBonus} onChange={(event) => setSubscriptionBonus(event.target.value)} placeholder="900" min={0} className="mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium">Primera compra</label>
                        <Input type="number" value={firstPurchaseBonus} onChange={(event) => setFirstPurchaseBonus(event.target.value)} placeholder="350" min={0} className="mt-1" />
                    </div>
                </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bonos por Volumen
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                        <label className="text-xs font-medium">Hito 3 invitados</label>
                        <Input type="number" value={milestone3} onChange={(event) => setMilestone3(event.target.value)} placeholder="400" min={0} className="mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium">Hito 5 invitados</label>
                        <Input type="number" value={milestone5} onChange={(event) => setMilestone5(event.target.value)} placeholder="900" min={0} className="mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium">Hito 10 invitados</label>
                        <Input type="number" value={milestone10} onChange={(event) => setMilestone10(event.target.value)} placeholder="2500" min={0} className="mt-1" />
                    </div>
                </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Reward Dual para Invitado
                    </p>
                    <Button
                        type="button"
                        variant={dualRewardEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDualRewardEnabled(!dualRewardEnabled)}
                    >
                        {dualRewardEnabled ? 'Activo' : 'Inactivo'}
                    </Button>
                </div>

                {dualRewardEnabled && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <label className="text-xs font-medium">Tipo</label>
                            <select
                                value={dualRewardType}
                                onChange={(event) => setDualRewardType(event.target.value)}
                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="discount">Descuento</option>
                                <option value="credit">Credito</option>
                                <option value="membership_benefit">Beneficio de membresia</option>
                                <option value="unlock">Beneficio exclusivo</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium">Monto MXN</label>
                            <Input
                                type="number"
                                value={dualRewardAmount}
                                onChange={(event) => setDualRewardAmount(event.target.value)}
                                placeholder="300"
                                min={0}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Porcentaje</label>
                            <Input
                                type="number"
                                value={dualRewardPercentage}
                                onChange={(event) => setDualRewardPercentage(event.target.value)}
                                placeholder="25"
                                min={0}
                                max={100}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Etiqueta</label>
                            <Input
                                value={dualRewardLabel}
                                onChange={(event) => setDualRewardLabel(event.target.value)}
                                placeholder="Trial extendido"
                                className="mt-1"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                    <label className="text-xs font-medium">Inicio</label>
                    <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                    <label className="text-xs font-medium">Fin</label>
                    <Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                    <label className="text-xs font-medium">Orden</label>
                    <Input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="mt-1" />
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(event) => setIsActive(event.target.checked)}
                        className="rounded border-input accent-primary"
                    />
                    Campana activa
                </label>

                {message && (
                    <p className={cn(
                        'text-xs flex items-center gap-1',
                        message.type === 'error' ? 'text-red-600' : 'text-green-600'
                    )}>
                        {message.type === 'error'
                            ? <AlertCircle className="h-3 w-3" />
                            : <CheckCircle2 className="h-3 w-3" />
                        }
                        {message.text}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" size="sm" disabled={isLoading} className="w-full gap-1 sm:w-auto">
                    {isLoading
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Save className="h-3.5 w-3.5" />
                    }
                    {isEditing ? 'Guardar' : 'Crear Campana'}
                </Button>
                {onDone && (
                    <Button type="button" variant="ghost" size="sm" onClick={onDone} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                )}
            </div>
        </form>
    )
}

export function ToggleCampaignButton({ campaignId, isActive }: { campaignId: string; isActive: boolean }) {
    const [loading, setLoading] = useState(false)
    const [active, setActive] = useState(isActive)

    async function handleToggle() {
        setLoading(true)
        const result = await toggleCampaignActive(campaignId, !active)
        if (result.success) setActive(!active)
        setLoading(false)
    }

    return (
        <Button
            size="sm"
            variant={active ? 'default' : 'outline'}
            onClick={handleToggle}
            disabled={loading}
            className="gap-1 h-7 text-xs"
        >
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : active ? (
                <Power className="h-3 w-3" />
            ) : (
                <PowerOff className="h-3 w-3" />
            )}
            {active ? 'Activa' : 'Inactiva'}
        </Button>
    )
}

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
    const [loading, setLoading] = useState(false)
    const [deleted, setDeleted] = useState(false)

    async function handleDelete() {
        if (!confirm('Eliminar esta campana? Esta accion no se puede deshacer.')) return
        setLoading(true)
        const result = await deleteCampaign(campaignId)
        if (result.success) setDeleted(true)
        setLoading(false)
    }

    if (deleted) return <span className="text-xs text-red-600">Eliminada</span>

    return (
        <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={loading}
            className="gap-1 h-7 text-xs text-red-600 hover:text-red-700"
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Eliminar
        </Button>
    )
}

export function ProcessRewardButton({ rewardEventId }: { rewardEventId: string }) {
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    async function handleProcess() {
        setLoading(true)
        const result = await processRewardEvent(rewardEventId)
        if (result.success) setDone(true)
        setLoading(false)
    }

    if (done) {
        return <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Procesada
        </span>
    }

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={handleProcess}
            disabled={loading}
            className="gap-1 h-7 text-xs"
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Procesar
        </Button>
    )
}

export function GrowthRewardActions({ reward }: { reward: { id: string; status: string } }) {
    const [loading, setLoading] = useState<string | null>(null)
    const [done, setDone] = useState<string | null>(null)

    async function run(action: 'approve' | 'grant' | 'revoke') {
        setLoading(action)
        const result =
            action === 'approve'
                ? await approveGrowthRewardAction(reward.id)
                : action === 'grant'
                    ? await grantGrowthRewardAction(reward.id)
                    : await revokeGrowthRewardAction(reward.id)

        if (result.success) setDone(action)
        setLoading(null)
    }

    if (done) {
        const label = done === 'approve' ? 'Aprobada' : done === 'grant' ? 'Otorgada' : 'Revocada'
        return <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3 w-3" /> {label}</span>
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {reward.status === 'pending_review' && (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => run('approve')}
                    disabled={Boolean(loading)}
                    className="h-7 gap-1 text-xs"
                >
                    {loading === 'approve' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Aprobar
                </Button>
            )}
            {(reward.status === 'pending_review' || reward.status === 'approved') && (
                <Button
                    size="sm"
                    onClick={() => run('grant')}
                    disabled={Boolean(loading)}
                    className="h-7 gap-1 text-xs"
                >
                    {loading === 'grant' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Otorgar
                </Button>
            )}
            <Button
                size="sm"
                variant="ghost"
                onClick={() => run('revoke')}
                disabled={Boolean(loading)}
                className="h-7 gap-1 text-xs text-red-600 hover:text-red-700"
            >
                {loading === 'revoke' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Revocar
            </Button>
        </div>
    )
}

export function GrowthAttributionFraudButton({ attributionId }: { attributionId: string }) {
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    async function handleClick() {
        setLoading(true)
        const result = await markGrowthAttributionFraudAction(attributionId)
        if (result.success) setDone(true)
        setLoading(false)
    }

    if (done) {
        return <span className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> Marcada como fraude</span>
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleClick} disabled={loading} className="h-7 gap-1 text-xs text-red-600 hover:text-red-700">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertCircle className="h-3 w-3" />}
            Marcar fraude
        </Button>
    )
}

export function GrowthConversionFraudButton({ conversionId }: { conversionId: string }) {
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    async function handleClick() {
        setLoading(true)
        const result = await markGrowthConversionFraudAction(conversionId)
        if (result.success) setDone(true)
        setLoading(false)
    }

    if (done) {
        return <span className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> Marcada como fraude</span>
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleClick} disabled={loading} className="h-7 gap-1 text-xs text-red-600 hover:text-red-700">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertCircle className="h-3 w-3" />}
            Marcar fraude
        </Button>
    )
}

export function GrowthFlagReviewActions({ flagId, status }: { flagId: string; status: string }) {
    const [loading, setLoading] = useState<string | null>(null)
    const [done, setDone] = useState<string | null>(null)

    async function run(nextStatus: 'reviewed' | 'dismissed' | 'confirmed') {
        setLoading(nextStatus)
        const result = await reviewGrowthFraudFlagAction(flagId, nextStatus)
        if (result.success) setDone(nextStatus)
        setLoading(null)
    }

    if (done || status !== 'open') {
        const label = done === 'confirmed' ? 'Confirmado' : done === 'dismissed' ? 'Descartado' : done === 'reviewed' ? 'Revisado' : status
        return <span className="text-xs text-muted-foreground">{label}</span>
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" onClick={() => run('reviewed')} disabled={Boolean(loading)} className="h-7 gap-1 text-xs">
                {loading === 'reviewed' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Revisar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => run('dismissed')} disabled={Boolean(loading)} className="h-7 gap-1 text-xs">
                {loading === 'dismissed' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Descartar
            </Button>
            <Button size="sm" onClick={() => run('confirmed')} disabled={Boolean(loading)} className="h-7 gap-1 text-xs">
                {loading === 'confirmed' ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertCircle className="h-3 w-3" />}
                Confirmar fraude
            </Button>
        </div>
    )
}

export function ConsolidateGrowthButton() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function handleClick() {
        setLoading(true)
        setMessage(null)
        const result = await consolidateGrowthNowAction()
        if (result.success) {
            setMessage(`${result.qualified ?? 0} calificadas, ${result.blocked ?? 0} bloqueadas`)
        } else {
            setMessage(result.error || 'No se pudo consolidar')
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col gap-1 sm:items-end">
            <Button variant="outline" onClick={handleClick} disabled={loading} className="gap-1.5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Consolidar ahora
            </Button>
            {message && <span className="text-xs text-muted-foreground">{message}</span>}
        </div>
    )
}

export function GrowthConfigForm({
    attributionWindowDays,
    consolidationRule,
    fallbackConsolidationRule,
    fixedDaysFallback,
}: {
    attributionWindowDays: number
    consolidationRule: string
    fallbackConsolidationRule: string
    fixedDaysFallback: number
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setMessage(null)
        const formData = new FormData(event.currentTarget)
        const result = await updateMemberReferralConfigAction(formData)
        setMessage(result.success ? 'Configuracion guardada' : result.error || 'Error al guardar')
        setLoading(false)
        if (result.success) router.refresh()
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Configuracion MVP
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Controla la ventana de atribucion, la regla principal de consolidacion y el fallback del motor.
                    </p>
                </div>
                {message && <span className="text-xs text-muted-foreground">{message}</span>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label className="text-xs font-medium">
                    Ventana de atribucion
                    <Input
                        name="attributionWindowDays"
                        type="number"
                        min={1}
                        defaultValue={attributionWindowDays}
                        className="mt-1"
                    />
                </label>
                <label className="text-xs font-medium">
                    Regla principal
                    <select
                        name="consolidationRule"
                        defaultValue={consolidationRule}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="first_renewal_paid">Primer renewal pagado</option>
                        <option value="billing_cycle_end">Fin de ciclo</option>
                        <option value="fixed_days">Dias fijos</option>
                    </select>
                </label>
                <label className="text-xs font-medium">
                    Fallback
                    <select
                        name="fallbackConsolidationRule"
                        defaultValue={fallbackConsolidationRule}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="billing_cycle_end">Fin de ciclo</option>
                        <option value="fixed_days">Dias fijos</option>
                    </select>
                </label>
                <label className="text-xs font-medium">
                    Dias fijos fallback
                    <Input
                        name="fixedDaysFallback"
                        type="number"
                        min={1}
                        defaultValue={fixedDaysFallback}
                        className="mt-1"
                    />
                </label>
                <div className="flex items-end xl:col-span-4">
                    <Button type="submit" disabled={loading} className="w-full gap-1.5">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar reglas
                    </Button>
                </div>
            </div>
        </form>
    )
}

export function ProgramEnrollmentForm({
    enrollment,
    compact = false,
}: {
    enrollment?: {
        id?: string
        user_id?: string | null
        program_type?: string
        status?: string
        tier?: string | null
        approval_notes?: string | null
        user?: { email?: string | null; full_name?: string | null } | null
    }
    compact?: boolean
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setMessage(null)
        const formData = new FormData(event.currentTarget)
        const result = await upsertGrowthProgramEnrollmentAction(formData)
        setMessage(result.success ? 'Programa guardado' : result.error || 'Error al guardar')
        setLoading(false)
        if (result.success) router.refresh()
    }

    return (
        <form onSubmit={handleSubmit} className={cn('rounded-2xl border bg-card p-4', compact && 'rounded-xl p-3')}>
            {enrollment?.user_id && <input type="hidden" name="userId" value={enrollment.user_id} />}
            {enrollment?.user_id && enrollment.program_type && (
                <input type="hidden" name="programType" value={enrollment.program_type} />
            )}
            <div className={cn('grid gap-3', compact ? 'lg:grid-cols-6' : 'sm:grid-cols-2 xl:grid-cols-6')}>
                <label className={cn('text-xs font-medium', compact ? 'lg:col-span-2' : 'xl:col-span-2')}>
                    Usuario
                    <Input
                        name="userLookup"
                        defaultValue={enrollment?.user?.email ?? ''}
                        placeholder="email@dominio.com o user_id"
                        disabled={Boolean(enrollment?.user_id)}
                        className="mt-1"
                    />
                </label>
                <label className="text-xs font-medium">
                    Programa
                    <select
                        name={enrollment?.user_id ? undefined : 'programType'}
                        defaultValue={enrollment?.program_type ?? 'host'}
                        disabled={Boolean(enrollment?.user_id)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="host">Host</option>
                        <option value="ambassador">Embajador</option>
                    </select>
                </label>
                <label className="text-xs font-medium">
                    Estado
                    <select
                        name="status"
                        defaultValue={enrollment?.status ?? 'active'}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="applied">Aplicado</option>
                        <option value="approved">Aprobado</option>
                        <option value="active">Activo</option>
                        <option value="paused">Pausado</option>
                        <option value="rejected">Rechazado</option>
                        <option value="terminated">Terminado</option>
                    </select>
                </label>
                <label className="text-xs font-medium">
                    Tier
                    <select
                        name="tier"
                        defaultValue={enrollment?.tier ?? 'base'}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="base">Base</option>
                        <option value="pro">Pro</option>
                        <option value="elite">Elite</option>
                    </select>
                </label>
                <label className={cn('text-xs font-medium', compact ? 'lg:col-span-6' : 'sm:col-span-2 xl:col-span-1')}>
                    Notas
                    <Input
                        name="approvalNotes"
                        defaultValue={enrollment?.approval_notes ?? ''}
                        placeholder="Revision interna"
                        className="mt-1"
                    />
                </label>
                <div className={cn('flex items-end gap-2', compact ? 'lg:col-span-6' : 'sm:col-span-2 xl:col-span-6')}>
                    <Button type="submit" disabled={loading} size="sm" className="gap-1.5">
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {enrollment ? 'Guardar programa' : 'Crear / aprobar'}
                    </Button>
                    {message && <span className="text-xs text-muted-foreground">{message}</span>}
                </div>
            </div>
        </form>
    )
}

export function OrganizationForm({
    organization,
    compact = false,
}: {
    organization?: any
    compact?: boolean
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setMessage(null)
        const formData = new FormData(event.currentTarget)
        const result = await upsertGrowthOrganizationAction(formData)
        setMessage(result.success ? 'Organizacion guardada' : result.error || 'Error al guardar')
        setLoading(false)
        if (result.success) router.refresh()
    }

    return (
        <form onSubmit={handleSubmit} className={cn('rounded-2xl border bg-card p-4', compact && 'rounded-xl p-3')}>
            {organization?.id && <input type="hidden" name="organizationId" value={organization.id} />}
            <div className={cn('grid gap-3', compact ? 'lg:grid-cols-6' : 'sm:grid-cols-2 xl:grid-cols-6')}>
                <label className={cn('text-xs font-medium', compact ? 'lg:col-span-2' : 'xl:col-span-2')}>
                    Nombre
                    <Input name="name" defaultValue={organization?.name ?? ''} placeholder="Universidad / comunidad" className="mt-1" />
                </label>
                <label className="text-xs font-medium">
                    Tipo
                    <select name="organizationType" defaultValue={organization?.organization_type ?? 'other'} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="university">Universidad</option>
                        <option value="association">Asociacion</option>
                        <option value="college">Colegio</option>
                        <option value="community">Comunidad</option>
                        <option value="other">Otro</option>
                    </select>
                </label>
                <label className="text-xs font-medium">
                    Estado
                    <select name="status" defaultValue={organization?.status ?? 'lead'} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="lead">Lead</option>
                        <option value="prospect">Prospect</option>
                        <option value="active_partner">Activa</option>
                        <option value="inactive_partner">Inactiva</option>
                    </select>
                </label>
                <label className="text-xs font-medium">
                    Codigo
                    <Input name="partnerCode" defaultValue={organization?.partner_code ?? ''} placeholder="ORG123" className="mt-1 uppercase" />
                </label>
                <label className="text-xs font-medium">
                    Landing slug
                    <Input name="landingSlug" defaultValue={organization?.landing_slug ?? ''} placeholder="universidad-x" className="mt-1" />
                </label>
                <label className="text-xs font-medium">
                    Contacto
                    <Input name="contactName" defaultValue={organization?.contact_name ?? ''} placeholder="Nombre" className="mt-1" />
                </label>
                <label className="text-xs font-medium">
                    Email
                    <Input name="contactEmail" defaultValue={organization?.contact_email ?? ''} placeholder="contacto@org.com" className="mt-1" />
                </label>
                <label className="text-xs font-medium">
                    Telefono
                    <Input name="contactPhone" defaultValue={organization?.contact_phone ?? ''} placeholder="+52..." className="mt-1" />
                </label>
                <label className="text-xs font-medium">
                    Beneficio
                    <select name="benefitModel" defaultValue={organization?.benefit_model ?? 'custom'} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="discount">Descuento</option>
                        <option value="revenue_share">Revenue share</option>
                        <option value="bulk_access">Bulk access</option>
                        <option value="custom">Custom</option>
                    </select>
                </label>
                <label className={cn('text-xs font-medium', compact ? 'lg:col-span-6' : 'sm:col-span-2 xl:col-span-2')}>
                    Config JSON
                    <Input
                        name="benefitConfig"
                        defaultValue={organization?.benefit_config ? JSON.stringify(organization.benefit_config) : ''}
                        placeholder='{"percentage":20}'
                        className="mt-1 font-mono text-xs"
                    />
                </label>
                <div className={cn('flex items-end gap-2', compact ? 'lg:col-span-6' : 'sm:col-span-2 xl:col-span-6')}>
                    <Button type="submit" disabled={loading} size="sm" className="gap-1.5">
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {organization ? 'Guardar organizacion' : 'Crear organizacion'}
                    </Button>
                    {message && <span className="text-xs text-muted-foreground">{message}</span>}
                </div>
            </div>
        </form>
    )
}

export function CreateCampaignSection() {
    const [showForm, setShowForm] = useState(false)

    if (!showForm) {
        return (
            <Button onClick={() => setShowForm(true)} className="w-full gap-1.5 sm:w-auto">
                <Plus className="h-4 w-4" />
                Nueva Campana
            </Button>
        )
    }

    return <CampaignForm onDone={() => setShowForm(false)} />
}

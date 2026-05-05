'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Loader2, Check, Plus, Trash2, Power, PowerOff,
    CheckCircle2, AlertCircle, Pencil, Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROFESSIONAL_INVITE_PROGRAM_TYPE } from '@/lib/growth/programs'
import { createCampaign, updateCampaign, toggleCampaignActive, deleteCampaign } from '@/actions/growth-campaigns'
import { processRewardEvent } from './actions'
import {
    campaignTypeDescriptions,
    campaignTypeLabels,
    professionalProgramLabel,
    triggerLabels,
    roleLabels,
} from './labels'
import type { GrowthCampaign, GrowthCampaignType } from '@/types/database'

const visibilityRoleLabels: Record<string, string> = {
    psychologist: roleLabels.psychologist,
    ponente: roleLabels.ponente,
    patient: roleLabels.patient,
}

const professionalRoleLabels: Record<string, string> = {
    psychologist: roleLabels.psychologist,
    ponente: roleLabels.ponente,
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

    const [title, setTitle] = useState(campaign?.title || '')
    const [description, setDescription] = useState(campaign?.description || '')
    const [campaignType, setCampaignType] = useState<GrowthCampaignType>(campaign?.campaign_type || 'milestone')
    const [thresholdCount, setThresholdCount] = useState(rewardConfig.threshold_count?.toString() || '3')
    const [benefitKind, setBenefitKind] = useState(rewardConfig.benefit_kind || 'percent_discount')
    const [discountPercent, setDiscountPercent] = useState(rewardConfig.discount_percent?.toString() || '100')
    const [targetMembershipLevel, setTargetMembershipLevel] = useState(String(rewardConfig.target_membership_level || 'current'))
    const [priority, setPriority] = useState(rewardConfig.priority?.toString() || '0')
    const [targetRoles, setTargetRoles] = useState<string[]>(campaign?.target_roles || ['psychologist', 'ponente'])
    const [eligibleReferrerRoles, setEligibleReferrerRoles] = useState<string[]>(campaign?.eligible_referrer_roles || ['psychologist', 'ponente'])
    const [eligibleReferredRoles, setEligibleReferredRoles] = useState<string[]>(campaign?.eligible_referred_roles || ['psychologist'])
    const [allowedTriggerEvents, setAllowedTriggerEvents] = useState<string[]>(campaign?.allowed_trigger_events || ['signup', 'profile_completed', 'subscription', 'first_purchase'])
    const [startsAt, setStartsAt] = useState(campaign?.starts_at ? campaign.starts_at.slice(0, 16) : '')
    const [endsAt, setEndsAt] = useState(campaign?.ends_at ? campaign.ends_at.slice(0, 16) : '')
    const [isActive, setIsActive] = useState(campaign?.is_active ?? true)
    const [sortOrder, setSortOrder] = useState(campaign?.sort_order?.toString() || '0')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) {
            setMessage({ type: 'error', text: 'El titulo de la campana es requerido' })
            return
        }

        if (targetRoles.length === 0 || eligibleReferrerRoles.length === 0 || eligibleReferredRoles.length === 0) {
            setMessage({ type: 'error', text: 'Selecciona al menos un rol en cada bloque' })
            return
        }

        const parsedThreshold = parseInt(thresholdCount)
        const rawDiscount = parseFloat(discountPercent)
        const parsedDiscount = benefitKind === 'free_membership_level'
            ? 100
            : rawDiscount

        if (!Number.isFinite(parsedThreshold) || parsedThreshold < 1 || !Number.isFinite(parsedDiscount) || parsedDiscount < 1 || parsedDiscount > 100) {
            setMessage({ type: 'error', text: 'Revisa la meta y el descuento' })
            return
        }

        if (!['current', '1', '2', '3'].includes(targetMembershipLevel)) {
            setMessage({ type: 'error', text: 'El nivel elegido no es valido' })
            return
        }

        if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
            setMessage({ type: 'error', text: 'La fecha de fin debe ser posterior al inicio' })
            return
        }

        setIsLoading(true)
        setMessage(null)

        const nextRewardConfig: Record<string, any> = {
            threshold_count: parsedThreshold,
            qualifier: 'referred_active_membership',
            require_referrer_active_membership: true,
            benefit_kind: benefitKind,
            discount_percent: parsedDiscount,
            target_membership_level: targetMembershipLevel === 'current' ? 'current' : Number(targetMembershipLevel),
            duration_policy: 'while_qualified',
            priority: parseInt(priority) || 0,
        }

        const data = {
            title: title.trim(),
            description: description.trim() || null,
            campaign_type: campaignType,
            program_type: PROFESSIONAL_INVITE_PROGRAM_TYPE,
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
                    {isEditing ? 'Editar campana' : 'Nueva campana'}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Programa: {professionalProgramLabel}
                </span>
            </div>

            <div className="rounded-lg border border-brand-blue-hover bg-brand-blue-hover/70 p-3 text-xs text-brand-blue-hover dark:border-brand-blue-hover dark:bg-brand-blue-hover/20 dark:text-brand-blue-hover">
                Este formulario solo configura incentivos para captar psicologos y ponentes. No aplica a la canalizacion clinica de pacientes.
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label className="text-xs font-medium">Titulo de la campana *</label>
                    <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Ej: Invita 5 psicologos y gana MXN 2500"
                        className="mt-1"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium">Tipo de campana</label>
                    <select
                        value={campaignType}
                        onChange={(event) => setCampaignType(event.target.value as GrowthCampaignType)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="referral_boost">{campaignTypeLabels.referral_boost}</option>
                        <option value="milestone">{campaignTypeLabels.milestone}</option>
                        <option value="promo">{campaignTypeLabels.promo}</option>
                        <option value="challenge">{campaignTypeLabels.challenge}</option>
                        <option value="custom">{campaignTypeLabels.custom}</option>
                    </select>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        {campaignTypeDescriptions[campaignType]}
                    </p>
                </div>
            </div>

            <div>
                <label className="text-xs font-medium">Descripcion breve</label>
                <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Explica a quien va dirigida, que gana y bajo que condiciones."
                    className="mt-1 h-20 resize-none"
                />
            </div>

            <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    A quien aplica
                </p>

                <div>
                    <label className="text-xs font-medium">Visible para estos roles</label>
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
                        <label className="text-xs font-medium">Quienes pueden invitar</label>
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
                        <label className="text-xs font-medium">Roles que pueden ser invitados</label>
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
                    <label className="text-xs font-medium">Acciones que activan la recompensa</label>
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
                    Recompensa automatica de Stripe
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label className="text-xs font-medium">Meta de invitados activos</label>
                        <Input
                            type="number"
                            value={thresholdCount}
                            onChange={(event) => setThresholdCount(event.target.value)}
                            min={1}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium">Tipo de beneficio</label>
                        <select
                            value={benefitKind}
                            onChange={(event) => setBenefitKind(event.target.value)}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="percent_discount">Descuento porcentual</option>
                            <option value="free_membership_level">Membresia gratis</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium">Descuento %</label>
                        <Input
                            type="number"
                            value={discountPercent}
                            onChange={(event) => setDiscountPercent(event.target.value)}
                            min={1}
                            max={100}
                            disabled={benefitKind === 'free_membership_level'}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium">Nivel que se otorga</label>
                        <select
                            value={targetMembershipLevel}
                            onChange={(event) => setTargetMembershipLevel(event.target.value)}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="current">Plan actual</option>
                            <option value="1">Nivel 1</option>
                            <option value="2">Nivel 2</option>
                            <option value="3">Nivel 3</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label className="text-xs font-medium">Prioridad de aplicacion</label>
                        <Input type="number" value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-1" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                    <label className="text-xs font-medium">Fecha de inicio</label>
                    <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                    <label className="text-xs font-medium">Fecha de fin</label>
                    <Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                    <label className="text-xs font-medium">Orden de aparicion</label>
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
                    {isEditing ? 'Guardar cambios' : 'Crear campana'}
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
            {active ? 'Activa' : 'Pausada'}
        </Button>
    )
}

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
    const [loading, setLoading] = useState(false)
    const [deleted, setDeleted] = useState(false)

    async function handleDelete() {
        if (!confirm('Eliminar esta campana? No podras recuperarla.')) return
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

export function CreateCampaignSection() {
    const [showForm, setShowForm] = useState(false)

    if (!showForm) {
        return (
            <Button onClick={() => setShowForm(true)} className="w-full gap-1.5 sm:w-auto">
                <Plus className="h-4 w-4" />
                Nueva campana
            </Button>
        )
    }

    return <CampaignForm onDone={() => setShowForm(false)} />
}

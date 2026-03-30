'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Star } from 'lucide-react'
import { SubscribeButton } from '@/components/payments/SubscribeButton'
import { WaitlistCTA } from '@/components/specializations/waitlist-cta'
import { MEMBERSHIP_TIERS } from '@/lib/membership'
import { getSubscriptionPlan, type BillingInterval } from '@/lib/payments/config'
import {
    LEVEL_2_DEFAULT_SPECIALIZATION,
    canUserSeeLevel3Offer,
    getActiveSpecializations,
    getComingSoonSpecializations,
    getSpecializationByCode,
    type SpecializationConfig,
} from '@/lib/specializations'

interface SubscriptionTierCardsProps {
    currentLevel: number
    currentSpecializationCode?: string | null
    isAdmin?: boolean
}

function priceLabel(amount: number) {
    return `$${amount.toLocaleString('es-MX')}`
}

function specIncludesLabel(spec: SpecializationConfig) {
    const software = spec.includesSoftware ? 'Incluye software' : 'Sin software'
    const events = spec.includesEvents ? 'Eventos especializados incluidos' : 'Eventos especializados por definir'
    return `${software} · ${events}`
}

export function SubscriptionTierCards({
    currentLevel,
    currentSpecializationCode = null,
    isAdmin = false,
}: SubscriptionTierCardsProps) {
    const [interval, setInterval] = useState<BillingInterval>('monthly')

    const level1Plan = useMemo(() => getSubscriptionPlan(1), [])
    const level3Plan = useMemo(() => getSubscriptionPlan(3), [])
    const activeSpecializations = useMemo(() => getActiveSpecializations(), [])
    const comingSoonSpecializations = useMemo(() => getComingSoonSpecializations(), [])

    const level3Visible = canUserSeeLevel3Offer({
        membershipLevel: currentLevel,
        specializationCode: currentSpecializationCode,
        isAdmin,
    })

    const currentSpecialization = getSpecializationByCode(currentSpecializationCode)

    return (
        <div className="space-y-8">
            <div className="flex items-stretch justify-center">
                <div className="bg-muted p-1 rounded-lg flex w-full max-w-xs flex-col gap-1 sm:w-auto sm:flex-row sm:items-center">
                    <button
                        onClick={() => setInterval('monthly')}
                        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-all sm:w-auto ${interval === 'monthly'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Mensual
                    </button>
                    <button
                        onClick={() => setInterval('annual')}
                        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-all sm:w-auto ${interval === 'annual'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Anual
                    </button>
                </div>
            </div>

            {level1Plan && (
                <Card className={currentLevel === 1 ? 'border-green-500' : ''}>
                    <CardHeader>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle>Nivel 1 - Comunidad</CardTitle>
                                <CardDescription>
                                    Acceso base a comunidad, cursos y educacion continua.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="self-start">Entrada</Badge>
                        </div>
                        <div className="mt-2">
                            <span className="text-3xl font-bold">
                                {interval === 'annual' ? priceLabel(level1Plan.annual.monthlyEquivalent) : priceLabel(level1Plan.monthly.amount)}
                            </span>
                            <span className="text-sm text-muted-foreground">/mes</span>
                            {interval === 'annual' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Cobro anual: {priceLabel(level1Plan.annual.amount)} ({level1Plan.annual.savingsPercent}% ahorro)
                                </p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-2">
                            {MEMBERSHIP_TIERS[1].features.slice(0, 6).map((feature) => (
                                <li key={feature} className="text-sm flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        {currentLevel >= 1 ? (
                            <Button className="w-full" variant="outline" disabled>
                                Tu nivel actual o superior
                            </Button>
                        ) : isAdmin ? (
                            <Button className="w-full" variant="outline" disabled>
                                Vista de administrador
                            </Button>
                        ) : (
                            <SubscribeButton
                                membershipLevel={1}
                                billingInterval={interval}
                                label={interval === 'annual'
                                    ? `Suscribirse — ${priceLabel(level1Plan.annual.amount)}/año`
                                    : `Suscribirse — ${priceLabel(level1Plan.monthly.amount)}/mes`
                                }
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            <section className="space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <h3 className="text-xl font-semibold">Nivel 2 - Especializacion</h3>
                            <Badge variant="outline">1 especializacion por usuario</Badge>
                        </div>
                <p className="text-sm text-muted-foreground">
                    Hoy solo Clinica esta disponible. Las demas especializaciones se abren por demanda.
                </p>

                <div className="grid gap-4 lg:grid-cols-2">
                    {activeSpecializations.map((spec) => {
                        const level2Plan = getSubscriptionPlan(2, spec.code)
                        if (!level2Plan) return null

                        const isCurrentSpecialization = currentLevel >= 2 && (currentSpecializationCode || LEVEL_2_DEFAULT_SPECIALIZATION) === spec.code
                        const isLockedByOtherSpecialization = currentLevel >= 2 && !isCurrentSpecialization
                        const intervalAmount = interval === 'annual'
                            ? level2Plan.annual.monthlyEquivalent
                            : level2Plan.monthly.amount

                        return (
                            <Card
                                key={spec.code}
                                className={`relative ${isCurrentSpecialization ? 'border-green-500' : 'border-primary/30'}`}
                            >
                                <div className="absolute -top-3 left-4">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                                        <Star className="h-3 w-3" />
                                        Activa
                                    </span>
                                </div>
                                <CardHeader>
                                    <CardTitle>{spec.name}</CardTitle>
                                    <CardDescription>{specIncludesLabel(spec)}</CardDescription>
                                    <div className="mt-2">
                                        <span className="text-3xl font-bold">{priceLabel(intervalAmount)}</span>
                                        <span className="text-sm text-muted-foreground">/mes</span>
                                        {interval === 'annual' && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Cobro anual: {priceLabel(level2Plan.annual.amount)} ({level2Plan.annual.savingsPercent}% ahorro)
                                            </p>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2">
                                        {spec.benefits.slice(0, 5).map((benefit) => (
                                            <li key={benefit} className="text-sm flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500 shrink-0" />
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrentSpecialization ? (
                                        <Button className="w-full" variant="outline" disabled>
                                            Tu especializacion activa
                                        </Button>
                                    ) : isLockedByOtherSpecialization ? (
                                        <Button className="w-full" variant="outline" disabled>
                                            Ya tienes una especializacion activa
                                        </Button>
                                    ) : isAdmin ? (
                                        <Button className="w-full" variant="outline" disabled>
                                            Vista de administrador
                                        </Button>
                                    ) : (
                                        <SubscribeButton
                                            membershipLevel={2}
                                            specializationCode={spec.code}
                                            billingInterval={interval}
                                            label={interval === 'annual'
                                                ? `Subir a ${spec.name} — ${priceLabel(level2Plan.annual.amount)}/año`
                                                : `Subir a ${spec.name} — ${priceLabel(level2Plan.monthly.amount)}/mes`
                                            }
                                            variant="default"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}

                    {comingSoonSpecializations.map((spec) => (
                        <Card key={spec.code} className="border-dashed">
                            <CardHeader>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <CardTitle>{spec.name}</CardTitle>
                                    <Badge variant="secondary" className="self-start">Proximamente</Badge>
                                </div>
                                <CardDescription>{specIncludesLabel(spec)}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Precio por definir
                                </p>
                                <WaitlistCTA
                                    specializationCode={spec.code}
                                    specializationName={spec.name}
                                    source="app"
                                    className="w-full"
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {level3Visible && level3Plan && (
                <Card className={currentLevel >= 3 ? 'border-green-500' : 'border-brand-yellow/40'}>
                    <CardHeader>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-brand-yellow" />
                                    Nivel 3 - Avanzado
                                </CardTitle>
                                <CardDescription>
                                    {currentSpecialization
                                        ? `Desbloqueado para ${currentSpecialization.name}`
                                        : 'Desbloqueado por tu Nivel 2 activo'}
                                </CardDescription>
                            </div>
                            <Badge className="self-start bg-brand-yellow hover:bg-brand-yellow">Desbloqueado</Badge>
                        </div>
                        <div className="mt-2">
                            <span className="text-3xl font-bold">
                                {interval === 'annual' ? priceLabel(level3Plan.annual.monthlyEquivalent) : priceLabel(level3Plan.monthly.amount)}
                            </span>
                            <span className="text-sm text-muted-foreground">/mes</span>
                            {interval === 'annual' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Cobro anual: {priceLabel(level3Plan.annual.amount)} ({level3Plan.annual.savingsPercent}% ahorro)
                                </p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-2">
                            {MEMBERSHIP_TIERS[3].features.slice(0, 6).map((feature) => (
                                <li key={feature} className="text-sm flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        {currentLevel >= 3 ? (
                            <Button className="w-full" variant="outline" disabled>
                                Tu nivel actual
                            </Button>
                        ) : isAdmin ? (
                            <Button className="w-full" variant="outline" disabled>
                                Vista de administrador
                            </Button>
                        ) : (
                            <SubscribeButton
                                membershipLevel={3}
                                specializationCode={currentSpecializationCode || LEVEL_2_DEFAULT_SPECIALIZATION}
                                billingInterval={interval}
                                label={interval === 'annual'
                                    ? `Subir a Nivel 3 — ${priceLabel(level3Plan.annual.amount)}/año`
                                    : `Subir a Nivel 3 — ${priceLabel(level3Plan.monthly.amount)}/mes`
                                }
                            />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

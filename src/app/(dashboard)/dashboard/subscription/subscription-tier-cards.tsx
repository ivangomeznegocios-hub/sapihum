'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscribeButton } from '@/components/payments/SubscribeButton'
import { WaitlistCTA } from '@/components/specializations/waitlist-cta'
import { MEMBERSHIP_TIERS } from '@/lib/membership'
import { getSubscriptionPlan, type BillingInterval } from '@/lib/payments/config'
import {
    LEVEL_2_DEFAULT_SPECIALIZATION,
    canUserSeeLevel3Offer,
    getComingSoonSpecializations,
    type SpecializationConfig,
} from '@/lib/specializations'
import {
    LEVEL_2_CARD_FEATURE_IDS,
    LEVEL_3_CARD_FEATURE_IDS,
    PRICING_PLAN_COPY,
    getPricingFeatureTitles,
} from '@/lib/pricing-catalog'
import { Check, Sparkles, Star } from 'lucide-react'

interface SubscriptionTierCardsProps {
    currentLevel: number
    currentSpecializationCode?: string | null
    isAdmin?: boolean
}

function priceLabel(amount: number) {
    return `$${amount.toLocaleString('es-MX')}`
}

function comingSoonLabel(spec: SpecializationConfig) {
    const software = spec.includesSoftware ? 'Incluye software' : 'Software por definir'
    const events = spec.includesEvents ? 'Eventos especializados incluidos' : 'Eventos por definir'
    return `${software} · ${events}`
}

export function SubscriptionTierCards({
    currentLevel,
    currentSpecializationCode = null,
    isAdmin = false,
}: SubscriptionTierCardsProps) {
    const [interval, setInterval] = useState<BillingInterval>('monthly')

    const level1Plan = useMemo(() => getSubscriptionPlan(1), [])
    const level2Plan = useMemo(() => getSubscriptionPlan(2, LEVEL_2_DEFAULT_SPECIALIZATION), [])
    const level3Plan = useMemo(() => getSubscriptionPlan(3), [])
    const comingSoonSpecializations = useMemo(() => getComingSoonSpecializations(), [])

    const level3Visible = canUserSeeLevel3Offer({
        membershipLevel: currentLevel,
        specializationCode: currentSpecializationCode,
        isAdmin,
    })

    const level2Features = getPricingFeatureTitles(LEVEL_2_CARD_FEATURE_IDS).slice(0, 6)
    const level3Features = getPricingFeatureTitles(LEVEL_3_CARD_FEATURE_IDS).slice(0, 6)
    const currentHasClinica = currentLevel >= 2 && (currentSpecializationCode || LEVEL_2_DEFAULT_SPECIALIZATION) === LEVEL_2_DEFAULT_SPECIALIZATION

    return (
        <div className="space-y-8">
            <div className="flex items-stretch justify-center">
                <div className="flex w-full max-w-xs flex-col gap-1 rounded-lg bg-muted p-1 sm:w-auto sm:flex-row sm:items-center">
                    <button
                        onClick={() => setInterval('monthly')}
                        className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-all sm:w-auto ${
                            interval === 'monthly'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Mensual
                    </button>
                    <button
                        onClick={() => setInterval('annual')}
                        className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-all sm:w-auto ${
                            interval === 'annual'
                                ? 'bg-background text-foreground shadow-sm'
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
                                <CardTitle>{PRICING_PLAN_COPY.level1.title}</CardTitle>
                                <CardDescription>
                                    {PRICING_PLAN_COPY.level1.description}
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="self-start">Base</Badge>
                        </div>
                        <div className="mt-2">
                            <span className="text-3xl font-bold">
                                {interval === 'annual'
                                    ? priceLabel(level1Plan.annual.monthlyEquivalent)
                                    : priceLabel(level1Plan.monthly.amount)}
                            </span>
                            <span className="text-sm text-muted-foreground">/mes</span>
                            {interval === 'annual' && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Cobro anual: {priceLabel(level1Plan.annual.amount)} ({level1Plan.annual.savingsPercent}% ahorro)
                                </p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-2">
                            {MEMBERSHIP_TIERS[1].features.slice(0, 6).map((feature) => (
                                <li key={feature} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 shrink-0 text-green-500" />
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
                                    ? `Suscribirse - ${priceLabel(level1Plan.annual.amount)}/año`
                                    : `Suscribirse - ${priceLabel(level1Plan.monthly.amount)}/mes`
                                }
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {level2Plan && (
                <Card className={currentHasClinica ? 'border-green-500 border-primary/30' : 'border-primary/30'}>
                    <CardHeader>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <CardTitle>{PRICING_PLAN_COPY.level2.title}</CardTitle>
                                    <Badge variant="outline">Psicología clínica</Badge>
                                    <Badge variant="secondary" className="gap-1">
                                        <Star className="h-3 w-3" />
                                        Software incluido
                                    </Badge>
                                </div>
                                <CardDescription className="mt-1">
                                    {PRICING_PLAN_COPY.level2.description}
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="self-start">Nivel 1 + software</Badge>
                        </div>
                        <div className="mt-2">
                            <span className="text-3xl font-bold">
                                {interval === 'annual'
                                    ? priceLabel(level2Plan.annual.monthlyEquivalent)
                                    : priceLabel(level2Plan.monthly.amount)}
                            </span>
                            <span className="text-sm text-muted-foreground">/mes</span>
                            {interval === 'annual' && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Cobro anual: {priceLabel(level2Plan.annual.amount)} ({level2Plan.annual.savingsPercent}% ahorro)
                                </p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-2">
                            {level2Features.map((feature) => (
                                <li key={feature} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        {currentHasClinica ? (
                            <Button className="w-full" variant="outline" disabled>
                                Tu especializacion activa
                            </Button>
                        ) : currentLevel >= 2 ? (
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
                                specializationCode={LEVEL_2_DEFAULT_SPECIALIZATION}
                                billingInterval={interval}
                                label={interval === 'annual'
                                    ? `Subir a ${PRICING_PLAN_COPY.level2.title} - ${priceLabel(level2Plan.annual.amount)}/año`
                                    : `Subir a ${PRICING_PLAN_COPY.level2.title} - ${priceLabel(level2Plan.monthly.amount)}/mes`
                                }
                                variant="default"
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {comingSoonSpecializations.length > 0 && (
                <section className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <h3 className="text-xl font-semibold">Próximas especializaciones</h3>
                        <Badge variant="outline">Lista de espera</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Estas rutas todavía no tienen precio público, pero puedes dejar tu interés para priorizar su apertura.
                    </p>

                    <div className="grid gap-4 lg:grid-cols-2">
                        {comingSoonSpecializations.map((spec) => (
                            <Card key={spec.code} className="border-dashed">
                                <CardHeader>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <CardTitle>{spec.name}</CardTitle>
                                        <Badge variant="secondary" className="self-start">Próximamente</Badge>
                                    </div>
                                    <CardDescription>{comingSoonLabel(spec)}</CardDescription>
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
            )}

            {level3Visible && level3Plan && (
                <Card className={currentLevel >= 3 ? 'border-green-500' : 'border-brand-yellow/40'}>
                    <CardHeader>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-brand-yellow" />
                                    {PRICING_PLAN_COPY.level3.title}
                                </CardTitle>
                                <CardDescription>
                                    {PRICING_PLAN_COPY.level3.description}
                                </CardDescription>
                            </div>
                            <Badge className="self-start bg-brand-yellow hover:bg-brand-yellow">Desbloqueado</Badge>
                        </div>
                        <div className="mt-2">
                            <span className="text-3xl font-bold">
                                {interval === 'annual'
                                    ? priceLabel(level3Plan.annual.monthlyEquivalent)
                                    : priceLabel(level3Plan.monthly.amount)}
                            </span>
                            <span className="text-sm text-muted-foreground">/mes</span>
                            {interval === 'annual' && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Cobro anual: {priceLabel(level3Plan.annual.amount)} ({level3Plan.annual.savingsPercent}% ahorro)
                                </p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-2">
                            {level3Features.map((feature) => (
                                <li key={feature} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 shrink-0 text-green-500" />
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
                                    ? `Subir a Nivel 3 - ${priceLabel(level3Plan.annual.amount)}/año`
                                    : `Subir a Nivel 3 - ${priceLabel(level3Plan.monthly.amount)}/mes`
                                }
                            />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

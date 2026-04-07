import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { MEMBERSHIP_TIERS, getMembershipLabel } from '@/lib/membership'
import { SubscriptionStatus } from '@/components/payments/SubscriptionStatus'
import { CheckoutButton } from '@/components/payments/CheckoutButton'
import { getSubscriptionManagementSnapshot } from '@/lib/payments/subscription-management'
import {
    CreditCard,
    Shield,
    Zap,
} from 'lucide-react'
import { SubscriptionTierCards } from './subscription-tier-cards'

export default async function SubscriptionPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    const isAdmin = profile.role === 'admin'
    const currentLevel = profile.membership_level ?? 0
    const hasPaidMembership = currentLevel >= 1 || ['active', 'trial', 'past_due'].includes(profile.subscription_status ?? '')
    const currentSpecializationCode = (profile as any).membership_specialization_code || null
    const billingSnapshot = !isAdmin
        ? await getSubscriptionManagementSnapshot({
            supabase,
            userId: profile.id,
            fallbackCustomerId: profile.stripe_customer_id ?? null,
        })
        : null

    return (
        <div className="space-y-8">
            <div>
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                    <CreditCard className="h-8 w-8" />
                    Membresia
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Gestiona tu nivel, tus pagos y la renovacion de tu plan.
                </p>
            </div>

            <Card className="border-brand-yellow bg-gradient-to-r from-brand-yellow to-brand-brown dark:border-brand-yellow dark:from-brand-yellow/30 dark:to-brand-brown/30">
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Tu nivel actual</p>
                            <h2 className="mt-1 text-2xl font-bold">
                                {isAdmin ? 'Administrador' : getMembershipLabel(currentLevel)}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {isAdmin
                                    ? 'Acceso total a todas las funciones de la plataforma'
                                    : (MEMBERSHIP_TIERS[currentLevel]?.description ?? 'Membresia activa')}
                            </p>
                        </div>

                        <div
                            className={`self-start rounded-full px-4 py-2 ${
                                isAdmin || currentLevel >= 1
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {(isAdmin || currentLevel >= 1) && <Shield className="h-4 w-4" />}
                                {isAdmin ? 'Admin' : getMembershipLabel(currentLevel)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {!isAdmin && billingSnapshot && (
                <SubscriptionStatus
                    subscription={billingSnapshot.displaySubscription}
                    showPortalButton={billingSnapshot.hasPortalAccess || hasPaidMembership}
                    hasPaidMembership={hasPaidMembership}
                />
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Planes disponibles</CardTitle>
                    <CardDescription>
                        Elige, mejora o recupera tu membresia desde aqui.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <Suspense fallback={<div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Cargando opciones de membresia...</div>}>
                        <SubscriptionTierCards
                            currentLevel={currentLevel}
                            currentSpecializationCode={currentSpecializationCode}
                            isAdmin={isAdmin}
                        />
                    </Suspense>
                </CardContent>
            </Card>

            {!isAdmin && currentLevel >= 2 && (
                <Card className="border-brand-brown bg-gradient-to-r from-brand-brown to-pink-50 dark:border-brand-brown dark:from-brand-brown/30 dark:to-pink-950/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-brand-brown" />
                            Recargas de Inteligencia Artificial
                        </CardTitle>
                        <CardDescription>
                            Potencia tus sesiones con generacion automatica de Notas SOAP y Planes de Accion.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Minutos disponibles</p>
                                <h3 className="text-2xl font-bold">{profile.ai_minutes_available || 0}</h3>
                            </div>
                            <div className={`rounded-full px-3 py-1 text-xs ${(profile.ai_minutes_available || 0) > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900' : 'bg-red-100 text-red-800'}`}>
                                {(profile.ai_minutes_available || 0) > 0 ? 'Disponible' : 'Sin saldo'}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Paquete 10 Horas</CardTitle>
                                    <div className="mt-2 text-2xl font-bold">$250 MXN</div>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-4 text-sm text-muted-foreground">600 minutos de IA</p>
                                    <CheckoutButton
                                        purchaseType="ai_credits"
                                        packageKey="10h"
                                        label="Comprar ($250 MXN)"
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Paquete 20 Horas</CardTitle>
                                    <div className="mt-2 text-2xl font-bold">$400 MXN</div>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-4 text-sm text-muted-foreground">1200 minutos de IA</p>
                                    <CheckoutButton
                                        purchaseType="ai_credits"
                                        packageKey="20h"
                                        label="Comprar ($400 MXN)"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Pagos procesados de forma segura por Stripe. Tus datos estan protegidos.
            </div>
        </div>
    )
}

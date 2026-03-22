import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { MEMBERSHIP_TIERS, getMembershipLabel } from '@/lib/membership'
import { SubscriptionStatus } from '@/components/payments/SubscriptionStatus'
import { CheckoutButton } from '@/components/payments/CheckoutButton'
import type { Subscription } from '@/types/database'
import {
    CreditCard,
    Zap,
    Shield,
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
    const currentSpecializationCode = (profile as any).membership_specialization_code || null

    // Fetch active subscription
    const { data: subscription } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as { data: Subscription | null }

    const hasStripeCustomer = !!(profile as any).stripe_customer_id

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <CreditCard className="h-8 w-8" />
                    Membresía
                </h1>
                <p className="text-muted-foreground mt-1">
                    Gestiona tu nivel de membresía y pagos
                </p>
            </div>

            {/* Current Level */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-900">
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Tu nivel actual</p>
                            <h2 className="text-2xl font-bold mt-1">
                                {isAdmin ? 'Administrador' : getMembershipLabel(currentLevel)}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isAdmin ? 'Acceso total a todas las funciones de la plataforma' : (MEMBERSHIP_TIERS[currentLevel]?.description ?? 'Membresía activa')}
                            </p>
                        </div>
                        <div className={`self-start px-4 py-2 rounded-full flex items-center gap-2 ${isAdmin || currentLevel >= 1
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                            {(isAdmin || currentLevel >= 1) && <Shield className="h-4 w-4" />}
                            {isAdmin ? 'Admin' : getMembershipLabel(currentLevel)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Subscription Status */}
            {!isAdmin && subscription && (
                <SubscriptionStatus
                    subscription={subscription}
                    hasStripeCustomer={hasStripeCustomer}
                />
            )}

            {/* Tier Cards with Monthly/Annual Toggle (client component) */}
            <Suspense fallback={<div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Cargando opciones de membresia...</div>}>
                <SubscriptionTierCards
                    currentLevel={currentLevel}
                    currentSpecializationCode={currentSpecializationCode}
                    isAdmin={isAdmin}
                />
            </Suspense>

            {/* AI Credits Section */}
            {!isAdmin && currentLevel >= 2 && (
                <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-purple-600" />
                            Recargas de Inteligencia Artificial
                        </CardTitle>
                        <CardDescription>
                            Potencia tus sesiones con generación automática de Notas SOAP y Planes de Acción
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-white dark:bg-slate-900 rounded-lg border">
                            <div>
                                <p className="text-sm text-muted-foreground">Minutos Disponibles</p>
                                <h3 className="text-2xl font-bold">{profile.ai_minutes_available || 0}</h3>
                            </div>
                            <div className={`px-3 py-1 text-xs rounded-full ${(profile.ai_minutes_available || 0) > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900' : 'bg-red-100 text-red-800'}`}>
                                {(profile.ai_minutes_available || 0) > 0 ? 'Disponible' : 'Sin saldo'}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Paquete 10 Horas</CardTitle>
                                    <div className="text-2xl font-bold mt-2">$250 MXN</div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">600 minutos de IA</p>
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
                                    <div className="text-2xl font-bold mt-2">$400 MXN</div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">1200 minutos de IA</p>
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

            {/* Secure notice */}
            <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                Pagos procesados de forma segura por Stripe. Tus datos están protegidos.
            </div>
        </div>
    )
}

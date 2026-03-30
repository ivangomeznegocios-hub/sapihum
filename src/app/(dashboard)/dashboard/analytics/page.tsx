import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import {
    BarChart3,
    Users,
    Calendar,
    TrendingUp,
    Activity,
    Clock,
    DollarSign,
    HeartPulse,
    Percent,
    PieChart,
    Target
} from 'lucide-react'
import { getAnalytics } from '@/lib/supabase/queries/analytics'
import { getAdminSettings } from './actions'
import { AnalyticsCharts } from './analytics-charts'
import { StatCard } from '@/components/dashboard/ui/StatCard'
import { AdminSettingsModal } from './admin-settings-modal'

function formatMXN(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumSignificantDigits: 3 }).format(amount)
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnalyticsPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    // Only admin and psychologists can see analytics
    if (profile.role === 'patient') {
        redirect('/dashboard')
    }

    const stats = await getAnalytics()
    const settings = await getAdminSettings()

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <BarChart3 className="h-8 w-8" />
                        Analíticas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Métricas avanzadas para el Startup Framework
                    </p>
                    {profile.role === 'admin' && (
                        <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                            Growth, revenue y unit economics detallados ahora viven en <a href="/dashboard/admin/analytics" className="font-medium text-foreground underline underline-offset-4">/dashboard/admin/analytics</a>. Esta vista se mantiene como resumen general.
                        </div>
                    )}
                </div>
                {profile.role === 'admin' && (
                    <AdminSettingsModal 
                        initialCac={settings.cac} 
                        initialMargin={settings.margin} 
                    />
                )}
            </div>

            {/* 1. Salud Clínica y Retención */}
            <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-brand-brown" />
                    Salud Clínica y Retención
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        title="Tasa de Asistencia"
                        value={`${stats.attendanceRate.toFixed(1)}%`}
                        subtitle="Completadas vs Canceladas"
                        statusIndicator={stats.attendanceRate >= 80 ? 'good' : stats.attendanceRate > 60 ? 'warning' : 'critical'}
                        icon="CheckCircle2"
                        color="primary"
                        info="Mide el compromiso de los pacientes con sus terapias en toda la plataforma. Fórmula: Citas Completadas / (Completadas + Canceladas + No Show). Un número bajo indica problemas de recordatorios o compromiso."
                    />
                    <StatCard
                        title="Health Score Terapéutico"
                        value={`${stats.healthScore.toFixed(1)} / 10`}
                        subtitle="Promedio Global de Ánimo"
                        statusIndicator={stats.healthScore >= 7 ? 'good' : stats.healthScore >= 5 ? 'warning' : 'critical'}
                        icon="Brain"
                        color="secondary"
                        info="El promedio histórico de cómo se sienten los pacientes después de sus sesiones, basado en la evaluación de los psicólogos (1-10)."
                    />
                    <StatCard
                        title="Drop-off Temprano"
                        value={`${stats.dropOffRate.toFixed(1)}%`}
                        subtitle="Abandono antes de 3 sesiones"
                        statusIndicator={stats.dropOffRate <= 20 ? 'good' : stats.dropOffRate <= 40 ? 'warning' : 'critical'}
                        icon="TrendingUp"
                        color="secondary"
                        info="Porcentaje de pacientes que tuvieron 1 o 2 sesiones y desaparecieron (más de 30 días sin regresar). Ayuda a medir la capacidad de los terapeutas para conectar y retener pacientes en primera instancia."
                    />
                </div>
            </div>

            {profile.role === 'admin' && (
                <>
                    {/* 2. Finanzas y Suscripciones */}
                    <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-brand-brown" /> 
                    Finanzas & Retención (SaaS)
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="MRR"
                        value={formatMXN(stats.mrr)}
                        subtitle="Ingreso Mensual"
                        icon="TrendingUp"
                        color="primary"
                        info="Monthly Recurring Revenue (Ingreso Recurrente Mensual). Es el dinero predecible que entra cada mes por las suscripciones activas. Fórmula: Σ(Costo Mensual de cada suscripción activa)."
                    />
                    <StatCard
                        title="Net Dollar Retention"
                        value={`${stats.ndr.toFixed(1)}%`}
                        subtitle="NDR (Objetivo > 100%)"
                        statusIndicator={stats.ndr >= 100 ? 'good' : stats.ndr > 90 ? 'warning' : 'critical'}
                        icon="Target"
                        color="primary"
                        info="NDR mide cuánto retienes y creces financieramente sobre tu base de usuarios existente ignorando las nuevas ventas. Fórmula: ((MRR Inicial + Expansiones) - MRR Cancelado) / MRR Inicial. >100% significa que tu producto crece solo."
                    />
                    <StatCard
                        title="Churn Rate"
                        value={`${stats.churnRate.toFixed(1)}%`}
                        subtitle="Cancelaciones últimos 30 días"
                        statusIndicator={stats.churnRate < 5 ? 'good' : stats.churnRate < 10 ? 'warning' : 'critical'}
                        icon="Activity"
                        color="secondary"
                        info="Tasa de Cancelación. El porcentaje de tus clientes iniciales que te abandonaron este mes. Fórmula: (Suscripciones canceladas en el mes / Suscriptores Totales al inicio del mes) * 100."
                    />
                    <StatCard
                        title="LTV Estimado"
                        value={formatMXN(stats.ltv || 0)}
                        subtitle="Lifetime Value bruto"
                        icon="DollarSign"
                        color="secondary"
                        info="Lifetime Value (Valor de Vida). El dinero total aproxmado que te dejará un solo usuario promedio desde que pisa la plataforma hasta que cancela para siempre. Fórmula: (Ingreso Promedio por Usuario * Margen Bruto) / Churn Rate."
                    />
                </div>
            </div>

            {/* 3. Unit Economics */}
            <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-brand-brown" />
                    Unit Economics
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        title="Costo de Adquisición (CAC)"
                        value={formatMXN(stats.cac)}
                        subtitle="Ingresado manualmente"
                        icon="Activity"
                        color="primary"
                        info="Customer Acquisition Cost. Lo que te cuesta en publicidad y mercadotecnia convencer a un extraño para que pague en tu plataforma. ¡Modifícalo en el botón 'Configurar Métricas' superior!"
                    />
                    <StatCard
                        title="Ratio LTV:CAC"
                        value={`${stats.ltvCacRatio.toFixed(1)}x`}
                        subtitle="Salud (Objetivo > 3.0x)"
                        statusIndicator={stats.ltvCacRatio >= 3 ? 'good' : stats.ltvCacRatio >= 1 ? 'warning' : 'critical'}
                        icon="Target"
                        color="primary"
                        info="La métrica rey del negocio digital. Por cada $1 que gastas en publicidad, ¿cuántos dólares regresan? Menos de 1.0 = tu negocio quema dinero. Mayor a 3.0 = Máquina de impresión de dinero lista para escalar."
                    />
                    <StatCard
                        title="Margen Bruto Configurado"
                        value={`${stats.margin || 0}%`}
                        subtitle="Margen operativo"
                        icon="Percent"
                        color="primary"
                        info="El porcentaje de dólares puros que se queda tu plataforma DEBES descontar los costos operativos de tenerla encendida como servidores y sueldos directos. Para Software (SaaS) usualmente es el 85 a 90%."
                    />
                </div>
            </div>

            {/* 4. Unit Economics Avanzados */}
            <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-brand-yellow" />
                    Unit Economics Avanzados
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        title="ARPU Psicólogos"
                        value={formatMXN(stats.arpuPsychologist)}
                        subtitle="Ingreso Promedio por Especialista"
                        icon="DollarSign"
                        color="secondary"
                        info="Average Revenue Per User. Mide cuánto dinero mensual te deja en promedio un Psicólogo que paga suscripciones. Vital para saber cuánto puedes gastar en campañas para adquirirlos."
                    />
                    <StatCard
                        title="ARPU Pacientes"
                        value={formatMXN(stats.arpuPatient)}
                        subtitle="Ingreso Promedio por Paciente"
                        icon="DollarSign"
                        color="primary"
                        info="Promedio de dinero mensual que entra exclusivamente de pacientes por membresías o compras. Si este número es mayor al de psicólogos, tu negocio es predominantemente B2C."
                    />
                    <StatCard
                        title="Time-to-Value Promedio"
                        value={`${stats.timeToValueHours.toFixed(1)} hrs`}
                        subtitle="Velocidad de Monetización"
                        statusIndicator={stats.timeToValueHours <= 24 ? 'good' : stats.timeToValueHours <= 72 ? 'warning' : 'critical'}
                        icon="Clock"
                        color="primary"
                        info="El tiempo promedio que transcurre desde que un usuario se registra hasta que realiza su primera transacción económica. Mientras más bajo sea este número, más rápido retorna tu inversión publicitaria."
                    />
                </div>
            </div>

            {/* 5. Engagement & Marketplace */}
            <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-brand-brown" />
                    Engagement & Marketplace
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="DAU"
                        value={stats.dau}
                        subtitle="Usuarios Activos Diarios"
                        icon="Users"
                        color="primary"
                        info="Daily Active Users. Cantidad de usuarios reales e interacciones activas en las últimas 24 hrs. Excluye cuentas marcadas como [Test]."
                    />
                    <StatCard
                        title="MAU"
                        value={stats.mau}
                        subtitle="Usuarios Activos Mensuales"
                        icon="Users"
                        color="secondary"
                        info="Monthly Active Users. Cantidad de usuarios que entraron o interactuaron en los últimos 30 días. Tu motor debe buscar que esto crezca o se infeste tu plataforma de perfiles 'fantasma'."
                    />
                    <StatCard
                        title="Ratio DAU/MAU"
                        value={`${stats.dauMauRatio.toFixed(1)}%`}
                        subtitle="Adherencia (Objetivo > 20%)"
                        statusIndicator={stats.dauMauRatio >= 20 ? 'good' : 'warning'}
                        icon="Activity"
                        color="primary"
                        info="Nivel de 'adicción' a tu plataforma. Mide qué porcentaje de los usuarios mensuales usa tu app DIARIO. Arriba del 20% es un producto con retención sana. Redes sociales suelen estar arriba del 50%."
                    />
                    <StatCard
                        title="Event Fill Rate"
                        value={`${stats.fillRate.toFixed(1)}%`}
                        subtitle="Capacidad de Eventos del Mes"
                        icon="Users"
                        color="primary"
                        info="Tasa de Llenado. Si tus ponentes abrieron 100 lugares combinados en sus eventos, esta métrica dice cuántos se ocuparon realmente. Fórmula: Asistentes / Asientos Ofertados."
                    />
                </div>
            </div>

            {/* 6. Crecimiento Orgánico (Viralidad) */}
            <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-brand-yellow" />
                    Crecimiento Orgánico y Viralidad
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                        title="Coeficiente Viral (K-Factor)"
                        value={stats.kFactor.toFixed(2)}
                        subtitle="Nuevos usuarios por usuario actual"
                        statusIndicator={stats.kFactor >= 1.0 ? 'good' : stats.kFactor >= 0.2 ? 'warning' : 'critical'}
                        icon="Users"
                        color="primary"
                        info="La métrica rey del crecimiento orgánico. Indica a cuántos amigos activos invita cada perfil en promedio mediante Códigos de Invitación. Un factor > 1.0 significa crecimiento exponencial infinito."
                    />
                    <StatCard
                        title="Tasa de Conversión de Referidos"
                        value={`${stats.referralConversionRate.toFixed(1)}%`}
                        subtitle="Atribuciones exitosas"
                        statusIndicator={stats.referralConversionRate >= 30 ? 'good' : 'warning'}
                        icon="Percent"
                        color="primary"
                        info="De todos los referimientos iniciados, este es el porcentaje que realmente completó el flujo necesario para obtener recompensas, indicando la calidad del tráfico referido."
                    />
                </div>
            </div>
            </>
            )}

            {/* 7. Plataforma & Eventos (Métricas Base) */}
            <div>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-brand-yellow" />
                    General de la Plataforma
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Usuarios Totales"
                        value={stats.totalUsers}
                        subtitle="Registrados"
                        icon="Users"
                        color="primary"
                    />
                    <StatCard
                        title="Citas Completadas"
                        value={stats.completedAppointments}
                        subtitle={`De ${stats.totalAppointments} totales`}
                        icon="Calendar"
                        color="primary"
                    />
                    <StatCard
                        title="Eventos Creados"
                        value={stats.totalEvents}
                        subtitle="Histórico"
                        icon="TrendingUp"
                        color="secondary"
                    />
                    {profile.role === 'admin' && (
                        <StatCard
                            title="GMV Eventos"
                            value={formatMXN(stats.eventsGmv)}
                            subtitle="Ventas (Mes Actual)"
                            icon="DollarSign"
                            color="primary"
                        />
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Charts */}
                <AnalyticsCharts appointmentsByMonth={stats.chartData} />

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                        <CardDescription>
                            Últimas acciones en la plataforma
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.activity.length > 0 ? (
                                stats.activity.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <div className="p-2 bg-background rounded-full">
                                            {item.type === 'appointment' && <Calendar className="h-4 w-4 text-brand-yellow" />}
                                            {item.type === 'user' && <Users className="h-4 w-4 text-green-500" />}
                                            {item.type === 'event' && <TrendingUp className="h-4 w-4 text-brand-brown" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium line-clamp-2">{item.description}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(item.time).toLocaleDateString()} {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay actividad reciente
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Completion Rate */}
            <Card>
                <CardHeader>
                    <CardTitle>Tasa de Completación</CardTitle>
                    <CardDescription>
                        Porcentaje de citas completadas vs programadas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="h-4 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{
                                        width: `${stats.totalAppointments ? (stats.completedAppointments / stats.totalAppointments) * 100 : 0}%`
                                    }}
                                />
                            </div>
                        </div>
                        <div className="text-2xl font-bold">
                            {stats.totalAppointments ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100) : 0}%
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import {
    Award,
    BriefcaseBusiness,
    Clock,
    Gift,
    Megaphone,
    Rocket,
    Share2,
    ShieldCheck,
    Trophy,
    TrendingUp,
    Users,
    type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMyInviteStats } from '@/actions/invite-referrals'
import { getInviteRewardEvents } from '@/lib/supabase/queries/invite-referrals'
import { getActiveCampaigns, getTopReferrers } from '@/lib/supabase/queries/growth-campaigns'
import { cn } from '@/lib/utils'
import type { GrowthCampaign } from '@/types/database'
import { getCommercialAccessContext } from '@/lib/access/commercial'
import { canAccessGrowthHub } from '@/lib/access/internal-modules'
import {
    CampaignCard,
    CopyCodeButton,
    CopyLinkButton,
    LeaderboardTable,
    RewardTimeline,
    ShareLinkButton,
} from './growth-components'

function StatCard({
    label,
    value,
    icon: Icon,
    color = 'text-primary',
    description,
}: {
    label: string
    value: number | string
    icon: LucideIcon
    color?: string
    description?: string
}) {
    return (
        <div className="rounded-2xl border bg-card p-4 transition-all hover:shadow-sm">
            <div className="flex items-center gap-3">
                <div className={cn('rounded-xl bg-muted/50 p-2', color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {description && <p className="mt-0.5 text-[10px] text-muted-foreground/70">{description}</p>}
                </div>
            </div>
        </div>
    )
}

export default async function GrowthHubPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const commercialAccess = await getCommercialAccessContext({
        supabase,
        userId: user.id,
    })

    if (!commercialAccess) redirect('/auth/login')

    const role = commercialAccess.role
    const viewer = {
        role,
        membershipLevel: commercialAccess.membershipLevel,
    }

    if (!canAccessGrowthHub(viewer)) {
        if (role === 'psychologist') {
            redirect('/dashboard/subscription')
        }

        redirect('/dashboard')
    }

    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    const [statsResult, rewards, campaigns, topReferrers] = await Promise.all([
        getMyInviteStats(),
        getInviteRewardEvents(user.id),
        getActiveCampaigns(role),
        getTopReferrers(10),
    ]).catch((error) => {
        console.error('Growth hub fetch error:', error)
        return [null, [], [], []] as [any, any[], any[], any[]]
    })

    const stats = statsResult?.stats

    return (
        <div className="max-w-6xl space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-3">
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 text-white shadow-lg shadow-emerald-500/20">
                            <Rocket className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Programa de Invitacion Profesional</h1>
                            <p className="text-sm text-muted-foreground">
                                Monetiza invitando psicologos y ponentes a la plataforma con payouts, bonos y metas.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
                    <p className="font-medium">Separacion de dominio activa</p>
                    <p className="text-muted-foreground">
                        Este modulo genera recompensas por adquisicion profesional. La canalizacion clinica de pacientes nunca paga comision.
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-5 dark:from-emerald-950/10 dark:via-background dark:to-teal-950/10">
                <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <BriefcaseBusiness className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Invita perfiles que si generan negocio</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Prioriza colegas con potencial de activacion real: psicologos que completen perfil, se suscriban o compren servicios, y ponentes que impulsen la comunidad.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-background/70 p-4">
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                            <div className="text-sm">
                                <p className="font-medium">Regla central</p>
                                <p className="text-muted-foreground">
                                    El dinero vive aqui, en invitacion profesional. La transferencia de pacientes vive en canalizacion clinica y no genera rewards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-6 lg:col-span-2">
                    <div className="mb-4 flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Mi codigo profesional</h2>
                    </div>

                    {stats ? (
                        <>
                            <div className="mb-4 rounded-xl bg-muted/60 px-4 py-4 text-center">
                                <p className="text-3xl font-mono font-bold tracking-[0.25em] text-primary">
                                    {stats.code}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Compartelo con psicologos y ponentes para activar recompensas economicas y beneficios acumulables.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <CopyCodeButton code={stats.code} />
                                <ShareLinkButton code={stats.code} baseUrl={baseUrl} />
                                <CopyLinkButton code={stats.code} baseUrl={baseUrl} />
                            </div>
                        </>
                    ) : (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            No fue posible cargar tu codigo de invitacion.
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 lg:col-span-3">
                    <StatCard
                        label="Invitados totales"
                        value={stats?.totalInvites ?? 0}
                        icon={Users}
                        color="text-blue-600 dark:text-blue-400"
                        description="Psicologos y ponentes vinculados con tu codigo"
                    />
                    <StatCard
                        label="Activados"
                        value={stats?.completedInvites ?? 0}
                        icon={TrendingUp}
                        color="text-emerald-600 dark:text-emerald-400"
                        description="Registros ya validados o recompensados"
                    />
                    <StatCard
                        label="Rewards generados"
                        value={stats?.rewardedInvites ?? 0}
                        icon={Gift}
                        color="text-violet-600 dark:text-violet-400"
                        description="Invitaciones que ya detonaron valor economico"
                    />
                    <StatCard
                        label="Pendientes"
                        value={stats?.pendingInvites ?? 0}
                        icon={Clock}
                        color="text-amber-600 dark:text-amber-400"
                        description="Esperando activacion o trigger economico"
                    />
                </div>
            </div>

            {campaigns.length > 0 && (
                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Campanas activas</h2>
                        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {campaigns.length} activa{campaigns.length === 1 ? '' : 's'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {campaigns.map((campaign: GrowthCampaign) => (
                            <CampaignCard key={campaign.id} campaign={campaign} />
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <h2 className="text-lg font-semibold">Embajadores</h2>
                        <span className="ml-auto text-xs text-muted-foreground">Top {topReferrers.length}</span>
                    </div>
                    <LeaderboardTable referrers={topReferrers} currentUserId={user.id} />
                </div>

                <div className="rounded-2xl border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-violet-500" />
                        <h2 className="text-lg font-semibold">Mis rewards</h2>
                        <span className="ml-auto text-xs text-muted-foreground">{rewards.length} total</span>
                    </div>
                    <RewardTimeline rewards={rewards} />
                </div>
            </div>

            <div className="rounded-2xl border bg-gradient-to-br from-muted/30 to-muted/10 p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Como se monetiza este programa
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-xl border bg-background/70 p-4 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            1
                        </div>
                        <h3 className="text-sm font-semibold">Invita al profesional correcto</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Comparte tu codigo con psicologos o ponentes con alta probabilidad de activacion.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-background/70 p-4 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            2
                        </div>
                        <h3 className="text-sm font-semibold">Activa triggers de valor</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Registro validado, perfil completo, suscripcion y primera compra pueden generar payout.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-background/70 p-4 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                            3
                        </div>
                        <h3 className="text-sm font-semibold">Escala con bonos</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Las campanas pueden sumar premios por hitos, boosts temporales y rewards duales para el invitado.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-background/70 p-4 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            4
                        </div>
                        <h3 className="text-sm font-semibold">Mantente en el ranking</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            El programa recompensa consistencia, conversion real y volumen, no el movimiento de pacientes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

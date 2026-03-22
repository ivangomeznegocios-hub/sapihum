import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
    Megaphone, PenTool, Target, Headphones, MapPin,
    Search as SearchIcon, Users, FileEdit, BarChart3,
    Sparkles,
} from 'lucide-react'
import {
    getMarketingOverview,
    SERVICE_LABELS,
    STATUS_CONFIG,
    type MarketingServiceKey,
} from '@/lib/supabase/queries/marketing-services'
import { UpdateServiceForm, BriefStatusButtons, InitServicesButton } from './admin-marketing-forms'
import { cn } from '@/lib/utils'

const SERVICE_ICONS: Record<string, React.ElementType> = {
    community_manager: Megaphone,
    content_creation: PenTool,
    assistant: Headphones,
    seo: SearchIcon,
    ads: Target,
    google_business: MapPin,
}

export default async function AdminMarketingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'admin') redirect('/dashboard')

    const { users } = await getMarketingOverview()

    // Stats
    const totalUsers = users.length
    const usersWithBrief = users.filter(u => u.brief).length
    const totalActiveServices = users.reduce(
        (acc, u) => acc + u.services.filter(s => s.status === 'active').length,
        0
    )
    const totalServices = users.reduce((acc, u) => acc + u.services.length, 0)

    return (
        <div className="w-full max-w-6xl space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 text-white shadow-lg shadow-indigo-500/20">
                    <Sparkles className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Marketing Premium — Admin</h1>
                    <p className="text-muted-foreground text-sm">
                        Gestión de servicios de marketing para miembros nivel 3
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Users className="h-4 w-4" />
                        <span className="text-2xl font-bold">{totalUsers}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Clientes Nivel 3</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <FileEdit className="h-4 w-4" />
                        <span className="text-2xl font-bold">{usersWithBrief}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Briefs Recibidos</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-2xl font-bold">{totalActiveServices}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Servicios Activos</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Megaphone className="h-4 w-4" />
                        <span className="text-2xl font-bold">{totalServices}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total Servicios</p>
                </div>
            </div>

            {/* Client List */}
            {users.length === 0 ? (
                <div className="text-center py-12 border rounded-xl bg-muted/10">
                    <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground font-medium">No hay miembros nivel 3 aún</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Los clientes aparecerán aquí cuando adquieran la membresía Marketing Premium.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {users.map((client) => {
                        const activeCount = client.services.filter(s => s.status === 'active').length
                        const total = client.services.length

                        return (
                            <div key={client.id} className="overflow-hidden rounded-xl border bg-card">
                                {/* Client Header */}
                                <div className="flex flex-col gap-4 border-b bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                            {client.avatar_url ? (
                                                <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold text-muted-foreground">
                                                    {(client.full_name || '?').charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold">{client.full_name || 'Sin nombre'}</h3>
                                            <p className="break-words text-xs text-muted-foreground">
                                                {client.email} · {activeCount}/{total} activos
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                                        {/* Brief status badge */}
                                        {client.brief ? (
                                            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                                                <span className={cn(
                                                    'text-xs px-2.5 py-1 rounded-full font-medium border',
                                                    client.brief.status === 'approved'
                                                        ? 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800'
                                                        : client.brief.status === 'reviewed'
                                                            ? 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800'
                                                            : 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800'
                                                )}>
                                                    Brief: {client.brief.status === 'submitted' ? 'Enviado' : client.brief.status === 'reviewed' ? 'Revisado' : 'Aprobado'}
                                                </span>
                                                <BriefStatusButtons briefId={client.brief.id} currentStatus={client.brief.status} />
                                            </div>
                                        ) : (
                                            <span className="text-xs px-2.5 py-1 rounded-full font-medium border text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700">
                                                Sin brief
                                            </span>
                                        )}

                                        {total === 0 && (
                                            <InitServicesButton userId={client.id} />
                                        )}
                                    </div>
                                </div>

                                {/* Brief Details (if submitted) */}
                                {client.brief && (
                                    <div className="px-5 py-3 border-b bg-indigo-50/30 dark:bg-indigo-950/10">
                                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Brief de Marca:</p>
                                        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
                                            {client.brief.brand_name && (
                                                <div><span className="font-medium">Marca:</span> {client.brief.brand_name}</div>
                                            )}
                                            {client.brief.tone_of_voice && (
                                                <div><span className="font-medium">Tono:</span> {client.brief.tone_of_voice}</div>
                                            )}
                                            {client.brief.target_audience && (
                                                <div><span className="font-medium">Público:</span> {client.brief.target_audience}</div>
                                            )}
                                            {client.brief.goals && (
                                                <div><span className="font-medium">Objetivos:</span> {client.brief.goals}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Services Grid */}
                                {client.services.length > 0 ? (
                                    <div className="divide-y">
                                        {client.services.map((service) => {
                                            const key = service.service_key as MarketingServiceKey
                                            const Icon = SERVICE_ICONS[key] ?? Megaphone
                                            const labels = SERVICE_LABELS[key]
                                            const statusCfg = STATUS_CONFIG[service.status] ?? STATUS_CONFIG.pending_brief

                                            return (
                                                <div key={service.id} className="px-5 py-3">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">{labels?.title ?? key}</p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${statusCfg.color}`}>
                                                                        {statusCfg.label}
                                                                    </span>
                                                                    {service.assigned_to && (
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            → {service.assigned_to}
                                                                        </span>
                                                                    )}
                                                                    {service.admin_notes && (
                                                                        <span className="text-[10px] text-muted-foreground italic">
                                                                            📝 {service.admin_notes.substring(0, 40)}...
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <UpdateServiceForm
                                                            serviceId={service.id}
                                                            currentStatus={service.status}
                                                            currentNotes={service.notes}
                                                            currentAdminNotes={service.admin_notes}
                                                            currentAssignedTo={service.assigned_to}
                                                            currentContactLink={service.contact_link}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="px-5 py-6 text-center text-muted-foreground text-sm">
                                        No tiene servicios inicializados.
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

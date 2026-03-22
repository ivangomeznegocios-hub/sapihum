import { createClient, getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Megaphone,
    PenTool,
    Target,
    Headphones,
    MapPin,
    Search as SearchIcon,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    MessageCircle,
    CalendarClock,
    FileEdit,
    ExternalLink,
    Clock,
} from 'lucide-react'
import Link from 'next/link'
import {
    getUserMarketingServices,
    getUserMarketingBrief,
    initializeMarketingServices,
    SERVICE_LABELS,
    STATUS_CONFIG,
    type MarketingServiceKey,
} from '@/lib/supabase/queries/marketing-services'
import { BriefButton, ServiceInitializer } from './marketing-client'

export const metadata = {
    title: 'Marketing Premium Hub | Comunidad Psicología',
    description: 'Gestiona tus servicios de Marketing Premium',
}

const SERVICE_ICONS: Record<MarketingServiceKey, React.ElementType> = {
    community_manager: Megaphone,
    content_creation: PenTool,
    assistant: Headphones,
    seo: SearchIcon,
    ads: Target,
    google_business: MapPin,
}

export default async function MarketingHubPage() {
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    const currentLevel = profile.membership_level ?? 0
    const isAdmin = profile.role === 'admin'

    // Only allow level 3 (Marketing Premium) or admins
    if (!isAdmin && currentLevel < 3) {
        redirect('/dashboard/subscription')
    }

    // Initialize services if this is a first visit
    let services = await getUserMarketingServices(profile.id)
    if (services.length === 0) {
        services = await initializeMarketingServices(profile.id)
    }

    const brief = await getUserMarketingBrief(profile.id)
    const hasBrief = !!brief

    // Calculate progress
    const activeCount = services.filter(s => s.status === 'active').length
    const inProgressCount = services.filter(s => s.status === 'in_progress').length
    const totalServices = services.length || 6

    // Determine next step for the user
    const nextStep = !hasBrief
        ? { number: 1, label: 'Completa tu Brief de Marca', done: false }
        : brief.status === 'submitted'
            ? { number: 2, label: 'Brief en revisión por tu equipo', done: false }
            : { number: 3, label: 'Seguimiento activo de servicios', done: false }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-10">
            {/* Service Initializer (client component, invisible) */}
            <ServiceInitializer />

            {/* Header VIP */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-8 sm:p-12 shadow-lg border border-indigo-800/50">
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20 pointer-events-none">
                    <Sparkles className="w-96 h-96 text-indigo-300" />
                </div>

                <div className="relative z-10 max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-sm font-medium border border-indigo-500/30 backdrop-blur-sm">
                        <Sparkles className="h-4 w-4" />
                        Membresía Marketing Premium
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
                        Tu equipo de marketing, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-200">
                            listo para escalar tu marca.
                        </span>
                    </h1>
                    <p className="text-indigo-100/80 text-lg max-w-2xl leading-relaxed">
                        Bienvenido a tu hub central. Aquí podrás dar seguimiento al estado de todas tus campañas,
                        contactar a tu equipo asignado y revisar métricas de crecimiento mensuales.
                    </p>

                    {/* Progress bar */}
                    <div className="pt-2">
                        <div className="flex items-center gap-3 text-sm text-indigo-200/80 mb-2">
                            <span>{activeCount} de {totalServices} servicios activos</span>
                            {inProgressCount > 0 && (
                                <span className="text-blue-300">· {inProgressCount} en progreso</span>
                            )}
                        </div>
                        <div className="w-full h-2 bg-indigo-900/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max((activeCount / totalServices) * 100, 5)}%` }}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex flex-wrap gap-4">
                        <BriefButton existingBrief={brief} variant="hero" />
                        <Button variant="outline" className="border-indigo-500/50 text-white hover:bg-indigo-500/20 bg-transparent" asChild>
                            <a href="https://wa.me/521XXXXXXXXXX" target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Contactar a Soporte VIP
                            </a>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Services + Sidebar */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Estado de Servicios</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {services.map((service) => {
                                const key = service.service_key as MarketingServiceKey
                                const Icon = SERVICE_ICONS[key] ?? Megaphone
                                const labels = SERVICE_LABELS[key]
                                const statusCfg = STATUS_CONFIG[service.status] ?? STATUS_CONFIG.pending_brief
                                const isPendingBrief = service.status === 'pending_brief'
                                const hasContact = !!service.contact_link

                                return (
                                    <Card key={service.id} className="flex flex-col h-full border-slate-200 dark:border-slate-800 overflow-hidden group hover:shadow-md transition-all">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusCfg.color}`}>
                                                    {statusCfg.label}
                                                </div>
                                            </div>
                                            <CardTitle className="text-lg">{labels?.title ?? key}</CardTitle>
                                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                                {labels?.description}
                                            </CardDescription>
                                        </CardHeader>

                                        {/* Notes from admin */}
                                        {service.notes && (
                                            <CardContent className="pt-0 pb-2">
                                                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                                                    💬 {service.notes}
                                                </p>
                                            </CardContent>
                                        )}

                                        {/* Assigned team member */}
                                        {service.assigned_to && (
                                            <CardContent className="pt-0 pb-2">
                                                <p className="text-xs text-muted-foreground">
                                                    👤 Asignado a: <span className="font-medium text-foreground">{service.assigned_to}</span>
                                                </p>
                                            </CardContent>
                                        )}

                                        <div className="flex-1" />
                                        <CardFooter className="pt-2 pb-4">
                                            {isPendingBrief && key === 'community_manager' ? (
                                                <BriefButton existingBrief={brief} />
                                            ) : hasContact ? (
                                                <Button variant="secondary" className="w-full justify-between" asChild>
                                                    <a href={service.contact_link!} target="_blank" rel="noopener noreferrer">
                                                        Contactar
                                                        <ExternalLink className="w-4 h-4 ml-2" />
                                                    </a>
                                                </Button>
                                            ) : isPendingBrief ? (
                                                <Button variant="secondary" className="w-full justify-between opacity-50 cursor-not-allowed" disabled>
                                                    Esperando brief
                                                    <Clock className="w-4 h-4 ml-2" />
                                                </Button>
                                            ) : service.status === 'active' ? (
                                                <Button variant="secondary" className="w-full justify-between text-emerald-600" disabled>
                                                    <span className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Servicio Activo
                                                    </span>
                                                </Button>
                                            ) : (
                                                <Button variant="secondary" className="w-full justify-between opacity-60" disabled>
                                                    En proceso
                                                    <CalendarClock className="w-4 h-4 ml-2" />
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Próximos Pasos — Dynamic */}
                    <Card className="border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle2 className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
                                Próximos Pasos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Step 1: Brand Brief */}
                            <div className="flex gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasBrief
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-indigo-600 text-white'
                                    }`}>
                                    {hasBrief ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${hasBrief ? 'line-through text-muted-foreground' : ''}`}>
                                        Brief de Marca Personal
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {hasBrief
                                            ? `Enviado el ${new Date(brief.created_at).toLocaleDateString('es-MX')}`
                                            : 'Cuestionario sobre tu tono de voz, colores y propuesta de valor única.'
                                        }
                                    </p>
                                    {!hasBrief && (
                                        <BriefButton existingBrief={null} />
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Brief Review */}
                            <div className={`flex gap-3 ${hasBrief ? '' : 'text-muted-foreground'}`}>
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${brief?.status === 'reviewed' || brief?.status === 'approved'
                                    ? 'bg-emerald-500 text-white'
                                    : hasBrief
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                    {brief?.status === 'reviewed' || brief?.status === 'approved'
                                        ? <CheckCircle2 className="w-3.5 h-3.5" />
                                        : '2'
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Revisión del Equipo</p>
                                    <p className="text-xs mt-0.5">
                                        {brief?.status === 'reviewed'
                                            ? 'Tu equipo ha revisado tu brief ✓'
                                            : brief?.status === 'approved'
                                                ? 'Brief aprobado — comenzando trabajo ✓'
                                                : 'Tu equipo de marketing revisará tu brief y preparará la estrategia.'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Step 3: Active Services */}
                            <div className={`flex gap-3 ${activeCount > 0 ? '' : 'text-muted-foreground'}`}>
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeCount >= totalServices
                                    ? 'bg-emerald-500 text-white'
                                    : activeCount > 0
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                    {activeCount >= totalServices ? <CheckCircle2 className="w-3.5 h-3.5" /> : '3'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Servicios en Marcha</p>
                                    <p className="text-xs mt-0.5">
                                        {activeCount > 0
                                            ? `${activeCount} de ${totalServices} servicios activos`
                                            : 'Tus servicios se irán activando conforme el equipo avance.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Brief Status Card (if submitted) */}
                    {brief && (
                        <Card className="border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileEdit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    Tu Brief de Marca
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-xs space-y-1">
                                    {brief.brand_name && (
                                        <p><span className="font-medium">Marca:</span> {brief.brand_name}</p>
                                    )}
                                    <p className="text-muted-foreground">
                                        Estado: {
                                            brief.status === 'submitted' ? '📩 Enviado'
                                                : brief.status === 'reviewed' ? '👀 Revisado'
                                                    : '✅ Aprobado'
                                        }
                                    </p>
                                </div>
                                <BriefButton existingBrief={brief} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Links */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Enlaces Rápidos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="ghost" className="w-full justify-start text-sm h-9" asChild>
                                <Link href="/dashboard/subscription">
                                    Facturación y Pagos
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-sm h-9" asChild>
                                <a href="https://wa.me/521XXXXXXXXXX" target="_blank" rel="noopener noreferrer">
                                    Contactar Soporte VIP
                                    <ExternalLink className="w-3 h-3 ml-auto" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

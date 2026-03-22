'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
    Home,
    Users,
    BookOpen,
    MessageSquare,
    Settings,
    Brain,
    Calendar,
    CalendarDays,
    CalendarPlus,
    FileText,
    BarChart3,
    Shield,
    UserCog,
    CreditCard,
    Video,
    CheckSquare,
    GitBranch,
    BookUser,
    ChevronDown,
    Lock,
    Sparkles,
    Check,
    Newspaper,
    Handshake,
    GraduationCap,
    Briefcase,
    Users2,
    Mic2,
    DollarSign,
    Gift,
    TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMembershipTier } from '@/lib/membership'
import type { UserRole } from '@/types/database'
import { canUserSeeLevel3Offer } from '@/lib/specializations'

// ────────────────────────────────────────
// Navigation item types
// ────────────────────────────────────────
interface NavItem {
    name: string
    href: string
    icon: React.ElementType
    roles: UserRole[]
    minLevel?: number // Minimum membership level required
}

interface NavGroup {
    label: string
    roles: UserRole[]
    items: NavItem[]
}

// ────────────────────────────────────────
// Grouped navigation definitions
// ────────────────────────────────────────
const navGroups: NavGroup[] = [
    {
        label: 'Principal',
        roles: ['admin', 'psychologist', 'patient', 'ponente'],
        items: [
            { name: 'Inicio', href: '/dashboard', icon: Home, roles: ['admin', 'psychologist', 'patient', 'ponente'] },
            { name: 'Calendario', href: '/dashboard/calendar', icon: Calendar, roles: ['admin', 'patient'], minLevel: 2 },
            { name: 'Mensajes', href: '/dashboard/messages', icon: MessageSquare, roles: ['admin', 'psychologist', 'patient'], minLevel: 2 },
            { name: 'Invitacion Pro', href: '/dashboard/growth', icon: Gift, roles: ['admin', 'psychologist', 'ponente'], minLevel: 1 },
        ],
    },
    {
        label: 'Comunidad',
        roles: ['admin', 'psychologist', 'patient', 'ponente'],
        items: [
            { name: 'Eventos', href: '/dashboard/events', icon: CalendarDays, roles: ['admin', 'psychologist', 'patient', 'ponente'], minLevel: 1 },
            { name: 'Networking', href: '/dashboard/events/networking', icon: Users2, roles: ['admin', 'psychologist', 'ponente'], minLevel: 1 },
            { name: 'Escuela Clínica', href: '/dashboard/events/clinical', icon: GraduationCap, roles: ['admin', 'psychologist', 'ponente'], minLevel: 1 },
            { name: 'Negocios', href: '/dashboard/events/business', icon: Briefcase, roles: ['admin', 'psychologist', 'ponente'], minLevel: 1 },
            { name: 'Grabaciones', href: '/dashboard/events/recordings', icon: Video, roles: ['admin', 'psychologist', 'ponente'], minLevel: 1 },
            { name: 'Ponentes', href: '/dashboard/speakers', icon: Mic2, roles: ['admin', 'psychologist', 'ponente'] },
            { name: 'Recursos', href: '/dashboard/resources', icon: BookOpen, roles: ['admin', 'psychologist', 'ponente'], minLevel: 1 },
            { name: 'Newsletter', href: '/dashboard/newsletter', icon: Newspaper, roles: ['admin', 'psychologist', 'ponente'], minLevel: 1 },
            { name: 'Convenios', href: '/dashboard/agreements', icon: Handshake, roles: ['admin', 'psychologist', 'ponente'], minLevel: 1 },
        ],
    },
    {
        label: 'Mi Proceso',
        roles: ['admin', 'patient'],
        items: [
            { name: 'Mi Psicólogo', href: '/dashboard/my-psychologist', icon: UserCog, roles: ['admin', 'patient'] },
            { name: 'Agendar Cita', href: '/dashboard/booking', icon: CalendarPlus, roles: ['admin', 'patient'] },
            { name: 'Tareas', href: '/dashboard/tasks', icon: CheckSquare, roles: ['admin', 'patient'] },
            { name: 'Herramientas', href: '/dashboard/tools', icon: Brain, roles: ['admin', 'patient'] },
            { name: 'Documentos', href: '/dashboard/documents', icon: FileText, roles: ['admin', 'patient'] },
        ],
    },
    {
        label: 'Nivel 2 - Especializacion',
        roles: ['admin', 'psychologist'],
        items: [
            { name: 'Calendario', href: '/dashboard/calendar', icon: Calendar, roles: ['admin', 'psychologist'], minLevel: 2 },
            { name: 'Mis Pacientes', href: '/dashboard/patients', icon: Users, roles: ['admin', 'psychologist'], minLevel: 2 },
            { name: 'Tareas', href: '/dashboard/tasks', icon: CheckSquare, roles: ['admin', 'psychologist'], minLevel: 2 },
            { name: 'Documentos', href: '/dashboard/documents', icon: FileText, roles: ['admin', 'psychologist'], minLevel: 2 },
            { name: 'Canalizacion', href: '/dashboard/referrals', icon: GitBranch, roles: ['admin', 'psychologist'], minLevel: 2 },
            { name: 'Estadísticas', href: '/dashboard/analytics', icon: BarChart3, roles: ['admin', 'psychologist'], minLevel: 2 },
        ],
    },
    {
        label: 'Nivel 3 - Avanzado',
        roles: ['admin', 'psychologist'],
        items: [
            { name: 'Hub Avanzado', href: '/dashboard/marketing', icon: Sparkles, roles: ['admin', 'psychologist'], minLevel: 3 },
        ],
    },
    {
        label: 'Gestión de Eventos',
        roles: ['admin', 'ponente'],
        items: [
            { name: 'Mis Eventos', href: '/dashboard/events', icon: CalendarDays, roles: ['admin', 'ponente'] },
            { name: 'Ganancias', href: '/dashboard/earnings', icon: DollarSign, roles: ['admin', 'ponente'] },
            { name: 'Crear Evento', href: '/dashboard/events/new', icon: CalendarPlus, roles: ['admin', 'ponente'] },
            { name: 'Mi Perfil Ponente', href: '/dashboard/settings', icon: Mic2, roles: ['admin', 'ponente'] },
        ],
    },
]

const adminGroup: NavGroup = {
    label: 'Administración',
    roles: ['admin'],
    items: [
        { name: 'Panel Admin', href: '/dashboard/admin', icon: Shield, roles: ['admin'] },
        { name: 'Usuarios', href: '/dashboard/admin/users', icon: UserCog, roles: ['admin'] },
        { name: 'Directorio', href: '/dashboard/admin/directory', icon: BookUser, roles: ['admin'] },
        { name: 'Ganancias Ponentes', href: '/dashboard/admin/earnings', icon: DollarSign, roles: ['admin'] },
        { name: 'Canalizacion', href: '/dashboard/admin/referrals', icon: GitBranch, roles: ['admin'] },
        { name: 'Newsletters', href: '/dashboard/admin/newsletters', icon: Newspaper, roles: ['admin'] },
        { name: 'Convenios', href: '/dashboard/admin/agreements', icon: Handshake, roles: ['admin'] },
        { name: 'Invitacion Pro', href: '/dashboard/admin/growth', icon: TrendingUp, roles: ['admin'] },
        { name: 'Marketing', href: '/dashboard/admin/marketing', icon: Sparkles, roles: ['admin'] },
        { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3, roles: ['admin'] },
    ],
}

const bottomNav: NavItem[] = [
    { name: 'Suscripción', href: '/dashboard/subscription', icon: CreditCard, roles: ['admin', 'psychologist'] },
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'psychologist', 'patient', 'ponente'] },
]

// ────────────────────────────────────────
// Collapsible Group Component
// ────────────────────────────────────────
function NavGroupSection({
    group,
    userRole,
    membershipLevel,
    pathname,
    onNavigate,
}: {
    group: NavGroup
    userRole: UserRole
    membershipLevel: number
    pathname: string
    onNavigate?: () => void
}) {
    // Check if any item in the group is active (so we start expanded)
    const hasActiveItem = group.items.some(
        item => item.roles.includes(userRole) && pathname === item.href
    )
    const [isOpen, setIsOpen] = useState(true)
    const groupId = group.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    useEffect(() => {
        if (hasActiveItem) {
            setIsOpen(true)
        }
    }, [hasActiveItem])

    const visibleItems = group.items.filter(item => item.roles.includes(userRole))
    if (visibleItems.length === 0) return null

    return (
        <div>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`nav-group-${groupId}`}
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors"
            >
                {group.label}
                <ChevronDown
                    className={cn(
                        'h-3 w-3 transition-transform duration-200',
                        !isOpen && '-rotate-90'
                    )}
                />
            </button>

            {isOpen && (
                <ul id={`nav-group-${groupId}`} className="mt-0.5 space-y-0.5">
                    {visibleItems.map((item) => {
                        const isActive = pathname === item.href
                        const isLocked = userRole === 'psychologist' && item.minLevel !== undefined && membershipLevel < item.minLevel
                        // Marketing Premium items are managed services — link to Hub
                        const isManagedService = item.minLevel === 3 && item.href === '/dashboard/marketing'

                        return (
                            <li key={item.name}>
                                {isLocked ? (
                                    <Link
                                        href="/dashboard/subscription"
                                        onClick={onNavigate}
                                        className="group flex items-center gap-x-3 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground/35 hover:text-sidebar-foreground/50 hover:bg-sidebar-accent/30 transition-colors"
                                        title={item.minLevel === 3 ? 'Nivel 3 - Avanzado' : item.minLevel === 2 ? 'Nivel 2 - Especializacion' : 'Nivel 1 - Comunidad'}
                                    >
                                        <item.icon className="h-4 w-4 shrink-0" />
                                        <span className="flex-1 truncate">{item.name}</span>
                                        {item.minLevel === 3 ? (
                                            <Sparkles className="h-3 w-3 opacity-50 text-amber-400" />
                                        ) : (
                                            <Lock className="h-3 w-3 opacity-50" />
                                        )}
                                    </Link>
                                ) : isManagedService ? (
                                    /* Managed services: show as active with check, navigate to hub */
                                    <Link
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            'group flex items-center gap-x-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                                        )}
                                        title="Gestionar en tu Hub de Marketing Premium"
                                    >
                                        <item.icon className="h-4 w-4 shrink-0 text-amber-500" />
                                        <span className="flex-1 truncate">{item.name}</span>
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    </Link>
                                ) : (
                                    <Link
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            'group flex items-center gap-x-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                'h-4 w-4 shrink-0',
                                                isActive
                                                    ? 'text-sidebar-primary'
                                                    : 'text-sidebar-foreground/60 group-hover:text-sidebar-primary'
                                            )}
                                        />
                                        <span className="truncate">{item.name}</span>
                                    </Link>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

// ────────────────────────────────────────
// Membership Badge Component
// ────────────────────────────────────────
function MembershipBadge({
    level,
    onNavigate,
}: {
    level: number
    onNavigate?: () => void
}) {
    const tier = getMembershipTier(level)

    const badgeStyles: Record<number, string> = {
        0: 'from-slate-100 to-slate-50 border-slate-200 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700',
        1: 'from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800',
        2: 'from-violet-50 to-purple-50 border-violet-200 dark:from-violet-950 dark:to-purple-950 dark:border-violet-800',
        3: 'from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950 dark:to-orange-950 dark:border-amber-800',
    }

    const dotStyles: Record<number, string> = {
        0: 'bg-slate-400',
        1: 'bg-blue-500',
        2: 'bg-violet-500',
        3: 'bg-amber-500',
    }

    return (
        <Link
            href="/dashboard/subscription"
            onClick={onNavigate}
            className={cn(
                'block rounded-lg border bg-gradient-to-br p-3 transition-shadow hover:shadow-sm',
                badgeStyles[level] ?? badgeStyles[0]
            )}
        >
            <div className="flex items-center gap-2">
                <div className={cn('h-2 w-2 rounded-full', dotStyles[level] ?? dotStyles[0])} />
                <span className="text-xs font-bold text-sidebar-foreground truncate">
                    {tier.label}
                </span>
            </div>
        </Link>
    )
}

// ────────────────────────────────────────
// Main Sidebar Component
// ────────────────────────────────────────
interface SidebarProps {
    userRole?: UserRole | null
    membershipLevel?: number
    membershipSpecializationCode?: string | null
    isMobile?: boolean
    onNavigate?: () => void
}

export function Sidebar({
    userRole,
    membershipLevel = 0,
    membershipSpecializationCode = null,
    isMobile,
    onNavigate,
}: SidebarProps) {
    const pathname = usePathname()

    if (!userRole) return null

    const canSeeLevel3Group = canUserSeeLevel3Offer({
        membershipLevel,
        specializationCode: membershipSpecializationCode,
        isAdmin: userRole === 'admin',
    })

    // Filter groups visible to this role
    const visibleGroups = navGroups.filter((g) => {
        if (!g.roles.includes(userRole)) return false
        if (g.label === 'Nivel 3 - Avanzado') return canSeeLevel3Group
        return true
    })
    const showAdmin = adminGroup.roles.includes(userRole)

    const filteredBottomNav = bottomNav.filter(item => item.roles.includes(userRole))

    return (
        <aside className={cn(
            "overflow-hidden bg-sidebar border-r border-sidebar-border",
            isMobile
                ? "flex h-full w-full flex-col border-0 bg-transparent"
                : "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64"
        )}>
            <div className="flex h-full min-h-0 grow flex-col overflow-y-auto overscroll-contain bg-sidebar px-4 pb-4">
                {/* Logo */}
                <div className="flex h-14 shrink-0 items-center gap-2 px-1">
                    <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                        <Brain className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
                        Comunidad Psicología
                    </span>
                </div>

                {/* Membership Badge (only for psychologists) */}
                {userRole === 'psychologist' && (
                    <div className="mb-4">
                        <MembershipBadge level={membershipLevel} onNavigate={onNavigate} />
                    </div>
                )}

                {/* Navigation Groups */}
                <nav className="flex flex-1 flex-col">
                    <div className="flex flex-1 flex-col gap-y-4">
                        {/* Main Groups */}
                        <div className="space-y-3">
                            {visibleGroups.map((group) => (
                                <NavGroupSection
                                    key={group.label}
                                    group={group}
                                    userRole={userRole}
                                    membershipLevel={membershipLevel}
                                    pathname={pathname}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </div>

                        {/* Admin Group */}
                        {showAdmin && (
                            <div className="pt-2 border-t border-sidebar-border">
                                <NavGroupSection
                                    group={adminGroup}
                                    userRole={userRole}
                                    membershipLevel={membershipLevel}
                                    pathname={pathname}
                                    onNavigate={onNavigate}
                                />
                            </div>
                        )}

                        {/* Bottom Navigation */}
                        <div className="mt-auto pt-2 border-t border-sidebar-border">
                            <ul className="space-y-0.5">
                                {filteredBottomNav.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={onNavigate}
                                                className={cn(
                                                    'group flex items-center gap-x-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                                                    isActive
                                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        'h-4 w-4 shrink-0',
                                                        isActive
                                                            ? 'text-sidebar-primary'
                                                            : 'text-sidebar-foreground/60 group-hover:text-sidebar-primary'
                                                    )}
                                                />
                                                <span className="truncate">{item.name}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                </nav>
            </div>
        </aside>
    )
}

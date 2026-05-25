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
    Sparkles,
    Newspaper,
    Handshake,
    GraduationCap,
    Users2,
    Mic2,
    DollarSign,
    Gift,
    TrendingUp,
    ShieldCheck,
    Library,
    Youtube,
    HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMembershipTier } from '@/lib/membership'
import type { UserRole, Vertical } from '@/types/database'
import { canSeeSidebarItem } from '@/lib/access/internal-modules'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { VerticalSwitcher } from './vertical-switcher'

interface NavItem {
    name: string
    href: string
    icon: React.ElementType
    roles: UserRole[]
}

interface NavGroup {
    label: string
    roles: UserRole[]
    items: NavItem[]
}

const navGroups: NavGroup[] = [
    {
        label: 'Principal',
        roles: ['admin', 'event_manager', 'psychologist', 'patient', 'ponente'],
        items: [
            { name: 'Inicio', href: '/dashboard', icon: Home, roles: ['admin', 'event_manager', 'psychologist', 'patient', 'ponente'] },
            { name: 'Mis cursos y eventos', href: '/dashboard/mi-acceso', icon: Library, roles: ['admin', 'psychologist', 'patient', 'ponente'] },
            { name: 'Calendario', href: '/dashboard/calendar', icon: Calendar, roles: ['admin', 'patient'] },
            { name: 'Mensajes', href: '/dashboard/messages', icon: MessageSquare, roles: ['admin', 'psychologist', 'patient'] },
            { name: 'Invita colegas', href: '/dashboard/growth', icon: Gift, roles: ['admin', 'psychologist', 'ponente'] },
        ],
    },
    {
        label: 'Comunidad',
        roles: ['admin', 'psychologist', 'patient', 'ponente'],
        items: [
            { name: 'Eventos', href: '/dashboard/events', icon: CalendarDays, roles: ['admin', 'psychologist', 'patient', 'ponente'] },
            { name: 'Grabaciones', href: '/dashboard/events/recordings', icon: Video, roles: ['admin', 'psychologist', 'ponente'] },
            { name: 'Ponentes', href: '/dashboard/speakers', icon: Mic2, roles: ['admin', 'psychologist', 'ponente'] },
            { name: 'Biblioteca', href: '/dashboard/resources', icon: BookOpen, roles: ['admin', 'psychologist', 'ponente'] },
            { name: 'Newsletter', href: '/dashboard/newsletter', icon: Newspaper, roles: ['admin', 'psychologist', 'ponente'] },
            { name: 'Convenios', href: '/dashboard/agreements', icon: Handshake, roles: ['admin', 'psychologist', 'ponente'] },
        ],
    },
    {
        label: 'Mi Proceso',
        roles: ['admin', 'patient'],
        items: [
            { name: 'Mi Psicologo', href: '/dashboard/my-psychologist', icon: UserCog, roles: ['admin', 'patient'] },
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
            { name: 'Calendario', href: '/dashboard/calendar', icon: Calendar, roles: ['admin', 'psychologist'] },
            { name: 'Mis Pacientes', href: '/dashboard/patients', icon: Users, roles: ['admin', 'psychologist'] },
            { name: 'Tareas', href: '/dashboard/tasks', icon: CheckSquare, roles: ['admin', 'psychologist'] },
            { name: 'Documentos', href: '/dashboard/documents', icon: FileText, roles: ['admin', 'psychologist'] },
            { name: 'Canalizacion', href: '/dashboard/referrals', icon: GitBranch, roles: ['admin', 'psychologist'] },
            { name: 'Estadisticas', href: '/dashboard/analytics', icon: BarChart3, roles: ['admin', 'psychologist'] },
        ],
    },
    {
        label: 'Crecimiento',
        roles: ['admin', 'psychologist'],
        items: [
            { name: 'Impulso profesional', href: '/dashboard/marketing', icon: Sparkles, roles: ['admin', 'psychologist'] },
        ],
    },
    {
        label: 'Gestion de Eventos',
        roles: ['admin', 'event_manager', 'ponente'],
        items: [
            { name: 'Mis Eventos', href: '/dashboard/events', icon: CalendarDays, roles: ['admin', 'event_manager', 'ponente'] },
            { name: 'Formaciones', href: '/dashboard/events/formations', icon: GraduationCap, roles: ['admin', 'event_manager', 'ponente'] },
            { name: 'Ganancias', href: '/dashboard/earnings', icon: DollarSign, roles: ['admin', 'ponente'] },
            { name: 'Crear Evento', href: '/dashboard/events/new', icon: CalendarPlus, roles: ['admin', 'event_manager', 'ponente'] },
            { name: 'Tutoriales', href: '/dashboard/tutoriales', icon: Youtube, roles: ['admin', 'ponente'] },
            { name: 'Mi Perfil Ponente', href: '/dashboard/settings', icon: Mic2, roles: ['admin', 'ponente'] },
        ],
    },
]

const adminGroup: NavGroup = {
    label: 'Administracion',
    roles: ['admin', 'support'],
    items: [
        { name: 'Panel Admin', href: '/dashboard/admin', icon: Shield, roles: ['admin'] },
        { name: 'Operaciones', href: '/dashboard/admin/operations', icon: ShieldCheck, roles: ['admin', 'support'] },
        { name: 'Usuarios', href: '/dashboard/admin/users', icon: UserCog, roles: ['admin'] },
        { name: 'Directorio', href: '/dashboard/admin/directory', icon: BookUser, roles: ['admin'] },
        { name: 'Ganancias Ponentes', href: '/dashboard/admin/earnings', icon: DollarSign, roles: ['admin'] },
        { name: 'Canalizacion', href: '/dashboard/admin/referrals', icon: GitBranch, roles: ['admin'] },
        { name: 'Newsletters', href: '/dashboard/admin/newsletters', icon: Newspaper, roles: ['admin'] },
        { name: 'Convenios', href: '/dashboard/admin/agreements', icon: Handshake, roles: ['admin'] },
        { name: 'Invita colegas', href: '/dashboard/admin/growth', icon: TrendingUp, roles: ['admin'] },
        { name: 'Marketing', href: '/dashboard/admin/marketing', icon: Sparkles, roles: ['admin'] },
        { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3, roles: ['admin'] },
    ],
}

const bottomNav: NavItem[] = [
    { name: 'Suscripcion', href: '/dashboard/subscription', icon: CreditCard, roles: ['admin', 'psychologist'] },
    { name: 'Configuracion', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'support', 'event_manager', 'psychologist', 'patient', 'ponente'] },
    { name: 'Ayuda', href: '/dashboard/help', icon: HelpCircle, roles: ['admin', 'support', 'event_manager', 'psychologist', 'patient', 'ponente'] },
]

const FORENSIC_GROUP_LABELS: Record<string, string> = {
    Comunidad: 'Ciencias Forenses',
    'Gestion de Eventos': 'Gestion Forense',
}

const FORENSIC_ITEM_LABELS: Record<string, string> = {
    '/dashboard/events': 'Eventos Forenses',
    '/dashboard/events/networking': 'Comunidad Pericial',
    '/dashboard/events/formations': 'Diplomados',
    '/dashboard/events/recordings': 'Grabaciones Forenses',
    '/dashboard/speakers': 'Ponentes Forenses',
    '/dashboard/resources': 'Biblioteca Forense',
    '/dashboard/newsletter': 'Boletin Forense',
    '/dashboard/agreements': 'Convenios Periciales',
    '/dashboard/mi-acceso': 'Mis cursos y eventos forenses',
    '/dashboard/growth': 'Invita colegas forenses',
    '/dashboard/earnings': 'Ganancias',
    '/dashboard/events/new': 'Crear Evento Forense',
    '/dashboard/tutoriales': 'Tutoriales Forenses',
}

function cloneNavItem(item: NavItem, name?: string): NavItem {
    return {
        ...item,
        name: name ?? item.name,
    }
}

function getItemByHref(href: string, items: NavItem[]) {
    return items.find((item) => item.href === href)
}

function groupFromHrefs(label: string, hrefs: string[], items: NavItem[], labels: Record<string, string> = {}): NavGroup | null {
    const groupItems = hrefs
        .map((href) => {
            const item = getItemByHref(href, items)
            return item ? cloneNavItem(item, labels[href]) : null
        })
        .filter((item): item is NavItem => Boolean(item))

    if (groupItems.length === 0) return null

    return {
        label,
        roles: ['admin', 'event_manager', 'psychologist', 'patient', 'ponente', 'support'],
        items: groupItems,
    }
}

function getSimplifiedGroups({
    userRole,
    membershipLevel,
    visibleItems,
}: {
    userRole: UserRole
    membershipLevel: number
    visibleItems: NavItem[]
}): NavGroup[] | null {
    const labels: Record<string, string> = {
        '/dashboard/calendar': userRole === 'patient' ? 'Citas' : 'Agenda',
        '/dashboard/documents': userRole === 'patient' ? 'Recursos' : 'Documentos',
        '/dashboard/events': userRole === 'ponente' ? 'Mis eventos' : 'Eventos y comunidad',
        '/dashboard/growth': 'Invita colegas',
        '/dashboard/mi-acceso': 'Mis cursos y eventos',
        '/dashboard/marketing': 'Impulso profesional',
        '/dashboard/resources': 'Biblioteca',
        '/dashboard/settings': userRole === 'ponente' ? 'Mi perfil' : 'Configuracion',
    }

    if (userRole === 'patient') {
        return [
            groupFromHrefs('Principal', [
                '/dashboard',
                '/dashboard/calendar',
                '/dashboard/tasks',
                '/dashboard/documents',
                '/dashboard/my-psychologist',
            ], visibleItems, labels),
            groupFromHrefs('Mas', [
                '/dashboard/booking',
                '/dashboard/tools',
                '/dashboard/events',
                '/dashboard/messages',
                '/dashboard/mi-acceso',
            ], visibleItems, labels),
        ].filter((group): group is NavGroup => Boolean(group))
    }

    if (userRole === 'psychologist') {
        if (membershipLevel >= 2) {
            return [
                groupFromHrefs('Principal', ['/dashboard'], visibleItems, labels),
                groupFromHrefs('Tu consultorio', [
                    '/dashboard/calendar',
                    '/dashboard/patients',
                    '/dashboard/tasks',
                    '/dashboard/documents',
                    '/dashboard/referrals',
                    '/dashboard/analytics',
                ], visibleItems, labels),
                groupFromHrefs('Comunidad profesional', [
                    '/dashboard/events',
                    '/dashboard/resources',
                    '/dashboard/events/recordings',
                    '/dashboard/speakers',
                ], visibleItems, labels),
                groupFromHrefs('Tu crecimiento', [
                    '/dashboard/mi-acceso',
                    '/dashboard/growth',
                    '/dashboard/marketing',
                    '/dashboard/subscription',
                ], visibleItems, labels),
                groupFromHrefs('Mas', [
                    '/dashboard/newsletter',
                    '/dashboard/agreements',
                    '/dashboard/messages',
                ], visibleItems, labels),
            ].filter((group): group is NavGroup => Boolean(group))
        }

        return [
            groupFromHrefs('Principal', [
                '/dashboard',
                '/dashboard/mi-acceso',
            ], visibleItems, labels),
            groupFromHrefs('Comunidad profesional', [
                '/dashboard/events',
                '/dashboard/resources',
                '/dashboard/events/recordings',
            ], visibleItems, labels),
            groupFromHrefs('Tu crecimiento', [
                '/dashboard/growth',
                '/dashboard/subscription',
            ], visibleItems, labels),
            groupFromHrefs('Mas', [
                '/dashboard/speakers',
                '/dashboard/newsletter',
                '/dashboard/agreements',
                '/dashboard/messages',
            ], visibleItems, labels),
        ].filter((group): group is NavGroup => Boolean(group))
    }

    if (userRole === 'ponente') {
        return [
            groupFromHrefs('Principal', [
                '/dashboard',
                '/dashboard/mi-acceso',
            ], visibleItems, labels),
            groupFromHrefs('Eventos', [
                '/dashboard/events',
                '/dashboard/events/new',
                '/dashboard/events/formations',
                '/dashboard/tutoriales',
            ], visibleItems, labels),
            groupFromHrefs('Crecimiento', [
                '/dashboard/earnings',
                '/dashboard/growth',
            ], visibleItems, labels),
            groupFromHrefs('Mas', [
                '/dashboard/events/recordings',
                '/dashboard/speakers',
                '/dashboard/resources',
                '/dashboard/newsletter',
                '/dashboard/agreements',
            ], visibleItems, labels),
        ].filter((group): group is NavGroup => Boolean(group))
    }

    return null
}

function NavGroupSection({
    group,
    userRole,
    membershipLevel,
    membershipSpecializationCode,
    activeVertical,
    pathname,
    onNavigate,
}: {
    group: NavGroup
    userRole: UserRole
    membershipLevel: number
    membershipSpecializationCode?: string | null
    activeVertical?: Vertical | null
    pathname: string
    onNavigate?: () => void
}) {
    const visibleItems = group.items.filter((item) => item.roles.includes(userRole) && canSeeSidebarItem(item.href, {
        role: userRole,
        membershipLevel,
        membershipSpecializationCode,
        activeVerticalCode: activeVertical?.code,
    }))
    const displayGroupLabel = activeVertical?.code === 'ciencias_forenses'
        ? FORENSIC_GROUP_LABELS[group.label] ?? group.label
        : group.label
    const hasActiveItem = visibleItems.some((item) => pathname === item.href)
    const [isOpen, setIsOpen] = useState(true)
    const groupId = displayGroupLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    useEffect(() => {
        if (hasActiveItem) {
            setIsOpen(true)
        }
    }, [hasActiveItem])

    if (visibleItems.length === 0) return null

    return (
        <div>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`nav-group-${groupId}`}
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground/70"
            >
                {displayGroupLabel}
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
                        const itemName = activeVertical?.code === 'ciencias_forenses'
                            ? FORENSIC_ITEM_LABELS[item.href] ?? item.name
                            : item.name

                        return (
                            <li key={item.name}>
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
                                                ? 'text-sidebar-primary-foreground'
                                                : 'text-sidebar-foreground/70 group-hover:text-sidebar-primary-foreground'
                                        )}
                                    />
                                    <span className="truncate">{itemName}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

function MembershipBadge({
    level,
    onNavigate,
}: {
    level: number
    onNavigate?: () => void
}) {
    const tier = getMembershipTier(level)

    const badgeStyles: Record<number, string> = {
        0: 'from-brand-surface to-brand-surface-soft border-white/20',
        1: 'from-brand-blue-soft to-brand-teal-soft border-brand-blue-border',
        2: 'from-brand-blue to-brand-blue-dark border-brand-blue',
        3: 'from-brand-text-strong to-brand-blue-hover border-brand-blue-hover',
    }

    const dotStyles: Record<number, string> = {
        0: 'bg-brand-text-muted',
        1: 'bg-brand-blue',
        2: 'bg-white',
        3: 'bg-brand-blue-soft',
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
                <span className={cn('truncate text-xs font-bold', level >= 2 ? 'text-white' : 'text-brand-text-strong')}>
                    {tier.label}
                </span>
            </div>
        </Link>
    )
}

interface SidebarProps {
    userRole?: UserRole | null
    membershipLevel?: number
    membershipSpecializationCode?: string | null
    activeVertical?: Vertical | null
    availableVerticals?: Vertical[]
    isMobile?: boolean
    onNavigate?: () => void
}

export function Sidebar({
    userRole,
    membershipLevel = 0,
    membershipSpecializationCode = null,
    activeVertical = null,
    availableVerticals = [],
    isMobile,
    onNavigate,
}: SidebarProps) {
    const pathname = usePathname()

    if (!userRole) return null

    const showAdmin = adminGroup.roles.includes(userRole)
    const baseGroups = navGroups.filter((group) => group.roles.includes(userRole))
    const candidateItems = [
        ...baseGroups.flatMap((group) => group.items),
        ...(showAdmin ? adminGroup.items : []),
        ...bottomNav,
    ]
    const visibleItems = candidateItems.filter((item) => (
        item.roles.includes(userRole) &&
        canSeeSidebarItem(item.href, {
            role: userRole,
            membershipLevel,
            membershipSpecializationCode,
            activeVerticalCode: activeVertical?.code,
        })
    )).filter((item, index, items) => items.findIndex((candidate) => candidate.href === item.href) === index)
    const simplifiedGroups = activeVertical?.code === 'ciencias_forenses'
        ? null
        : getSimplifiedGroups({ userRole, membershipLevel, visibleItems })
    const visibleGroups = simplifiedGroups ?? baseGroups
    const groupedHrefs = new Set(visibleGroups.flatMap((group) => group.items.map((item) => item.href)))
    const filteredBottomNav = bottomNav.filter((item) => (
        item.roles.includes(userRole) &&
        !groupedHrefs.has(item.href) &&
        canSeeSidebarItem(item.href, {
            role: userRole,
            membershipLevel,
            membershipSpecializationCode,
            activeVerticalCode: activeVertical?.code,
        })
    ))

    return (
        <aside className={cn(
            'overflow-hidden border-r border-sidebar-border bg-sidebar',
            isMobile
                ? 'flex h-full w-full flex-col border-0 bg-transparent'
                : 'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64'
        )}>
            <div className="flex h-full min-h-0 grow flex-col overflow-y-auto overscroll-contain bg-sidebar px-4 pb-4">
                <div className="flex h-14 shrink-0 items-center px-1">
                    <BrandWordmark className="text-sm tracking-[0.14em]" />
                </div>

                {isMobile && (
                    <div className="mb-4">
                        <VerticalSwitcher
                            activeVertical={activeVertical}
                            availableVerticals={availableVerticals}
                            compact
                        />
                    </div>
                )}

                {userRole === 'psychologist' && (
                    <div className="mb-4">
                        <MembershipBadge level={membershipLevel} onNavigate={onNavigate} />
                    </div>
                )}

                <nav className="flex flex-1 flex-col">
                    <div className="flex flex-1 flex-col gap-y-4">
                        <div className="space-y-3">
                            {visibleGroups.map((group) => (
                                <NavGroupSection
                                    key={group.label}
                                    group={group}
                                    userRole={userRole}
                                    membershipLevel={membershipLevel}
                                    membershipSpecializationCode={membershipSpecializationCode}
                                    activeVertical={activeVertical}
                                    pathname={pathname}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </div>

                        {showAdmin && (
                            <div className="border-t border-sidebar-border pt-2">
                                <NavGroupSection
                                    group={adminGroup}
                                    userRole={userRole}
                                    membershipLevel={membershipLevel}
                                    membershipSpecializationCode={membershipSpecializationCode}
                                    activeVertical={activeVertical}
                                    pathname={pathname}
                                    onNavigate={onNavigate}
                                />
                            </div>
                        )}

                        <div className="mt-auto border-t border-sidebar-border pt-2">
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
                                                            ? 'text-sidebar-primary-foreground'
                                                            : 'text-sidebar-foreground/70 group-hover:text-sidebar-primary-foreground'
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

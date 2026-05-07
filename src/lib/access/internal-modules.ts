import { canUserSeeLevel3Offer } from '@/lib/specializations'
import type { UserRole, VerticalCode } from '@/types/database'

export interface InternalModuleViewer {
    role?: UserRole | null
    membershipLevel?: number | null
    membershipSpecializationCode?: string | null
    activeVerticalCode?: VerticalCode | null
}

const CLINICAL_SUITE_HREFS = new Set([
    '/dashboard/calendar',
    '/dashboard/messages',
    '/dashboard/patients',
    '/dashboard/tasks',
    '/dashboard/documents',
    '/dashboard/referrals',
    '/dashboard/analytics',
])

const PSYCHOLOGY_ONLY_HREFS = new Set([
    '/dashboard/calendar',
    '/dashboard/messages',
    '/dashboard/booking',
    '/dashboard/my-psychologist',
    '/dashboard/patients',
    '/dashboard/tasks',
    '/dashboard/documents',
    '/dashboard/referrals',
    '/dashboard/analytics',
    '/dashboard/marketing',
    '/dashboard/tools',
    '/dashboard/events/clinical',
    '/dashboard/events/business',
])

export function isPsychologyOnlyDashboardPath(pathname: string) {
    return Array.from(PSYCHOLOGY_ONLY_HREFS).some((href) => pathname === href || pathname.startsWith(`${href}/`))
}

function getEffectiveMembershipLevel(viewer: InternalModuleViewer) {
    return Number(viewer.membershipLevel ?? 0)
}

export function canAccessGrowthHub(viewer: InternalModuleViewer) {
    if (viewer.role === 'admin' || viewer.role === 'ponente') return true
    return viewer.role === 'psychologist' && getEffectiveMembershipLevel(viewer) >= 1
}

export function canAccessClinicalWorkspace(viewer: InternalModuleViewer) {
    if (viewer.role === 'admin') return true
    return viewer.role === 'psychologist' && getEffectiveMembershipLevel(viewer) >= 2
}

export function canAccessCalendarModule(viewer: InternalModuleViewer) {
    if (viewer.role === 'patient') return true
    return canAccessClinicalWorkspace(viewer)
}

export function canAccessDocumentsModule(viewer: InternalModuleViewer) {
    if (viewer.role === 'patient') return true
    return viewer.role === 'psychologist' && canAccessClinicalWorkspace(viewer)
}

export function canAccessPatientsModule(viewer: InternalModuleViewer) {
    return viewer.role === 'psychologist' && canAccessClinicalWorkspace(viewer)
}

export function canAccessTasksModule(viewer: InternalModuleViewer) {
    if (viewer.role === 'patient') return true
    return viewer.role === 'psychologist' && canAccessClinicalWorkspace(viewer)
}

export function canUseClinicalAi(viewer: InternalModuleViewer) {
    return viewer.role === 'psychologist' && getEffectiveMembershipLevel(viewer) >= 2
}

export function canAccessMarketingHub(viewer: InternalModuleViewer) {
    if (viewer.role === 'admin') return true

    if (viewer.role !== 'psychologist') return false

    const membershipLevel = getEffectiveMembershipLevel(viewer)
    if (membershipLevel < 3) return false

    return canUserSeeLevel3Offer({
        membershipLevel,
        specializationCode: viewer.membershipSpecializationCode ?? null,
        isAdmin: false,
    })
}

export function canSeeSidebarItem(href: string, viewer: InternalModuleViewer) {
    if (viewer.activeVerticalCode === 'ciencias_forenses' && PSYCHOLOGY_ONLY_HREFS.has(href)) {
        return viewer.role === 'admin'
    }

    if (href === '/dashboard/growth') {
        return canAccessGrowthHub(viewer)
    }

    if (href === '/dashboard/calendar') {
        return canAccessCalendarModule(viewer)
    }

    if (href === '/dashboard/documents') {
        return canAccessDocumentsModule(viewer)
    }

    if (href === '/dashboard/patients') {
        return canAccessPatientsModule(viewer)
    }

    if (href === '/dashboard/tasks') {
        return canAccessTasksModule(viewer)
    }

    if (href === '/dashboard/marketing') {
        return canAccessMarketingHub(viewer)
    }

    if (CLINICAL_SUITE_HREFS.has(href) && viewer.role === 'psychologist') {
        return canAccessClinicalWorkspace(viewer)
    }

    return true
}

export function getPsychologistDashboardLevel(viewer: InternalModuleViewer) {
    const membershipLevel = getEffectiveMembershipLevel(viewer)

    if (membershipLevel >= 3) return 3
    if (membershipLevel >= 2) return 2

    // There is not yet a dedicated level-0 psychologist dashboard,
    // so free and inactive users reuse the community dashboard shell.
    return 1
}

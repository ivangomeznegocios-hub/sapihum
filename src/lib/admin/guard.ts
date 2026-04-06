import { requireActionRoles, requirePageRoles } from '@/lib/access/role-guard'

const ADMIN_ROLES = ['admin'] as const
const OPERATIONS_ROLES = ['admin', 'support'] as const

export async function requireAdminPage() {
    return requirePageRoles(ADMIN_ROLES)
}

export async function requireAdminAction() {
    return requireActionRoles(ADMIN_ROLES, 'No tienes permisos de administrador')
}

export async function requireOperationsPage() {
    return requirePageRoles(OPERATIONS_ROLES)
}

export async function requireOperationsAction() {
    return requireActionRoles(OPERATIONS_ROLES, 'No tienes permisos para operar accesos')
}

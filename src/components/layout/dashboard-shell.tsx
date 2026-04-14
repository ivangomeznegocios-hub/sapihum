import { Sidebar } from './sidebar'
import { Header } from './header'
import type { UserRole } from '@/types/database'

interface DashboardShellProps {
    children: React.ReactNode
    user?: {
        id?: string
        email?: string
        user_metadata?: {
            full_name?: string
            avatar_url?: string
        }
    } | null
    userRole?: UserRole | null
    membershipLevel?: number
    membershipSpecializationCode?: string | null
}

export function DashboardShell({
    children,
    user,
    userRole,
    membershipLevel = 0,
    membershipSpecializationCode = null,
}: DashboardShellProps) {
    return (
        <div className="min-h-[100dvh] overflow-x-hidden bg-background">
            {/* Sidebar */}
            <Sidebar
                userRole={userRole}
                membershipLevel={membershipLevel}
                membershipSpecializationCode={membershipSpecializationCode}
            />

            {/* Main content area */}
            <div className="min-w-0 lg:pl-64">
                {/* Header */}
                <Header
                    user={user}
                    userRole={userRole}
                    membershipLevel={membershipLevel}
                    membershipSpecializationCode={membershipSpecializationCode}
                />

                {/* Page content */}
                <main className="min-w-0 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

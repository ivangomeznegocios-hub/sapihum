import { getViewerContext } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { SessionTimeout } from '@/components/auth/session-timeout'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const {
        user,
        role,
        membershipLevel,
        membershipSpecializationCode,
    } = await getViewerContext({
        includeCommercialAccess: true,
    })

    return (
        <DashboardShell
            user={user}
            userRole={role}
            membershipLevel={membershipLevel}
            membershipSpecializationCode={membershipSpecializationCode}
        >
            <SessionTimeout />
            {children}
        </DashboardShell>
    )
}

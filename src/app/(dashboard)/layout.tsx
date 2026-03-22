import { createClient, getUserRole, getUserProfile } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { SessionTimeout } from '@/components/auth/session-timeout'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userRole = await getUserRole()
    const profile = await getUserProfile()
    const membershipLevel = profile?.membership_level ?? 0
    const membershipSpecializationCode = (profile as any)?.membership_specialization_code ?? null

    return (
        <DashboardShell
            user={user}
            userRole={userRole}
            membershipLevel={membershipLevel}
            membershipSpecializationCode={membershipSpecializationCode}
        >
            <SessionTimeout />
            {children}
        </DashboardShell>
    )
}

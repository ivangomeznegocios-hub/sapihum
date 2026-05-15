import { getViewerContext } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { SessionTimeout } from '@/components/auth/session-timeout'
import { ThemeProvider } from '@/components/theme-provider'

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
        activeVertical,
        availableVerticals,
    } = await getViewerContext({
        includeCommercialAccess: true,
    })

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            <DashboardShell
                user={user}
                userRole={role}
                membershipLevel={membershipLevel}
                membershipSpecializationCode={membershipSpecializationCode}
                activeVertical={activeVertical}
                availableVerticals={availableVerticals}
            >
                <SessionTimeout />
                {children}
            </DashboardShell>
        </ThemeProvider>
    )
}

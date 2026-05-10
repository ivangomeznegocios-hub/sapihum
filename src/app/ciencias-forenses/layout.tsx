import { ForensicNavbar } from '@/components/ciencias-forenses/forensic-navbar'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export default function CienciasForensesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <ForensicNavbar />
            <main className="flex-1 flex flex-col">
                {children}
            </main>
            <MarketingFooter />
        </div>
    )
}

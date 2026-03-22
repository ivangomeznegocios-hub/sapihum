import { getUserProfile } from '@/lib/supabase/server'
import { MarketingNavbar } from '@/components/marketing/marketing-navbar'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavbar isLoggedIn={!!profile} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <MarketingFooter />
    </div>
  )
}

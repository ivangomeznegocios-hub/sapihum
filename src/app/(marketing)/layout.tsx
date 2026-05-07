import { MarketingNavbar } from '@/components/marketing/marketing-navbar'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { Suspense } from 'react'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Suspense fallback={null}>
        <MarketingNavbar />
      </Suspense>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <MarketingFooter />
    </div>
  )
}

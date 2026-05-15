'use client'

import dynamic from 'next/dynamic'
import type { MarketingNavItem } from '@/components/marketing/mobile-marketing-menu'

const LazyMobileMarketingMenu = dynamic(
    () => import('@/components/marketing/mobile-marketing-menu').then((module) => module.MobileMarketingMenu),
    {
        ssr: false,
        loading: () => (
            <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-transparent text-foreground xl:hidden"
                aria-label="Abrir menu"
                aria-disabled="true"
            >
                <span className="block h-4 w-4 border-y-2 border-current" />
            </button>
        ),
    }
)

export function MobileMarketingMenuEntry({ navItems }: { navItems: MarketingNavItem[] }) {
    return <LazyMobileMarketingMenu navItems={navItems} />
}

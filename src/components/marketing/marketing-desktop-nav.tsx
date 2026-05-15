import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarketingNavItem } from '@/components/marketing/mobile-marketing-menu'

interface MarketingDesktopNavProps {
    navItems: MarketingNavItem[]
}

export function MarketingDesktopNav({ navItems }: MarketingDesktopNavProps) {
    return (
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Navegacion principal">
            {navItems.map((item) => {
                if (!item.children) {
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            data-analytics-cta
                            data-analytics-label={item.label}
                            data-analytics-surface="marketing_nav"
                            data-analytics-funnel="landing"
                            className="rounded-sm px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-brand-blue-soft hover:text-brand-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                        >
                            {item.label}
                        </Link>
                    )
                }

                const isWideMenu = item.children.length > 4

                return (
                    <div key={item.label} className="group/nav relative">
                        <button
                            type="button"
                            className="flex items-center gap-1 rounded-sm px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-brand-blue-soft hover:text-brand-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                            aria-haspopup="menu"
                        >
                            {item.label}
                            <ChevronDown
                                className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover/nav:rotate-180 group-focus-within/nav:rotate-180"
                                aria-hidden="true"
                            />
                        </button>

                        <div
                            className={cn(
                                'invisible pointer-events-none absolute left-0 top-full z-[90] -translate-y-1 pt-2 opacity-0 transition duration-150 group-hover/nav:visible group-hover/nav:pointer-events-auto group-hover/nav:translate-y-0 group-hover/nav:opacity-100 group-focus-within/nav:visible group-focus-within/nav:pointer-events-auto group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100',
                                isWideMenu ? 'w-[min(38rem,calc(100vw-2rem))]' : 'w-72'
                            )}
                            role="menu"
                        >
                            <div
                                className={cn(
                                    'rounded-md border border-brand-border bg-brand-surface p-2 shadow-[0_24px_70px_rgba(15,23,42,0.14)] ring-1 ring-brand-blue-border/80',
                                    isWideMenu ? 'grid grid-cols-2 gap-1' : 'flex flex-col'
                                )}
                            >
                                {item.children.map((child) => (
                                    <Link
                                        key={child.href + child.label}
                                        href={child.href}
                                        role="menuitem"
                                        data-analytics-cta
                                        data-analytics-label={child.label}
                                        data-analytics-surface="marketing_nav_dropdown"
                                        data-analytics-funnel="landing"
                                        className={cn(
                                            'group/drop flex flex-col gap-1 rounded-sm px-3 py-3 transition-colors hover:bg-brand-blue-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80',
                                            isWideMenu && 'min-h-[5rem]'
                                        )}
                                    >
                                        <span className="text-sm font-semibold text-brand-text-strong group-hover/drop:text-brand-blue-hover">{child.label}</span>
                                        {child.description && (
                                            <span className="text-xs leading-snug text-brand-text-muted group-hover/drop:text-brand-text">
                                                {child.description}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            })}
        </nav>
    )
}

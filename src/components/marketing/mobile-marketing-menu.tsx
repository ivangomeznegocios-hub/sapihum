'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type NavChild = {
    label: string
    href: string
    description?: string
}

type NavItem =
    | {
        label: string
        href: string
        children?: never
    }
    | {
        label: string
        children: NavChild[]
        href?: never
    }

interface MobileMarketingMenuProps {
    navItems: NavItem[]
}

export function MobileMarketingMenu({ navItems }: MobileMarketingMenuProps) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setMobileOpen((open) => !open)}
                className="flex flex-col gap-1.5 rounded-md p-2 transition-colors hover:bg-accent lg:hidden"
                aria-label="Abrir menú"
                aria-expanded={mobileOpen}
            >
                <span className={`block h-0.5 w-5 bg-foreground transition-all duration-300 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
                <span className={`block h-0.5 w-5 bg-foreground transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 w-5 bg-foreground transition-all duration-300 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </button>

            <div className={`absolute left-0 top-16 w-full overflow-hidden border-b bg-background transition-all duration-300 ease-in-out lg:hidden ${mobileOpen ? 'max-h-[calc(100dvh-4rem)] border-t' : 'max-h-0 border-t-0'}`}>
                <nav className="mx-auto max-w-7xl space-y-1 overflow-y-auto px-4 py-4 pb-6">
                    {navItems.map((item) =>
                        item.children ? (
                            <div key={item.label} className="space-y-1">
                                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {item.label}
                                </p>
                                {item.children.map((child) => (
                                    <Link
                                        key={child.href + child.label}
                                        href={child.href}
                                        onClick={() => setMobileOpen(false)}
                                        data-analytics-cta
                                        data-analytics-label={child.label}
                                        data-analytics-surface="marketing_nav_mobile"
                                        data-analytics-funnel="landing"
                                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                                    >
                                        {child.label}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                data-analytics-cta
                                data-analytics-label={item.label}
                                data-analytics-surface="marketing_nav_mobile"
                                data-analytics-funnel="landing"
                                className="block rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                            >
                                {item.label}
                            </Link>
                        )
                    )}

                    <div className="mt-3 border-t pt-3">
                        <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                            <Button variant="outline" className="mb-2 w-full font-semibold" data-analytics-cta data-analytics-label="Iniciar Sesión" data-analytics-surface="marketing_nav_mobile" data-analytics-funnel="registration">
                                Iniciar Sesión
                            </Button>
                        </Link>
                        <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                            <Button className="w-full font-semibold" data-analytics-cta data-analytics-label="Comenzar" data-analytics-surface="marketing_nav_mobile" data-analytics-funnel="registration">
                                Comenzar
                            </Button>
                        </Link>
                    </div>
                </nav>
            </div>
        </>
    )
}

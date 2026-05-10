'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export type MarketingNavChild = {
    label: string
    href: string
    description?: string
}

export type MarketingNavItem =
    | {
        label: string
        href: string
        children?: never
    }
    | {
        label: string
        children: MarketingNavChild[]
        href?: never
    }

interface MobileMarketingMenuProps {
    navItems: MarketingNavItem[]
}

const MOBILE_NAV_ORDER = ['Academia', 'Planes', 'Recursos', 'Investigación', 'Psicología Clínica']
const getMobileNavOrder = (label: string) => {
    const index = MOBILE_NAV_ORDER.indexOf(label)

    return index === -1 ? MOBILE_NAV_ORDER.length : index
}

export function MobileMarketingMenu({ navItems }: MobileMarketingMenuProps) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const mobileNavItems = [...navItems].sort(
        (first, second) => getMobileNavOrder(first.label) - getMobileNavOrder(second.label)
    )

    useEffect(() => {
        if (!mobileOpen) return

        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMobileOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = originalOverflow
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [mobileOpen])

    return (
        <>
            <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-transparent text-foreground transition-colors hover:border-brand-blue-border hover:bg-brand-blue-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 lg:hidden"
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-controls="marketing-mobile-menu"
                aria-expanded={mobileOpen}
            >
                {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>

            {mobileOpen && (
                <div className="fixed inset-x-0 top-16 z-[90] lg:hidden">
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        className="fixed inset-x-0 bottom-0 top-16 bg-slate-950/35 backdrop-blur-[2px]"
                        onClick={() => setMobileOpen(false)}
                    />

                    <div
                        id="marketing-mobile-menu"
                        className="relative max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-t border-brand-border bg-background shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
                    >
                        <nav className="mx-auto max-w-7xl space-y-5 px-4 py-4 pb-6 sm:px-6">
                            {mobileNavItems.map((item) =>
                                item.children ? (
                                    <div key={item.label} className="space-y-2">
                                        <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {item.label}
                                        </p>
                                        <div className="grid gap-1.5 rounded-md border border-brand-border bg-card/60 p-2">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.href + child.label}
                                                    href={child.href}
                                                    onClick={() => setMobileOpen(false)}
                                                    data-analytics-cta
                                                    data-analytics-label={child.label}
                                                    data-analytics-surface="marketing_nav_mobile"
                                                    data-analytics-funnel="landing"
                                                    className="flex min-h-11 items-center rounded-sm px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-brand-blue-soft hover:text-brand-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
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
                                        className="flex min-h-11 items-center rounded-sm border border-brand-border bg-card/60 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-brand-blue-soft hover:text-brand-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                                    >
                                        {item.label}
                                    </Link>
                                )
                            )}

                            <div className="grid gap-2 border-t border-brand-border pt-4 sm:grid-cols-2">
                                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                                    <Button variant="outline" className="w-full font-semibold" data-analytics-cta data-analytics-label="Iniciar Sesión" data-analytics-surface="marketing_nav_mobile" data-analytics-funnel="registration">
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
                </div>
            )}
        </>
    )
}

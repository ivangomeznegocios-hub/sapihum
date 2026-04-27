import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { getMarketingSpecializations } from '@/lib/specializations'
import { MobileMarketingMenu } from '@/components/marketing/mobile-marketing-menu'

const SPECIALIZATION_ITEMS = getMarketingSpecializations().map((spec) => ({
    label: spec.name,
    href: `/especialidades/${spec.slug}`,
    description: spec.tagline,
}))

const NAV_ITEMS = [
    {
        label: 'Especialidades',
        children: SPECIALIZATION_ITEMS,
    },
    {
        label: 'Academia',
        children: [
            { label: 'Eventos', href: '/academia', description: 'Talleres, formaciones y sesiones en vivo' },
            { label: 'Formaciones', href: '/formaciones', description: 'Programas completos con ruta, horas y compra directa' },
            { label: 'Nuestros Ponentes', href: '/speakers', description: 'Directorio público de expertos y facilitadores' },
        ],
    },
    {
        label: 'Recursos',
        children: [
            { label: 'Blog', href: '/blog', description: 'Artículos sobre psicología profesional' },
            { label: 'Herramientas y Recursos', href: '/recursos', description: 'Guías y materiales disponibles con tu membresía' },
        ],
    },
    { label: 'Investigación', href: '/investigacion' },
    { label: 'Planes', href: '/precios' },
]

export function MarketingNavbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex shrink-0 items-center" aria-label="SAPIHUM">
                    <BrandWordmark className="text-sm sm:text-base lg:text-lg lg:tracking-[0.16em]" />
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                    {NAV_ITEMS.map((item) =>
                        item.children ? (
                            <div key={item.label} className="group relative">
                                <button className="flex items-center gap-1 rounded-sm px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                                    {item.label}
                                    <svg className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`invisible absolute left-0 top-full pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 ${item.label === 'Especialidades' ? 'w-[38rem]' : 'w-72'}`}>
                                    <div className={`${item.label === 'Especialidades' ? 'grid grid-cols-2 gap-1' : 'flex flex-col'} rounded-sm border bg-popover p-2 shadow-xl shadow-black/5 ring-1 ring-black/5`}>
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.href + child.label}
                                                href={child.href}
                                                data-analytics-cta
                                                data-analytics-label={child.label}
                                                data-analytics-surface="marketing_nav_dropdown"
                                                data-analytics-funnel="landing"
                                                className={`flex flex-col gap-1 rounded-sm px-3 py-3 transition-colors hover:bg-accent ${item.label === 'Especialidades' ? 'min-h-[5rem]' : ''}`}
                                            >
                                                <span className="text-sm font-semibold text-foreground">{child.label}</span>
                                                <span className="text-xs leading-snug text-muted-foreground">{child.description}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link
                                key={item.label}
                                href={item.href}
                                data-analytics-cta
                                data-analytics-label={item.label}
                                data-analytics-surface="marketing_nav"
                                data-analytics-funnel="landing"
                                className="rounded-sm px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {item.label}
                            </Link>
                        )
                    )}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Link href="/auth/login" className="hidden sm:inline-flex">
                        <Button variant="outline" size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Iniciar Sesión" data-analytics-surface="marketing_nav" data-analytics-funnel="registration">
                            Iniciar Sesión
                        </Button>
                    </Link>
                    <Link href="/auth/register" className="hidden sm:inline-flex">
                        <Button size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Comenzar" data-analytics-surface="marketing_nav" data-analytics-funnel="registration">
                            Comenzar
                        </Button>
                    </Link>
                    <Link href="/auth/register" className="sm:hidden">
                        <Button size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Unirme" data-analytics-surface="marketing_nav" data-analytics-funnel="registration">
                            Unirme
                        </Button>
                    </Link>

                    <MobileMarketingMenu navItems={NAV_ITEMS} />
                </div>
            </div>
        </header>
    )
}

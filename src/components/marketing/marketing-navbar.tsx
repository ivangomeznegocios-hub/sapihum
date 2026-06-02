import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { getMarketingSpecializations } from '@/lib/specializations'
import { MarketingDesktopNav } from '@/components/marketing/marketing-desktop-nav'
import { MobileMarketingMenuEntry } from '@/components/marketing/mobile-marketing-menu-entry'

const SPECIALIZATION_ITEMS = getMarketingSpecializations().map((spec) => ({
    label: spec.name,
    href: `/especialidades/${spec.slug}`,
    description: spec.tagline,
}))

const NAV_ITEMS = [
    {
        label: 'Psicología Clínica',
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
        <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-surface/95 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-brand-surface/90">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/psicologia" className="flex shrink-0 items-center" aria-label="SAPIHUM Psicologia">
                    <BrandWordmark className="text-sm sm:text-base lg:text-lg lg:tracking-[0.16em]" />
                </Link>

                <MarketingDesktopNav navItems={NAV_ITEMS} />

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
                    <Link href="/auth/register" className="hidden min-[380px]:inline-flex sm:hidden">
                        <Button size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Unirme" data-analytics-surface="marketing_nav" data-analytics-funnel="registration">
                            Unirme
                        </Button>
                    </Link>

                    <MobileMarketingMenuEntry navItems={NAV_ITEMS} />
                </div>
            </div>
        </header>
    )
}

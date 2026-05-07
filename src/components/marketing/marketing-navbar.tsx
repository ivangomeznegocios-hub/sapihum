'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { getMarketingSpecializations } from '@/lib/specializations'
import { MobileMarketingMenu } from '@/components/marketing/mobile-marketing-menu'

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

const SPECIALIZATION_ITEMS = getMarketingSpecializations().map((spec) => ({
    label: spec.name,
    href: `/especialidades/${spec.slug}`,
    description: spec.tagline,
}))

const PSYCHOLOGY_NAV_ITEMS: NavItem[] = [
    {
        label: 'Especialidades',
        children: SPECIALIZATION_ITEMS,
    },
    {
        label: 'Academia',
        children: [
            { label: 'Eventos', href: '/academia', description: 'Talleres, formaciones y sesiones en vivo' },
            { label: 'Formaciones', href: '/formaciones', description: 'Programas completos con ruta, horas y compra directa' },
            { label: 'Nuestros Ponentes', href: '/speakers', description: 'Directorio publico de expertos y facilitadores' },
        ],
    },
    {
        label: 'Recursos',
        children: [
            { label: 'Blog', href: '/blog', description: 'Articulos sobre psicologia profesional' },
            { label: 'Herramientas y Recursos', href: '/recursos', description: 'Guias y materiales disponibles con tu membresia' },
        ],
    },
    { label: 'Investigacion', href: '/investigacion' },
    { label: 'Planes', href: '/precios' },
]

const FORENSIC_NAV_ITEMS: NavItem[] = [
    {
        label: 'Academia Forense',
        children: [
            { label: 'Eventos Forenses', href: '/eventos?vertical=ciencias_forenses', description: 'Conferencias, sesiones y encuentros de ciencias forenses' },
            { label: 'Diplomados', href: '/formaciones?vertical=ciencias_forenses', description: 'Programas formativos, diplomados y rutas periciales' },
            { label: 'Agenda Forense', href: '/academia?vertical=ciencias_forenses', description: 'Catalogo completo filtrado para Ciencias Forenses' },
        ],
    },
    {
        label: 'Tracks',
        children: [
            { label: 'Criminalistica', href: '/ciencias-forenses#tracks', description: 'Indicios, escena, tecnica y analisis pericial' },
            { label: 'Criminologia', href: '/ciencias-forenses#tracks', description: 'Conducta delictiva, prevencion e investigacion social' },
            { label: 'Psicologia Forense', href: '/ciencias-forenses#tracks', description: 'Evaluacion, dictamen y entrevista forense' },
            { label: 'Perfilacion Criminal', href: '/ciencias-forenses#tracks', description: 'Analisis conductual aplicado a investigacion' },
        ],
    },
    {
        label: 'Recursos Forenses',
        children: [
            { label: 'Biblioteca tecnica', href: '/ciencias-forenses#modulos', description: 'Materiales, rutas y recursos de actualizacion forense' },
            { label: 'Comunidad pericial', href: '/ciencias-forenses#comunidad', description: 'Ponentes, colegas y espacios de formacion profesional' },
        ],
    },
    { label: 'Planes Forenses', href: '/ciencias-forenses#planes' },
]

function getNavItems(pathname: string, verticalParam: string | null) {
    if (pathname === '/') {
        return []
    }

    if (pathname.startsWith('/ciencias-forenses') || verticalParam === 'ciencias_forenses') {
        return FORENSIC_NAV_ITEMS
    }

    return PSYCHOLOGY_NAV_ITEMS
}

export function MarketingNavbar() {
    const pathname = usePathname()
    const [verticalParam, setVerticalParam] = useState<string | null>(null)

    useEffect(() => {
        setVerticalParam(new URLSearchParams(window.location.search).get('vertical'))
    }, [pathname])

    const navItems = getNavItems(pathname, verticalParam)
    const isForensic = pathname.startsWith('/ciencias-forenses') || verticalParam === 'ciencias_forenses'
    const registerHref = isForensic ? '/auth/register?vertical=ciencias_forenses' : '/auth/register'

    return (
        <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-surface/95 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-brand-surface/90">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex shrink-0 items-center" aria-label="SAPIHUM">
                    <BrandWordmark className="text-sm sm:text-base lg:text-lg lg:tracking-[0.16em]" />
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                    {navItems.map((item) =>
                        item.children ? (
                            <div key={item.label} className="group relative">
                                <button className="flex items-center gap-1 rounded-sm px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-brand-blue-soft hover:text-brand-blue-hover">
                                    {item.label}
                                    <svg className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`invisible absolute left-0 top-full z-[80] pt-2 opacity-0 transition-opacity duration-100 group-hover:visible group-hover:opacity-100 ${item.label === 'Especialidades' ? 'w-[38rem]' : 'w-72'}`}>
                                    <div className={`${item.label === 'Especialidades' ? 'grid grid-cols-2 gap-1' : 'flex flex-col'} rounded-md border border-brand-border bg-brand-surface p-2 shadow-[0_24px_70px_rgba(15,23,42,0.14)] ring-1 ring-brand-blue-border/80`}>
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.href + child.label}
                                                href={child.href}
                                                data-analytics-cta
                                                data-analytics-label={child.label}
                                                data-analytics-surface="marketing_nav_dropdown"
                                                data-analytics-funnel="landing"
                                                className={`group/drop flex flex-col gap-1 rounded-sm px-3 py-3 transition-colors hover:bg-brand-blue-soft ${item.label === 'Especialidades' ? 'min-h-[5rem]' : ''}`}
                                            >
                                                <span className="text-sm font-semibold text-brand-text-strong group-hover/drop:text-brand-blue-hover">{child.label}</span>
                                                {child.description && (
                                                    <span className="text-xs leading-snug text-brand-text-muted group-hover/drop:text-brand-text">{child.description}</span>
                                                )}
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
                                className="rounded-sm px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-brand-blue-soft hover:text-brand-blue-hover"
                            >
                                {item.label}
                            </Link>
                        )
                    )}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Link href="/auth/login" className="hidden sm:inline-flex">
                        <Button variant="outline" size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Iniciar Sesion" data-analytics-surface="marketing_nav" data-analytics-funnel="registration">
                            Iniciar Sesion
                        </Button>
                    </Link>
                    <Link href={registerHref} className="hidden sm:inline-flex">
                        <Button size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Comenzar" data-analytics-surface="marketing_nav" data-analytics-funnel="registration">
                            Comenzar
                        </Button>
                    </Link>
                    <Link href={registerHref} className="sm:hidden">
                        <Button size="sm" className="font-semibold" data-analytics-cta data-analytics-label="Unirme" data-analytics-surface="marketing_nav" data-analytics-funnel="registration">
                            Unirme
                        </Button>
                    </Link>

                    {navItems.length > 0 && <MobileMarketingMenu navItems={navItems} />}
                </div>
            </div>
        </header>
    )
}

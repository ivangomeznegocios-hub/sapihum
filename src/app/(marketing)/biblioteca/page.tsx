import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, FileText, Bot, Bookmark, GraduationCap } from 'lucide-react'
import { ORGANIC_CONTENT } from '@/lib/organic-leads/content'
import { buildOrganicPath, getOrganicAbsoluteUrl, type OrganicRouteKind } from '@/lib/organic-leads/routing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { serializeJsonLd, buildOrganizationJsonLd, buildBreadcrumbListJsonLd } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
    title: 'Biblioteca de Psicología Clínica y Práctica Privada | SAPIHUM',
    description: 'El centro unificado de conocimiento de SAPIHUM. Accede de forma gratuita y organizada a guías de consulta, formatos clínicos descargables, biografía de autores, análisis de enfoques y herramientas digitales.',
    alternates: {
        canonical: '/biblioteca',
    },
}

const CATEGORY_MAP = [
    {
        type: 'guide',
        label: 'Guías Prácticas',
        description: 'Gestión de la consulta privada, cobros, marketing ético y organización diaria.',
        icon: <BookOpen className="h-5 w-5 text-brand-blue" />,
        href: '/guias',
        routeKind: 'guides' as OrganicRouteKind,
    },
    {
        type: 'resource_format',
        label: 'Formatos Clínicos',
        description: 'Consentimiento informado, notas SOAP de evolución, historia clínica y checklists.',
        icon: <FileText className="h-5 w-5 text-brand-blue" />,
        href: '/recursos',
        routeKind: 'resourceFormats' as OrganicRouteKind,
    },
    {
        type: 'approach',
        label: 'Enfoques Psicoterapéuticos',
        description: 'Principios y sustento de TCC, ACT, DBT, terapia sistémica y humanismo.',
        icon: <GraduationCap className="h-5 w-5 text-brand-blue" />,
        href: '/enfoques',
        routeKind: 'approaches' as OrganicRouteKind,
    },
    {
        type: 'author',
        label: 'Autores y Teóricos',
        description: 'Trayectoria académica, conceptos y legado de Beck, Ellis, Rogers, Linehan y Hayes.',
        icon: <Bookmark className="h-5 w-5 text-brand-blue" />,
        href: '/autores',
        routeKind: 'authors' as OrganicRouteKind,
    },
    {
        type: 'book',
        label: 'Rutas de Lectura',
        description: 'Manuales indispensables de psicología, guías de tratamientos y recién egresados.',
        icon: <Bookmark className="h-5 w-5 text-brand-blue" />,
        href: '/libros',
        routeKind: 'books' as OrganicRouteKind,
    },
    {
        type: 'tool',
        label: 'Herramientas y Tecnología',
        description: 'Telepsicología, seguridad de datos de salud e Inteligencia Artificial en consulta.',
        icon: <Bot className="h-5 w-5 text-brand-blue" />,
        href: '/herramientas',
        routeKind: 'tools' as OrganicRouteKind,
    },
]

export default function BibliotecaHubPage() {
    const pageUrl = getOrganicAbsoluteUrl('/biblioteca')
    const breadcrumbs = [
        { name: 'SAPIHUM', url: getOrganicAbsoluteUrl('/') },
        { name: 'Biblioteca', url: pageUrl },
    ]

    const listElements = ORGANIC_CONTENT.map((item, index) => {
        const cat = CATEGORY_MAP.find(c => c.type === item.contentType)
        const kind = cat ? cat.routeKind : 'guides' as OrganicRouteKind
        return {
            '@type': 'ListItem',
            position: index + 1,
            name: item.title,
            url: getOrganicAbsoluteUrl(buildOrganicPath(kind, item.slug)),
        }
    })

    const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Biblioteca de Psicología Clínica y Práctica Privada | SAPIHUM',
        description: 'El centro unificado de conocimiento de SAPIHUM. Accede de forma organizada a todos nuestros recursos.',
        url: pageUrl,
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: listElements,
        },
    }

    const jsonLdSerialized = serializeJsonLd([
        buildOrganizationJsonLd(),
        buildBreadcrumbListJsonLd(breadcrumbs),
        collectionSchema,
    ])

    return (
        <div className="w-full bg-background min-h-screen">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSerialized }} />

            {/* ── HERO ────────────────────────────────────────────────── */}
            <section className="relative w-full overflow-hidden bg-gradient-to-b from-background via-brand-blue-soft/30 to-background border-b border-brand-border py-20 lg:py-28">
                <div className="sapihum-grid-bg absolute inset-0 opacity-10 pointer-events-none" />
                <div className="pointer-events-none absolute left-1/2 top-0 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-brand-blue/5 blur-[130px]" />

                <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                    <Badge variant="outline" className="gap-2 border-brand-blue/30 bg-brand-blue/10 text-brand-blue px-3.5 py-1 text-xs font-bold uppercase tracking-[0.18em] mb-8">
                        Centro de Conocimiento Unificado
                    </Badge>

                    <h1 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                        Biblioteca Profesional{' '}
                        <span className="font-serif italic font-normal text-brand-text-muted block mt-1">
                            para psicólogos clínicos
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-brand-text-muted md:text-lg font-light">
                        Explora y accede de forma gratuita a nuestra colección curada de guías de práctica clínica, formatos en PDF autocalificables, análisis de autores, biografía y herramientas digitales seguras.
                    </p>
                </div>
            </section>

            {/* ── INDEX BY SECTIONS ────────────────────────────────────── */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Navega por Categorías</h2>
                    <p className="text-sm text-brand-text-muted mt-2 font-light">Selecciona una rama para ver todos sus recursos profesionales detallados.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-20">
                    {CATEGORY_MAP.map((cat) => {
                        const count = ORGANIC_CONTENT.filter(item => item.contentType === cat.type).length
                        return (
                            <Link
                                key={cat.href}
                                href={cat.href}
                                className="group relative flex flex-col justify-between rounded-[28px] border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-brand-blue/30"
                            >
                                <div className="space-y-4">
                                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300">
                                        {cat.icon}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-foreground group-hover:text-brand-blue transition-colors duration-300">
                                            {cat.label}
                                        </h3>
                                        <p className="text-xs text-brand-text-muted font-light leading-relaxed">
                                            {cat.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 border-t border-brand-border pt-4 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-blue">
                                        {count} {count === 1 ? 'artículo' : 'artículos'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-blue group-hover:underline">
                                        Navegar
                                        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* ── HIGHLIGHTED GUIDES & RECENT CONTENT ───────────────────── */}
                <div className="border-t border-brand-border pt-16">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Todos los Recursos Clínicos</h2>
                            <p className="text-sm text-brand-text-muted mt-2 font-light">Explora el catálogo completo de 33 páginas indexadas disponibles en la biblioteca.</p>
                        </div>
                        <Link href="/recursos">
                            <Button variant="outline" className="gap-2 text-xs font-bold uppercase tracking-[0.1em] h-11 px-5 border-brand-border">
                                Ver descargas gratuitas
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {ORGANIC_CONTENT.map((item) => {
                            const cat = CATEGORY_MAP.find(c => c.type === item.contentType)
                            const kind = cat ? cat.routeKind : 'guides' as OrganicRouteKind
                            const path = buildOrganicPath(kind, item.slug)

                            return (
                                <Link key={item.slug} href={path} className="group rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-brand-blue/30 transition-all duration-300 flex flex-col justify-between h-48">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-brand-blue/80 bg-brand-blue-soft/30 px-2 py-0.5 rounded-full border border-brand-blue/10">
                                                {item.contentType.replaceAll('_', ' ')}
                                            </span>
                                            {item.specialty && (
                                                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                                                    {item.specialty.replaceAll('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-bold text-foreground group-hover:text-brand-blue transition-colors line-clamp-2">
                                            {item.title}
                                        </h3>
                                    </div>
                                    <p className="text-xs leading-relaxed text-brand-text-muted line-clamp-2 font-light">
                                        {item.description}
                                    </p>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </section>
        </div>
    )
}
export const dynamic = 'force-static'

import Link from 'next/link'
import { ArrowRight, Bot, Bookmark, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buildOrganicPath, getOrganicAbsoluteUrl, type OrganicRouteKind } from '@/lib/organic-leads/routing'
import type { OrganicContentAsset } from '@/lib/organic-leads/types'
import { serializeJsonLd, buildOrganizationJsonLd, buildBreadcrumbListJsonLd } from '@/lib/seo/json-ld'

interface OrganicHubLayoutProps {
    title: string
    serifSubtitle?: string
    description: string
    badge: string
    items: OrganicContentAsset[]
    routeKindMap: Record<string, OrganicRouteKind> | ((item: OrganicContentAsset) => OrganicRouteKind)
    breadcrumbs: Array<{ name: string; url: string }>
    canonicalPath: string
}

export function OrganicHubLayout({
    title,
    serifSubtitle,
    description,
    badge,
    items,
    routeKindMap,
    breadcrumbs,
    canonicalPath,
}: OrganicHubLayoutProps) {
    const pageUrl = getOrganicAbsoluteUrl(canonicalPath)

    // Build structured JSON-LD schemas
    const listElements = items.map((item, index) => {
        const kind = typeof routeKindMap === 'function' ? routeKindMap(item) : routeKindMap[item.contentType]
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
        name: `${title} | SAPIHUM`,
        description,
        url: pageUrl,
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: listElements,
        },
    }

    const jsonLdData = [
        buildOrganizationJsonLd(),
        buildBreadcrumbListJsonLd(breadcrumbs),
        collectionSchema,
    ]

    const jsonLdSerialized = serializeJsonLd(jsonLdData)

    return (
        <div className="w-full min-h-screen bg-background">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSerialized }} />

            {/* ── HERO SECTION ────────────────────────────────────────── */}
            <section className="relative w-full overflow-hidden bg-gradient-to-b from-background via-brand-blue-soft/30 to-background border-b border-brand-border">
                <div className="sapihum-grid-bg absolute inset-0 opacity-10 pointer-events-none" />
                <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-brand-blue/5 blur-[120px]" />

                <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
                    <Badge variant="outline" className="gap-2 border-brand-blue/30 bg-brand-blue/10 text-brand-blue px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] mb-8">
                        {badge}
                    </Badge>

                    <h1 className="text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
                        {title}{' '}
                        {serifSubtitle && (
                            <span className="font-serif italic font-normal text-brand-text-muted block mt-1">
                                {serifSubtitle}
                            </span>
                        )}
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-brand-text-muted md:text-lg font-light">
                        {description}
                    </p>
                </div>
            </section>

            {/* ── ITEMS GRID ──────────────────────────────────────────── */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                {items.length === 0 ? (
                    <div className="rounded-[28px] border bg-card p-12 text-center shadow-sm">
                        <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-bold">No hay contenidos en esta sección</h3>
                        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                            Estamos redactando nuevas guías y recursos rigurosos de salud mental. Vuelve a consultar esta página pronto.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => {
                            const kind = typeof routeKindMap === 'function' ? routeKindMap(item) : routeKindMap[item.contentType]
                            const path = buildOrganicPath(kind, item.slug)

                            return (
                                <article
                                    key={item.slug}
                                    className="flex flex-col h-full rounded-[28px] border bg-card p-6 shadow-sm shadow-black/5 hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 group"
                                >
                                    {/* Badges bar */}
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        <Badge variant="outline" className="text-[10px] uppercase font-semibold border-brand-border bg-background text-brand-text-muted">
                                            {item.contentType.replaceAll('_', ' ')}
                                        </Badge>
                                        {item.specialty && (
                                            <Badge variant="outline" className="text-[10px] uppercase font-semibold border-brand-blue/10 bg-brand-blue-soft/50 text-brand-blue">
                                                {item.specialty.replaceAll('_', ' ')}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Title and Description */}
                                    <div className="flex-1 space-y-3">
                                        <h3 className="text-xl font-bold leading-snug text-foreground group-hover:text-brand-blue transition-colors duration-300">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm font-light leading-relaxed text-brand-text-muted">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* AI Summary card inside item */}
                                    <div className="mt-5 rounded-2xl border bg-background/50 p-4 relative overflow-hidden group-hover:bg-background/80 transition-colors duration-300">
                                        <div className="flex items-start gap-2.5">
                                            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue opacity-80" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-text-muted">Resumen para IA</p>
                                                <p className="mt-1 text-xs leading-relaxed text-brand-text-muted line-clamp-3">
                                                    {item.aiSummary}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action link */}
                                    <div className="mt-6 border-t border-brand-border pt-4 flex items-center justify-between">
                                        {item.authorName ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-light">
                                                <User className="h-3.5 w-3.5" />
                                                {item.authorName}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground font-light">
                                                SAPIHUM Editorial
                                            </span>
                                        )}

                                        <Link href={path} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-brand-blue group-hover:underline">
                                            {item.gatedResource ? 'Desbloquear recurso' : 'Ver detalle'}
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                        </Link>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

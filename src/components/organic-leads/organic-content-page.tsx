import Link from 'next/link'
import { ArrowRight, Bot, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildOrganicContentJsonLd } from '@/lib/seo/json-ld'
import { buildOrganicPath, getOrganicAbsoluteUrl, type OrganicRouteKind } from '@/lib/organic-leads/routing'
import type { OrganicContentAsset } from '@/lib/organic-leads/types'
import { GatedResourceBlock } from './gated-resource-block'
import { OrganicLeadForm } from './organic-lead-form'
import { OrganicRelatedAssets } from './organic-related-assets'

interface OrganicContentPageProps {
    routeKind: OrganicRouteKind
    content: OrganicContentAsset
}

export function OrganicContentPage({ routeKind, content }: OrganicContentPageProps) {
    const pathname = buildOrganicPath(routeKind, content.slug)
    const pageUrl = getOrganicAbsoluteUrl(pathname)
    const breadcrumbs = [
        { name: 'SAPIHUM', url: getOrganicAbsoluteUrl('/') },
        { name: content.heroEyebrow ?? 'Contenido', url: pageUrl },
    ]
    const jsonLd = buildOrganicContentJsonLd({ content, url: pageUrl, breadcrumbs })

    return (
        <div className="w-full bg-background">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

            <article className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-16">
                <div className="space-y-8">
                    <header className="space-y-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                                <Tag className="h-3.5 w-3.5" />
                                {content.heroEyebrow ?? content.sourceType}
                            </span>
                            {content.specialty ? (
                                <span className="rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                                    {content.specialty.replaceAll('_', ' ')}
                                </span>
                            ) : null}
                        </div>

                        <div className="space-y-4">
                            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl">
                                {content.title}
                            </h1>
                            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
                                {content.description}
                            </p>
                        </div>

                        <div className="rounded-[28px] border bg-card p-5">
                            <div className="flex items-start gap-3">
                                <Bot className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                                <div>
                                    <p className="text-sm font-semibold">Resumen para IA</p>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{content.aiSummary}</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="space-y-6">
                        {content.sections.map((section) => (
                            <section key={section.heading} className="rounded-[28px] border bg-card p-6 shadow-sm">
                                <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
                                <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                                    {section.paragraphs.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                                {section.bullets?.length ? (
                                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                                        {section.bullets.map((bullet) => (
                                            <li key={bullet} className="rounded-2xl border bg-background/60 p-4 text-sm">
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </section>
                        ))}
                    </div>

                    {content.faqs?.length ? (
                        <section className="rounded-[28px] border bg-card p-6 shadow-sm">
                            <h2 className="text-2xl font-bold tracking-tight">Preguntas frecuentes</h2>
                            <div className="mt-5 grid gap-4">
                                {content.faqs.map((item) => (
                                    <div key={item.question} className="rounded-2xl border bg-background/60 p-4">
                                        <h3 className="font-semibold">{item.question}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>

                <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
                    {content.gatedResource ? (
                        <GatedResourceBlock
                            resource={content.gatedResource}
                            sourcePage={pathname}
                            sourceTopic={content.topic}
                            sourceType={content.sourceType}
                            intent={content.intent}
                            interestTags={content.interestTags}
                            actionType={content.actionType}
                            ctaLabel={content.ctaLabel}
                        />
                    ) : (
                        <section className="rounded-[28px] border bg-card p-6 shadow-sm">
                            <h2 className="text-xl font-bold">Siguiente paso</h2>
                            <div className="mt-5">
                                <OrganicLeadForm
                                    sourcePage={pathname}
                                    sourceTopic={content.topic}
                                    sourceAsset={content.slug}
                                    sourceType={content.sourceType}
                                    intent={content.intent}
                                    interestTags={content.interestTags}
                                    actionType={content.actionType}
                                    ctaLabel={content.ctaLabel}
                                />
                            </div>
                        </section>
                    )}

                    <OrganicRelatedAssets assets={content.relatedAssets} />

                    <section className="rounded-[28px] border bg-card p-6 shadow-sm">
                        <p className="text-sm font-semibold text-muted-foreground">Explora mas</p>
                        <Link href="/recursos" className="mt-4 block">
                            <Button variant="outline" className="w-full justify-between">
                                Ver recursos
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </section>
                </aside>
            </article>
        </div>
    )
}

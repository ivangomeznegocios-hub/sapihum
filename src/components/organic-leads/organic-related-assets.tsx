import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, GraduationCap, Users } from 'lucide-react'
import type { OrganicRelatedAsset } from '@/lib/organic-leads/types'

function getAssetIcon(type: OrganicRelatedAsset['type']) {
    if (type === 'event') return CalendarDays
    if (type === 'formation' || type === 'academy') return GraduationCap
    if (type === 'community' || type === 'psychologist') return Users
    return BookOpen
}

export function OrganicRelatedAssets({ assets }: { assets: OrganicRelatedAsset[] }) {
    if (assets.length === 0) return null

    return (
        <section className="rounded-[28px] border bg-card p-6 shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground">Relacionados</p>
            <div className="mt-4 grid gap-3">
                {assets.map((asset) => {
                    const Icon = getAssetIcon(asset.type)
                    return (
                        <Link
                            key={`${asset.type}-${asset.href}`}
                            href={asset.href}
                            className="group flex items-center justify-between gap-4 rounded-2xl border bg-background/60 p-4 transition-colors hover:bg-muted/40"
                        >
                            <span className="flex items-start gap-3">
                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                                <span>
                                    <span className="block text-sm font-semibold">{asset.label}</span>
                                    {asset.description ? (
                                        <span className="block text-xs leading-relaxed text-muted-foreground">{asset.description}</span>
                                    ) : null}
                                </span>
                            </span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-blue" />
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}

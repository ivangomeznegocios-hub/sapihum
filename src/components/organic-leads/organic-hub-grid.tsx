import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ORGANIC_HUBS } from '@/lib/organic-leads/taxonomy'

export function OrganicHubGrid() {
    return (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ORGANIC_HUBS.map((hub) => (
                <Link
                    key={hub.href}
                    href={hub.href}
                    className="group flex items-center justify-between rounded-2xl border bg-card p-4 text-sm font-semibold transition-colors hover:bg-muted/40"
                >
                    {hub.label}
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-brand-blue" />
                </Link>
            ))}
        </section>
    )
}

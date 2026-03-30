import { PublicCatalogCard } from './public-catalog-card'

export function PublicCatalogIndex({
    title,
    description,
    items,
}: {
    title: string
    description: string
    items: any[]
}) {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-brand-brown/80">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-brand-yellow/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-brand-brown/10 blur-3xl" />

                <div className="relative px-6 py-14 sm:px-10 sm:py-16 lg:py-20">
                    <div className="max-w-3xl space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-yellow">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-yellow opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-yellow" />
                            </span>
                            Catálogo Abierto
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">{title}</h1>
                        <p className="max-w-2xl text-lg leading-relaxed text-neutral-400 sm:text-xl">{description}</p>
                    </div>
                </div>
            </section>

            {/* Events Grid */}
            {items.length > 0 ? (
                <section>
                    <div className="mb-6 flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">
                            {items.length} {items.length === 1 ? 'resultado' : 'resultados'}
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {items.map((event) => (
                            <PublicCatalogCard key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            ) : (
                <section className="rounded-3xl border border-dashed border-border/60 bg-muted/20 px-6 py-20 text-center">
                    <div className="mx-auto max-w-sm space-y-3">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold">Próximamente</h2>
                        <p className="text-sm text-muted-foreground">
                            Estamos preparando nuevos eventos. Vuelve pronto para explorar lo que tenemos para ti.
                        </p>
                    </div>
                </section>
            )}
        </div>
    )
}

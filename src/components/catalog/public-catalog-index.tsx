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
        <div className="space-y-10 pb-16">
            <section className="rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/10 via-background to-amber-50/40 px-6 py-10 lg:px-10">
                <div className="max-w-3xl space-y-4">
                    <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">Catalogo publico</p>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
                    <p className="text-lg text-muted-foreground">{description}</p>
                </div>
            </section>

            {items.length > 0 ? (
                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((event) => (
                        <PublicCatalogCard key={event.id} event={event} />
                    ))}
                </section>
            ) : (
                <section className="rounded-[2rem] border border-dashed px-6 py-16 text-center text-muted-foreground">
                    Aun no hay activos publicados en esta seccion.
                </section>
            )}
        </div>
    )
}

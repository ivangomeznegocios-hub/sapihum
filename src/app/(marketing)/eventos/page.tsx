import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PublicCatalogCard } from '@/components/catalog/public-catalog-card'
import { splitPublicCatalogEvents } from '@/lib/events/public'
import { getUnifiedCatalogEvents } from '@/lib/supabase/queries/events'

const eventosDescription =
    'Eventos en vivo, conferencias, talleres y webinars de la comunidad SAPIHUM. Formacion continua para profesionales de la psicologia.'

export const metadata: Metadata = {
    title: 'Eventos en Vivo | SAPIHUM',
    description: eventosDescription,
    alternates: {
        canonical: '/eventos',
    },
    openGraph: {
        title: 'Eventos en Vivo | SAPIHUM',
        description: eventosDescription,
        url: '/eventos',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Eventos en Vivo | SAPIHUM',
        description: eventosDescription,
    },
}

export default async function EventosPage() {
    const allItems = await getUnifiedCatalogEvents()
    const items = splitPublicCatalogEvents(allItems).upcoming.filter((e: any) =>
        e.event_type !== 'course' &&
        e.event_type !== 'on_demand'
    )

    return (
        <div className="relative flex w-full flex-1 flex-col items-center bg-background">
            <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-background">
                <div className="sapihum-grid-bg absolute inset-0 opacity-15" />
                <div className="pointer-events-none absolute left-1/3 top-0 h-[400px] w-[400px] rounded-full bg-brand-yellow/8 blur-[120px]" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                    <div className="max-w-3xl space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-brand-yellow">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-yellow opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-yellow" />
                            </span>
                            En Vivo
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                            Eventos en Vivo
                        </h1>
                        <p className="max-w-2xl text-lg leading-relaxed text-neutral-400">
                            Conferencias, talleres, webinars y experiencias de networking. Conectate en tiempo real con la comunidad.
                        </p>
                        <Link href="/academia" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-yellow transition-colors hover:text-brand-yellow">
                            &larr; Ver catalogo completo
                        </Link>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
            </section>

            <section className="w-full px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    {items.length > 0 ? (
                        <>
                            <p className="mb-6 text-sm font-medium text-muted-foreground">
                                {items.length} {items.length === 1 ? 'evento disponible' : 'eventos disponibles'}
                            </p>
                            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {items.map((event: any) => (
                                    <PublicCatalogCard key={event.id} event={event} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-3xl border-2 border-dashed border-border/40 bg-gradient-to-br from-muted/30 to-muted/10 px-6 py-20 text-center">
                            <div className="mx-auto max-w-sm space-y-4">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-3xl">
                                    Eventos
                                </div>
                                <h2 className="text-xl font-bold">Proximamente</h2>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Estamos preparando nuevos eventos en vivo. Mientras tanto, explora todo nuestro catalogo de formacion.
                                </p>
                                <Link href="/academia">
                                    <Button variant="outline" className="mt-3 gap-2">
                                        Explorar catalogo completo
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

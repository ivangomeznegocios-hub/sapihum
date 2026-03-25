import type { Metadata } from 'next'
import { PublicCatalogIndex } from '@/components/catalog/public-catalog-index'
import { getPublicCatalogDescription } from '@/lib/events/public'
import { getPublicCatalogEvents } from '@/lib/supabase/queries/events'

export const metadata: Metadata = {
    title: 'Eventos | Comunidad de Psicologia',
    description: getPublicCatalogDescription('eventos'),
}

export default async function EventosPage() {
    const items = await getPublicCatalogEvents('eventos')

    return (
        <PublicCatalogIndex
            title="Eventos"
            description={getPublicCatalogDescription('eventos')}
            items={items}
        />
    )
}

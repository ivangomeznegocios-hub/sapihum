import type { Metadata } from 'next'
import { PublicCatalogIndex } from '@/components/catalog/public-catalog-index'
import { getPublicCatalogDescription } from '@/lib/events/public'
import { getPublicCatalogEvents } from '@/lib/supabase/queries/events'

export const metadata: Metadata = {
    title: 'Grabaciones | Comunidad de Psicologia',
    description: getPublicCatalogDescription('grabaciones'),
}

export default async function GrabacionesPage() {
    const items = await getPublicCatalogEvents('grabaciones')

    return (
        <PublicCatalogIndex
            title="Grabaciones"
            description={getPublicCatalogDescription('grabaciones')}
            items={items}
        />
    )
}

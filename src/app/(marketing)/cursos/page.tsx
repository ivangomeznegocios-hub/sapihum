import type { Metadata } from 'next'
import { PublicCatalogIndex } from '@/components/catalog/public-catalog-index'
import { getPublicCatalogDescription } from '@/lib/events/public'
import { getPublicCatalogEvents } from '@/lib/supabase/queries/events'

export const metadata: Metadata = {
    title: 'Cursos | Comunidad de Psicologia',
    description: getPublicCatalogDescription('cursos'),
}

export default async function CursosPage() {
    const items = await getPublicCatalogEvents('cursos')

    return (
        <PublicCatalogIndex
            title="Cursos"
            description={getPublicCatalogDescription('cursos')}
            items={items}
        />
    )
}

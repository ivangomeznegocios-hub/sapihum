import { redirect } from 'next/navigation'
import { MyAccessContent } from '@/components/access/my-access-content'
import { getUserProfile } from '@/lib/supabase/server'
import { getMyAccessibleEvents } from '@/lib/supabase/queries/event-entitlements'
import { formatPageTitle } from '@/lib/brand'

export const metadata = {
    title: formatPageTitle('Mi acceso'),
    robots: {
        index: false,
        follow: false,
    },
}

export default async function MyAccessPage() {
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/compras/recuperar?next=/mi-acceso')
    }

    const accesses = await getMyAccessibleEvents()

    return <MyAccessContent accesses={accesses} />
}

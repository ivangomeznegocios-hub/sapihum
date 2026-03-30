import { redirect } from 'next/navigation'
import { MyAccessContent } from '@/components/access/my-access-content'
import { getUserProfile } from '@/lib/supabase/server'
import { getMyAccessibleEvents } from '@/lib/supabase/queries/event-entitlements'

export const metadata = {
    title: 'Mis accesos | Dashboard',
}

export default async function DashboardMyAccessPage() {
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    const accesses = await getMyAccessibleEvents()

    return <MyAccessContent accesses={accesses} withinDashboard />
}

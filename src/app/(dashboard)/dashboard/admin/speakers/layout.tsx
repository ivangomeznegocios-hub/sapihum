import { requireAdminPage } from '@/lib/admin/guard'

export default async function AdminSpeakersLayout({
    children,
}: {
    children: React.ReactNode
}) {
    await requireAdminPage()

    return children
}

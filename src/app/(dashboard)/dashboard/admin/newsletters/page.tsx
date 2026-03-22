import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { NewsletterManager } from './newsletter-manager'

export default async function AdminNewslettersPage() {
    const profile = await getUserProfile()
    if (profile?.role !== 'admin') redirect('/dashboard')

    const supabase = await createClient()
    const { data: newsletters } = await (supabase
        .from('newsletters') as any)
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })

    return (
        <div className="w-full space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestionar Newsletters</h1>
                    <p className="text-muted-foreground mt-1">
                        Crea y gestiona los newsletters mensuales para la comunidad
                    </p>
                </div>
                <Link href="/dashboard/newsletter" className="w-full text-sm text-primary hover:underline sm:w-auto">
                    ← Ver como usuario
                </Link>
            </div>

            <NewsletterManager newsletters={newsletters || []} />
        </div>
    )
}

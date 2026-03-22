import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { AgreementManager } from './agreement-manager'

export default async function AdminAgreementsPage() {
    const profile = await getUserProfile()
    if (profile?.role !== 'admin') redirect('/dashboard')

    const supabase = await createClient()
    const { data: agreements } = await (supabase
        .from('exclusive_agreements') as any)
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="w-full space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestionar Convenios</h1>
                    <p className="text-muted-foreground mt-1">
                        Administra las alianzas y convenios exclusivos para la comunidad
                    </p>
                </div>
                <Link href="/dashboard/agreements" className="w-full text-sm text-primary hover:underline sm:w-auto">
                    ← Ver como usuario
                </Link>
            </div>

            <Suspense fallback={<div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Cargando convenios...</div>}>
                <AgreementManager agreements={agreements || []} />
            </Suspense>
        </div>
    )
}

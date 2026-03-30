import { notFound } from 'next/navigation'
import { FormationForm } from '@/components/formations/formation-form'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
    title: 'Crear Formacion | SAPIHUM Admin',
}

export default async function NewFormationPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = user
        ? await (supabase
            .from('profiles') as any)
            .select('role')
            .eq('id', user.id)
            .single()
        : { data: null }

    if (!profile || !['admin', 'ponente'].includes(profile.role)) {
        notFound()
    }

    const isAdmin = profile?.role === 'admin'

    let eventsQuery = supabase
        .from('events')
        .select('id, title, price, status')
        .is('formation_id', null)
        .order('created_at', { ascending: false })

    if (!isAdmin && user) {
        eventsQuery = eventsQuery.eq('created_by', user.id)
    }

    const { data: events } = await eventsQuery

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nueva Formacion</h1>
                <p className="mt-1 text-muted-foreground">
                    Agrupa multiples eventos y cursos en un solo paquete para tus alumnos.
                </p>
            </div>

            <FormationForm availableEvents={events || []} canPublish={isAdmin} />
        </div>
    )
}

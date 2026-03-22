import { ResourceForm } from '../resource-form'
import { getEventsForLinking } from '@/lib/supabase/queries/resources'
import { getUserRole } from '@/lib/supabase/server'

export default async function NewResourcePage() {
    const role = await getUserRole()
    const canCreate = role === 'admin' || role === 'ponente'

    let events: { id: string; title: string; start_time: string }[] = []
    if (canCreate) {
        events = await getEventsForLinking()
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Agregar Nuevo Recurso</h1>
                <p className="text-muted-foreground">
                    Comparte documentos, videos o enlaces con tu comunidad.
                </p>
            </div>

            <div className="p-6 border rounded-xl bg-card">
                <ResourceForm isEmbedded={true} events={events} userRole={role || 'psychologist'} />
            </div>
        </div>
    )
}

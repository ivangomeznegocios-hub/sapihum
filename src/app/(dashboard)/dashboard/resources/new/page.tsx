import { ResourceForm } from '../resource-form'
import { getEventsForLinking } from '@/lib/supabase/queries/resources'
import { requirePageRoles } from '@/lib/access/role-guard'

export default async function NewResourcePage() {
    const { profile } = await requirePageRoles(['admin', 'ponente'], '/dashboard/resources')
    const role = profile.role

    const events = await getEventsForLinking()

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Agregar Nuevo Recurso</h1>
                <p className="text-muted-foreground">
                    Comparte documentos, videos o enlaces con tu comunidad.
                </p>
            </div>

            <div className="p-6 border rounded-xl bg-card">
                <ResourceForm isEmbedded={true} events={events} userRole={role} />
            </div>
        </div>
    )
}

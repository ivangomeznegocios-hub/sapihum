import { getViewerContext } from '@/lib/supabase/server'
import { getEventSpeakerOptions } from '@/lib/supabase/queries/speakers'
import { redirect } from 'next/navigation'
import { CreateEventForm } from '../event-forms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewEventPage() {
    const { profile, availableVerticals, activeVertical } = await getViewerContext()

    if (!profile) {
        redirect('/auth/login')
    }

    // Only admins and ponentes can create events
    if (!['admin', 'ponente'].includes(profile.role || '')) {
        redirect('/dashboard/events')
    }

    const speakerOptions = await getEventSpeakerOptions()

    return (
        <div className="space-y-8">
            {/* Back Link */}
            <Link
                href="/dashboard/events"
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a eventos
            </Link>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Evento</h1>
                <p className="text-muted-foreground mt-1">
                    Configura los detalles de tu evento como admin o ponente
                </p>
            </div>

            <Card className="max-w-5xl">
                <CardHeader>
                    <CardTitle>Detalles del Evento</CardTitle>
                </CardHeader>
                <CardContent>
                    <CreateEventForm
                        isEmbedded
                        userRole={profile.role || ''}
                        speakerOptions={speakerOptions}
                        availableVerticals={availableVerticals}
                        activeVertical={activeVertical}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

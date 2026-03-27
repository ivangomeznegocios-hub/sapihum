import { createClient, getUserProfile } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InteractiveToolViewer } from '@/components/interactive-tool-viewer'
import { getActiveEntitlementForEvent } from '@/lib/events/access'
import { getCommercialAccessContext } from '@/lib/access/commercial'
import { canViewerSeeListedResource } from '@/lib/access/catalog'
import { ArrowLeft, ExternalLink } from 'lucide-react'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ResourceDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    // Fetch the resource
    const { data: resource, error } = await (supabase
        .from('resources') as any)
        .select('*')
        .eq('id', id)
        .single()

    if (!resource || error) {
        notFound()
    }

    const commercialAccess = await getCommercialAccessContext({
        supabase,
        userId: profile.id,
        profile,
    })
    if (!commercialAccess) {
        redirect('/dashboard/resources')
    }
    const isAdmin = profile.role === 'admin'
    const isCreator = resource.created_by === profile.id
    const hasStandardAccess = canViewerSeeListedResource(resource as any, commercialAccess.viewer)

    // Check if user has access
    if (!hasStandardAccess) {
        if (resource.visibility !== 'private' || isAdmin || isCreator) {
            return (
                <div className="space-y-8">
                    <Link
                        href="/dashboard/resources"
                        className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a recursos
                    </Link>
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <h3 className="text-lg font-medium mb-2">Acceso restringido</h3>
                            <p className="text-muted-foreground text-sm max-w-md">
                                No tienes permisos para acceder a este recurso.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        // Check if assigned to this user or if registered to linked event
        const { data: assignment } = await (supabase
            .from('patient_resources') as any)
            .select('id')
            .eq('resource_id', id)
            .eq('patient_id', profile.id)
            .single()

        const { data: eventLink } = await (supabase
            .from('event_resources') as any)
            .select(`
                event_id,
                events:event_id (id, event_type)
            `)
            .eq('resource_id', id)
            .limit(1)

        const eventAccessChecks = await Promise.all(
            (eventLink || []).map(async (link: any) => {
                const entitlement = await getActiveEntitlementForEvent({
                    supabase,
                    eventId: link.event_id,
                    userId: profile.id,
                    email: profile.email,
                    eventType: link.events?.event_type,
                })

                if (entitlement) {
                    return true
                }

                const { data: registration } = await (supabase
                    .from('event_registrations') as any)
                    .select('id')
                    .eq('event_id', link.event_id)
                    .eq('user_id', profile.id)
                    .eq('status', 'registered')
                    .maybeSingle()

                return Boolean(registration)
            })
        )

        const hasEventAccess = eventAccessChecks.some(Boolean)

        if (!assignment && !hasEventAccess) {
            return (
                <div className="space-y-8">
                    <Link
                        href="/dashboard/resources"
                        className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a recursos
                    </Link>
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <h3 className="text-lg font-medium mb-2">Acceso restringido</h3>
                            <p className="text-muted-foreground text-sm max-w-md">
                                No tienes permisos para acceder a este recurso.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )
        }
    }

    const isInteractiveTool = resource.type === 'tool' && resource.html_content

    const typeLabels: Record<string, string> = {
        pdf: 'PDF', video: 'Video', audio: 'Audio',
        link: 'Enlace', document: 'Documento', tool: 'Herramienta'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Link
                    href="/dashboard/resources"
                    className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a recursos
                </Link>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{resource.title}</h1>
                    <Badge variant="secondary" className="text-xs">
                        {typeLabels[resource.type] || resource.type}
                    </Badge>
                    {isInteractiveTool && (
                        <Badge className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                            Interactiva
                        </Badge>
                    )}
                </div>
                {resource.description && (
                    <p className="text-muted-foreground">{resource.description}</p>
                )}
            </div>

            {/* Interactive Tool Viewer */}
            {isInteractiveTool && (
                <InteractiveToolViewer
                    htmlContent={resource.html_content}
                    title={resource.title}
                    height="600px"
                />
            )}

            {/* External link button for non-tool resources or tools with external URLs */}
            {resource.url && resource.url !== '#interactive-tool' && (
                <Button asChild variant="outline">
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        {isInteractiveTool ? 'Enlace externo' : 'Abrir recurso'}
                        <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                </Button>
            )}
        </div>
    )
}

import Link from 'next/link'
import { Suspense } from 'react'
import { EditResourceButton, DeleteResourceButton } from './resource-form'
import { ResourceActionButton } from './resource-buttons'
import { getVisibleResources, getEventsForLinking } from '@/lib/supabase/queries/resources'
import { getUserProfile, getUserRole, createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResourceFilters } from './resource-filters'
import type { Resource } from '@/types/database'

// ──── ICONS ────

function ResourceTypeIcon({ type }: { type: string }) {
    const icons: Record<string, React.ReactNode> = {
        pdf: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" />
                <path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" />
            </svg>
        ),
        video: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                <rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
        ),
        audio: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
        ),
        link: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
        ),
        document: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
            </svg>
        ),
        tool: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        )
    }
    return icons[type] || icons.link
}

// ──── HELPERS ────

const typeColors: Record<string, string> = {
    pdf: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    video: 'bg-brand-brown text-brand-brown dark:bg-brand-brown dark:text-brand-brown',
    audio: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow dark:text-brand-yellow',
    link: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    document: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow dark:text-brand-yellow',
    tool: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow dark:text-brand-yellow'
}

const typeLabels: Record<string, string> = {
    pdf: 'PDF',
    video: 'Video',
    audio: 'Audio',
    link: 'Enlace',
    document: 'Documento',
    tool: 'Herramienta'
}

const categoryLabels: Record<string, string> = {
    general: 'General',
    guia: 'Guía',
    estudio: 'Estudio',
    herramienta: 'Herramienta',
    plantilla: 'Plantilla',
    curso_material: 'Material de Curso'
}

function getExpirationBadge(expiresAt: string | null) {
    if (!expiresAt) return null
    const now = new Date()
    const expires = new Date(expiresAt)
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft <= 0) {
        return <Badge variant="destructive" className="text-[10px]">Expirado</Badge>
    }
    if (daysLeft <= 7) {
        return <Badge variant="destructive" className="text-[10px]">Expira en {daysLeft}d</Badge>
    }
    if (daysLeft <= 30) {
        return <Badge variant={'warning' as any} className="text-[10px] bg-brand-yellow/90 text-white">Expira en {daysLeft}d</Badge>
    }
    return <Badge variant="outline" className="text-[10px]">Expira en {daysLeft}d</Badge>
}

// ──── RESOURCE CARD ────

function ResourceCard({
    resource,
    showActions = false,
    showDelete = false,
    creatorName,
    events
}: {
    resource: Resource
    showActions?: boolean
    showDelete?: boolean
    creatorName?: string
    events?: any[]
}) {
    return (
        <Card className="group hover:shadow-md transition-all relative">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${typeColors[resource.type] || typeColors.link}`}>
                            <ResourceTypeIcon type={resource.type} />
                        </div>
                        {(resource as any).is_featured && (
                            <span className="text-brand-yellow text-lg" title="Destacado">⭐</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {showActions && (
                            <div className="flex bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm">
                                <EditResourceButton resource={resource} events={events} />
                                {showDelete && <DeleteResourceButton resourceId={resource.id} />}
                            </div>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                            {resource.visibility === 'public' ? 'Público' : resource.visibility === 'members_only' ? 'Miembros' : 'Privado'}
                        </Badge>
                    </div>
                </div>
                <CardTitle className="mt-3 line-clamp-2 group-hover:text-primary transition-colors pr-8 text-base">
                    {resource.title}
                </CardTitle>
                {resource.description && (
                    <CardDescription className="line-clamp-2">
                        {resource.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] font-normal">
                            {typeLabels[resource.type]}
                        </Badge>
                        {(resource as any).category && (resource as any).category !== 'general' && (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                                {categoryLabels[(resource as any).category] || (resource as any).category}
                            </Badge>
                        )}
                        {getExpirationBadge((resource as any).expires_at)}
                    </div>

                    {/* Tags */}
                    {(resource as any).tags && (resource as any).tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {((resource as any).tags as string[]).slice(0, 4).map(tag => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                    {tag}
                                </span>
                            ))}
                            {(resource as any).tags.length > 4 && (
                                <span className="text-[10px] text-muted-foreground">+{(resource as any).tags.length - 4}</span>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-col gap-0.5">
                            {creatorName && (
                                <span className="text-[11px] text-muted-foreground">
                                    Por: {creatorName}
                                </span>
                            )}
                            {(resource as any).download_count > 0 && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" x2="12" y1="15" y2="3" />
                                    </svg>
                                    {(resource as any).download_count}
                                </span>
                            )}
                        </div>
                        <ResourceActionButton
                            url={resource.url}
                            title={resource.title}
                            type={resource.type}
                            resourceId={resource.id}
                            htmlContent={(resource as any).html_content}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// ──── MAIN PAGE ────

export default async function ResourcesPage({
    searchParams
}: {
    searchParams: Promise<{ type?: string; category?: string; audience?: string; search?: string }>
}) {
    const params = await searchParams
    const profile = await getUserProfile()
    const role = await getUserRole()

    const isAdmin = role === 'admin'
    const isPonente = role === 'ponente'
    const canCreate = isAdmin || isPonente

    // Get filtered resources
    const resources = await getVisibleResources({
        type: params.type,
        category: params.category,
        audience: params.audience,
        search: params.search
    })

    // Get events for linking (only for those who can create)
    let events: { id: string; title: string; start_time: string }[] = []
    if (canCreate) {
        events = await getEventsForLinking()
    }

    // Fetch creator names
    const creatorIds = [...new Set(resources.map(r => (r as any).created_by).filter(Boolean))]
    let creatorMap: Record<string, string> = {}

    if (creatorIds.length > 0) {
        const supabase = await createClient()
        const { data: creators } = await (supabase
            .from('profiles') as any)
            .select('id, full_name, role')
            .in('id', creatorIds)

        if (creators) {
            for (const c of creators) {
                creatorMap[c.id] = c.role === 'admin' ? 'Comunidad de Psicología' : (c.full_name || 'Ponente')
            }
        }
    }

    // Separate featured vs regular
    const featured = resources.filter(r => (r as any).is_featured)
    const regular = resources.filter(r => !(r as any).is_featured)

    function getCreatorName(resource: Resource) {
        return creatorMap[(resource as any).created_by] || undefined
    }

    function canEditResource(resource: Resource): boolean {
        if (isAdmin) return true
        if (isPonente && (resource as any).created_by === profile?.id) return true
        return false
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hub de Recursos</h1>
                    <p className="text-muted-foreground mt-1">
                        Material educativo, guías, herramientas y recursos para tu desarrollo profesional
                    </p>
                </div>
                {canCreate && (
                    <Button asChild>
                        <Link href="/dashboard/resources/new">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2"
                            >
                                <line x1="12" x2="12" y1="5" y2="19" />
                                <line x1="5" x2="19" y1="12" y2="12" />
                            </svg>
                            Agregar Recurso
                        </Link>
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Suspense fallback={null}>
                <ResourceFilters />
            </Suspense>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{resources.length} recurso{resources.length !== 1 ? 's' : ''}</span>
                {featured.length > 0 && <span>• {featured.length} destacado{featured.length !== 1 ? 's' : ''}</span>}
            </div>

            {/* Featured Section */}
            {featured.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        ⭐ Recursos Destacados
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {featured.map(resource => (
                            <ResourceCard
                                key={resource.id}
                                resource={resource}
                                showActions={canEditResource(resource)}
                                showDelete={isAdmin}
                                creatorName={getCreatorName(resource)}
                                events={events}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Regular Resources */}
            {regular.length > 0 && (
                <section>
                    {featured.length > 0 && (
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                            </svg>
                            Todos los Recursos
                        </h2>
                    )}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {regular.map(resource => (
                            <ResourceCard
                                key={resource.id}
                                resource={resource}
                                showActions={canEditResource(resource)}
                                showDelete={isAdmin}
                                creatorName={getCreatorName(resource)}
                                events={events}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {resources.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground mb-4"
                        >
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            <path d="M12 6v7" />
                            <path d="m8 9 4 4 4-4" />
                        </svg>
                        <h3 className="text-lg font-medium mb-1">No hay recursos disponibles</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                            {canCreate
                                ? 'Comienza agregando recursos educativos para la comunidad'
                                : 'Aún no se han agregado recursos'}
                        </p>
                        {canCreate && (
                            <Button asChild className="mt-4">
                                <Link href="/dashboard/resources/new">Agregar Recurso</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

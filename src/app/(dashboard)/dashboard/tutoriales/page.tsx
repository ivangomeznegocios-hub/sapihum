import { BookOpenCheck, PlayCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePageRoles } from '@/lib/access/role-guard'
import { getSpeakerTutorials } from '@/lib/supabase/queries/speaker-tutorials'
import type { SpeakerTutorial } from '@/types/database'
import { TutorialAdminManager } from './tutorial-admin-manager'

function TutorialCard({ tutorial, showStatus = false }: { tutorial: SpeakerTutorial; showStatus?: boolean }) {
    return (
        <Card className="overflow-hidden">
            <div className="aspect-video bg-muted">
                <iframe
                    src={`https://www.youtube.com/embed/${tutorial.youtube_video_id}`}
                    title={tutorial.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                />
            </div>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="line-clamp-2 text-lg">{tutorial.title}</CardTitle>
                        {tutorial.description ? (
                            <CardDescription className="mt-2 line-clamp-3">
                                {tutorial.description}
                            </CardDescription>
                        ) : null}
                    </div>
                    {showStatus ? (
                        <Badge variant={tutorial.is_active ? 'default' : 'secondary'} className="shrink-0">
                            {tutorial.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                    ) : null}
                </div>
            </CardHeader>
        </Card>
    )
}

function TutorialGrid({ tutorials, showStatus = false }: { tutorials: SpeakerTutorial[]; showStatus?: boolean }) {
    if (tutorials.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                    <PlayCircle className="mb-4 h-12 w-12 text-muted-foreground/60" />
                    <h2 className="text-lg font-medium">Aun no hay tutoriales disponibles</h2>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                        Cuando el equipo agregue videos de induccion, apareceran aqui.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tutorials.map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} showStatus={showStatus} />
            ))}
        </div>
    )
}

export default async function SpeakerTutorialsPage() {
    const { profile } = await requirePageRoles(['admin', 'ponente'])
    const isAdmin = profile.role === 'admin'
    const tutorials = await getSpeakerTutorials({ includeInactive: isAdmin })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                        <BookOpenCheck className="h-4 w-4" />
                        Biblioteca para ponentes
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Tutoriales</h1>
                    <p className="mt-1 max-w-2xl text-muted-foreground">
                        Videos cortos para preparar tu perfil, publicar eventos y usar las herramientas del panel.
                    </p>
                </div>
                <Badge variant="secondary" className="w-fit">
                    {tutorials.length} video{tutorials.length === 1 ? '' : 's'}
                </Badge>
            </div>

            {isAdmin ? (
                <TutorialAdminManager tutorials={tutorials} />
            ) : (
                <TutorialGrid tutorials={tutorials} />
            )}
        </div>
    )
}

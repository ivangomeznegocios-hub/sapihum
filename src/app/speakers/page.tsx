import Link from 'next/link'
import { getPublicSpeakers } from '@/lib/supabase/queries/speakers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
    title: 'Nuestros Ponentes | Comunidad de Psicologia',
    description: 'Conoce a los expertos y ponentes que imparten nuestros eventos y talleres.',
}

export default async function PonentesPage() {
    const speakers = await getPublicSpeakers()

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Nuestros Ponentes</h1>
                <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                    Conoce a los expertos que imparten nuestros eventos, talleres y cursos.
                </p>
            </div>

            {speakers.length === 0 ? (
                <Card className="border-dashed p-12 text-center">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium">No hay ponentes publicos</h3>
                        <p className="mx-auto max-w-sm text-muted-foreground">
                            Aun no se han configurado perfiles publicos de ponentes en la plataforma.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {speakers.map((speaker: any) => (
                        <Card key={speaker.id} className="group flex h-full flex-col overflow-hidden bg-card transition-colors hover:bg-muted/50 hover:shadow-md">
                            <Link href={`/speakers/${speaker.id}`} className="flex h-full flex-col">
                                <CardHeader className="pb-4 text-center">
                                    <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-primary/10 shadow-sm">
                                        {speaker.profile?.avatar_url ? (
                                            <img
                                                src={speaker.profile.avatar_url}
                                                alt={speaker.profile.full_name || 'Ponente'}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-primary/5 text-2xl font-semibold text-primary/40">
                                                {(speaker.profile?.full_name || 'P')?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl leading-tight">{speaker.profile?.full_name || 'Ponente Anonimo'}</CardTitle>
                                    {speaker.headline && (
                                        <CardDescription className="mt-1 text-base font-medium text-primary">
                                            {speaker.headline}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col pt-0 text-center">
                                    {speaker.bio ? (
                                        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                                            {speaker.bio}
                                        </p>
                                    ) : (
                                        <div className="mb-4" />
                                    )}

                                    {speaker.credentials && speaker.credentials.length > 0 && (
                                        <p className="mb-4 line-clamp-3 px-2 text-xs text-muted-foreground">
                                            {speaker.credentials.join(' · ')}
                                        </p>
                                    )}

                                    {speaker.specialties && speaker.specialties.length > 0 && (
                                        <div className="mt-auto flex flex-wrap justify-center gap-2 pb-4">
                                            {speaker.specialties.slice(0, 3).map((spec: string, i: number) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {spec}
                                                </Badge>
                                            ))}
                                            {speaker.specialties.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{speaker.specialties.length - 3} mas
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                    <div className="mt-auto w-full border-t pt-4 text-center">
                                        <span className="flex items-center justify-center gap-1 text-sm font-medium text-primary">
                                            Ver perfil y eventos
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

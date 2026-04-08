import Image from 'next/image'
import Link from 'next/link'
import { getPublicSpeakers } from '@/lib/supabase/queries/speakers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic2, Globe, ExternalLink, Plus } from 'lucide-react'
import { getUserProfile } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function SpeakersPage() {
    const profile = await getUserProfile()
    const speakers = await getPublicSpeakers()

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Mic2 className="h-8 w-8 text-primary" />
                        Ponentes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Conoce a los expertos que lideran nuestros eventos y talleres
                    </p>
                </div>
                {profile?.role === 'admin' && (
                    <Button asChild>
                        <Link href="/dashboard/admin/speakers/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Ponente
                        </Link>
                    </Button>
                )}
            </div>

            {/* Speakers Grid */}
            {speakers.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {speakers.map((speaker) => (
                        <Link key={speaker.id} href={`/dashboard/speakers/${speaker.id}`}>
                            <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                                {/* Photo */}
                                <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
                                    {speaker.photo_url ? (
                                        <Image
                                            src={speaker.photo_url}
                                            alt={speaker.profile?.full_name || 'Ponente'}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 1024px) 100vw, 33vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Mic2 className="h-12 w-12 text-primary/40" />
                                            </div>
                                        </div>
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    {/* Name over image */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-lg font-bold text-white">
                                            {speaker.profile?.full_name || 'Ponente'}
                                        </h3>
                                        {speaker.headline && (
                                            <p className="text-sm text-white/80 line-clamp-1">
                                                {speaker.headline}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <CardContent className="p-4 space-y-3">
                                    {/* Specialties */}
                                    {speaker.specialties && speaker.specialties.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {speaker.specialties.slice(0, 3).map((spec, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {spec}
                                                </Badge>
                                            ))}
                                            {speaker.specialties.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{speaker.specialties.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    {/* Credentials preview */}
                                    {speaker.credentials && speaker.credentials.length > 0 && (
                                        <p className="text-xs text-muted-foreground line-clamp-3">
                                            {speaker.credentials.join(' · ')}
                                        </p>
                                    )}

                                    {/* Social links */}
                                    {speaker.social_links_enabled && speaker.social_links && Object.keys(speaker.social_links).length > 0 && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            {speaker.social_links.website && (
                                                <Globe className="h-3.5 w-3.5" />
                                            )}
                                            {Object.entries(speaker.social_links)
                                                .filter(([k]) => k !== 'website')
                                                .slice(0, 3)
                                                .map(([key]) => (
                                                    <ExternalLink key={key} className="h-3.5 w-3.5" />
                                                ))
                                            }
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Mic2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-1">No hay ponentes disponibles</h3>
                        <p className="text-sm text-muted-foreground">
                            Próximamente agregaremos perfiles de nuestros ponentes
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

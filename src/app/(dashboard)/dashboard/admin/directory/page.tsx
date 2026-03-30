import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import {
    BookUser, CheckCircle2, XCircle, MapPin, Brain,
    Users, GraduationCap, Clock, Phone, GitBranch
} from 'lucide-react'

export default async function AdminDirectoryPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) redirect('/auth/login')
    if (profile.role !== 'admin') redirect('/dashboard')

    const { data: psychologists } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('role', 'psychologist')
        .order('full_name', { ascending: true })

    const allPsychologists = psychologists || []
    const termsAccepted = allPsychologists.filter((psychologist: any) => psychologist.accepts_referral_terms)

    return (
        <div className="w-full space-y-8">
            <div>
                <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    <BookUser className="h-8 w-8" />
                    Directorio de Psicologos
                </h1>
                <p className="text-muted-foreground mt-1">
                    Consulta perfiles profesionales para canalizacion clinica y asignaciones
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Psicologos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allPsychologists.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disponibles para Canalizacion</CardTitle>
                        <GitBranch className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{termsAccepted.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sin Lineamientos</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allPsychologists.length - termsAccepted.length}</div>
                    </CardContent>
                </Card>
            </div>

            {allPsychologists.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12 text-muted-foreground">
                        <BookUser className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay psicologos registrados</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {allPsychologists.map((psychologist: any) => (
                        <Card key={psychologist.id} className={`relative ${psychologist.accepts_referral_terms ? 'border-green-200/50 dark:border-green-800/30' : ''}`}>
                            {psychologist.accepts_referral_terms && (
                                <div className="absolute top-3 right-3">
                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                        <CheckCircle2 className="h-3 w-3" /> Disponible
                                    </span>
                                </div>
                            )}

                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-yellow to-brand-yellow flex items-center justify-center text-white font-bold text-lg shrink-0">
                                        {psychologist.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-base truncate">{psychologist.full_name || 'Sin nombre'}</CardTitle>
                                        <CardDescription className="truncate">{psychologist.specialty || 'Sin especialidad'}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {psychologist.bio && (
                                    <p className="text-muted-foreground text-xs line-clamp-2">{psychologist.bio}</p>
                                )}

                                <div className="space-y-1.5">
                                    {psychologist.cedula_profesional && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span>Cedula: {psychologist.cedula_profesional}</span>
                                        </div>
                                    )}
                                    {psychologist.years_experience && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span>{psychologist.years_experience} anos de experiencia</span>
                                        </div>
                                    )}
                                    {psychologist.phone && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span>{psychologist.phone}</span>
                                        </div>
                                    )}
                                    {psychologist.office_address && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span className="truncate">{psychologist.office_address}</span>
                                        </div>
                                    )}
                                </div>

                                {psychologist.populations_served?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                            <Users className="h-3 w-3" /> Atiende:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {psychologist.populations_served.map((population: string) => (
                                                <span key={population} className="text-xs px-1.5 py-0.5 bg-brand-yellow dark:bg-brand-yellow/20 text-brand-yellow dark:text-brand-yellow rounded">
                                                    {population}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {psychologist.therapeutic_approaches?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                            <Brain className="h-3 w-3" /> Enfoques:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {psychologist.therapeutic_approaches.map((approach: string) => (
                                                <span key={approach} className="text-xs px-1.5 py-0.5 bg-brand-brown dark:bg-brand-brown/20 text-brand-brown dark:text-brand-brown rounded">
                                                    {approach}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {psychologist.hourly_rate && (
                                    <div className="pt-1 border-t">
                                        <span className="text-xs text-muted-foreground">
                                            Precio base: <strong className="text-foreground">${psychologist.hourly_rate.toLocaleString('es-MX')} MXN/hr</strong>
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

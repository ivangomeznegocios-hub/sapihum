import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { ExclusiveAgreement } from '@/types/database'

export default async function AgreementsPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        return <div className="p-8 text-center text-muted-foreground">Inicia sesión para ver los convenios.</div>
    }

    // Get active agreements
    const { data: agreements } = await (supabase
        .from('exclusive_agreements') as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    const CATEGORY_LABELS: Record<string, string> = {
        salud: 'Salud',
        educacion: 'Educación',
        tecnologia: 'Tecnología',
        bienestar: 'Bienestar',
        servicios: 'Servicios',
        otro: 'Otro',
        general: 'General',
    }

    const CATEGORY_COLORS: Record<string, string> = {
        salud: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        educacion: 'bg-brand-yellow text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow',
        tecnologia: 'bg-brand-brown text-brand-brown dark:bg-brand-brown/30 dark:text-brand-brown',
        bienestar: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        servicios: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        otro: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
        general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Convenios Exclusivos</h1>
                    <p className="text-muted-foreground mt-1">
                        Alianzas y beneficios exclusivos para miembros de la comunidad
                    </p>
                </div>
                {profile.role === 'admin' && (
                    <Button asChild>
                        <Link href="/dashboard/admin/agreements">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            Gestionar Convenios
                        </Link>
                    </Button>
                )}
            </div>

            {/* Agreements Grid */}
            {agreements && agreements.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {agreements.map((agreement: ExclusiveAgreement) => (
                        <Card key={agreement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Company Logo */}
                            <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center p-6">
                                {agreement.company_logo_url ? (
                                    <Image
                                        src={agreement.company_logo_url}
                                        alt={agreement.company_name}
                                        fill
                                        className="object-contain p-6"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
                                            <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                            <rect width="20" height="14" x="2" y="6" rx="2" />
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[agreement.category] || CATEGORY_COLORS.otro}`}>
                                        {CATEGORY_LABELS[agreement.category] || agreement.category}
                                    </span>
                                </div>
                            </div>

                            <CardHeader>
                                <CardTitle className="text-lg">{agreement.company_name}</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {agreement.description}
                                </p>

                                {/* Benefits */}
                                {agreement.benefits && agreement.benefits.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Beneficios</p>
                                        <ul className="space-y-1">
                                            {agreement.benefits.slice(0, 3).map((benefit, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mt-0.5 flex-shrink-0">
                                                        <path d="M20 6 9 17l-5-5" />
                                                    </svg>
                                                    {benefit}
                                                </li>
                                            ))}
                                            {agreement.benefits.length > 3 && (
                                                <li className="text-xs text-muted-foreground">+{agreement.benefits.length - 3} más</li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {/* Discount */}
                                {(agreement.discount_code || agreement.discount_percentage) && (
                                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                        {agreement.discount_percentage && (
                                            <p className="text-lg font-bold text-primary">{agreement.discount_percentage}% de descuento</p>
                                        )}
                                        {agreement.discount_code && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground">Código:</span>
                                                <code className="px-2 py-0.5 bg-background border rounded text-sm font-mono font-bold">
                                                    {agreement.discount_code}
                                                </code>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Website Link */}
                                {agreement.website_url && (
                                    <Button asChild variant="outline" className="w-full" size="sm">
                                        <a href={agreement.website_url} target="_blank" rel="noopener noreferrer">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                <polyline points="15 3 21 3 21 9" />
                                                <line x1="10" x2="21" y1="14" y2="3" />
                                            </svg>
                                            Visitar Sitio Web
                                        </a>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50 mb-4">
                            <path d="m11 17 2 2a1 1 0 1 0 3-3" />
                            <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 0 1.42 1.42l.88-.88a1 1 0 0 1 1.42 0Z" />
                            <path d="m19 5-7 7" />
                            <path d="m5 19 7-7" />
                            <path d="m2 2 20 20" />
                        </svg>
                        <h3 className="text-lg font-semibold mb-1">Convenios Próximamente</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-md">
                            Estamos trabajando en alianzas exclusivas para ti. ¡Pronto tendremos novedades!
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

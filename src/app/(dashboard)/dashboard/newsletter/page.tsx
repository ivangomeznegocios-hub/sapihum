import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default async function NewsletterPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        return <div className="p-8 text-center text-muted-foreground">Inicia sesión para ver el newsletter.</div>
    }

    // Get the active newsletter
    const { data: newsletter } = await (supabase
        .from('newsletters') as any)
        .select('*')
        .eq('is_active', true)
        .single()

    // Get past newsletters
    const { data: pastNewsletters } = await (supabase
        .from('newsletters') as any)
        .select('id, title, summary, cover_image_url, month, year, published_at')
        .eq('is_active', false)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
                <p className="text-muted-foreground mt-1">
                    Mantente al día con las últimas noticias y actualizaciones de la comunidad
                </p>
            </div>

            {/* Active Newsletter */}
            {newsletter ? (
                <Card className="overflow-hidden">
                    {newsletter.cover_image_url && (
                        <div className="relative w-full aspect-[21/9] bg-gradient-to-br from-primary/20 to-primary/5">
                            <Image
                                src={newsletter.cover_image_url}
                                alt={newsletter.title}
                                fill
                                className="object-cover"
                                sizes="100vw"
                            />
                        </div>
                    )}
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                {MONTH_NAMES[newsletter.month - 1]} {newsletter.year}
                            </span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full">
                                Edición Actual
                            </span>
                        </div>
                        <CardTitle className="text-2xl">{newsletter.title}</CardTitle>
                        {newsletter.summary && (
                            <p className="text-muted-foreground mt-2">{newsletter.summary}</p>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div
                            className="prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: newsletter.content_html }}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50 mb-4">
                            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                            <path d="M18 14h-8" />
                            <path d="M15 18h-5" />
                            <path d="M10 6h8v4h-8V6Z" />
                        </svg>
                        <h3 className="text-lg font-semibold mb-1">Próximamente</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-md">
                            El newsletter de este mes estará disponible pronto. ¡Mantente atento!
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Past Newsletters */}
            {pastNewsletters && pastNewsletters.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4">Ediciones Anteriores</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pastNewsletters.map((nl: any) => (
                            <Card key={nl.id} className="hover:shadow-md transition-shadow">
                                {nl.cover_image_url && (
                                    <div className="relative aspect-[16/9] bg-gradient-to-br from-muted to-muted/50">
                                        <Image
                                            src={nl.cover_image_url}
                                            alt={nl.title}
                                            fill
                                            className="object-cover rounded-t-lg"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </div>
                                )}
                                <CardHeader className="pb-2">
                                    <span className="text-xs text-muted-foreground">
                                        {MONTH_NAMES[nl.month - 1]} {nl.year}
                                    </span>
                                    <CardTitle className="text-base">{nl.title}</CardTitle>
                                </CardHeader>
                                {nl.summary && (
                                    <CardContent className="pt-0">
                                        <p className="text-sm text-muted-foreground line-clamp-2">{nl.summary}</p>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Admin Link */}
            {profile.role === 'admin' && (
                <div className="pt-4 border-t">
                    <Link
                        href="/dashboard/admin/newsletters"
                        className="text-sm text-primary hover:underline font-medium"
                    >
                        → Gestionar Newsletters (Admin)
                    </Link>
                </div>
            )}
        </div>
    )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, Target } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/guard'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrganicLead } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
    params: Promise<{ id: string }>
}

function formatDate(value: string | null | undefined) {
    if (!value) return '-'

    return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}

function display(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === '') return '-'
    return String(value)
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 break-words text-sm">{display(value)}</p>
        </div>
    )
}

function JsonBlock({ title, value }: { title: string; value: Record<string, any> | null | undefined }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <pre className="max-h-[520px] overflow-auto rounded-md bg-muted p-4 text-xs">
                    {JSON.stringify(value ?? {}, null, 2)}
                </pre>
            </CardContent>
        </Card>
    )
}

export default async function AdminOrganicLeadDetailPage({ params }: PageProps) {
    await requireAdminPage()

    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await (supabase
        .from('organic_leads') as any)
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) throw error
    if (!data) notFound()

    const lead = data as OrganicLead

    return (
        <div className="w-full max-w-6xl space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/admin/organic-leads">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Link>
                    </Button>
                    <div className="flex items-start gap-3">
                        <div className="rounded-md bg-primary p-2.5 text-primary-foreground">
                            <Target className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
                            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                {lead.email}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{lead.lifecycle_stage}</Badge>
                    <Badge variant="secondary">lead_score {lead.score}</Badge>
                    <Badge>{lead.intent}</Badge>
                </div>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardContent className="space-y-4 p-4">
                        <Field label="WhatsApp" value={lead.whatsapp} />
                        <Field label="Pais" value={lead.country} />
                        <Field label="Ciudad" value={lead.city} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="space-y-4 p-4">
                        <Field label="Rol" value={lead.role} />
                        <Field label="Especialidad" value={lead.specialty} />
                        <Field label="Anos de experiencia" value={lead.years_experience} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="space-y-4 p-4">
                        <Field label="Creado" value={formatDate(lead.created_at)} />
                        <Field label="Primera interaccion" value={formatDate(lead.first_engagement_at)} />
                        <Field label="Ultima interaccion" value={formatDate(lead.last_engagement_at)} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="space-y-4 p-4">
                        <Field label="Pagina fuente" value={lead.source_page} />
                        <Field label="Tema fuente" value={lead.source_topic} />
                        <Field label="Asset fuente" value={lead.source_asset} />
                        <Field label="Tipo fuente" value={lead.source_type} />
                    </CardContent>
                </Card>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Tags de interes</CardTitle>
                </CardHeader>
                <CardContent>
                    {lead.interest_tags.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin tags registrados.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {lead.interest_tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <section className="grid gap-6 lg:grid-cols-2">
                <JsonBlock title="UTMs" value={lead.utms} />
                <JsonBlock title="Metadata" value={lead.metadata} />
                <JsonBlock title="Attribution snapshot" value={lead.attribution_snapshot} />
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Historial disponible</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <Field label="Referrer" value={lead.referrer} />
                        <Field label="User ID vinculado" value={lead.user_id} />
                        <Field label="Actualizado" value={formatDate(lead.updated_at)} />
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

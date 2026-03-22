import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import { FileText, FolderOpen } from 'lucide-react'
import { DocumentLinkForm } from './document-link-form'
import { DocumentsList } from './documents-list'

export default async function DocumentsPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    if (profile.role === 'psychologist' && (profile.membership_level ?? 0) < 2) {
        redirect('/dashboard/subscription')
    }

    // Get patients if psychologist
    let patients: { id: string, name: string }[] = []
    if (profile.role === 'psychologist') {
        const { data: rels } = await (supabase
            .from('patient_psychologist_relationships') as any)
            .select(`
                patient:profiles!patient_id (
                    id,
                    full_name
                )
            `)
            .eq('psychologist_id', profile.id)
            .eq('status', 'active')

        if (rels) {
            patients = rels
                .map((r: any) => r.patient as any)
                .filter((p: any): p is { id: string, full_name: string } => p !== null)
                .map((p: { id: string, full_name: string }) => ({
                    id: p.id,
                    name: p.full_name || 'Paciente Sin Nombre'
                }))
        }
    }

    // Get documents
    let documents: any[] = []
    if (profile.role === 'psychologist') {
        const { data: docs } = await (supabase
            .from('patient_documents') as any)
            .select(`
                *,
                patient:profiles!patient_id(full_name)
            `)
            .eq('psychologist_id', profile.id)
            .order('created_at', { ascending: false })

        if (docs) documents = docs
    } else if (profile.role === 'patient') {
        const { data: docs } = await (supabase
            .from('patient_documents') as any)
            .select(`
                *,
                psychologist:profiles!psychologist_id(full_name)
            `)
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false })

        if (docs) documents = docs
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <FileText className="h-8 w-8" />
                        Documentos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Enlaces y documentos compartidos de forma segura
                    </p>
                </div>
                {profile.role === 'psychologist' && (
                    <DocumentLinkForm patients={patients} />
                )}
            </div>

            {/* Content Segment */}
            <Card>
                <CardHeader>
                    <CardTitle>Tus Documentos</CardTitle>
                    <CardDescription>
                        Visualiza los enlaces a documentos que han sido compartidos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DocumentsList
                        documents={documents as any}
                        isPsychologist={profile.role === 'psychologist'}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

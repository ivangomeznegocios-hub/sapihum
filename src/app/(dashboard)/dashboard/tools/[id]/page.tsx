import { getAssignmentWithTool } from '@/lib/supabase/queries/tools'
import { getUserProfile } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ToolRenderer } from './tool-renderer'
import { ToolResultsView } from './tool-results'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ToolExecutionPage({ params }: PageProps) {
    const { id } = await params
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/dashboard')
    }

    const assignment = await getAssignmentWithTool(id)

    if (!assignment || !assignment.tool) {
        notFound()
    }

    // Patient can only see their own assignments
    if (profile.role === 'patient' && assignment.patient_id !== profile.id) {
        redirect('/dashboard/tools')
    }

    // Psychologist can only see assignments they created
    if (profile.role === 'psychologist' && assignment.psychologist_id !== profile.id) {
        redirect('/dashboard/patients')
    }

    const isCompleted = assignment.status === 'completed'
    const isPatient = profile.role === 'patient'

    // If completed, show results view
    if (isCompleted) {
        const canSeeResults = !isPatient || assignment.results_visible
        return (
            <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={isPatient ? '/dashboard/tools' : `/dashboard/patients/${assignment.patient_id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">{assignment.tool.title}</h1>
                        <p className="text-sm text-muted-foreground">Resultados</p>
                    </div>
                </div>

                <ToolResultsView
                    assignment={assignment}
                    canSeeResults={canSeeResults}
                />
            </div>
        )
    }

    // If not completed and it's a patient, show the renderer
    if (isPatient) {
        return (
            <div className="max-w-3xl mx-auto">
                <ToolRenderer assignment={assignment} />
            </div>
        )
    }

    // If psychologist viewing a pending tool, redirect to patient page
    redirect(`/dashboard/patients/${assignment.patient_id}`)
}

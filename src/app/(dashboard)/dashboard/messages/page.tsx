import { createClient, getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from './components/chat-interface'
import { MessageSquare } from 'lucide-react'

export default async function MessagesPage() {
    const supabase = await createClient()
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    // Determine who the user can chat with using a safe two-step fetch
    // to avoid potential Foreign Key constraint naming issues
    let contacts: any[] = []

    if (profile.role === 'patient') {
        // Patients can chat with their assigned psychologist
        const { data: relationship } = await (supabase
            .from('patient_psychologist_relationships') as any)
            .select('psychologist_id')
            .eq('patient_id', profile.id)
            .eq('status', 'active')
            .single()

        if (relationship?.psychologist_id) {
            const { data: psychologist } = await (supabase
                .from('profiles') as any)
                .select('id, full_name, avatar_url, role')
                .eq('id', relationship.psychologist_id)
                .single()

            if (psychologist) {
                contacts = [psychologist]
            }
        }
    } else if (profile.role === 'psychologist') {
        // Psychologists can chat with their active patients
        const { data: relationships } = await (supabase
            .from('patient_psychologist_relationships') as any)
            .select('patient_id')
            .eq('psychologist_id', profile.id)
            .eq('status', 'active')

        const patientIds = relationships?.map((r: any) => r.patient_id) || []

        if (patientIds.length > 0) {
            const { data: patients } = await (supabase
                .from('profiles') as any)
                .select('id, full_name, avatar_url, role')
                .in('id', patientIds)

            if (patients) {
                contacts = patients
            }
        }
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="mb-4">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <MessageSquare className="h-8 w-8" />
                    Mensajes
                </h1>
            </div>

            <div className="flex-1 border rounded-xl overflow-hidden shadow-sm bg-background">
                <ChatInterface
                    currentUser={profile}
                    initialContacts={contacts}
                />
            </div>
        </div>
    )
}

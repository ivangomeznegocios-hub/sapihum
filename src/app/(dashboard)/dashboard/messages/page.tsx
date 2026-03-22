import { getUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from './components/chat-interface'
import { MessageSquare } from 'lucide-react'
import {
    getActivePatientsForPsychologist,
    getAssignedPsychologistForPatient,
} from '@/lib/supabase/queries/relationships'

export default async function MessagesPage() {
    const profile = await getUserProfile()

    if (!profile) {
        redirect('/auth/login')
    }

    let contacts: any[] = []

    if (profile.role === 'patient') {
        const psychologist = await getAssignedPsychologistForPatient(profile.id)

        if (psychologist) {
            contacts = [psychologist]
        }
    } else if (profile.role === 'psychologist') {
        contacts = await getActivePatientsForPsychologist(profile.id)
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

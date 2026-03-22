'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(receiverId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    if (!content.trim()) return { error: 'Mensaje vacío' }

    const { error } = await (supabase
        .from('messages') as any)
        .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content: content
        } as any)

    if (error) {
        console.error('Error sending message:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/messages')
    return { success: true }
}

export async function markAsRead(messageIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    const { error } = await (supabase
        .from('messages') as any)
        .update({ is_read: true } as any)
        .in('id', messageIds)
        .eq('receiver_id', user.id)

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function getConversation(otherUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: messages, error } = await (supabase
        .from('messages') as any)
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching conversation:', error)
        return []
    }

    return messages
}

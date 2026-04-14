'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendPushNotification } from '@/lib/onesignal'
import { createUserNotification } from '@/lib/notifications'

export async function sendMessage(receiverId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autenticado' }

    if (!content.trim()) return { error: 'Mensaje vacio' }

    const { error } = await (supabase
        .from('messages') as any)
        .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content: content,
        } as any)

    if (error) {
        console.error('Error sending message:', error)
        return { error: error.message }
    }

    const { data: senderProfile } = await (supabase
        .from('profiles') as any)
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle()

    await sendPushNotification({
        title: 'Nuevo mensaje',
        message: `${senderProfile?.full_name || 'Tu contacto'} te envio un mensaje.`,
        targetExternalId: receiverId,
        url: '/dashboard/messages',
    })

    try {
        await createUserNotification({
            userId: receiverId,
            category: 'messages',
            level: 'info',
            kind: 'message_received',
            title: 'Nuevo mensaje',
            body: `${senderProfile?.full_name || 'Tu contacto'} te escribio por el chat interno.`,
            actionUrl: '/dashboard/messages',
            metadata: {
                senderId: user.id,
            },
        })
    } catch (notificationError) {
        console.error('Error creating internal message notification:', notificationError)
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

    revalidatePath('/dashboard/messages')
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

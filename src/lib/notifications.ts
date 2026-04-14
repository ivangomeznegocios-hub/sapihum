import { createServiceClient } from '@/lib/supabase/service'
import type { Database, NotificationCategory, NotificationLevel } from '@/types/database'

type NotificationsTable = Database['public']['Tables']['user_notifications']

export interface CreateUserNotificationInput {
    userId: string
    title: string
    body: string
    category?: NotificationCategory
    level?: NotificationLevel
    kind?: string
    actionUrl?: string | null
    metadata?: Record<string, unknown>
    dedupeKey?: string | null
    supabase?: ReturnType<typeof createServiceClient>
}

function normalizeActionUrl(actionUrl?: string | null) {
    if (!actionUrl) {
        return null
    }

    if (actionUrl.startsWith('/')) {
        return actionUrl
    }

    return `/${actionUrl.replace(/^\/+/, '')}`
}

function buildNotificationInsertPayload(
    input: CreateUserNotificationInput
): NotificationsTable['Insert'] {
    return {
        user_id: input.userId,
        title: input.title.trim(),
        body: input.body.trim(),
        category: input.category ?? 'system',
        level: input.level ?? 'info',
        kind: input.kind ?? 'generic',
        action_url: normalizeActionUrl(input.actionUrl),
        metadata: input.metadata ?? {},
        dedupe_key: input.dedupeKey ?? null,
    }
}

export async function createUserNotification(input: CreateUserNotificationInput) {
    if (!input.userId || !input.title.trim() || !input.body.trim()) {
        return
    }

    const supabase = input.supabase ?? createServiceClient()
    const payload = buildNotificationInsertPayload(input)

    if (payload.dedupe_key) {
        const { error } = await (supabase.from('user_notifications') as any).upsert(payload, {
            onConflict: 'dedupe_key',
            ignoreDuplicates: true,
        })

        if (error) {
            throw error
        }

        return
    }

    const { error } = await (supabase.from('user_notifications') as any).insert(payload)

    if (error) {
        throw error
    }
}

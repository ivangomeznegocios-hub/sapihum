'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Bell,
    CalendarDays,
    CheckCheck,
    CreditCard,
    Loader2,
    MessageSquare,
    Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Database, NotificationCategory, NotificationLevel } from '@/types/database'

type UserNotification = Database['public']['Tables']['user_notifications']['Row']

interface NotificationsBellProps {
    userId?: string | null
}

async function readNotificationSnapshot(supabase: ReturnType<typeof createClient>, userId: string) {
    const [listResult, countResult] = await Promise.all([
        (supabase
            .from('user_notifications') as any)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(12),
        (supabase
            .from('user_notifications') as any)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false),
    ])

    if (listResult.error) {
        throw listResult.error
    }

    if (countResult.error) {
        throw countResult.error
    }

    return {
        notifications: (listResult.data ?? []) as UserNotification[],
        unreadCount: countResult.count ?? 0,
    }
}

function formatNotificationTime(value: string) {
    const parsedDate = new Date(value)
    const diffMs = Date.now() - parsedDate.getTime()

    if (!Number.isFinite(diffMs)) {
        return ''
    }

    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

    if (diffMinutes < 1) {
        return 'Ahora'
    }

    if (diffMinutes < 60) {
        return `Hace ${diffMinutes} min`
    }

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) {
        return `Hace ${diffHours} h`
    }

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) {
        return `Hace ${diffDays} d`
    }

    return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'short',
    }).format(parsedDate)
}

function getCategoryLabel(category: NotificationCategory) {
    switch (category) {
        case 'messages':
            return 'Mensaje'
        case 'calendar':
            return 'Agenda'
        case 'events':
            return 'Evento'
        case 'payments':
            return 'Compra'
        default:
            return 'Sistema'
    }
}

function getCategoryIcon(category: NotificationCategory) {
    switch (category) {
        case 'messages':
            return MessageSquare
        case 'calendar':
        case 'events':
            return CalendarDays
        case 'payments':
            return CreditCard
        default:
            return Sparkles
    }
}

function getLevelStyles(level: NotificationLevel) {
    switch (level) {
        case 'success':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
        case 'warning':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
        case 'error':
            return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
    }
}

export function NotificationsBell({ userId }: NotificationsBellProps) {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const [notifications, setNotifications] = useState<UserNotification[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [markingAll, setMarkingAll] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    async function refreshNotifications(showLoader = false) {
        if (!userId) {
            setNotifications([])
            setUnreadCount(0)
            setLoading(false)
            return
        }

        if (showLoader) {
            setLoading(true)
        }

        try {
            const snapshot = await readNotificationSnapshot(supabase, userId)
            setNotifications(snapshot.notifications)
            setUnreadCount(snapshot.unreadCount)
        } catch (error) {
            console.error('Error loading internal notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let isActive = true

        async function loadInitialNotifications() {
            if (!userId) {
                setNotifications([])
                setUnreadCount(0)
                setLoading(false)
                return
            }

            setLoading(true)

            try {
                const snapshot = await readNotificationSnapshot(supabase, userId)
                if (!isActive) {
                    return
                }

                setNotifications(snapshot.notifications)
                setUnreadCount(snapshot.unreadCount)
            } catch (error) {
                if (!isActive) {
                    return
                }

                console.error('Error loading internal notifications:', error)
            } finally {
                if (isActive) {
                    setLoading(false)
                }
            }
        }

        void loadInitialNotifications()

        return () => {
            isActive = false
        }
    }, [supabase, userId])

    useEffect(() => {
        if (!userId) {
            return
        }

        const syncFromRealtime = async () => {
            try {
                const snapshot = await readNotificationSnapshot(supabase, userId)
                setNotifications(snapshot.notifications)
                setUnreadCount(snapshot.unreadCount)
            } catch (error) {
                console.error('Error syncing internal notifications:', error)
            }
        }

        const channel = supabase
            .channel(`user-notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    void syncFromRealtime()
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [supabase, userId])

    async function markNotificationAsRead(notificationId: string) {
        if (!userId) {
            return
        }

        const readAt = new Date().toISOString()

        const { error } = await (supabase
            .from('user_notifications') as any)
            .update({
                is_read: true,
                read_at: readAt,
            })
            .eq('id', notificationId)
            .eq('user_id', userId)

        if (error) {
            console.error('Error marking notification as read:', error)
            return
        }

        setNotifications((current) =>
            current.map((notification) =>
                notification.id === notificationId
                    ? {
                        ...notification,
                        is_read: true,
                        read_at: readAt,
                    }
                    : notification
            )
        )
        setUnreadCount((current) => Math.max(0, current - 1))
    }

    async function handleNotificationClick(notification: UserNotification) {
        if (!notification.is_read) {
            await markNotificationAsRead(notification.id)
        }

        if (notification.action_url) {
            setIsOpen(false)
            router.push(notification.action_url)
        }
    }

    async function markAllAsRead() {
        if (!userId || unreadCount === 0 || markingAll) {
            return
        }

        setMarkingAll(true)
        const readAt = new Date().toISOString()

        try {
            const { error } = await (supabase
                .from('user_notifications') as any)
                .update({
                    is_read: true,
                    read_at: readAt,
                })
                .eq('user_id', userId)
                .eq('is_read', false)

            if (error) {
                throw error
            }

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    is_read: true,
                    read_at: notification.read_at ?? readAt,
                }))
            )
            setUnreadCount(0)
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
        } finally {
            setMarkingAll(false)
        }
    }

    const unreadBadge = unreadCount > 9 ? '9+' : unreadCount.toString()

    return (
        <DropdownMenu
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open)
                if (open) {
                    void refreshNotifications()
                }
            }}
        >
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 shrink-0"
                    disabled={!userId}
                    aria-label="Ver notificaciones"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {unreadBadge}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[min(24rem,calc(100vw-1.25rem))] overflow-hidden p-0"
            >
                <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold">Notificaciones</p>
                        <p className="text-xs text-muted-foreground">
                            Mensajes, compras, eventos y recordatorios en un solo lugar.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 px-2 text-xs"
                        onClick={() => void markAllAsRead()}
                        disabled={unreadCount === 0 || markingAll}
                    >
                        {markingAll ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <>
                                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                                Marcar todo
                            </>
                        )}
                    </Button>
                </div>

                {loading ? (
                    <div className="flex min-h-36 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="space-y-2 px-4 py-8 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Aun no tienes notificaciones</p>
                        <p className="text-xs text-muted-foreground">
                            Cuando haya actividad en compras, eventos, mensajes o agenda, aparecera aqui.
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[26rem]">
                        <div className="divide-y">
                            {notifications.map((notification) => {
                                const NotificationIcon = getCategoryIcon(notification.category)

                                return (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        onClick={() => void handleNotificationClick(notification)}
                                        className={cn(
                                            'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/60',
                                            !notification.is_read && 'bg-primary/5'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                                                getLevelStyles(notification.level)
                                            )}
                                        >
                                            <NotificationIcon className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium leading-none">
                                                            {notification.title}
                                                        </span>
                                                        {!notification.is_read && (
                                                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                                                        )}
                                                    </div>
                                                    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                        {getCategoryLabel(notification.category)}
                                                    </span>
                                                </div>

                                                <span className="shrink-0 text-[11px] text-muted-foreground">
                                                    {formatNotificationTime(notification.created_at)}
                                                </span>
                                            </div>

                                            <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                                                {notification.body}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}

                <div className="border-t px-4 py-2 text-[11px] text-muted-foreground">
                    La campana funciona dentro del dashboard; el push del navegador se configura aparte.
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

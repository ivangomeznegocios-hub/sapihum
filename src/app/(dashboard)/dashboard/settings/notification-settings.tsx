'use client'

import { useEffect, useState } from 'react'
import OneSignal from 'react-onesignal'
import { Bell, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface NotificationPreferences {
    emailNotifications: boolean
    sessionReminders: boolean
    pushNotifications: boolean
}

const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim()

function getDefaults(): NotificationPreferences {
    return { emailNotifications: true, sessionReminders: true, pushNotifications: false }
}

export function NotificationSettings() {
    const [prefs, setPrefs] = useState<NotificationPreferences>(getDefaults)
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const supabase = createClient()
    const isPushAvailable = Boolean(oneSignalAppId)

    useEffect(() => {
        setMounted(true)

        async function fetchPreferences() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data, error } = await supabase
                    .from('profiles')
                    .select('email_notifications, session_reminders')
                    .eq('id', user.id)
                    .single()

                const isPushEnabled = isPushAvailable && OneSignal.Notifications.permission === true

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching preferences:', error)
                    return
                }

                if (data) {
                    setPrefs({
                        emailNotifications: data.email_notifications ?? true,
                        sessionReminders: data.session_reminders ?? true,
                        pushNotifications: isPushEnabled,
                    })
                } else {
                    setPrefs((current) => ({
                        ...current,
                        pushNotifications: isPushEnabled,
                    }))
                }
            } catch (error) {
                console.error('Failed to load preferences:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPreferences()
    }, [isPushAvailable, supabase])

    async function toggle(key: keyof NotificationPreferences) {
        if (saving || loading) return

        if (key === 'pushNotifications') {
            await handlePushToggle()
            return
        }

        setSaving(true)
        const newPrefs = { ...prefs, [key]: !prefs[key] }
        setPrefs(newPrefs)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('No se encontro el usuario actual.')
                setSaving(false)
                return
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    email_notifications: newPrefs.emailNotifications,
                    session_reminders: newPrefs.sessionReminders,
                })
                .eq('id', user.id)

            if (error) {
                throw error
            }

            toast.success('Preferencias actualizadas correctamente')
        } catch (error) {
            console.error('Error updating preferences:', error)
            toast.error('Error al actualizar las preferencias')
            setPrefs(prefs)
        } finally {
            setSaving(false)
        }
    }

    async function handlePushToggle() {
        if (!isPushAvailable) {
            toast.info('Las notificaciones push no estan disponibles todavia.')
            return
        }

        setSaving(true)
        try {
            if (prefs.pushNotifications) {
                toast.info('Para desactivar, hazlo desde los permisos del navegador.')
                setSaving(false)
                return
            }

            await OneSignal.Slidedown.promptPush()

            const isPushEnabled = OneSignal.Notifications.permission === true
            setPrefs((current) => ({ ...current, pushNotifications: isPushEnabled }))

            if (isPushEnabled) {
                toast.success('Notificaciones push habilitadas.')
            } else {
                toast.error('Permiso denegado por el navegador')
            }
        } catch (error) {
            console.error('Error toggling push', error)
            toast.error('Ocurrio un error al configurar push')
        } finally {
            setSaving(false)
        }
    }

    if (!mounted) return null

    return (
        <Card className="relative">
            <CardHeader>
                <CardTitle className="ml-0 flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificaciones
                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                    Configura como recibes alertas
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                        <p className="font-medium">Notificaciones por email</p>
                        <p className="text-sm text-muted-foreground">
                            Recibe recordatorios de citas por correo
                        </p>
                    </div>
                    <button
                        onClick={() => toggle('emailNotifications')}
                        disabled={loading || saving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 ${prefs.emailNotifications ? 'bg-primary' : 'bg-muted'}`}
                        role="switch"
                        aria-checked={prefs.emailNotifications}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                        <p className="font-medium">Recordatorios de sesion</p>
                        <p className="text-sm text-muted-foreground">
                            24 horas antes de cada cita
                        </p>
                    </div>
                    <button
                        onClick={() => toggle('sessionReminders')}
                        disabled={loading || saving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 ${prefs.sessionReminders ? 'bg-primary' : 'bg-muted'}`}
                        role="switch"
                        aria-checked={prefs.sessionReminders}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs.sessionReminders ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-blue-50/50 p-3 dark:bg-blue-950/20">
                    <div>
                        <p className="flex items-center gap-2 font-medium text-blue-900 dark:text-blue-100">
                            Notificaciones Push (Navegador)
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-blue-900">
                                Nuevo
                            </span>
                        </p>
                        <p className="text-sm text-blue-700/80 dark:text-blue-200/70">
                            {isPushAvailable
                                ? 'Alertas instantaneas en tu dispositivo'
                                : 'Disponible cuando OneSignal este configurado'}
                        </p>
                    </div>
                    <button
                        onClick={() => toggle('pushNotifications')}
                        disabled={loading || saving || !isPushAvailable}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 ${prefs.pushNotifications ? 'bg-primary' : 'bg-muted'}`}
                        role="switch"
                        aria-checked={prefs.pushNotifications}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs.pushNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}

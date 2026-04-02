import { createClient, getUserProfile } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import { ProfileForm, PasswordForm, PsychologistProfileForm } from './settings-forms'
import { NotificationSettings } from './notification-settings'
import { SpeakerProfileForm } from './speaker-profile-form'
import { CalendarConnectionsCard } from '@/components/calendar/calendar-connections-card'
import { isGoogleCalendarSyncAvailable } from '@/lib/calendar-sync'
import { ThemeSwitcher } from './theme-switcher'
import { TimezoneSelector } from '@/components/timezone-selector'
import { getMembershipLabel, getMembershipTier } from '@/lib/membership'
import Link from 'next/link'
import {
    Settings,
    LogOut,
    ArrowRight,
    ShieldAlert
} from 'lucide-react'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function readSingleParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value
}

function getCalendarNoticeMessage(notice: string | undefined) {
    switch (notice) {
        case 'google_connected':
            return {
                tone: 'success',
                text: 'Google Calendar quedó conectado. La plataforma ya puede revisar tu ocupación externa antes de nuevas reservas.',
            }
        case 'google_denied':
            return {
                tone: 'error',
                text: 'Cancelaste la conexión con Google Calendar antes de completarla.',
            }
        case 'google_state_error':
            return {
                tone: 'error',
                text: 'La conexión con Google Calendar no pudo validarse. Intenta de nuevo.',
            }
        case 'google_not_configured':
            return {
                tone: 'error',
                text: 'La conexion con Google Calendar todavia no esta disponible en este entorno.',
            }
        case 'google_error':
            return {
                tone: 'error',
                text: 'No fue posible completar la conexión con Google Calendar. Revisa la configuración e inténtalo de nuevo.',
            }
        case 'google_unavailable':
            return {
                tone: 'error',
                text: 'La sincronizacion de Google Calendar todavia no esta habilitada para usuarios.',
            }
        default:
            return null
    }
}

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
    const profile = await getUserProfile()
    const params = await searchParams

    if (!profile) {
        redirect('/auth/login')
    }

    const membershipLevel = profile.membership_level ?? 0
    const membershipSpecialization = (profile as any).membership_specialization_code as string | null
    const calendarSyncAvailable = (profile.role === 'psychologist' || profile.role === 'ponente')
        ? await isGoogleCalendarSyncAvailable()
        : false

    // Get speaker profile for ponentes/admins
    let speakerProfile = null
    if (profile.role === 'ponente' || profile.role === 'admin') {
        const supabase2 = await createClient()
        const { data } = await (supabase2.from('speakers') as any)
            .select('*')
            .eq('id', profile.id)
            .single()
        speakerProfile = data
    }

    const calendarNotice = getCalendarNoticeMessage(readSingleParam(params.calendar_notice))

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Settings className="h-8 w-8" />
                    Configuración
                </h1>
                <p className="text-muted-foreground mt-1">
                    Administra tu cuenta y preferencias
                </p>
            </div>

            {calendarNotice && (
                <Card className={calendarNotice.tone === 'success'
                    ? 'border-green-200 bg-green-50/70 dark:border-green-900/50 dark:bg-green-950/20'
                    : 'border-red-200 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/20'}>
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium">
                            {calendarNotice.text}
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Settings Sections */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Form */}
                    {profile.role === 'psychologist' ? (
                        <PsychologistProfileForm profile={profile} />
                    ) : (
                        <ProfileForm profile={profile} />
                    )}

                    {/* Password Form */}
                    <PasswordForm />

                    {/* Notification Settings */}
                    <NotificationSettings />

                    {calendarSyncAvailable && (
                        <CalendarConnectionsCard
                            userId={profile.id}
                            role={profile.role}
                            calendarFeedToken={profile.calendar_feed_token || null}
                        />
                    )}

                    {/* Speaker Profile (for ponentes & admins) */}
                    {(profile.role === 'ponente' || profile.role === 'admin') && (
                        <SpeakerProfileForm speaker={speakerProfile} userId={profile.id} showSocialLinks={!!speakerProfile?.social_links_enabled || profile.role === 'admin'} />
                    )}

                    {/* Privacy & Data Rights Advanced */}
                    <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-orange-800 dark:text-orange-300">
                                <ShieldAlert className="w-5 h-5" />
                                Privacidad y Datos Sensibles
                            </CardTitle>
                            <CardDescription className="text-orange-700/80 dark:text-orange-300/80">
                                Controles avanzados para la gestión de tus datos personales, exportación y derechos ARCO.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/dashboard/settings/privacy">
                                <Button variant="outline" className="w-full sm:w-auto border-orange-300 hover:bg-orange-100 dark:border-orange-800 dark:hover:bg-orange-900 text-orange-800 dark:text-orange-300">
                                    Acceder a Controles de Privacidad
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Membership Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Membresía</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center">
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${membershipLevel >= 1
                                    ? 'surface-alert-success dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}>
                                    {getMembershipLabel(membershipLevel)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {profile.role === 'patient'
                                        ? 'Acceso a recursos y citas'
                                        : membershipLevel === 0
                                            ? 'Perfil básico sin membresía activa'
                                            : membershipLevel === 1
                                                ? 'Acceso a eventos, grabaciones, formaciones y toda la comunidad'
                                                : getMembershipTier(membershipLevel).description}
                                </p>
                                {membershipSpecialization && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Especializacion activa: {membershipSpecialization}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timezone */}
                    <TimezoneSelector
                        currentTimezone={(profile as any).timezone || 'America/Mexico_City'}
                        userId={profile.id}
                    />

                    {/* Theme */}
                    <ThemeSwitcher />

                    {/* Danger Zone */}
                    <Card className="border-red-200 dark:border-red-900">

                        <CardHeader>
                            <CardTitle className="text-lg text-red-600">Zona de peligro</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <form action="/auth/signout" method="post">
                                <Button
                                    variant="outline"
                                    className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                    type="submit"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Cerrar sesión
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}



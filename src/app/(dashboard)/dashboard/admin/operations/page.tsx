import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { requireOperationsPage } from '@/lib/admin/guard'
import { getProfileOperationsView, getPurchaseOperationsView, searchBackoffice } from '@/lib/admin/operations'
import { GOOGLE_CALENDAR_FEATURE_KEY, isGoogleCalendarConfigured } from '@/lib/calendar-sync'
import { getMembershipOperationsSnapshot } from '@/lib/membership-entitlements'
import {
    addAdminNoteAction,
    extendEntitlementAction,
    grantEntitlementAction,
    mergeCommerceIdentityAction,
    regenerateMembershipEntitlementsAction,
    relinkPurchaseIdentityAction,
    retryFulfillmentAction,
    revokeEntitlementAction,
    sendAccessMagicLinkAction,
} from './actions'
import { GoogleCalendarSyncToggle } from './calendar-sync-toggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Search,
    UserCog,
    ShieldCheck,
    RefreshCcw,
    Link2,
    Ticket,
    CreditCard,
    Mail,
    History,
    FileText,
} from 'lucide-react'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
}

function formatDate(value: string | null | undefined) {
    if (!value) return 'Sin fecha'
    return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}

function statusVariant(status: string | null | undefined) {
    switch (status) {
        case 'active':
        case 'confirmed':
        case 'fulfilled':
        case 'eligible':
            return 'default' as const
        case 'revoked':
        case 'cancelled':
        case 'expired':
        case 'ineligible':
            return 'destructive' as const
        default:
            return 'secondary' as const
    }
}

function buildReturnTo(query?: string, userId?: string | null, purchaseId?: string | null) {
    const search = new URLSearchParams()
    if (query) search.set('q', query)
    if (userId) search.set('user', userId)
    if (purchaseId) search.set('purchase', purchaseId)
    const suffix = search.toString()
    return `/dashboard/admin/operations${suffix ? `?${suffix}` : ''}`
}

function renderAttribution(summary: any) {
    if (!summary) {
        return <span className="text-xs text-muted-foreground">Sin atribucion</span>
    }

    return (
        <div className="text-xs text-muted-foreground">
            <div>{summary.source || 'direct'} / {summary.medium || 'none'}</div>
            <div>{summary.campaign || 'sin-campana'}</div>
            <div>{summary.landingPath || summary.referrer || 'sin-landing'}</div>
        </div>
    )
}

export default async function AdminOperationsPage({ searchParams }: { searchParams: SearchParams }) {
    const viewer = await requireOperationsPage()
    const params = await searchParams
    const query = readParam(params, 'q')?.trim() || ''
    const selectedUserId = readParam(params, 'user') || null
    const selectedPurchaseId = readParam(params, 'purchase') || null
    const notice = readParam(params, 'notice')
    const error = readParam(params, 'error')
    const returnTo = buildReturnTo(query, selectedUserId, selectedPurchaseId)

    const admin = createServiceClient()
    const { data: recentEvents } = await (admin
        .from('events') as any)
        .select('id, title, slug, event_type, status, start_time')
        .not('status', 'eq', 'draft')
        .order('start_time', { ascending: false })
        .limit(50)
    const { data: googleCalendarSyncSetting } = await (admin
        .from('platform_settings') as any)
        .select('value')
        .eq('key', GOOGLE_CALENDAR_FEATURE_KEY)
        .maybeSingle()

    const searchResults = query ? await searchBackoffice(query) : { profiles: [], purchases: [] }
    const profileView = selectedUserId ? await getProfileOperationsView(selectedUserId) : null
    const membershipView = selectedUserId ? await getMembershipOperationsSnapshot(selectedUserId) : null
    const purchaseView = selectedPurchaseId ? await getPurchaseOperationsView(selectedPurchaseId) : null

    if (selectedUserId && !profileView) {
        redirect('/dashboard/admin/operations?error=Persona+no+encontrada')
    }

    if (selectedPurchaseId && !purchaseView) {
        redirect('/dashboard/admin/operations?error=Compra+no+encontrada')
    }

    const googleCalendarSyncEnabled = googleCalendarSyncSetting?.value === true || googleCalendarSyncSetting?.value === 'true'
    const googleCalendarOauthConfigured = isGoogleCalendarConfigured()

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                        <ShieldCheck className="h-8 w-8" />
                        Operaciones de Acceso
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Resuelve compras, accesos, membresias y casos manuales sin tocar SQL.
                    </p>
                </div>
                {viewer.profile.role === 'admin' ? (
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/dashboard/admin/users">Usuarios</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/dashboard/admin/analytics">Analytics</Link>
                        </Button>
                    </div>
                ) : null}
            </div>

            {notice ? (
                <div className="rounded-lg border border-brand-brown bg-brand-brown px-4 py-3 text-sm text-brand-brown">
                    {notice}
                </div>
            ) : null}
            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                    {error}
                </div>
            ) : null}

            {viewer.profile.role === 'admin' ? (
                <GoogleCalendarSyncToggle
                    currentValue={googleCalendarSyncEnabled}
                    oauthConfigured={googleCalendarOauthConfigured}
                />
            ) : null}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Buscar personas o compras
                    </CardTitle>
                    <CardDescription>
                        Busca por email, `user_id`, nombre, `purchase_id`, referencia de pago o session id.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-3 md:flex-row">
                        <Input name="q" defaultValue={query} placeholder="correo@dominio.com, nombre, purchase id, payment intent..." />
                        <Button type="submit">Buscar</Button>
                    </form>
                </CardContent>
            </Card>

            {query ? (
                <div className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personas</CardTitle>
                            <CardDescription>{searchResults.profiles.length} coincidencias</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {searchResults.profiles.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Sin resultados de personas.</p>
                            ) : searchResults.profiles.map((profile: any) => (
                                <div key={profile.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="min-w-0">
                                        <div className="font-medium">{profile.full_name || 'Sin nombre'}</div>
                                        <div className="text-xs text-muted-foreground">{profile.email || profile.id}</div>
                                        <div className="mt-1 flex gap-2">
                                            <Badge variant="secondary">{profile.role}</Badge>
                                            <Badge variant="outline">Nivel {profile.membership_level ?? 0}</Badge>
                                            <Badge variant={statusVariant(profile.subscription_status)}>{profile.subscription_status || 'sin-suscripcion'}</Badge>
                                        </div>
                                    </div>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={buildReturnTo(query, profile.id, null)}>Abrir</Link>
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Compras</CardTitle>
                            <CardDescription>{searchResults.purchases.length} coincidencias</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {searchResults.purchases.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Sin resultados de compras.</p>
                            ) : searchResults.purchases.map((purchase: any) => (
                                <div key={purchase.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="min-w-0">
                                        <div className="font-medium">{purchase.event?.title || 'Compra sin evento'}</div>
                                        <div className="text-xs text-muted-foreground">{purchase.email} · {purchase.id}</div>
                                        <div className="mt-1 flex gap-2">
                                            <Badge variant={statusVariant(purchase.status)}>{purchase.status}</Badge>
                                            <Badge variant="outline">${Number(purchase.amount_paid || 0).toFixed(2)} {purchase.currency}</Badge>
                                        </div>
                                    </div>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={buildReturnTo(query, purchase.user_id, purchase.id)}>Abrir</Link>
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            ) : null}

            {profileView ? (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCog className="h-5 w-5" />
                                Persona
                            </CardTitle>
                            <CardDescription>
                                Identidad, perfil, membresia, compras y accesos consolidados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 lg:grid-cols-3">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">{profileView.profile.full_name || 'Sin nombre'}</div>
                                <div className="text-sm text-muted-foreground">{profileView.profile.email || profileView.profile.id}</div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary">{profileView.profile.role}</Badge>
                                    <Badge variant="outline">Nivel {profileView.profile.membership_level ?? 0}</Badge>
                                    <Badge variant={statusVariant(profileView.profile.subscription_status)}>{profileView.profile.subscription_status || 'sin-suscripcion'}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">user_id: {profileView.profile.id}</div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">Suscripcion activa:</span>{' '}
                                    {membershipView?.subscription ? `${membershipView.subscription.status} / nivel ${membershipView.subscription.membership_level}` : 'No'}
                                </div>
                                <div>
                                    <span className="font-medium">Entitlements derivados:</span>{' '}
                                    {membershipView?.derivedEntitlements.length ?? 0}
                                </div>
                                <div>
                                    <span className="font-medium">Orfanos por email:</span>{' '}
                                    {profileView.orphanCounts.entitlements} accesos, {profileView.orphanCounts.purchases} compras
                                </div>
                                <div>
                                    <span className="font-medium">Duplicados por email:</span>{' '}
                                    {profileView.duplicateProfiles.length}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <form action={sendAccessMagicLinkAction} className="flex gap-2">
                                    <input type="hidden" name="returnTo" value={returnTo} />
                                    <input type="hidden" name="email" value={profileView.profile.email || ''} />
                                    <input type="hidden" name="nextPath" value="/mi-acceso" />
                                    <Button type="submit" variant="outline" className="w-full">
                                        <Mail className="h-4 w-4" />
                                        Reenviar magic link
                                    </Button>
                                </form>
                                <form action={regenerateMembershipEntitlementsAction} className="flex gap-2">
                                    <input type="hidden" name="returnTo" value={returnTo} />
                                    <input type="hidden" name="userId" value={profileView.profile.id} />
                                    <Button type="submit" variant="outline" className="w-full">
                                        <RefreshCcw className="h-4 w-4" />
                                        Regenerar membresia
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>

                    {membershipView?.issues?.length ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Inconsistencias detectadas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {membershipView.issues.map((issue) => (
                                    <div key={issue} className="rounded-lg border border-brand-yellow bg-brand-yellow px-4 py-3 text-sm text-brand-yellow">
                                        {issue}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : null}

                    {profileView.duplicateProfiles.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Posibles duplicados</CardTitle>
                                <CardDescription>Perfiles con el mismo correo que conviene revisar antes de fusionar.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {profileView.duplicateProfiles.map((profile: any) => (
                                    <div key={profile.id} className="rounded-lg border p-3 text-sm">
                                        <div className="font-medium">{profile.full_name || 'Sin nombre'}</div>
                                        <div className="text-muted-foreground">{profile.email || profile.id}</div>
                                        <div className="mt-1">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={buildReturnTo(query, profile.id, null)}>Abrir perfil</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : null}

                    <div className="grid gap-4 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Grant manual</CardTitle>
                                <CardDescription>Otorga acceso con origen trazable y vigencia opcional.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={grantEntitlementAction} className="space-y-3">
                                    <input type="hidden" name="returnTo" value={returnTo} />
                                    <input type="hidden" name="targetUserId" value={profileView.profile.id} />
                                    <input type="hidden" name="targetEmail" value={profileView.profile.email || ''} />
                                    <select name="eventId" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                                        <option value="">Selecciona un activo</option>
                                        {(recentEvents ?? []).map((event: any) => (
                                            <option key={event.id} value={event.id}>
                                                {event.title} · {event.event_type} · {event.status}
                                            </option>
                                        ))}
                                    </select>
                                    <select name="sourceType" defaultValue="support" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                                        <option value="support">Soporte</option>
                                        <option value="gift">Regalo</option>
                                        <option value="alliance">Alianza</option>
                                        <option value="migration">Migracion</option>
                                        <option value="manual">Ajuste manual</option>
                                    </select>
                                    <Input name="endsAt" type="datetime-local" />
                                    <Textarea name="reason" placeholder="Motivo del grant" />
                                    <Button type="submit">Otorgar entitlement</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Fusionar identidad comercial</CardTitle>
                                <CardDescription>Mueve compras, transacciones, registros y accesos a esta identidad con trazabilidad.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={mergeCommerceIdentityAction} className="space-y-3">
                                    <input type="hidden" name="returnTo" value={returnTo} />
                                    <input type="hidden" name="targetUserId" value={profileView.profile.id} />
                                    <Input name="sourceUserId" placeholder="user_id origen (opcional)" />
                                    <Input name="sourceEmail" defaultValue={profileView.profile.email || ''} placeholder="email origen para reclamar huerfanos" />
                                    <Input name="confirmation" placeholder="Escribe CONFIRMAR" />
                                    <Button type="submit" variant="outline">
                                        <Link2 className="h-4 w-4" />
                                        Fusionar identidad comercial
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Membresia - entitlements derivados</CardTitle>
                            <CardDescription>Reglas aplicables, estado de suscripcion y grants activos.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-2">
                                <div className="font-medium">Reglas aplicables</div>
                                {membershipView?.rules?.length ? membershipView.rules.map((rule) => (
                                    <div key={rule.id} className="rounded-lg border p-3 text-sm">
                                        <div className="font-medium">Nivel {rule.membership_level} · {rule.scope_type}</div>
                                        <div className="text-muted-foreground">
                                            {rule.required_audience || rule.event_category || rule.event_id || `${rule.discount_percent || 0}%`}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground">Sin reglas aplicables.</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="font-medium">Entitlements derivados</div>
                                {membershipView?.derivedEntitlements?.length ? membershipView.derivedEntitlements.map((row: any) => (
                                    <div key={row.id} className="rounded-lg border p-3 text-sm">
                                        <div className="font-medium">{row.event?.title || row.event_id}</div>
                                        <div className="text-muted-foreground">
                                            {row.status} · vence {formatDate(row.ends_at)}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground">No hay grants derivados registrados.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="h-5 w-5" />
                                Entitlements
                            </CardTitle>
                            <CardDescription>Activos, expirados y revocados con origen y acciones manuales.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {profileView.entitlements.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay entitlements para esta identidad.</p>
                            ) : profileView.entitlements.map((entitlement: any) => (
                                <div key={entitlement.id} className="rounded-lg border p-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-1">
                                            <div className="font-medium">{entitlement.event?.title || entitlement.event_id}</div>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant={statusVariant(entitlement.status)}>{entitlement.status}</Badge>
                                                <Badge variant="outline">{entitlement.access_kind}</Badge>
                                                <Badge variant="secondary">{entitlement.source_type}</Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                inicia {formatDate(entitlement.starts_at)} · vence {formatDate(entitlement.ends_at)}
                                            </div>
                                        </div>
                                        <div className="grid gap-2 lg:min-w-[320px]">
                                            <form action={extendEntitlementAction} className="grid gap-2 rounded-md border p-3">
                                                <input type="hidden" name="returnTo" value={returnTo} />
                                                <input type="hidden" name="entitlementId" value={entitlement.id} />
                                                <Input name="endsAt" type="datetime-local" />
                                                <Input name="reason" placeholder="Motivo de extension" />
                                                <Button type="submit" variant="outline" size="sm">Extender vigencia</Button>
                                            </form>
                                            {entitlement.status === 'active' ? (
                                                <form action={revokeEntitlementAction} className="grid gap-2 rounded-md border p-3">
                                                    <input type="hidden" name="returnTo" value={returnTo} />
                                                    <input type="hidden" name="entitlementId" value={entitlement.id} />
                                                    <Input name="reason" placeholder="Motivo de revocacion" />
                                                    <Button type="submit" variant="destructive" size="sm">Revocar</Button>
                                                </form>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Compras y fulfillment
                            </CardTitle>
                            <CardDescription>Compras individuales, estado de entrega y atribucion operativa.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {profileView.purchases.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay compras para esta identidad.</p>
                            ) : profileView.purchases.map((purchase: any) => (
                                <div key={purchase.id} className="rounded-lg border p-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-1">
                                            <div className="font-medium">{purchase.event?.title || purchase.event_id}</div>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant={statusVariant(purchase.status)}>{purchase.status}</Badge>
                                                <Badge variant="outline">${Number(purchase.amount_paid || 0).toFixed(2)} {purchase.currency}</Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {purchase.email} · {formatDate(purchase.purchased_at)}
                                            </div>
                                            {renderAttribution(purchase.attributionSummary)}
                                        </div>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={buildReturnTo(query, profileView.profile.id, purchase.id)}>Detalle compra</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Transacciones / reporting operativo</CardTitle>
                            <CardDescription>Base minima de source, medium, campaign, referrer y landing.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {profileView.transactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Sin transacciones vinculadas.</p>
                            ) : profileView.transactions.map((transaction: any) => (
                                <div key={transaction.id} className="rounded-lg border p-3">
                                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="font-medium">{transaction.purchase_type}</div>
                                            <div className="text-xs text-muted-foreground">{transaction.email} · {formatDate(transaction.created_at)}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={statusVariant(transaction.status)}>{transaction.status}</Badge>
                                            <Badge variant="outline">${Number(transaction.amount || 0).toFixed(2)} {transaction.currency}</Badge>
                                        </div>
                                    </div>
                                    <div className="mt-2">{renderAttribution(transaction.attributionSummary)}</div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Notas internas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <form action={addAdminNoteAction} className="space-y-3">
                                    <input type="hidden" name="returnTo" value={returnTo} />
                                    <input type="hidden" name="entityType" value="profile" />
                                    <input type="hidden" name="entityId" value={profileView.profile.id} />
                                    <input type="hidden" name="targetUserId" value={profileView.profile.id} />
                                    <input type="hidden" name="targetEmail" value={profileView.profile.email || ''} />
                                    <Textarea name="note" placeholder="Nota interna del caso" />
                                    <Button type="submit" variant="outline">Guardar nota</Button>
                                </form>
                                <div className="space-y-2">
                                    {profileView.notes.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Sin notas internas.</p>
                                    ) : profileView.notes.map((note) => (
                                        <div key={note.id} className="rounded-lg border p-3 text-sm">
                                            <div>{note.note}</div>
                                            <div className="mt-2 text-xs text-muted-foreground">{formatDate(note.created_at)}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Timeline / auditoria
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {profileView.auditLogs.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Sin cambios manuales registrados.</p>
                                ) : profileView.auditLogs.map((log) => (
                                    <div key={log.id} className="rounded-lg border p-3 text-sm">
                                        <div className="font-medium">{log.action_type}</div>
                                        <div className="text-muted-foreground">
                                            {log.entity_type} · {log.reason || 'sin motivo'}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">{formatDate(log.created_at)}</div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : null}

            {purchaseView ? (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compra seleccionada</CardTitle>
                            <CardDescription>Estado de fulfillment, relink de identidad y reporting minimo.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 lg:grid-cols-3">
                            <div className="space-y-2">
                                <div className="font-medium">{purchaseView.purchase.event?.title || purchaseView.purchase.event_id}</div>
                                <div className="text-sm text-muted-foreground">{purchaseView.purchase.email}</div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant={statusVariant(purchaseView.purchase.status)}>{purchaseView.purchase.status}</Badge>
                                    <Badge variant={statusVariant(purchaseView.fulfillmentStatus)}>{purchaseView.fulfillmentStatus}</Badge>
                                </div>
                            </div>
                            <div className="text-sm">
                                <div><span className="font-medium">Compra:</span> {purchaseView.purchase.id}</div>
                                <div><span className="font-medium">Payment ref:</span> {purchaseView.purchase.payment_reference || 'sin-ref'}</div>
                                <div><span className="font-medium">Session:</span> {purchaseView.purchase.provider_session_id || 'sin-session'}</div>
                                <div><span className="font-medium">Payment intent:</span> {purchaseView.purchase.provider_payment_id || 'sin-intent'}</div>
                            </div>
                            <div>{renderAttribution(purchaseView.purchase.attributionSummary)}</div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Fulfillment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form action={retryFulfillmentAction} className="space-y-3">
                                    <input type="hidden" name="returnTo" value={returnTo} />
                                    <input type="hidden" name="purchaseId" value={purchaseView.purchase.id} />
                                    <Button type="submit" variant="outline">
                                        <RefreshCcw className="h-4 w-4" />
                                        Reintentar fulfillment idempotente
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Vincular a identidad</CardTitle>
                                <CardDescription>Corrige compras huerfanas o correos cambiados.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={relinkPurchaseIdentityAction} className="space-y-3">
                                    <input type="hidden" name="returnTo" value={returnTo} />
                                    <input type="hidden" name="purchaseId" value={purchaseView.purchase.id} />
                                    <select name="targetUserId" defaultValue={purchaseView.purchase.user_id || ''} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                                        <option value="">Selecciona persona</option>
                                        {purchaseView.profileCandidates.map((profile: any) => (
                                            <option key={profile.id} value={profile.id}>
                                                {profile.full_name || 'Sin nombre'} · {profile.email}
                                            </option>
                                        ))}
                                    </select>
                                    <Button type="submit">Vincular compra</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Entitlements vinculados</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {purchaseView.entitlements.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Esta compra todavia no genero accesos activos.</p>
                            ) : purchaseView.entitlements.map((entitlement: any) => (
                                <div key={entitlement.id} className="rounded-lg border p-3 text-sm">
                                    <div className="font-medium">{entitlement.event?.title || entitlement.event_id}</div>
                                    <div className="text-muted-foreground">
                                        {entitlement.access_kind} · {entitlement.status} · vence {formatDate(entitlement.ends_at)}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notas internas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <form action={addAdminNoteAction} className="space-y-3">
                                    <input type="hidden" name="returnTo" value={returnTo} />
                                    <input type="hidden" name="entityType" value="event_purchase" />
                                    <input type="hidden" name="entityId" value={purchaseView.purchase.id} />
                                    <input type="hidden" name="targetUserId" value={purchaseView.purchase.user_id || ''} />
                                    <input type="hidden" name="targetEmail" value={purchaseView.purchase.email} />
                                    <Textarea name="note" placeholder="Nota interna de la compra" />
                                    <Button type="submit" variant="outline">Guardar nota</Button>
                                </form>
                                {purchaseView.notes.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Sin notas para esta compra.</p>
                                ) : purchaseView.notes.map((note) => (
                                    <div key={note.id} className="rounded-lg border p-3 text-sm">
                                        <div>{note.note}</div>
                                        <div className="mt-2 text-xs text-muted-foreground">{formatDate(note.created_at)}</div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Auditoria</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {purchaseView.auditLogs.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Sin cambios manuales para esta compra.</p>
                                ) : purchaseView.auditLogs.map((log) => (
                                    <div key={log.id} className="rounded-lg border p-3 text-sm">
                                        <div className="font-medium">{log.action_type}</div>
                                        <div className="text-muted-foreground">{log.reason || 'sin motivo'}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">{formatDate(log.created_at)}</div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

type RawEventRegistrationAccessRow = {
    id: string
    user_id: string | null
    registration_data: Record<string, any> | null
    registered_at: string | null
}

type RawEventEntitlementAccessRow = {
    id: string
    user_id: string | null
    email: string | null
    identity_key: string | null
    access_kind: string | null
    source_type: string | null
    created_at: string | null
}

type RawEventAttendeeProfile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    email?: string | null
}

export type EventAttendeeAccessRow = {
    id: string
    identityKey: string
    userId: string | null
    displayName: string
    email: string | null
    avatarUrl: string | null
    accessSources: string[]
    registeredAt: string | null
    registrationData: Record<string, any>
}

const SOURCE_LABELS: Record<string, string> = {
    registration: 'Registro',
    purchase: 'Compra',
    membership: 'Membresia',
    manual: 'Manual',
    support: 'Soporte',
    gift: 'Regalo',
    alliance: 'Alianza',
    migration: 'Migracion',
}

function normalizeEmail(value?: string | null) {
    const normalized = value?.trim().toLowerCase()
    return normalized || null
}

function identityForUserOrEmail(userId?: string | null, email?: string | null) {
    if (userId) return `user:${userId}`
    const normalizedEmail = normalizeEmail(email)
    return normalizedEmail ? `email:${normalizedEmail}` : null
}

function preferEarlierDate(current: string | null, candidate: string | null) {
    if (!candidate) return current
    if (!current) return candidate
    return new Date(candidate).getTime() < new Date(current).getTime() ? candidate : current
}

export function getEventAttendeeSourceLabel(sourceType: string) {
    return SOURCE_LABELS[sourceType] ?? sourceType
}

export function mergeEventAttendeeAccessRows(params: {
    registrations: RawEventRegistrationAccessRow[]
    entitlements: RawEventEntitlementAccessRow[]
    profiles: RawEventAttendeeProfile[]
}): EventAttendeeAccessRow[] {
    const profilesById = new Map(params.profiles.map((profile) => [profile.id, profile]))
    const attendeesByIdentity = new Map<string, EventAttendeeAccessRow>()

    const ensureAttendee = ({
        identityKey,
        userId,
        email,
        date,
    }: {
        identityKey: string
        userId: string | null
        email: string | null
        date: string | null
    }) => {
        const profile = userId ? profilesById.get(userId) : undefined
        const existing = attendeesByIdentity.get(identityKey)
        const displayName = profile?.full_name?.trim() || email || profile?.email || 'Usuario'

        if (existing) {
            existing.registeredAt = preferEarlierDate(existing.registeredAt, date)
            if (!existing.userId && userId) existing.userId = userId
            if (!existing.email && email) existing.email = email
            if (existing.displayName === 'Usuario' && displayName !== 'Usuario') existing.displayName = displayName
            if (!existing.avatarUrl && profile?.avatar_url) existing.avatarUrl = profile.avatar_url
            return existing
        }

        const attendee: EventAttendeeAccessRow = {
            id: identityKey,
            identityKey,
            userId,
            displayName,
            email,
            avatarUrl: profile?.avatar_url ?? null,
            accessSources: [],
            registeredAt: date,
            registrationData: {},
        }
        attendeesByIdentity.set(identityKey, attendee)
        return attendee
    }

    for (const registration of params.registrations) {
        const identityKey = identityForUserOrEmail(registration.user_id)
        if (!identityKey) continue
        const attendee = ensureAttendee({
            identityKey,
            userId: registration.user_id,
            email: null,
            date: registration.registered_at,
        })
        attendee.registrationData = registration.registration_data ?? {}
        if (!attendee.accessSources.includes('registration')) {
            attendee.accessSources.push('registration')
        }
    }

    for (const entitlement of params.entitlements) {
        const email = normalizeEmail(entitlement.identity_key) ?? normalizeEmail(entitlement.email)
        const identityKey = identityForUserOrEmail(entitlement.user_id, email)
        if (!identityKey) continue
        const attendee = ensureAttendee({
            identityKey,
            userId: entitlement.user_id,
            email,
            date: entitlement.created_at,
        })
        const sourceType = entitlement.source_type ?? entitlement.access_kind ?? 'access'
        if (!attendee.accessSources.includes(sourceType)) {
            attendee.accessSources.push(sourceType)
        }
    }

    return Array.from(attendeesByIdentity.values()).sort((a, b) => {
        const aTime = a.registeredAt ? new Date(a.registeredAt).getTime() : 0
        const bTime = b.registeredAt ? new Date(b.registeredAt).getTime() : 0
        return bTime - aTime
    })
}

export async function getEventAttendeeAccessRows(
    supabase: any,
    eventId: string
): Promise<EventAttendeeAccessRow[]> {
    const [{ data: registrationRows, error: registrationError }, { data: entitlementRows, error: entitlementError }] = await Promise.all([
        (supabase
            .from('event_registrations') as any)
            .select('id, user_id, registration_data, registered_at')
            .eq('event_id', eventId)
            .eq('status', 'registered'),
        (supabase
            .from('event_entitlements') as any)
            .select('id, user_id, email, identity_key, access_kind, source_type, created_at')
            .eq('event_id', eventId)
            .eq('status', 'active')
            .in('source_type', ['registration', 'purchase', 'membership']),
    ])

    if (registrationError) {
        console.error('[Events] Failed to load event registration attendees:', registrationError)
    }

    if (entitlementError) {
        console.error('[Events] Failed to load event entitlement attendees:', entitlementError)
    }

    const registrations = (registrationRows ?? []) as RawEventRegistrationAccessRow[]
    const entitlements = (entitlementRows ?? []) as RawEventEntitlementAccessRow[]
    const profileIds = Array.from(new Set([
        ...registrations.map((row) => row.user_id),
        ...entitlements.map((row) => row.user_id),
    ].filter((id): id is string => Boolean(id))))

    const { data: profiles, error: profilesError } = profileIds.length > 0
        ? await (supabase
            .from('profiles') as any)
            .select('id, full_name, avatar_url, email')
            .in('id', profileIds)
        : { data: [], error: null }

    if (profilesError) {
        console.error('[Events] Failed to load attendee profiles:', profilesError)
    }

    return mergeEventAttendeeAccessRows({
        registrations,
        entitlements,
        profiles: (profiles ?? []) as RawEventAttendeeProfile[],
    })
}

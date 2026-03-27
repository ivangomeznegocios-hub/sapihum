import type { Event, EventType } from '@/types/database'

export type NormalizedMemberAccessType = 'free' | 'discounted' | 'full_price'

export function normalizeMemberAccessType(value: unknown): NormalizedMemberAccessType {
    if (value === 'free' || value === 'discounted' || value === 'full_price') {
        return value
    }

    if (value === 'discount') {
        return 'discounted'
    }

    if (value === 'paid') {
        return 'full_price'
    }

    return 'free'
}

export function getEventMemberAccessMessage(event: Pick<Event, 'price' | 'member_price' | 'member_access_type'>) {
    const publicPrice = Number(event.price || 0)
    const memberPrice = Number(event.member_price ?? publicPrice)
    const accessType = normalizeMemberAccessType(event.member_access_type)

    if (publicPrice <= 0) {
        return {
            label: 'Gratis',
            note: null as string | null,
        }
    }

    if (accessType === 'free') {
        return {
            label: 'Incluido con membresia activa',
            note: 'Las personas con membresia activa acceden sin costo.',
        }
    }

    if (accessType === 'discounted') {
        return {
            label: `Miembros activos: $${memberPrice.toFixed(2)} MXN`,
            note: 'Las personas con membresia activa pagan el precio preferencial.',
        }
    }

    return {
        label: 'Miembros activos pagan el mismo precio',
        note: 'La membresia activa no cambia el precio de este evento.',
    }
}

export function getEffectiveEventPriceForMembership(
    event: Pick<Event, 'price' | 'member_price' | 'member_access_type'>,
    hasActiveMembership: boolean
) {
    const publicPrice = Number(event.price || 0)
    const memberPrice = event.member_price !== null && event.member_price !== undefined
        ? Number(event.member_price)
        : publicPrice
    const accessType = normalizeMemberAccessType(event.member_access_type)

    if (hasActiveMembership) {
        switch (accessType) {
            case 'free':
                return 0
            case 'discounted':
                return memberPrice
            case 'full_price':
            default:
                return publicPrice
        }
    }

    return publicPrice
}

export function getEffectiveEventPriceForProfile(
    event: Pick<Event, 'price' | 'member_price' | 'member_access_type'>,
    roleOrContext?: string | { role?: string; membershipLevel?: number; hasActiveMembership?: boolean },
    membershipLevel = 0
) {
    const hasActiveMembership =
        typeof roleOrContext === 'object' && roleOrContext !== null
            ? (roleOrContext.hasActiveMembership ?? (roleOrContext.membershipLevel ?? 0) > 0)
            : membershipLevel > 0

    return getEffectiveEventPriceForMembership(event, hasActiveMembership)
}

export function isPurchasableRecordingEvent(event: Pick<Event, 'status' | 'recording_url' | 'recording_expires_at' | 'event_type'>, now = new Date()) {
    if (!event.recording_url) return false

    const isRecordedProduct = event.status === 'completed' || event.event_type === 'course' || event.event_type === 'on_demand'
    if (!isRecordedProduct) return false

    if (!event.recording_expires_at) return true

    return new Date(event.recording_expires_at) > now
}

export function getEventTypePurchaseLabel(eventType?: EventType | null) {
    if (eventType === 'course') return 'Curso'
    if (eventType === 'on_demand') return 'Grabacion'
    return 'Acceso'
}

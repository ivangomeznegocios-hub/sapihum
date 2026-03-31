import type { Event, EventType } from '@/types/database'
import { getSpecializationByCode } from '@/lib/specializations'

export type NormalizedMemberAccessType = 'free' | 'discounted' | 'full_price'

export type EventPricingContext = {
    role?: string
    membershipLevel?: number
    hasActiveMembership?: boolean
    membershipSpecializationCode?: string | null
}

type EventPricingEvent = Pick<Event, 'price' | 'member_price' | 'member_access_type'> & {
    specialization_code?: string | null
}

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

export function isEventIncludedForMatchingSpecialization(
    event: { specialization_code?: string | null },
    context?: EventPricingContext | null
) {
    if (!event.specialization_code) return false
    if (!context?.hasActiveMembership) return false
    if ((context.membershipLevel ?? 0) < 2) return false

    return context.membershipSpecializationCode === event.specialization_code
}

export function getEventMemberAccessMessage(event: EventPricingEvent) {
    const publicPrice = Number(event.price || 0)
    const memberPrice = Number(event.member_price ?? publicPrice)
    const accessType = normalizeMemberAccessType(event.member_access_type)
    const specialization = getSpecializationByCode(event.specialization_code)

    if (publicPrice <= 0) {
        return {
            label: 'Gratis',
            note: null as string | null,
        }
    }

    if (specialization) {
        if (accessType === 'free') {
            return {
                label: `Incluido en ${specialization.name} Nivel 2+`,
                note: `Miembros activos de Nivel 2 o superior en ${specialization.name} acceden sin costo. El resto de miembros activos tambien accede sin costo y el publico general paga $${publicPrice.toFixed(2)} MXN.`,
            }
        }

        if (accessType === 'discounted') {
            return {
                label: `Incluido en ${specialization.name} Nivel 2+`,
                note: `Miembros activos de Nivel 2 o superior en ${specialization.name} acceden sin costo. Otros miembros activos pagan $${memberPrice.toFixed(2)} MXN y el publico general $${publicPrice.toFixed(2)} MXN.`,
            }
        }

        return {
            label: `Incluido en ${specialization.name} Nivel 2+`,
            note: `Miembros activos de Nivel 2 o superior en ${specialization.name} acceden sin costo. Otros miembros activos y el publico general pagan $${publicPrice.toFixed(2)} MXN.`,
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
    event: EventPricingEvent,
    membership: boolean | EventPricingContext
) {
    const context =
        typeof membership === 'object' && membership !== null
            ? membership
            : { hasActiveMembership: membership }
    const publicPrice = Number(event.price || 0)
    const memberPrice = event.member_price !== null && event.member_price !== undefined
        ? Number(event.member_price)
        : publicPrice
    const accessType = normalizeMemberAccessType(event.member_access_type)
    const hasActiveMembership = Boolean(context.hasActiveMembership)

    if (publicPrice <= 0) {
        return 0
    }

    if (hasActiveMembership && isEventIncludedForMatchingSpecialization(event, context)) {
        return 0
    }

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
    event: EventPricingEvent,
    roleOrContext?: string | EventPricingContext,
    membershipLevel = 0
) {
    const context =
        typeof roleOrContext === 'object' && roleOrContext !== null
            ? {
                ...roleOrContext,
                hasActiveMembership:
                    roleOrContext.hasActiveMembership ?? (roleOrContext.membershipLevel ?? 0) > 0,
            }
            : {
                membershipLevel,
                hasActiveMembership: membershipLevel > 0,
            }

    return getEffectiveEventPriceForMembership(event, context)
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

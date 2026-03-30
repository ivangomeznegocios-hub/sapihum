import type { Formation } from '@/types/database'

export type NormalizedFormationMemberAccessType = 'free' | 'discounted' | 'full_price'

export function normalizeFormationMemberAccessType(value: unknown): NormalizedFormationMemberAccessType {
    if (value === 'free' || value === 'discounted' || value === 'full_price') {
        return value
    }

    return 'full_price'
}

function resolveValidFormationMemberPrice(
    formation: Pick<Formation, 'bundle_price' | 'bundle_member_price'>
) {
    const publicPrice = Number(formation.bundle_price || 0)
    const memberPrice = Number(formation.bundle_member_price || 0)

    if (publicPrice <= 0) {
        return 0
    }

    if (memberPrice > 0 && memberPrice < publicPrice) {
        return memberPrice
    }

    return publicPrice
}

export function getEffectiveFormationPriceForMembership(
    formation: Pick<Formation, 'bundle_price' | 'bundle_member_price' | 'bundle_member_access_type'>,
    hasActiveMembership: boolean
) {
    const publicPrice = Number(formation.bundle_price || 0)
    const memberPrice = resolveValidFormationMemberPrice(formation)
    const accessType = normalizeFormationMemberAccessType(formation.bundle_member_access_type)

    if (!hasActiveMembership) {
        return publicPrice
    }

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

export function getFormationMemberAccessMessage(
    formation: Pick<Formation, 'bundle_price' | 'bundle_member_price' | 'bundle_member_access_type'>
) {
    const publicPrice = Number(formation.bundle_price || 0)
    const memberPrice = resolveValidFormationMemberPrice(formation)
    const accessType = normalizeFormationMemberAccessType(formation.bundle_member_access_type)

    if (publicPrice <= 0) {
        return {
            label: 'Acceso gratuito',
            note: null as string | null,
        }
    }

    if (accessType === 'free') {
        return {
            label: 'Incluido con membresia activa',
            note: 'Las personas con membresia activa acceden al diplomado sin costo.',
        }
    }

    if (accessType === 'discounted') {
        return {
            label: `Miembros activos: $${memberPrice.toFixed(2)} MXN`,
            note: memberPrice < publicPrice
                ? 'Las personas con membresia activa pagan el precio preferencial del diplomado.'
                : 'Configura un precio menor al publico general para activar el descuento de membresia.',
        }
    }

    return {
        label: 'Miembros activos pagan el mismo precio',
        note: 'La membresia activa no modifica el precio de este diplomado.',
    }
}

export function getFormationCommercialState(
    formation: Pick<Formation, 'bundle_price' | 'bundle_member_price' | 'bundle_member_access_type'>,
    hasActiveMembership: boolean
) {
    const publicPrice = Number(formation.bundle_price || 0)
    const effectivePrice = getEffectiveFormationPriceForMembership(formation, hasActiveMembership)

    return {
        publicPrice,
        effectivePrice,
        needsPayment: effectivePrice > 0,
        complimentaryByMembership: hasActiveMembership && publicPrice > 0 && effectivePrice === 0,
        discountedByMembership: hasActiveMembership && effectivePrice > 0 && effectivePrice < publicPrice,
    }
}

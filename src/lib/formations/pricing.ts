import type { Formation } from '@/types/database'
import { getSpecializationByCode } from '@/lib/specializations'

export type NormalizedFormationMemberAccessType = 'free' | 'discounted' | 'full_price'
export type FormationPricingContext = {
    membershipLevel?: number
    hasActiveMembership?: boolean
    membershipSpecializationCode?: string | null
}

type FormationPricingFormation = Pick<Formation, 'bundle_price' | 'bundle_member_price' | 'bundle_member_access_type'> & {
    specialization_code?: string | null
}

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

export function isFormationIncludedForMatchingSpecialization(
    formation: { specialization_code?: string | null },
    context?: FormationPricingContext | null
) {
    if (!formation.specialization_code) return false
    if (!context?.hasActiveMembership) return false
    if ((context.membershipLevel ?? 0) < 2) return false

    return context.membershipSpecializationCode === formation.specialization_code
}

export function getEffectiveFormationPriceForMembership(
    formation: FormationPricingFormation,
    membership: boolean | FormationPricingContext
) {
    const context =
        typeof membership === 'object' && membership !== null
            ? membership
            : { hasActiveMembership: membership }
    const publicPrice = Number(formation.bundle_price || 0)
    const memberPrice = resolveValidFormationMemberPrice(formation)
    const accessType = normalizeFormationMemberAccessType(formation.bundle_member_access_type)
    const hasActiveMembership = Boolean(context.hasActiveMembership)

    if (publicPrice <= 0) {
        return 0
    }

    if (hasActiveMembership && isFormationIncludedForMatchingSpecialization(formation, context)) {
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

export function getFormationMemberAccessMessage(
    formation: FormationPricingFormation
) {
    const publicPrice = Number(formation.bundle_price || 0)
    const memberPrice = resolveValidFormationMemberPrice(formation)
    const accessType = normalizeFormationMemberAccessType(formation.bundle_member_access_type)
    const specialization = getSpecializationByCode(formation.specialization_code)

    if (publicPrice <= 0) {
        return {
            label: 'Acceso gratuito',
            note: null as string | null,
        }
    }

    if (specialization) {
        if (accessType === 'free') {
            return {
                label: `Incluida en ${specialization.name} Nivel 2+`,
                note: `Miembros activos de Nivel 2 o superior en ${specialization.name} activan esta formacion sin costo. El resto de miembros activos tambien accede sin costo y el publico general paga $${publicPrice.toFixed(2)} MXN.`,
            }
        }

        if (accessType === 'discounted') {
            return {
                label: `Incluida en ${specialization.name} Nivel 2+`,
                note: `Miembros activos de Nivel 2 o superior en ${specialization.name} activan esta formacion sin costo. Otros miembros activos pagan $${memberPrice.toFixed(2)} MXN y el publico general $${publicPrice.toFixed(2)} MXN.`,
            }
        }

        return {
            label: `Incluida en ${specialization.name} Nivel 2+`,
            note: `Miembros activos de Nivel 2 o superior en ${specialization.name} activan esta formacion sin costo. Otros miembros activos y el publico general pagan $${publicPrice.toFixed(2)} MXN.`,
        }
    }

    if (accessType === 'free') {
        return {
            label: 'Incluida con membresia activa',
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
    formation: FormationPricingFormation,
    membership: boolean | FormationPricingContext
) {
    const publicPrice = Number(formation.bundle_price || 0)
    const context =
        typeof membership === 'object' && membership !== null
            ? membership
            : { hasActiveMembership: membership }
    const hasActiveMembership = Boolean(context.hasActiveMembership)
    const effectivePrice = getEffectiveFormationPriceForMembership(formation, context)

    return {
        publicPrice,
        effectivePrice,
        needsPayment: effectivePrice > 0,
        complimentaryByMembership: hasActiveMembership && publicPrice > 0 && effectivePrice === 0,
        discountedByMembership: hasActiveMembership && effectivePrice > 0 && effectivePrice < publicPrice,
    }
}

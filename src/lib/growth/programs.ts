import type { UserRole } from '@/types/database'

export const PROFESSIONAL_INVITE_PROGRAM_TYPE = 'professional_invite' as const
export const RESERVED_PATIENT_REFERRAL_PROGRAM_TYPE = 'patient_referral' as const

export const PROFESSIONAL_INVITE_REFERRER_ROLES = ['psychologist', 'ponente'] as const satisfies readonly UserRole[]
export const PROFESSIONAL_INVITE_REFERRED_ROLES = ['psychologist'] as const satisfies readonly UserRole[]

export function isProfessionalInviteReferrerRole(role: unknown): role is (typeof PROFESSIONAL_INVITE_REFERRER_ROLES)[number] {
    return (PROFESSIONAL_INVITE_REFERRER_ROLES as readonly unknown[]).includes(role)
}

export function isProfessionalInviteReferredRole(role: unknown): role is (typeof PROFESSIONAL_INVITE_REFERRED_ROLES)[number] {
    return (PROFESSIONAL_INVITE_REFERRED_ROLES as readonly unknown[]).includes(role)
}

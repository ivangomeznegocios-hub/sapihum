import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { Database, UserRole } from '@/types/database'

type AuthUserSnapshot = Pick<User, 'id' | 'email' | 'user_metadata'>

const REGISTRATION_PROFILE_ROLES = new Set<UserRole>(['psychologist', 'patient', 'ponente'])
const SPEAKER_TERMS_VERSION = '2026-05-27'
const SPEAKER_INCOME_TERMS_VERSION = '2026-05-27'

let adminClient: ReturnType<typeof createClient<Database>> | null = null

function getAdminClient() {
    if (adminClient) {
        return adminClient
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase service-role credentials are required to provision missing profiles')
    }

    adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    return adminClient
}

function pickMetadataText(metadata: User['user_metadata'], key: string) {
    const value = metadata?.[key]
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function pickApplicationText(application: Record<string, unknown> | null, key: string) {
    const value = application?.[key]
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function pickApplicationBoolean(application: Record<string, unknown> | null, key: string) {
    return application?.[key] === true
}

function pickApplicationInteger(application: Record<string, unknown> | null, key: string) {
    const value = application?.[key]
    if (typeof value === 'number' && Number.isInteger(value)) return value
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim())
    return null
}

function pickApplicationTextArray(application: Record<string, unknown> | null, key: string) {
    const value = application?.[key]
    if (!Array.isArray(value)) return []

    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
}

function getSpeakerApplicationMetadata(metadata: User['user_metadata']) {
    const application = metadata?.speaker_application
    return application && typeof application === 'object' && !Array.isArray(application)
        ? application as Record<string, unknown>
        : null
}

function hasValidSpeakerApplication(metadata: User['user_metadata']) {
    const application = getSpeakerApplicationMetadata(metadata)
    if (!application) return false

    const fullName = pickMetadataText(metadata, 'full_name')
    const photoUrl = pickMetadataText(metadata, 'avatar_url') ?? pickApplicationText(application, 'photo_url')
    const professionalId = pickApplicationText(application, 'professional_id')
    const specialty = pickApplicationText(application, 'specialty')
    const phone = pickApplicationText(application, 'phone')
    const bio = pickApplicationText(application, 'bio')
    const yearsExperience = pickApplicationInteger(application, 'years_experience')

    return Boolean(
        fullName &&
        photoUrl &&
        professionalId &&
        specialty &&
        phone &&
        bio &&
        bio.length >= 80 &&
        yearsExperience !== null &&
        yearsExperience >= 1 &&
        pickApplicationBoolean(application, 'accepted_speaker_terms') &&
        pickApplicationBoolean(application, 'accepted_income_terms')
    )
}

function pickRegistrationRole(metadata: User['user_metadata']): UserRole {
    const requestedRole = pickMetadataText(metadata, 'registration_role')

    if (requestedRole === 'ponente') {
        return hasValidSpeakerApplication(metadata) ? 'ponente' : 'patient'
    }

    if (requestedRole && REGISTRATION_PROFILE_ROLES.has(requestedRole as UserRole)) {
        return requestedRole as UserRole
    }

    return 'patient'
}

export async function ensureProfileForAuthUser(user: AuthUserSnapshot) {
    const admin = getAdminClient()
    const fullName = pickMetadataText(user.user_metadata, 'full_name') ?? pickMetadataText(user.user_metadata, 'name')
    const avatarUrl = pickMetadataText(user.user_metadata, 'avatar_url')
    const registrationRole = pickRegistrationRole(user.user_metadata)

    const { error } = await (admin
        .from('profiles') as any)
        .upsert(
            {
                id: user.id,
                email: user.email ?? null,
                full_name: fullName,
                avatar_url: avatarUrl,
                role: registrationRole,
            },
            {
                onConflict: 'id',
                ignoreDuplicates: true,
            }
        )

    if (error) {
        console.error('Failed to provision missing profile for authenticated user', {
            userId: user.id,
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
        })
        return false
    }

    return true
}

export async function processSpeakerApplicationForAuthUser(user: AuthUserSnapshot) {
    if (pickMetadataText(user.user_metadata, 'registration_role') !== 'ponente') {
        return { processed: false }
    }

    const admin = getAdminClient()
    const application = getSpeakerApplicationMetadata(user.user_metadata)
    const fullName = pickMetadataText(user.user_metadata, 'full_name')
    const avatarUrl = pickMetadataText(user.user_metadata, 'avatar_url') ?? pickApplicationText(application, 'photo_url')
    const email = user.email ?? null
    const phone = pickApplicationText(application, 'phone')
    const professionalId = pickApplicationText(application, 'professional_id')
    const specialty = pickApplicationText(application, 'specialty')
    const yearsExperience = pickApplicationInteger(application, 'years_experience')
    const bio = pickApplicationText(application, 'bio')
    const credentials = pickApplicationTextArray(application, 'credentials')
    const linkedinUrl = pickApplicationText(application, 'linkedin_url')
    const websiteUrl = pickApplicationText(application, 'website_url')
    const topicProposal = pickApplicationText(application, 'topic_proposal')
    const acceptedAt = pickApplicationText(application, 'accepted_at') ?? new Date().toISOString()
    const valid = hasValidSpeakerApplication(user.user_metadata)
    const status = valid ? 'auto_approved_internal' : 'needs_review'

    await (admin.from('speaker_applications') as any)
        .upsert(
            {
                applicant_id: user.id,
                email,
                full_name: fullName,
                phone,
                professional_id: professionalId,
                specialty,
                years_experience: yearsExperience,
                bio,
                photo_url: avatarUrl,
                linkedin_url: linkedinUrl,
                website_url: websiteUrl,
                topic_proposal: topicProposal,
                credentials,
                status,
                requirements_version: SPEAKER_TERMS_VERSION,
                terms_version: SPEAKER_TERMS_VERSION,
                income_terms_version: SPEAKER_INCOME_TERMS_VERSION,
                accepted_at: acceptedAt,
                metadata: {
                    source: 'public_speaker_landing',
                    valid,
                    acceptedSpeakerTerms: pickApplicationBoolean(application, 'accepted_speaker_terms'),
                    acceptedIncomeTerms: pickApplicationBoolean(application, 'accepted_income_terms'),
                },
            },
            { onConflict: 'applicant_id' }
        )

    if (!valid) {
        return { processed: true, promoted: false }
    }

    await (admin.from('profiles') as any)
        .update({
            role: 'ponente',
            full_name: fullName,
            avatar_url: avatarUrl,
            phone,
            cedula_profesional: professionalId,
            specialty,
            years_experience: yearsExperience,
            bio,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

    await (admin.from('speakers') as any)
        .upsert(
            {
                id: user.id,
                headline: specialty,
                bio,
                photo_url: avatarUrl,
                credentials,
                specialties: specialty ? [specialty] : [],
                social_links: {
                    linkedin: linkedinUrl || undefined,
                    website: websiteUrl || undefined,
                },
                social_links_enabled: Boolean(linkedinUrl || websiteUrl),
                is_public: false,
            },
            { onConflict: 'id' }
        )

    return { processed: true, promoted: true }
}

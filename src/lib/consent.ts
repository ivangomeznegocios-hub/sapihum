export const CONSENT_COOKIE_NAME = 'cp_consent_status'
export const CONSENT_POLICY_VERSION = '2026-03-18'
export const CONSENT_CHANGE_EVENT = 'consent-change'

export type ConsentType =
    | 'privacy_policy'
    | 'terms_of_service'
    | 'clinical_data'
    | 'ai_processing'
    | 'marketing'
    | 'cookies_analytics'
    | 'cookies_functional'
    | 'international_transfer'

export type ConsentSource = 'registration' | 'cookie-banner' | 'cookiebot' | 'telehealth-recorder' | 'system'

export type StoredConsentState = {
    necessary: true
    analytics: boolean
    marketing: boolean
    acceptedAt: string
    version: string
    source: ConsentSource
}

export type RegistrationConsentChoice = {
    privacyPolicy: boolean
    termsOfService: boolean
    clinicalData: boolean
    aiProcessing: boolean
    internationalTransfer: boolean
}

export type ConsentRecordPayload = {
    consent_type: ConsentType
    granted: boolean
    version: string
    source: ConsentSource
    granted_at?: string
    revoked_at?: string | null
}

type ConsentRecordMetadata = {
    granted: boolean
    version: string
    accepted_at: string
    source?: ConsentSource
}

type RegistrationConsentMetadata = {
    consent_version: string
    consent_accepted_at: string
    consents: Partial<Record<ConsentType, ConsentRecordMetadata>>
}

export function hasRegistrationConsentMetadata(metadata: Record<string, unknown> | null | undefined): boolean {
    if (!metadata || typeof metadata !== 'object') return false

    const consentVersion = metadata.consent_version
    const consentBundle = metadata.consents

    return (
        typeof consentVersion === 'string' &&
        Boolean(consentBundle && typeof consentBundle === 'object' && Object.keys(consentBundle).length > 0)
    )
}

export function createStoredConsentState(input: {
    analytics: boolean
    marketing: boolean
    acceptedAt?: string
    version?: string
    source?: ConsentSource
}): StoredConsentState {
    return {
        necessary: true,
        analytics: input.analytics,
        marketing: input.marketing,
        acceptedAt: input.acceptedAt ?? new Date().toISOString(),
        version: input.version ?? CONSENT_POLICY_VERSION,
        source: input.source ?? 'cookie-banner',
    }
}

export function serializeConsentCookie(state: StoredConsentState): string {
    return encodeURIComponent(JSON.stringify(state))
}

export function parseConsentCookie(raw: string | null | undefined): StoredConsentState | null {
    if (!raw) return null

    try {
        const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<StoredConsentState>

        if (
            parsed &&
            parsed.necessary === true &&
            typeof parsed.analytics === 'boolean' &&
            typeof parsed.marketing === 'boolean' &&
            typeof parsed.acceptedAt === 'string' &&
            typeof parsed.version === 'string'
        ) {
            return {
                necessary: true,
                analytics: parsed.analytics,
                marketing: parsed.marketing,
                acceptedAt: parsed.acceptedAt,
                version: parsed.version,
                source: parsed.source ?? 'cookie-banner',
            }
        }
    } catch {
        return null
    }

    return null
}

export function parseConsentCookieFromCookieHeader(cookieHeader: string | null | undefined): StoredConsentState | null {
    if (!cookieHeader) return null

    const cookie = cookieHeader
        .split(';')
        .map((segment) => segment.trim())
        .find((segment) => segment.startsWith(`${CONSENT_COOKIE_NAME}=`))

    if (!cookie) return null

    return parseConsentCookie(cookie.slice(CONSENT_COOKIE_NAME.length + 1))
}

export function parseConsentCookieFromDocumentCookie(documentCookie: string | null | undefined): StoredConsentState | null {
    if (!documentCookie) return null

    const cookie = documentCookie
        .split(';')
        .map((segment) => segment.trim())
        .find((segment) => segment.startsWith(`${CONSENT_COOKIE_NAME}=`))

    if (!cookie) return null

    return parseConsentCookie(cookie.slice(CONSENT_COOKIE_NAME.length + 1))
}

export function hasAnalyticsConsent(state: StoredConsentState | null | undefined): boolean {
    return Boolean(state?.analytics)
}

export function hasMarketingConsent(state: StoredConsentState | null | undefined): boolean {
    return Boolean(state?.marketing)
}

export function hasMeasurementConsent(state: StoredConsentState | null | undefined): boolean {
    return hasAnalyticsConsent(state) || hasMarketingConsent(state)
}

export function isSameConsentState(
    left: StoredConsentState | null | undefined,
    right: StoredConsentState | null | undefined
): boolean {
    return (
        Boolean(left?.necessary) === Boolean(right?.necessary) &&
        Boolean(left?.analytics) === Boolean(right?.analytics) &&
        Boolean(left?.marketing) === Boolean(right?.marketing) &&
        (left?.version ?? null) === (right?.version ?? null) &&
        (left?.source ?? null) === (right?.source ?? null)
    )
}

export function buildGoogleConsentModeState(state: StoredConsentState | null | undefined) {
    const analyticsGranted = hasAnalyticsConsent(state) ? 'granted' : 'denied'
    const marketingGranted = hasMarketingConsent(state) ? 'granted' : 'denied'

    return {
        ad_storage: marketingGranted,
        ad_user_data: marketingGranted,
        ad_personalization: marketingGranted,
        analytics_storage: analyticsGranted,
        functionality_storage: 'granted',
        personalization_storage: 'denied',
        security_storage: 'granted',
    } as const
}

export function buildRegistrationConsentMetadata(
    choices: RegistrationConsentChoice,
    acceptedAt = new Date().toISOString()
): RegistrationConsentMetadata {
    return {
        consent_version: CONSENT_POLICY_VERSION,
        consent_accepted_at: acceptedAt,
        consents: {
            privacy_policy: {
                granted: true,
                version: CONSENT_POLICY_VERSION,
                accepted_at: acceptedAt,
                source: 'registration',
            },
            terms_of_service: {
                granted: true,
                version: CONSENT_POLICY_VERSION,
                accepted_at: acceptedAt,
                source: 'registration',
            },
            clinical_data: {
                granted: true,
                version: CONSENT_POLICY_VERSION,
                accepted_at: acceptedAt,
                source: 'registration',
            },
            ai_processing: {
                granted: choices.aiProcessing,
                version: CONSENT_POLICY_VERSION,
                accepted_at: acceptedAt,
                source: 'registration',
            },
            international_transfer: {
                granted: choices.internationalTransfer,
                version: CONSENT_POLICY_VERSION,
                accepted_at: acceptedAt,
                source: 'registration',
            },
        },
    }
}

export function buildCookieConsentRecords(state: StoredConsentState): ConsentRecordPayload[] {
    const acceptedAt = state.acceptedAt

    return [
        {
            consent_type: 'cookies_analytics',
            granted: state.analytics,
            version: state.version,
            source: state.source,
            granted_at: acceptedAt,
            revoked_at: state.analytics ? null : acceptedAt,
        },
        {
            consent_type: 'marketing',
            granted: state.marketing,
            version: state.version,
            source: state.source,
            granted_at: acceptedAt,
            revoked_at: state.marketing ? null : acceptedAt,
        },
    ]
}

export function buildAiProcessingConsentRecord(acceptedAt = new Date().toISOString()): ConsentRecordPayload {
    return {
        consent_type: 'ai_processing',
        granted: true,
        version: CONSENT_POLICY_VERSION,
        source: 'telehealth-recorder',
        granted_at: acceptedAt,
        revoked_at: null,
    }
}

export function buildRegistrationConsentRecords(
    metadata: Record<string, unknown> | null | undefined
): ConsentRecordPayload[] {
    if (!hasRegistrationConsentMetadata(metadata)) return []

    const consentMetadata = metadata as RegistrationConsentMetadata
    const consentBundle = consentMetadata.consents

    const typedBundle = consentBundle as Partial<Record<ConsentType, ConsentRecordMetadata>>
    const consentVersion = typeof consentMetadata.consent_version === 'string'
        ? consentMetadata.consent_version
        : CONSENT_POLICY_VERSION
    const acceptedAt = typeof consentMetadata.consent_accepted_at === 'string'
        ? consentMetadata.consent_accepted_at
        : new Date().toISOString()

    return Object.entries(typedBundle)
        .filter((entry): entry is [ConsentType, ConsentRecordMetadata] => Boolean(entry[1]))
        .map(([consentType, consentData]) => ({
            consent_type: consentType,
            granted: Boolean(consentData.granted),
            version: consentData.version || consentVersion,
            source: consentData.source || 'registration',
            granted_at: consentData.accepted_at || acceptedAt,
            revoked_at: consentData.granted ? null : consentData.accepted_at || acceptedAt,
        }))
}

export function buildConsentCookieOptions() {
    return {
        path: '/',
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
    }
}

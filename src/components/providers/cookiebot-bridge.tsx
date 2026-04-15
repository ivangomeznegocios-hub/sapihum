'use client'

import { useEffect, useRef } from 'react'
import { recordCookieConsent } from '@/actions/consent'
import {
    buildConsentCookieOptions,
    buildGoogleConsentModeState,
    CONSENT_CHANGE_EVENT,
    CONSENT_COOKIE_NAME,
    CONSENT_POLICY_VERSION,
    createStoredConsentState,
    isSameConsentState,
    parseConsentCookieFromDocumentCookie,
    serializeConsentCookie,
    type StoredConsentState,
} from '@/lib/consent'

declare global {
    interface Window {
        Cookiebot?: {
            consent?: {
                necessary?: boolean
                preferences?: boolean
                statistics?: boolean
                marketing?: boolean
            }
            hasResponse?: boolean
        }
        gtag?: (...args: unknown[]) => void
    }
}

const COOKIE_STORAGE_KEY = CONSENT_COOKIE_NAME
const consentCookieOptions = buildConsentCookieOptions()

function mirrorConsentState(state: StoredConsentState) {
    localStorage.setItem(
        COOKIE_STORAGE_KEY,
        JSON.stringify({
            necessary: true,
            analytics: state.analytics,
            marketing: state.marketing,
            accepted_at: state.acceptedAt,
            version: state.version,
            source: state.source,
        })
    )

    document.cookie = `${CONSENT_COOKIE_NAME}=${serializeConsentCookie(state)}; path=/; max-age=${consentCookieOptions.maxAge}; samesite=lax${consentCookieOptions.secure ? '; secure' : ''}`
    window.gtag?.('consent', 'update', buildGoogleConsentModeState(state))
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
}

function buildCookiebotConsentState(): StoredConsentState | null {
    const consent = window.Cookiebot?.consent
    if (!consent) return null

    return createStoredConsentState({
        analytics: Boolean(consent.statistics),
        marketing: Boolean(consent.marketing),
        acceptedAt: new Date().toISOString(),
        version: CONSENT_POLICY_VERSION,
        source: 'cookiebot',
    })
}

export function CookiebotBridge({ hasCookiebot }: { hasCookiebot: boolean }) {
    const lastSyncedState = useRef<StoredConsentState | null>(null)

    useEffect(() => {
        const initialState = parseConsentCookieFromDocumentCookie(document.cookie)
        if (initialState) {
            lastSyncedState.current = initialState
            window.gtag?.('consent', 'update', buildGoogleConsentModeState(initialState))
        }
    }, [])

    useEffect(() => {
        if (!hasCookiebot) {
            return
        }

        let isMounted = true

        const syncCookiebotConsent = async () => {
            const nextState = buildCookiebotConsentState()
            if (!isMounted || !nextState) {
                return
            }

            const currentState = parseConsentCookieFromDocumentCookie(document.cookie)
            if (isSameConsentState(lastSyncedState.current, nextState) || isSameConsentState(currentState, nextState)) {
                window.gtag?.('consent', 'update', buildGoogleConsentModeState(nextState))
                return
            }

            lastSyncedState.current = nextState
            mirrorConsentState(nextState)
            await recordCookieConsent(nextState)
        }

        const handleCookiebotEvent = () => {
            void syncCookiebotConsent()
        }

        if (window.Cookiebot?.hasResponse) {
            void syncCookiebotConsent()
        }

        window.addEventListener('CookiebotOnConsentReady', handleCookiebotEvent)
        window.addEventListener('CookiebotOnAccept', handleCookiebotEvent)
        window.addEventListener('CookiebotOnDecline', handleCookiebotEvent)

        return () => {
            isMounted = false
            window.removeEventListener('CookiebotOnConsentReady', handleCookiebotEvent)
            window.removeEventListener('CookiebotOnAccept', handleCookiebotEvent)
            window.removeEventListener('CookiebotOnDecline', handleCookiebotEvent)
        }
    }, [hasCookiebot])

    return null
}

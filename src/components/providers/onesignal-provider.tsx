'use client'

import { useEffect, useRef, useState } from 'react'
import OneSignal from 'react-onesignal'
import { createClient } from '@/lib/supabase/client'
import {
    CONSENT_CHANGE_EVENT,
    hasMarketingConsent,
    parseConsentCookieFromDocumentCookie,
} from '@/lib/consent'

const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim()

export function OneSignalSetup() {
    const isInitialized = useRef(false)
    const [hasConsent, setHasConsent] = useState(false)

    useEffect(() => {
        const syncConsent = () => {
            const consent = parseConsentCookieFromDocumentCookie(document.cookie)
            setHasConsent(hasMarketingConsent(consent))
        }

        syncConsent()
        window.addEventListener(CONSENT_CHANGE_EVENT, syncConsent)
        window.addEventListener('storage', syncConsent)

        return () => {
            window.removeEventListener(CONSENT_CHANGE_EVENT, syncConsent)
            window.removeEventListener('storage', syncConsent)
        }
    }, [])

    useEffect(() => {
        async function initOneSignal() {
            if (!hasConsent) return
            if (!oneSignalAppId) return

            if (isInitialized.current) return
            isInitialized.current = true

            try {
                await OneSignal.init({
                    appId: oneSignalAppId,
                    // allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
                })

                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    await OneSignal.login(user.id)
                }
            } catch (error) {
                console.error('Error inicializando OneSignal:', error)
            }
        }

        initOneSignal()
    }, [hasConsent])

    return null
}

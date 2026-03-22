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
    const currentExternalId = useRef<string | null>(null)
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
        if (!hasConsent || !oneSignalAppId) {
            return
        }

        const appId = oneSignalAppId
        let isActive = true
        const supabase = createClient()

        const syncOneSignalIdentity = async (externalId: string | null) => {
            if (!isActive || !isInitialized.current) {
                return
            }

            if (currentExternalId.current === externalId) {
                return
            }

            try {
                if (!externalId) {
                    await OneSignal.logout()
                    currentExternalId.current = null
                    return
                }

                await OneSignal.login(externalId)
                currentExternalId.current = externalId
            } catch (error) {
                console.error('Error syncing OneSignal identity:', error)
            }
        }

        async function initOneSignal() {
            try {
                if (!isInitialized.current) {
                    await OneSignal.init({
                        appId,
                        // allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
                    })
                    isInitialized.current = true
                }

                const { data: { session } } = await supabase.auth.getSession()
                await syncOneSignalIdentity(session?.user?.id ?? null)
            } catch (error) {
                console.error('Error inicializando OneSignal:', error)
            }
        }

        void initOneSignal()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            void syncOneSignalIdentity(session?.user?.id ?? null)
        })

        return () => {
            isActive = false
            subscription.unsubscribe()
        }
    }, [hasConsent])

    return null
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    buildConsentCookieOptions,
    buildGoogleConsentModeState,
    CONSENT_CHANGE_EVENT,
    CONSENT_COOKIE_NAME,
    CONSENT_POLICY_VERSION,
    createStoredConsentState,
    parseConsentCookieFromDocumentCookie,
    serializeConsentCookie,
} from '@/lib/consent'
import { recordCookieConsent } from '@/actions/consent'

const COOKIE_STORAGE_KEY = CONSENT_COOKIE_NAME
const hasCookiebot = Boolean(process.env.NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID?.trim())

type ConsentStatus = {
    necessary: true
    analytics: boolean
    marketing: boolean
    accepted_at?: string
    version?: string
    source?: string
}

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
    }
}

function getStoredConsent(): ConsentStatus | null {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(COOKIE_STORAGE_KEY)
    const cookieConsent = parseConsentCookieFromDocumentCookie(document.cookie)

    try {
        if (stored) {
            const parsed = JSON.parse(stored) as ConsentStatus
            if (parsed.version === CONSENT_POLICY_VERSION) {
                return parsed
            }
        }
    } catch {
        return cookieConsent
            ? {
                necessary: true,
                analytics: cookieConsent.analytics,
                marketing: cookieConsent.marketing,
                accepted_at: cookieConsent.acceptedAt,
                version: cookieConsent.version,
                source: cookieConsent.source,
            }
            : null
    }

    if (!cookieConsent || cookieConsent.version !== CONSENT_POLICY_VERSION) {
        return null
    }

    return {
        necessary: true,
        analytics: cookieConsent.analytics,
        marketing: cookieConsent.marketing,
        accepted_at: cookieConsent.acceptedAt,
        version: cookieConsent.version,
        source: cookieConsent.source,
    }
}

const consentCookieOptions = buildConsentCookieOptions()

function setStoredConsent(consent: ConsentStatus) {
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(consent))

    const state = createStoredConsentState({
        analytics: consent.analytics,
        marketing: consent.marketing,
        acceptedAt: consent.accepted_at,
        version: CONSENT_POLICY_VERSION,
        source: 'cookie-banner',
    })

    document.cookie = `${CONSENT_COOKIE_NAME}=${serializeConsentCookie(state)}; path=/; max-age=${consentCookieOptions.maxAge}; samesite=lax${consentCookieOptions.secure ? '; secure' : ''}`
    window.gtag?.('consent', 'update', buildGoogleConsentModeState(state))
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
}

async function saveConsentToDatabase(consent: ConsentStatus) {
    try {
        await recordCookieConsent(
            createStoredConsentState({
                analytics: consent.analytics,
                marketing: consent.marketing,
                acceptedAt: consent.accepted_at,
                version: CONSENT_POLICY_VERSION,
                source: 'cookie-banner',
            })
        )
    } catch (error) {
        console.error('Error saving consent:', error)
    }
}

export function CookieConsentBanner() {
    const [isVisible, setIsVisible] = useState(false)
    const [showDetails, setShowDetails] = useState(false)
    const [analytics, setAnalytics] = useState(false)
    const [marketing, setMarketing] = useState(false)
    const existingConsent = useMemo(() => getStoredConsent(), [])

    useEffect(() => {
        if (hasCookiebot || existingConsent) {
            return
        }

        const timer = setTimeout(() => setIsVisible(true), 1000)
        return () => clearTimeout(timer)
    }, [existingConsent])

    if (hasCookiebot || !isVisible) return null

    const commitConsent = async (nextConsent: ConsentStatus) => {
        setStoredConsent(nextConsent)
        await saveConsentToDatabase(nextConsent)
        setIsVisible(false)
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-[9999] p-4 sm:p-6">
            <div className="mx-auto max-w-2xl rounded-xl border bg-card/95 p-5 shadow-2xl backdrop-blur-md sm:p-6">
                <div className="mb-4 flex items-start gap-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 shrink-0 text-primary"
                    >
                        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                        <path d="M8.5 8.5v.01" />
                        <path d="M16 15.5v.01" />
                        <path d="M12 12v.01" />
                        <path d="M11 17v.01" />
                        <path d="M7 14v.01" />
                    </svg>
                    <div>
                        <h3 className="text-sm font-semibold">Uso de cookies</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            Usamos cookies esenciales para el funcionamiento de la plataforma. De forma opcional,
                            usamos cookies analiticas y de marketing para medir y mejorar la experiencia. Puedes
                            aceptar todas, personalizar tu eleccion o dejar solo las esenciales.{' '}
                            <a href="/aviso-privacidad" className="text-primary hover:underline">
                                Ver Aviso de Privacidad
                            </a>
                            .
                        </p>
                    </div>
                </div>

                {showDetails ? (
                    <div className="mb-4 space-y-3 rounded-lg bg-muted/50 p-3">
                        <label className="cursor-not-allowed opacity-70">
                            <span className="flex items-center gap-3">
                                <input type="checkbox" checked disabled className="h-4 w-4 rounded border-input" />
                                <span className="text-xs font-medium">
                                    Esenciales <span className="font-normal text-muted-foreground">(siempre activas)</span>
                                </span>
                            </span>
                        </label>

                        <label className="cursor-pointer">
                            <span className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={analytics}
                                    onChange={(event) => setAnalytics(event.target.checked)}
                                    className="h-4 w-4 rounded border-input accent-primary"
                                />
                                <span className="text-xs font-medium">
                                    Analiticas <span className="font-normal text-muted-foreground">Nos ayudan a entender el uso</span>
                                </span>
                            </span>
                        </label>

                        <label className="cursor-pointer">
                            <span className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={marketing}
                                    onChange={(event) => setMarketing(event.target.checked)}
                                    className="h-4 w-4 rounded border-input accent-primary"
                                />
                                <span className="text-xs font-medium">
                                    Marketing <span className="font-normal text-muted-foreground">Permiten medir campanas y conversiones</span>
                                </span>
                            </span>
                        </label>
                    </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                        onClick={() =>
                            void commitConsent({
                                necessary: true,
                                analytics: true,
                                marketing: true,
                                accepted_at: new Date().toISOString(),
                                version: CONSENT_POLICY_VERSION,
                                source: 'cookie-banner',
                            })
                        }
                        size="sm"
                        className="flex-1"
                    >
                        Aceptar todas
                    </Button>

                    {!showDetails ? (
                        <Button onClick={() => setShowDetails(true)} variant="outline" size="sm" className="flex-1">
                            Personalizar
                        </Button>
                    ) : (
                        <Button
                            onClick={() =>
                                void commitConsent({
                                    necessary: true,
                                    analytics,
                                    marketing,
                                    accepted_at: new Date().toISOString(),
                                    version: CONSENT_POLICY_VERSION,
                                    source: 'cookie-banner',
                                })
                            }
                            variant="outline"
                            size="sm"
                            className="flex-1"
                        >
                            Guardar seleccion
                        </Button>
                    )}

                    <Button
                        onClick={() =>
                            void commitConsent({
                                necessary: true,
                                analytics: false,
                                marketing: false,
                                accepted_at: new Date().toISOString(),
                                version: CONSENT_POLICY_VERSION,
                                source: 'cookie-banner',
                            })
                        }
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                    >
                        Solo esenciales
                    </Button>
                </div>
            </div>
        </div>
    )
}

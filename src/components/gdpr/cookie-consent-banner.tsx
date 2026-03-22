'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    CONSENT_CHANGE_EVENT,
    CONSENT_COOKIE_NAME,
    CONSENT_POLICY_VERSION,
    buildConsentCookieOptions,
    createStoredConsentState,
    parseConsentCookieFromDocumentCookie,
    serializeConsentCookie,
} from '@/lib/consent'
import { recordCookieConsent } from '@/actions/consent'

const COOKIE_CONSENT_KEY = CONSENT_COOKIE_NAME

type ConsentStatus = {
    necessary: boolean  // always true
    analytics: boolean
    marketing: boolean
    accepted_at?: string
    version?: string
    source?: string
}

function getStoredConsent(): ConsentStatus | null {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    const cookieConsent = parseConsentCookieFromDocumentCookie(document.cookie)

    try {
        if (stored) {
            const parsed = JSON.parse(stored) as ConsentStatus
            if (parsed.version === CONSENT_POLICY_VERSION) {
                return parsed
            }
        }
        if (cookieConsent) {
            if (cookieConsent.version !== CONSENT_POLICY_VERSION) {
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
    } catch {
        if (cookieConsent) {
            if (cookieConsent.version !== CONSENT_POLICY_VERSION) {
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
    }

    return null
}

const consentCookieOptions = buildConsentCookieOptions()

function setStoredConsent(consent: ConsentStatus) {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
    const cookieValue = serializeConsentCookie(
        createStoredConsentState({
            analytics: consent.analytics,
            marketing: consent.marketing,
            acceptedAt: consent.accepted_at,
            version: CONSENT_POLICY_VERSION,
            source: 'cookie-banner',
        })
    )
    document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; path=/; max-age=${consentCookieOptions.maxAge}; samesite=lax${consentCookieOptions.secure ? '; secure' : ''}`
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

    useEffect(() => {
        const stored = getStoredConsent()
        if (!stored) {
            // Small delay for UX
            const timer = setTimeout(() => setIsVisible(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAcceptAll = async () => {
        const consent: ConsentStatus = {
        necessary: true,
        analytics: true,
        marketing: true,
        accepted_at: new Date().toISOString(),
        version: CONSENT_POLICY_VERSION,
        source: 'cookie-banner',
    }
        setStoredConsent(consent)
        await saveConsentToDatabase(consent)
        setIsVisible(false)
    }

    const handleAcceptSelected = async () => {
        const consent: ConsentStatus = {
        necessary: true,
        analytics,
        marketing,
        accepted_at: new Date().toISOString(),
        version: CONSENT_POLICY_VERSION,
        source: 'cookie-banner',
    }
        setStoredConsent(consent)
        await saveConsentToDatabase(consent)
        setIsVisible(false)
    }

    const handleRejectAll = async () => {
        const consent: ConsentStatus = {
        necessary: true,
        analytics: false,
        marketing: false,
        accepted_at: new Date().toISOString(),
        version: CONSENT_POLICY_VERSION,
        source: 'cookie-banner',
    }
        setStoredConsent(consent)
        await saveConsentToDatabase(consent)
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6">
            <div className="mx-auto max-w-2xl rounded-xl border bg-card/95 backdrop-blur-md shadow-2xl p-5 sm:p-6">
                <div className="flex items-start gap-3 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5 flex-shrink-0">
                        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                        <path d="M8.5 8.5v.01" />
                        <path d="M16 15.5v.01" />
                        <path d="M12 12v.01" />
                        <path d="M11 17v.01" />
                        <path d="M7 14v.01" />
                    </svg>
                    <div>
                        <h3 className="font-semibold text-sm">Uso de Cookies</h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Utilizamos cookies esenciales para el funcionamiento de la plataforma.
                            Opcionalmente, utilizamos cookies analíticas y de marketing para mejorar
                            tu experiencia. Puedes aceptar todas, personalizar tu elección, o rechazar las opcionales.{' '}
                            <a href="/aviso-privacidad" className="text-primary hover:underline">Ver Aviso de Privacidad</a>.
                        </p>
                    </div>
                </div>

                {showDetails && (
                    <div className="mb-4 space-y-3 p-3 bg-muted/50 rounded-lg">
                        <label className="flex items-center gap-3 cursor-not-allowed opacity-70">
                            <input type="checkbox" checked disabled className="h-4 w-4 rounded border-input" />
                            <div>
                                <span className="text-xs font-medium">Esenciales</span>
                                <span className="text-xs text-muted-foreground ml-1">(siempre activas)</span>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={analytics}
                                onChange={(e) => setAnalytics(e.target.checked)}
                                className="h-4 w-4 rounded border-input accent-primary"
                            />
                            <div>
                                <span className="text-xs font-medium">Analíticas</span>
                                <span className="text-xs text-muted-foreground ml-1">— Nos ayudan a entender el uso</span>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={marketing}
                                onChange={(e) => setMarketing(e.target.checked)}
                                className="h-4 w-4 rounded border-input accent-primary"
                            />
                            <div>
                                <span className="text-xs font-medium">Marketing</span>
                                <span className="text-xs text-muted-foreground ml-1">— Comunicaciones personalizadas</span>
                            </div>
                        </label>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleAcceptAll} size="sm" className="flex-1">
                        Aceptar todas
                    </Button>
                    {!showDetails ? (
                        <Button onClick={() => setShowDetails(true)} variant="outline" size="sm" className="flex-1">
                            Personalizar
                        </Button>
                    ) : (
                        <Button onClick={handleAcceptSelected} variant="outline" size="sm" className="flex-1">
                            Guardar selección
                        </Button>
                    )}
                    <Button onClick={handleRejectAll} variant="ghost" size="sm" className="flex-1">
                        Solo esenciales
                    </Button>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { Download, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DISMISS_STORAGE_KEY = 'sapihum-install-prompt-dismissed-until'
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 24 * 7

type InstallMode = 'native' | 'ios'

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
    prompt(): Promise<void>
}

function isStandalone() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
    )
}

function getMobileInstallMode(): InstallMode | null {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const platform = window.navigator.platform.toLowerCase()
    const isAndroid = userAgent.includes('android')
    const isIos =
        /iphone|ipad|ipod/.test(userAgent) ||
        (platform === 'macintel' && window.navigator.maxTouchPoints > 1)

    if (isAndroid) return 'native'
    if (isIos) return 'ios'

    return null
}

function shouldSuppressPrompt() {
    const dismissedUntil = Number(window.localStorage.getItem(DISMISS_STORAGE_KEY) ?? 0)
    return Number.isFinite(dismissedUntil) && Date.now() < dismissedUntil
}

export function InstallAppPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [mode, setMode] = useState<InstallMode | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [showIosSteps, setShowIosSteps] = useState(false)

    useEffect(() => {
        if (isStandalone() || shouldSuppressPrompt()) return

        const mobileMode = getMobileInstallMode()
        if (!mobileMode) return

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault()
            const installPrompt = event as BeforeInstallPromptEvent
            setDeferredPrompt(installPrompt)
            setMode('native')
            setIsVisible(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        const iosTimer =
            mobileMode === 'ios'
                ? window.setTimeout(() => {
                    if (!isStandalone() && !shouldSuppressPrompt()) {
                        setMode('ios')
                        setIsVisible(true)
                    }
                }, 1600)
                : undefined

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

            if (iosTimer) {
                window.clearTimeout(iosTimer)
            }
        }
    }, [])

    if (!isVisible || !mode) return null

    const dismiss = () => {
        window.localStorage.setItem(
            DISMISS_STORAGE_KEY,
            String(Date.now() + DISMISS_DURATION_MS)
        )
        setIsVisible(false)
    }

    const install = async () => {
        if (mode === 'ios') {
            if (showIosSteps) {
                dismiss()
                return
            }

            setShowIosSteps(true)
            return
        }

        if (!deferredPrompt) return

        await deferredPrompt.prompt()
        await deferredPrompt.userChoice.catch(() => null)
        setDeferredPrompt(null)
        setIsVisible(false)
    }

    return (
        <div className="fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 md:hidden">
            <div
                className={cn(
                    'mx-auto max-w-md rounded-lg border border-border/90 bg-card/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl',
                    'animate-in fade-in-0 slide-in-from-bottom-2'
                )}
                role="dialog"
                aria-label="Instalar SAPIHUM"
            >
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                        <Smartphone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold leading-tight">Instalar SAPIHUM</p>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    Abre la plataforma desde el icono de tu pantalla de inicio.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={dismiss}
                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                                aria-label="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {showIosSteps ? (
                            <ol className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                                <li>1. Toca Compartir en Safari.</li>
                                <li>2. Elige Agregar a pantalla de inicio.</li>
                                <li>3. Confirma con Agregar.</li>
                            </ol>
                        ) : null}

                        <div className="mt-3 flex gap-2">
                            <Button type="button" size="sm" className="flex-1" onClick={() => void install()}>
                                <Download className="h-4 w-4" />
                                {mode === 'ios' ? (showIosSteps ? 'Listo' : 'Ver pasos') : 'Instalar'}
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
                                Ahora no
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// HIPAA standard is typically 15 minutes
const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutos
const WARNING_MS = 14 * 60 * 1000 // 1 minuto antes de expirar

export function SessionTimeout() {
    const router = useRouter()
    const supabase = createClient()
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
    const warningIdRef = useRef<NodeJS.Timeout | null>(null)

    const handleLogout = useCallback(async () => {
        try {
            await supabase.auth.signOut()
            sessionStorage.setItem('logout_reason', 'timeout')
            router.push('/auth/login?reason=timeout')
            router.refresh()
        } catch (error) {
            console.error('Error auto-logging out:', error)
        }
    }, [router, supabase])

    const startTimers = useCallback(() => {
        // Limpiar timers anteriores
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
        if (warningIdRef.current) clearTimeout(warningIdRef.current)

        // Configurar advertencia (opcional para el futuro, ej: un toast)
        warningIdRef.current = setTimeout(() => {
            console.warn('Sesión expirará en 1 minuto por inactividad')
            // TODO: Podríamos disparar un evento de UI aquí
        }, WARNING_MS)

        // Configurar cierre de sesión forzoso (HIPAA)
        timeoutIdRef.current = setTimeout(() => {
            handleLogout()
        }, TIMEOUT_MS)
    }, [handleLogout])

    useEffect(() => {
        // Iniciar timers en el montaje
        startTimers()

        // Eventos que reinician el timer
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
        
        const resetTimer = () => {
            startTimers()
        }

        events.forEach((event) => {
            window.addEventListener(event, resetTimer, { passive: true })
        })

        // Cleanup al desmontar
        return () => {
            if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
            if (warningIdRef.current) clearTimeout(warningIdRef.current)
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer)
            })
        }
    }, [startTimers])

    return null // Componente invisible
}

'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const SUPPORTED_EMAIL_OTP_TYPES = new Set<EmailOtpType>([
    'signup',
    'invite',
    'magiclink',
    'recovery',
    'email_change',
    'email',
])

function resolveCallbackNext(requestedNext: string | null, type: string | null) {
    if (requestedNext?.startsWith('/')) {
        return requestedNext === '/update-password' ? '/auth/update-password' : requestedNext
    }

    if (type === 'recovery') {
        return '/auth/update-password'
    }

    if (type === 'magiclink') {
        return '/mi-acceso'
    }

    return '/dashboard'
}

function isEmailOtpType(value: string | null): value is EmailOtpType {
    return value !== null && SUPPORTED_EMAIL_OTP_TYPES.has(value as EmailOtpType)
}

function AuthCallbackStatus() {
    const [supabase] = useState(() => createClient())
    const [message, setMessage] = useState('Validando tu acceso...')
    const router = useRouter()
    const searchParams = useSearchParams()

    const callbackState = useMemo(() => {
        const code = searchParams.get('code')
        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        const requestedNext = searchParams.get('next')

        return {
            code,
            tokenHash,
            type,
            next: resolveCallbackNext(requestedNext, type),
        }
    }, [searchParams])

    useEffect(() => {
        let cancelled = false

        async function waitForSession(timeoutMs: number) {
            const initialSessionResult = await supabase.auth.getSession()
            if (initialSessionResult.error) {
                throw initialSessionResult.error
            }

            if (initialSessionResult.data.session) {
                return initialSessionResult.data.session
            }

            return await new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>((resolve) => {
                const timer = window.setTimeout(() => {
                    subscription.unsubscribe()
                    resolve(null)
                }, timeoutMs)

                const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                    if (session) {
                        window.clearTimeout(timer)
                        subscription.unsubscribe()
                        resolve(session)
                    }
                })
            })
        }

        async function finishAuth() {
            try {
                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
                const hasHashSession =
                    hashParams.has('access_token') &&
                    hashParams.has('refresh_token')

                let callbackError: Error | null = null

                if (callbackState.code) {
                    setMessage('Intercambiando el código de acceso...')
                    const { error } = await supabase.auth.exchangeCodeForSession(callbackState.code)
                    callbackError = error
                } else if (callbackState.tokenHash && isEmailOtpType(callbackState.type)) {
                    setMessage('Confirmando tu correo...')
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash: callbackState.tokenHash,
                        type: callbackState.type,
                    })
                    callbackError = error
                } else if (!hasHashSession) {
                    throw new Error('Missing auth callback payload')
                }

                if (callbackError) {
                    throw callbackError
                }

                setMessage('Preparando tu sesión...')
                const session = await waitForSession(4000)

                if (!session) {
                    const {
                        data: { user },
                        error: userError,
                    } = await supabase.auth.getUser()

                    if (userError) {
                        throw userError
                    }

                    if (!user) {
                        throw new Error('Supabase did not return an authenticated user after callback processing')
                    }
                }

                setMessage('Finalizando tu acceso...')
                const postCallbackResponse = await fetch('/api/auth/post-callback', {
                    method: 'POST',
                    credentials: 'include',
                })

                if (!postCallbackResponse.ok) {
                    console.error('Post-auth callback processing returned a non-success response', {
                        status: postCallbackResponse.status,
                    })
                }

                if (!cancelled) {
                    router.replace(callbackState.next)
                    router.refresh()
                }
            } catch (error) {
                console.error('Auth callback failed', {
                    message: error instanceof Error ? error.message : String(error),
                    next: callbackState.next,
                    hasCode: Boolean(callbackState.code),
                    hasTokenHash: Boolean(callbackState.tokenHash),
                    type: callbackState.type,
                    hashKeys: Array.from(new URLSearchParams(window.location.hash.replace(/^#/, '')).keys()),
                })

                if (!cancelled) {
                    router.replace('/auth/login?error=auth_callback_error')
                }
            }
        }

        void finishAuth()

        return () => {
            cancelled = true
        }
    }, [callbackState.code, callbackState.next, callbackState.tokenHash, callbackState.type, router, supabase])

    return (
        <Card className="border-border/50 shadow-xl">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Validando acceso</CardTitle>
                <CardDescription>
                    {message}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                </div>
            </CardContent>
        </Card>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <Card className="border-border/50 shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Validando acceso</CardTitle>
                        <CardDescription>Preparando tu sesión...</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                        </div>
                    </CardContent>
                </Card>
            }
        >
            <AuthCallbackStatus />
        </Suspense>
    )
}

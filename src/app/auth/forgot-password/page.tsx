'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { buildAuthCallbackUrl } from '@/lib/config/app-url'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: buildAuthCallbackUrl({ type: 'recovery', nextPath: '/auth/update-password' }),
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)
    }

    if (success) {
        return (
            <Card className="border-border/50 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                            <svg
                                className="h-6 w-6 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Revisa tu correo</CardTitle>
                    <CardDescription>
                        Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
                        Revisa tu bandeja de entrada y sigue las instrucciones.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Link href="/auth/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            Volver al inicio de sesión
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="border-border/50 shadow-xl">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg
                            className="h-6 w-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                        </svg>
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Recuperar contraseña</CardTitle>
                <CardDescription>
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleReset}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                        ¿Recordaste tu contraseña?{' '}
                        <Link href="/auth/login" className="text-primary hover:underline font-medium">
                            Iniciar sesión
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}

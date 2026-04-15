'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buildAuthCallbackUrl } from '@/lib/config/app-url'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Loader2, Mail } from 'lucide-react'

export function RecoveryForm() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const next = searchParams.get('next')
    const nextPath = useMemo(() => (next?.startsWith('/') ? next : '/mi-acceso'), [next])

    useEffect(() => {
        const initialEmail = searchParams.get('email')
        if (initialEmail) {
            setEmail(initialEmail)
        }
    }, [searchParams])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const { error: signInError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: buildAuthCallbackUrl({ nextPath }),
            },
        })

        if (signInError) {
            setError(signInError.message)
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)
    }

    if (success) {
        return (
            <div className="space-y-4">
                <div className="rounded-xl border border-brand-brown/20 bg-brand-brown/10 p-4 text-sm text-brand-brown">
                    Enviamos un magic link a <strong>{email}</strong>. Ábrelo desde tu correo para entrar directo a tu acceso.
                </div>
                <Button asChild variant="outline" className="w-full">
                    <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`}>
                        Prefiero iniciar sesión con contraseña
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit} data-analytics-form="purchase_recovery" data-analytics-surface="purchase_recovery" data-analytics-funnel="checkout">
            <div className="space-y-2">
                <Label htmlFor="recovery-email">Correo de compra o registro</Label>
                <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="recovery-email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="tu@email.com"
                        className="pl-10"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Te enviaremos un enlace seguro para abrir tu hub privado o tu biblioteca de accesos.
                </p>
            </div>

            {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando enlace...
                    </>
                ) : (
                    <>
                        Enviar magic link
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes contraseña?{' '}
                <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="font-medium text-primary hover:underline">
                    Inicia sesión
                </Link>
            </p>
        </form>
    )
}

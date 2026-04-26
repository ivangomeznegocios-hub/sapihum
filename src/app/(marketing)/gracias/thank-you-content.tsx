'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

function getMembershipLabel(plan: string | null) {
    switch ((plan || '').toLowerCase()) {
        case 'pro':
            return 'Pro'
        case 'elite':
            return 'Elite'
        default:
            return 'Base'
    }
}

export function ThankYouContent() {
    const searchParams = useSearchParams()
    const membershipLabel = getMembershipLabel(searchParams.get('plan'))

    return (
        <div className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden bg-background">
            <div className="absolute inset-0 z-0">
                <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-yellow/5 blur-[100px] dark:bg-brand-yellow/10" />
            </div>

            <div className="z-10 w-full max-w-xl px-4 py-16 text-center">
                <div className="mx-auto mb-8 flex h-24 w-24 animate-in zoom-in items-center justify-center rounded-full bg-green-100 duration-500 dark:bg-green-900/30">
                    <svg className="h-12 w-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
                    Suscripcion confirmada
                </h1>

                <p className="mb-10 text-lg text-muted-foreground">
                    Tu membresia {membershipLabel} ya esta activa y tu acceso a SAPIHUM quedo habilitado.
                </p>

                <div className="mb-10 rounded-2xl border bg-card p-6 text-left shadow-sm">
                    <h3 className="mb-4 font-semibold text-foreground">En los proximos minutos:</h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-bold text-brand-yellow">1</span>
                            <div>
                                <p className="font-medium">Recibiras un email con tus accesos</p>
                                <p className="text-sm text-muted-foreground">Revisa tu bandeja de entrada o spam.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-bold text-brand-yellow">2</span>
                            <div>
                                <p className="font-medium">La comunidad te dara la bienvenida</p>
                                <p className="text-sm text-muted-foreground">Podras configurar tu perfil y empezar tu recorrido dentro de la plataforma.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <Link href="/dashboard">
                    <Button size="lg" className="h-14 w-full px-10 text-base font-bold sm:w-auto">
                        Configura tu perfil e ir al dashboard
                    </Button>
                </Link>

                <p className="mt-8 text-sm text-muted-foreground">
                    Tu conversion se registra en el sistema canonico de analitica y ya no depende de pushes legacy del navegador.
                </p>
            </div>
        </div>
    )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'SAPIHUM',
    description: 'Selecciona el area de SAPIHUM a la que quieres entrar.',
}

export default function EntryPage() {
    return (
        <main className="min-h-screen bg-brand-surface px-4 py-8 text-brand-text sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col">
                <header className="flex items-center justify-between">
                    <BrandWordmark className="text-base" />
                    <Link href="/auth/login">
                        <Button variant="outline" size="sm" className="font-semibold">
                            Iniciar sesion
                        </Button>
                    </Link>
                </header>

                <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-blue">
                        SAPIHUM
                    </p>
                    <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-brand-text-strong sm:text-5xl">
                        ¿A que area quieres entrar?
                    </h1>

                    <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
                        <Link href="/psicologia">
                            <Button size="lg" className="h-14 w-full gap-2 text-base font-bold">
                                Psicologia
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/ciencias-forenses">
                            <Button size="lg" variant="outline" className="h-14 w-full gap-2 text-base font-bold">
                                Ciencias Forenses
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { Menu, X } from 'lucide-react'

const NAV_ITEMS = [
    { label: 'Inicio', href: '/ciencias-forenses' },
    { label: 'Eventos', href: '/ciencias-forenses/eventos' },
    { label: 'Planes', href: '/ciencias-forenses/planes' },
]

export function ForensicNavbar() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-slate-950/95 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-slate-950/90 text-slate-200">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/ciencias-forenses" className="flex shrink-0 items-center" aria-label="SAPIHUM Ciencias Forenses">
                    <BrandWordmark className="text-sm sm:text-base lg:text-lg lg:tracking-[0.16em] text-white" />
                </Link>

                <nav className="hidden items-center gap-6 lg:flex">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-sm font-semibold text-slate-300 transition-colors hover:text-white"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Link href="/auth/login" className="hidden sm:inline-flex">
                        <Button variant="ghost" size="sm" className="font-semibold text-slate-300 hover:text-white hover:bg-slate-800">
                            Iniciar Sesión
                        </Button>
                    </Link>
                    <Link href="/auth/register?vertical=ciencias_forenses" className="hidden sm:inline-flex">
                        <Button size="sm" className="font-semibold bg-white text-slate-950 hover:bg-slate-200">
                            Comenzar
                        </Button>
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="lg:hidden text-slate-300 hover:text-white hover:bg-slate-800"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="lg:hidden absolute top-16 left-0 right-0 border-b border-slate-800 bg-slate-950 px-4 py-6 shadow-xl">
                    <nav className="flex flex-col gap-4">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="text-base font-semibold text-slate-300 hover:text-white p-2 rounded-md hover:bg-slate-900"
                                onClick={() => setIsOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-800">
                        <Link href="/auth/login" className="w-full" onClick={() => setIsOpen(false)}>
                            <Button variant="outline" className="w-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white">
                                Iniciar Sesión
                            </Button>
                        </Link>
                        <Link href="/auth/register?vertical=ciencias_forenses" className="w-full" onClick={() => setIsOpen(false)}>
                            <Button className="w-full bg-white text-slate-950 hover:bg-slate-200">
                                Crear cuenta
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    )
}

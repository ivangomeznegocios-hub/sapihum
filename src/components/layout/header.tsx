'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, CreditCard, Library, LogOut, Menu, Search, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { getMembershipLabel } from '@/lib/membership'
import { Sidebar } from './sidebar'
import type { UserRole } from '@/types/database'

export interface HeaderProps {
    user?: {
        email?: string
        user_metadata?: {
            full_name?: string
            avatar_url?: string
        }
    } | null
    userRole?: UserRole | null
    membershipLevel?: number
    membershipSpecializationCode?: string | null
}

export function Header({
    user,
    userRole,
    membershipLevel = 0,
    membershipSpecializationCode = null,
}: HeaderProps) {
    const router = useRouter()
    const supabase = createClient()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
        router.refresh()
    }

    const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'CP'
    const userName = user?.user_metadata?.full_name || user?.email || 'Usuario'

    const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        psychologist: 'Psicologo',
        patient: 'Paciente',
        ponente: 'Ponente',
    }

    return (
        <>
            <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-3 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:gap-x-4 sm:px-4 lg:px-8">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(true)}
                    aria-label="Abrir navegacion"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <div className="h-6 w-px bg-border lg:hidden" />

                <div className="flex min-w-0 flex-1 gap-x-4 self-stretch lg:gap-x-6">
                    <div className="relative hidden min-w-0 flex-1 items-center max-w-md sm:flex">
                        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar..."
                            className="h-9 border-0 bg-muted/50 pl-9 focus-visible:ring-1"
                        />
                    </div>

                    <div className="ml-auto flex shrink-0 items-center gap-x-2 sm:gap-x-3">
                        <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0">
                            <Bell className="h-4 w-4" />
                            <span className="sr-only">Ver notificaciones</span>
                            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                        </Button>

                        <div className="hidden lg:block lg:h-5 lg:w-px lg:bg-border" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={user?.user_metadata?.avatar_url}
                                            alt={userName}
                                        />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1.5">
                                        <p className="text-sm font-medium leading-none">{userName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                        <div className="flex items-center gap-2 pt-1">
                                            {userRole && (
                                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                                                    {roleLabels[userRole] ?? userRole}
                                                </span>
                                            )}
                                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                                {getMembershipLabel(membershipLevel)}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings" className="flex cursor-pointer items-center">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Mi perfil</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/mi-acceso" className="flex cursor-pointer items-center">
                                        <Library className="mr-2 h-4 w-4" />
                                        <span>Mis accesos</span>
                                    </Link>
                                </DropdownMenuItem>
                                {userRole !== 'patient' && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/subscription" className="flex cursor-pointer items-center">
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            <span>Suscripcion</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar sesion</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <DialogContent className="!left-auto !right-0 !top-0 !h-[100dvh] !w-[min(20rem,calc(100vw-0.75rem))] !max-w-[calc(100vw-0.75rem)] !translate-x-0 !translate-y-0 !overflow-hidden !rounded-none !border-0 !border-l !bg-sidebar !p-0 !shadow-2xl sm:!rounded-none data-[state=open]:!animate-none data-[state=closed]:!animate-none">
                    <DialogTitle className="sr-only">Navegacion del dashboard</DialogTitle>
                    <Sidebar
                        userRole={userRole}
                        membershipLevel={membershipLevel}
                        membershipSpecializationCode={membershipSpecializationCode}
                        isMobile
                        onNavigate={() => setIsMobileMenuOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}

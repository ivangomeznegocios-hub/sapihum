'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Palette, Sun, Moon, Monitor } from 'lucide-react'

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Apariencia
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setTheme('dark')}
                >
                    <Moon className="mr-2 h-4 w-4" />
                    Modo oscuro
                </Button>
                <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setTheme('light')}
                >
                    <Sun className="mr-2 h-4 w-4" />
                    Modo claro
                </Button>
                <Button
                    variant={theme === 'system' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setTheme('system')}
                >
                    <Monitor className="mr-2 h-4 w-4" />
                    Automático
                </Button>
            </CardContent>
        </Card>
    )
}

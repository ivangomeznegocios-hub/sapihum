'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronsUpDown, Layers2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { setActiveVertical } from '@/actions/verticals'
import type { Vertical, VerticalCode } from '@/types/database'

interface VerticalSwitcherProps {
    activeVertical: Vertical | null
    availableVerticals: Vertical[]
    compact?: boolean
}

export function VerticalSwitcher({
    activeVertical,
    availableVerticals,
    compact = false,
}: VerticalSwitcherProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    if (availableVerticals.length <= 1 && !activeVertical) return null

    const activeLabel = activeVertical?.name ?? 'Elegir area'

    const handleSelect = (code: VerticalCode) => {
        startTransition(async () => {
            const result = await setActiveVertical(code)
            if (result.success) {
                router.refresh()
            }
        })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size={compact ? 'sm' : 'default'}
                    className="min-w-0 max-w-[12rem] justify-between gap-2"
                    disabled={isPending || availableVerticals.length === 0}
                >
                    <Layers2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{activeLabel}</span>
                    {availableVerticals.length > 1 ? <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" /> : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Area activa</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableVerticals.map((vertical) => (
                    <DropdownMenuItem
                        key={vertical.code}
                        onClick={() => handleSelect(vertical.code)}
                        className="cursor-pointer"
                    >
                        <span className={vertical.code === activeVertical?.code ? 'font-semibold' : undefined}>
                            {vertical.name}
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar } from "lucide-react"
import { Event } from "@/types/database"
import { getGoogleCalendarUrl, getOutlookCalendarUrl, downloadIcsFile } from "@/lib/calendar-utils"

interface AddToCalendarButtonProps {
    event: Event
    variant?: "default" | "outline" | "secondary" | "ghost"
    size?: "default" | "sm" | "lg" | "icon"
    className?: string
}

export function AddToCalendarButton({ event, variant = "outline", size = "sm", className }: AddToCalendarButtonProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Agendar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(event), '_blank')}>
                    Google Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(getOutlookCalendarUrl(event), '_blank')}>
                    Outlook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadIcsFile(event)}>
                    Descargar .ICS (Apple/Otros)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

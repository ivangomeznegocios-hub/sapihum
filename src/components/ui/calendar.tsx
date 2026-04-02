"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                root: "w-full",
                months: "flex flex-col sm:flex-row gap-4",
                month: "space-y-4",
                month_caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "flex items-center gap-1",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                weeks: "space-y-1",
                week: "flex w-full mt-2",
                day: cn(
                    "group/day h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20"
                ),
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                selected:
                    "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground",
                today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
                outside: "text-muted-foreground opacity-50",
                disabled: "text-muted-foreground opacity-50",
                range_middle:
                    "[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:rounded-none",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }: { orientation?: string }) =>
                    orientation === 'left'
                        ? <ChevronLeft className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />,
            } as any}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }

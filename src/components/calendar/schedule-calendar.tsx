'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Clock, MapPin, Video } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ScheduleCalendarItem {
    id: string
    kind: 'appointment' | 'event' | 'external'
    title: string
    subtitle?: string | null
    startTime: string
    endTime: string
    status: string
    statusLabel: string
    href?: string | null
    modality?: 'online' | 'presencial' | 'hibrido' | null
    location?: string | null
    isAllDay?: boolean
    sourceLabel?: string | null
}

function startOfDay(value: Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function getDateKey(value: Date) {
    return [
        value.getFullYear(),
        String(value.getMonth() + 1).padStart(2, '0'),
        String(value.getDate()).padStart(2, '0'),
    ].join('-')
}

function getItemDateKey(value: string) {
    return getDateKey(new Date(value))
}

function getInitialSelectedDate(items: ScheduleCalendarItem[]) {
    const today = startOfDay(new Date())
    const todayKey = getDateKey(today)
    const sortedItems = [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    const todayItem = sortedItems.find((item) => getItemDateKey(item.startTime) === todayKey)

    if (todayItem) {
        return today
    }

    const upcomingItem = sortedItems.find((item) => new Date(item.endTime) >= today)
    if (upcomingItem) {
        return startOfDay(new Date(upcomingItem.startTime))
    }

    if (sortedItems.length > 0) {
        return startOfDay(new Date(sortedItems[0].startTime))
    }

    return today
}

function formatDayLabel(value: Date) {
    return value.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function formatShortDateLabel(value: string) {
    return new Intl.DateTimeFormat('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    }).format(new Date(value))
}

function formatTimeRange(startTime: string, endTime: string, isAllDay?: boolean) {
    if (isAllDay) {
        return 'Todo el dia'
    }

    const formatter = new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })

    return `${formatter.format(new Date(startTime))} - ${formatter.format(new Date(endTime))}`
}

function getStatusClasses(status: string) {
    switch (status) {
        case 'pending':
        case 'draft':
            return 'border-brand-yellow/30 bg-brand-yellow/12 text-brand-yellow'
        case 'confirmed':
        case 'upcoming':
            return 'border-brand-brown/30 bg-brand-brown/12 text-brand-brown'
        case 'live':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
        case 'completed':
            return 'border-border bg-muted text-muted-foreground'
        case 'cancelled':
            return 'border-red-500/30 bg-red-500/10 text-red-600'
        case 'busy':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-700'
        default:
            return 'border-border bg-muted text-muted-foreground'
    }
}

function getKindClasses(kind: ScheduleCalendarItem['kind']) {
    if (kind === 'appointment') {
        return 'border-primary/20 bg-primary/10 text-primary'
    }

    if (kind === 'external') {
        return 'border-sky-500/20 bg-sky-500/10 text-sky-700'
    }

    return 'border-brand-brown/20 bg-brand-brown/10 text-brand-brown'
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            {message}
        </div>
    )
}

function ScheduleItemCard({ item }: { item: ScheduleCalendarItem }) {
    return (
        <div className="rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/20">
            <div className="flex flex-wrap items-start gap-2">
                <span className={cn(
                    'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                    getKindClasses(item.kind)
                )}>
                    {item.kind === 'appointment' ? 'Cita' : item.kind === 'external' ? 'Google' : 'Evento'}
                </span>
                <span className={cn(
                    'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium',
                    getStatusClasses(item.status)
                )}>
                    {item.statusLabel}
                </span>
            </div>

            <div className="mt-3">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                {item.subtitle ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
                ) : null}
                {item.sourceLabel ? (
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
                        {item.sourceLabel}
                    </p>
                ) : null}
            </div>

            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeRange(item.startTime, item.endTime, item.isAllDay)}</span>
                </div>
                {item.modality === 'online' ? (
                    <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>Online</span>
                    </div>
                ) : null}
                {item.modality === 'presencial' && item.location ? (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{item.location}</span>
                    </div>
                ) : null}
                {item.modality === 'hibrido' ? (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{item.location || 'Hibrido'}</span>
                    </div>
                ) : null}
            </div>

            {item.href ? (
                <div className="mt-4">
                    <Button asChild size="sm" variant="outline">
                        <Link href={item.href}>
                            Ver detalle
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            ) : null}
        </div>
    )
}

export function ScheduleCalendar({
    items,
    title = 'Calendario',
    description = 'Revisa tu disponibilidad y los dias ocupados.',
}: {
    items: ScheduleCalendarItem[]
    title?: string
    description?: string
}) {
    const initialSelectedDate = getInitialSelectedDate(items)
    const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate)
    const [month, setMonth] = useState<Date>(initialSelectedDate)
    const today = startOfDay(new Date())

    const sortedItems = useMemo(
        () => [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
        [items]
    )

    const selectedKey = getDateKey(selectedDate)
    const selectedItems = sortedItems.filter((item) => getItemDateKey(item.startTime) === selectedKey)
    const upcomingItems = sortedItems.filter((item) => new Date(item.endTime) >= today).slice(0, 8)
    const busyDates = Array.from(new Set(sortedItems.map((item) => getItemDateKey(item.startTime)))).map((key) => {
        const [year, monthValue, day] = key.split('-').map(Number)
        return new Date(year, monthValue - 1, day)
    })

    const monthBusyDays = new Set(
        sortedItems
            .filter((item) => {
                const date = new Date(item.startTime)
                return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear()
            })
            .map((item) => getItemDateKey(item.startTime))
    ).size

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.92fr)]">
            <div className="space-y-6">
                <Card className="overflow-hidden border-border/80">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <CalendarDays className="h-5 w-5 text-primary" />
                                    {title}
                                </CardTitle>
                                <CardDescription className="mt-1 max-w-2xl">
                                    {description}
                                </CardDescription>
                            </div>
                            <div className="rounded-full border bg-background px-4 py-2 text-xs font-medium text-muted-foreground">
                                {monthBusyDays} dia{monthBusyDays === 1 ? '' : 's'} ocupado{monthBusyDays === 1 ? '' : 's'} este mes
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5 p-4 sm:p-6">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
                                <span className="h-2 w-2 rounded-full bg-primary" />
                                Dia con agenda
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
                                <span className="h-3 w-3 rounded-md border border-primary/30 bg-primary/10" />
                                Hoy
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
                                <span className="h-3 w-3 rounded-md bg-primary" />
                                Seleccionado
                            </span>
                        </div>

                        <div className="overflow-hidden rounded-3xl border bg-background/80 p-2 shadow-inner sm:p-4">
                            <Calendar
                                mode="single"
                                fixedWeeks
                                month={month}
                                selected={selectedDate}
                                onMonthChange={(date) => setMonth(startOfDay(date))}
                                onSelect={(date) => {
                                    if (date) {
                                        setSelectedDate(startOfDay(date))
                                    }
                                }}
                                modifiers={{ busy: busyDates }}
                                modifiersClassNames={{
                                    busy: 'after:absolute after:bottom-1.5 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary [&>button]:font-semibold',
                                }}
                                className="w-full max-w-none p-0"
                                classNames={{
                                    root: 'w-full [--rdp-day-width:100%] [--rdp-day-height:3.25rem] [--rdp-day_button-width:100%] [--rdp-day_button-height:3rem] sm:[--rdp-day-height:4rem] sm:[--rdp-day_button-height:3.75rem]',
                                    months: 'w-full',
                                    month: 'w-full space-y-3',
                                    month_caption: 'mb-2 flex items-center justify-between gap-3 px-1',
                                    caption_label: 'text-base font-semibold capitalize',
                                    nav: 'flex items-center gap-2',
                                    button_previous: 'static h-9 w-9 rounded-full border border-border bg-background p-0 text-foreground opacity-100 hover:bg-accent',
                                    button_next: 'static h-9 w-9 rounded-full border border-border bg-background p-0 text-foreground opacity-100 hover:bg-accent',
                                    month_grid: 'w-full table-fixed border-separate border-spacing-1 sm:border-spacing-2',
                                    weekdays: 'grid grid-cols-7 gap-1 sm:gap-2',
                                    weekday: 'flex h-9 items-center justify-center text-center text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80',
                                    weeks: 'space-y-1 sm:space-y-2',
                                    week: 'grid grid-cols-7 gap-1 sm:gap-2',
                                    day: 'relative h-12 w-full sm:h-14',
                                    day_button: 'flex h-12 w-full items-center justify-center rounded-2xl border border-transparent bg-transparent px-0 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground aria-selected:bg-primary aria-selected:text-primary-foreground sm:h-14',
                                    today: '[&>button]:border [&>button]:border-primary/30 [&>button]:bg-primary/10 [&>button]:text-foreground',
                                    outside: 'text-muted-foreground/30',
                                    disabled: 'opacity-35',
                                    hidden: 'invisible',
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/80">
                    <CardHeader className="border-b bg-muted/20">
                        <CardTitle className="text-base">Proximos en agenda</CardTitle>
                        <CardDescription>
                            Aqui puedes ver rapidamente todo lo que sigue, sin depender del dia seleccionado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4">
                        {upcomingItems.length === 0 ? (
                            <EmptyState message="Aun no tienes elementos proximos en la agenda." />
                        ) : (
                            upcomingItems.map((item) => {
                                const content = (
                                    <div className="flex items-start gap-3 rounded-2xl border bg-card p-3 transition-colors hover:bg-accent/20">
                                        <div className="flex min-w-[64px] flex-col items-center rounded-xl bg-muted/60 px-2 py-2 text-center">
                                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                                {formatShortDateLabel(item.startTime).split(' ')[0]}
                                            </span>
                                            <span className="mt-1 text-base font-semibold text-foreground">
                                                {new Date(item.startTime).getDate()}
                                            </span>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={cn(
                                                    'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                                    getKindClasses(item.kind)
                                                )}>
                                                    {item.kind === 'appointment' ? 'Cita' : item.kind === 'external' ? 'Google' : 'Evento'}
                                                </span>
                                                <span className={cn(
                                                    'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                                    getStatusClasses(item.status)
                                                )}>
                                                    {item.statusLabel}
                                                </span>
                                            </div>

                                            <p className="mt-2 truncate text-sm font-semibold text-foreground">
                                                {item.title}
                                            </p>
                                            {item.subtitle ? (
                                                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                                                    {item.subtitle}
                                                </p>
                                            ) : null}

                                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatTimeRange(item.startTime, item.endTime, item.isAllDay)}
                                                </span>
                                                {item.location ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {item.location}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                )

                                if (!item.href) {
                                    return <div key={item.id}>{content}</div>
                                }

                                return (
                                    <Link key={item.id} href={item.href} className="block">
                                        {content}
                                    </Link>
                                )
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="h-fit border-border/80 xl:sticky xl:top-6">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="text-base capitalize">
                        {formatDayLabel(selectedDate)}
                    </CardTitle>
                    <CardDescription>
                        {selectedItems.length === 0
                            ? 'No hay elementos en esta fecha.'
                            : `${selectedItems.length} elemento${selectedItems.length === 1 ? '' : 's'} en agenda`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                    {selectedItems.length === 0 ? (
                        <EmptyState message="Este dia queda libre por ahora." />
                    ) : (
                        selectedItems.map((item) => (
                            <ScheduleItemCard key={item.id} item={item} />
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

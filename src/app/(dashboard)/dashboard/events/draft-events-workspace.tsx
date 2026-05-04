'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
    AlertCircle,
    ArrowRight,
    CalendarDays,
    Clock,
    ListFilter,
    MapPin,
    Search,
    Table2,
} from 'lucide-react'
import { ScheduleCalendar, type ScheduleCalendarItem } from '@/components/calendar/schedule-calendar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DraftEventsWorkspaceItem extends ScheduleCalendarItem {
    speakerLabel: string
    categoryLabel: string | null
    subcategoryLabel: string | null
    missingDetails: string[]
}

function startOfDay(value: Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function startOfWeek(value: Date) {
    const date = startOfDay(value)
    const day = date.getDay()
    const offset = day === 0 ? -6 : 1 - day
    date.setDate(date.getDate() + offset)
    return date
}

function endOfWeek(value: Date) {
    const date = startOfWeek(value)
    date.setDate(date.getDate() + 6)
    date.setHours(23, 59, 59, 999)
    return date
}

function formatDate(value: string) {
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

function getBucketLabel(item: DraftEventsWorkspaceItem) {
    const today = startOfDay(new Date())
    const start = new Date(item.startTime)
    const currentWeekEnd = endOfWeek(today)
    const nextTwoWeeksEnd = new Date(today)
    nextTwoWeeksEnd.setDate(nextTwoWeeksEnd.getDate() + 14)
    nextTwoWeeksEnd.setHours(23, 59, 59, 999)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

    if (start < today) {
        return 'Fechas pasadas'
    }

    if (start <= currentWeekEnd) {
        return 'Esta semana'
    }

    if (start <= nextTwoWeeksEnd) {
        return 'Proximas 2 semanas'
    }

    if (start <= monthEnd) {
        return 'Este mes'
    }

    return 'Mas adelante'
}

function getModalityLabel(modality: DraftEventsWorkspaceItem['modality']) {
    switch (modality) {
        case 'presencial':
            return 'Presencial'
        case 'hibrido':
            return 'Hibrido'
        case 'online':
            return 'Online'
        default:
            return 'Sin modalidad'
    }
}

function EmptyPanel({ message }: { message: string }) {
    return (
        <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            {message}
        </div>
    )
}

function DraftQualityBadge({ item }: { item: DraftEventsWorkspaceItem }) {
    if (item.missingDetails.length === 0) {
        return (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                Listo para revisar
            </Badge>
        )
    }

    return (
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
            Faltan {item.missingDetails.length} dato{item.missingDetails.length === 1 ? '' : 's'}
        </Badge>
    )
}

function DraftListItem({ item }: { item: DraftEventsWorkspaceItem }) {
    return (
        <div className="grid gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/20 lg:grid-cols-[minmax(120px,0.24fr)_minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
                <p className="text-sm font-semibold capitalize text-foreground">{formatDate(item.startTime)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTimeRange(item.startTime, item.endTime, item.isAllDay)}
                </p>
            </div>

            <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Borrador</Badge>
                    <DraftQualityBadge item={item} />
                    {item.categoryLabel ? <Badge variant="outline">{item.categoryLabel}</Badge> : null}
                    {item.subcategoryLabel ? <Badge variant="outline">{item.subcategoryLabel}</Badge> : null}
                </div>
                <div>
                    <p className="line-clamp-1 font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{item.speakerLabel}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{getModalityLabel(item.modality)}</span>
                    {item.location ? (
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.location}
                        </span>
                    ) : null}
                    {item.missingDetails.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {item.missingDetails.join(', ')}
                        </span>
                    ) : null}
                </div>
            </div>

            {item.href ? (
                <Button asChild variant="outline" size="sm" className="w-full justify-center lg:w-auto">
                    <Link href={item.href}>
                        Editar
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            ) : null}
        </div>
    )
}

export function DraftEventsWorkspace({ items }: { items: DraftEventsWorkspaceItem[] }) {
    const [search, setSearch] = useState('')
    const [speakerFilter, setSpeakerFilter] = useState('all')
    const [modalityFilter, setModalityFilter] = useState('all')
    const [qualityFilter, setQualityFilter] = useState('all')

    const speakerOptions = useMemo(
        () => Array.from(new Set(items.map((item) => item.speakerLabel))).sort((a, b) => a.localeCompare(b)),
        [items]
    )

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase()

        return items.filter((item) => {
            if (query) {
                const haystack = [
                    item.title,
                    item.subtitle,
                    item.speakerLabel,
                    item.categoryLabel,
                    item.subcategoryLabel,
                    item.location,
                ].filter(Boolean).join(' ').toLowerCase()

                if (!haystack.includes(query)) {
                    return false
                }
            }

            if (speakerFilter !== 'all' && item.speakerLabel !== speakerFilter) {
                return false
            }

            if (modalityFilter !== 'all' && item.modality !== modalityFilter) {
                return false
            }

            if (qualityFilter === 'complete' && item.missingDetails.length > 0) {
                return false
            }

            if (qualityFilter === 'incomplete' && item.missingDetails.length === 0) {
                return false
            }

            return true
        })
    }, [items, modalityFilter, qualityFilter, search, speakerFilter])

    const groupedItems = useMemo(() => {
        const groups = new Map<string, DraftEventsWorkspaceItem[]>()

        for (const item of filteredItems) {
            const label = getBucketLabel(item)
            groups.set(label, [...(groups.get(label) ?? []), item])
        }

        return Array.from(groups.entries()).map(([label, groupItems]) => ({
            label,
            items: groupItems.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
        }))
    }, [filteredItems])

    const incompleteCount = items.filter((item) => item.missingDetails.length > 0).length
    const thisWeekCount = items.filter((item) => getBucketLabel(item) === 'Esta semana').length

    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <h2 className="flex min-w-0 items-center gap-2 text-2xl font-bold tracking-tight">
                        <span className="flex items-center justify-center rounded-xl bg-primary/10 p-2 text-primary">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        Agenda de borradores
                    </h2>
                    <p className="text-sm text-muted-foreground lg:ml-12">
                        Revisa, filtra y abre los eventos pendientes de publicar sin perder contexto por fecha.
                    </p>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-2xl font-semibold">{items.length}</p>
                        <p className="text-sm text-muted-foreground">Borradores totales</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-2xl font-semibold">{thisWeekCount}</p>
                        <p className="text-sm text-muted-foreground">Esta semana</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <p className="text-2xl font-semibold">{incompleteCount}</p>
                        <p className="text-sm text-muted-foreground">Con datos pendientes</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/80">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ListFilter className="h-4 w-4 text-primary" />
                        Filtros
                    </CardTitle>
                    <CardDescription>
                        Usa la tabla para operar muchos eventos y la agenda para detectar saturacion por fecha.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(160px,0.8fr)_minmax(150px,0.7fr)_minmax(160px,0.8fr)]">
                    <div className="relative min-w-0">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por titulo, ponente o categoria"
                            className="pl-9"
                        />
                    </div>

                    <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Ponente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los ponentes</SelectItem>
                            {speakerOptions.map((speaker) => (
                                <SelectItem key={speaker} value={speaker}>{speaker}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={modalityFilter} onValueChange={setModalityFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Modalidad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="presencial">Presencial</SelectItem>
                            <SelectItem value="hibrido">Hibrido</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={qualityFilter} onValueChange={setQualityFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Calidad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="incomplete">Con pendientes</SelectItem>
                            <SelectItem value="complete">Listos</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Tabs defaultValue="agenda" className="space-y-4">
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl p-1 sm:w-fit">
                    <TabsTrigger value="agenda" className="gap-2">
                        <ListFilter className="h-4 w-4" />
                        Agenda
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Calendario
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-2">
                        <Table2 className="h-4 w-4" />
                        Tabla
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="agenda" className="space-y-4">
                    {groupedItems.length === 0 ? (
                        <EmptyPanel message="No hay borradores con esos filtros." />
                    ) : (
                        groupedItems.map((group) => (
                            <div key={group.label} className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        {group.label}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {group.items.length} evento{group.items.length === 1 ? '' : 's'}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {group.items.map((item) => (
                                        <DraftListItem key={item.id} item={item} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="calendar">
                    <ScheduleCalendar
                        items={filteredItems}
                        title="Calendario de borradores"
                        description="Selecciona un dia para ver los borradores programados y abrir el detalle del evento."
                    />
                </TabsContent>

                <TabsContent value="table">
                    <Card className="border-border/80">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="text-base">Tabla operativa</CardTitle>
                            <CardDescription>
                                Vista compacta para revisar muchos borradores con menos desplazamiento.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredItems.length === 0 ? (
                                <div className="p-4">
                                    <EmptyPanel message="No hay borradores con esos filtros." />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Evento</TableHead>
                                            <TableHead>Ponente</TableHead>
                                            <TableHead>Modalidad</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Accion</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="whitespace-nowrap align-top">
                                                    <div className="font-medium capitalize">{formatDate(item.startTime)}</div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        {formatTimeRange(item.startTime, item.endTime, item.isAllDay)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="min-w-[240px] align-top">
                                                    <div className="font-medium">{item.title}</div>
                                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                                        {item.categoryLabel ? <Badge variant="outline">{item.categoryLabel}</Badge> : null}
                                                        {item.subcategoryLabel ? <Badge variant="outline">{item.subcategoryLabel}</Badge> : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top text-sm text-muted-foreground">
                                                    {item.speakerLabel}
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <span className={cn(
                                                        'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                                                        item.modality === 'presencial'
                                                            ? 'border-sky-500/20 bg-sky-500/10 text-sky-700'
                                                            : 'border-primary/20 bg-primary/10 text-primary'
                                                    )}>
                                                        {getModalityLabel(item.modality)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <div className="space-y-1.5">
                                                        <DraftQualityBadge item={item} />
                                                        {item.missingDetails.length > 0 ? (
                                                            <div className="max-w-[240px] text-xs text-muted-foreground">
                                                                {item.missingDetails.join(', ')}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right align-top">
                                                    {item.href ? (
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link href={item.href}>Editar</Link>
                                                        </Button>
                                                    ) : null}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </section>
    )
}

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getPublicEventPath } from '@/lib/events/public'

function formatEventDate(date: string) {
    const d = new Date(date)
    return {
        day: d.toLocaleDateString('es-MX', { day: 'numeric' }),
        month: d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''),
        year: d.toLocaleDateString('es-MX', { year: 'numeric' }),
        time: d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }),
    }
}

function getTypeMeta(event: any) {
    if (event.event_type === 'course') {
        return { label: 'Curso', color: 'bg-violet-500/90 text-white' }
    }
    if (event.event_type === 'on_demand' || (event.status === 'completed' && event.recording_url)) {
        return { label: 'Grabación', color: 'bg-amber-500/90 text-white' }
    }
    if (event.status === 'live') {
        return { label: 'En Vivo', color: 'bg-red-500/90 text-white animate-pulse' }
    }
    return { label: 'Evento', color: 'bg-teal-600/90 text-white' }
}

export function PublicCatalogCard({ event }: { event: any }) {
    const publicPath = getPublicEventPath(event)
    const price = Number(event.price || 0)
    const priceLabel = price > 0 ? `$${price.toFixed(0)} MXN` : 'Gratis'
    const typeMeta = getTypeMeta(event)
    const dateInfo = formatEventDate(event.start_time)
    const speakerName = event.speakers?.[0]?.speaker?.profile?.full_name
    const speakerAvatar = event.speakers?.[0]?.speaker?.profile?.avatar_url
    const isFree = price === 0
    const memberFree = event.member_access_type === 'free' && price > 0

    return (
        <Link
            href={publicPath}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1 hover:border-teal-500/30"
        >
            {/* Image Section */}
            <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900/40">
                {event.image_url ? (
                    <img
                        src={event.image_url}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                <line x1="16" x2="16" y1="2" y2="6" />
                                <line x1="8" x2="8" y1="2" y2="6" />
                                <line x1="3" x2="21" y1="10" y2="10" />
                                <path d="m9 16 2 2 4-4" />
                            </svg>
                        </div>
                    </div>
                )}
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Type Badge */}
                <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${typeMeta.color}`}>
                        {typeMeta.label}
                    </span>
                    {event.hero_badge && (
                        <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white">
                            {event.hero_badge}
                        </span>
                    )}
                </div>

                {/* Member badge */}
                {memberFree && (
                    <div className="absolute right-3 top-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                            Incluido
                        </span>
                    </div>
                )}

                {/* Date badge - bottom left on image */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <span className="text-xs font-semibold text-slate-800">{dateInfo.day} {dateInfo.month}</span>
                        <span className="text-[10px] text-slate-500">{dateInfo.time}</span>
                    </div>
                </div>

                {/* Attendee count - bottom right */}
                {(event.attendee_count || 0) > 0 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1.5 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="text-[11px] font-medium text-slate-600">{event.attendee_count}</span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-5">
                {/* Speaker */}
                {speakerName && (
                    <div className="mb-2.5 flex items-center gap-2">
                        {speakerAvatar ? (
                            <img src={speakerAvatar} alt={speakerName} className="h-5 w-5 rounded-full object-cover ring-1 ring-border" />
                        ) : (
                            <div className="h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center text-[9px] font-bold text-teal-700">
                                {speakerName.charAt(0)}
                            </div>
                        )}
                        <span className="text-xs font-medium text-muted-foreground">{speakerName}</span>
                    </div>
                )}

                {/* Title */}
                <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-teal-600">
                    {event.title}
                </h3>

                {/* Subtitle */}
                {event.subtitle && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                        {event.subtitle}
                    </p>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Footer: Price + CTA */}
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                    <div>
                        {isFree ? (
                            <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Gratis
                            </span>
                        ) : (
                            <span className="text-lg font-bold text-foreground">{priceLabel}</span>
                        )}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors group-hover:bg-teal-600 group-hover:text-white dark:bg-teal-950 dark:text-teal-300 dark:group-hover:bg-teal-600 dark:group-hover:text-white">
                        Ver detalles
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </span>
                </div>
            </div>
        </Link>
    )
}

import { notFound } from 'next/navigation'
import { getAppUrl } from '@/lib/config/app-url'
import { getPublicEventPath } from '@/lib/events/public'
import { getSpecializationByCode } from '@/lib/specializations'

function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(dateStr))
}

export function PublicEventEmbed({ event }: { event: any }) {
    if (!event || !event.is_embeddable) {
        notFound()
    }

    const isFree = Number(event.price || 0) === 0
    const isPast = event.status === 'completed'
    const specialization = getSpecializationByCode(event.specialization_code)
    const baseUrl = getAppUrl()
    const eventUrl = `${baseUrl}${getPublicEventPath(event)}`

    return (
        <html lang="es">
            <body>
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: transparent;
                        padding: 12px;
                    }
                    .card {
                        width: min(100%, 400px);
                        border: 1px solid #e5e7eb;
                        border-radius: 16px;
                        overflow: hidden;
                        background: white;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                        transition: transform 0.2s, box-shadow 0.2s;
                        margin: 0 auto;
                    }
                    .card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px -5px rgba(0,0,0,0.15);
                    }
                    .image-container {
                        position: relative;
                        aspect-ratio: 16/9;
                        background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
                    }
                    .image-container img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .status-badge {
                        position: absolute;
                        top: 12px;
                        left: 12px;
                        padding: 4px 10px;
                        border-radius: 20px;
                        font-size: 11px;
                        font-weight: 600;
                        color: white;
                        background: ${isPast ? '#6b7280' : event.status === 'live' ? '#22c55e' : '#6366f1'};
                    }
                    .content { padding: 16px; }
                    .title {
                        font-size: 16px;
                        font-weight: 700;
                        color: #111827;
                        line-height: 1.3;
                        margin-bottom: 8px;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    .meta {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 13px;
                        color: #6b7280;
                        margin-bottom: 12px;
                        min-width: 0;
                    }
                    .price-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 12px;
                        margin-bottom: 12px;
                    }
                    .price { font-size: 18px; font-weight: 700; color: ${isFree ? '#22c55e' : '#6366f1'}; }
                    .member-price { font-size: 11px; color: #22c55e; font-weight: 500; }
                    .btn {
                        display: block;
                        width: 100%;
                        padding: 10px;
                        text-align: center;
                        background: #6366f1;
                        color: white;
                        text-decoration: none;
                        border-radius: 10px;
                        font-weight: 600;
                        font-size: 14px;
                        transition: background 0.2s;
                    }
                    .btn:hover { background: #4f46e5; }
                    .powered { text-align: center; padding: 8px; font-size: 10px; color: #9ca3af; }
                    @media (max-width: 420px) {
                        body { padding: 8px; }
                        .content { padding: 14px; }
                        .title { font-size: 15px; }
                        .price-row { flex-direction: column; }
                    }
                `,
                    }}
                />
                <div className="card">
                    <div className="image-container">
                        {event.image_url && (
                            <div
                                role="img"
                                aria-label={event.title}
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url("${event.image_url}")` }}
                            />
                        )}
                        <div className="status-badge">
                            {isPast ? 'Finalizado' : event.status === 'live' ? 'En Vivo' : 'Próximo'}
                        </div>
                    </div>
                    <div className="content">
                        <div className="title">{event.title}</div>
                        <div className="meta">Fecha: {formatDate(event.start_time)}</div>
                        <div className="price-row">
                            <div>
                                <div className="price">{isFree ? 'Gratis' : `$${Number(event.price || 0).toFixed(2)} MXN`}</div>
                                {specialization && !isFree && (
                                    <>
                                        <div className="member-price">Incluido en {specialization.name} Nivel 2+</div>
                                        {event.member_access_type === 'discounted' && (
                                            <div className="member-price">Otros miembros: ${Number(event.member_price || 0).toFixed(2)} MXN</div>
                                        )}
                                        {event.member_access_type === 'free' && (
                                            <div className="member-price">Otros miembros: gratis</div>
                                        )}
                                    </>
                                )}
                                {!specialization && event.member_access_type === 'free' && !isFree && (
                                    <div className="member-price">Gratis para miembros</div>
                                )}
                                {!specialization && event.member_access_type === 'discounted' && (
                                    <div className="member-price">Miembros: ${Number(event.member_price || 0).toFixed(2)} MXN</div>
                                )}
                            </div>
                            <div className="meta" style={{ marginBottom: 0 }}>
                                Accesos: {event.attendee_count || 0}
                            </div>
                        </div>
                        {!isPast && (
                            <a href={eventUrl} target="_blank" rel="noopener noreferrer" className="btn">
                                Ver en SAPIHUM →
                            </a>
                        )}
                    </div>
                    <div className="powered">SAPIHUM</div>
                </div>
            </body>
        </html>
    )
}

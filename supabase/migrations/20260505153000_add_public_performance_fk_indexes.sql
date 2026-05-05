create index if not exists idx_analytics_events_visitor_id
    on public.analytics_events (visitor_id);

create index if not exists idx_attribution_touches_session_id
    on public.attribution_touches (session_id);

create index if not exists idx_event_purchases_analytics_session_id
    on public.event_purchases (analytics_session_id);

create index if not exists idx_events_created_by
    on public.events (created_by);

create index if not exists idx_events_prerequisite_event_id
    on public.events (prerequisite_event_id);

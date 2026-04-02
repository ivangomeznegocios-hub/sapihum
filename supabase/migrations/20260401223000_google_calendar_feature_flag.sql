INSERT INTO public.platform_settings (key, value, description)
VALUES (
    'enable_google_calendar_sync',
    'false'::jsonb,
    'When true, psychologists and speakers can connect Google Calendar and use external busy blocks inside the platform.'
)
ON CONFLICT (key) DO NOTHING;
